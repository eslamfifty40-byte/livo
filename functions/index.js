/**
 * LIVO Firebase Cloud Functions
 * Production server-side authority for RBAC, Atomic UID, and Financial Operations
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const OWNER_EMAILS = ['livo.admin@gmail.com', 'eslamfifty11@gmail.com'];

function isOwnerCaller(context) {
  if (!context || !context.auth) return false;
  const email = (context.auth.token && context.auth.token.email ? String(context.auth.token.email) : '').toLowerCase();
  const isVerifiedOwnerEmail = Boolean(context.auth.token && context.auth.token.email_verified && OWNER_EMAILS.includes(email));
  return isVerifiedOwnerEmail || context.auth.token.role === 'owner' || context.auth.token.isOwner === true;
}

async function isOwnerOrActiveSupervisor(context) {
  if (isOwnerCaller(context)) return true;
  if (!context || !context.auth) return false;
  if (context.auth.token.role === 'supervisor') return true;
  const uidDoc = await db.collection('staff_auth').doc(context.auth.uid).get();
  if (uidDoc.exists && uidDoc.data() && uidDoc.data().isActive === true) return true;
  const email = (context.auth.token && context.auth.token.email ? String(context.auth.token.email) : '').toLowerCase();
  if (email && context.auth.token.email_verified) {
    const emailDoc = await db.collection('staff_auth').doc(email).get();
    if (emailDoc.exists && emailDoc.data() && emailDoc.data().isActive === true) return true;
  }
  return false;
}

function assertAppCheckIfPresent(context) {
  if (process.env.ENFORCE_APP_CHECK === 'true' && !context.app) {
    throw new functions.https.HttpsError('failed-precondition', 'التحقق الأمني للتطبيق (App Check) مطلوب');
  }
}

/**
 * 1. Automatic Role Assignment on User Signup
 * Enforces that new accounts strictly get 'user' role with 0 coins.
 * Only verified platform owner emails get 'owner' custom claims.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const emailLower = (user.email || '').toLowerCase();
  const isOwner = Boolean(user.emailVerified && OWNER_EMAILS.includes(emailLower));
  const role = isOwner ? 'owner' : 'user';

  // Set Custom Claims on Firebase Auth Token
  await admin.auth().setCustomUserClaims(user.uid, {
    role,
    isOwner
  });

  // Generate atomic unique 5-digit UID
  let uniqueUid = '';
  let isUnique = false;
  
  while (!isUnique) {
    const candidate = String(Math.floor(10000 + Math.random() * 90000));
    const snapshot = await db.collection('users').where('uid', '==', candidate).limit(1).get();
    if (snapshot.empty) {
      uniqueUid = candidate;
      isUnique = true;
    }
  }

  // Create user profile document in Firestore
  await db.collection('users').doc(user.uid).set({
    uid: uniqueUid,
    authUid: user.uid,
    email: user.email || '',
    displayName: user.displayName || `مستخدم ${uniqueUid}`,
    avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${uniqueUid}`,
    role,
    coins: 0, // STRICT: ZERO free coins upon registration
    isVerified: false,
    followingCount: 0,
    followersCount: 0,
    isBanned: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`User created: ${user.uid} with unique UID: ${uniqueUid} and role: ${role}`);
});

/**
 * 2. Atomic Recharge Request Approval with Idempotency
 * Server-only callable function
 */
exports.approveRechargeOrder = functions.https.onCall(async (data, context) => {
  assertAppCheckIfPresent(context);
  if (!(await isOwnerOrActiveSupervisor(context))) {
    throw new functions.https.HttpsError('permission-denied', 'صلاحيات غير كافية لتنفيذ الشحن');
  }

  const { requestId } = data || {};
  if (!requestId || typeof requestId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'رقم الطلب مطلوب');
  }

  const requestRef = db.collection('recharge_requests').doc(requestId);
  const actorEmail = (context.auth.token && context.auth.token.email) || OWNER_EMAILS[0];

  return db.runTransaction(async (transaction) => {
    const reqDoc = await transaction.get(requestRef);
    if (!reqDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'طلب الشحن غير موجود');
    }

    const order = reqDoc.data();
    if (order.status !== 'pending') {
      throw new functions.https.HttpsError('already-exists', 'هذا الطلب تمت معالجته مسبقاً');
    }

    const userQuery = await transaction.get(db.collection('users').where('uid', '==', order.uid).limit(1));
    if (userQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'المستخدم غير موجود');
    }

    const userDocRef = userQuery.docs[0].ref;
    const userData = userQuery.docs[0].data();

    const balanceBefore = userData.coins || 0;
    const balanceAfter = balanceBefore + order.packageCoins;

    transaction.update(userDocRef, {
      coins: balanceAfter,
      eligibleRechargedCoins: (userData.eligibleRechargedCoins || 0) + order.packageCoins
    });

    transaction.update(requestRef, {
      status: 'approved',
      reviewedBy: actorEmail,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      balanceBefore,
      balanceAfter
    });

    const auditRef = db.collection('coin_audits').doc();
    transaction.set(auditRef, {
      uid: order.uid,
      username: order.username || '',
      actionType: 'recharge_request',
      coinsChange: order.packageCoins,
      balanceBefore,
      balanceAfter,
      reason: `موافقة إدارية على طلب شحن رقم ${order.orderNumber || requestId}`,
      performedBy: actorEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      balanceBefore,
      balanceAfter,
      message: `تم إضافة ${order.packageCoins} كوينز بنجاح`
    };
  });
});

/**
 * 3. Manual Coins Management (Add / Deduct / Set) - Owner & Active Supervisors Only
 */
exports.manualCoinAdjustment = functions.https.onCall(async (data, context) => {
  assertAppCheckIfPresent(context);
  if (!(await isOwnerOrActiveSupervisor(context))) {
    throw new functions.https.HttpsError('permission-denied', 'غير مصرح لك بتعديل الأرصدة');
  }

  const { targetUid, actionType, amount, reason } = data || {};
  if (!targetUid || !reason || typeof amount !== 'number' || amount < 0 || !Number.isFinite(amount)) {
    throw new functions.https.HttpsError('invalid-argument', 'البيانات غير مكتملة');
  }

  const actorEmail = (context.auth.token && context.auth.token.email) || OWNER_EMAILS[0];

  return db.runTransaction(async (transaction) => {
    const userQuery = await transaction.get(db.collection('users').where('uid', '==', targetUid).limit(1));
    if (userQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'المستخدم غير موجود');
    }

    const userDocRef = userQuery.docs[0].ref;
    const userData = userQuery.docs[0].data();

    const balanceBefore = userData.coins || 0;
    let balanceAfter = balanceBefore;
    let coinsChange = 0;

    if (actionType === 'add') {
      balanceAfter = balanceBefore + amount;
      coinsChange = amount;
    } else if (actionType === 'deduct') {
      if (balanceBefore < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'رصيد المستخدم غير كافٍ للخصم');
      }
      balanceAfter = balanceBefore - amount;
      coinsChange = -amount;
    } else if (actionType === 'set') {
      balanceAfter = amount;
      coinsChange = amount - balanceBefore;
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'نوع العملية غير مدعوم');
    }

    transaction.update(userDocRef, { coins: balanceAfter });

    const auditRef = db.collection('coin_audits').doc();
    transaction.set(auditRef, {
      uid: targetUid,
      username: userData.username || '',
      actionType: `admin_${actionType}`,
      coinsChange,
      balanceBefore,
      balanceAfter,
      reason: String(reason).slice(0, 500),
      performedBy: actorEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, balanceBefore, balanceAfter };
  });
});

/**
 * 4. Atomic Recharge Voucher Code Redemption with Per-User Idempotency
 */
exports.redeemRechargeCode = functions.https.onCall(async (data, context) => {
  assertAppCheckIfPresent(context);
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول أولاً');
  }

  const rawCode = data && typeof data.code === 'string' ? data.code.trim().toUpperCase() : '';
  if (!rawCode || rawCode.length > 64) {
    throw new functions.https.HttpsError('invalid-argument', 'كود الشحن غير صالح');
  }

  return db.runTransaction(async (transaction) => {
    const codeQuery = await transaction.get(db.collection('recharge_codes').where('code', '==', rawCode).limit(1));
    if (codeQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'كود الشحن غير موجود');
    }

    const codeDoc = codeQuery.docs[0];
    const codeData = codeDoc.data();
    const userQuery = await transaction.get(db.collection('users').where('authUid', '==', context.auth.uid).limit(1));
    if (userQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'حساب المستخدم غير موجود');
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const usedBy = Array.isArray(codeData.usedByUids) ? codeData.usedByUids : [];

    if (codeData.status !== 'active' || (codeData.usedCount || 0) >= (codeData.maxUses || 1)) {
      throw new functions.https.HttpsError('failed-precondition', 'هذا الكود منتهي الصلاحية أو مستنفد');
    }
    if (usedBy.includes(userData.uid)) {
      throw new functions.https.HttpsError('already-exists', 'لقد استخدمت هذا الكود مسبقاً');
    }

    const nextUsedCount = (codeData.usedCount || 0) + 1;
    const nextStatus = nextUsedCount >= (codeData.maxUses || 1) ? 'used' : 'active';
    const balanceBefore = userData.coins || 0;
    const balanceAfter = balanceBefore + (codeData.coins || 0);

    transaction.update(codeDoc.ref, {
      usedCount: nextUsedCount,
      usedByUids: admin.firestore.FieldValue.arrayUnion(userData.uid),
      status: nextStatus,
      usedAt: new Date().toISOString()
    });

    transaction.update(userDoc.ref, {
      coins: balanceAfter,
      eligibleRechargedCoins: (userData.eligibleRechargedCoins || 0) + (codeData.coins || 0)
    });

    const auditRef = db.collection('coin_audits').doc();
    transaction.set(auditRef, {
      uid: userData.uid,
      username: userData.username || '',
      actionType: 'recharge_code',
      coinsChange: codeData.coins,
      balanceBefore,
      balanceAfter,
      reason: `شحن فوري عبر الكود ${rawCode}`,
      performedBy: userData.displayName || userData.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, coinsAwarded: codeData.coins, balanceAfter };
  });
});

/**
 * 5. Atomic Charging Agent Transfer with Idempotency Key
 */
exports.transferCoinsFromAgent = functions.https.onCall(async (data, context) => {
  assertAppCheckIfPresent(context);
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'يجب تسجيل الدخول أولاً');
  }

  const { targetUid, coinsAmount, idempotencyKey } = data || {};
  if (!targetUid || typeof coinsAmount !== 'number' || coinsAmount <= 0 || !Number.isFinite(coinsAmount)) {
    throw new functions.https.HttpsError('invalid-argument', 'بيانات التحويل غير صالحة');
  }
  const transferDocId = idempotencyKey && typeof idempotencyKey === 'string'
    ? idempotencyKey.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
    : `TRF-${context.auth.uid}-${Date.now()}`;

  return db.runTransaction(async (transaction) => {
    const transferRef = db.collection('agent_transfers').doc(transferDocId);
    const existingTransfer = await transaction.get(transferRef);
    if (existingTransfer.exists) {
      throw new functions.https.HttpsError('already-exists', 'تم تنفيذ عملية التحويل هذه مسبقاً');
    }

    const agentQuery = await transaction.get(db.collection('users').where('authUid', '==', context.auth.uid).limit(1));
    if (agentQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'حساب الوكيل غير موجود');
    }

    const agentDoc = agentQuery.docs[0];
    const agent = agentDoc.data();
    const canCharge = agent.canChargeUsers === true || agent.role === 'charging_agent' || agent.role === 'owner';
    if (!canCharge) {
      throw new functions.https.HttpsError('permission-denied', 'ليس لديك صلاحية وكيل شحن');
    }

    const available = agent.agentBalance !== undefined ? agent.agentBalance : (agent.coins || 0);
    if (available < coinsAmount) {
      throw new functions.https.HttpsError('failed-precondition', 'رصيد الوكالة غير كافٍ');
    }

    const targetQuery = await transaction.get(db.collection('users').where('uid', '==', targetUid).limit(1));
    if (targetQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'المستخدم المستهدف غير موجود');
    }

    const targetDoc = targetQuery.docs[0];
    const target = targetDoc.data();
    if (target.uid === agent.uid) {
      throw new functions.https.HttpsError('invalid-argument', 'لا يمكن التحويل لنفس الحساب');
    }

    const newAgentBalance = available - coinsAmount;
    const newTargetCoins = (target.coins || 0) + coinsAmount;

    transaction.update(agentDoc.ref, {
      agentBalance: newAgentBalance,
      coins: (agent.coins || 0) >= coinsAmount ? (agent.coins || 0) - coinsAmount : (agent.coins || 0)
    });
    transaction.update(targetDoc.ref, { coins: newTargetCoins });
    transaction.set(transferRef, {
      id: transferDocId,
      agentUid: agent.uid,
      agentName: agent.displayName || agent.username || '',
      targetUid: target.uid,
      targetName: target.displayName || target.username || '',
      coinsAmount,
      agentBalanceBefore: available,
      agentBalanceAfter: newAgentBalance,
      createdAt: new Date().toISOString()
    });

    return { success: true, newAgentBalance, newTargetCoins };
  });
});

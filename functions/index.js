/**
 * LIVO Firebase Cloud Functions
 * Production server-side authority for RBAC, Atomic UID, and Financial Operations
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const OWNER_EMAIL = 'livo.admin@gmail.com';

/**
 * 1. Automatic Role Assignment on User Signup
 * Enforces that new accounts strictly get 'user' role with 0 coins.
 * Only livo.admin@gmail.com is granted 'owner' custom claims.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const isOwner = user.email && user.email.toLowerCase() === OWNER_EMAIL;
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
  // Check that caller is Owner or Supervisor
  if (!context.auth || (context.auth.token.role !== 'owner' && context.auth.token.email !== OWNER_EMAIL)) {
    throw new functions.https.HttpsError('permission-denied', 'صلاحيات غير كافية لتنفيذ الشحن');
  }

  const { requestId } = data;
  if (!requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'رقم الطلب مطلوب');
  }

  const requestRef = db.collection('recharge_requests').doc(requestId);

  return db.runTransaction(async (transaction) => {
    const reqDoc = await transaction.get(requestRef);
    if (!reqDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'طلب الشحن غير موجود');
    }

    const order = reqDoc.data();
    if (order.status !== 'pending') {
      throw new functions.https.HttpsError('already-exists', 'هذا الطلب تمت معالجته مسبقاً');
    }

    // Locate user by UID
    const userQuery = await db.collection('users').where('uid', '==', order.uid).limit(1).get();
    if (userQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'المستخدم غير موجود');
    }

    const userDocRef = userQuery.docs[0].ref;
    const userData = userQuery.docs[0].data();

    const balanceBefore = userData.coins || 0;
    const balanceAfter = balanceBefore + order.packageCoins;

    // 1. Credit coins to user
    transaction.update(userDocRef, { coins: balanceAfter });

    // 2. Mark order as approved
    transaction.update(requestRef, {
      status: 'approved',
      reviewedBy: context.auth.token.email || OWNER_EMAIL,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      balanceBefore,
      balanceAfter
    });

    // 3. Insert audit record
    const auditRef = db.collection('coin_audits').doc();
    transaction.set(auditRef, {
      uid: order.uid,
      username: order.username,
      actionType: 'recharge_request',
      coinsChange: order.packageCoins,
      balanceBefore,
      balanceAfter,
      reason: `موافقة إدارية على طلب شحن رقم ${order.orderNumber}`,
      performedBy: context.auth.token.email || OWNER_EMAIL,
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
 * 3. Manual Coins Management (Add / Deduct / Set)
 */
exports.manualCoinAdjustment = functions.https.onCall(async (data, context) => {
  if (!context.auth || (context.auth.token.role !== 'owner' && context.auth.token.email !== OWNER_EMAIL)) {
    throw new functions.https.HttpsError('permission-denied', 'غير مصرح لك بتعديل الأرصدة');
  }

  const { targetUid, actionType, amount, reason } = data;
  if (!targetUid || !reason || amount < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'البيانات غير مكتملة');
  }

  return db.runTransaction(async (transaction) => {
    const userQuery = await db.collection('users').where('uid', '==', targetUid).limit(1).get();
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
    }

    transaction.update(userDocRef, { coins: balanceAfter });

    const auditRef = db.collection('coin_audits').doc();
    transaction.set(auditRef, {
      uid: targetUid,
      username: userData.username,
      actionType: `admin_${actionType}`,
      coinsChange,
      balanceBefore,
      balanceAfter,
      reason,
      performedBy: context.auth.token.email || OWNER_EMAIL,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, balanceBefore, balanceAfter };
  });
});

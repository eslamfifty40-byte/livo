/**
 * LIVO 1-on-1 Real-Time WebRTC Voice Call Manager
 * Uses Firestore room_rtc_signals (roomId = 'direct_call') for peer discovery,
 * ring/accept/decline/hangup state sync, and bidirectional WebRTC audio streams.
 */

import { RoomRtcSignal } from '../types';
import { firebaseService } from './firebase';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export type DirectCallStatus = 'idle' | 'ringing_out' | 'ringing_in' | 'connecting' | 'connected' | 'ended';

export interface DirectCallSnapshot {
  status: DirectCallStatus;
  peerUid: string;
  peerName: string;
  peerAvatar: string;
  mode: 'audio' | 'video';
  isMuted: boolean;
  connectedAt?: number;
  error?: string;
}

class DirectCallAudioManager {
  private currentUid = '';
  private currentName = '';
  private currentAvatar = '';
  private peerUid = '';
  private peerName = '';
  private peerAvatar = '';
  private mode: 'audio' | 'video' = 'audio';
  private status: DirectCallStatus = 'idle';
  private isMuted = false;
  private connectedAt?: number;
  private errorMsg?: string;

  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private signalUnsub: (() => void) | null = null;
  private processedSignalIds = new Set<string>();
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private listeners = new Set<(snap: DirectCallSnapshot) => void>();
  private ringToneTimer: number | null = null;

  public subscribe(listener: (snap: DirectCallSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  public getSnapshot(): DirectCallSnapshot {
    return {
      status: this.status,
      peerUid: this.peerUid,
      peerName: this.peerName,
      peerAvatar: this.peerAvatar,
      mode: this.mode,
      isMuted: this.isMuted,
      connectedAt: this.connectedAt,
      error: this.errorMsg
    };
  }

  private emit() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  public bindUser(uid: string, displayName: string, avatar: string) {
    if (!uid) return;
    if (this.currentUid === uid && this.signalUnsub) {
      this.currentName = displayName;
      this.currentAvatar = avatar;
      return;
    }
    this.unbindUser();
    this.currentUid = uid;
    this.currentName = displayName;
    this.currentAvatar = avatar;
    this.signalUnsub = firebaseService.subscribeToDirectCallSignals(uid, (signals) => {
      void this.handleIncomingSignals(signals);
    });
  }

  public unbindUser() {
    if (this.signalUnsub) {
      this.signalUnsub();
      this.signalUnsub = null;
    }
    this.currentUid = '';
    this.processedSignalIds.clear();
  }

  private playTonePulse() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(520, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 450);
    } catch {
      // Audio context blocked before gesture
    }
  }

  private startRingtone() {
    this.stopRingtone();
    if (typeof window === 'undefined') return;
    this.playTonePulse();
    this.ringToneTimer = window.setInterval(() => this.playTonePulse(), 2200);
  }

  private stopRingtone() {
    if (this.ringToneTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.ringToneTimer);
      this.ringToneTimer = null;
    }
  }

  private async ensureMicrophone(): Promise<MediaStream | null> {
    if (this.localStream) return this.localStream;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.errorMsg = 'المتصفح أو الجهاز لا يدعم المكالمات الصوتية المباشرة';
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !this.isMuted;
      });
      this.localStream = stream;
      return stream;
    } catch {
      this.errorMsg = 'يرجى السماح بصلاحية الميكروفون لإجراء المكالمة الصوتية';
      return null;
    }
  }

  private createPeerConnection(targetUid: string): RTCPeerConnection {
    if (this.pc) {
      try {
        this.pc.close();
      } catch {}
    }
    const pc = new RTCPeerConnection(RTC_CONFIG);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate && this.currentUid) {
        void this.sendSignal(targetUid, {
          type: 'candidate',
          candidate: {
            candidate: ev.candidate.candidate,
            sdpMid: ev.candidate.sdpMid,
            sdpMLineIndex: ev.candidate.sdpMLineIndex
          }
        });
      }
    };

    pc.ontrack = (ev) => {
      const stream = ev.streams[0] || new MediaStream([ev.track]);
      if (typeof document !== 'undefined') {
        if (!this.remoteAudio) {
          this.remoteAudio = document.createElement('audio');
          this.remoteAudio.autoplay = true;
          this.remoteAudio.setAttribute('playsinline', 'true');
        }
        this.remoteAudio.srcObject = stream;
        this.remoteAudio.play().catch(() => {});
      }
      this.stopRingtone();
      this.status = 'connected';
      this.connectedAt = this.connectedAt || Date.now();
      this.emit();
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        this.stopRingtone();
        this.status = 'connected';
        this.connectedAt = this.connectedAt || Date.now();
        this.emit();
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        if (this.status !== 'idle' && this.status !== 'ended') {
          this.cleanupCallState();
        }
      }
    };

    this.pc = pc;
    return pc;
  }

  private async sendSignal(
    toUid: string,
    payload: Omit<RoomRtcSignal, 'id' | 'roomId' | 'fromUid' | 'toUid' | 'createdAt'>
  ) {
    if (!this.currentUid || !toUid) return;
    const signal: RoomRtcSignal = {
      id: `dcall-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      roomId: 'direct_call',
      fromUid: this.currentUid,
      fromAuthUid: firebaseService.getCurrentAuthUid(),
      toUid,
      ...payload,
      createdAt: new Date().toISOString()
    };
    await firebaseService.saveRoomRtcSignal(signal);
  }

  public async startCall(target: { uid: string; name: string; avatar: string }, mode: 'audio' | 'video' = 'audio') {
    if (!this.currentUid) return;
    this.errorMsg = undefined;
    this.peerUid = target.uid;
    this.peerName = target.name;
    this.peerAvatar = target.avatar;
    this.mode = mode;
    this.isMuted = false;
    this.connectedAt = undefined;
    this.status = 'ringing_out';
    this.emit();

    const stream = await this.ensureMicrophone();
    if (!stream) {
      this.emit();
      return;
    }

    this.startRingtone();
    await this.sendSignal(target.uid, {
      type: 'ring',
      callMode: mode,
      callerName: this.currentName,
      callerAvatar: this.currentAvatar
    });
  }

  public async acceptIncomingCall() {
    if (this.status !== 'ringing_in' || !this.peerUid) return;
    this.stopRingtone();
    this.status = 'connecting';
    this.errorMsg = undefined;
    this.emit();

    const stream = await this.ensureMicrophone();
    if (!stream) {
      await this.declineIncomingCall();
      return;
    }

    await this.sendSignal(this.peerUid, {
      type: 'accept',
      callMode: this.mode,
      callerName: this.currentName,
      callerAvatar: this.currentAvatar
    });
  }

  public async declineIncomingCall() {
    const target = this.peerUid;
    this.cleanupCallState();
    if (target) {
      await this.sendSignal(target, { type: 'decline' });
    }
  }

  public async hangup() {
    const target = this.peerUid;
    this.cleanupCallState();
    if (target) {
      await this.sendSignal(target, { type: 'hangup' });
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => {
        t.enabled = !this.isMuted;
      });
    }
    this.emit();
    return this.isMuted;
  }

  private cleanupCallState() {
    this.stopRingtone();
    if (this.pc) {
      try {
        this.pc.close();
      } catch {}
      this.pc = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio.srcObject = null;
    }
    this.pendingCandidates = [];
    this.status = 'idle';
    this.peerUid = '';
    this.peerName = '';
    this.peerAvatar = '';
    this.connectedAt = undefined;
    this.isMuted = false;
    this.emit();
  }

  private async handleIncomingSignals(signals: RoomRtcSignal[]) {
    const now = Date.now();
    for (const sig of signals) {
      if (this.processedSignalIds.has(sig.id)) continue;
      this.processedSignalIds.add(sig.id);
      void firebaseService.deleteRoomRtcSignal(sig.id);

      const ageMs = now - new Date(sig.createdAt).getTime();
      if (!Number.isNaN(ageMs) && ageMs > 90_000) continue;

      if (sig.type === 'ring') {
        if (this.status !== 'idle') {
          void this.sendSignal(sig.fromUid, { type: 'decline' });
          continue;
        }
        this.peerUid = sig.fromUid;
        this.peerName = sig.callerName || `عضو ${sig.fromUid}`;
        this.peerAvatar = sig.callerAvatar || '/assets/livo/customer_icon.jpg';
        this.mode = sig.callMode || 'audio';
        this.status = 'ringing_in';
        this.errorMsg = undefined;
        this.startRingtone();
        this.emit();
      } else if (sig.type === 'accept' && sig.fromUid === this.peerUid) {
        this.stopRingtone();
        this.status = 'connecting';
        this.emit();
        await this.ensureMicrophone();
        const pc = this.createPeerConnection(sig.fromUid);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await this.sendSignal(sig.fromUid, {
          type: 'offer',
          sdp: offer.sdp,
          sdpType: 'offer'
        });
      } else if ((sig.type === 'decline' || sig.type === 'hangup') && sig.fromUid === this.peerUid) {
        const wasOutgoing = this.status === 'ringing_out';
        this.cleanupCallState();
        if (wasOutgoing && sig.type === 'decline') {
          this.errorMsg = 'المستخدم مشغول أو رفض المكالمة';
          this.emit();
        }
      } else if (sig.type === 'offer' && sig.sdp && sig.fromUid === this.peerUid) {
        await this.ensureMicrophone();
        const pc = this.createPeerConnection(sig.fromUid);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: sig.sdp }));
        for (const c of this.pendingCandidates) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        this.pendingCandidates = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await this.sendSignal(sig.fromUid, {
          type: 'answer',
          sdp: answer.sdp,
          sdpType: 'answer'
        });
      } else if (sig.type === 'answer' && sig.sdp && sig.fromUid === this.peerUid && this.pc) {
        await this.pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sig.sdp }));
        for (const c of this.pendingCandidates) {
          await this.pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        this.pendingCandidates = [];
        this.stopRingtone();
        this.status = 'connected';
        this.connectedAt = this.connectedAt || Date.now();
        this.emit();
      } else if (sig.type === 'candidate' && sig.candidate && sig.fromUid === this.peerUid) {
        if (this.pc && this.pc.remoteDescription) {
          await this.pc.addIceCandidate(new RTCIceCandidate(sig.candidate)).catch(() => {});
        } else {
          this.pendingCandidates.push(sig.candidate);
        }
      }
    }
  }
}

export const directCallAudio = new DirectCallAudioManager();

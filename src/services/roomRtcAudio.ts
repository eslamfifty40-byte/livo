/**
 * Real-time Multi-Peer WebRTC Audio Mesh Engine for LIVO Voice Rooms
 * Uses Firestore signaling (`room_rtc_signals`) + public STUN servers
 * Streams live microphone audio to all room peers and monitors speaking volume.
 */

import { firebaseService } from './firebase';
import { RoomRtcSignal } from '../types';

const RTC_ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface PeerState {
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
  audioEl: HTMLAudioElement;
  pendingCandidates: RTCIceCandidateInit[];
  makingOffer: boolean;
  ignoreOffer: boolean;
  lastOfferSentAt: number;
}

export class RoomRtcAudioManager {
  private roomId: string | null = null;
  private myUid: string | null = null;
  private localStream: MediaStream | null = null;
  private peers = new Map<string, PeerState>();
  private processedSignalIds = new Set<string>();
  private unsubSignals: (() => void) | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private speakingInterval: number | null = null;
  private onSpeakingChange?: (speakingUids: Record<string, boolean>) => void;
  private onMicError?: (message: string) => void;
  private isMicActive = false;
  private speakingMap: Record<string, boolean> = {};
  private remoteAnalysers = new Map<string, { analyser: AnalyserNode; source: MediaStreamAudioSourceNode }>();
  private audioContainer: HTMLDivElement | null = null;

  public start(options: {
    roomId: string;
    myUid: string;
    onSpeakingChange?: (speakingUids: Record<string, boolean>) => void;
    onMicError?: (message: string) => void;
  }) {
    if (this.roomId === options.roomId && this.myUid === options.myUid) {
      this.onSpeakingChange = options.onSpeakingChange;
      this.onMicError = options.onMicError;
      return;
    }

    this.stop();
    this.roomId = options.roomId;
    this.myUid = options.myUid;
    this.onSpeakingChange = options.onSpeakingChange;
    this.onMicError = options.onMicError;
    this.processedSignalIds.clear();

    if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.style.display = 'none';
      container.setAttribute('data-livo-rtc-audio', options.roomId);
      document.body.appendChild(container);
      this.audioContainer = container;
    }

    // Subscribe to incoming WebRTC signals addressed to me in this room
    this.unsubSignals = firebaseService.subscribeToRoomRtcSignals(
      options.roomId,
      options.myUid,
      (signals) => {
        for (const sig of signals) {
          if (this.processedSignalIds.has(sig.id)) continue;
          this.processedSignalIds.add(sig.id);
          // Skip stale signals older than 90s
          const age = Date.now() - new Date(sig.createdAt).getTime();
          if (Number.isFinite(age) && age > 90_000) {
            firebaseService.deleteRoomRtcSignal(sig.id).catch(() => {});
            continue;
          }
          this.handleSignal(sig).catch((err) => {
            console.warn('RTC handleSignal error:', err);
          });
          // Clean up consumed candidate / transient signaling doc cleanly after a short delay
          if (sig.type === 'candidate' || sig.type === 'presence') {
            setTimeout(() => {
              firebaseService.deleteRoomRtcSignal(sig.id).catch(() => {});
            }, 4000);
          }
        }
      }
    );

    // Announce presence so existing seated/listening peers connect cleanly
    this.broadcastPresence();

    // Poll speaking energy every 220ms
    if (typeof window !== 'undefined') {
      this.speakingInterval = window.setInterval(() => {
        this.sampleSpeakingLevels();
      }, 220);
    }
  }

  public async setMicEnabled(shouldSpeak: boolean): Promise<boolean> {
    if (!shouldSpeak) {
      this.isMicActive = false;
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }
      if (this.myUid) {
        this.speakingMap[this.myUid] = false;
        this.onSpeakingChange?.({ ...this.speakingMap });
      }
      return true;
    }

    try {
      if (!this.localStream) {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          this.onMicError?.('المتصفح لا يدعم تشغيل المايكروفون المباشر');
          return false;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        this.localStream = stream;
        this.attachLocalStreamToPeers(stream);
        this.setupLocalAnalyser(stream);
      }

      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      this.isMicActive = true;

      if (this.audioCtx?.state === 'suspended') {
        await this.audioCtx.resume().catch(() => {});
      }
      return true;
    } catch (err: any) {
      console.warn('Microphone access error:', err);
      this.isMicActive = false;
      this.onMicError?.(
        err?.name === 'NotAllowedError'
          ? 'يرجى السماح بصلاحية المايكروفون في المتصفح للتحدث في الغرفة'
          : 'تعذر الوصول للمايكروفون — تحقق من إعدادات الصوت'
      );
      return false;
    }
  }

  public syncPeers(peerUids: string[]) {
    if (!this.roomId || !this.myUid) return;
    const validPeers = new Set(peerUids.filter((u) => u && u !== this.myUid));

    // Disconnect peers who left
    for (const [uid] of this.peers.entries()) {
      if (!validPeers.has(uid)) {
        this.closePeer(uid);
      }
    }

    // Ensure connections with all current peers
    for (const peerUid of validPeers) {
      if (!this.peers.has(peerUid)) {
        const peer = this.createPeer(peerUid);
        // Deterministic polite/impolite initiation: lexicographically smaller UID initiates offer
        if (this.myUid < peerUid) {
          this.initiateOffer(peerUid, peer).catch(() => {});
        }
      }
    }
  }

  public stop() {
    if (this.unsubSignals) {
      this.unsubSignals();
      this.unsubSignals = null;
    }
    if (this.speakingInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.speakingInterval);
      this.speakingInterval = null;
    }
    for (const uid of Array.from(this.peers.keys())) {
      this.closePeer(uid);
    }
    this.remoteAnalysers.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.analyser = null;
    }
    if (this.audioContainer && this.audioContainer.parentNode) {
      this.audioContainer.parentNode.removeChild(this.audioContainer);
      this.audioContainer = null;
    }
    this.speakingMap = {};
    this.isMicActive = false;
    this.roomId = null;
    this.myUid = null;
  }

  private broadcastPresence() {
    // No-op beyond syncPeers; kept lightweight to avoid extra Firestore writes
  }

  private createPeer(peerUid: string): PeerState {
    const pc = new RTCPeerConnection(RTC_ICE_SERVERS);
    const remoteStream = new MediaStream();
    const audioEl = typeof document !== 'undefined' ? document.createElement('audio') : ({} as HTMLAudioElement);
    if (typeof document !== 'undefined') {
      audioEl.autoplay = true;
      audioEl.setAttribute('playsinline', 'true');
      audioEl.volume = 1;
      audioEl.srcObject = remoteStream;
      this.audioContainer?.appendChild(audioEl);
    }

    const state: PeerState = {
      pc,
      remoteStream,
      audioEl,
      pendingCandidates: [],
      makingOffer: false,
      ignoreOffer: false,
      lastOfferSentAt: 0,
    };
    this.peers.set(peerUid, state);

    // Always add local tracks or a recvonly audio transceiver so listener peers receive audio
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    } else {
      try {
        pc.addTransceiver('audio', { direction: 'recvonly' });
      } catch {
        // ignore if unsupported
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && this.roomId && this.myUid) {
        this.sendSignal(peerUid, 'candidate', {
          candidate: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        });
      }
    };

    pc.ontrack = (event) => {
      const incoming = event.streams?.[0] || new MediaStream([event.track]);
      incoming.getAudioTracks().forEach((track) => {
        if (!remoteStream.getAudioTracks().some((t) => t.id === track.id)) {
          remoteStream.addTrack(track);
        }
      });
      if (typeof document !== 'undefined') {
        audioEl.srcObject = remoteStream;
        audioEl.play().catch(() => {});
      }
      this.setupRemoteAnalyser(peerUid, remoteStream);
    };

    pc.onnegotiationneeded = () => {
      if (!this.myUid || this.myUid >= peerUid) return;
      if (Date.now() - state.lastOfferSentAt < 800) return;
      this.initiateOffer(peerUid, state).catch(() => {});
    };

    return state;
  }

  private attachLocalStreamToPeers(stream: MediaStream) {
    for (const [peerUid, peer] of this.peers.entries()) {
      const senders = peer.pc.getSenders();
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) continue;
      const existingAudioSender = senders.find((s) => s.track?.kind === 'audio' || !s.track);
      if (existingAudioSender) {
        existingAudioSender.replaceTrack(audioTrack).catch(() => {});
      } else {
        peer.pc.addTrack(audioTrack, stream);
      }
      this.initiateOffer(peerUid, peer).catch(() => {});
    }
  }

  private async initiateOffer(peerUid: string, peer: PeerState) {
    if (!this.roomId || !this.myUid) return;
    try {
      peer.makingOffer = true;
      peer.lastOfferSentAt = Date.now();
      const offer = await peer.pc.createOffer({ offerToReceiveAudio: true });
      if (peer.pc.signalingState !== 'stable') return;
      await peer.pc.setLocalDescription(offer);
      await this.sendSignal(peerUid, 'offer', {
        sdp: peer.pc.localDescription?.sdp,
        sdpType: 'offer',
      });
    } finally {
      peer.makingOffer = false;
    }
  }

  private async handleSignal(sig: RoomRtcSignal) {
    if (!this.roomId || !this.myUid || sig.fromUid === this.myUid) return;
    let peer = this.peers.get(sig.fromUid);
    if (!peer) {
      peer = this.createPeer(sig.fromUid);
    }

    const polite = this.myUid > sig.fromUid;

    if (sig.type === 'offer' && sig.sdp) {
      const offerCollision = peer.makingOffer || peer.pc.signalingState !== 'stable';
      peer.ignoreOffer = !polite && offerCollision;
      if (peer.ignoreOffer) return;

      await peer.pc.setRemoteDescription({ type: 'offer', sdp: sig.sdp });
      for (const cand of peer.pendingCandidates) {
        await peer.pc.addIceCandidate(cand).catch(() => {});
      }
      peer.pendingCandidates = [];

      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      await this.sendSignal(sig.fromUid, 'answer', {
        sdp: peer.pc.localDescription?.sdp,
        sdpType: 'answer',
      });
      await firebaseService.deleteRoomRtcSignal(sig.id).catch(() => {});
    } else if (sig.type === 'answer' && sig.sdp) {
      if (peer.pc.signalingState === 'have-local-offer') {
        await peer.pc.setRemoteDescription({ type: 'answer', sdp: sig.sdp });
        for (const cand of peer.pendingCandidates) {
          await peer.pc.addIceCandidate(cand).catch(() => {});
        }
        peer.pendingCandidates = [];
      }
      await firebaseService.deleteRoomRtcSignal(sig.id).catch(() => {});
    } else if (sig.type === 'candidate' && sig.candidate?.candidate) {
      const ice = sig.candidate as RTCIceCandidateInit;
      if (peer.pc.remoteDescription) {
        await peer.pc.addIceCandidate(ice).catch(() => {});
      } else {
        peer.pendingCandidates.push(ice);
      }
    }
  }

  private async sendSignal(
    toUid: string,
    type: RoomRtcSignal['type'],
    extra: Partial<RoomRtcSignal>
  ) {
    if (!this.roomId || !this.myUid) return;
    const cleanRoom = this.roomId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const id = `sig_${cleanRoom}_${this.myUid}_${toUid}_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`.slice(0, 120);
    await firebaseService.saveRoomRtcSignal({
      id,
      roomId: this.roomId,
      fromUid: this.myUid,
      fromAuthUid: firebaseService.getCurrentAuthUid(),
      toUid,
      type,
      ...extra,
      createdAt: new Date().toISOString(),
    });
  }

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        this.audioCtx = new Ctx();
      }
    }
    return this.audioCtx;
  }

  private setupLocalAnalyser(stream: MediaStream) {
    const ctx = this.ensureAudioContext();
    if (!ctx) return;
    try {
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      this.analyser = analyser;
    } catch {
      // ignore audio context errors
    }
  }

  private setupRemoteAnalyser(peerUid: string, stream: MediaStream) {
    const ctx = this.ensureAudioContext();
    if (!ctx || this.remoteAnalysers.has(peerUid)) return;
    try {
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      this.remoteAnalysers.set(peerUid, { analyser, source });
    } catch {
      // ignore audio context errors
    }
  }

  private sampleSpeakingLevels() {
    if (!this.onSpeakingChange) return;
    const next: Record<string, boolean> = {};
    let changed = false;

    if (this.myUid && this.analyser && this.isMicActive) {
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, v) => sum + v, 0) / Math.max(1, data.length);
      next[this.myUid] = avg > 14;
    } else if (this.myUid) {
      next[this.myUid] = false;
    }

    for (const [peerUid, entry] of this.remoteAnalysers.entries()) {
      const data = new Uint8Array(entry.analyser.frequencyBinCount);
      entry.analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, v) => sum + v, 0) / Math.max(1, data.length);
      next[peerUid] = avg > 12;
    }

    for (const key of new Set([...Object.keys(next), ...Object.keys(this.speakingMap)])) {
      if (Boolean(next[key]) !== Boolean(this.speakingMap[key])) {
        changed = true;
        break;
      }
    }
    if (changed) {
      this.speakingMap = next;
      this.onSpeakingChange({ ...next });
    }
  }

  private closePeer(uid: string) {
    const peer = this.peers.get(uid);
    if (!peer) return;
    try {
      peer.pc.close();
      peer.audioEl.srcObject = null;
      peer.audioEl.remove?.();
    } catch {
      // ignore cleanup errors
    }
    this.remoteAnalysers.delete(uid);
    this.peers.delete(uid);
  }
}

export const roomRtcAudio = new RoomRtcAudioManager();

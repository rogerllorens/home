'use client';

export interface RtcOptions {
  iceServers?: RTCIceServer[];
}

export interface NegotiationCallbacks {
  onLocalDescription?: (desc: RTCSessionDescriptionInit) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
}

export function createPeerConnection(options: RtcOptions = {}, callbacks: NegotiationCallbacks = {}) {
  const config: RTCConfiguration = {
    iceServers: options.iceServers ?? [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: process.env.NEXT_PUBLIC_TURN_URL ? [process.env.NEXT_PUBLIC_TURN_URL] : [],
        username: process.env.NEXT_PUBLIC_TURN_USER,
        credential: process.env.NEXT_PUBLIC_TURN_PASS
      }
    ]
  };

  const pc = new RTCPeerConnection(config);

  pc.onicecandidate = (event) => {
    if (event.candidate && callbacks.onIceCandidate) {
      callbacks.onIceCandidate(event.candidate);
    }
  };

  pc.onnegotiationneeded = async () => {
    if (!callbacks.onLocalDescription) return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    callbacks.onLocalDescription(offer);
  };

  return pc;
}

export function attachStream(video: HTMLVideoElement | null, stream: MediaStream | null) {
  if (!video) return;
  if (video.srcObject !== stream) {
    video.srcObject = stream;
  }
}

export function getMediaConstraints(consents: string[]) {
  const blurEnabled = consents.includes('blur');
  return {
    audio: true,
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      facingMode: 'user'
    },
    blurEnabled
  };
}

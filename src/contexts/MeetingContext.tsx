import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { useAuth } from './AuthContext';
import { storage } from '@/graphql/client';
import { toast } from 'sonner';
import { getSocketUrl } from '@/lib/socket-utils';

interface MeetingContextType {
  socket: Socket | null;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  joinMeeting: (meetingId: string, isHost?: boolean) => Promise<void>;
  leaveMeeting: (meetingId: string) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isInMeeting: boolean;
  activeMeetingId: string | null;
  remoteMediaStates: Record<string, { isAudioMuted: boolean; isVideoMuted: boolean; isScreenSharing?: boolean }>;
  toggleScreenShare: () => Promise<void>;
  isScreenSharing: boolean;
  isHost: boolean;
  participants: MeetingParticipant[];
  peerStates: Record<string, 'connecting' | 'connected' | 'failed'>;
  
  // New: Device & Audio Settings
  availableDevices: MediaDeviceInfo[];
  selectedVideoDeviceId: string | null;
  selectedAudioDeviceId: string | null;
  setVideoDevice: (deviceId: string) => Promise<void>;
  setAudioDevice: (deviceId: string) => Promise<void>;
  speakingParticipants: Set<string>; // Set of socketIds (including 'local')
  resumeAudio: () => void;
  // Advanced Features
  raisedHands: Set<string>;
  toggleRaiseHand: () => void;
  muteAllParticipants: () => void;
}

export interface MeetingParticipant {
  socketId: string;
  user: any;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [remoteMediaStates, setRemoteMediaStates] = useState<Record<string, { isAudioMuted: boolean; isVideoMuted: boolean; isScreenSharing?: boolean }>>({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // New: Device & Audio States
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | null>(null);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | null>(null);
  const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(new Set());
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [peerStates, setPeerStates] = useState<Record<string, 'connecting' | 'connected' | 'failed'>>({});
  
  const peersRef = useRef<Record<string, Peer.Instance>>({});
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const mergedAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Record<string, MediaStream>>({});
  const analysersRef = useRef<Record<string, { analyser: AnalyserNode; dataArray: Uint8Array }>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activeMeetingIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeMeetingIdRef.current = activeMeetingId;
  }, [activeMeetingId]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    remoteStreamsRef.current = remoteStreams;
  }, [remoteStreams]);

  useEffect(() => {
    if (!user) return;
    const token = storage.getAccessToken();
    const newSocket = io(getSocketUrl('meeting'), { 
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
    });
    
    setSocket(newSocket);

    newSocket.on('mediaStateChanged', ({ socketId, isAudioMuted, isVideoMuted, isScreenSharing }) => {
      setRemoteMediaStates(prev => ({
        ...prev,
        [socketId]: { isAudioMuted, isVideoMuted, isScreenSharing }
      }));
    });

    newSocket.on('existingParticipants', (others: any[]) => {
      setParticipants(others);
      const states: Record<string, { isAudioMuted: boolean; isVideoMuted: boolean; isScreenSharing?: boolean }> = {};
      others.forEach(p => {
        states[p.socketId] = { isAudioMuted: p.isAudioMuted, isVideoMuted: p.isVideoMuted, isScreenSharing: p.isScreenSharing };
      });
      setRemoteMediaStates(states);
    });

    newSocket.on('userJoined', ({ userId, socketId, user: joinedUser, isAudioMuted = false, isVideoMuted = false, isScreenSharing = false }) => {
      console.log('User joined room:', userId, socketId);
      setRemoteMediaStates(prev => ({
        ...prev,
        [socketId]: { isAudioMuted, isVideoMuted, isScreenSharing }
      }));
      if (joinedUser) {
        toast.info(`${joinedUser.name} joined the meeting`);
        setParticipants(prev => {
          if (!prev.find(p => p.socketId === socketId)) {
            return [...prev, { socketId, user: joinedUser }];
          }
          return prev;
        });
      }
      if (localStreamRef.current) {
        // I am an existing user, create an initiator peer for the new user
        const peer = createPeer(socketId, newSocket, localStreamRef.current, true);
        peersRef.current[socketId] = peer;
      }
    });

    newSocket.on('signal', ({ fromSocketId, signal }) => {
      console.log('Received signal from:', fromSocketId);
      const peer = peersRef.current[fromSocketId];
      if (peer) {
        peer.signal(signal);
      } else if (localStreamRef.current) {
        // I am the new user receiving an offer from an existing user
        const peer = createPeer(fromSocketId, newSocket, localStreamRef.current, false);
        peersRef.current[fromSocketId] = peer;
        peer.signal(signal);
      }
    });

    newSocket.on('userLeft', ({ socketId, user: leftUser }) => {
      console.log('User left:', socketId);
      if (leftUser) {
        toast.info(`${leftUser.name} left the meeting`);
      }
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
      setRaisedHands(prev => {
        const next = new Set(prev);
        next.delete(socketId);
        return next;
      });
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].destroy();
        delete peersRef.current[socketId];
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      }
    });

    newSocket.on('handRaised', ({ socketId, isRaised }) => {
      setRaisedHands(prev => {
        const next = new Set(prev);
        if (isRaised) next.add(socketId);
        else next.delete(socketId);
        return next;
      });
    });

    newSocket.on('forceMuteAudio', () => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack && audioTrack.enabled) {
          audioTrack.enabled = false;
          setIsAudioMuted(true);
          toast.warning("The host has muted your microphone.", { duration: 5000 });
          newSocket.emit('updateMediaState', { 
            meetingId: activeMeetingIdRef.current, 
            isAudioMuted: true, 
            isVideoMuted: false // Best effort mapping since we don't have isVideoMutedRef easily available without closure traps
          });
        }
      }
    });

    newSocket.on('connect_error', async (err: any) => {
      console.warn('Meeting socket connection error:', err.message);
      if (err.message.includes('auth') || err.message.includes('token')) {
        const newToken = storage.getAccessToken();
        if (newToken) {
          newSocket.auth = { token: `Bearer ${newToken}` };
          newSocket.connect();
        }
      }
    });

    newSocket.on('meetingError', ({ message }) => {
      toast.error(message || "Could not join meeting.");
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peersRef.current).forEach(peer => peer.destroy());
      peersRef.current = {};
      setRemoteStreams({});
      setIsInMeeting(false);
      setActiveMeetingId(null);
      setLocalStream(null);
      setParticipants([]);
    });

    newSocket.on('meetingEnded', () => {
      toast.info('This meeting has been ended by the host.');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peersRef.current).forEach(peer => peer.destroy());
      peersRef.current = {};
      setRemoteStreams({});
      setIsInMeeting(false);
      setActiveMeetingId(null);
      setLocalStream(null);
      setParticipants([]);
    });

    return () => { newSocket.close(); };
  }, [user]);
  
  const createPeer = (targetSocketId: string, socket: Socket, stream: MediaStream, initiator: boolean) => {
    setPeerStates(prev => ({ ...prev, [targetSocketId]: 'connecting' }));

    const peer = new Peer({
      initiator,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          // IMPORTANT: If you are connecting across different networks (e.g. Home Wi-Fi to Friend's Wi-Fi),
          // you MUST add a TURN server. Public STUN servers (like Google's) won't work through double-NAT.
          // Example (Metered.ca or Xirsys):
          // { urls: 'turn:YOUR_RELAY_SERVER:3478', username: '...', credential: '...' }
        ],
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 10,
      }
    });

    peer.on('signal', (signal) => {
      socket.emit('signal', { targetSocketId, signal });
    });

    peer.on('connect', () => {
      console.log(`[Meeting] Peer connected with ${targetSocketId}`);
      setPeerStates(prev => ({ ...prev, [targetSocketId]: 'connected' }));
    });

    peer.on('stream', (remoteStream) => {
      console.log(`[Meeting] Received remote stream from ${targetSocketId}.`);
      setRemoteStreams(prev => ({ ...prev, [targetSocketId]: remoteStream }));
      setupAudioAnalysis(targetSocketId, remoteStream);
    });

    peer.on('error', (err) => {
      console.error(`[Meeting] Peer error with ${targetSocketId}:`, err);
      setPeerStates(prev => ({ ...prev, [targetSocketId]: 'failed' }));
      toast.error(`Connection failed with a participant.`);
    });
    peer.on('close', () => {
        setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[targetSocketId];
            return next;
        });
    });

    return peer;
  };

  const joinMeeting = async (meetingId: string, hostFlag = false) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media Devices API is not available (check if you are using HTTPS or localhost)');
      }

      const constraints = {
        video: selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId } } : true,
        audio: selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[Meeting] Local stream acquired. Tracks:', 
        stream.getTracks().map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled, muted: t.muted, readyState: t.readyState }))
      );
      setLocalStream(stream);
      setupAudioAnalysis('local', stream);
      setIsInMeeting(true);
      setActiveMeetingId(meetingId);
      setIsHost(hostFlag);
      
      // Enumerate devices for future use
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableDevices(devices);
      
      // Set initial IDs if not set
      if (!selectedVideoDeviceId) {
        const videoDevice = devices.find(d => d.kind === 'videoinput');
        if (videoDevice) setSelectedVideoDeviceId(videoDevice.deviceId);
      }
      if (!selectedAudioDeviceId) {
        const audioDevice = devices.find(d => d.kind === 'audioinput');
        if (audioDevice) setSelectedAudioDeviceId(audioDevice.deviceId);
      }
      
      if (socket) {
        socket.emit('joinMeeting', { 
          meetingId,
          user: user ? { _id: user._id, name: user.name, avatar: user.avatar } : undefined,
          isAudioMuted,
          isVideoMuted,
          isScreenSharing: false
        });
        setActiveMeetingId(meetingId);
        setIsHost(hostFlag);
        setIsInMeeting(true);
      }
    } catch (err: any) {
      toast.error('Failed to access camera/microphone: ' + err.message);
    }
  };

  const leaveMeeting = (meetingId: string) => {
    if (socket) {
      socket.emit('leaveMeeting', { meetingId });
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    Object.values(peersRef.current).forEach(peer => peer.destroy());
    peersRef.current = {};
    setRemoteStreams({});
    setIsInMeeting(false);
    setActiveMeetingId(null);
    setIsHost(false);
    setParticipants([]);
    
    // Stop analysis
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    analysersRef.current = {};
    if (audioContextRef.current) audioContextRef.current.close();
    audioContextRef.current = null;
  };

  const setupAudioAnalysis = (id: string, stream: MediaStream) => {
    if (stream.getAudioTracks().length === 0) return;
    
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const context = audioContextRef.current;
    if (context.state === 'suspended') {
        context.resume();
    }
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Force audio to "pull" through the graph by connecting to destination with 0 gain
    const silenceGain = context.createGain();
    silenceGain.gain.value = 0;
    analyser.connect(silenceGain);
    silenceGain.connect(context.destination);
    
    analysersRef.current[id] = { analyser, dataArray };
    console.log(`[Meeting] Audio analysis setup for ${id}. Context SampleRate: ${context.sampleRate}`);
    
    if (!animationFrameRef.current) {
        let lastLog = Date.now();
        const checkVolume = () => {
            const nowSpeaking = new Set<string>();
            Object.entries(analysersRef.current).forEach(([sid, { analyser, dataArray }]) => {
                analyser.getByteFrequencyData(dataArray as any);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const average = sum / dataArray.length;
                
                // Periodic diagnostic log
                if (Date.now() - lastLog > 10000) {
                    const tracks = sid === 'local' ? localStreamRef.current?.getAudioTracks() : remoteStreamsRef.current[sid]?.getAudioTracks();
                    const trackInfo = tracks?.map(t => `[${t.label}: en=${t.enabled}, mut=${t.muted}, state=${t.readyState}]`).join(', ') || 'no tracks';
                    
                    console.log(`[Meeting Diagnostic] ID: ${sid} | Vol: ${Math.floor(average)} | State: ${audioContextRef.current?.state} | Tracks: ${trackInfo}`);
                    if (audioContextRef.current?.state === 'suspended') {
                        console.log('[Meeting Diagnostic] Attempting to resume AudioContext...');
                        audioContextRef.current.resume();
                    }
                }
                
                if (average > 15) nowSpeaking.add(sid); // Threshold for speaking
            });
            if (Date.now() - lastLog > 10000) lastLog = Date.now();
            
            setSpeakingParticipants(prev => {
                const areEqual = prev.size === nowSpeaking.size && [...prev].every(s => nowSpeaking.has(s));
                return areEqual ? prev : nowSpeaking;
            });
            
            animationFrameRef.current = requestAnimationFrame(checkVolume);
        };
        animationFrameRef.current = requestAnimationFrame(checkVolume);
    }
  };

  const setVideoDevice = async (deviceId: string) => {
    if (!localStream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Media Devices API not available");
      return;
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { deviceId: { exact: deviceId } },
        audio: selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : true 
      });
      
      const oldVideoTrack = localStream.getVideoTracks()[0];
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      Object.values(peersRef.current).forEach(peer => {
        peer.replaceTrack(oldVideoTrack, newVideoTrack, localStream);
      });
      
      oldVideoTrack.stop();
      localStream.removeTrack(oldVideoTrack);
      localStream.addTrack(newVideoTrack);
      
      setSelectedVideoDeviceId(deviceId);
      setLocalStream(new MediaStream(localStream.getTracks()));
    } catch (err) {
      toast.error("Could not switch video device");
    }
  };

  const setAudioDevice = async (deviceId: string) => {
    if (!localStream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Media Devices API not available");
      return;
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { deviceId: { exact: deviceId } },
        video: selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId } } : true 
      });
      
      const oldAudioTrack = localStream.getAudioTracks()[0];
      const newAudioTrack = newStream.getAudioTracks()[0];
      
      console.log(`[Meeting] Switching audio device. New track label: ${newAudioTrack.label}`);
      
      Object.values(peersRef.current).forEach(peer => {
        peer.replaceTrack(oldAudioTrack, newAudioTrack, localStream);
      });
      
      oldAudioTrack.stop();
      localStream.removeTrack(oldAudioTrack);
      localStream.addTrack(newAudioTrack);
      
      setSelectedAudioDeviceId(deviceId);
      setLocalStream(new MediaStream(localStream.getTracks()));
      setupAudioAnalysis('local', localStream);
    } catch (err) {
      toast.error("Could not switch audio device");
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log(`[Meeting] Local audio toggled. Enabled: ${audioTrack.enabled}`);
        setIsAudioMuted(!audioTrack.enabled);
        if (socket && activeMeetingId) {
          socket.emit('updateMediaState', { 
            meetingId: activeMeetingId, 
            isAudioMuted: !audioTrack.enabled, 
            isVideoMuted 
          });
        }
      }
    }
  };

  const toggleRaiseHand = () => {
    if (!socket || !activeMeetingId) return;
    
    setRaisedHands(prev => {
      const next = new Set(prev);
      const isRaised = !next.has('local');
      if (isRaised) next.add('local');
      else next.delete('local');
      
      socket.emit('raiseHand', { meetingId: activeMeetingId, isRaised });
      return next;
    });
  };

  const muteAllParticipants = () => {
    if (!socket || !activeMeetingId || !isHost) return;
    socket.emit('muteAll', { meetingId: activeMeetingId });
    toast.success("Muted all participants");
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log(`[Meeting] Local video toggled. Enabled: ${videoTrack.enabled}`);
        setIsVideoMuted(!videoTrack.enabled);
        if (socket && activeMeetingId) {
          socket.emit('updateMediaState', { 
            meetingId: activeMeetingId, 
            isAudioMuted, 
            isVideoMuted: !videoTrack.enabled 
          });
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!localStream || !activeMeetingId) return;

    if (!isScreenSharing) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast.error("Screen sharing is not supported by your browser or context");
        return;
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: true 
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        const screenAudioTrack = screenStream.getAudioTracks()[0];
        screenTrackRef.current = screenTrack;

        Object.values(peersRef.current).forEach(peer => {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) peer.replaceTrack(videoTrack, screenTrack, localStream);
          
          if (screenAudioTrack) {
            const micTrack = localStream.getAudioTracks()[0];
            if (micTrack) {
              const context = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
              audioContextRef.current = context;
              const micSource = context.createMediaStreamSource(new MediaStream([micTrack]));
              const sysSource = context.createMediaStreamSource(new MediaStream([screenAudioTrack]));
              const destination = context.createMediaStreamDestination();
              micSource.connect(destination);
              sysSource.connect(destination);
              const mergedTrack = destination.stream.getAudioTracks()[0];
              mergedAudioTrackRef.current = mergedTrack;
              peer.replaceTrack(micTrack, mergedTrack, localStream);
            } else {
              peer.addStream(new MediaStream([screenAudioTrack]));
            }
          }
        });

        screenTrack.onended = () => stopScreenShare(screenAudioTrack);
        setIsScreenSharing(true);
        if (socket && activeMeetingId) {
          socket.emit('updateMediaState', { 
            meetingId: activeMeetingId, 
            isAudioMuted, isVideoMuted, isScreenSharing: true
          });
        }
        toast.success("Screen sharing started");
      } catch (err) {
        toast.error("Could not share screen");
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = (sharedAudioTrack?: MediaStreamTrack) => {
    if (screenTrackRef.current && localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];
      
      Object.values(peersRef.current).forEach(peer => {
        if (videoTrack) peer.replaceTrack(screenTrackRef.current!, videoTrack, localStream);
        if (audioTrack) {
          if (mergedAudioTrackRef.current) {
            peer.replaceTrack(mergedAudioTrackRef.current, audioTrack, localStream);
          } else if (sharedAudioTrack) {
            peer.replaceTrack(sharedAudioTrack, audioTrack, localStream);
          }
        }
      });
      
      screenTrackRef.current.stop();
      if (sharedAudioTrack) sharedAudioTrack.stop();
      if (mergedAudioTrackRef.current) mergedAudioTrackRef.current.stop();
      screenTrackRef.current = null;
      mergedAudioTrackRef.current = null;
      setIsScreenSharing(false);
      if (socket && activeMeetingId) {
        socket.emit('updateMediaState', { 
          meetingId: activeMeetingId, isAudioMuted, isVideoMuted, isScreenSharing: false
        });
      }
      toast.info("Screen sharing ended");
    }
  };

  return (
    <MeetingContext.Provider value={{
      socket,
      localStream,
      remoteStreams,
      joinMeeting,
      leaveMeeting,
      toggleAudio,
      toggleVideo,
      isAudioMuted,
      isVideoMuted,
      isInMeeting,
      activeMeetingId,
      remoteMediaStates,
      toggleScreenShare,
      isScreenSharing,
      isHost,
      participants,
      availableDevices,
      selectedVideoDeviceId,
      selectedAudioDeviceId,
      setVideoDevice,
      setAudioDevice,
      speakingParticipants,
      resumeAudio: () => {
        if (audioContextRef.current) {
            audioContextRef.current.resume();
            toast.success("Audio system resumed");
        } else {
            toast.info("Audio system not initialized yet");
        }
      },
      raisedHands,
      toggleRaiseHand,
      muteAllParticipants,
      peerStates
    }}>
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) throw new Error('useMeeting must be used within a MeetingProvider');
  return context;
};

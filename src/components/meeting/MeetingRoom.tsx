import React, { useState, useEffect, useRef } from "react";
import { useMeeting } from "@/contexts/MeetingContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  ScreenShare, Users, Settings, Maximize2, Camera, Headphones, Check, Hand, Link, VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppMutation } from "@/hooks/useGraphQL";
import { UPDATE_MEETING_STATUS } from "@/graphql/mutations";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const VideoTile = ({ 
  stream, 
  label, 
  user,
  isLocal = false, 
  isAudioMuted = false, 
  isVideoMuted = false,
  isSpeaking = false,
  id = "",
  onPin,
  isPinned = false,
  isHandRaised = false,
  connectionState = 'connected'
}: { 
  stream: MediaStream | null, 
  label: string, 
  user?: any,
  isLocal?: boolean,
  isAudioMuted?: boolean,
  isVideoMuted?: boolean,
  isSpeaking?: boolean,
  id?: string,
  onPin?: (id: string) => void,
  isPinned?: boolean,
  isHandRaised?: boolean,
  connectionState?: 'connecting' | 'connected' | 'failed'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        boxShadow: isSpeaking ? "0 0 40px rgba(74, 222, 128, 0.4)" : "0 0 0px rgba(0,0,0,0)"
      }}
      className={cn(
        "relative rounded-3xl overflow-hidden border transition-all duration-300 group bg-black/40 flex items-center justify-center",
        isPinned ? "h-full w-full" : "aspect-video",
        isSpeaking ? "border-green-400/50 scale-[1.02]" : "border-white/10 shadow-2xl"
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={cn(
          "h-full w-full transition-opacity duration-300",
          isPinned ? "object-contain" : "object-cover rounded-3xl",
          isLocal && "scale-x-[-1]",
          isVideoMuted ? "opacity-0" : "opacity-100"
        )}
      />
      
      {/* Avatar Fallback for Muted Video */}
      <AnimatePresence>
        {isVideoMuted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-bark/80 backdrop-blur-sm z-10"
          >
            {user?.avatar ? (
               <img src={user.avatar} className="h-28 w-28 rounded-full object-cover shadow-2xl border-4 border-white/10" alt={user?.name} />
            ) : (
               <div className="h-28 w-28 rounded-full bg-sage/30 flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-white/10 shadow-sage/20">
                  {user?.name?.charAt(0)?.toUpperCase() || label.charAt(0).toUpperCase()}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute top-4 right-4 flex gap-2">
        {isAudioMuted && (
          <div className="h-8 w-8 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
            <MicOff className="h-4 w-4" />
          </div>
        )}
        {isVideoMuted && (
          <div className="h-8 w-8 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
            <VideoOff className="h-4 w-4" />
          </div>
        )}
        {isHandRaised && (
          <div className="h-8 w-8 rounded-full bg-yellow-500/90 backdrop-blur-md flex items-center justify-center text-white shadow-lg animate-bounce">
            <Hand className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Connection State Overlay */}
      <AnimatePresence>
        {(!isLocal && connectionState !== 'connected') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-bark/90 backdrop-blur-md z-30"
          >
            {connectionState === 'connecting' ? (
              <>
                <div className="h-10 w-10 border-4 border-sage/20 border-t-sage rounded-full animate-spin mb-4" />
                <span className="text-[10px] font-black text-sage uppercase tracking-[0.2em]">Connecting...</span>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <VolumeX className="h-5 w-5 text-red-500" />
                </div>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Connection Failed</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-bark/60 backdrop-blur-md rounded-xl border border-white/10">
        <div className={cn(
          "h-2 w-2 rounded-full",
          isAudioMuted ? "bg-red-500" : (isSpeaking ? "bg-green-400 animate-pulse" : "bg-green-500/50")
        )} />
        <span className="text-[10px] font-black text-white uppercase tracking-widest">{label}</span>
      </div>
      
      {/* Overlay controls on hover */}
      <div className="absolute inset-0 bg-bark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => onPin?.(id)}
          className={cn(
            "h-10 w-10 rounded-full backdrop-blur-md text-white transition-all",
            isPinned ? "bg-sage hover:bg-sage/80" : "bg-white/10 hover:bg-white/20"
          )}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

const MeetingSettingsDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const { 
    availableDevices, 
    selectedVideoDeviceId, 
    selectedAudioDeviceId, 
    setVideoDevice, 
    setAudioDevice 
  } = useMeeting();

  const videoDevices = availableDevices.filter(d => d.kind === 'videoinput');
  const audioDevices = availableDevices.filter(d => d.kind === 'audioinput');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-bark border-white/10 text-white shadow-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sage flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            Meeting Settings
          </DialogTitle>
          <DialogDescription className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
            Configure your audio and video devices
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 flex items-center gap-2">
              <Camera className="h-3 w-3" />
              Camera Source
            </Label>
            <div className="grid gap-2">
              {videoDevices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => setVideoDevice(device.deviceId)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                    selectedVideoDeviceId === device.deviceId 
                      ? "bg-sage/10 border-sage text-sage" 
                      : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/10"
                  )}
                >
                  <span className="text-xs font-bold truncate max-w-[240px]">{device.label || `Camera ${device.deviceId.substring(0, 5)}`}</span>
                  {selectedVideoDeviceId === device.deviceId && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 flex items-center gap-2">
              <Headphones className="h-3 w-3" />
              Microphone Source
            </Label>
            <div className="grid gap-2">
              {audioDevices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => setAudioDevice(device.deviceId)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                    selectedAudioDeviceId === device.deviceId 
                      ? "bg-sage/10 border-sage text-sage" 
                      : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/10"
                  )}
                >
                  <span className="text-xs font-bold truncate max-w-[240px]">{device.label || `Mic ${device.deviceId.substring(0, 5)}`}</span>
                  {selectedAudioDeviceId === device.deviceId && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)} className="bg-sage hover:bg-sage-dark text-white rounded-xl px-8 font-black uppercase tracking-widest h-12">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function MeetingRoom() {
  const { user } = useAuth();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const { 
    localStream, remoteStreams, leaveMeeting, activeMeetingId,
    toggleAudio, toggleVideo, isAudioMuted, isVideoMuted,
    remoteMediaStates, toggleScreenShare, isScreenSharing, isHost,
    participants, speakingParticipants, resumeAudio,
    raisedHands, toggleRaiseHand, muteAllParticipants,
    peerStates
  } = useMeeting();

  const [updateStatus] = useAppMutation(UPDATE_MEETING_STATUS);

  const handleEndMeeting = async () => {
    if (confirm("Are you sure you want to end the meeting for everyone?")) {
      try {
        await updateStatus({ variables: { id: activeMeetingId, status: 'ENDED' } });
      } catch (err) {}
    }
  };

  if (!activeMeetingId) return null;

  const peerCount = Object.keys(remoteStreams).length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-bark flex flex-col items-center justify-center p-8 overflow-hidden"
    >


      {/* Video Grid / Spotlight */}
      <div className={cn(
        "flex-1 w-full mx-auto p-4 flex gap-4 transition-all duration-1000",
        pinnedId ? "flex-row max-w-full h-[calc(100vh-180px)] mt-16" : "items-center justify-center max-w-7xl"
      )}>
        {/* Spotlight Area */}
        {pinnedId && (
          <div className="flex-1 min-w-0">
            {pinnedId === 'local' ? (
              <VideoTile 
                id="local"
                stream={localStream} 
                label="You" 
                isLocal 
                isAudioMuted={isAudioMuted}
                isVideoMuted={isVideoMuted}
                isSpeaking={speakingParticipants.has('local')}
                isPinned={true}
                onPin={() => setPinnedId(null)}
              />
            ) : (
                <VideoTile 
                   id={pinnedId}
                   stream={remoteStreams[pinnedId]} 
                   label={participants.find(p => p.socketId === pinnedId)?.user?.name || `Peer ${pinnedId.substring(0,4)}`}
                   user={participants.find(p => p.socketId === pinnedId)?.user}
                   isAudioMuted={remoteMediaStates[pinnedId]?.isAudioMuted}
                   isVideoMuted={remoteMediaStates[pinnedId]?.isVideoMuted}
                   isSpeaking={speakingParticipants.has(pinnedId)}
                   isPinned={true}
                   onPin={() => setPinnedId(null)}
                   connectionState={peerStates[pinnedId]}
                />
            )}
          </div>
        )}

        <div className={cn(
          "flex-none transition-all duration-500",
          pinnedId 
            ? "w-64 grid grid-cols-1 gap-4 overflow-y-auto pr-2 scrollbar-hide" 
            : "grid gap-6 items-center justify-center " + (peerCount === 0 
                ? "grid-cols-1 max-w-2xl w-full" 
                : (peerCount <= 2 ? "grid-cols-2 w-full" : "grid-cols-3 w-full"))
        )}>
          {/* Always render Local if NOT pinned */}
          {pinnedId !== 'local' && (
            <VideoTile 
              id="local"
              stream={localStream} 
              label="You" 
              isLocal 
              isAudioMuted={isAudioMuted}
              isVideoMuted={isVideoMuted}
              isSpeaking={speakingParticipants.has('local')}
              onPin={(id) => setPinnedId(id)}
              isHandRaised={raisedHands.has('local')}
            />
          )}

          {/* Render others if NOT pinned */}
          {participants.map(p => (
            pinnedId !== p.socketId && (
              <VideoTile 
                key={p.socketId}
                id={p.socketId}
                stream={remoteStreams[p.socketId]} 
                label={p.user?.name || `Peer ${p.socketId.substring(0,4)}`}
                user={p.user}
                isAudioMuted={remoteMediaStates[p.socketId]?.isAudioMuted}
                isVideoMuted={remoteMediaStates[p.socketId]?.isVideoMuted}
                isSpeaking={speakingParticipants.has(p.socketId)}
                onPin={(id) => setPinnedId(id)}
                isHandRaised={raisedHands.has(p.socketId)}
                connectionState={peerStates[p.socketId]}
              />
            )
          ))}
        </div>
      </div>

      <MeetingSettingsDialog open={showSettings} onOpenChange={setShowSettings} />

      {/* Floating UI Elements at the very end for proper stacking */}
      <div className="fixed top-8 left-8 flex items-center gap-4 z-[999]">
        <div className="h-12 w-12 rounded-2xl bg-sage flex items-center justify-center text-white shadow-lg">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-white font-black text-lg leading-tight uppercase tracking-tighter">Live Session</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded-md text-[9px] font-black uppercase tracking-widest border border-green-500/30">Ongoing</span>
            <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">{participants.length + 1} Participants</span>
          </div>
        </div>
        
        <Button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Meeting link copied to clipboard!");
          }}
          className="ml-4 bg-sage hover:bg-sage/80 text-white rounded-xl text-[9px] font-black uppercase tracking-widest h-8 px-3 flex items-center gap-2 cursor-pointer pointer-events-auto"
        >
          <Link className="h-3 w-3" />
          Copy Invite Link
        </Button>

        <Button 
          onClick={resumeAudio}
          className="bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest h-8 px-3 cursor-pointer pointer-events-auto"
        >
          Resume Audio
        </Button>

        {pinnedId && (
          <Button 
            onClick={() => setPinnedId(null)}
            variant="ghost" 
            className="ml-2 h-8 px-3 rounded-xl bg-sage/20 text-sage text-[9px] font-black uppercase tracking-widest border border-sage/20 cursor-pointer pointer-events-auto"
          >
            Exit Spotlight
          </Button>
        )}
      </div>

      <div className="fixed top-8 right-8 flex items-center gap-4 text-white/40 z-[999]">
         <Button 
           variant="ghost" 
           onClick={() => setShowParticipants(!showParticipants)}
           className={cn(
              "h-10 px-4 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer pointer-events-auto",
              showParticipants ? "bg-sage/20 text-sage" : "hover:text-white hover:bg-white/10"
           )}
         >
           <Users className="h-4 w-4" />
           {participants.length + 1}
         </Button>
         <Button 
            variant="ghost" 
            onClick={() => setShowSettings(true)}
            className="h-10 px-4 hover:text-white hover:bg-white/10 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer pointer-events-auto"
          >
            <Settings className="h-4 w-4" />
            Meeting Settings
         </Button>
      </div>

      {/* Control Bar moved to end and given highest z-index */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-5 bg-bark/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl z-[1000] pointer-events-auto"
      >
        <Button 
          size="icon" 
          onClick={toggleAudio}
          className={cn(
            "h-14 w-14 rounded-2xl transition-all duration-300 cursor-pointer",
            isAudioMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {isAudioMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        <Button 
          size="icon" 
          onClick={toggleVideo}
          className={cn(
            "h-14 w-14 rounded-2xl transition-all duration-300 cursor-pointer",
            isVideoMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {isVideoMuted ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
        </Button>

        <div className="h-10 w-[1px] bg-white/10 mx-2" />

        <Button 
          size="icon" 
          onClick={toggleScreenShare}
          className={cn(
            "h-14 w-14 rounded-2xl transition-all duration-300 cursor-pointer",
            isScreenSharing ? "bg-sage text-white" : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          <ScreenShare className="h-6 w-6" />
        </Button>

        <Button 
          size="icon" 
          onClick={toggleRaiseHand}
          className={cn(
            "h-14 w-14 rounded-2xl transition-all duration-300 cursor-pointer",
            raisedHands.has('local') ? "bg-yellow-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          <Hand className="h-6 w-6" />
        </Button>

        <Button 
          size="icon" 
          onClick={() => setShowSettings(true)}
          className="h-14 w-14 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer"
        >
          <Settings className="h-6 w-6" />
        </Button>

        {isHost ? (
          <Button 
            onClick={handleEndMeeting}
            className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest gap-3 shadow-lg shadow-red-900/20 cursor-pointer"
          >
            <PhoneOff className="h-5 w-5" />
            End for All
          </Button>
        ) : (
          <Button 
            onClick={() => leaveMeeting(activeMeetingId)}
            className="h-14 px-8 rounded-2xl bg-bark hover:bg-bark/80 text-white font-black uppercase tracking-widest gap-3 shadow-lg cursor-pointer"
          >
            <PhoneOff className="h-5 w-5" />
            Leave
          </Button>
        )}
      </motion.div>


      {/* Participant List Sidebar */}
      <AnimatePresence>
        {showParticipants && (
           <motion.div
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: 20 }}
             className="fixed right-8 top-24 w-80 bg-bark/90 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-2xl z-[1001] flex flex-col gap-4"
           >
             <div className="flex items-center justify-between border-b border-white/10 pb-3">
               <h3 className="text-white font-black uppercase tracking-widest text-xs">
                 Participants ({participants.length + 1})
               </h3>
               {isHost && (
                 <Button 
                   onClick={muteAllParticipants} 
                   variant="ghost" 
                   className="h-6 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer pointer-events-auto"
                 >
                   <VolumeX className="h-3 w-3" />
                   Mute All
                 </Button>
               )}
             </div>
             <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-2">
               {/* Local User */}
               <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-sage flex items-center justify-center text-white text-xs font-bold shrink-0">
                       You
                    </div>
                    <span className="text-white text-sm font-bold truncate">You {isHost ? "(Host)" : ""}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    {raisedHands.has('local') && <Hand className="h-4 w-4 text-yellow-500 mr-1" />}
                    {isScreenSharing && <ScreenShare className="h-4 w-4 text-blue-400 mr-1" />}
                    {isAudioMuted ? <MicOff className="h-4 w-4 text-red-400" /> : <Mic className="h-4 w-4" />}
                    {isVideoMuted ? <VideoOff className="h-4 w-4 text-red-400" /> : <Video className="h-4 w-4" />}
                  </div>
               </div>
               
               {/* Remote Users */}
               {participants.map(p => (
                 <div key={p.socketId} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                       {p.user?.avatar ? (
                         <img src={p.user.avatar} className="h-8 w-8 rounded-full object-cover shrink-0" alt={p.user?.name} />
                       ) : (
                         <div className="h-8 w-8 rounded-full bg-tan/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {p.user?.name?.charAt(0) || '?'}
                         </div>
                       )}
                       <span className="text-white text-sm font-bold truncate max-w-[120px]">{p.user?.name || `Peer ${p.socketId.substring(0,4)}`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50">
                      {raisedHands.has(p.socketId) && <Hand className="h-4 w-4 text-yellow-500 mr-1" />}
                      {remoteMediaStates[p.socketId]?.isScreenSharing && <ScreenShare className="h-4 w-4 text-blue-400 mr-1" />}
                      {remoteMediaStates[p.socketId]?.isAudioMuted ? <MicOff className="h-4 w-4 text-red-400" /> : <Mic className="h-4 w-4" />}
                      {remoteMediaStates[p.socketId]?.isVideoMuted ? <VideoOff className="h-4 w-4 text-red-400" /> : <Video className="h-4 w-4" />}
                    </div>
                 </div>
               ))}
             </div>
           </motion.div>
        )}
      </AnimatePresence>


      {/* Background decoration */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-sage/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-tan/10 rounded-full blur-[120px] pointer-events-none" />
    </motion.div>
  );
}

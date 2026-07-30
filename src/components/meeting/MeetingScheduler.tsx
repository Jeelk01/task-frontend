import React, { useState } from "react";
import type { PaginatedResponse, Workspace, Meeting } from "@/types";
import { useAppQuery, useAppMutation } from "@/hooks/useGraphQL";
import { useAuth } from "@/contexts/AuthContext";
import { GET_WORKSPACE_MEETINGS } from "@/graphql/queries";
import { CREATE_MEETING } from "@/graphql/mutations";
import { useMeeting } from "@/contexts/MeetingContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Video, Plus, Clock, 
  ChevronRight, Play, X, VideoOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const MeetingScheduler = ({ workspaceId }: { workspaceId: string }) => {
  const { joinMeeting } = useMeeting();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState<Date>(new Date());

  const { data, refetch } = useAppQuery(GET_WORKSPACE_MEETINGS, {
    variables: { workspaceId },
    skip: !workspaceId
  });

  const [createMeeting] = useAppMutation(CREATE_MEETING, {
    successMessage: "Meeting scheduled successfully!"
  });

  const handleCreate = async () => {
    if (!title.trim()) return toast.error("Please enter a meeting title");
    try {
      await createMeeting({
        variables: {
          title,
          workspaceId,
          startTime: startTime.toISOString(),
        }
      });
      setShowCreate(false);
      setTitle("");
      refetch();
    } catch (err) {
      // toast is handled by useAppMutation
    }
  };

  const meetings = (data as any)?.getWorkspaceMeetings || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-tan/10 flex items-center justify-center text-tan">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-bark uppercase tracking-tighter">Workspace Meetings</h3>
            <p className="text-[10px] text-tan font-bold uppercase tracking-widest">Schedule and Join Sessions</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowCreate(true)}
          className="bg-sage hover:bg-sage/90 text-white rounded-xl h-10 gap-2 px-5 font-bold text-xs uppercase tracking-widest shadow-accent transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Schedule
        </Button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-6 bg-cream border-2 border-dashed border-tan/30 rounded-3xl space-y-4 relative">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowCreate(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-tan/10"
              >
                <X className="h-4 w-4" />
              </Button>
              <h4 className="text-xs font-black text-bark uppercase tracking-widest flex items-center gap-2">
                <Video className="h-4 w-4 text-sage" />
                Host a New Meeting
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  placeholder="Meeting Title (e.g. Daily Sync)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white border-tan/20 rounded-xl h-12"
                />
                <div className="flex gap-2">
                   <Input 
                    type="datetime-local"
                    value={format(startTime, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setStartTime(new Date(e.target.value))}
                    className="bg-white border-tan/20 rounded-xl h-12 flex-1"
                  />
                  <Button onClick={handleCreate} className="bg-bark text-white rounded-xl h-12 px-6 font-bold uppercase tracking-widest">
                    Create
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-3">
        {meetings.length === 0 ? (
          <div className="py-12 text-center bg-cream/30 rounded-[2rem] border border-dashed border-tan/20">
             <Clock className="h-10 w-10 text-tan/20 mx-auto mb-3" />
             <p className="text-xs font-bold text-tan uppercase tracking-widest">No meetings scheduled</p>
          </div>
        ) : (
          meetings.map((meeting: any) => (
            <motion.div 
              key={meeting._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="group p-5 bg-white rounded-[2rem] border border-tan/10 shadow-sm hover:shadow-xl hover:border-sage/30 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center transition-colors",
                  meeting.status === 'ONGOING' ? "bg-green-500/10 text-green-600" :
                  meeting.status === 'ENDED' ? "bg-red-500/10 text-red-600" :
                  meeting.status === 'CANCELLED' ? "bg-gray-500/10 text-gray-600" :
                  "bg-tan/10 text-tan"
                )}>
                  {meeting.status === 'ONGOING' ? <Video className="h-6 w-6 animate-pulse" /> : 
                   meeting.status === 'ENDED' ? <VideoOff className="h-6 w-6" /> :
                   <Calendar className="h-6 w-6" />}
                </div>
                <div>
                  <h5 className="font-black text-bark text-lg leading-none group-hover:text-sage transition-colors">{meeting.title}</h5>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-tan/60">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{format(new Date(meeting.startTime), "MMM d, h:mm a")}</span>
                    </div>
                    {meeting.status === 'ONGOING' && (
                       <Badge className="bg-green-500 hover:bg-green-600 text-white border-none text-[8px] px-2 py-0.5 animate-pulse">Live Now</Badge>
                    )}
                    {meeting.status === 'ENDED' && (
                       <Badge className="bg-red-500 text-white border-none text-[8px] px-2 py-0.5">Ended</Badge>
                    )}
                    {meeting.status === 'CANCELLED' && (
                       <Badge className="bg-gray-500 text-white border-none text-[8px] px-2 py-0.5">Cancelled</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-12 w-12 rounded-xl text-tan/40 hover:text-bark hover:bg-tan/10 transition-all"
                 >
                    <ChevronRight className="h-5 w-5" />
                 </Button>
                 <Button 
                   onClick={() => joinMeeting(meeting._id, meeting.hostId === user?._id || meeting.host?._id === user?._id)}
                   disabled={meeting.status === 'ENDED' || meeting.status === 'CANCELLED'}
                   className={cn(
                     "h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg transition-all active:scale-95",
                     meeting.status === 'ONGOING' 
                        ? "bg-sage text-white shadow-sage/20 hover:bg-sage/90" 
                        : meeting.status === 'ENDED' || meeting.status === 'CANCELLED'
                        ? "bg-tan/20 text-tan/50 cursor-not-allowed shadow-none hover:bg-tan/20"
                        : "bg-bark text-white shadow-bark/20 hover:bg-bark/90"
                   )}
                 >
                   {meeting.status === 'ENDED' || meeting.status === 'CANCELLED' ? <VideoOff className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                   {meeting.status === 'ONGOING' ? "Join Now" : meeting.status === 'ENDED' ? "Ended" : meeting.status === 'CANCELLED' ? "Cancelled" : "Start Early"}
                 </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

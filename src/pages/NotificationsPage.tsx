import React, { useState, useMemo } from 'react';
import { useAppQuery, useAppMutation } from '@/hooks/useGraphQL';
import { GET_MY_NOTIFICATIONS } from '@/graphql/queries';
import { 
  MARK_NOTIFICATION_READ, 
  MARK_ALL_NOTIFICATIONS_READ,
  DELETE_NOTIFICATION,
  ACCEPT_PROJECT_INVITATION,
  REJECT_PROJECT_INVITATION,
  ACCEPT_WORKSPACE_INVITATION,
  REJECT_WORKSPACE_INVITATION
} from '@/graphql/mutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Bell, Check, X, Megaphone, Folder, Briefcase, 
  Video, CheckCircle2, MoreVertical, Trash2, 
  CheckCircle, Filter, Calendar
} from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function NotificationsPage() {
  const { data, loading, refetch } = useAppQuery(GET_MY_NOTIFICATIONS);
  const [markRead] = useAppMutation(MARK_NOTIFICATION_READ);
  const [markAllRead] = useAppMutation(MARK_ALL_NOTIFICATIONS_READ);
  const [deleteNotif] = useAppMutation(DELETE_NOTIFICATION);
  
  const [acceptProject] = useAppMutation(ACCEPT_PROJECT_INVITATION);
  const [rejectProject] = useAppMutation(REJECT_PROJECT_INVITATION);
  const [acceptWorkspace] = useAppMutation(ACCEPT_WORKSPACE_INVITATION);
  const [rejectWorkspace] = useAppMutation(REJECT_WORKSPACE_INVITATION);

  const [activeTab, setActiveTab] = useState('all');

  const notifications = (data as any)?.myNotifications || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'unread') return notifications.filter((n: any) => !n.isRead);
    if (activeTab === 'invites') return notifications.filter((n: any) => n.type.includes('INVITE'));
    if (activeTab === 'meetings') return notifications.filter((n: any) => n.type === 'MEETING_START');
    return notifications;
  }, [notifications, activeTab]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      refetch();
      toast.success("All notations marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleAction = async (notif: any, action: 'accept' | 'reject') => {
    try {
      if (notif.type === 'INVITE_PROJECT') {
        const projectId = notif.data.projectId;
        if (action === 'accept') {
          await acceptProject({ variables: { projectId } });
          toast.success(`Joined project ${notif.data.projectName}`);
        } else {
          await rejectProject({ variables: { projectId } });
          toast.info(`Declined project ${notif.data.projectName}`);
        }
      } else if (notif.type === 'INVITE_WORKSPACE') {
        const invitationId = notif.data.invitationId; 
        if (action === 'accept') {
          await acceptWorkspace({ variables: { invitationId } });
          toast.success(`Joined workspace ${notif.data.workspaceName}`);
        } else {
          await rejectWorkspace({ variables: { invitationId } });
          toast.info(`Declined workspace ${notif.data.workspaceName}`);
        }
      }
      
      // Mark notification as read after action
      await markRead({ variables: { id: notif._id } });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to process invitation");
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-12 w-48 bg-sand animate-pulse rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 w-full bg-sand/50 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-cream p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-bark tracking-tight flex items-center gap-3">
              Synchronization Center
              {unreadCount > 0 && (
                <Badge className="bg-sage text-white border-none px-3 py-1 shadow-lg shadow-sage/20">
                  {unreadCount} UNREAD
                </Badge>
              )}
            </h1>
            <p className="text-tan font-medium max-w-xl leading-relaxed">
              Stay synchronized with your team events, initiative invites, and real-time meeting alerts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="border-sand bg-white text-bark font-bold hover:bg-sand transition-all duration-300"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2 text-sage" />
              Clear All
            </Button>
            <Button className="bg-sage text-white font-black hover:opacity-90 transition-all duration-300 shadow-xl shadow-sage/20 border-none">
              <Filter className="h-4 w-4 mr-2" />
              Preferences
            </Button>
          </div>
        </header>

        {/* Tabs & Controls */}
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-sand/30 p-1 border border-sand h-auto flex flex-wrap gap-1 rounded-2xl">
              <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-bark text-tan font-bold px-4 py-2">All Alerts</TabsTrigger>
              <TabsTrigger value="unread" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-bark text-tan font-bold px-4 py-2">Unread Only</TabsTrigger>
              <TabsTrigger value="invites" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-bark text-tan font-bold px-4 py-2">Collaborations</TabsTrigger>
              <TabsTrigger value="meetings" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-bark text-tan font-bold px-4 py-2">Meetings</TabsTrigger>
            </TabsList>
            
            <div className="hidden md:flex items-center gap-2 text-tan text-xs font-black uppercase tracking-widest">
              <Calendar className="h-3 w-3" />
              Real-time Sync Active
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {filteredNotifications.length === 0 ? (
              <Card className="p-20 border-2 border-dashed border-sand bg-transparent flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 bg-sand/30 rounded-full flex items-center justify-center mb-6">
                  <Megaphone className="h-10 w-10 text-tan stroke-[1.5]" />
                </div>
                <h3 className="text-2xl font-black text-bark mb-2">Maximum Efficiency Achieved</h3>
                <p className="text-tan font-medium max-w-sm">No alerts currently require your attention. Your environment is perfectly synchronized.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notif: any) => (
                    <motion.div
                      key={notif._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className={cn(
                        "p-6 border-sand transition-all duration-300 group hover:shadow-2xl hover:shadow-bark/5 relative overflow-hidden",
                        !notif.isRead ? "bg-white border-sage/30 shadow-xl shadow-sage/5" : "bg-white/50"
                      )}>
                        {!notif.isRead && (
                          <div className="absolute top-0 left-0 bottom-0 w-1 bg-sage" />
                        )}
                        <div className="flex flex-col md:flex-row gap-6 md:items-center">
                          {/* Icon */}
                          <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                            notif.type === 'INVITE_PROJECT' ? "bg-orange-500 text-white shadow-orange-500/20" :
                            notif.type === 'INVITE_WORKSPACE' ? "bg-blue-500 text-white shadow-blue-500/20" :
                            notif.type === 'MEETING_START' ? "bg-green-500 text-white shadow-green-500/20" :
                            "bg-bark text-white"
                          )}>
                            {notif.type === 'INVITE_PROJECT' && <Folder className="h-7 w-7" />}
                            {notif.type === 'INVITE_WORKSPACE' && <Briefcase className="h-7 w-7" />}
                            {notif.type === 'MEETING_START' && <Video className="h-7 w-7" />}
                            {notif.type === 'TASK_ASSIGNED' && <CheckCircle2 className="h-7 w-7" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-tan">
                                {notif.type.replace('_', ' ')}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-sand" />
                              <span className="text-[10px] font-bold text-tan tabular-nums">
                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <h4 className="text-xl font-black text-bark leading-tight group-hover:text-sage transition-colors duration-300">
                              {notif.data?.message}
                            </h4>
                            <p className="text-tan font-medium">
                              From: {notif.data?.senderName || 'System Alert'}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3 shrink-0">
                            {notif.type.includes('INVITE') && (
                              <>
                                <Button 
                                  className="bg-bark text-white font-black hover:bg-sage transition-all duration-300 px-6 rounded-xl h-12 shadow-xl shadow-bark/10"
                                  onClick={() => handleAction(notif, 'accept')}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Confirm Access
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  className="text-tan font-black hover:text-red-500 hover:bg-red-50 rounded-xl px-4 h-12"
                                  onClick={() => handleAction(notif, 'reject')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            
                            {!notif.type.includes('INVITE') && (
                              <Button 
                                variant={notif.isRead ? "ghost" : "outline"}
                                className={cn(
                                  "font-black rounded-xl h-12 px-6",
                                  !notif.isRead ? "border-sage/30 text-sage hover:bg-sage/5" : "text-tan"
                                )}
                                onClick={() => markRead({ variables: { id: notif._id } }).then(() => refetch())}
                              >
                                {notif.isRead ? 'Archived' : 'Mark Reviewed'}
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-tan hover:text-bark">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-cream border-sand p-1 rounded-xl w-48 shadow-2xl">
                                <DropdownMenuItem 
                                  className="p-3 font-bold text-bark hover:bg-sand rounded-lg cursor-pointer flex items-center gap-3"
                                  onClick={() => deleteNotif({ variables: { id: notif._id } }).then(() => refetch())}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                  Erase Alert
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

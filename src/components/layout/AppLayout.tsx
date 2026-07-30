import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PageTransition } from "../PageTransition";
import { AnimatePresence } from "framer-motion";
import { QuickTaskOverlay } from "../QuickTaskOverlay";
import { MeetingRoom } from "../meeting/MeetingRoom";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/contexts/ChatContext";
import { ChatSidebar } from "../chat/ChatSidebar";
import { ChatBubble } from '../chat/ChatBubble';
import { useShortcuts } from "@/hooks/useShortcuts";
import { shortcutDefinitions } from "@/config/shortcuts";
import { CommandPalette } from "./CommandPalette";
import { useAppQuery } from "@/hooks/useGraphQL";
import { GET_MY_NOTIFICATIONS } from "@/graphql/queries";
import { toast } from "sonner";
import { Bell, Folder, Briefcase, Video, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

export function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleChat, setIsChatOpen } = useChat();
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastNotifId, setLastNotifId] = useState<string | null>(null);

  const { data: notifData } = useAppQuery(GET_MY_NOTIFICATIONS, {
    pollInterval: 10000, 
    skip: !isAuthenticated
  });

  useEffect(() => {
    const unread = (notifData as any)?.myNotifications?.filter((n: any) => !n.isRead) || [];
    if (unread.length > 0) {
      const latest = unread[0];
      if (latest._id !== lastNotifId) {
        setLastNotifId(latest._id);
        
        toast.custom((t) => (
          <div className="bg-white border-2 border-sage/20 p-4 rounded-2xl shadow-2xl shadow-bark/10 flex gap-4 items-center animate-in slide-in-from-right duration-500">
            <div className="h-10 w-10 rounded-xl bg-sage/10 text-sage flex items-center justify-center shrink-0">
              {latest.type === 'INVITE_PROJECT' && <Folder className="h-5 w-5" />}
              {latest.type === 'INVITE_WORKSPACE' && <Briefcase className="h-5 w-5" />}
              {latest.type === 'MEETING_START' && <Video className="h-5 w-5" />}
              {latest.type === 'TASK_ASSIGNED' && <CheckCircle2 className="h-5 w-5" />}
              {!['INVITE_PROJECT', 'INVITE_WORKSPACE', 'MEETING_START', 'TASK_ASSIGNED'].includes(latest.type) && <Bell className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-sage uppercase tracking-widest mb-0.5">Synchronization Alert</p>
              <p className="text-sm font-bold text-bark truncate">{latest.data?.message}</p>
            </div>
            <button 
              onClick={() => {
                navigate('/notifications');
                toast.dismiss(t);
              }}
              className="text-[10px] font-black text-bark uppercase tracking-widest bg-sand px-3 py-1.5 rounded-lg hover:bg-bark hover:text-white transition-all duration-300"
            >
              View
            </button>
          </div>
        ), { duration: 6000 });
      }
    }
  }, [notifData, lastNotifId, navigate]);

  // Global Shortcut Handlers
  const shortcutConfig = useMemo(() => shortcutDefinitions.map(def => ({
    ...def,
    action: () => {
      switch (def.action) {
        case 'SEARCH': setShowSearch(true); break;
        case 'HELP': navigate('/shortcuts'); break;
        case 'TOGGLE_SIDEBAR': setSidebarCollapsed(prev => !prev); break;
        case 'TOGGLE_ZEN': 
          setSidebarCollapsed(prev => !prev);
          setIsChatOpen(false);
          break;
        case 'GOTO_DASHBOARD': navigate('/dashboard'); break;
        case 'GOTO_WORKSPACES': navigate('/workspaces'); break;
        case 'GOTO_PROJECTS': navigate('/projects'); break;
        case 'GOTO_TASKS': navigate('/tasks'); break;
        case 'OPEN_SETTINGS': navigate('/settings'); break;
        case 'OPEN_PROFILE': navigate('/settings'); break;
        case 'NEW_TASK': navigate('/tasks'); break;
        case 'NEW_PROJECT': navigate('/projects'); break;
        case 'TOGGLE_CHAT': toggleChat(); break;
        case 'CLOSE_ALL': 
          setShowSearch(false);
          setIsChatOpen(false);
          break;
        case 'SWITCH_WORKSPACE_1': navigate('/workspaces'); break;
        default: break;
      }
    }
  })), [navigate, toggleChat, setIsChatOpen]);

  useShortcuts(shortcutConfig);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-sage animate-pulse shadow" />
          <p className="text-tan text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={setSidebarCollapsed} 
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-cream relative">
        <AnimatePresence mode="wait">
          <PageTransition 
            key={location.pathname} 
            className="min-h-full"
          >
            <Outlet />
          </PageTransition>
        </AnimatePresence>
        <QuickTaskOverlay />
      </main>
      
      <ChatSidebar />
      <ChatBubble />
      <MeetingRoom />
      
      <AnimatePresence>
        {showSearch && (
          <CommandPalette 
            isOpen={showSearch} 
            onClose={() => setShowSearch(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

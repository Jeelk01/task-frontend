import React, { useState, useEffect, useRef, useMemo } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAppQuery } from "@/hooks/useGraphQL";
import { GET_CHAT_HISTORY, GET_MY_WORKSPACES, GET_WORKSPACE_FOR_CHAT } from "@/graphql/queries";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, User,
  Circle, Hash, ChevronLeft, ChevronRight,
  MoreHorizontal, Plus, Loader2, ShieldCheck, ArrowRight, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getWorkspaceColorClasses } from "@/lib/workspace-utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from "lucide-react";
import type { PaginatedChatMessages, Workspace, PaginatedResponse } from "@/types";



const MessageItem = React.memo(({ msg, isMe, showAvatar, showDate }: any) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (msg.isSystemMessage) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="px-4 py-1.5 bg-sand/20 rounded-full border border-sand/30 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-tan" />
          <span className="text-[9px] font-black text-tan uppercase tracking-widest">{msg.content}</span>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      {showDate && (
        <div className="flex items-center gap-4 my-2">
          <div className="h-[1px] flex-1 bg-sand" />
          <span className="text-[10px] font-black text-tan/60 uppercase tracking-widest">
            {new Date(msg.createdAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <div className="h-[1px] flex-1 bg-sand" />
        </div>
      )}
      <div className={cn("flex flex-col group animate-in slide-in-from-bottom-2 duration-300 relative", isMe ? "items-end" : "items-start")}>
        {!isMe && showAvatar && (
          <span className="text-[10px] font-black text-tan/70 uppercase tracking-widest ml-11 mb-1.5">
            {msg.senderId?.name}
          </span>
        )}
        <div className={cn("flex gap-3 max-w-[90%] relative", isMe && "flex-row-reverse")}>
          {!isMe && (
            <div className="w-8 shrink-0">
              {showAvatar ? (
                <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm hover:scale-110 transition-transform">
                  <AvatarImage src={msg.senderId?.avatar} />
                  <AvatarFallback className="bg-sand text-bark text-[10px] font-bold">
                    {msg.senderId?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ) : <div className="w-8" />}
            </div>
          )}
          
          <div className="relative group/bubble flex flex-col items-start min-w-0">
            <div className={cn(
              "p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm transition-all prose prose-invert max-w-none",
              isMe 
                ? "bg-bark text-white rounded-tr-none" 
                : "bg-cream border border-sand rounded-tl-none text-bark prose-bark"
            )}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="m-0 inline-block">{children}</p>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className={cn("underline font-bold transition-all", isMe ? "text-sage-light hover:text-white" : "text-sage hover:text-sage-dark")}>
                      {children}
                    </a>
                  ),
                  code: ({ inline, children }: any) => (
                    <code className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-mono",
                      isMe ? "bg-white/10 text-sage-light" : "bg-bark/5 text-bark"
                    )}>
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="p-3 bg-black/20 rounded-xl overflow-x-auto my-2 text-[11px] font-mono border border-white/5">
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => <ul className="list-disc ml-4 my-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-4 my-2">{children}</ol>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
              
              <div className={cn(
                "flex items-center gap-1 text-[9px] mt-1.5 font-bold uppercase tracking-tighter opacity-40",
                isMe ? "justify-end" : "justify-start"
              )}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Copy Button Overlay */}
            <button
              onClick={handleCopy}
              className={cn(
                "absolute -top-2 -right-2 p-1.5 rounded-lg border shadow-sm opacity-0 group-hover/bubble:opacity-100 transition-all transform scale-90 hover:scale-100",
                isMe 
                  ? "bg-bark text-white border-white/20" 
                  : "bg-white text-bark border-sand"
              )}
            >
              {copied ? <Check className="h-3 w-3 text-sage" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
});

const TypingIndicator = () => {
  const { typingUsers } = useChat();
  const activeTypingCount = Object.values(typingUsers).filter(Boolean).length;

  if (activeTypingCount === 0) return null;

  return (
    <div className="flex items-center gap-3 text-[10px] font-bold text-tan ml-11 py-2">
      <div className="flex gap-1.5">
        <span className="h-1.5 w-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="uppercase tracking-widest animate-pulse">Team is typing...</span>
    </div>
  );
};

export function ChatSidebar() {
  const { user } = useAuth();
  const { 
    allMessages, 
    sendMessage, 
    sendTyping, 
    typingUsers, 
    joinWorkspace, 
    isConnected, 
    isChatOpen, 
    setIsChatOpen,
    loadingHistory,
    onlineUsers,
    loadMoreMessages,
    hasMoreMessages,
    workspaceRole,
  } = useChat();
  
  const [input, setInput] = useState("");
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { data: workspacesData } = useAppQuery<{ findMyWorkspaces: PaginatedResponse<Workspace> }>(
    GET_MY_WORKSPACES,
    { variables: { args: { page: 1, limit: 100 } } }
  );

  const workspaces = workspacesData?.findMyWorkspaces?.items ?? [];

  // Extract workspaceId from URL or auto-select
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let wsId = params.get("workspaceId");

    // If on a project page, we might need to find the workspace from the project
    // However, the project query in ProjectDetailPage already has the workspace info.
    // For now, let's prioritize URL params, then fallback to last joined.
    
    if (wsId) {
      if (wsId !== currentWorkspaceId) {
        setCurrentWorkspaceId(wsId);
        joinWorkspace(wsId);
        localStorage.setItem('lastChatWorkspaceId', wsId);
      }
    } else {
      const savedId = localStorage.getItem('lastChatWorkspaceId');
      if (savedId && !currentWorkspaceId) {
        setCurrentWorkspaceId(savedId);
        joinWorkspace(savedId);
      }
    }
  }, [location.search, joinWorkspace, currentWorkspaceId]);

  // Fetch current workspace info (still needed for the Info panel)
  const { data: workspaceData } = useAppQuery<{ findWorkspaceById: Workspace }>(
    GET_WORKSPACE_FOR_CHAT,
    {
      variables: { id: currentWorkspaceId },
      skip: !currentWorkspaceId || !showInfo,
    }
  );

  const activeTypingCount = Object.values(typingUsers).filter(Boolean).length;
  const lastScrollHeight = useRef<number>(0);
  const isAutoScrolling = useRef<boolean>(false);

  // Scroll to bottom on open or new message (if near bottom)
  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    
    // If messages length changed, check if we should scroll
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    const lastMsgIsMe = allMessages[allMessages.length - 1]?.senderId?._id === user?._id;

    if (isAtBottom || lastMsgIsMe || isChatOpen || activeTypingCount > 0) {
      isAutoScrolling.current = true;
      container.scrollTop = container.scrollHeight;
      setTimeout(() => { isAutoScrolling.current = false; }, 100);
    }
  }, [allMessages.length, isChatOpen, user?._id, activeTypingCount]);

  // Preserve scroll on pagination
  useEffect(() => {
    if (!loadingHistory && scrollRef.current && lastScrollHeight.current > 0) {
      const container = scrollRef.current;
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - lastScrollHeight.current;
      lastScrollHeight.current = 0;
    }
  }, [loadingHistory]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop === 0 && hasMoreMessages && !loadingHistory) {
      lastScrollHeight.current = container.scrollHeight;
      loadMoreMessages();
    }
  };

  // Keyboard shortcut (Ctrl + J)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsChatOpen(!isChatOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, setIsChatOpen]);

  const handleSend = () => {
    if (input.trim() && currentWorkspaceId) {
      sendMessage(currentWorkspaceId, input.trim());
      setInput("");
      sendTyping(currentWorkspaceId, false);
    }
  };



  if (!user) return null;

  return (
    <>
      {/* Side Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-screen w-[400px] bg-white border-l border-sand shadow-2xl z-[60] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-sand flex items-center justify-between bg-cream/40 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-sage text-white flex items-center justify-center shadow-accent cursor-pointer" onClick={() => setShowInfo(!showInfo)}>
                  {showInfo ? <ArrowRight className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-black text-bark leading-none text-base">
                    {showInfo ? "Workspace Info" : "Workspace Chat"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Circle className={cn("h-2 w-2 fill-current", isConnected ? "text-green-500" : "text-red-500")} />
                    <span className="text-[10px] font-black text-tan uppercase tracking-[0.1em]">
                      {isConnected ? "Live Connection" : "Reconnecting..."}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowInfo(!showInfo)} 
                  className={cn("text-tan hover:text-bark hover:bg-sand rounded-xl h-10 w-10 transition-all", showInfo && "bg-sand text-bark")}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsChatOpen(false)} 
                  className="text-tan hover:text-bark hover:bg-sand rounded-xl h-10 w-10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-white shadow-inner relative">
              <AnimatePresence mode="wait">
                {showInfo ? (
                  <motion.div 
                    key="info"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 p-8 overflow-y-auto space-y-8 bg-cream/20"
                  >
                    <div className="space-y-4">
                      <div className="text-center space-y-2">
                        <h4 className="text-xl font-black text-bark">{workspaceData?.findWorkspaceById?.name}</h4>
                        <p className="text-xs text-tan font-medium px-4">{workspaceData?.findWorkspaceById?.description}</p>
                      </div>
                      <div className="h-[1px] bg-sand/50 mx-4" />
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-tan uppercase tracking-[0.2em] flex justify-between items-center">
                        Active Members
                        <span className="bg-sand px-2 py-0.5 rounded-full text-[8px]">{workspaceData?.findWorkspaceById?.memberUsers?.length ?? 0}</span>
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {workspaceData?.findWorkspaceById?.memberUsers?.map((member: any) => (
                          <div key={member._id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-sand shadow-sm hover:border-sage transition-colors group">
                            <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm group-hover:scale-105 transition-transform">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-cream text-bark font-bold text-[10px]">{member.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                             <div className="flex-1">
                              <p className="text-sm font-bold text-bark leading-none">{member.name}</p>
                              <p className="text-[9px] text-tan uppercase tracking-widest mt-1">Workspace Member</p>
                            </div>
                            <div className={cn(
                              "h-1.5 w-1.5 rounded-full transition-all duration-500",
                              onlineUsers.has(member._id) 
                                ? "bg-green-500 shadow-lg shadow-green-200 scale-125" 
                                : "bg-sand border border-sand-dark opacity-30"
                            )} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-tan uppercase tracking-[0.2em]">Security & Status</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-sand shadow-sm space-y-1">
                          <ShieldCheck className="h-4 w-4 text-sage mb-1" />
                          <p className="text-[10px] font-bold text-bark uppercase">JWT Encrypted</p>
                          <p className="text-[8px] text-tan uppercase">End-to-end secure</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-sand shadow-sm space-y-1">
                          <Circle className={cn("h-4 w-4 mb-1", isConnected ? "text-green-500" : "text-red-500")} />
                          <p className="text-[10px] font-bold text-bark uppercase">{isConnected ? "Connected" : "Offline"}</p>
                          <p className="text-[8px] text-tan uppercase">Port 4001 Socket</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-bark text-white rounded-[2rem] shadow-xl text-center space-y-3">
                      <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
                        <User className="h-6 w-6 text-tan" />
                      </div>
                      <h5 className="font-bold">Team Performance</h5>
                      <p className="text-[10px] text-white/50 leading-relaxed italic">
                        "Great things in business are never done by one person. They're done by a team of people."
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    {!currentWorkspaceId ? (
                      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                        <div className="text-center space-y-4 mb-8">
                          <div className="h-20 w-20 rounded-[2.5rem] bg-cream flex items-center justify-center text-tan mx-auto">
                            <MessageSquare className="h-10 w-10" />
                          </div>
                          <div>
                            <h4 className="font-black text-bark text-xl">Selective Hub</h4>
                            <p className="text-sm text-tan font-medium mt-1">Select a workspace to join the team conversation</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-black text-tan uppercase tracking-widest mb-4">Your Workspaces</h5>
                          {workspaces.map(ws => (
                            <button
                              key={ws._id}
                              onClick={() => {
                                setCurrentWorkspaceId(ws._id);
                                joinWorkspace(ws._id);
                                localStorage.setItem('lastChatWorkspaceId', ws._id);
                              }}
                              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-cream/50 border border-sand hover:bg-white hover:border-sage hover:shadow-md transition-all group"
                            >
                              <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center font-black transition-all",
                                getWorkspaceColorClasses(ws).bg,
                                getWorkspaceColorClasses(ws).text,
                                "group-hover:bg-sage group-hover:text-white"
                              )}>
                                {ws.name.charAt(0)}
                              </div>
                              <div className="text-left overflow-hidden">
                                <h4 className="font-bold text-bark text-sm truncate">{ws.name}</h4>
                                <p className="text-[10px] text-tan font-bold uppercase">{ws.members?.length ?? 0} Members</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div 
                          ref={scrollRef} 
                          onScroll={handleScroll}
                          className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth custom-scrollbar"
                        >
                          {loadingHistory && (
                            <div className="flex items-center justify-center py-10">
                              <Loader2 className="h-8 w-8 animate-spin text-sage/40" />
                            </div>
                          )}

                          {!isConnected && (
                            <div className="mx-2 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-pulse">
                              <X className="h-4 w-4 text-red-500" />
                              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Connection lost. Retrying...</p>
                            </div>
                          )}

                          {!loadingHistory && allMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-tan/40">
                              <MessageSquare className="h-12 w-12 mb-2 opacity-10" />
                              <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
                            </div>
                          )}

                          {allMessages.map((msg, i) => {
                            const isMe = msg.senderId?._id === user._id;
                            const showAvatar = i === 0 || allMessages[i-1].senderId?._id !== msg.senderId?._id;
                            const showDate = i === 0 || new Date(allMessages[i-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                            return (
                              <MessageItem 
                                key={msg._id} 
                                msg={msg} 
                                isMe={isMe} 
                                showAvatar={showAvatar} 
                                showDate={showDate} 
                              />
                            );
                          })}

                          <TypingIndicator />
                        </div>

                        {/* Input Area */}
                        <div className="p-5 bg-cream/20 border-t border-sand backdrop-blur-md">
                          <div className="relative group flex items-end gap-3">
                            <div className="flex-1 relative">
                              <Input
                                placeholder={workspaceRole === 'VIEWER' ? "View only mode" : "Type your message..."}
                                value={input}
                                disabled={workspaceRole === 'VIEWER'}
                                onChange={(e) => {
                                  if (workspaceRole === 'VIEWER') return;
                                  setInput(e.target.value);
                                  if (currentWorkspaceId) sendTyping(currentWorkspaceId, e.target.value.length > 0);
                                }}
                                onKeyDown={(e) => e.key === "Enter" && workspaceRole !== 'VIEWER' && handleSend()}
                                className="pr-20 min-h-[52px] bg-white border-sand focus:border-sage rounded-2xl shadow-sm transition-all text-sm py-4 disabled:opacity-50 disabled:bg-sand/10"
                              />
                              <button 
                                onMouseEnter={() => setShowGuide(true)}
                                onMouseLeave={() => setShowGuide(false)}
                                onClick={() => setShowGuide(!showGuide)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-tan hover:text-bark transition-colors p-1"
                              >
                                <HelpCircle className="h-4 w-4" />
                              </button>
                              
                              <AnimatePresence>
                                {showGuide && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full right-0 mb-4 w-64 bg-bark text-white p-5 rounded-3xl shadow-2xl z-50 border border-white/10 backdrop-blur-xl"
                                  >
                                    <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                                      <div className="h-5 w-5 rounded-lg bg-sage/20 flex items-center justify-center">
                                        <HelpCircle className="h-3 w-3 text-sage-light" />
                                      </div>
                                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-tan">Markdown Styling</h5>
                                    </div>
                                    <div className="grid grid-cols-1 gap-y-2.5 text-[10px] font-bold">
                                      <div className="flex justify-between items-center group/item hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                                        <span className="text-white/90">**Bold**</span>
                                        <span className="text-tan/40 font-mono text-[9px]">**text**</span>
                                      </div>
                                      <div className="flex justify-between items-center group/item hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                                        <span className="text-white/90">*Italic*</span>
                                        <span className="text-tan/40 font-mono text-[9px]">*text*</span>
                                      </div>
                                      <div className="flex justify-between items-center group/item hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                                        <span className="text-white/90">`Inline Code`</span>
                                        <span className="text-tan/40 font-mono text-[9px]">`text`</span>
                                      </div>
                                      <div className="flex justify-between items-center group/item hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                                        <span className="text-white/90">~~Strikethrough~~</span>
                                        <span className="text-tan/40 font-mono text-[9px]">~~text~~</span>
                                      </div>
                                      <div className="flex justify-between items-center group/item hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                                        <span className="text-white/90">[Project Link]</span>
                                        <span className="text-tan/40 font-mono text-[9px]">(url)</span>
                                      </div>
                                      <div className="flex justify-between items-center group/item hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                                        <span className="text-white/90">- Bullet List</span>
                                        <span className="text-tan/40 font-mono text-[9px]">- item</span>
                                      </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-white/10 text-center">
                                      <p className="text-[8px] text-tan/40 uppercase tracking-widest leading-relaxed">
                                        Use these shortcuts for a faster workflow
                                      </p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <Button
                              size="icon"
                              disabled={!input.trim() || !isConnected || workspaceRole === 'VIEWER'}
                              onClick={handleSend}
                              className={cn(
                                "h-[52px] w-[52px] rounded-2xl transition-all shadow-accent shrink-0",
                                input.trim() && isConnected && workspaceRole !== 'VIEWER' ? "bg-sage hover:bg-sage-dark text-white scale-100" : "bg-sand text-tan scale-95 opacity-50"
                              )}
                            >
                              <Send className="h-5 w-5" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-tan mt-3 text-center font-bold uppercase tracking-widest opacity-40">
                            {workspaceRole === 'VIEWER' ? "Interaction restricted in View Mode" : "Press Enter to Send"}
                          </p>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

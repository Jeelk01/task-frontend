import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
     LayoutDashboard, Briefcase, Laptop2, Settings, Users,
     CreditCard, Shield, LogOut, ChevronLeft, ChevronRight,
     CheckCircle2, Folder, MessageSquare, Bell,
     Check, X, Megaphone, Video
} from "lucide-react";
import { 
     Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger 
} from "@/components/ui/sheet";
import { useAppQuery, useAppMutation } from "@/hooks/useGraphQL";
import { GET_MY_NOTIFICATIONS } from "@/graphql/queries";
import { MARK_NOTIFICATION_READ, DELETE_NOTIFICATION } from "@/graphql/mutations";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import {
     DropdownMenu, DropdownMenuContent, DropdownMenuSeparator,
     DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
     label: string;
     path: string;
     icon: React.ComponentType<{ className?: string }>;
     adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
     { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
     { label: "Workspaces", path: "/workspaces", icon: Briefcase },
     { label: "Projects", path: "/projects", icon: Folder }, 
     { label: "Tasks", path: "/tasks", icon: CheckCircle2 },
     { label: "Notations", path: "/notifications", icon: Bell },
     { label: "Chat", path: "/chat", icon: MessageSquare }, // Note: We might not need a full page, but a way to trigger the sidebar
     { label: "Settings", path: "/settings", icon: Settings },
];

const ADMIN_ITEMS: NavItem[] = [
     { label: "Users", path: "/admin/users", icon: Users, adminOnly: true },
     { label: "Memberships", path: "/admin/memberships", icon: Shield, adminOnly: true },
     { label: "Subscriptions", path: "/admin/subscriptions", icon: CreditCard, adminOnly: true },
];

interface SidebarProps {
     collapsed: boolean;
     onToggle: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
     const { user, logout, hasRole } = useAuth();
     const location = useLocation();
     const isAdmin = hasRole(["ADMIN"]);
     const navigate = useNavigate();

     const { data: notifData, refetch: refetchNotifs } = useAppQuery(GET_MY_NOTIFICATIONS, {
          pollInterval: 30000, // Poll every 30s
     });
     const [markRead] = useAppMutation(MARK_NOTIFICATION_READ);

     const unreadCount = (notifData as any)?.myNotifications?.filter((n: any) => !n.isRead)?.length || 0;

     const NavEntry = ({ item }: { item: NavItem }) => {
          const { toggleChat, isChatOpen } = useChat();
          const isActive = item.label === "Chat" ? isChatOpen : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          const baseStyles = cn(
               "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left",
               isActive
                    ? "bg-sage text-white shadow-sm"
                    : "text-tan hover:text-bark hover:bg-sand"
          );

          if (item.label === "Chat") {
               const content = (
                    <button onClick={toggleChat} className={baseStyles}>
                         <Icon className="h-4 w-4 flex-shrink-0" />
                         {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
               );

               if (collapsed) {
                    return (
                         <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>{content}</TooltipTrigger>
                              <TooltipContent side="right">Chat</TooltipContent>
                         </Tooltip>
                    );
               }
               return content;
          }

          const content = (
               <Link
                    to={item.path}
                    className={baseStyles}
               >
                    <div className="relative">
                         <Icon className="h-4 w-4 flex-shrink-0" />
                         {item.label === "Notations" && unreadCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 h-3 w-3 bg-red-500 rounded-full border-2 border-cream ring-1 ring-red-500/20" />
                         )}
                    </div>
                    {!collapsed && (
                         <div className="flex-1 flex items-center justify-between min-w-0">
                              <span className="truncate">{item.label}</span>
                              {item.label === "Notations" && unreadCount > 0 && (
                                   <Badge className="bg-white/20 text-white border-none h-4 px-1 text-[8px] font-black">
                                        {unreadCount}
                                   </Badge>
                              )}
                         </div>
                    )}
               </Link>
          );

          if (collapsed) {
               return (
                    <Tooltip delayDuration={0}>
                         <TooltipTrigger asChild>{content}</TooltipTrigger>
                         <TooltipContent side="right" className="bg-bark text-cream border-sand">
                              {item.label}
                         </TooltipContent>
                    </Tooltip>
               );
          }
          return content;
     };

     return (
          <aside
               className={cn(
                    "flex flex-col h-screen bg-cream border-r border-sand transition-all duration-300",
                    collapsed ? "w-16" : "w-60"
               )}
          >
               {/* Logo */}
               <div className="flex items-center justify-between px-4 py-5 border-b border-sand">
                    {!collapsed && (
                         <Link to="/dashboard" className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-sage flex items-center justify-center shadow">
                                   <span className="text-white font-bold text-sm">S</span>
                              </div>
                              <span className="text-bark font-bold text-base tracking-tight">Structo</span>
                         </Link>
                    )}
                    {collapsed && (
                         <div className="mx-auto h-8 w-8 rounded-lg bg-sage flex items-center justify-center shadow">
                              <span className="text-white font-bold text-sm">S</span>
                         </div>
                    )}
                    <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => onToggle(!collapsed)}
                         className={cn("h-7 w-7 text-tan hover:text-bark hover:bg-sand", collapsed && "mx-auto")}
                    >
                         {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
               </div>

               {/* Main Nav */}
               <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {!collapsed && (
                         <p className="text-xs font-semibold text-tan uppercase px-3 mb-2 tracking-wider">
                              Menu
                         </p>
                    )}
                    {NAV_ITEMS.map((item) => (
                         item.label === "Notations" ? (
                              <Sheet key={item.path}>
                                   <SheetTrigger asChild>
                                        <button className={cn(
                                             "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left",
                                             location.pathname === "/notifications" ? "bg-sage text-white shadow-sm" : "text-tan hover:text-bark hover:bg-sand"
                                        )}>
                                             <div className="relative">
                                                  <item.icon className="h-4 w-4 flex-shrink-0" />
                                                  {unreadCount > 0 && (
                                                       <span className="absolute -top-1.5 -right-1.5 h-3 w-3 bg-red-500 rounded-full border-2 border-cream ring-1 ring-red-500/20" />
                                                  )}
                                             </div>
                                             {!collapsed && (
                                                  <div className="flex-1 flex items-center justify-between min-w-0">
                                                       <span className="truncate">{item.label}</span>
                                                       {unreadCount > 0 && (
                                                            <Badge className="bg-sage/20 text-sage border-none h-4 px-1.5 text-[8px] font-black">
                                                                 {unreadCount}
                                                            </Badge>
                                                       )}
                                                  </div>
                                             )}
                                        </button>
                                   </SheetTrigger>
                                    <SheetContent side="left" className="w-[400px] p-0 bg-cream border-sand shadow-2xl flex flex-col">
                                         <SheetHeader className="p-6 border-b border-sand bg-white/50 backdrop-blur-xl">
                                              <div className="flex items-center justify-between">
                                                   <SheetTitle className="text-xl font-black text-bark tracking-tight flex items-center gap-2">
                                                        <Bell className="h-5 w-5 text-sage" />
                                                        Notations
                                                        {unreadCount > 0 && (
                                                             <Badge className="bg-sage text-white border-none ml-2">
                                                                  {unreadCount} New
                                                             </Badge>
                                                        )}
                                                   </SheetTitle>
                                                   <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-[10px] font-bold text-tan uppercase tracking-widest hover:text-bark"
                                                        onClick={() => navigate('/notifications')}
                                                   >
                                                        View All
                                                   </Button>
                                              </div>
                                         </SheetHeader>

                                         <div className="flex-1 overflow-y-auto">
                                              {(notifData as any)?.myNotifications?.length === 0 ? (
                                                   <div className="flex flex-col items-center justify-center h-64 opacity-40">
                                                        <Megaphone className="h-12 w-12 text-tan mb-4 stroke-[1.5]" />
                                                        <p className="text-bark font-bold text-sm">Quiet for now...</p>
                                                        <p className="text-tan text-[10px] uppercase font-black tracking-widest mt-1">No new synchronization alerts</p>
                                                   </div>
                                              ) : (
                                                   <div className="divide-y divide-sand/50">
                                                        {((notifData as any)?.myNotifications || []).map((notification: any) => (
                                                             <div 
                                                                  key={notification._id} 
                                                                  className={cn(
                                                                       "p-4 transition-all duration-300 hover:bg-sand/30 cursor-pointer relative group",
                                                                       !notification.isRead && "bg-sage/5"
                                                                  )}
                                                                  onClick={() => {
                                                                       if (!notification.isRead) {
                                                                            markRead({ variables: { id: notification._id } });
                                                                       }
                                                                  }}
                                                             >
                                                                  <div className="flex gap-4">
                                                                       <div className={cn(
                                                                            "h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                                                            notification.type === 'INVITE_PROJECT' ? "bg-orange-100 text-orange-600" :
                                                                            notification.type === 'INVITE_WORKSPACE' ? "bg-blue-100 text-blue-600" :
                                                                            notification.type === 'MEETING_START' ? "bg-green-100 text-green-600" :
                                                                            "bg-sand text-tan"
                                                                       )}>
                                                                            {notification.type === 'INVITE_PROJECT' && <Folder className="h-5 w-5" />}
                                                                            {notification.type === 'INVITE_WORKSPACE' && <Briefcase className="h-5 w-5" />}
                                                                            {notification.type === 'MEETING_START' && <Video className="h-5 w-5" />}
                                                                            {notification.type === 'TASK_ASSIGNED' && <CheckCircle2 className="h-5 w-5" />}
                                                                       </div>
                                                                       <div className="flex-1 min-w-0">
                                                                            <div className="flex justify-between items-start mb-1">
                                                                                 <p className="text-[10px] font-black uppercase tracking-widest text-tan">
                                                                                      {notification.type.replace('_', ' ')}
                                                                                 </p>
                                                                                 <span className="text-[10px] text-tan tabular-nums">
                                                                                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                                                 </span>
                                                                            </div>
                                                                            <p className="text-sm font-bold text-bark line-clamp-2 leading-tight">
                                                                                 {notification.data?.message}
                                                                            </p>
                                                                            
                                                                            {!notification.isRead && (
                                                                                 <div className="absolute top-4 right-4 h-2 w-2 bg-sage rounded-full shadow-[0_0_10px_rgba(78,91,82,0.5)]" />
                                                                            )}
                                                                       </div>
                                                                  </div>
                                                             </div>
                                                        ))}
                                                   </div>
                                              )}
                                         </div>

                                         <div className="p-4 border-t border-sand bg-white/30 backdrop-blur-md">
                                              <Button 
                                                   variant="outline" 
                                                   className="w-full border-sand bg-white/50 text-bark font-bold hover:bg-white transition-all duration-300"
                                                   onClick={() => navigate('/notifications')}
                                              >
                                                   Open Command Center
                                              </Button>
                                         </div>
                                    </SheetContent>
                               </Sheet>
                         ) : (
                              <NavEntry key={item.path} item={item} />
                         )
                    ))}

                    {isAdmin && (
                         <>
                              <div className="pt-4 pb-1">
                                   {!collapsed && (
                                        <p className="text-xs font-semibold text-tan uppercase px-3 mb-2 tracking-wider">
                                             Admin
                                        </p>
                                   )}
                                   {collapsed && <div className="border-t border-sand mb-2" />}
                              </div>
                              {ADMIN_ITEMS.map((item) => <NavEntry key={item.path} item={item} />)}
                         </>
                    )}
               </nav>

               {/* User Footer */}
               <div className="px-3 pb-4 border-t border-sand pt-3">
                    <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                              <Button
                                   variant="ghost"
                                   className={cn(
                                        "w-full text-left text-bark hover:bg-sand",
                                        collapsed ? "px-2 justify-center" : "px-2 justify-start gap-3"
                                   )}
                              >
                                   <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarFallback className="bg-sage text-white text-xs font-bold ring-2 ring-white">
                                             {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                                        </AvatarFallback>
                                   </Avatar>
                                   {!collapsed && (
                                        <div className="min-w-0">
                                             <p className="text-sm font-medium text-bark truncate">{user?.name}</p>
                                             <p className="text-xs text-tan truncate">{user?.email}</p>
                                        </div>
                                   )}
                              </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent side="right" align="end" className="w-52 bg-cream border-sand">
                              <div className="px-3 py-2">
                                   <p className="text-sm font-medium text-bark">{user?.name}</p>
                                   <p className="text-xs text-tan">{user?.email}</p>
                                   <span className="inline-flex mt-1 text-xs bg-sage/10 text-sage px-2 py-0.5 rounded-full font-medium">
                                        {user?.role}
                                   </span>
                              </div>
                              <DropdownMenuSeparator className="bg-sand" />
                              <DropdownMenuItem asChild className="text-bark hover:bg-sand cursor-pointer">
                                   <Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="text-bark hover:bg-sand cursor-pointer">
                                   <Link to="/devices"><Laptop2 className="mr-2 h-4 w-4" />My Devices</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-sand" />
                              <DropdownMenuItem
                                   onClick={logout}
                                   className="text-red-600 hover:bg-red-50 cursor-pointer"
                              >
                                   <LogOut className="mr-2 h-4 w-4" />Log out
                              </DropdownMenuItem>
                         </DropdownMenuContent>
                    </DropdownMenu>
               </div>
               
          </aside>
     );
}

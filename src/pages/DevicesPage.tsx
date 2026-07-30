import { useAuth } from "@/contexts/AuthContext";
import { useAppQuery, useAppMutation } from "@/hooks/useGraphQL";
import { GET_MY_DEVICES } from "@/graphql/queries";
import { LOGOUT_DEVICE, LOGOUT_ALL_DEVICES_EXCEPT_CURRENT, BLOCK_MY_DEVICE } from "@/graphql/mutations";
import { motion } from "framer-motion";
import {
     Laptop2, Smartphone, Monitor, Globe,
     LogOut, Loader2, RefreshCw, Clock, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
     AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
     AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
     AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Device } from "@/types";

function getDeviceIcon(ua?: string) {
     if (!ua) return Monitor;
     const l = ua.toLowerCase();
     if (l.includes("mobile") || l.includes("android") || l.includes("iphone")) return Smartphone;
     return Laptop2;
}

function getBrowserLabel(ua?: string) {
     if (!ua) return "Unknown browser";
     if (ua.includes("Chrome")) return "Chrome";
     if (ua.includes("Firefox")) return "Firefox";
     if (ua.includes("Safari")) return "Safari";
     if (ua.includes("Edge")) return "Edge";
     return "Browser";
}

function formatDate(dt: string) {
     return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dt));
}

export default function DevicesPage() {
     const { deviceInfo } = useAuth();
     const currentDeviceId = deviceInfo.deviceId;

     const { data, loading, refetch } = useAppQuery<{ findMyDevices: { devices: Device[] } }>(GET_MY_DEVICES);
     const devices = data?.findMyDevices?.devices ?? [];

     const [logoutDevice] = useAppMutation(LOGOUT_DEVICE, {
          successMessage: "Device logged out",
          onCompleted: () => refetch(),
     });

     const [logoutAllExcept, { loading: logoutAllLoading }] = useAppMutation(LOGOUT_ALL_DEVICES_EXCEPT_CURRENT, {
          successMessage: "All other devices logged out",
          onCompleted: () => refetch(),
     });

     const [blockDevice] = useAppMutation(BLOCK_MY_DEVICE, {
          successMessage: "Device blocked",
          onCompleted: () => refetch(),
     });

     const activeDevices = devices.filter((d) => !d.isRevoked && !d.isBlocked);
     const otherDevices = devices.filter((d) => d.deviceId !== currentDeviceId);

     return (
          <div className="p-6 space-y-8">
               {/* Header */}
               <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
               >
                    <div>
                         <h1 className="text-2xl font-bold text-bark flex items-center gap-2">
                              <Laptop2 className="h-6 w-6 text-sage" />
                              My Devices
                         </h1>
                         <p className="text-tan text-sm mt-1">
                              Manage active sessions. You have{" "}
                              <span className="text-sage font-medium">{activeDevices.length}</span>{" "}
                              active session{activeDevices.length !== 1 ? "s" : ""}.
                         </p>
                    </div>

                    <div className="flex gap-2">
                         <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refetch()}
                              className="border-sand text-bark hover:text-sage hover:border-sage/40"
                         >
                              <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
                              Refresh
                         </Button>
                         {otherDevices.filter((d) => !d.isRevoked).length > 0 && (
                              <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                        <Button
                                             variant="outline"
                                             size="sm"
                                             disabled={logoutAllLoading}
                                             className="border-red-300 text-red-500 hover:bg-red-50"
                                        >
                                             <LogOut className="h-4 w-4 mr-1.5" />
                                             Log out all others
                                        </Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent className="bg-white border-sand text-bark">
                                        <AlertDialogHeader>
                                             <AlertDialogTitle className="text-bark">Log out all other devices?</AlertDialogTitle>
                                             <AlertDialogDescription className="text-tan">
                                                  This will end all sessions except your current device.
                                             </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                             <AlertDialogCancel className="border-sand text-bark hover:bg-sand">Cancel</AlertDialogCancel>
                                             <AlertDialogAction
                                                  onClick={() => logoutAllExcept({ variables: {} })}
                                                  className="bg-red-500 hover:bg-red-600 text-white"
                                             >
                                                  Log out all
                                             </AlertDialogAction>
                                        </AlertDialogFooter>
                                   </AlertDialogContent>
                              </AlertDialog>
                         )}
                    </div>
               </motion.div>

               {/* Device Grid */}
               {loading ? (
                    <div className="flex items-center justify-center py-20">
                         <Loader2 className="h-8 w-8 text-sage animate-spin" />
                    </div>
               ) : devices.length === 0 ? (
                    <div className="text-center py-20 text-tan">
                         <Laptop2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                         <p className="text-sm">No device sessions found.</p>
                    </div>
               ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                         {devices.map((device, i) => {
                              const Icon = getDeviceIcon(device.userAgent);
                              const isCurrent = device.deviceId === currentDeviceId;

                              return (
                                   <motion.div
                                        key={device._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className={cn(
                                             "bg-white border rounded-2xl p-5 transition-all duration-200",
                                             isCurrent ? "border-sage/50 shadow-sm" : "border-sand hover:border-sage/30",
                                             device.isBlocked && "opacity-60"
                                        )}
                                   >
                                        {/* Card header */}
                                        <div className="flex items-start justify-between mb-4">
                                             <div className={cn(
                                                  "h-11 w-11 rounded-xl flex items-center justify-center",
                                                  isCurrent ? "bg-sage/10 border border-sage/20" : "bg-sand"
                                             )}>
                                                  <Icon className={cn("h-5 w-5", isCurrent ? "text-sage" : "text-tan")} />
                                             </div>
                                             <div className="flex items-center gap-2">
                                                  {isCurrent && (
                                                       <Badge className="bg-sage/10 text-sage border-sage/20 text-xs">Current</Badge>
                                                  )}
                                                  {device.isBlocked && <Badge className="bg-red-50 text-red-500 border-red-200 text-xs">Blocked</Badge>}
                                                  {device.isRevoked && <Badge className="bg-sand text-tan border-sand-dark text-xs">Revoked</Badge>}
                                                  {!device.isBlocked && !device.isRevoked && !isCurrent && (
                                                       <Badge className="bg-sage/10 text-sage border-sage/20 text-xs">Active</Badge>
                                                  )}
                                             </div>
                                        </div>

                                        {/* Device info */}
                                        <div className="space-y-1 mb-4">
                                             <p className="font-semibold text-bark text-sm">
                                                  {device.deviceName ?? getBrowserLabel(device.userAgent)}
                                             </p>
                                             <p className="text-xs text-tan flex items-center gap-1.5">
                                                  <Globe className="h-3 w-3" />
                                                  {getBrowserLabel(device.userAgent)}
                                             </p>
                                             <p className="text-xs text-tan/70 flex items-center gap-1.5">
                                                  <Clock className="h-3 w-3" />
                                                  {device.lastLoginAt ? formatDate(device.lastLoginAt) : formatDate(device.createdAt)}
                                             </p>
                                        </div>

                                        {/* Actions — only for non-current, non-revoked devices */}
                                        {!isCurrent && !device.isRevoked && (
                                             <div className="flex gap-2 pt-3 border-t border-sand">
                                                  <Button
                                                       size="sm"
                                                       variant="outline"
                                                       onClick={() => logoutDevice({ variables: { input: { deviceId: device.deviceId } } })}
                                                       className="flex-1 border-red-300 text-red-500 hover:bg-red-50 text-xs"
                                                  >
                                                       <LogOut className="h-3 w-3 mr-1" />Log out
                                                  </Button>
                                                  {!device.isBlocked && (
                                                       <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => blockDevice({ variables: { input: { deviceId: device.deviceId } } })}
                                                            className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50 text-xs"
                                                       >
                                                            <Ban className="h-3 w-3 mr-1" />Block
                                                       </Button>
                                                  )}
                                             </div>
                                        )}
                                   </motion.div>
                              );
                         })}
                    </div>
               )}
          </div>
     );
}

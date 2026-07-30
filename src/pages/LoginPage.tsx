import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Laptop2, LogOut, Eye, EyeOff, Loader2, Shield, Lock, Mail, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { LOGOUT_DEVICE } from "@/graphql/mutations";
import { useSearchParams } from "react-router-dom";

const schema = z.object({
     email: z.string().email("Invalid email"),
     password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

interface ActiveDevice {
     _id: string;
     deviceId: string;
     deviceName?: string;
     userAgent?: string;
     lastLoginAt: string;
}

type Step = "login" | "device-limit";

export default function LoginPage() {
     const navigate = useNavigate();
     const { login, resolveDeviceConflict } = useAuth();
     const [step, setStep] = useState<Step>("login");
     const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);
     const [searchParams] = useSearchParams();
     const reason = searchParams.get("reason");
     const [pendingCreds, setPendingCreds] = useState<{ email: string; password: string } | null>(null);
     const [showPassword, setShowPassword] = useState(false);
     const [logoutingId, setLogoutingId] = useState<string | null>(null);

     const [logoutDevice] = useMutation(LOGOUT_DEVICE);

     const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
          resolver: zodResolver(schema),
     });

     const onSubmit = async (data: FormData) => {
          try {
               const result = await login(data.email, data.password);
               if (result.deviceLimitReached) {
                    setPendingCreds({ email: data.email, password: data.password });
                    setActiveDevices(result.activeDevices ?? []);
                    setStep("device-limit");
                    return;
               }
               navigate("/dashboard");
          } catch (err: unknown) {
               toast.error(err instanceof Error ? err.message : "Login failed");
          }
     };

     const handleLogoutDevice = async (device: ActiveDevice) => {
          if (!pendingCreds) return;
          setLogoutingId(device.deviceId);
          try {
               await resolveDeviceConflict(
                    pendingCreds.email,
                    pendingCreds.password,
                    device.deviceId
               );
               toast.success(`Resolved session conflict and signed in!`);
               navigate("/dashboard");
          } catch (err: unknown) {
               toast.error(err instanceof Error ? err.message : "Failed to resolve conflict");
          } finally {
               setLogoutingId(null);
          }
     };

     const getDeviceIcon = (ua?: string) => {
          if (!ua) return "💻";
          if (ua.toLowerCase().includes("mobile")) return "📱";
          if (ua.toLowerCase().includes("tablet")) return "📟";
          return "💻";
     };

     const formatDate = (dt: string) =>
          new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dt));

     return (
          <div className="min-h-screen bg-cream flex items-center justify-center p-4">
               {/* Subtle warm background blobs */}
               <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-sage/8 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-sand/60 rounded-full blur-[120px]" />
               </div>

               <AnimatePresence mode="wait">
                    {step === "login" ? (
                         <motion.div
                              key="login"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="w-full max-w-md relative"
                         >
                              {reason && (
                                   <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-sm flex items-center gap-3 mb-6"
                                   >
                                        <div className="p-2 bg-amber-500/20 rounded-full">
                                             <AlertCircle size={18} className="text-amber-400" />
                                        </div>
                                        <p>
                                             <strong>Logged Out:</strong> {reason.replace(/_/g, ' ')}
                                        </p>
                                   </motion.div>
                              )}

                              {/* Logo */}
                              <div className="flex flex-col items-center mb-8">
                                   <div className="h-14 w-14 rounded-2xl bg-sage flex items-center justify-center shadow-lg mb-4">
                                        <span className="text-white font-extrabold text-2xl">S</span>
                                   </div>
                                   <h1 className="text-2xl font-bold text-bark tracking-tight">Welcome back</h1>
                                   <p className="text-tan text-sm mt-1">Sign in to your Structo account</p>
                              </div>

                              {/* Card */}
                              <div className="bg-white border border-sand rounded-2xl p-8 shadow-md">
                                   <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                        <div className="space-y-2">
                                             <Label htmlFor="email" className="text-bark text-sm font-medium">Email</Label>
                                             <div className="relative">
                                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
                                                  <Input
                                                       id="email"
                                                       type="email"
                                                       placeholder="you@example.com"
                                                       {...register("email")}
                                                       className="pl-10 bg-cream border-sand text-bark placeholder-tan focus:border-sage focus:ring-sage/20"
                                                  />
                                             </div>
                                             {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                             <Label htmlFor="password" className="text-bark text-sm font-medium">Password</Label>
                                             <div className="relative">
                                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
                                                  <Input
                                                       id="password"
                                                       type={showPassword ? "text" : "password"}
                                                       placeholder="••••••••"
                                                       {...register("password")}
                                                       className="pl-10 pr-10 bg-cream border-sand text-bark placeholder-tan focus:border-sage focus:ring-sage/20"
                                                  />
                                                  <button
                                                       type="button"
                                                       onClick={() => setShowPassword(!showPassword)}
                                                       className="absolute right-3 top-1/2 -translate-y-1/2 text-tan hover:text-bark"
                                                  >
                                                       {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                  </button>
                                             </div>
                                             {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                                        </div>

                                        <Button
                                             type="submit"
                                             disabled={isSubmitting}
                                             className="w-full bg-sage hover:bg-sage-dark text-white font-semibold h-11 rounded-lg shadow-sm transition-all duration-200"
                                        >
                                             {isSubmitting ? (
                                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                                             ) : "Sign in"}
                                        </Button>
                                   </form>

                                   <p className="text-center text-tan text-sm mt-6">
                                        Don't have an account?{" "}
                                        <Link to="/signup" className="text-sage hover:text-sage-dark font-medium">
                                             Sign up
                                        </Link>
                                   </p>
                              </div>

                              {/* <p className="text-center text-tan/70 text-xs mt-6 flex items-center justify-center gap-1.5">
                                   <Shield className="h-3 w-3" /> Secured with JWT + device session tracking
                              </p> */}
                         </motion.div>
                    ) : (
                         /* ── Device Limit Screen ── */
                         <motion.div
                              key="device-limit"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="w-full max-w-lg relative"
                         >
                              <div className="bg-white border border-sand rounded-2xl p-8 shadow-md">
                                   <div className="flex flex-col items-center mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                                             <AlertTriangle className="h-7 w-7 text-amber-500" />
                                        </div>
                                        <h2 className="text-xl font-bold text-bark">Device Limit Reached</h2>
                                        <p className="text-tan text-sm text-center mt-2">
                                             Your plan allows a limited number of active devices. Log out from one to continue.
                                        </p>
                                   </div>

                                   <Alert className="mb-6 bg-amber-50 border-amber-200">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                        <AlertDescription className="text-bark text-sm">
                                             Select a device below to log out, then you'll be signed in automatically.
                                        </AlertDescription>
                                   </Alert>

                                   <div className="space-y-3">
                                        {activeDevices.length === 0 ? (
                                             <div className="text-center py-8 text-tan">
                                                  <Laptop2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                                  <p className="text-sm">No active devices found. Try logging in again.</p>
                                             </div>
                                        ) : (
                                             activeDevices.map((device) => (
                                                  <motion.div
                                                       key={device._id}
                                                       initial={{ opacity: 0, x: -10 }}
                                                       animate={{ opacity: 1, x: 0 }}
                                                       className="flex items-center justify-between p-4 rounded-xl bg-cream border border-sand hover:border-tan/50 transition-colors"
                                                  >
                                                       <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{getDeviceIcon(device.userAgent)}</span>
                                                            <div>
                                                                 <p className="text-sm font-medium text-bark">
                                                                      {device.deviceName ?? "Unknown Device"}
                                                                 </p>
                                                                 <p className="text-xs text-tan">
                                                                      Last active: {device.lastLoginAt ? formatDate(device.lastLoginAt) : "—"}
                                                                 </p>
                                                            </div>
                                                       </div>
                                                       <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleLogoutDevice(device)}
                                                            disabled={logoutingId === device.deviceId}
                                                            className="border-red-300 text-red-500 hover:bg-red-50"
                                                       >
                                                            {logoutingId === device.deviceId ? (
                                                                 <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                 <><LogOut className="h-3 w-3 mr-1" />Log out</>
                                                            )}
                                                       </Button>
                                                  </motion.div>
                                             ))
                                        )}
                                   </div>

                                   <Button
                                        variant="ghost"
                                        className="w-full mt-4 text-tan hover:text-bark hover:bg-sand"
                                        onClick={() => setStep("login")}
                                   >
                                        ← Back to login
                                   </Button>
                              </div>
                         </motion.div>
                    )}
               </AnimatePresence>
          </div>
     );
}

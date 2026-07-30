import { useAuth } from "@/contexts/AuthContext";
import { useAppQuery, useAppMutation } from "@/hooks/useGraphQL";
import { GET_MY_NOTIFICATION_PREFS, GET_MY_SUBSCRIPTIONS, GET_MY_DEVICES, GET_MEMBERSHIPS } from "@/graphql/queries";
import { UPDATE_USER, UPDATE_NOTIFICATION_PREFS, CHANGE_SUBSCRIPTION_PLAN, VERIFY_EMAIL_MANUAL } from "@/graphql/mutations";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
     User, Bell, Shield, CreditCard, Save, Loader2, Laptop2,
     CheckCircle2, Crown, Star, Globe, HardDrive, Zap, ArrowRight, Sparkles, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { NotificationPreference, AccountSubscription, Device, Membership, PaginatedResponse } from "@/types";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const profileSchema = z.object({
     name: z.string().min(2, "Name must be at least 2 characters"),
     email: z.string().email("Invalid email"),
});
type ProfileForm = z.infer<typeof profileSchema>;

const PREF_KEYS: { key: keyof NotificationPreference; label: string; description: string }[] = [
     { key: "workspaceInvites", label: "Workspace Invites", description: "Get notified when invited to a workspace" },
     { key: "projectInvites", label: "Project Invites", description: "Get notified when invited to a project" },
     { key: "securityAlerts", label: "Security Alerts", description: "Login alerts and suspicious activity" },
     { key: "taskAssign", label: "Task Assignments", description: "When a task is assigned to you" },
     { key: "meetingInvites", label: "Meeting Invites", description: "Calendar event and meeting invites" },
     { key: "announcement", label: "Announcements", description: "Platform announcements" },
     { key: "promotional", label: "Promotional", description: "Tips, updates and special offers" },
];

function formatDate(dt?: string | null) {
     if (!dt) return "—";
     return new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(dt));
}

interface PrefsResponse { 
     myNotificationPreference: { 
          notificationPreference: NotificationPreference | null; 
          success: boolean; 
          message: string; 
          code: number; 
     } 
}
interface SubResponse { findMySubscriptions: { subscriptions: AccountSubscription[] }; }
interface DevicesResponse { findMyDevices: { devices: Device[] }; }

export default function SettingsPage() {
     const { user } = useAuth();
     const [isPricingOpen, setIsPricingOpen] = useState(false);

     const { data: prefsData, loading: prefsLoading, refetch: refetchPrefs } = useAppQuery<PrefsResponse>(
          GET_MY_NOTIFICATION_PREFS,
     );

     const { data: subData, refetch: refetchSubs } = useAppQuery<SubResponse>(
          GET_MY_SUBSCRIPTIONS,
          { skip: !user?._id }
     );

     const { data: devicesData } = useAppQuery<DevicesResponse>(GET_MY_DEVICES);

     const prefs = prefsData?.myNotificationPreference?.notificationPreference ?? null;
     const subscription = subData?.findMySubscriptions?.subscriptions?.[0] ?? null;
     const devices = devicesData?.findMyDevices?.devices ?? [];
     const activeDevices = devices.filter((d) => !d.isRevoked && !d.isBlocked);

     const [updateUser, { loading: savingProfile }] = useAppMutation(UPDATE_USER, { successMessage: "Profile updated" });
     const [updatePrefs, { loading: savingPrefs }] = useAppMutation(UPDATE_NOTIFICATION_PREFS, {
          successMessage: "Preferences saved",
          onCompleted: () => refetchPrefs(),
     });

     const [verifyManual, { loading: verifyingManual }] = useAppMutation(VERIFY_EMAIL_MANUAL, {
          successMessage: "Identity successfully verified",
          onCompleted: () => {
               // Reload page or refresh user state if needed
               window.location.reload();
          }
     });

     const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
          resolver: zodResolver(profileSchema),
          defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
     });

     useEffect(() => {
          if (user) {
               reset({ name: user.name, email: user.email });
          }
     }, [user, reset]);

     const onProfileSave = (data: ProfileForm) => {
          updateUser({ variables: { input: { name: data.name } } });
     };

     const togglePref = (key: keyof NotificationPreference, value: boolean) => {
          if (!prefs) return;
          updatePrefs({ variables: { input: { userId: user?._id, [key]: value } } });
     };

     return (
          <div className="p-6 max-w-4xl mx-auto space-y-8">
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                    <h1 className="text-3xl font-black text-bark tracking-tight">Account Ecosystem</h1>
                    <p className="text-tan font-medium">Fine-tune your personal parameters and operational tier.</p>
               </motion.div>

               <Tabs defaultValue="profile" className="space-y-8">
                    <TabsList className="bg-sand/30 border border-sand p-1.5 rounded-2xl h-14">
                         {[
                              { value: "profile", label: "Identity", icon: User },
                              { value: "notifications", label: "Relays", icon: Bell },
                              { value: "security", label: "Defenses", icon: Shield },
                              { value: "subscription", label: "Logic Tier", icon: CreditCard },
                         ].map(({ value, label, icon: Icon }) => (
                              <TabsTrigger
                                   key={value}
                                   value={value}
                                   className="data-[state=active]:bg-white data-[state=active]:text-sage data-[state=active]:shadow-md text-tan font-bold rounded-xl gap-2 px-6 h-full transition-all"
                              >
                                   <Icon className="h-4 w-4" />{label}
                              </TabsTrigger>
                         ))}
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile">
                         <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                              <div className="bg-white border border-sand rounded-[2rem] p-8 space-y-8 shadow-sm">
                                   <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-8 border-b border-sand/50">
                                        <div className="relative group">
                                             <div className="h-20 w-20 rounded-3xl bg-sage flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-sage/20 border-4 border-white transition-transform group-hover:scale-105">
                                                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                                             </div>
                                             <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-xl border border-sand shadow-sm">
                                                  <User className="h-3 w-3 text-sage" />
                                             </div>
                                        </div>
                                        <div className="space-y-1">
                                             <div className="flex items-center gap-3">
                                                  <h2 className="text-2xl font-black text-bark tracking-tight">{user?.name}</h2>
                                                  <Badge className="bg-sage/10 text-sage border-sage/20 font-bold uppercase text-[10px] tracking-widest">{user?.role}</Badge>
                                             </div>
                                             <p className="text-tan font-medium">{user?.email}</p>
                                        </div>
                                   </div>

                                   <form onSubmit={handleSubmit(onProfileSave)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                             <Label className="text-bark font-bold text-xs uppercase tracking-wider ml-1">Full Name</Label>
                                             <Input
                                                  {...register("name")}
                                                  className="bg-cream border-sand h-12 rounded-2xl text-bark focus:ring-sage focus:border-sage font-medium"
                                             />
                                             {errors.name && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.name.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                             <Label className="text-bark font-bold text-xs uppercase tracking-wider ml-1">Email (System Fixed)</Label>
                                             <Input
                                                  {...register("email")}
                                                  disabled
                                                  className="bg-sand/30 border-sand h-12 rounded-2xl text-tan font-medium cursor-not-allowed"
                                             />
                                        </div>
                                        
                                        <div className="md:col-span-2 flex items-center justify-between pt-4">
                                             <div className="flex items-center gap-4">
                                                  <div className={cn(
                                                       "px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2",
                                                       user?.isVerified ? "bg-sage/10 text-sage border-sage/20" : "bg-amber-50 text-amber-600 border-amber-100"
                                                  )}>
                                                       {user?.isVerified ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                                       {user?.isVerified ? "VERIFIED IDENTITY" : "IDENTITY PENDING VERIFICATION"}
                                                  </div>
                                                  {!user?.isVerified && (
                                                       <Button 
                                                            type="button"
                                                            onClick={() => verifyManual()}
                                                            disabled={verifyingManual}
                                                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-9 px-4 text-xs font-bold shadow-sm transition-all active:scale-95"
                                                       >
                                                            {verifyingManual ? <Loader2 className="h-3 w-3 animate-spin" /> : "VERIFY NOW"}
                                                       </Button>
                                                  )}
                                             </div>
                                             
                                             <Button type="submit" disabled={savingProfile} className="bg-sage hover:bg-sage-dark text-white rounded-2xl h-12 px-8 font-bold shadow-lg shadow-sage/10 transition-all active:scale-95">
                                                  {savingProfile ? <Loader2 className="h-5 w-5 animate-spin" /> : "SYNC CHANGES"}
                                             </Button>
                                        </div>
                                   </form>
                              </div>
                         </motion.div>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications">
                         <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                              <div className="bg-white border border-sand rounded-[2rem] p-8 shadow-sm">
                                   <div className="pb-6 border-b border-sand/50 mb-6">
                                        <h2 className="text-xl font-black text-bark tracking-tight">Communication Relays</h2>
                                        <p className="text-tan font-medium text-sm">Configure how system insights are delivered to your external endpoints.</p>
                                   </div>

                                   {prefsLoading ? (
                                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                                             <Loader2 className="h-10 w-10 animate-spin text-sage" />
                                             <p className="text-tan font-bold animate-pulse">Syncing Relay States...</p>
                                        </div>
                                   ) : (
                                        <div className="grid grid-cols-1 gap-2">
                                             {PREF_KEYS.map(({ key, label, description }) => {
                                                  const val = prefs ? (prefs[key] as boolean) : false;
                                                  return (
                                                       <motion.div 
                                                            key={key} 
                                                            whileHover={{ x: 4 }}
                                                            className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-sand hover:bg-cream/30 transition-all group"
                                                       >
                                                            <div className="space-y-1">
                                                                 <p className="text-sm font-black text-bark tracking-tight uppercase">{label}</p>
                                                                 <p className="text-xs text-tan font-medium">{description}</p>
                                                            </div>
                                                            <Switch
                                                                 checked={val}
                                                                 onCheckedChange={(v) => togglePref(key, v)}
                                                                 disabled={savingPrefs}
                                                                 className="data-[state=checked]:bg-sage"
                                                            />
                                                       </motion.div>
                                                  );
                                             })}
                                        </div>
                                   )}
                              </div>
                         </motion.div>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security">
                         <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                              <div className="bg-white border border-sand rounded-[2rem] p-8 shadow-sm">
                                   <div className="flex items-center justify-between mb-8">
                                        <div>
                                             <h2 className="text-xl font-black text-bark tracking-tight">Active Interfaces</h2>
                                             <p className="text-tan font-medium text-sm">
                                                  {activeDevices.length} identified points of access detected.
                                             </p>
                                        </div>
                                        <Button asChild variant="outline" className="border-sand rounded-xl h-10 px-4 font-bold text-bark hover:bg-sand transition-all">
                                             <Link to="/devices" className="gap-2"><Laptop2 className="h-4 w-4" />View All</Link>
                                        </Button>
                                   </div>

                                   <div className="space-y-4">
                                        {activeDevices.slice(0, 3).map((device) => (
                                             <div key={device._id} className="flex items-center gap-4 p-4 rounded-2xl bg-cream/30 border border-sand/50">
                                                  <div className="h-12 w-12 rounded-xl bg-white border border-sand flex items-center justify-center shadow-sm">
                                                       <Laptop2 className="h-5 w-5 text-sage" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                       <p className="text-sm font-black text-bark tracking-tight uppercase truncate">{device.deviceName ?? "Unknown Interface"}</p>
                                                       <p className="text-[10px] text-tan font-bold truncate tracking-wider">{device.userAgent?.slice(0, 60) ?? "---"}</p>
                                                  </div>
                                                  <Badge className="bg-sage/10 text-sage border-sage/20 font-black text-[9px] tracking-widest px-2">ONLINE</Badge>
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         </motion.div>
                    </TabsContent>

                    {/* Subscription Tab */}
                    <TabsContent value="subscription">
                         <motion.div 
                              initial={{ opacity: 0, scale: 0.98 }} 
                              animate={{ opacity: 1, scale: 1 }}
                         >
                              {!subscription ? (
                                   <div className="bg-white border border-sand rounded-[2.5rem] p-24 flex flex-col items-center justify-center text-center space-y-4">
                                        <Loader2 className="h-12 w-12 text-sage animate-spin" />
                                        <p className="text-tan font-black tracking-tight uppercase">Initializing Logic Tiers...</p>
                                   </div>
                              ) : (
                                   <div className="space-y-8">
                                        {/* Premium Plan Card */}
                                        <div className="relative overflow-hidden bg-bark rounded-[2.5rem] p-10 text-white shadow-2xl shadow-bark/20">
                                             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                                  <Crown className="h-64 w-64 rotate-12" />
                                             </div>
                                             
                                             <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-10">
                                                  <div className="space-y-4">
                                                       <div className="flex items-center gap-3">
                                                            <div className="bg-sage/20 p-2 rounded-2xl backdrop-blur-md border border-sage/30">
                                                                 <Sparkles className="h-6 w-6 text-sage" />
                                                            </div>
                                                            <Badge className="bg-white/5 border-white/10 text-white font-black tracking-widest uppercase text-[10px]">
                                                                 {subscription.status} Deployment
                                                            </Badge>
                                                       </div>
                                                       
                                                       <div className="space-y-1">
                                                            <h2 className="text-5xl font-black tracking-tighter flex items-baseline gap-3">
                                                                 {subscription.plan?.type?.toUpperCase() ?? "BASIC"}
                                                                 <span className="text-sage text-sm font-black tracking-[0.2em]">ACTIVE</span>
                                                            </h2>
                                                            <p className="text-tan/60 font-medium max-w-md leading-relaxed">
                                                                 {subscription.plan?.description ?? "A structural tier designed for high-velocity personal workflows."}
                                                            </p>
                                                       </div>

                                                       <Button 
                                                            onClick={(e) => { e.preventDefault(); setIsPricingOpen(true); }}
                                                            className="bg-white text-bark hover:bg-white/90 rounded-2xl h-14 px-8 font-black gap-3 shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                                                       >
                                                            EVOLVE ARCHITECTURE <ArrowRight className="h-5 w-5" />
                                                        </Button>
                                                  </div>
                                                  
                                                  <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 flex flex-col items-end gap-2 self-stretch md:self-auto min-w-[240px]">
                                                       <div className="text-right w-full border-b border-white/10 pb-4 mb-2">
                                                            <p className="text-[10px] font-black tracking-widest text-tan/40 uppercase mb-1">Billing Rate</p>
                                                            <div className="flex items-baseline justify-end gap-1">
                                                                 <span className="text-3xl font-black">{subscription.currency} {subscription.priceAtPurchase}</span>
                                                                 <span className="text-[10px] text-tan font-bold">/ PERIOD</span>
                                                            </div>
                                                       </div>
                                                       <div className="flex items-center gap-2 text-[10px] font-black tracking-wider text-sage">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            NEXT RELAY: {formatDate(subscription.endDate)}
                                                       </div>
                                                  </div>
                                             </div>

                                             <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                  {[
                                                       { label: "Workspaces", value: subscription.maxWorkspaces, icon: Globe },
                                                       { label: "Devices", value: subscription.maxDevices, icon: Laptop2 },
                                                       { label: "Projects", value: subscription.maxProjectsPerWorkspace, icon: Zap },
                                                       { label: "Members", value: subscription.maxUsersPerProject, icon: User },
                                                  ].map(({ label, value, icon: Icon }) => (
                                                       <div key={label} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors group">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                 <Icon className="h-3 w-3 text-sage" />
                                                                 <span className="text-[9px] font-black uppercase tracking-[0.15em] text-tan/40">{label}</span>
                                                            </div>
                                                            <p className="text-2xl font-black tracking-tight">{value}</p>
                                                       </div>
                                                  ))}
                                             </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                             <div className="bg-white border border-sand rounded-[2rem] p-8 shadow-sm">
                                                  <h3 className="text-lg font-black text-bark tracking-tight flex items-center gap-3 mb-6">
                                                       <div className="bg-sage/10 p-2 rounded-xl"><Sparkles className="h-4 w-4 text-sage" /></div>
                                                       Structural Perks
                                                  </h3>
                                                  <ul className="space-y-4">
                                                       {[
                                                            "Priority bandwidth allocation",
                                                            "Advanced task optimization",
                                                            "Deep project analytics grid",
                                                            "Encrypted data redundancy"
                                                       ].map((feat) => (
                                                            <li key={feat} className="flex items-center gap-3 text-sm font-bold text-tan">
                                                                 <div className="h-2 w-2 rounded-full border-2 border-sage bg-white" />
                                                                 {feat}
                                                            </li>
                                                       ))}
                                                  </ul>
                                             </div>

                                             <div className="bg-cream/50 border border-sand rounded-[2rem] p-8 flex flex-col justify-between items-start">
                                                  <div className="space-y-2">
                                                       <h3 className="text-lg font-black text-bark tracking-tight uppercase">Scaling Operations?</h3>
                                                       <p className="text-tan font-medium text-sm leading-relaxed">
                                                            Integrate enterprise-grade logic for large teams and high-complexity environments.
                                                       </p>
                                                  </div>
                                                  <Button 
                                                       onClick={() => setIsPricingOpen(true)}
                                                       variant="outline" 
                                                       className="mt-6 border-bark/20 bg-white hover:bg-sand text-bark rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] w-full"
                                                  >
                                                       Explore All Tiers
                                                  </Button>
                                             </div>
                                        </div>
                                   </div>
                              )}
                         </motion.div>
                    </TabsContent>
               </Tabs>

               <PricingModal 
                    isOpen={isPricingOpen} 
                    onClose={() => setIsPricingOpen(false)} 
                    currentPlanId={subscription?.planId}
                    onPlanSelected={() => {
                         refetchSubs();
                         setIsPricingOpen(false);
                    }}
               />
          </div>
     );
}

function PricingModal({ isOpen, onClose, currentPlanId, onPlanSelected }: { 
     isOpen: boolean; onClose: () => void; currentPlanId?: string; onPlanSelected: () => void;
}) {
     const { data, loading } = useAppQuery<{ findMemberships: PaginatedResponse<Membership> }>(
          GET_MEMBERSHIPS, 
          { variables: { input: { page: 1, limit: 10 } } }
     );
     
     const [changePlan, { loading: switching }] = useAppMutation(CHANGE_SUBSCRIPTION_PLAN, {
          successMessage: "Tier transformation complete!",
          onCompleted: onPlanSelected
     });

     const handleSelect = (planId: string) => {
          if (planId === currentPlanId) return;
          if (window.confirm("Initialize tier transformation? Billing cycle will be adjusted to new parameters.")) {
               changePlan({ variables: { planId } });
          }
     };

     const plans = (data?.findMemberships?.items ?? []).filter(p => p.isActive);

     return (
          <Dialog open={isOpen} onOpenChange={onClose}>
               <DialogContent className="max-w-6xl bg-cream border-sand rounded-[3rem] p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="sr-only"><DialogTitle>Tiers</DialogTitle></DialogHeader>
                    <div className="p-8 md:p-14 space-y-12">
                         <div className="text-center space-y-3">
                              <Badge className="bg-sage/10 text-sage border-sage/20 mb-2 font-black uppercase tracking-[0.2em] text-[10px] px-3">Ecosystem Scaling</Badge>
                              <h2 className="text-5xl font-black text-bark tracking-tighter">Evolve Your Workspace</h2>
                              <p className="text-tan font-medium max-w-lg mx-auto leading-relaxed">
                                   Select the logic tier that best aligns with your organizational momentum.
                              </p>
                         </div>

                         {loading ? (
                              <div className="py-24 flex flex-col items-center gap-6">
                                   <Loader2 className="h-12 w-12 text-sage animate-spin" />
                                   <p className="text-tan font-black tracking-widest uppercase animate-pulse">Syncing tiers...</p>
                              </div>
                         ) : (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                   <AnimatePresence>
                                        {plans.map((plan, i) => (
                                             <motion.div 
                                                  key={plan._id}
                                                  initial={{ opacity: 0, y: 20 }}
                                                  animate={{ opacity: 1, y: 0 }}
                                                  transition={{ delay: i * 0.1 }}
                                                  whileHover={{ y: -8 }}
                                                  className={cn(
                                                       "bg-white border rounded-[2.5rem] p-10 flex flex-col transition-all relative overflow-hidden",
                                                       plan._id === currentPlanId 
                                                            ? "border-sage ring-1 ring-sage shadow-2xl shadow-sage/10" 
                                                            : "border-sand hover:border-sage/30 hover:shadow-xl shadow-sm"
                                                  )}
                                             >
                                                  {plan._id === currentPlanId && (
                                                       <div className="absolute top-6 right-6">
                                                            <div className="bg-sage text-white font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-sage/20">
                                                                 <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                                                 ACTIVE
                                                            </div>
                                                       </div>
                                                  )}

                                                  <div className="space-y-6 mb-10">
                                                       <div className="flex items-center gap-3">
                                                            <div className={cn("p-2 rounded-2xl", plan.type === "PRO" ? "bg-sage/10" : "bg-sand/30")}>
                                                                 {plan.type === "PRO" ? <Star className="h-5 w-5 text-sage fill-current" /> : <Shield className="h-5 w-5 text-tan" />}
                                                            </div>
                                                            <h3 className="text-xl font-black text-bark uppercase tracking-tighter">{plan.type}</h3>
                                                       </div>
                                                       
                                                       <div className="space-y-1">
                                                            <div className="flex items-baseline gap-1">
                                                                 <span className="text-4xl font-black text-bark tracking-tighter">{plan.currency} {plan.price}</span>
                                                                 <span className="text-tan font-bold text-[10px] tracking-widest">/ {plan.durationDays}D</span>
                                                            </div>
                                                            <p className="text-tan text-xs font-semibold leading-relaxed min-h-[3rem]">
                                                                 {plan.description || "Deploy advanced organizational logic across your infrastructure."}
                                                            </p>
                                                       </div>
                                                  </div>

                                                  <div className="space-y-5 flex-1 p-6 bg-cream/30 rounded-3xl border border-sand/30">
                                                       <ul className="space-y-4">
                                                            {[
                                                                 { icon: Globe, label: "Workspaces", value: plan.maxWorkspaces },
                                                                 { icon: HardDrive, label: "Devices", value: plan.maxDevices },
                                                                 { icon: Zap, label: "Projects/WS", value: plan.maxProjectsPerWorkspace },
                                                            ].map((feat) => (
                                                                 <li key={feat.label} className="flex items-center gap-3 text-xs text-bark font-bold tracking-tight">
                                                                      <feat.icon className="h-3.5 w-3.5 text-sage" />
                                                                      {feat.value} {feat.label}
                                                                 </li>
                                                            ))}
                                                       </ul>
                                                  </div>

                                                  <Button 
                                                       onClick={() => handleSelect(plan._id)}
                                                       disabled={plan._id === currentPlanId || switching}
                                                       className={cn(
                                                            "mt-10 w-full h-14 rounded-[1.25rem] font-black transition-all active:scale-95 text-[11px] tracking-widest",
                                                            plan._id === currentPlanId 
                                                                 ? "bg-sand text-tan/40 border-0 shadow-none cursor-default" 
                                                                 : "bg-bark text-white hover:bg-bark/90 shadow-xl shadow-bark/20"
                                                       )}
                                                  >
                                                       {switching ? <Loader2 className="h-5 w-5 animate-spin" /> : (plan._id === currentPlanId ? "CURRENTLY DEPLOYED" : "EVOLVE TIER")}
                                                  </Button>
                                             </motion.div>
                                        ))}
                                   </AnimatePresence>
                              </div>
                         )}
                    </div>
               </DialogContent>
          </Dialog>
     );
}
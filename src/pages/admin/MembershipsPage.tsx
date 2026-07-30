import { useState } from "react";
import { useAppQuery, useAppMutation } from "@/hooks/useGraphQL";
import { GET_MEMBERSHIPS } from "@/graphql/queries";
import { CREATE_MEMBERSHIP, UPDATE_MEMBERSHIP, DELETE_MEMBERSHIP } from "@/graphql/mutations";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Plus, Edit2, Loader2, CheckCircle2, XCircle, Star, Trash2, ArrowLeft, Gem, Zap, Globe, HardDrive, Users, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PaginatedResponse, Membership } from "@/types";
import { toast } from "sonner";

const schema = z.object({
     type: z.string().min(1, "Required"),
     price: z.coerce.number().min(0),
     currency: z.string().min(1, "Required"),
     durationDays: z.coerce.number().min(1),
     maxWorkspaces: z.coerce.number().min(1),
     maxDevices: z.coerce.number().min(1),
     maxProjectsPerWorkspace: z.coerce.number().min(1),
     maxUsersPerProject: z.coerce.number().min(1),
     description: z.string().optional(),
     isTrialAvailable: z.boolean().default(false),
     trialDurationDays: z.coerce.number().optional(),
     isCancellable: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function MembershipsPage() {
     const [page, setPage] = useState(1);
     const [open, setOpen] = useState(false);
     const [editing, setEditing] = useState<Membership | null>(null);

     const { data, loading, refetch } = useAppQuery<{
          findMemberships: PaginatedResponse<Membership>;
     }>(GET_MEMBERSHIPS, { 
          variables: { input: { page, limit: 12 } },
          notifyOnNetworkStatusChange: true 
     });

     const memberships = data?.findMemberships?.items ?? [];
     const totalPages = data?.findMemberships?.totalPages ?? 1;

     const [createMembership, { loading: creating }] = useAppMutation(CREATE_MEMBERSHIP, {
          successMessage: "Membership plan created successfully",
          onCompleted: () => { setOpen(false); refetch(); reset(); },
     });

     const [updateMembership, { loading: updating }] = useAppMutation(UPDATE_MEMBERSHIP, {
          successMessage: "Plan updated successfully",
          onCompleted: () => { setOpen(false); setEditing(null); refetch(); reset(); },
     });

     const [deleteMembership, { loading: deleting }] = useAppMutation(DELETE_MEMBERSHIP, {
          successMessage: "Plan removed",
          onCompleted: () => refetch(),
     });

     const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
          resolver: zodResolver(schema),
          defaultValues: { isCancellable: true, isTrialAvailable: false, currency: "USD" },
     });

     const openCreate = () => { reset(); setEditing(null); setOpen(true); };
     const openEdit = (m: Membership) => {
          setEditing(m);
          setValue("type", m.type);
          setValue("price", m.price);
          setValue("currency", m.currency);
          setValue("durationDays", m.durationDays);
          setValue("maxWorkspaces", m.maxWorkspaces);
          setValue("maxDevices", m.maxDevices);
          setValue("maxProjectsPerWorkspace", m.maxProjectsPerWorkspace);
          setValue("maxUsersPerProject", m.maxUsersPerProject);
          setValue("description", m.description ?? "");
          setValue("isTrialAvailable", m.isTrialAvailable);
          setValue("trialDurationDays", m.trialDurationDays);
          setValue("isCancellable", m.isCancellable);
          setOpen(true);
     };

     const onSubmit = (formData: FormData) => {
          if (editing) {
               updateMembership({ variables: { input: { _id: editing._id, ...formData } } });
          } else {
               createMembership({ variables: { input: formData } });
          }
     };

     const onDelete = (id: string) => {
          if (window.confirm("Are you sure you want to delete this plan? This action cannot be undone.")) {
               deleteMembership({ variables: { id } });
          }
     };

     const isTrial = watch("isTrialAvailable");

     const planBadge: Record<string, string> = {
          FREE: "bg-sand text-tan border-sand/50",
          PRO: "bg-sage/10 text-sage border-sage/20",
          ENTERPRISE: "bg-bark/5 text-bark border-bark/10",
     };

     return (
          <div className="min-h-screen bg-cream/30 p-8 space-y-8">
               {/* Header Section */}
               <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6"
               >
                    <div className="space-y-1">
                         <div className="flex items-center gap-3">
                              <div className="bg-sage/10 p-2 rounded-xl">
                                   <Shield className="h-6 w-6 text-sage" />
                              </div>
                              <h1 className="text-3xl font-black text-bark tracking-tight">Plan Architecture</h1>
                         </div>
                         <p className="text-tan font-medium max-w-lg">
                              Configure core membership tiers, resource limits, and pricing strategy for your users.
                         </p>
                    </div>
                    
                    <Button 
                         onClick={openCreate} 
                         className="bg-sage hover:bg-sage-dark text-white rounded-2xl h-12 px-6 gap-2 shadow-lg shadow-sage/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                         <Plus className="h-5 w-5" />
                         <span className="font-bold">Forge New Tier</span>
                    </Button>
               </motion.div>

               {/* Metrics Overview (Placeholder for stats) */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                         { label: "Active Plans", value: memberships.filter(m => m.isActive).length, icon: Gem, color: "text-sage" },
                         { label: "Total Capacity", value: memberships.reduce((acc, curr) => acc + curr.maxWorkspaces, 0), icon: Globe, color: "text-tan" },
                         { label: "System Uptime", value: "99.9%", icon: Zap, color: "text-amber-500" },
                    ].map((stat, i) => (
                         <motion.div 
                              key={stat.label}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="bg-white border border-sand rounded-3xl p-6 shadow-sm flex items-center gap-4"
                         >
                              <div className={cn("p-3 rounded-2xl bg-cream border border-sand/50", stat.color)}>
                                   <stat.icon className="h-6 w-6" />
                              </div>
                              <div>
                                   <p className="text-tan text-sm font-medium">{stat.label}</p>
                                   <h3 className="text-2xl font-black text-bark leading-none">{stat.value}</h3>
                              </div>
                         </motion.div>
                    ))}
               </div>

               {/* Plans Grid */}
               {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                         <Loader2 className="h-12 w-12 text-sage animate-spin" />
                         <p className="text-tan font-medium animate-pulse">Syncing membership tiers...</p>
                    </div>
               ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                         <AnimatePresence mode="popLayout">
                              {memberships.map((plan, i) => (
                                   <motion.div
                                        key={plan._id}
                                        layout
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: i * 0.05, duration: 0.4, type: "spring" }}
                                        className="group bg-white border border-sand hover:border-sage/40 rounded-[2rem] p-6 transition-all hover:shadow-xl hover:shadow-sage/5 relative overflow-hidden"
                                   >
                                        <div className="flex items-center justify-between mb-6">
                                             <div className={cn(
                                                  "px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5",
                                                  planBadge[plan.type] ?? "bg-sand text-tan border-sand/50"
                                             )}>
                                                  <Star className="h-3 w-3 fill-current" />
                                                  {plan.type}
                                             </div>
                                             
                                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Button 
                                                       size="icon" 
                                                       variant="ghost" 
                                                       onClick={() => openEdit(plan)}
                                                       className="h-8 w-8 rounded-full text-tan hover:text-bark hover:bg-sand transition-colors"
                                                  >
                                                       <Edit2 className="h-4 w-4" />
                                                  </Button>
                                                  <Button 
                                                       size="icon" 
                                                       variant="ghost" 
                                                       onClick={() => onDelete(plan._id)}
                                                       className="h-8 w-8 rounded-full text-tan hover:text-red-500 hover:bg-red-50 transition-colors"
                                                  >
                                                       <Trash2 className="h-4 w-4" />
                                                  </Button>
                                             </div>
                                        </div>

                                        <div className="space-y-1 mb-6">
                                             <div className="flex items-baseline gap-1">
                                                  <span className="text-3xl font-black text-bark tracking-tighter">{plan.currency} {plan.price}</span>
                                                  <span className="text-tan font-medium text-sm">/ {plan.durationDays} days</span>
                                             </div>
                                             <p className="text-tan text-xs font-medium line-clamp-2 min-h-[2rem]">
                                                  {plan.description || "No description provided for this tier."}
                                             </p>
                                        </div>

                                        <div className="space-y-3">
                                             <div className="h-px bg-gradient-to-r from-sand via-sand to-transparent mx-1" />
                                             <div className="grid grid-cols-2 gap-3">
                                                  {[
                                                       { icon: Globe, label: "Workspaces", value: plan.maxWorkspaces },
                                                       { icon: HardDrive, label: "Devices", value: plan.maxDevices },
                                                       { icon: Zap, label: "Projects", value: plan.maxProjectsPerWorkspace },
                                                       { icon: Users, label: "Members", value: plan.maxUsersPerProject },
                                                  ].map((limit) => (
                                                       <div key={limit.label} className="bg-cream/50 rounded-2xl p-3 border border-sand/30 hover:bg-white transition-colors">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                 <limit.icon className="h-3 w-3 text-sage" />
                                                                 <span className="text-[10px] uppercase font-bold text-tan tracking-wider">{limit.label}</span>
                                                            </div>
                                                            <p className="text-bark font-black text-lg leading-none">{limit.value}</p>
                                                       </div>
                                                  ))}
                                             </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                                             <div className={cn(
                                                  "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all",
                                                  plan.isActive ? "bg-sage/10 text-sage" : "bg-neutral-100 text-neutral-400"
                                             )}>
                                                  <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", plan.isActive ? "bg-sage" : "bg-neutral-400")} />
                                                  {plan.isActive ? "ACTIVE DEPLOYMENT" : "OFFLINE"}
                                             </div>
                                             
                                             {plan.isTrialAvailable && (
                                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black tracking-wider">
                                                       <Clock className="h-3 w-3" />
                                                       TRIAL: {plan.trialDurationDays}d
                                                  </div>
                                             )}
                                        </div>
                                   </motion.div>
                              ))}
                         </AnimatePresence>
                    </div>
               )}

               {/* Pagination */}
               {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-12">
                         <Button 
                              variant="outline" 
                              disabled={page <= 1} 
                              onClick={() => setPage(p => p - 1)}
                              className="border-sand bg-white text-bark hover:bg-sand rounded-xl h-10 px-4"
                         >
                              <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                         </Button>
                         <div className="bg-white border border-sand px-4 h-10 flex items-center rounded-xl">
                              <span className="text-tan font-bold text-sm">Deployment {page} <span className="text-tan/30 mx-1">/</span> {totalPages}</span>
                         </div>
                         <Button 
                              variant="outline" 
                              disabled={page >= totalPages} 
                              onClick={() => setPage(p => p + 1)}
                              className="border-sand bg-white text-bark hover:bg-sand rounded-xl h-10 px-4"
                         >
                              Next <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                         </Button>
                    </div>
               )}

               {/* Create / Edit Modal */}
               <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="bg-white border-sand rounded-[2.5rem] text-bark max-w-2xl p-8 overflow-hidden">
                         <DialogHeader className="mb-6">
                              <DialogTitle className="text-3xl font-black tracking-tight text-bark flex items-center gap-3">
                                   <div className="bg-sage/10 p-2 rounded-2xl">
                                        {editing ? <Edit2 className="h-6 w-6 text-sage" /> : <Plus className="h-6 w-6 text-sage" />}
                                   </div>
                                   {editing ? "Modify Logic" : "New Tier Specification"}
                              </DialogTitle>
                              <DialogDescription className="text-tan font-medium">
                                   {editing ? "Adjusting the parameters for an existing system tier." : "Drafting a new structural tier for the membership ecosystem."}
                              </DialogDescription>
                         </DialogHeader>

                         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   {/* Identifier & Pricing */}
                                   <div className="space-y-4">
                                        <div className="space-y-2">
                                             <Label className="text-bark font-bold text-xs uppercase tracking-wider ml-1">Tier Identifier *</Label>
                                             <Input {...register("type")} placeholder="e.g. ULTRA_PRO" 
                                                  className="bg-cream border-sand h-12 rounded-2xl text-bark focus:ring-sage focus:border-sage font-bold uppercase" />
                                             {errors.type && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.type.message}</p>}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                             <div className="space-y-2">
                                                  <Label className="text-bark font-bold text-xs uppercase tracking-wider ml-1">Price</Label>
                                                  <div className="relative">
                                                       <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
                                                       <Input type="number" {...register("price")} 
                                                            className="bg-cream border-sand h-12 rounded-2xl pl-10 text-bark font-bold" />
                                                  </div>
                                             </div>
                                             <div className="space-y-2">
                                                  <Label className="text-bark font-bold text-xs uppercase tracking-wider ml-1">Currency</Label>
                                                  <Input {...register("currency")} placeholder="USD" 
                                                       className="bg-cream border-sand h-12 rounded-2xl text-bark font-bold uppercase" />
                                                  {errors.currency && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.currency.message}</p>}
                                             </div>
                                        </div>

                                        <div className="space-y-2">
                                             <Label className="text-bark font-bold text-xs uppercase tracking-wider ml-1">Duration Cycle (Days)</Label>
                                             <Input type="number" {...register("durationDays")} 
                                                  className="bg-cream border-sand h-12 rounded-2xl text-bark font-bold" />
                                        </div>
                                   </div>

                                   {/* Resource Scaling */}
                                   <div className="grid grid-cols-2 gap-4">
                                        {[
                                             { name: "maxWorkspaces", label: "Workspaces", icon: Globe },
                                             { name: "maxDevices", label: "Devices", icon: HardDrive },
                                             { name: "maxProjectsPerWorkspace", label: "Proj/WS", icon: Zap },
                                             { name: "maxUsersPerProject", label: "Users/Proj", icon: Users },
                                        ].map((field) => (
                                             <div key={field.name} className="space-y-2">
                                                  <Label className="text-bark font-bold text-[10px] uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                                       <field.icon className="h-3 w-3 text-sage" />
                                                       {field.label}
                                                  </Label>
                                                  <Input type="number" {...register(field.name as keyof FormData)} 
                                                       className="bg-cream border-sand h-12 rounded-2xl text-bark font-bold text-center" />
                                             </div>
                                        ))}
                                   </div>
                              </div>

                              <div className="space-y-2">
                                   <Label className="text-bark font-bold text-xs uppercase tracking-wider ml-1">Tier Narrative</Label>
                                   <Input {...register("description")} placeholder="Vision for this tier..." 
                                        className="bg-cream border-sand h-12 rounded-2xl text-bark" />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-cream/50 rounded-[1.5rem] p-4 border border-sand/50 space-y-3">
                                        <div className="flex items-center justify-between">
                                             <div className="space-y-0.5">
                                                  <p className="text-bark font-bold text-sm">Beta Trial</p>
                                                  <p className="text-tan text-[10px]">Enable initial test access</p>
                                             </div>
                                             <Switch 
                                                  checked={isTrial}
                                                  onCheckedChange={(v) => setValue("isTrialAvailable", v)}
                                                  className="data-[state=checked]:bg-sage" 
                                             />
                                        </div>
                                        {isTrial && (
                                             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                                                  <Input type="number" {...register("trialDurationDays")} placeholder="Trial Days" 
                                                       className="bg-white border-sand h-10 rounded-xl text-xs font-bold" />
                                             </motion.div>
                                        )}
                                   </div>

                                   <div className="bg-cream/50 rounded-[1.5rem] p-4 border border-sand/50 flex items-center justify-between">
                                        <div className="space-y-0.5">
                                             <p className="text-bark font-bold text-sm">Exit Protocol</p>
                                             <p className="text-tan text-[10px]">Users can cancel anytime</p>
                                        </div>
                                        <Switch 
                                             defaultChecked={true}
                                             {...register("isCancellable")}
                                             onCheckedChange={(v) => setValue("isCancellable", v)}
                                             className="data-[state=checked]:bg-sage" 
                                        />
                                   </div>
                              </div>

                              <div className="flex gap-4 pt-4">
                                   <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => { setOpen(false); setEditing(null); reset(); }}
                                        className="flex-1 h-14 rounded-2xl text-tan font-bold hover:text-bark hover:bg-sand/30"
                                   >
                                        Abort
                                   </Button>
                                   <Button 
                                        type="submit" 
                                        disabled={creating || updating} 
                                        className="flex-1 h-14 bg-sage hover:bg-sage-dark text-white rounded-2xl font-black shadow-lg shadow-sage/10 transition-all active:scale-95"
                                   >
                                        {creating || updating ? (
                                             <><Loader2 className="h-5 w-5 mr-3 animate-spin" />SYNCING...</>
                                        ) : (
                                             editing ? "UPDATE SPECIFICATION" : "INITIALIZE TIER"
                                        )}
                                   </Button>
                              </div>
                         </form>
                    </DialogContent>
               </Dialog>
          </div>
     );
}

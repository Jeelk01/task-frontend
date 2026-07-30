import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { VERIFY_EMAIL } from "@/graphql/mutations";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
     const [searchParams] = useSearchParams();
     const navigate = useNavigate();
     const token = searchParams.get("token") ?? "";

     const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
     const [message, setMessage] = useState("");

     const [verifyEmail] = useMutation<{ verifyEmail: { success: boolean; message: string } }>(VERIFY_EMAIL);

     useEffect(() => {
          if (!token) {
               setStatus("error");
               setMessage("No verification token found in the URL.");
               return;
          }

          verifyEmail({ variables: { input: { token } } })
               .then(({ data }) => {
                    if (!data?.verifyEmail?.success) {
                         setStatus("error");
                         setMessage(data?.verifyEmail?.message ?? "Verification failed");
                    } else {
                         setStatus("success");
                         setMessage(data.verifyEmail.message ?? "Email verified successfully.");
                    }
               })
               .catch((err: any) => {
                    setStatus("error");
                    setMessage(err.message ?? "An unexpected error occurred.");
               });
     }, [token, verifyEmail]);

     return (
          <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 relative overflow-hidden">
               {/* Decorative Background Elements */}
               <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-sage/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-amber-200/20 rounded-full blur-[120px]" />
               </div>

               <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10 bg-white border border-sand/50 rounded-[2.5rem] p-12 max-w-lg w-full text-center shadow-[0_32px_64px_-16px_rgba(45,35,28,0.08)]"
               >
                    {status === "loading" && (
                         <div className="space-y-8 py-4">
                              <div className="relative mx-auto w-24 h-24">
                                   <div className="absolute inset-0 border-4 border-sage/10 rounded-3xl" />
                                   <Loader2 className="h-24 w-24 text-sage animate-spin relative z-10 p-6" />
                              </div>
                              <div className="space-y-3">
                                   <h2 className="text-3xl font-black text-bark tracking-tight">Authenticating Identity...</h2>
                                   <p className="text-tan font-medium leading-relaxed px-4">Establishing a secure connection to verify your credentials. This won't take long.</p>
                              </div>
                         </div>
                    )}

                    {status === "success" && (
                         <div className="space-y-8">
                              <motion.div 
                                   initial={{ scale: 0.5, opacity: 0 }}
                                   animate={{ scale: 1, opacity: 1 }}
                                   transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                                   className="h-24 w-24 rounded-[2rem] bg-sage/10 border-2 border-sage/20 flex items-center justify-center mx-auto shadow-sm"
                              >
                                   <CheckCircle2 className="h-12 w-12 text-sage" />
                              </motion.div>
                              <div className="space-y-3">
                                   <h2 className="text-4xl font-black text-bark tracking-tight">Access Granted</h2>
                                   <p className="text-tan font-medium leading-relaxed px-4">{message || "Your identity relay has been successfully established and verified."}</p>
                              </div>
                              <Button
                                   onClick={() => navigate("/login")}
                                   className="w-full bg-bark hover:bg-bark/90 text-white font-black h-16 rounded-[1.25rem] text-sm tracking-widest uppercase shadow-xl shadow-bark/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                              >
                                   ENTER DASHBOARD
                              </Button>
                         </div>
                    )}

                    {status === "error" && (
                         <div className="space-y-8">
                              <motion.div 
                                   initial={{ scale: 0.5, opacity: 0 }}
                                   animate={{ scale: 1, opacity: 1 }}
                                   transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                                   className="h-24 w-24 rounded-[2rem] bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto shadow-sm"
                              >
                                   <XCircle className="h-12 w-12 text-red-500" />
                              </motion.div>
                              <div className="space-y-3">
                                   <h2 className="text-3xl font-black text-bark tracking-tight">Verification Denied</h2>
                                   <p className="text-red-600/70 font-bold text-sm leading-relaxed px-4">{message}</p>
                              </div>
                              <div className="pt-4 space-y-3">
                                   <Button
                                        onClick={() => navigate("/login")}
                                        className="w-full bg-bark text-white font-black h-16 rounded-[1.25rem] text-sm tracking-widest uppercase shadow-xl shadow-bark/20"
                                   >
                                        BACK TO IDENTITY
                                   </Button>
                                   <p className="text-[11px] text-tan font-bold uppercase tracking-widest">or contact technical support</p>
                              </div>
                         </div>
                    )}
               </motion.div>
          </div>
     );
}

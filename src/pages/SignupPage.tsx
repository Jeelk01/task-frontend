import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const schema = z
     .object({
          name: z.string().min(2, "Name must be at least 2 characters"),
          email: z.string().email("Invalid email"),
          password: z.string().min(8, "Password must be at least 8 characters"),
          confirmPassword: z.string(),
     })
     .refine((d) => d.password === d.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
     });
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
     const { signup } = useAuth();
     const navigate = useNavigate();
     const [showPassword, setShowPassword] = useState(false);
     const [done, setDone] = useState(false);

     const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
          resolver: zodResolver(schema),
     });

     const onSubmit = async (data: FormData) => {
          try {
               await signup(data.name, data.email, data.password);
               setDone(true);
          } catch (err: unknown) {
               toast.error(err instanceof Error ? err.message : "Signup failed");
          }
     };

     if (done) {
          return (
               <div className="min-h-screen bg-cream flex items-center justify-center p-4">
                    <motion.div
                         initial={{ scale: 0.9, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         className="bg-white border border-sand rounded-2xl p-10 max-w-md w-full text-center shadow-md"
                    >
                         <div className="h-16 w-16 rounded-full bg-sage/10 border border-sage/30 flex items-center justify-center mx-auto mb-5">
                              <CheckCircle2 className="h-8 w-8 text-sage" />
                         </div>
                         <h2 className="text-2xl font-bold text-bark mb-2">Account created!</h2>
                         <p className="text-tan text-sm mb-6">
                              We've sent a verification email to your inbox. Please verify your email to activate your account.
                         </p>
                         <Button
                              onClick={() => navigate("/login")}
                              className="w-full bg-sage hover:bg-sage-dark text-white font-semibold h-11 rounded-lg"
                         >
                              Back to Login
                         </Button>
                    </motion.div>
               </div>
          );
     }

     return (
          <div className="min-h-screen bg-cream flex items-center justify-center p-4">
               <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-sage/8 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-sand/60 rounded-full blur-[120px]" />
               </div>

               <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md relative"
               >
                    <div className="flex flex-col items-center mb-8">
                         <div className="h-14 w-14 rounded-2xl bg-sage flex items-center justify-center shadow-lg mb-4">
                              <span className="text-white font-extrabold text-2xl">T</span>
                         </div>
                         <h1 className="text-2xl font-bold text-bark">Create your account</h1>
                         <p className="text-tan text-sm mt-1">Start with a free plan today</p>
                    </div>

                    <div className="bg-white border border-sand rounded-2xl p-8 shadow-md">
                         <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                              <div className="space-y-2">
                                   <Label htmlFor="name" className="text-bark text-sm font-medium">Full name</Label>
                                   <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
                                        <Input
                                             id="name"
                                             placeholder="John Doe"
                                             {...register("name")}
                                             className="pl-10 bg-cream border-sand text-bark placeholder-tan focus:border-sage"
                                        />
                                   </div>
                                   {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                              </div>

                              <div className="space-y-2">
                                   <Label htmlFor="email" className="text-bark text-sm font-medium">Email</Label>
                                   <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
                                        <Input
                                             id="email"
                                             type="email"
                                             placeholder="you@example.com"
                                             {...register("email")}
                                             className="pl-10 bg-cream border-sand text-bark placeholder-tan focus:border-sage"
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
                                             placeholder="Min 8 characters"
                                             {...register("password")}
                                             className="pl-10 pr-10 bg-cream border-sand text-bark placeholder-tan focus:border-sage"
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

                              <div className="space-y-2">
                                   <Label htmlFor="confirmPassword" className="text-bark text-sm font-medium">Confirm password</Label>
                                   <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
                                        <Input
                                             id="confirmPassword"
                                             type="password"
                                             placeholder="Repeat password"
                                             {...register("confirmPassword")}
                                             className="pl-10 bg-cream border-sand text-bark placeholder-tan focus:border-sage"
                                        />
                                   </div>
                                   {errors.confirmPassword && (
                                        <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>
                                   )}
                              </div>

                              <Button
                                   type="submit"
                                   disabled={isSubmitting}
                                   className="w-full bg-sage hover:bg-sage-dark text-white font-semibold h-11 rounded-lg shadow-sm"
                              >
                                   {isSubmitting ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>
                                   ) : "Create account"}
                              </Button>
                         </form>

                         <p className="text-center text-tan text-sm mt-6">
                              Already have an account?{" "}
                              <Link to="/login" className="text-sage hover:text-sage-dark font-medium">
                                   Sign in
                              </Link>
                         </p>
                    </div>
               </motion.div>
          </div>
     );
}

import React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Layout, 
  Users, 
  BarChart3, 
  Smartphone, 
  ArrowRight, 
  Zap,
  Globe, 
  ShieldCheck, 
  MousePointer2, 
  Rocket, 
  Plus, 
  MessageSquare, 
  Video, 
  Bell, 
  Activity, 
  ArrowUpRight, 
  X 
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const LandingPage = () => {
  const { hash, pathname } = useLocation();

  React.useEffect(() => {
    let targetId = '';
    if (hash) {
      targetId = hash.replace('#', '');
    } else if (pathname !== '/') {
      targetId = pathname.replace('/', '');
    }

    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hash, pathname]);

  return (
    <div className="min-h-screen bg-cream font-sans text-bark selection:bg-sage selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-cream/80 backdrop-blur-md border-b border-sand/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sage rounded-lg shadow-lg shadow-sage/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-bark uppercase">Structo</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/#features" className="hover:text-sage transition-colors">Features</Link>
            <Link to="/#how-it-works" className="hover:text-sage transition-colors">How it works</Link>
            <Link to="/#pricing" className="hover:text-sage transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="hover:bg-sand/50">Login</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-sage hover:bg-sage-dark text-white rounded-full px-6 shadow-lg shadow-sage/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-sage/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sage/10 text-sage text-[10px] font-black uppercase tracking-widest mb-8 border border-sage/20">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-time Synchronization Active</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8 text-bark tracking-tighter">
              Synchronize <br />
              <span className="text-sage italic">Everything.</span>
            </h1>
            <p className="text-xl text-tan font-medium mb-10 max-w-lg leading-relaxed">
              The unified engine for high-performance teams. Workspaces, projects, and real-time collaboration—perfectly orchestrated in one premium interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link to="/signup">
                <Button size="lg" className="bg-bark hover:bg-sage text-white rounded-2xl px-10 h-16 text-lg font-black transition-all duration-500 shadow-2xl shadow-bark/20 border-none group">
                  Get Started for Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div className="flex items-center gap-4 px-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-2xl border-4 border-cream bg-sand flex items-center justify-center overflow-hidden shadow-lg">
                      <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="text-xs font-bold text-tan leading-tight">
                  <span className="text-bark font-black">15,402+</span> <br />
                  Professional Collaborators
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: "circOut", delay: 0.2 }}
            className="relative z-0"
          >
            <div className="relative aspect-[16/10] bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(50,50,93,0.15),0_30px_60px_-30px_rgba(0,0,0,0.2)] border-8 border-white overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-sage/10 to-transparent pointer-events-none" />
              <img 
                src="/landing/hero.png" 
                alt="Structo Dashboard" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-bark/30 backdrop-blur-sm">
                <div className="p-1 bg-white/20 rounded-full backdrop-blur-xl">
                    <Button variant="secondary" className="rounded-full px-8 h-12 font-black border-none shadow-2xl">Precision Preview</Button>
                </div>
              </div>
            </div>
            
            {/* Dynamic Status Badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-8 -right-8 p-5 bg-white rounded-3xl shadow-2xl border border-sand/30 hidden md:block z-20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sage/10 rounded-2xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-sage" />
                </div>
                <div>
                  <p className="text-xs font-black text-bark">Live Syncing</p>
                  <p className="text-[10px] text-tan font-bold uppercase tracking-widest">Meeting Active</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-10 -left-12 p-5 bg-bark rounded-3xl shadow-2xl border border-bark hidden md:block z-20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-tan/20 rounded-2xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-tan" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Notation</p>
                  <p className="text-[10px] text-tan/70 font-bold uppercase tracking-widest italic">New Invite</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
         <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1 relative">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-8 bg-sand/30 rounded-3xl space-y-4 opacity-50 grayscale scale-95">
                        <X className="w-8 h-8 text-red-500" />
                        <h4 className="font-black text-bark">Scattered Tools</h4>
                        <p className="text-xs text-tan font-medium">Chat in Slack, tasks in Jira, meetings in Zoom. Total fragmentation.</p>
                    </div>
                    <div className="p-8 bg-sand/30 rounded-3xl space-y-4 opacity-50 grayscale translate-y-8">
                        <X className="w-8 h-8 text-red-500" />
                        <h4 className="font-black text-bark">Ghost Notifs</h4>
                        <p className="text-xs text-tan font-medium">Missing crucial invites because they're buried in email chains.</p>
                    </div>
                    <div className="col-span-2 p-1 bg-gradient-to-r from-sage/50 to-tan/50 rounded-[2.5rem] mt-8">
                        <div className="bg-white p-10 rounded-[2.2rem] flex items-center gap-8 shadow-xl">
                             <div className="h-16 w-16 bg-sage rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-sage/20">
                                <CheckCircle2 className="h-8 w-8 text-white" />
                             </div>
                             <div>
                                <h4 className="text-2xl font-black text-bark">The Synchrony Effect</h4>
                                <p className="text-tan font-medium leading-relaxed">Everything in one place. Real-time, role-based, and perfectly organized.</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="order-1 md:order-2 space-y-6">
                <p className="text-sage text-sm font-black uppercase tracking-[0.3em]">The Opportunity Cost</p>
                <h2 className="text-4xl md:text-6xl font-black text-bark tracking-tight leading-none">
                    Fragmentation is the <span className="text-tan italic">Enemy</span> of Progress.
                </h2>
                <p className="text-bark/70 text-lg leading-relaxed font-medium pt-4">
                    Most teams lose 20% of their productivity switching between disconnected tools. Structo eliminates this "context-switching tax" by unifying your entire professional synchronization layer.
                </p>
                <div className="pt-8 flex gap-8">
                    <div>
                        <p className="text-3xl font-black text-bark">20%</p>
                        <p className="text-xs text-tan font-bold uppercase tracking-widest">Time Reclaimed</p>
                    </div>
                    <div className="w-[1px] h-12 bg-sand" />
                    <div>
                        <p className="text-3xl font-black text-bark">100%</p>
                        <p className="text-xs text-tan font-bold uppercase tracking-widest">Team Alignment</p>
                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-24 px-6 bg-sand-light/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Everything you need to <span className="text-sage">succeed</span>.</h2>
            <p className="text-bark/60 max-w-2xl mx-auto">A comprehensive suite of tools designed to remove friction from your workflow.</p>
          </div>

          <div className="grid md:grid-cols-6 md:grid-rows-2 gap-6 h-auto md:h-[700px]">
            {/* Feature 1: Workspaces */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="md:col-span-3 bg-white p-10 rounded-[3rem] shadow-xl shadow-bark/5 border border-sand/30 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-sage/5 rounded-bl-full group-hover:bg-sage/10 transition-all duration-700" />
              <div>
                <div className="h-14 w-14 bg-sage rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-sage/20">
                    <Layout className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-black mb-4 text-bark">Integrated Workspaces</h3>
                <p className="text-tan font-bold leading-relaxed">High-isolation environments for your distinct initiatives. Perfect for agencies and multi-project leaders who demand peak organization.</p>
              </div>
              <div className="mt-8 flex gap-3">
                <Badge variant="outline" className="border-sand text-tan font-black text-[10px] py-1 px-3">ISOLATED ENCRYPTION</Badge>
                <Badge variant="outline" className="border-sand text-tan font-black text-[10px] py-1 px-3">UNLIMITED SCALE</Badge>
              </div>
            </motion.div>

            {/* Feature 2: Sync Engine */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="md:col-span-3 bg-bark p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between text-white relative overflow-hidden"
            >
              <div className="absolute -bottom-10 -right-10 opacity-10">
                 <Activity className="w-64 h-64 text-tan" />
              </div>
              <div>
                <div className="h-14 w-14 bg-tan rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-tan/20">
                    <Activity className="w-8 h-8 text-bark" />
                </div>
                <h3 className="text-3xl font-black mb-4">The Synchrony Engine</h3>
                <p className="text-white/60 font-medium leading-relaxed">Powered by Socket.io and GraphQL, our engine delivers zero-latency state updates across every connected device in your ecosystem.</p>
              </div>
              <div className="flex gap-4 mt-10">
                <div className="flex-1 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                   <p className="text-3xl font-black text-tan mb-1">99.9%</p>
                   <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Efficiency</p>
                </div>
                <div className="flex-1 p-6 bg-tan/10 rounded-3xl border border-tan/20 backdrop-blur-md">
                   <p className="text-3xl font-black text-white mb-1">&lt;10ms</p>
                   <p className="text-[10px] text-tan/50 font-black uppercase tracking-widest">Latency</p>
                </div>
              </div>
            </motion.div>

            {/* Feature 3: Meetings */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-tan/5 p-8 rounded-[2.5rem] border border-tan/10 flex flex-col gap-6"
            >
              <div className="h-12 w-12 bg-tan/10 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-tan" />
              </div>
              <h3 className="text-xl font-black text-bark leading-tight">Video Synchrony</h3>
              <p className="text-tan font-bold text-sm leading-relaxed">Integrated P2P video and audio rooms. No more external links—just join and present.</p>
            </motion.div>

            {/* Feature 4: Notations */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-sage/5 p-8 rounded-[2.5rem] border border-sage/20 flex flex-col gap-6"
            >
              <div className="h-12 w-12 bg-sage/10 rounded-xl flex items-center justify-center relative">
                  <Bell className="w-6 h-6 text-sage" />
                  <div className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white" />
              </div>
              <h3 className="text-xl font-black text-bark leading-tight">Notation Center</h3>
              <p className="text-tan font-bold text-sm leading-relaxed">A centralized stream for invites, mentions, and alerts. Never drift out of sync again.</p>
            </motion.div>

            {/* Feature 5: Permission Engine */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-sand shadow-lg shadow-bark/5 flex flex-col gap-6"
            >
              <div className="h-12 w-12 bg-bark/5 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-bark" />
              </div>
              <h3 className="text-xl font-black text-bark leading-tight">Role Sovereignty</h3>
              <p className="text-tan font-bold text-sm leading-relaxed">Granular Admin, Member, and Viewer roles. You decide who drive and who observes.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-cream relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sand/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Streamlined for <span className="text-sage">speed</span>.</h2>
            <p className="text-bark/60 max-w-2xl mx-auto">Launch your next project in seconds, not hours.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl border border-sand/30 flex items-center justify-center mb-8 relative group-hover:scale-110 transition-transform duration-500">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-sage text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">1</span>
                <Plus className="w-10 h-10 text-sage" />
              </div>
              <h3 className="text-xl font-bold mb-4">Create Workspace</h3>
              <p className="text-bark/60 text-sm leading-relaxed">Initialize your organization. One workspace for everything, or many for isolated projects.</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl border border-sand/30 flex items-center justify-center mb-8 relative group-hover:scale-110 transition-transform duration-500">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-sage text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">2</span>
                <MousePointer2 className="w-10 h-10 text-tan" />
              </div>
              <h3 className="text-xl font-bold mb-4">Invite & Organize</h3>
              <p className="text-bark/60 text-sm leading-relaxed">Add team members and define roles. Create projects and start populating them with tasks.</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl border border-sand/30 flex items-center justify-center mb-8 relative group-hover:scale-110 transition-transform duration-500">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-sage text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">3</span>
                <Rocket className="w-10 h-10 text-bark" />
              </div>
              <h3 className="text-xl font-bold mb-4">Launch & Sync</h3>
              <p className="text-bark/60 text-sm leading-relaxed">Get to work. Everything stays in sync across all devices with real-time updates.</p>
            </div>
            
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[10%] h-[2px] bg-gradient-to-r from-sand via-sage/20 to-sand -z-10" />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent <span className="text-sage">pricing</span>.</h2>
            <p className="text-bark/60">Choose the plan that fits your ambition.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan - THE ONLY ACTIVE ONE */}
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-sage shadow-2xl shadow-sage/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-sage px-6 py-2 text-[10px] font-black text-white rounded-bl-2xl tracking-[0.2em]">ACTIVE & RECOMMENDED</div>
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-3xl font-black text-bark mb-1">Free Starter</h3>
                  <p className="text-tan text-sm font-bold">Everything you need to sync.</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-bark">₹0</p>
                  <p className="text-[10px] text-tan font-black uppercase tracking-widest">/ LIFETIME</p>
                </div>
              </div>
              <ul className="space-y-5 mb-12">
                {[
                  "1 Strategic Workspace",
                  "3 High-Priority Projects",
                  "5 Collaborators per Project",
                  "Real-time Socket.io Sync",
                  "Basic Notation Center"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-4 text-sm font-bold text-bark/80">
                    <div className="h-6 w-6 rounded-full bg-sage/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button className="w-full rounded-2xl h-16 bg-bark hover:bg-sage text-white font-black text-lg transition-all duration-300 shadow-xl border-none">
                  Get Started Instantly
                </Button>
              </Link>
            </div>

            {/* Professional Plan - FUTURE */}
            <div className="bg-sand/30 p-12 rounded-[3.5rem] border border-sand/50 relative overflow-hidden group opacity-80 grayscale-[0.5] hover:grayscale-0 transition-all duration-500">
              <div className="absolute top-0 right-0 bg-tan/20 px-6 py-2 text-[10px] font-black text-tan rounded-bl-2xl tracking-[0.2em]">COMING IN Q3</div>
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-3xl font-black text-bark/60 mb-1">Professional</h3>
                  <p className="text-tan/60 text-sm font-bold">Unlocking deeper insights.</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-bark/40 italic">Planning</p>
                  <p className="text-[10px] text-tan/40 font-black uppercase tracking-widest">/ WAITLIST</p>
                </div>
              </div>
              <ul className="space-y-5 mb-12 opacity-40">
                {[
                  "Unlimited Multi-Workspaces",
                  "Advanced Role Hierarchies",
                  "Integrated Video Meetings",
                  "AI Productivity Digest",
                  "Priority Notation Routing"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-4 text-sm font-bold text-bark/40">
                    <div className="h-6 w-6 rounded-full bg-sand flex items-center justify-center shrink-0">
                        <Plus className="w-3.5 h-3.5 text-tan" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button disabled className="w-full rounded-2xl h-16 bg-sand border-none text-tan font-black text-lg cursor-not-allowed">
                  Join the Waitlist
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-white border-y border-sand/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-2">
            <p className="text-5xl font-black text-bark tracking-tighter">99.9<span className="text-sage">%</span></p>
            <p className="text-tan text-[10px] font-black uppercase tracking-[0.2em]">Sync Accuracy</p>
            <div className="h-1.5 w-20 bg-sage rounded-full" />
          </div>
          <div className="space-y-2">
            <p className="text-5xl font-black text-bark tracking-tighter">0<span className="text-sage">ms</span></p>
            <p className="text-tan text-[10px] font-black uppercase tracking-[0.2em]">Socket Latency</p>
            <div className="h-1.5 w-20 bg-tan rounded-full" />
          </div>
          <div className="space-y-2">
            <p className="text-5xl font-black text-bark tracking-tighter">150<span className="text-sage">K</span></p>
            <p className="text-tan text-[10px] font-black uppercase tracking-[0.2em]">Notations Sent</p>
            <div className="h-1.5 w-20 bg-bark rounded-full" />
          </div>
          <div className="space-y-2">
            <p className="text-5xl font-black text-bark tracking-tighter">∞<span className="text-sage"></span></p>
            <p className="text-tan text-[10px] font-black uppercase tracking-[0.2em]">Collaboration</p>
            <div className="h-1.5 w-20 bg-cream rounded-full shadow-inner" />
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-32 px-6 bg-cream">
         <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
                <div className="space-y-4">
                    <p className="text-sage text-sm font-black uppercase tracking-[0.3em]">Insights</p>
                    <h2 className="text-4xl md:text-6xl font-black text-bark tracking-tight">The Synchrony <span className="text-tan italic">Digest</span></h2>
                </div>
                <Button variant="outline" className="hidden md:flex rounded-2xl border-sand text-bark font-black h-14 px-8 group">
                    View All Articles
                    <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
                <motion.div whileHover={{ y: -10 }} className="group cursor-pointer">
                    <div className="aspect-[16/9] bg-sand rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl relative">
                        <img 
                            src="/landing/blog_1.png" 
                            alt="Productivity Blog" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                        <div className="absolute top-6 left-6">
                            <Badge className="bg-white/90 backdrop-blur-md text-bark font-black px-4 py-1.5 rounded-xl border-none">FEATURED</Badge>
                        </div>
                    </div>
                    <div className="px-4 space-y-4">
                        <p className="text-xs font-black text-tan uppercase tracking-widest">Efficiency • 5 min read</p>
                        <h3 className="text-3xl font-black text-bark leading-tight group-hover:text-sage transition-colors">The Art of Real-Time Workspace Management</h3>
                        <p className="text-tan font-medium leading-relaxed">Discover how Synchrony's latest meeting tools are reclaiming 10+ hours a week for high-growth tech teams.</p>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -10 }} className="group cursor-pointer">
                    <div className="aspect-[16/9] bg-sand rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl relative">
                        <img 
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200" 
                            alt="Collaboration Blog" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                        <div className="absolute top-6 left-6">
                            <Badge className="bg-white/90 backdrop-blur-md text-bark font-black px-4 py-1.5 rounded-xl border-none">TRENDING</Badge>
                        </div>
                    </div>
                    <div className="px-4 space-y-4">
                        <p className="text-xs font-black text-tan uppercase tracking-widest">Leadership • 8 min read</p>
                        <h3 className="text-3xl font-black text-bark leading-tight group-hover:text-sage transition-colors">Scaling Beyond 50: Permission Hierarchies</h3>
                        <p className="text-tan font-medium leading-relaxed">How role-based access control (RBAC) prevents organizational drift in complex multi-workspace architectures.</p>
                    </div>
                </motion.div>
            </div>
         </div>
      </section>

      {/* CTA section */}
      <section className="py-24 px-6 relative overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto bg-bark rounded-[4rem] p-12 md:p-24 text-center text-white relative z-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-sage/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-tan/10 blur-[120px] rounded-full pointer-events-none" />
          
          <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter leading-none">Ready to reclaim your <span className="text-tan italic">focus?</span></h2>
          <p className="text-xl text-white/60 mb-14 max-w-2xl mx-auto font-medium">Join 15k+ professionals who have already synchronized their career. One tool. Total clarity.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-tan hover:bg-white text-bark font-black rounded-2xl px-12 h-18 text-xl shadow-2xl transition-all duration-300 border-none">
                Start for Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-2xl px-12 h-18 text-xl border-white/20 text-white hover:bg-white/10 font-black">
              Schedule Sync
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-sand/30 bg-cream">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 grayscale brightness-50 contrast-200">
            <div className="p-1 px-2 border-2 border-bark rounded font-black italic">FF</div>
            <span className="font-bold">Structo</span>
          </div>
          
          <div className="flex gap-8 text-sm text-bark/60">
            <a href="#" className="hover:text-bark transition-colors">Twitter</a>
            <a href="#" className="hover:text-bark transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-bark transition-colors">GitHub</a>
            <a href="#" className="hover:text-bark transition-colors">Privacy</a>
          </div>

          <p className="text-xs text-bark/40">© 2026 Structo Inc. Built for winners.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

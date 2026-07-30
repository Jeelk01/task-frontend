import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useAppQuery } from "@/hooks/useGraphQL";
import { GET_MY_WORKSPACES, GET_PROJECTS, GET_TASKS } from "@/graphql/queries";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Briefcase, Laptop2, Star, TrendingUp,
  Plus, ArrowRight, CheckCircle2, LayoutGrid,
  Zap, Clock, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { ProjectCard } from "@/components/ProjectCard";
import { getWorkspaceColorClasses } from "@/lib/workspace-utils";
import { cn } from "@/lib/utils";
import { CREATE_WORKSPACE } from "@/graphql/mutations";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppMutation } from "@/hooks/useGraphQL";
import type { PaginatedResponse, Workspace, Project, Task } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Dashboard() {
  const { user } = useAuth();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: wsData, refetch: refetchWorkspaces } = useAppQuery<{ findMyWorkspaces: PaginatedResponse<Workspace> }>(
    GET_MY_WORKSPACES,
    { variables: { args: { page: 1, limit: 3 } } }
  );

  const { data: projData } = useAppQuery<{ findProjects: PaginatedResponse<Project> }>(
    GET_PROJECTS,
    { variables: { args: { page: 1, limit: 3 } } }
  );

  const { data: taskData } = useAppQuery<{ findTasks: PaginatedResponse<Task> }>(
    GET_TASKS,
    { variables: { args: { page: 1, limit: 5 } } }
  );

  const [createWorkspace, { loading: creating }] = useAppMutation(CREATE_WORKSPACE, {
    successMessage: "Workspace created successfully!",
    onCompleted: () => {
      setIsCreateDialogOpen(false);
      refetchWorkspaces();
      reset();
    },
  });

  const onSubmit = async (values: FormData) => {
    await createWorkspace({
      variables: {
        input: {
          name: values.name,
          description: values.description,
          meta: { color: "sage" }
        },
      },
    });
  };

  const workspaces = wsData?.findMyWorkspaces?.items ?? [];
  const projects = projData?.findProjects?.items ?? [];
  const tasks = taskData?.findTasks?.items ?? [];
  const totalWorkspaces = wsData?.findMyWorkspaces?.totalItems ?? 0;

  const stats = [
    { label: "Active Workspaces", value: totalWorkspaces, icon: Briefcase, color: "text-sage" },
    { label: "Pending Tasks", value: taskData?.findTasks?.totalItems ?? 0, icon: Clock, color: "text-orange-500" },
    { label: "Live Projects", value: projData?.findProjects?.totalItems ?? 0, icon: Target, color: "text-blue-500" },
    { label: "Efficiency", value: "-", icon: Zap, color: "text-purple-500" },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 space-y-10 max-w-[1600px] mx-auto min-h-full">
      {/* Premium Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-sage font-bold tracking-widest uppercase text-[10px] mb-2">{greeting()}</p>
          <h1 className="text-4xl font-black text-bark tracking-tight">
            Welcome back, <span className="text-sage">{user?.name?.split(" ")[0] ?? "Captain"}</span>
          </h1>
          <p className="text-tan mt-2 font-medium">Your productivity landscape is looking sharp today.</p>
        </motion.div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowStats(!showStats)}
            className={cn(
              "rounded-xl border-sand bg-white/50 hover:bg-white gap-2 h-11 px-5 font-bold text-bark transition-all",
              !showStats && "bg-sage/10 border-sage text-sage"
            )}
          >
            <LayoutGrid className="h-4 w-4" /> {showStats ? "Hide Stats" : "Show Stats"}
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sage hover:bg-sage-dark text-white rounded-xl gap-2 h-11 px-6 shadow-accent transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-4 w-4" /> New Initiative
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-sand">
              <DialogHeader>
                <DialogTitle>Start a New Workspace</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input {...register("name")} placeholder="Engineering Team" className="bg-cream border-sand" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input {...register("description")} placeholder="Workspace for all engineering projects" className="bg-cream border-sand" />
                </div>
                <Button type="submit" disabled={creating} className="w-full bg-sage hover:bg-sage-dark text-white rounded-xl h-11">
                  {creating ? "Creating..." : "Create Workspace"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Hero Stats */}
      <AnimatePresence>
        {showStats && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 overflow-hidden"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6 group hover:translate-y-[-4px] transition-all duration-300 bg-white/40 border-sand/40">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-sand/50 transition-transform group-hover:scale-110", stat.color)}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="text-[10px] font-black text-tan/40 uppercase tracking-widest mt-1">Live</div>
                  </div>
                  <h3 className="text-3xl font-black text-bark mb-1 tracking-tight">{stat.value}</h3>
                  <p className="text-tan text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Projects & Workspaces */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-xl font-black text-bark tracking-tight flex items-center gap-2">
                <Target className="h-5 w-5 text-sage" /> Recent Projects
              </h2>
              <Link to="/projects" className="text-xs font-bold text-tan hover:text-sage transition-colors flex items-center gap-1">
                View All Projects <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.length > 0 ? projects.map((p) => (
                <ProjectCard key={p._id} project={p} />
              )) : (
                <div className="col-span-2 h-48 rounded-3xl border-2 border-dashed border-sand flex flex-col items-center justify-center text-tan">
                  <Briefcase className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm font-bold">No projects initialized yet</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-xl font-black text-bark tracking-tight flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-sage" /> Active Workspaces
              </h2>
              <Link to="/workspaces" className="text-xs font-bold text-tan hover:text-sage transition-colors flex items-center gap-1">
                Explore Hubs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workspaces.map((ws) => (
                <Link key={ws._id} to={`/projects?workspaceId=${ws._id}`}>
                  <GlassCard className="p-4 group hover:bg-white transition-all border-sand/40">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center font-black transition-all",
                        getWorkspaceColorClasses(ws).bg,
                        getWorkspaceColorClasses(ws).text,
                        `group-hover:${getWorkspaceColorClasses(ws).bg.replace('/10', '')}`,
                        "group-hover:text-white"
                      )}>
                        {ws.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className={cn("font-bold text-bark text-sm truncate transition-colors", getWorkspaceColorClasses(ws).hoverText)}>{ws.name}</h4>
                        <p className="text-[10px] text-tan font-bold uppercase">{ws.members?.length ?? 0} Members</p>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Urgent Tasks */}
        <div className="space-y-8">
          <section className="h-full">
            <GlassCard className="h-full p-6 flex flex-col bg-bark/5 border-bark/5">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-bark tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-sage" /> Focus List
                </h2>
                <span className="bg-sage text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                  {tasks.length} NEW
                </span>
              </div>

              <div className="space-y-4 flex-1">
                {tasks.length > 0 ? tasks.map((task, i) => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <div className="group p-4 bg-white/50 rounded-2xl border border-sand/30 hover:bg-white hover:border-sage/30 transition-all cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "h-2 w-2 rounded-full mt-1.5 shrink-0",
                          task.priority === "HIGH" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-tan/30"
                        )} />
                        <div>
                          <p className="text-sm font-bold text-bark line-clamp-2 leading-snug group-hover:text-sage transition-colors">
                            {task.note || "No details provided"}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="text-[10px] font-black text-tan/60 uppercase tracking-widest flex items-center gap-1">
                              <Target className="h-3 w-3" /> {task.projectId ? "Project" : "Standalone"}
                            </span>
                            <span className="text-[10px] font-black text-tan/60 uppercase tracking-widest flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {new Date(task.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="h-64 flex flex-col items-center justify-center text-tan/40 text-center">
                    <CheckCircle2 className="h-12 w-12 mb-2 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-widest leading-loose">
                      All Clear.<br/>Enjoy the silence.
                    </p>
                  </div>
                )}
              </div>

              <Button asChild variant="ghost" className="w-full mt-8 text-tan hover:text-sage hover:bg-sage/5 font-bold gap-2">
                <Link to="/tasks">View All Tasks <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </GlassCard>
          </section>
        </div>
      </div>
    </div>
  );
}

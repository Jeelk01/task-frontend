import { useState } from "react";
import { useAppQuery, useAppMutation } from "@/hooks/useGraphQL";
import { GET_PROJECTS, GET_MY_WORKSPACES } from "@/graphql/queries";
import { CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT } from "@/graphql/mutations";
import { ProjectMembersDialog } from "@/components/ProjectMembersDialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderIcon, Plus, Search, Filter, 
  LayoutGrid, List, Edit2, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { GlassCard } from "@/components/GlassCard";
import { ProjectCard } from "@/components/ProjectCard";
import { cn } from "@/lib/utils";
import type { PaginatedResponse, Project, Workspace } from "@/types";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  tags: z.string().optional(),
  workspaceId: z.string().min(1, "Please select a workspace"),
});

type FormData = z.infer<typeof schema>;

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [workspaceId, setWorkspaceId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [managingMembersProject, setManagingMembersProject] = useState<Project | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: wsData } = useAppQuery<{ findMyWorkspaces: PaginatedResponse<Workspace> }>(
    GET_MY_WORKSPACES,
    { variables: { args: { page: 1, limit: 100 } } }
  );

  const { data, loading, refetch } = useAppQuery<{ findProjects: PaginatedResponse<Project> }>(
    GET_PROJECTS,
    {
      variables: {
        args: {
          page,
          limit: 12,
          search: search || undefined,
          workspaceId: workspaceId === "all" ? undefined : workspaceId,
        },
      },
    }
  );

  const [createProject, { loading: creating }] = useAppMutation(CREATE_PROJECT, {
    successMessage: "Project created successfully!",
    onCompleted: () => {
      setIsDialogOpen(false);
      refetch();
      reset();
    },
  });

  const [updateProject, { loading: updating }] = useAppMutation(UPDATE_PROJECT, {
    successMessage: "Project updated successfully!",
    onCompleted: () => {
      setIsDialogOpen(false);
      setEditingProject(null);
      refetch();
      reset();
    },
  });

  const [deleteProject] = useAppMutation(DELETE_PROJECT, {
    successMessage: "Project deleted successfully!",
    onCompleted: () => {
      setProjectToDelete(null);
      refetch();
    },
  });

  const onSubmit = async (values: FormData) => {
    const input = {
      name: values.name,
      description: values.description,
      workspaceId: values.workspaceId,
      tags: values.tags ? values.tags.split(",").map(t => t.trim()) : [],
    };

    if (editingProject) {
      await updateProject({
        variables: {
          id: editingProject._id,
          input,
        },
      });
    } else {
      await createProject({
        variables: {
          input,
        },
      });
    }
  };

  const onEdit = (project: Project) => {
    setEditingProject(project);
    setValue("name", project.name);
    setValue("description", project.description || "");
    setValue("tags", project.tags?.join(", ") || "");
    setValue("workspaceId", project.workspaceId);
    setIsDialogOpen(true);
  };

  const projects = data?.findProjects?.items ?? [];
  const workspaces = wsData?.findMyWorkspaces?.items ?? [];
  const totalPages = data?.findProjects?.totalPages ?? 1;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto min-h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-extrabold text-bark tracking-tight">
            Projects <span className="text-sage">.</span>
          </h1>
          <p className="text-tan mt-2 font-medium">
            Manage your initiatives across {workspaces.length} workspaces
          </p>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="flex bg-sand/30 p-1 rounded-xl border border-sand">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={cn("h-8 w-8 rounded-lg", viewMode === "grid" && "bg-white shadow-sm text-sage")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={cn("h-8 w-8 rounded-lg", viewMode === "list" && "bg-white shadow-sm text-sage")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog 
            open={editingProject !== null || (editingProject === null && isDialogOpen)} 
            onOpenChange={(open) => {
              if (!open) {
                setIsDialogOpen(false);
                setEditingProject(null);
                reset();
              } else {
                setIsDialogOpen(true);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-sage hover:bg-sage-dark text-white rounded-xl gap-2 h-10 px-5 shadow-accent transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-sand">
              <DialogHeader>
                <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input {...register("name")} placeholder="Website Redesign" className="bg-cream border-sand" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Workspace</Label>
                  <Select 
                    value={watch("workspaceId")} 
                    onValueChange={(v) => setValue("workspaceId", v)}
                  >
                    <SelectTrigger className="bg-cream border-sand">
                      <SelectValue placeholder="Select Workspace" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-sand">
                      {workspaces.map(ws => (
                        <SelectItem key={ws._id} value={ws._id}>{ws.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.workspaceId && <p className="text-xs text-red-500">{errors.workspaceId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input {...register("description")} placeholder="Project goals and scope" className="bg-cream border-sand" />
                </div>

                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input {...register("tags")} placeholder="marketing, q1, priority" className="bg-cream border-sand" />
                </div>

                <Button 
                  type="submit" 
                  disabled={creating || updating} 
                  className="w-full bg-sage hover:bg-sage-dark text-white rounded-xl h-11"
                >
                  {creating || updating ? "Saving..." : editingProject ? "Update Project" : "Create Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 flex flex-wrap items-center gap-4 bg-white/50 border-sand/50">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 h-11 bg-cream/50 border-sand/50 rounded-xl"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Select 
            value={workspaceId} 
            onValueChange={(v) => { setWorkspaceId(v); setPage(1); }}
          >
            <SelectTrigger className="w-[200px] h-11 bg-cream/50 border-sand/50 rounded-xl text-bark font-bold">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-sage" />
                <SelectValue placeholder="All Workspaces" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-sand">
              <SelectItem value="all">All Workspaces</SelectItem>
              {workspaces.map(ws => (
                <SelectItem key={ws._id} value={ws._id}>{ws.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-sand/20 animate-pulse border border-sand/30" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-24 text-center glass rounded-3xl border-dashed border-2 border-sand"
        >
          <FolderIcon className="h-16 w-16 mx-auto mb-4 text-tan/30" />
          <h3 className="text-xl font-semibold text-bark mb-1">No Projects Found</h3>
          <p className="text-tan max-w-xs mx-auto">
            {search || workspaceId !== "all" 
              ? "Try adjusting your filters to find what you're looking for." 
              : "Start by creating a new project to organize your tasks."}
          </p>
        </motion.div>
      ) : (
        <div className={cn(
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "flex flex-col gap-4"
        )}>
          <AnimatePresence mode="popLayout">
            {projects.map((project, i) => (
              <motion.div
                key={project._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <ProjectCard 
                  project={project} 
                  viewMode={viewMode} 
                  onEdit={onEdit} 
                  onDelete={setProjectToDelete}
                  onManageMembers={setManagingMembersProject}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Container */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-6">
          <Button 
            variant="outline" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="rounded-xl border-sand bg-white text-bark hover:bg-sage/5 hover:text-sage transition-all"
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button
                key={p}
                variant={page === p ? "default" : "ghost"}
                size="sm"
                onClick={() => setPage(p)}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg font-bold text-xs transition-all",
                  page === p ? "bg-sage text-white shadow-md" : "text-tan hover:text-bark hover:bg-sand"
                )}
              >
                {p}
              </Button>
            ))}
          </div>
          <Button 
            variant="outline" 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="rounded-xl border-sand bg-white text-bark hover:bg-sage/5 hover:text-sage transition-all"
          >
            Next
          </Button>
        </div>
      )}
      
      {/* Deletion Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent className="bg-white border-sand">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project <span className="font-bold text-bark">"{projectToDelete?.name}"</span> and all its associated tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-sand">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => projectToDelete && deleteProject({ variables: { id: projectToDelete._id } })}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Members Dialog */}
      {managingMembersProject && (
        <ProjectMembersDialog
          projectId={managingMembersProject._id}
          projectName={managingMembersProject.name}
          isOpen={!!managingMembersProject}
          onOpenChange={(open) => !open && setManagingMembersProject(null)}
        />
      )}
    </div>
  );
}

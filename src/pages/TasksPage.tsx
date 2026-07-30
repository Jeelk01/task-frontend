import { useState } from "react";
import { useAppQuery, useAppMutation } from "@/hooks/useGraphQL";
import { GET_TASKS, GET_PROJECTS, GET_WORKSPACES, GET_PROJECT_MEMBERS, GET_WORKSPACE_MEMBERS } from "@/graphql/queries";
import { CREATE_TASK, UPDATE_TASK, DELETE_TASK } from "@/graphql/mutations";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, Plus, Search, Filter, 
  MoreVertical, Calendar, User as UserIcon, Tag, 
  ArrowRight, LayoutGrid, List, AlertCircle,
  Clock, CheckSquare, MoreHorizontal, Edit2, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import type { PaginatedResponse, Task, Project, Workspace, User } from "@/types";
import { TaskBoard } from "@/components/TaskBoard";
import { useSearchParams } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";

const taskSchema = z.object({
  note: z.string().min(2, "Note must be at least 2 characters"),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKER"]),
  priority: z.enum(["HIGH", "MEDIUM", "LOW", "URGENT"]),
  projectId: z.string().min(1, "Please select a project"),
  workspaceId: z.string().min(1, "Please select a workspace"),
  assignedTo: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const STATUS_COLUMNS = [
  { id: "PENDING", label: "To Do", color: "bg-tan/20 text-tan border-tan/30" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-sage/20 text-sage border-sage/30" },
  { id: "COMPLETED", label: "Done", color: "bg-green-500/10 text-green-600 border-green-500/20" },
];

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "text-red-700 font-black",
  HIGH: "text-red-500",
  MEDIUM: "text-orange-500",
  LOW: "text-blue-500",
};

export default function TasksPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get("projectId") || "all";
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [workspaceId, setWorkspaceId] = useState<string>("all");
  const [projectId, setProjectId] = useState<string>(initialProjectId);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: "PENDING",
      priority: "MEDIUM",
    },
  });

  const { data: wsData } = useAppQuery<{ findWorkspaceWithPagination: PaginatedResponse<Workspace> }>(
    GET_WORKSPACES,
    { variables: { input: { page: 1, limit: 100 } } }
  );

  const { data: projData } = useAppQuery<{ findProjects: PaginatedResponse<Project> }>(
    GET_PROJECTS,
    { 
      variables: { 
        args: { 
          page: 1, 
          limit: 100, 
          workspaceId: workspaceId === "all" ? undefined : workspaceId 
        } 
      } 
    }
  );

  const selectedWorkspaceId = watch("workspaceId");
  const selectedProjectId = watch("projectId");

  const { data: membersData } = useAppQuery(
    selectedProjectId && selectedProjectId !== "all" ? GET_PROJECT_MEMBERS : GET_WORKSPACE_MEMBERS,
    {
      variables: {
        input: {
          projectId: selectedProjectId !== "all" ? selectedProjectId : undefined,
          workspaceId: !selectedProjectId || selectedProjectId === "all" ? selectedWorkspaceId : undefined,
          page: 1,
          limit: 100
        }
      },
      skip: (!selectedProjectId || selectedProjectId === "all") && (!selectedWorkspaceId || selectedWorkspaceId === "all")
    }
  );

  const members = (membersData as any)?.findProjectMemberWithPagination?.items || 
                  (membersData as any)?.findWorkspaceMemberWithPagination?.items || [];

  const { data, loading, refetch } = useAppQuery<{ findTasks: PaginatedResponse<Task> }>(
    GET_TASKS,
    {
      variables: {
        args: {
          page,
          limit: 50,
          search: search || undefined,
          workspaceId: workspaceId === "all" ? undefined : workspaceId,
          projectId: projectId === "all" ? undefined : projectId,
        },
      },
    }
  );

  const [createTask, { loading: creating }] = useAppMutation(CREATE_TASK, {
    successMessage: "Task created successfully!",
    onCompleted: () => {
      setIsDialogOpen(false);
      refetch();
      reset();
    },
  });

  const [updateTask, { loading: updating }] = useAppMutation(UPDATE_TASK, {
    successMessage: "Task updated successfully!",
    onCompleted: () => {
      setIsDialogOpen(false);
      setEditingTask(null);
      refetch();
      reset();
    },
  });

  const [deleteTask] = useAppMutation(DELETE_TASK, {
    successMessage: "Task deleted successfully!",
    onCompleted: () => {
      setTaskToDelete(null);
      refetch();
    },
  });

  const tasks = data?.findTasks?.items ?? [];
  const workspaces = wsData?.findWorkspaceWithPagination?.items ?? [];
  const projects = projData?.findProjects?.items ?? [];

  const moveTask = async (taskId: string, newStatus: string) => {
    await updateTask({
      variables: {
        input: { id: taskId, status: newStatus },
      },
    });
  };

  const onSubmit = async (values: TaskFormData) => {
    const input: any = {
      ...values,
      assignedTo: values.assignedTo ? [values.assignedTo] : [],
    };

    if (editingTask) {
      await updateTask({
        variables: {
          input: { id: editingTask._id, ...input },
        },
      });
    } else {
      await createTask({
        variables: {
          input,
        },
      });
    }
  };

  const onEditTask = (task: Task) => {
    setEditingTask(task);
    setValue("note", task.note || "");
    setValue("status", task.status);
    setValue("priority", task.priority as any);
    setValue("projectId", task.projectId);
    setValue("workspaceId", task.workspaceId);
    setValue("assignedTo", task.assignedTo?.[0] || "");
    setIsDialogOpen(true);
  };

  const onAddTaskInColumn = (status: string) => {
    reset();
    setValue("status", status);
    if (workspaceId !== "all") setValue("workspaceId", workspaceId);
    if (projectId !== "all") setValue("projectId", projectId);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-8 min-h-full max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-extrabold text-bark tracking-tight flex items-center gap-3">
            Tasks <CheckCircle2 className="h-8 w-8 text-sage" />
          </h1>
          <p className="text-tan mt-2 font-medium">
            Keep track of your objectives and streamline your workflow.
          </p>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="flex bg-sand/30 p-1 rounded-xl border border-sand">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("board")}
              className={cn("h-8 w-8 rounded-lg", viewMode === "board" && "bg-white shadow-sm text-sage")}
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
            open={editingTask !== null || (editingTask === null && isDialogOpen)} 
            onOpenChange={(open) => {
              if (!open) {
                setIsDialogOpen(false);
                setEditingTask(null);
                reset();
              } else {
                setIsDialogOpen(true);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-sage hover:bg-sage-dark text-white rounded-xl gap-2 h-10 px-5 shadow-accent transition-all hover:scale-[1.02]">
                <Plus className="h-4 w-4" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-sand max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Task Title / Note</Label>
                    <Input {...register("note")} placeholder="Complete high-fidelity mockups" className="bg-cream border-sand" />
                    {errors.note && <p className="text-xs text-red-500">{errors.note.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Workspace</Label>
                    <Select 
                      value={watch("workspaceId")} 
                      onValueChange={(v) => {
                        setValue("workspaceId", v);
                        setValue("projectId", "all"); // Reset project when workspace changes
                      }}
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
                    <Label>Project</Label>
                    <Select 
                      value={watch("projectId")} 
                      onValueChange={(v) => setValue("projectId", v)}
                    >
                      <SelectTrigger className="bg-cream border-sand">
                        <SelectValue placeholder="Select Project" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-sand">
                        <SelectItem value="all">No Project</SelectItem>
                        {projects.filter(p => p.workspaceId === watch("workspaceId")).map(p => (
                          <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.projectId && <p className="text-xs text-red-500">{errors.projectId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                      <SelectTrigger className="bg-cream border-sand capitalize">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-sand">
                        {STATUS_COLUMNS.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={watch("priority")} 
                      onValueChange={(v) => setValue("priority", v as any)}
                    >
                      <SelectTrigger className="bg-cream border-sand capitalize">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-sand">
                        {["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>Assigned To</Label>
                    <Select 
                      value={watch("assignedTo")} 
                      onValueChange={(v) => setValue("assignedTo", v)}
                    >
                      <SelectTrigger className="bg-cream border-sand">
                        <SelectValue placeholder="Assign someone..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-sand">
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.map((m: any) => (
                          <SelectItem key={m.userId || m.email} value={m.userId || m.email}>
                            {m.user?.name || m.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={creating || updating} 
                  className="w-full bg-sage hover:bg-sage-dark text-white rounded-xl h-11"
                >
                  {creating || updating ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 flex flex-wrap items-center gap-4 bg-white/50">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
          <Input 
            placeholder="Search tasks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-cream/50 border-sand/50 rounded-xl"
          />
        </div>
        
        <Select value={workspaceId} onValueChange={setWorkspaceId}>
          <SelectTrigger className="w-[180px] h-10 bg-cream/50 border-sand/50 rounded-xl text-xs font-medium">
            <SelectValue placeholder="Workspace" />
          </SelectTrigger>
          <SelectContent className="bg-white border-sand">
            <SelectItem value="all">All Workspaces</SelectItem>
            {workspaces.map(ws => <SelectItem key={ws._id} value={ws._id}>{ws.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-[180px] h-10 bg-cream/50 border-sand/50 rounded-xl text-xs font-medium">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent className="bg-white border-sand">
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </GlassCard>

      {/* Content Area */}
      {viewMode === "board" ? (
        <TaskBoard 
          tasks={tasks} 
          columns={STATUS_COLUMNS} 
          loading={loading} 
          onEditTask={onEditTask}
          onDeleteTask={setTaskToDelete}
          onAddTaskInColumn={onAddTaskInColumn}
          currentUserId={user?._id}
        />
      ) : (
        <GlassCard className="p-0 overflow-hidden bg-white/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sand bg-sand/10">
                <th className="p-4 text-xs font-bold text-tan uppercase tracking-wider">Task</th>
                <th className="p-4 text-xs font-bold text-tan uppercase tracking-wider">Workspace</th>
                <th className="p-4 text-xs font-bold text-tan uppercase tracking-wider">Project</th>
                <th className="p-4 text-xs font-bold text-tan uppercase tracking-wider">Assigned To</th>
                <th className="p-4 text-xs font-bold text-tan uppercase tracking-wider">By</th>
                <th className="p-4 text-xs font-bold text-tan uppercase tracking-wider">Created</th>
                <th className="p-4 text-xs font-bold text-tan uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const isAssignedToMe = task.assignedTo?.includes(user?._id || "");
                const canModify = isAssignedToMe || task.assignedBy === user?._id;

                return (
                  <tr 
                    key={task._id} 
                    onClick={() => canModify && onEditTask(task)}
                    className={cn(
                      "border-b border-sand/30 transition-colors group",
                      canModify ? "hover:bg-white cursor-pointer" : "opacity-80 grayscale-[0.2] cursor-not-allowed",
                      isAssignedToMe && "bg-sage/5"
                    )}
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <CheckSquare className={cn("h-4 w-4 transition-colors", isAssignedToMe ? "text-sage" : "text-tan group-hover:text-sage")} />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-bark line-clamp-1">{task.note || "New Task"}</span>
                            {isAssignedToMe && (
                              <span className="text-[8px] font-black text-white bg-sage px-1.5 py-0.5 rounded-full uppercase tracking-tighter">My Task</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1 ml-7">
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                          STATUS_COLUMNS.find(c => c.id === task.status)?.color || "bg-sand text-tan"
                        )}>
                          {task.status}
                        </span>
                        <span className={cn("text-[9px] font-bold uppercase", PRIORITY_COLORS[task.priority])}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-tan bg-sand/30 px-2 py-1 rounded-lg border border-sand/50">
                      {task.workspace?.name || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-bark bg-cream px-2 py-1 rounded-lg border border-sand/30">
                      {task.project?.name || "General"}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-xs text-tan">
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-sand/30 flex items-center justify-center text-[10px] font-bold">
                          {task.assignees[0].name.charAt(0)}
                        </div>
                        {task.assignees[0].name}
                      </div>
                    ) : (
                      <span className="text-tan/50 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4 font-medium text-xs text-tan">
                    <div className="flex items-center gap-2">
                       <div className="h-6 w-6 rounded-full bg-cream border border-sand flex items-center justify-center text-[10px] font-bold text-bark">
                          {(task.assigner?.name || "S").charAt(0)}
                       </div>
                       {task.assigner?.name || "System"}
                    </div>
                  </td>
                  <td className="p-4 text-xs text-tan font-medium">{new Date(task.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    {canModify && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-tan hover:bg-sand rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-sand">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }} className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream">
                            <Edit2 className="h-4 w-4 text-sage" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTaskToDelete(task); }} className="gap-2 cursor-pointer text-red-500 font-bold hover:bg-red-50">
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* Deletion Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent className="bg-white border-sand">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task <span className="font-bold text-bark">"{taskToDelete?.note}"</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-sand">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => taskToDelete && deleteTask({ variables: { id: taskToDelete._id } })}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

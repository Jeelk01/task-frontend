import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, MoreHorizontal, AlertCircle, 
  Clock, CheckSquare, Calendar, UserIcon,
  Edit2, Trash2, Link2, Layout, Folder
} from "lucide-react";
import { Button } from "./ui/button";
import { getWorkspaceColorClasses } from "@/lib/workspace-utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Task } from "@/types";

interface TaskBoardProps {
  tasks: Task[];
  columns: { id: string, label: string, color: string }[];
  loading?: boolean;
  canEditTask?: (task: Task) => boolean;
  canDeleteTask?: (task: Task) => boolean;
  canAddInColumn?: boolean;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAddTaskInColumn?: (status: string) => void;
  onTaskMove?: (task: Task, newStatus: string) => void;
  currentUserId?: string;
}

export function TaskBoard({ 
  tasks, 
  columns, 
  loading, 
  canEditTask = () => true,
  canDeleteTask = () => true,
  canAddInColumn = true,
  onEditTask, 
  onDeleteTask, 
  onAddTaskInColumn, 
  onTaskMove,
  currentUserId
}: TaskBoardProps) {
  const priorityColors: Record<string, string> = {
    HIGH: "text-red-500",
    MEDIUM: "text-orange-500",
    LOW: "text-blue-500",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px]">
      {columns.map((col) => (
        <div key={col.id} className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", col.color)}>
                {col.label}
              </span>
              <span className="text-tan text-xs font-bold">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            {canAddInColumn && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onAddTaskInColumn?.(col.id)}
                className="h-8 w-8 text-tan hover:bg-sand rounded-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 bg-sand/10 rounded-2xl p-2 border border-sand/30 border-dashed space-y-3 min-h-[400px]">
            <AnimatePresence mode="popLayout">
              {tasks.filter(t => t.status === col.id).map((task, i) => {
                const isAssignedToMe = task.assignedTo?.includes(currentUserId || "");
                const canModify = canEditTask(task) && (isAssignedToMe || task.assignedBy === currentUserId);

                return (
                  <motion.div
                    key={task._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <GlassCard 
                      onClick={() => canModify && onEditTask?.(task)}
                      className={cn(
                        "p-4 group transition-all border-sand/50",
                        canModify ? "cursor-pointer hover:bg-white shadow-sm hover:shadow-md" : "opacity-80 grayscale-[0.2] cursor-not-allowed",
                        isAssignedToMe && "ring-2 ring-sage/50 bg-sage/5 border-sage/30 shadow-sage/10"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-extrabold flex items-center gap-1", priorityColors[task.priority] || "text-tan")}>
                              <AlertCircle className="h-2.5 w-2.5" /> {task.priority}
                            </span>
                            {isAssignedToMe && (
                              <span className="text-[9px] font-black text-white bg-sage px-1.5 py-0.5 rounded-full uppercase tracking-tighter animate-pulse shadow-sm shadow-sage/20">
                                My Task
                              </span>
                            )}
                          </div>
                          {task.blockerTask && (
                            <span className="text-[9px] font-black text-red-500 flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                              <Link2 className="h-2.5 w-2.5" /> BLOCKED
                            </span>
                          )}
                        </div>
                        {canModify && (canEditTask(task) || canDeleteTask(task)) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-tan opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-sand">
                              {canEditTask(task) && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask?.(task); }} className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream">
                                  <Edit2 className="h-4 w-4 text-sage" /> Edit
                                </DropdownMenuItem>
                              )}
                            
                            {canEditTask(task) && columns.filter(c => c.id !== task.status).map(c => (
                              <DropdownMenuItem 
                                key={c.id}
                                onClick={(e) => { e.stopPropagation(); onTaskMove?.(task, c.id); }} 
                                className="gap-2 cursor-pointer font-bold text-tan hover:bg-cream"
                              >
                                Move to {c.label}
                              </DropdownMenuItem>
                            ))}

                            {canDeleteTask(task) && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteTask?.(task); }} className="gap-2 cursor-pointer text-red-500 font-bold hover:bg-red-50">
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <h4 className={cn(
                      "text-sm font-bold text-bark line-clamp-2 mb-3 transition-colors",
                      getWorkspaceColorClasses(task.workspace).hoverText
                    )}>
                      {task.note || "New Task"}
                    </h4>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-sand/40 text-[9px] font-black text-tan border border-sand/50 flex items-center gap-1 uppercase tracking-tighter">
                        <Layout className="h-2.5 w-2.5 text-sage" /> {task.workspace?.name || "No Workspace"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-cream text-[9px] font-black text-bark border border-sand/30 flex items-center gap-1 uppercase tracking-tighter">
                        <Folder className="h-2.5 w-2.5 text-tan" /> {task.project?.name || "General"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-5 w-5 rounded-full bg-sand/30 flex items-center justify-center text-[8px] font-black border border-sand">
                        {(task.assigner?.name || "U").charAt(0)}
                      </div>
                      <span className="text-[9px] font-bold text-tan italic">
                        By <span className="text-bark">{task.assigner?.name || "System"}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-tan mt-4 pt-3 border-t border-sand/30 font-bold">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                        {task.dueDate && (
                          <div className={cn(
                            "flex items-center gap-1.5",
                            new Date(task.dueDate) < new Date() ? "text-red-500" : "text-orange-500"
                          )}>
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center -space-x-2">
                        {task.assignees && task.assignees.length > 0 ? (
                          task.assignees.slice(0, 3).map((assignee) => (
                            <div key={assignee._id} className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm ring-1 ring-sand/30",
                              getWorkspaceColorClasses(task.workspace).bg,
                              getWorkspaceColorClasses(task.workspace).text
                            )}>
                              {assignee.name.charAt(0).toUpperCase()}
                            </div>
                          ))
                        ) : (
                          <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border border-dashed border-tan/30 text-tan/30">
                            ?
                          </div>
                        )}
                        {task.assignees && task.assignees.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-sand flex items-center justify-center text-[8px] font-black text-tan border-2 border-white">
                            +{task.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )})}
            </AnimatePresence>
            {tasks.filter(t => t.status === col.id).length === 0 && !loading && (
              <div className="h-32 flex items-center justify-center text-tan/40 text-[10px] font-black uppercase tracking-widest">
                Empty Column
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

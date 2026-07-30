import React from 'react';
import { gql } from '@apollo/client';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useAppQuery } from '@/hooks/useGraphQL';
import { GET_PROJECT_DETAILS } from '@/graphql/queries';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/styles/animations';
import { 
  Folder, Layout, Plus, Search, Filter, 
  Settings, ChevronLeft, Trash2, Calendar, 
  AlertCircle, CheckCircle2, Clock,
  MoreVertical, Users, UserMinus, Shield
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TaskBoard } from '@/components/TaskBoard';
import { Task, Project } from '@/types';
import { useAppMutation } from '@/hooks/useGraphQL';
import { 
  CREATE_TASK, 
  UPDATE_TASK, 
  DELETE_TASK, 
  UPDATE_PROJECT, 
  DELETE_PROJECT,
  ADD_PROJECT_MEMBER,
  REMOVE_PROJECT_MEMBER,
  UPDATE_PROJECT_MEMBER_ROLE
} from '@/graphql/mutations';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ProjectDetailsData {
  findProjectById: Project;
  findTasks: {
    items: Task[];
  };
}

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  
  // Task Form States
  const [taskNote, setTaskNote] = React.useState('');
  const [taskStatus, setTaskStatus] = React.useState('PENDING');
  const [taskPriority, setTaskPriority] = React.useState('MEDIUM');
  const [taskAssignedTo, setTaskAssignedTo] = React.useState<string[]>([]);
  const [taskBlockerId, setTaskBlockerId] = React.useState<string | null>(null);
  const [taskDueDate, setTaskDueDate] = React.useState('');
  
  // Project Form States
  const [projectName, setProjectName] = React.useState('');
  const [projectDesc, setProjectDesc] = React.useState('');
  const [projectTags, setProjectTags] = React.useState<string[]>([]);
  
  // Member States
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<string>('MEMBER');

  const { user } = useAuth();
  const currentUserId = user?._id;

  const { data, loading, error, refetch } = useAppQuery<ProjectDetailsData>(GET_PROJECT_DETAILS, {
    variables: { id },
    skip: !id,
  });

  const [createTask] = useAppMutation(CREATE_TASK);
  const [updateTask] = useAppMutation(UPDATE_TASK);
  const [deleteTask] = useAppMutation(DELETE_TASK);
  const [updateProject] = useAppMutation(UPDATE_PROJECT);
  const [deleteProject] = useAppMutation(DELETE_PROJECT);
  const [addMember] = useAppMutation(ADD_PROJECT_MEMBER);
  const [removeProjectMember] = useAppMutation(REMOVE_PROJECT_MEMBER);
  const [updateMemberRole] = useAppMutation(UPDATE_PROJECT_MEMBER_ROLE);

  // Separate query for project members
  const { data: membersData, refetch: refetchMembers } = useAppQuery<any>(gql`
    query GetProjectMembers($projectId: ID!) {
      findProjectMemberWithPagination(input: { projectId: $projectId, limit: 100, page: 1 }) {
        items {
          _id
          userId
          role
          status
          user {
            _id
            name
            email
            avatar
          }
        }
      }
    }
  `, { 
    variables: { projectId: id },
    skip: !id
  });

  // RBAC Helpers
  const projectData = data?.findProjectById;
  const projectRole = projectData?.myRole?.toUpperCase();
  const workspaceRole = projectData?.workspace?.myRole?.toUpperCase();
  
  const isWorkspaceAdmin = workspaceRole === 'OWNER' || workspaceRole === 'ADMIN';
  const isProjectAdmin = projectRole === 'OWNER' || projectRole === 'ADMIN' || projectRole === 'MANAGER' || isWorkspaceAdmin;
  const isProjectMember = !!projectRole || isWorkspaceAdmin;

  const canEditProject = isProjectAdmin;
  const canManageMembers = projectRole === 'OWNER' || projectRole === 'ADMIN' || workspaceRole === 'OWNER' || workspaceRole === 'ADMIN';
  const canCreateTask = (projectRole !== 'VIEWER' && !!projectRole) || isWorkspaceAdmin;

  const canModifyTask = (task: Task) => {
    if (isProjectAdmin) return true;
    return task.assignedBy === currentUserId || task.assignedTo?.includes(currentUserId || '');
  };

  React.useEffect(() => {
    if (data?.findProjectById) {
      setProjectName(data.findProjectById.name);
      setProjectDesc(data.findProjectById.description || '');
      setProjectTags(data.findProjectById.tags || []);
    }
  }, [data]);

  const handleTaskSubmit = async () => {
    try {
      if (editingTask) {
        await updateTask({
          variables: {
            input: {
              _id: editingTask._id,
              note: taskNote,
              status: taskStatus,
              priority: taskPriority,
              assignedTo: taskAssignedTo,
              blockerId: taskBlockerId,
              dueDate: taskDueDate || undefined
            }
          }
        });
        toast.success("Task updated.");
      } else {
        await createTask({
          variables: {
            input: {
              projectId: id,
              workspaceId: data?.findProjectById.workspaceId,
              note: taskNote,
              status: taskStatus,
              priority: taskPriority,
              assignedTo: taskAssignedTo,
              blockerId: taskBlockerId,
              dueDate: taskDueDate || undefined
            }
          }
        });
        toast.success("Task created.");
      }
      setIsTaskDialogOpen(false);
      resetTaskForm();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  const handleTaskMove = async (task: Task, newStatus: string) => {
    try {
      await updateTask({
        variables: {
          input: {
            _id: task._id,
            status: newStatus
          }
        }
      });
      toast.success(`Task shifted to ${newStatus.replace('_', ' ')}`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Move failed");
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!window.confirm("Remove this task?")) return;
    try {
      await deleteTask({ variables: { id: taskId } });
      toast.success("Task removed.");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const resetTaskForm = () => {
    setEditingTask(null);
    setTaskNote('');
    setTaskStatus('PENDING');
    setTaskPriority('MEDIUM');
    setTaskAssignedTo([]);
    setTaskBlockerId(null);
    setTaskDueDate('');
  };

  const handleUpdateProject = async () => {
    try {
      await updateProject({
        variables: {
          id,
          input: {
            name: projectName,
            description: projectDesc,
            tags: projectTags
          }
        }
      });
      toast.success("Project updated.");
      setIsProjectDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Permanently delete this project?")) return;
    try {
      await deleteProject({ variables: { id } });
      toast.success("Project deleted.");
      navigate(`/workspaces/${data?.findProjectById.workspaceId}`);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleInviteProjectMember = async () => {
    try {
      await addMember({
        variables: {
          projectId: id,
          email: inviteEmail,
          role: inviteRole
        }
      });
      toast.success("Collaborator invited!");
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
      refetchMembers();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Invitation failed");
    }
  };

  const handleRemoveProjectMember = async (memberId: string) => {
    if (!window.confirm("Remove this collaborator from the initiative?")) return;
    try {
      await removeProjectMember({ variables: { projectId: id, memberId } });
      toast.success("Collaborator removed.");
      refetchMembers();
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Removal failed");
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      await updateMemberRole({
        variables: { projectId: id, memberId, role: newRole }
      });
      toast.success("Role updated.");
      refetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-cream/30">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-bark animate-bounce shadow-lg" />
        <p className="text-tan font-black tracking-widest text-[10px] uppercase">Mapping Project Axis...</p>
      </div>
    </div>
  );

  if (error || !projectData || (!isProjectMember && !loading && membersData)) return (
    <div className="p-8 text-center space-y-4 bg-cream/50 h-full flex flex-col items-center justify-center">
      <div className="h-20 w-20 bg-bark text-cream rounded-[2.5rem] flex items-center justify-center mb-4">
        {error?.message?.includes('Access denied') || (!isProjectMember && membersData) ? <AlertCircle className="h-10 w-10 text-red-400" /> : <Folder className="h-10 w-10" />}
      </div>
      <h2 className="text-2xl font-black text-bark uppercase tracking-tighter">
        {error?.message?.includes('Access denied') || (!isProjectMember && membersData) ? 'Access Restricted' : 'Project Not Found'}
      </h2>
      <p className="text-tan max-w-sm mx-auto font-medium">
        {error?.message?.includes('Access denied') || (!isProjectMember && membersData) 
          ? "You don't have the required resonance to access this project's task axis. Please contact the project owner."
          : "This initiative project mapping does not exist in your current perspective."}
      </p>
      <Button asChild className="bg-bark text-white rounded-xl h-11 px-8">
        <Link to="/projects">Return to All Projects</Link>
      </Button>
    </div>
  );

  const project = projectData;
  const tasks = data.findTasks?.items || [];

  const columns = [
    { id: 'PENDING', label: 'To Do', color: 'bg-sand/20 text-tan border-sand' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-sage/20 text-sage-dark border-sage/30' },
    { id: 'COMPLETED', label: 'Completed', color: 'bg-bark/10 text-bark border-bark/20' }
  ];

  return (
    <div className="min-h-full bg-cream/20 flex flex-col">
      {/* Dynamic Project Header */}
      <motion.header 
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="bg-white border-b border-sand p-6 lg:px-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="space-y-4">
          <Link to="/projects" className="text-[10px] font-black text-tan hover:text-bark uppercase tracking-widest flex items-center gap-1 transition-colors">
            <ChevronLeft className="h-3 w-3" /> Back to Projects
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-bark flex items-center justify-center text-cream shadow-xl shadow-bark/10">
              <Folder className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-black text-bark tracking-tight">{project.name}</h1>
                <Badge variant="outline" className="rounded-full border-sand bg-cream/50 text-[10px] font-bold uppercase py-0.5">
                   In Progress
                </Badge>
              </div>
              <p className="text-tan text-sm font-medium flex items-center gap-2">
                Part of <Link to={`/workspaces/${project.workspaceId}`} className="text-bark hover:underline font-bold">{project.workspace?.name}</Link>
              </p>
            {(membersData as any)?.findProjectMemberWithPagination?.totalItems > 4 && (
              <div className="h-10 w-10 rounded-full bg-sand border-4 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-tan ring-1 ring-sand">
                +{(membersData as any).findProjectMemberWithPagination.totalItems - 4}
              </div>
            )}
            
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            {canManageMembers && (
              <DialogTrigger asChild>
                <button className="h-10 w-10 rounded-full bg-white border-2 border-dashed border-sand flex items-center justify-center text-tan hover:bg-sage/10 hover:text-sage hover:border-sage transition-all ml-2">
                   <Plus className="h-4 w-4" />
                </button>
              </DialogTrigger>
            )}
              <DialogContent className="bg-cream border-sand rounded-[2rem] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-bark">Community Hub</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-tan ml-1">Current Initiative Team</Label>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {(membersData as any)?.findProjectMemberWithPagination?.items?.map((member: any) => (
                        <div key={member._id} className="flex flex-col gap-2 p-3 bg-white/50 border border-sand rounded-xl group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-sand text-[10px] font-bold text-bark">
                                  {member.user?.name?.charAt(0) || member.email?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-bark">{member.user?.name || member.email}</span>
                                <Badge variant="outline" className="w-fit text-[8px] px-1 py-0 h-4 border-sand text-tan">
                                  {member.role}
                                </Badge>
                              </div>
                            </div>
                            
                            {canManageMembers && member.role !== 'OWNER' && (
                              <div className="flex items-center gap-1 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-tan hover:text-bark hover:bg-sand rounded-xl">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white border-sand">
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream">
                                        <Shield className="h-4 w-4 text-sage" /> Change Role
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent className="bg-white border-sand">
                                        <DropdownMenuRadioGroup value={member.role} onValueChange={(val) => handleUpdateMemberRole(member._id, val)}>
                                          <DropdownMenuRadioItem value="ADMIN" className="cursor-pointer font-bold text-bark">ADMIN</DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem value="MANAGER" className="cursor-pointer font-bold text-bark">MANAGER</DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem value="MEMBER" className="cursor-pointer font-bold text-bark">MEMBER</DropdownMenuRadioItem>
                                          <DropdownMenuRadioItem value="VIEWER" className="cursor-pointer font-bold text-bark">VIEWER</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                    <DropdownMenuItem 
                                      onClick={() => handleRemoveProjectMember(member._id)}
                                      className="gap-2 cursor-pointer text-red-500 font-bold hover:bg-red-50"
                                    >
                                      <UserMinus className="h-4 w-4" /> Remove Member
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {canManageMembers && (
                    <div className="pt-4 border-t border-sand space-y-4">
                      <Label className="text-[10px] font-black uppercase text-tan ml-1">Expand Initiative</Label>
                      <div className="space-y-3">
                        <Input 
                          value={inviteEmail} 
                          onChange={(e) => setInviteEmail(e.target.value)} 
                          placeholder="colleague@domain.com"
                          className="rounded-xl border-sand bg-white/50"
                        />
                        <div className="flex gap-2">
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger className="flex-1 rounded-xl border-sand bg-white/50 font-bold text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-sand">
                              <SelectItem value="ADMIN">ADMIN</SelectItem>
                              <SelectItem value="MANAGER">MANAGER</SelectItem>
                              <SelectItem value="MEMBER">MEMBER</SelectItem>
                              <SelectItem value="VIEWER">VIEWER</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button onClick={handleInviteProjectMember} className="bg-bark text-white rounded-xl px-6 font-bold shadow-lg shadow-bark/10">Invite</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {canEditProject && (
            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-cream border border-sand text-tan hover:text-bark">
                   <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-cream border-sand rounded-[2rem] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-bark">Project Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-tan ml-1">Initiative Name</Label>
                    <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="rounded-xl border-sand bg-white/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-tan ml-1">Scope</Label>
                    <Textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} className="rounded-xl border-sand bg-white/50 min-h-[100px]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-tan ml-1">Tags (Comma separated)</Label>
                    <Input 
                      value={projectTags.join(', ')} 
                      onChange={(e) => setProjectTags(e.target.value.split(',').map(t => t.trim()).filter(t => t))} 
                      placeholder="planning, phase-1, urgent"
                      className="rounded-xl border-sand bg-white/50" 
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {projectTags.map(tag => (
                        <Badge key={tag} className="bg-sand/30 text-tan border-sand text-[9px] uppercase px-2">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 flex flex-col gap-3">
                    <Button onClick={handleUpdateProject} className="w-full bg-bark text-white rounded-xl h-12 font-bold">Save Changes</Button>
                    {projectRole === 'OWNER' || workspaceRole === 'OWNER' ? (
                      <Button onClick={handleDeleteProject} variant="ghost" className="w-full text-red-500 font-bold hover:bg-red-50 rounded-xl h-12">Delete Project</Button>
                    ) : null}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* TASK CREATION DIALOG - RESTORED */}
          {canCreateTask && (
            <Dialog open={isTaskDialogOpen} onOpenChange={(open) => { setIsTaskDialogOpen(open); if(!open) resetTaskForm(); }}>
              {canCreateTask && (
                <DialogTrigger asChild>
                  <Button className="h-12 px-8 rounded-2xl bg-bark text-white font-bold shadow-xl shadow-bark/20 hover:scale-[1.02] active:scale-95 transition-all">
                     New Task
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="bg-cream border-sand rounded-[2rem] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-bark">{editingTask ? 'Refine Task' : 'New Task'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-tan ml-1">Task Description</Label>
                      <Textarea 
                        value={taskNote} 
                        onChange={(e) => setTaskNote(e.target.value)} 
                        className="rounded-xl border-sand bg-white/50 min-h-[100px]" 
                        placeholder="Focus on specific objectives..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-tan ml-1">Stage</Label>
                        <Select value={taskStatus} onValueChange={setTaskStatus}>
                          <SelectTrigger className="rounded-xl border-sand bg-white/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-sand">
                            <SelectItem value="PENDING">To Do</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-tan ml-1">Priority</Label>
                        <Select value={taskPriority} onValueChange={setTaskPriority}>
                          <SelectTrigger className="rounded-xl border-sand bg-white/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-sand">
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-tan ml-1">Assignees</Label>
                      <div className="flex flex-wrap gap-2 p-2 bg-white/50 border border-sand rounded-xl min-h-[44px]">
                        {project.memberUsers?.map((user: any) => (
                          <button
                            key={user._id}
                            onClick={() => {
                              setTaskAssignedTo(prev => 
                                prev.includes(user._id) ? prev.filter(id => id !== user._id) : [...prev, user._id]
                              );
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                              taskAssignedTo.includes(user._id) 
                                ? "bg-bark text-white border-bark" 
                                : "bg-white text-tan border-sand hover:border-bark"
                            )}
                          >
                            {user.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-tan ml-1">Dependency (Optional Blocker)</Label>
                      <Select value={taskBlockerId || "none"} onValueChange={(val) => setTaskBlockerId(val === "none" ? null : val)}>
                        <SelectTrigger className="rounded-xl border-sand bg-white/50">
                          <SelectValue placeholder="Select blocker..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-sand">
                          <SelectItem value="none">No blocker</SelectItem>
                          {tasks.filter(t => t._id !== editingTask?._id).map(t => (
                            <SelectItem key={t._id} value={t._id}>{t.note}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-tan ml-1">Target Completion Date</Label>
                      <Input 
                        type="date" 
                        value={taskDueDate} 
                        onChange={(e) => setTaskDueDate(e.target.value)} 
                        className="rounded-xl border-sand bg-white/50" 
                      />
                    </div>
                  </div>

                  <Button onClick={handleTaskSubmit} className="w-full bg-bark text-white rounded-xl h-12 font-bold shadow-lg shadow-bark/20">
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </motion.header>

      {/* Main Board Area */}
      <main className="flex-1 p-6 lg:p-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center gap-2">
              <Button variant="outline" className="h-10 rounded-xl border-sand bg-white text-bark font-bold text-xs">
                 <Layout className="h-4 w-4 mr-2 text-tan" /> Board View
              </Button>
              <Button variant="ghost" className="h-10 rounded-xl text-tan font-bold text-xs hover:bg-cream">
                 <Filter className="h-4 w-4 mr-2" /> Filters
              </Button>
           </div>
           
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
              <input 
                placeholder="Search tasks in this project..." 
                className="w-full h-10 pl-10 pr-4 bg-white/60 border border-sand rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sage/20"
              />
           </div>
        </div>

        <TaskBoard 
          tasks={tasks}
          columns={columns}
          canEditTask={canModifyTask}
          canDeleteTask={canModifyTask}
          canAddInColumn={canCreateTask}
          onEditTask={(task: Task) => {
            if (!canModifyTask(task)) return;
            setEditingTask(task);
            setTaskNote(task.note || '');
            setTaskStatus(task.status);
            setTaskPriority(task.priority);
            setTaskAssignedTo(task.assignedTo || []);
            setTaskBlockerId(task.blockerId || null);
            setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
            setIsTaskDialogOpen(true);
          }}
          onDeleteTask={(task) => {
            if (!canModifyTask(task)) return;
            handleTaskDelete(task._id);
          }}
          onAddTaskInColumn={(status) => {
            if (!canCreateTask) return;
            resetTaskForm();
            setTaskStatus(status);
            setIsTaskDialogOpen(true);
          }}
          onTaskMove={handleTaskMove}
        />
      </main>

      {/* Project Meta Information Footer */}
      <footer className="p-6 lg:px-10 border-t border-sand bg-white/30 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-sage/10 text-sage flex items-center justify-center">
               <Calendar className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[10px] font-black text-tan uppercase tracking-widest">Active Since</p>
               <p className="text-sm font-bold text-bark">{new Date(project.createdAt).toLocaleDateString()}</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center">
               <Clock className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[10px] font-black text-tan uppercase tracking-widest">Last Activity</p>
               <p className="text-sm font-bold text-bark">2 hours ago</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-bark/10 text-bark flex items-center justify-center">
               <Users className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[10px] font-black text-tan uppercase tracking-widest">Project Role</p>
               <p className="text-sm font-bold text-bark">{projectRole || (isWorkspaceAdmin ? 'Workspace ' + workspaceRole : 'Guest')}</p>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default ProjectDetailPage;

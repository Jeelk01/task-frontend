import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppQuery } from '@/hooks/useGraphQL';
import { GET_WORKSPACE_DETAILS } from '@/graphql/queries';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/styles/animations';
import { 
  Briefcase, Users, Settings, Plus, 
  Search, Filter, Calendar, Folder, 
  ChevronRight, Info, Zap, Trash2, MoreVertical, UserMinus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/contexts/ChatContext';
import { Workspace, Project } from '@/types';
import { useAppMutation } from '@/hooks/useGraphQL';
import { 
  CREATE_PROJECT, 
  UPDATE_WORKSPACE, 
  DELETE_WORKSPACE,
  ADD_WORKSPACE_MEMBER,
  REMOVE_WORKSPACE_MEMBER
} from '@/graphql/mutations';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface WorkspaceDetailsData {
  findWorkspaceById: Workspace;
  findProjects: {
    items: Project[];
  };
}

const WorkspaceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { onlineUsers, toggleChat, joinWorkspace } = useChat();
  
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
  const [isWorkspaceDialogOpen, setIsWorkspaceDialogOpen] = React.useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);
  
  // Form States
  const [projectName, setProjectName] = React.useState('');
  const [projectDesc, setProjectDesc] = React.useState('');
  const [wsName, setWsName] = React.useState('');
  const [wsDesc, setWsDesc] = React.useState('');
  const [inviteEmail, setInviteEmail] = React.useState('');

  const { data, loading, error, refetch } = useAppQuery<WorkspaceDetailsData>(GET_WORKSPACE_DETAILS, {
    variables: { id },
    skip: !id,
  });

  const [createProject] = useAppMutation(CREATE_PROJECT);
  const [updateWorkspace] = useAppMutation(UPDATE_WORKSPACE);
  const [deleteWorkspace] = useAppMutation(DELETE_WORKSPACE);
  const [addMember] = useAppMutation(ADD_WORKSPACE_MEMBER);
  const [removeMember] = useAppMutation(REMOVE_WORKSPACE_MEMBER);

  React.useEffect(() => {
    if (data?.findWorkspaceById) {
      setWsName(data.findWorkspaceById.name);
      setWsDesc(data.findWorkspaceById.description || '');
    }
  }, [data]);

  const handleCreateProject = async () => {
    try {
      await createProject({
        variables: {
          input: {
            name: projectName,
            description: projectDesc,
            workspaceId: id,
            tags: []
          }
        }
      });
      toast.success("Project launched successfully!");
      setIsProjectDialogOpen(false);
      setProjectName('');
      setProjectDesc('');
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    }
  };

  const handleUpdateWorkspace = async () => {
    try {
      await updateWorkspace({
        variables: {
          id,
          input: {
            name: wsName,
            description: wsDesc,
            tags: data?.findWorkspaceById.tags || []
          }
        }
      });
      toast.success("Workspace refined.");
      setIsWorkspaceDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update workspace");
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm("Are you sure? This will dissolve the entire workspace and all its projects.")) return;
    try {
      await deleteWorkspace({ variables: { id } });
      toast.success("Workspace dissolved.");
      navigate('/workspaces');
    } catch (err: any) {
      toast.error(err.message || "Failed to delete workspace");
    }
  };

  const handleInviteMember = async () => {
    try {
      await addMember({
        variables: {
          workspaceId: id,
          email: inviteEmail,
          role: 'MEMBER'
        }
      });
      toast.success("Invitation dispatched!");
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to invite member");
    }
  };
  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm("Rescind this user's access to the workspace?")) return;
    try {
      await removeMember({ variables: { workspaceId: id, userId } });
      toast.success("Collaborator removed.");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Removal failed");
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-cream/50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-sage animate-pulse shadow-lg" />
        <p className="text-tan font-bold animate-pulse text-sm">LOADING WORKSPACE...</p>
      </div>
    </div>
  );

  if (error || !data?.findWorkspaceById) return (
    <div className="p-8 text-center space-y-4 bg-cream/50 h-full flex flex-col items-center justify-center">
      <div className="h-20 w-20 bg-red-100 text-red-500 rounded-[2.5rem] flex items-center justify-center mb-4">
        <Info className="h-10 w-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-bark">Workspace Not Found</h2>
      <p className="text-tan max-w-sm mx-auto">Either this workspace doesn't exist or you don't have permission to view it.</p>
      <Button asChild className="bg-bark text-white rounded-xl">
        <Link to="/workspaces">Back to Workspaces</Link>
      </Button>
    </div>
  );

  const workspace = data.findWorkspaceById;
  const projects = data.findProjects?.items || [];

  const myRole = workspace.myRole?.toUpperCase();
  const canEditWorkspace = myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER';
  const canDeleteWorkspace = myRole === 'OWNER' || myRole === 'ADMIN';
  const canManageMembers = myRole === 'OWNER' || myRole === 'ADMIN';
  const canCreateProject = myRole === 'OWNER' || myRole === 'ADMIN' || myRole === 'MANAGER';
  const isViewer = myRole === 'VIEWER';

  return (
    <div className="min-h-full bg-cream/30 p-4 md:p-10 space-y-10">
      {/* Premium Header */}
      <motion.div 
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
      >
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-sage/10 text-sage-dark border-sage/20 uppercase tracking-widest text-[10px] font-black px-3 py-1">
              Active Workspace
            </Badge>
            <div className="flex -space-x-2">
              {workspace.memberUsers?.slice(0, 3).map((u: any) => (
                <Avatar key={u._id} className="h-6 w-6 border-2 border-white shadow-sm ring-1 ring-sand">
                  <AvatarFallback className="text-[8px] bg-sand text-bark font-bold">{u.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
              {workspace.memberUsers?.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-sand border-2 border-white flex items-center justify-center text-[8px] font-black text-tan">
                  +{workspace.memberUsers.length - 3}
                </div>
              )}
            </div>
          </div>
          <h1 className="text-5xl font-black text-bark tracking-tight leading-none">{workspace.name}</h1>
          <p className="text-tan/80 font-medium max-w-2xl text-lg">{workspace.description || "No description provided."}</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {canEditWorkspace && (
            <Dialog open={isWorkspaceDialogOpen} onOpenChange={setIsWorkspaceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 md:flex-none h-12 px-6 rounded-2xl border-sand bg-white shadow-sm font-bold text-bark hover:bg-cream">
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-cream border-sand rounded-[2rem] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-bark">Workspace Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-tan ml-1">Identity</Label>
                    <Input value={wsName} onChange={(e) => setWsName(e.target.value)} className="rounded-xl border-sand bg-white/50" placeholder="Workspace Name" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-tan ml-1">Manifesto</Label>
                    <Textarea value={wsDesc} onChange={(e) => setWsDesc(e.target.value)} className="rounded-xl border-sand bg-white/50 min-h-[100px]" placeholder="What is the purpose of this space?" />
                  </div>
                  <div className="pt-4 flex flex-col gap-3">
                    <Button onClick={handleUpdateWorkspace} className="w-full bg-bark text-white rounded-xl h-12 font-bold shadow-lg shadow-bark/20">
                      Save Refinements
                    </Button>
                    {canDeleteWorkspace && (
                      <Button onClick={handleDeleteWorkspace} variant="ghost" className="w-full text-red-500 hover:bg-red-50 rounded-xl h-12 font-bold">
                        Dissolve Workspace
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {canCreateProject && (
            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none h-12 px-8 rounded-2xl bg-bark text-white shadow-xl shadow-bark/20 font-bold hover:scale-[1.02] active:scale-95 transition-all">
                  <Plus className="h-4 w-4 mr-2" /> New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-cream border-sand rounded-[2rem] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-bark">Launch New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-tan ml-1">Initiative Name</Label>
                    <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="rounded-xl border-sand bg-white/50" placeholder="e.g. Project Odyssey" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-tan ml-1">Scope & Vision</Label>
                    <Textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} className="rounded-xl border-sand bg-white/50 min-h-[100px]" placeholder="Briefly define the project's orbit..." />
                  </div>
                  <Button onClick={handleCreateProject} className="w-full bg-bark text-white rounded-xl h-12 font-bold shadow-lg shadow-bark/20 mt-4">
                    Confirm Launch
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* Statistics Bar */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Folder, label: 'Projects', value: projects?.length || 0, color: 'sage' },
          { icon: Users, label: 'Members', value: workspace.memberUsers?.length || 0, color: 'bark' },
          { icon: Calendar, label: 'Created', value: workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : 'N/A', color: 'tan' },
          { icon: Zap, label: 'Recent Events', value: 24, color: 'sage' }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            variants={fadeInUp}
            className="bg-white/60 backdrop-blur-md border border-sand p-6 rounded-[2rem] space-y-2 hover:bg-white transition-all shadow-sm group"
          >
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", 
              stat.color === 'sage' ? 'bg-sage/10 text-sage' : 
              stat.color === 'bark' ? 'bg-bark/10 text-bark' : 'bg-tan/10 text-tan')}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black text-tan uppercase tracking-widest">{stat.label}</p>
            <p className="text-xl font-black text-bark">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Projects Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-sand">
            <h2 className="text-xl font-black text-bark tracking-tight flex items-center gap-3">
              <Folder className="h-5 w-5 text-sage" />
              Active Projects
            </h2>
            <Link to="/projects" className="text-xs font-black text-sage hover:text-sage-dark uppercase tracking-widest">View All</Link>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {projects.map((project: any) => (
              <motion.div 
                key={project._id}
                variants={fadeInUp}
                className="group bg-white border border-sand rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col gap-5"
              >
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-2xl bg-cream flex items-center justify-center text-tan group-hover:bg-sage group-hover:text-white transition-colors duration-300">
                    <Folder className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="rounded-full border-sand bg-cream/50 text-[9px] font-bold uppercase py-1">
                    {project.memberUsers.length} MEMBERS
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-bark leading-tight line-clamp-1">{project.name}</h3>
                  <p className="text-tan font-medium text-xs line-clamp-2 leading-relaxed opacity-70">
                    {project.description || "Streamline your workflow with this high-priority initiative."}
                  </p>
                </div>

                <div className="pt-4 mt-auto flex items-center justify-between border-t border-sand/50">
                  <div className="flex -space-x-2">
                    {project.memberUsers.slice(0, 3).map((u: any) => (
                      <Avatar key={u._id} className="h-7 w-7 border-2 border-white ring-1 ring-sand">
                        <AvatarFallback className="text-[9px] font-bold bg-cream text-tan uppercase">{u.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <Button asChild variant="ghost" className="h-8 px-4 text-xs font-black text-sage hover:bg-sage/10 rounded-full">
                    <Link to={`/projects/${project._id}`}>
                      DIVE IN <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
            
            {canCreateProject && (
              <button 
                onClick={() => setIsProjectDialogOpen(true)}
                className="h-full min-h-[220px] bg-cream/20 border-2 border-dashed border-sand rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:bg-cream/40 hover:border-sage/40 transition-all group"
              >
                 <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                   <Plus className="h-7 w-7 text-tan group-hover:text-sage transition-colors" />
                 </div>
                 <p className="text-xs font-black text-tan uppercase tracking-widest">New Project</p>
              </button>
            )}
          </motion.div>
        </div>

        {/* Sidebar: Members */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white border border-sand rounded-[3rem] p-8 shadow-sm space-y-8 h-fit sticky top-24">
              <div className="space-y-2">
                <h2 className="text-xl font-black text-bark">Workspace Hub</h2>
                <p className="text-tan font-medium text-xs leading-relaxed">Collaborate with your team in real-time. Members with green dots are currently active.</p>
              </div>

              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-tan uppercase tracking-widest flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Community ({workspace.memberUsers?.length || 0})
                 </h3>
                 <div className="space-y-3">
                    {workspace.memberUsers?.map((member: any) => {
                      const isOnline = onlineUsers.has(member._id);
                      return (
                        <div key={member._id} className="flex items-center justify-between group">
                           <div className="flex items-center gap-3">
                             <div className="relative">
                               <Avatar className="h-10 w-10 ring-2 ring-sand ring-offset-2">
                                  <AvatarFallback className="bg-cream text-tan font-bold">{member.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               {isOnline && (
                                 <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-sage rounded-full border-2 border-white shadow-sm" />
                               )}
                             </div>
                             <div className="flex flex-col">
                               <span className="text-sm font-bold text-bark leading-none">{member.name} {member._id === workspace.ownerId && "👑"}</span>
                               <span className="text-[10px] font-medium text-tan uppercase tracking-widest mt-1 opacity-60">
                                 {member._id === workspace.ownerId ? 'Owner' : 'Member'}
                               </span>
                             </div>
                           </div>
                           <div className="flex items-center gap-1">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-tan hover:text-bark rounded-xl">
                                    <MoreVertical className="h-4 w-4" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="bg-white border-sand">
                                 <DropdownMenuItem className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream">
                                    <Info className="h-4 w-4 text-sage" /> View Info
                                 </DropdownMenuItem>
                                 {canManageMembers && workspace.ownerId !== member._id && (
                                   <DropdownMenuItem 
                                     onClick={() => handleRemoveMember(member._id)}
                                     className="gap-2 cursor-pointer text-red-500 font-bold hover:bg-red-50"
                                   >
                                      <UserMinus className="h-4 w-4" /> Remove Member
                                   </DropdownMenuItem>
                                 )}
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </div>
                        </div>
                      )
                    })}
                 </div>
              </div>

              <div className="pt-6 border-t border-sand space-y-4">
                  {canManageMembers && (
                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                       <DialogTrigger asChild>
                         <Button className="w-full h-12 bg-white border border-sand shadow-sm text-bark font-bold rounded-2xl hover:bg-cream">
                           Invite Collaborator
                         </Button>
                       </DialogTrigger>
                       <DialogContent className="bg-cream border-sand rounded-[2rem] max-w-md">
                         <DialogHeader>
                           <DialogTitle className="text-2xl font-black text-bark">Expand Community</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-6 py-4">
                           <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-tan ml-1">Email Address</Label>
                             <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" className="rounded-xl border-sand bg-white/50" placeholder="colleague@company.com" />
                           </div>
                           <Button onClick={handleInviteMember} className="w-full bg-bark text-white rounded-xl h-12 font-bold shadow-lg shadow-bark/20">
                             Send Invitation
                           </Button>
                         </div>
                       </DialogContent>
                    </Dialog>
                  )}

                 <Button 
                   onClick={() => {
                     joinWorkspace(id as string);
                     toggleChat();
                   }}
                   className="w-full h-12 bg-bark text-white rounded-2xl font-bold shadow-lg shadow-bark/20"
                 >
                    Open Workspace Chat
                 </Button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDetailPage;

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

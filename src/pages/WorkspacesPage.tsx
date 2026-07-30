import { useState } from "react";
import { useAppQuery, useAppMutation } from "@/hooks/useGraphQL";
import { GET_MY_WORKSPACES, GET_MY_INVITATIONS } from "@/graphql/queries";
import { CREATE_WORKSPACE, ACCEPT_WORKSPACE_INVITATION, REJECT_WORKSPACE_INVITATION } from "@/graphql/mutations";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Plus, Search, MoreVertical,
  Users, Tag, ArrowRight, LayoutGrid, List, Check,
  Edit2, Trash2, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/lib/utils";
import { getWorkspaceColorClasses } from "@/lib/workspace-utils";
import type { PaginatedResponse, Workspace } from "@/types";
import { Link } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { UPDATE_WORKSPACE, DELETE_WORKSPACE } from "@/graphql/mutations";
import { WorkspaceMembersDialog } from "@/components/WorkspaceMembersDialog";
import { MeetingScheduler } from "@/components/meeting/MeetingScheduler";
import { Video as MeetingIcon } from "lucide-react";


const COLORS = [
  "red",
  "blue",
  "green",
  "teal",
  "orange",
  "purple",
  "pink",
  "amber",
  "lime",
  "cyan",
  "rose",
];

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  tags: z.string().optional(),

  color: z.string().optional(),
  icon: z.string().optional(),
  meta: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function WorkspacesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [managingMembersWorkspace, setManagingMembersWorkspace] = useState<Workspace | null>(null);
  const [schedulingMeetingWorkspace, setSchedulingMeetingWorkspace] = useState<Workspace | null>(null);

  const [metaPairs, setMetaPairs] = useState<
    { key: string; value: string }[]
  >([]);

  const { data, loading, refetch } = useAppQuery<{ findMyWorkspaces: PaginatedResponse<Workspace> }>(
    GET_MY_WORKSPACES,
    {
      variables: {
        args: {
          page,
          limit: 12,
          search: search || undefined,
        },
      },
    }
  );

  const [createWorkspace, { loading: creating }] = useAppMutation(CREATE_WORKSPACE, {
    successMessage: "Workspace created successfully!",
    onCompleted: () => {
      setIsDialogOpen(false);
      refetch();
      reset();
      setMetaPairs([]);
    },
  });

  const [updateWorkspace, { loading: updating }] = useAppMutation(UPDATE_WORKSPACE, {
    successMessage: "Workspace updated successfully!",
    onCompleted: () => {
      setIsDialogOpen(false);
      setEditingWorkspace(null);
      refetch();
      reset();
      setMetaPairs([]);
    },
  });

  const [deleteWorkspace] = useAppMutation(DELETE_WORKSPACE, {
    successMessage: "Workspace deleted successfully!",
    onCompleted: () => {
      setWorkspaceToDelete(null);
      refetch();
    },
  });
  
  const { data: invitationsData, refetch: refetchInvitations } = useAppQuery<{ findMyInvitations: any[] }>(
    GET_MY_INVITATIONS
  );

  const [acceptInvitation] = useAppMutation(ACCEPT_WORKSPACE_INVITATION, {
    successMessage: "Invitation accepted!",
    onCompleted: () => {
      refetchInvitations();
      refetch();
    }
  });

  const [rejectInvitation] = useAppMutation(REJECT_WORKSPACE_INVITATION, {
    successMessage: "Invitation declined",
    onCompleted: () => {
      refetchInvitations();
    }
  });

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

  const onSubmit = async (values: FormData) => {
    let extra = {};

    if (values.meta) {
      try {
        extra = JSON.parse(values.meta);
      } catch { }
    }

    console.log("Form Data: ", values);


    const input = {
      name: values.name,
      description: values.description,
      tags: values.tags
        ? values.tags.split(",").map(t => t.trim())
        : [],
      meta: {
        color: values.color,
        icon: values.icon,
        ...extra,
      },
    };

    if (editingWorkspace) {
      await updateWorkspace({
        variables: {
          id: editingWorkspace._id,
          input,
        },
      });
    } else {
      await createWorkspace({
        variables: {
          input,
        },
      });
    }
  };

  const onEdit = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setValue("name", ws.name);
    setValue("description", ws.description || "");
    setValue("tags", ws.tags?.join(", ") || "");
    setValue("color", (ws.meta as any)?.color || "sage");
    setValue("icon", (ws.meta as any)?.icon || "");

    // Handle meta pairs
    const pairs: { key: string; value: string }[] = [];
    if (ws.meta) {
      Object.entries(ws.meta).forEach(([key, value]) => {
        if (key !== "color" && key !== "icon") {
          pairs.push({ key, value: String(value) });
        }
      });
    }
    setMetaPairs(pairs);
    setValue("meta", JSON.stringify(ws.meta || {}));
    setIsDialogOpen(true);
  };

  const addMeta = () => {
    setMetaPairs([...metaPairs, { key: "", value: "" }]);
  };

  const updateMeta = (
    i: number,
    field: "key" | "value",
    val: string
  ) => {
    const copy = [...metaPairs];
    copy[i][field] = val;
    setMetaPairs(copy);

    // update form meta string
    const obj: Record<string, string> = {};
    copy.forEach(m => {
      if (m.key) obj[m.key] = m.value;
    });

    setValue("meta", JSON.stringify(obj));
  };

  const removeMeta = (i: number) => {
    const copy = metaPairs.filter((_, idx) => idx !== i);
    setMetaPairs(copy);

    const obj: Record<string, string> = {};
    copy.forEach(m => {
      if (m.key) obj[m.key] = m.value;
    });

    setValue("meta", JSON.stringify(obj));
  };

  const workspaces = data?.findMyWorkspaces?.items ?? [];
  const totalPages = data?.findMyWorkspaces?.totalPages ?? 1;


  console.log("Data: receisved: ---------: ", data);

  console.log("Total Worspaces: ", workspaces);


  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-extrabold text-bark tracking-tight">
            Workspaces <span className="text-sage">/</span>
          </h1>
          <p className="text-tan mt-2 font-medium">
            Organize your team and projects in dedicated hubs.
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

          <Dialog open={editingWorkspace !== null || (editingWorkspace === null && isDialogOpen)} onOpenChange={(open) => {
            if (!open) {
              setIsDialogOpen(false);
              setEditingWorkspace(null);
              reset();
              setMetaPairs([]);
            } else {
              setIsDialogOpen(true);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-sage hover:bg-sage-dark text-white rounded-xl gap-2 h-10 px-5 shadow-accent transition-all hover:scale-[1.02]">
                <Plus className="h-4 w-4" /> New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-sand">
              <DialogHeader>
                <DialogTitle>{editingWorkspace ? "Edit Workspace" : "Create New Workspace"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 max-h-[70vh] overflow-y-scroll">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...register("name")} placeholder="Engineering Team" className="bg-cream border-sand" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input {...register("description")} placeholder="Workspace for all engineering projects" className="bg-cream border-sand" />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input {...register("tags")} placeholder="tech, engineering, dev" className="bg-cream border-sand" />
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label>Color</Label>

                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => {
                      const selected = watch("color") === c;

                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setValue("color", c)}
                          className={cn(
                            "flex gap-2 px-3 py-1 rounded-full text-xs border-transparent capitalize transition-all",
                            `bg-${c}-100 text-${c}-700 border-${c}-200`,
                            selected && "ring-2 ring-sage"
                          )}
                        >
                          {c}


                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Icon */}
                <div className="space-y-2">
                  <Label>Icon URL</Label>
                  <Input
                    {...register("icon")}
                    placeholder="https://icon.png"
                    className="bg-cream border-sand"
                  />
                </div>

                {/* Extra Meta */}
                <div className="space-y-2">
                  <Label>Extra Meta</Label>

                  <div className="space-y-2">

                    {metaPairs.map((m, i) => (
                      <div key={i} className="flex gap-2">

                        <Input
                          placeholder="key"
                          value={m.key}
                          onChange={(e) =>
                            updateMeta(i, "key", e.target.value)
                          }
                          className="bg-cream border-sand"
                        />

                        <Input
                          placeholder="value"
                          value={m.value}
                          onChange={(e) =>
                            updateMeta(i, "value", e.target.value)
                          }
                          className="bg-cream border-sand"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeMeta(i)}
                        >
                          ✕
                        </Button>

                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addMeta}
                      className="text-xs"
                    >
                      Add Meta
                    </Button>

                  </div>
                </div>
                <Button type="submit" disabled={creating || updating} className="w-full bg-sage hover:bg-sage-dark text-white rounded-xl h-11">
                  {creating || updating ? (editingWorkspace ? "Updating..." : "Creating...") : (editingWorkspace ? "Update Workspace" : "Create Workspace")}
                </Button>

              </form>


            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pending Invitations Section */}
      <AnimatePresence>
        {invitationsData?.findMyInvitations && invitationsData.findMyInvitations.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-sage" />
              <h2 className="text-sm font-black text-bark uppercase tracking-widest">Pending Invitations</h2>
              <Badge variant="secondary" className="bg-sage/10 text-sage border-none text-[10px] font-bold">
                {invitationsData.findMyInvitations.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {invitationsData.findMyInvitations.map((inv) => (
                <GlassCard key={inv._id} className="p-4 border-dashed border-2 border-sage/30 bg-sage/5 flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-bark text-lg leading-tight truncate max-w-[200px]">
                        {inv.workspace?.name}
                      </h3>
                      <p className="text-[10px] text-tan font-bold uppercase tracking-widest mt-1">
                        Invited by {inv.invitedBy?.name}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                       <Briefcase className="h-5 w-5 text-sage" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => acceptInvitation({ variables: { invitationId: inv._id } })}
                      className="flex-1 bg-sage hover:bg-sage-dark text-white rounded-lg h-9 font-bold text-[10px] uppercase tracking-wider"
                    >
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => rejectInvitation({ variables: { invitationId: inv._id } })}
                      className="flex-1 border border-bark/10 text-bark hover:bg-red-50 hover:text-red-500 rounded-lg h-9 font-bold text-[10px] uppercase tracking-wider"
                    >
                      Decline
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Bar */}
      <GlassCard className="p-4 flex flex-wrap items-center gap-4 bg-white/50 border-sand/50">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
          <Input
            placeholder="Search workspaces..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 h-11 bg-cream/50 border-sand/50 rounded-xl"
          />
        </div>
      </GlassCard>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-sand/20 animate-pulse border border-sand/30" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center glass rounded-3xl border-dashed border-2 border-sand">
          <Briefcase className="h-16 w-16 mx-auto mb-4 text-tan/30" />
          <h3 className="text-xl font-semibold text-bark mb-1">No Workspaces Found</h3>
          <p className="text-tan max-w-xs mx-auto">Start by creating a new workspace to organize your work.</p>
        </motion.div>
      ) : (
        <div className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "flex flex-col gap-4"
        )}>
          <AnimatePresence mode="popLayout">
            {workspaces.map((ws, i) => (
              <motion.div
                key={ws._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                {viewMode === "grid" ? (
                  <GlassCard className="group relative h-full flex flex-col justify-between overflow-hidden cursor-pointer hover:bg-white transition-colors duration-500">
                    <div className={cn(
                      "absolute top-0 left-0 w-1 h-full scale-y-0 group-hover:scale-y-100 transition-transform duration-500",
                      getWorkspaceColorClasses(ws).bg.replace('/10', '') || "bg-sage"
                    )} />

                    <div>
                      <div className="flex items-start justify-between mb-4">


                        {ws.meta?.icon ? <img src={`${ws.meta.icon}`} className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-xl transition-all duration-300",
                          getWorkspaceColorClasses(ws).bg,
                          getWorkspaceColorClasses(ws).text,
                          `group-hover:${getWorkspaceColorClasses(ws).bg.replace('/10', '')}`,
                          "group-hover:text-white"
                        )} /> : <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-xl transition-all duration-300",
                          getWorkspaceColorClasses(ws).bg,
                          getWorkspaceColorClasses(ws).text,
                          `group-hover:${getWorkspaceColorClasses(ws).bg.replace('/10', '')}`,
                          "group-hover:text-white"
                        )}>
                          {ws.name.charAt(0)}
                        </div>}
                        {(ws.myRole?.toUpperCase() === 'OWNER' || ws.myRole?.toUpperCase() === 'ADMIN' || ws.myRole?.toUpperCase() === 'MANAGER') && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-tan hover:bg-sand rounded-lg transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-sand">
                              <DropdownMenuItem onClick={() => onEdit(ws)} className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream">
                                <Edit2 className="h-4 w-4 text-sage" /> Edit
                              </DropdownMenuItem>
                              
                              {(ws.myRole?.toUpperCase() === 'OWNER' || ws.myRole?.toUpperCase() === 'ADMIN') && (
                                <>
                                  <DropdownMenuItem onClick={() => setManagingMembersWorkspace(ws)} className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream">
                                    <Users className="h-4 w-4 text-sage" /> Members
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setWorkspaceToDelete(ws)} className="gap-2 cursor-pointer text-red-500 font-bold hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      <h3 className={cn(
                        "text-lg font-bold text-bark transition-colors mb-2 line-clamp-1",
                        getWorkspaceColorClasses(ws).hoverText
                      )}>
                        {ws.name}
                      </h3>
                      <p className="text-tan text-sm line-clamp-2 mb-4 leading-relaxed">
                        {ws.description || "A workspace for your team to collaborate and manage projects efficiently."}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        {ws.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-sand/30 text-[10px] font-bold text-tan border border-sand/50 uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {ws.meta &&
                          Object.entries(ws.meta)
                            .filter(([key]) => key !== "color" && key !== "icon")
                            .map(([key, value]) => (
                              <span
                                key={key}
                                className="border px-2 py-1 rounded-xl text-xs bg-tan-light text-white"
                              >
                                {key} : {String(value)}
                              </span>
                            ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-sand/50 text-xs text-tan font-medium">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3" />
                          <span>{ws.members?.length ?? 0} members</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Navigate to projects with workspaceId first to ensure room joining, then toggle
                              window.location.href = `/projects?workspaceId=${ws._id}`;
                              // Note: In a real app, we'd use useChat().toggleChat() after navigation, 
                              // but since we are navigating, the side-panel state might reset.
                              // We'll handle automatic opening if the URL has a specific flag or just let the user toggle.
                            }}
                            className={cn(
                              "flex items-center gap-1.5 transition-all text-tan hover:text-sage uppercase text-[10px] font-black tracking-widest"
                            )}
                          >
                            <MessageSquare className="h-3 w-3" />
                            Chat
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSchedulingMeetingWorkspace(ws);
                            }}
                            className={cn(
                              "flex items-center gap-1.5 transition-all text-tan hover:text-sage uppercase text-[10px] font-black tracking-widest"
                            )}
                          >
                            <MeetingIcon className="h-3 w-3" />
                            Meetings
                          </button>
                          <Link
                            to={`/workspaces/${ws._id}`}
                            className={cn(
                              "flex items-center gap-1 transition-colors group/link",
                              getWorkspaceColorClasses(ws).hoverText.replace('group-hover:', 'hover:')
                            )}
                          >
                            Explore
                            <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ) : (
                  <GlassCard className="flex items-center justify-between p-4 group cursor-pointer hover:bg-white">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center font-bold transition-all",
                        getWorkspaceColorClasses(ws).bg,
                        getWorkspaceColorClasses(ws).text,
                        `group-hover:${getWorkspaceColorClasses(ws).bg.replace('/10', '')}`,
                        "group-hover:text-white"
                      )}>
                        {ws.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className={cn("font-bold text-bark transition-colors", getWorkspaceColorClasses(ws).hoverText)}>{ws.name}</h3>
                        <p className="text-xs text-tan mt-0.5 font-medium flex items-center gap-1.5">
                          <Users className="h-3 w-3" /> {ws.members?.length ?? 0} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {(ws.myRole === 'OWNER' || ws.myRole === 'ADMIN' || ws.myRole === 'MANAGER') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-tan hover:bg-sand rounded-lg transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border-sand">
                            <DropdownMenuItem onClick={() => onEdit(ws)} className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream">
                              <Edit2 className="h-4 w-4 text-sage" /> Edit
                            </DropdownMenuItem>
                            
                            {(ws.myRole === 'OWNER' || ws.myRole === 'ADMIN') && (
                              <>
                                <DropdownMenuItem onClick={() => setManagingMembersWorkspace(ws)} className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream">
                                  <Users className="h-4 w-4 text-sage" /> Members
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setWorkspaceToDelete(ws)} className="gap-2 cursor-pointer text-red-500 font-bold hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      <Button 
                        variant="ghost" 
                        onClick={() => setSchedulingMeetingWorkspace(ws)}
                        className="text-tan hover:bg-tan/10 gap-2 font-bold text-[10px] uppercase tracking-widest"
                      >
                        <MeetingIcon className="h-4 w-4" />
                        Meetings
                      </Button>

                      <Link to={`/workspaces/${ws._id}`}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "text-tan hover:bg-opacity-10 gap-2",
                            getWorkspaceColorClasses(ws).hoverText.replace('group-hover:', 'hover:'),
                            getWorkspaceColorClasses(ws).bg.replace('bg-', 'hover:bg-')
                          )}
                        >
                          Explore <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-6">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-xl border-sand bg-white text-bark hover:bg-sage/5 hover:text-sage transition-all">Previous</Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button
                key={p}
                variant={page === p ? "default" : "ghost"}
                size="sm"
                onClick={() => setPage(p)}
                className={cn("h-8 w-8 p-0 rounded-lg font-bold text-xs transition-all", page === p ? "bg-sage text-white shadow-md" : "text-tan hover:text-bark hover:bg-sand")}
              >{p}</Button>
            ))}
          </div>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl border-sand bg-white text-bark hover:bg-sage/5 hover:text-sage transition-all">Next</Button>
        </div>
      )}
      {/* Deletion Dialog */}
      <AlertDialog open={!!workspaceToDelete} onOpenChange={(open) => !open && setWorkspaceToDelete(null)}>
        <AlertDialogContent className="bg-white border-sand">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workspace <span className="font-bold text-bark">"{workspaceToDelete?.name}"</span> and all its associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-sand">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => workspaceToDelete && deleteWorkspace({ variables: { id: workspaceToDelete._id } })}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Delete Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Dialog */}
      {managingMembersWorkspace && (
        <WorkspaceMembersDialog
          workspaceId={managingMembersWorkspace._id}
          workspaceName={managingMembersWorkspace.name}
          myRole={managingMembersWorkspace.myRole}
          isOpen={!!managingMembersWorkspace}
          onOpenChange={(open) => !open && setManagingMembersWorkspace(null)}
        />
      )}

      {/* Meetins Dialog */}
      <Dialog open={!!schedulingMeetingWorkspace} onOpenChange={(open) => !open && setSchedulingMeetingWorkspace(null)}>
        <DialogContent className="max-w-2xl bg-white border-sand rounded-[2.5rem] p-0 overflow-hidden">
           <div className="p-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black text-bark uppercase tracking-tighter">
                   Workspace Meetings: <span className="text-sage">{schedulingMeetingWorkspace?.name}</span>
                </DialogTitle>
              </DialogHeader>
              {schedulingMeetingWorkspace && (
                <MeetingScheduler workspaceId={schedulingMeetingWorkspace._id} />
              )}
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

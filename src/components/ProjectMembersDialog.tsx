import { useState } from "react";
import { useAppQuery, useAppMutation } from "@/hooks/useGraphQL";
import { GET_PROJECT_MEMBERS } from "@/graphql/queries";
import { ADD_PROJECT_MEMBER, REMOVE_PROJECT_MEMBER } from "@/graphql/mutations";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { UserPlus, UserMinus, Shield, Mail, Loader2, CheckCircle2, Clock, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectRole, ProjectMember, PaginatedResponse } from "@/types";
import { cn } from "@/lib/utils";

interface ProjectMembersDialogProps {
  projectId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
}

export function ProjectMembersDialog({
  projectId,
  isOpen,
  onOpenChange,
  projectName
}: ProjectMembersDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>("MEMBER");

  const { data, loading, refetch } = useAppQuery<{ findProjectMemberWithPagination: PaginatedResponse<ProjectMember> }>(GET_PROJECT_MEMBERS, {
    variables: {
      input: {
        projectId,
        page: 1,
        limit: 50,
      }
    },
    skip: !isOpen
  });

  const [addMember, { loading: adding }] = useAppMutation(ADD_PROJECT_MEMBER, {
    successMessage: "Member invited to project successfully!",
    onCompleted: () => {
      setEmail("");
      refetch();
    }
  });

  const [removeMember, { loading: removing }] = useAppMutation(REMOVE_PROJECT_MEMBER, {
    successMessage: "Member removed from project successfully!",
    onCompleted: () => refetch()
  });

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await addMember({
      variables: {
        projectId,
        email,
        role
      }
    });
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMember({
      variables: {
        projectId,
        userId
      }
    });
  };

  const members = data?.findProjectMemberWithPagination?.items ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-white border-sand p-0 overflow-hidden shadow-2xl">
        <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <UserPlus size={120} />
          </div>
          <DialogTitle className="text-2xl font-bold mb-1">Project Members</DialogTitle>
          <DialogDescription className="text-indigo-100 font-medium">
            Project: <span className="text-white font-bold">{projectName}</span>
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Member Form */}
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="flex flex-col gap-3">
              <Label className="text-bark font-bold text-sm">Invite to Project</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tan" />
                  <Input 
                    placeholder="teammate@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 bg-cream/50 border-sand focus:ring-indigo-500 rounded-xl"
                  />
                </div>
                <Select value={role} onValueChange={(v) => setRole(v as ProjectRole)}>
                  <SelectTrigger className="w-[120px] h-11 bg-cream/50 border-sand rounded-xl font-medium">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-sand">
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  type="submit" 
                  disabled={adding || !email} 
                  className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 gap-2 transition-all shadow-md"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Invite
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-bark font-bold text-sm">Team Members ({members.length})</Label>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-xl bg-sand/10 animate-pulse border border-sand/30" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 bg-sand/10 rounded-2xl border border-dashed border-sand">
                  <p className="text-tan font-medium">No members found</p>
                </div>
              ) : (
                members.map((member) => (
                  <div 
                    key={member._id} 
                    className="flex items-center justify-between p-3 rounded-2xl bg-cream/30 border border-sand/50 group hover:border-indigo-300 hover:bg-white transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-soft">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user?.name || member.email}`} />
                        <AvatarFallback className="bg-sand text-bark font-bold">
                          {(member.user?.name || member.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-bark text-sm leading-tight">
                          {member.user?.name || "Invited User"}
                        </h4>
                        <p className="text-[11px] text-tan font-medium">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-extrabold uppercase tracking-tight py-0 px-2 rounded-md border-0",
                          member.role === 'OWNER' ? "bg-amber-100 text-amber-700" : 
                          member.role === 'ADMIN' ? "bg-blue-100 text-blue-700" : 
                          member.role === 'VIEWER' ? "bg-slate-100 text-slate-700" :
                          "bg-sand/50 text-tan"
                        )}>
                          {member.role}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {member.status === 'ACTIVE' ? (
                            <div className="flex items-center gap-1 text-[9px] text-green-600 font-bold">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Active
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[9px] text-tan font-bold">
                              <Clock className="h-2.5 w-2.5" />
                              Pending
                            </div>
                          )}
                        </div>
                      </div>

                      {member.role !== 'OWNER' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-tan hover:text-bark hover:bg-sand rounded-xl"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border-sand">
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.userId || "")}
                              disabled={removing}
                              className="text-red-500 font-bold hover:bg-red-50 cursor-pointer gap-2"
                            >
                              <UserMinus className="h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

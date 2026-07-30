import { useState, useEffect } from "react";
import { useAppMutation, useAppQuery } from "@/hooks/useGraphQL";
import { CREATE_TASK } from "@/graphql/mutations";
import { GET_PROJECTS, GET_WORKSPACES } from "@/graphql/queries";
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
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import type { PaginatedResponse, Project, Workspace } from "@/types";

export function QuickTaskOverlay() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

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
          workspaceId: workspaceId || undefined 
        } 
      },
      skip: !workspaceId
    }
  );

  const [createTask, { loading }] = useAppMutation(CREATE_TASK, {
    successMessage: "Task created!",
    onCompleted: () => {
      setOpen(false);
      setNote("");
    }
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note || !workspaceId || !projectId) return;
    await createTask({
      variables: {
        input: {
          note,
          workspaceId,
          projectId,
          priority,
          status: "PENDING"
        }
      }
    });
  };

  const workspaces = wsData?.findWorkspaceWithPagination?.items ?? [];
  const projects = projData?.findProjects?.items ?? [];

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-sage hover:bg-sage-dark text-white shadow-lg shadow-accent ring-4 ring-white z-50 transition-all hover:scale-110 active:scale-95 group"
      >
        <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-sand sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-bark">
              <Zap className="h-5 w-5 text-sage fill-sage" /> Quick Task
            </DialogTitle>
            <DialogDescription className="text-tan">
              Press <kbd className="bg-sand px-1.5 py-0.5 rounded text-[10px] font-bold">Ctrl + K</kbd> to open this from anywhere.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="note" className="text-bark">Task Title</Label>
              <Input
                id="note"
                autoFocus
                placeholder="What needs to be done?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-cream border-sand focus:border-sage rounded-xl"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-bark">Workspace</Label>
                <Select value={workspaceId} onValueChange={setWorkspaceId}>
                  <SelectTrigger className="bg-cream border-sand rounded-xl">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-sand">
                    {workspaces.map(ws => <SelectItem key={ws._id} value={ws._id}>{ws.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-bark">Project</Label>
                <Select value={projectId} onValueChange={setProjectId} disabled={!workspaceId}>
                  <SelectTrigger className="bg-cream border-sand rounded-xl">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-sand">
                    {projects.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-bark">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-cream border-sand rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-sand">
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              disabled={loading || !note || !workspaceId || !projectId}
              className="w-full bg-sage hover:bg-sage-dark text-white rounded-xl h-11"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Create Task
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

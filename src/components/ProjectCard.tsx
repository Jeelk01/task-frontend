import { GlassCard } from "./GlassCard";
import { Button } from "./ui/button";
import { 
  MoreVertical, Users, Tag, 
  ArrowRight, Calendar, Edit2, Trash2,
  Folder, Target, Layers
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getWorkspaceColorClasses } from "@/lib/workspace-utils";
import type { Project } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  project: Project;
  viewMode?: "grid" | "list";
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onManageMembers?: (project: Project) => void;
}

export function ProjectCard({ project, viewMode = "grid", onEdit, onDelete, onManageMembers }: ProjectCardProps) {
  const wsColors = getWorkspaceColorClasses(project.workspace);
  
  if (viewMode === "list") {
    return (
      <GlassCard className="flex items-center justify-between p-4 group cursor-pointer hover:bg-white border-sand/50 transition-all duration-300">
        <div className="flex items-center gap-4 flex-1">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500 shadow-sm",
            wsColors.bg,
            wsColors.text,
            "group-hover:scale-110 group-hover:rotate-3"
          )}>
            {project.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn("font-black text-bark transition-colors truncate text-base tracking-tight", wsColors.hoverText)}>
              {project.name}
            </h3>
            <div className="flex items-center gap-4 text-[10px] text-tan mt-1 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(project.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5 font-black text-sage bg-sage/5 px-2 py-0.5 rounded-full border border-sage/10">
                <Target className="h-3 w-3" /> {project.workspace?.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2">
            <div className="flex -space-x-2">
              {project.memberUsers?.slice(0, 3).map((member) => (
                <Avatar key={member._id} className="h-7 w-7 border-2 border-white ring-1 ring-sand/30 shadow-sm">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-[8px] font-black bg-cream text-bark">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.members && project.members.length > 3 && (
                <div className="h-7 w-7 rounded-full bg-sand flex items-center justify-center text-[8px] font-black text-tan border-2 border-white">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-tan hover:bg-sand rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-sand shadow-xl rounded-xl p-2">
                <DropdownMenuItem onClick={() => onEdit?.(project)} className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream rounded-lg p-2.5">
                  <Edit2 className="h-4 w-4 text-sage" /> Edit Details
                </DropdownMenuItem>
                {onManageMembers && (
                  <DropdownMenuItem onClick={() => onManageMembers?.(project)} className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream rounded-lg p-2.5">
                    <Users className="h-4 w-4 text-sage" /> Manage Team
                  </DropdownMenuItem>
                )}
                <div className="h-[1px] bg-sand/30 my-1" />
                <DropdownMenuItem onClick={() => onDelete?.(project)} className="gap-2 cursor-pointer text-red-500 font-bold hover:bg-red-50 rounded-lg p-2.5">
                  <Trash2 className="h-4 w-4" /> Move to Trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to={`/projects/${project._id}`}>
              <Button 
                variant="ghost" 
                className={cn(
                  "h-10 rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest transition-all px-4",
                  wsColors.hoverText.replace('group-hover:', 'hover:'),
                  wsColors.bg,
                  "border border-transparent hover:border-sand"
                )}
              >
                Launch <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="group relative h-full flex flex-col justify-between overflow-hidden cursor-pointer hover:bg-white transition-all duration-500 border-sand/50 shadow-sm hover:shadow-2xl p-6">
      {/* Dynamic Accents */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-1 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left",
        wsColors.bg.replace('/10', '')
      )} />
      
      <div>
        <div className="flex items-start justify-between mb-6">
          <div className={cn(
            "h-16 w-16 rounded-[1.5rem] flex items-center justify-center font-black text-3xl transition-all duration-500 shadow-lg relative group-hover:rotate-6",
            wsColors.bg,
            wsColors.text,
            `group-hover:${wsColors.bg.replace('/10', '')}`,
            "group-hover:text-white group-hover:scale-105"
          )}>
            {project.name.charAt(0)}
            <div className="absolute -bottom-2 -right-2 h-7 w-7 bg-white rounded-xl shadow-md border border-sand/50 flex items-center justify-center">
              <Folder className={cn("h-3.5 w-3.5", wsColors.text)} />
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-tan hover:bg-sand rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-sand shadow-2xl rounded-2xl p-2 min-w-[180px]">
              <DropdownMenuItem onClick={() => onEdit?.(project)} className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream rounded-xl p-3">
                <Edit2 className="h-4 w-4 text-sage" /> Edit Project
              </DropdownMenuItem>
              {onManageMembers && (
                <DropdownMenuItem onClick={() => onManageMembers?.(project)} className="gap-2 cursor-pointer font-bold text-bark hover:bg-cream rounded-xl p-3">
                  <Users className="h-4 w-4 text-sage" /> Team Access
                </DropdownMenuItem>
              )}
              <div className="h-[1px] bg-sand/30 my-2" />
              <DropdownMenuItem onClick={() => onDelete?.(project)} className="gap-2 cursor-pointer text-red-500 font-bold hover:bg-red-50 rounded-xl p-3">
                <Trash2 className="h-4 w-4" /> Delete Forever
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-black text-sage uppercase tracking-widest flex items-center gap-1.5">
               <Layers className="h-3 w-3" /> {project.workspace?.name || "Independent"}
             </span>
          </div>
          <h3 className={cn(
            "text-2xl font-black text-bark transition-colors line-clamp-1 tracking-tighter leading-tight",
            wsColors.hoverText
          )}>
            {project.name}
          </h3>
          <p className="text-tan text-xs line-clamp-2 leading-relaxed font-bold opacity-80 group-hover:opacity-100 transition-opacity">
            {project.description || "Architecting tomorrow through innovative collaboration strategies."}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Visual Tags */}
        <div className="flex flex-wrap gap-1.5">
          {project.tags?.length > 0 ? project.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-sand/30 text-[9px] font-black text-tan border border-sand/50 uppercase tracking-widest shadow-sm">
              {tag}
            </span>
          )) : (
            <span className="text-[9px] font-bold text-tan/40 uppercase tracking-widest italic flex items-center gap-1">
              <Tag className="h-3 w-3" /> No Classification
            </span>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-6 border-t border-sand/40">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {project.memberUsers?.slice(0, 3).map((member) => (
                <Avatar key={member._id} className="h-8 w-8 border-2 border-white ring-1 ring-sand/30 shadow-sm group-hover:translate-y-[-2px] transition-transform">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-[10px] font-black bg-cream text-bark">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-bark leading-none">{project.members?.length ?? 0}</span>
              <span className="text-[8px] font-bold text-tan uppercase tracking-tighter">Experts</span>
            </div>
          </div>
          
          <Link 
            to={`/projects/${project._id}`} 
            className={cn(
              "flex items-center gap-2 transition-all group/link px-5 py-2.5 rounded-[1.2rem] border-2 font-black uppercase text-[10px] tracking-[0.1em] shadow-sm",
              wsColors.hoverText.replace('group-hover:', 'hover:'),
              wsColors.bg,
              wsColors.border,
              "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            Explore
            <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}

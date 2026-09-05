import React from "react";
import { FieldTask, FieldTeam } from "@/types";
import { FileText, Phone, HardHat, Clock } from "lucide-react";

interface OperationalInstructionCardProps {
  task: FieldTask;
  team?: FieldTeam | null;
  className?: string;
}

export function OperationalInstructionCard({
  task,
  team,
  className = "",
}: OperationalInstructionCardProps) {
  const formattedTime = task.assignedAt
    ? new Date(task.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "Recent";

  return (
    <div className={`card-quiet p-5 sm:p-6 space-y-4 font-mono-data text-xs ${className}`} aria-label="Operational Instructions">
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <FileText className="w-4 h-4 text-civic-cyan" />
          <span>Operational Directives</span>
        </div>
        <div className="flex items-center gap-1.5 text-text-muted text-[10px]">
          <Clock className="w-3.5 h-3.5 text-civic-amber" />
          <span>Assigned {formattedTime}</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-surface-base border border-border-subtle text-xs text-text-primary font-sans leading-relaxed">
        {task.instructions || "Standard municipal repair directive. Secure site perimeter and begin priority restoration."}
      </div>

      {team && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border-subtle font-sans">
          <div>
            <span className="text-[10px] text-text-muted font-mono-data uppercase block">Assigned Squad:</span>
            <span className="text-white font-bold">{team.name}</span>
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-mono-data uppercase block">Squad Leader:</span>
            <span className="text-white">{team.leaderName} ({team.phone})</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperationalInstructionCard;

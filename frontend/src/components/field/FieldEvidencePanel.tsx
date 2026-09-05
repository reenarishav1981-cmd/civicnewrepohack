import React from "react";
import { FieldTask, Incident } from "@/types";
import { Camera, CheckCircle2, Image as ImageIcon } from "lucide-react";

interface FieldEvidencePanelProps {
  task: FieldTask;
  incident?: Incident | null;
  className?: string;
}

export function FieldEvidencePanel({
  task,
  incident,
  className = "",
}: FieldEvidencePanelProps) {
  const beforeUrl = task.beforePhotoUrl || incident?.beforeEvidenceUrl;
  const afterUrl = task.afterPhotoUrl || incident?.afterEvidenceUrl;

  return (
    <div className={`card-quiet p-5 sm:p-6 space-y-4 font-mono-data text-xs ${className}`} aria-label="Field Evidence">
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <Camera className="w-4 h-4 text-civic-cyan" />
          <span>Site Photographic Evidence</span>
        </div>
        <span className="text-[10px] text-text-muted">Verification Records</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Before Evidence */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-text-muted uppercase font-bold">Initial Hazard (Before):</span>
          {beforeUrl ? (
            <div className="relative h-32 rounded-xl overflow-hidden border border-border-subtle bg-surface-base">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={beforeUrl} alt="Initial hazard" className="w-full h-full object-cover" />
              <div className="absolute bottom-1.5 left-1.5 badge-critical text-[9px] py-0 px-1.5">
                Before Repair
              </div>
            </div>
          ) : (
            <div className="h-32 rounded-xl border border-dashed border-border-subtle flex flex-col items-center justify-center text-text-muted text-center p-2 text-[10px]">
              <ImageIcon className="w-4 h-4 mb-1 opacity-50" />
              <span>No initial photo attached</span>
            </div>
          )}
        </div>

        {/* After Evidence */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-text-muted uppercase font-bold">Restoration (After):</span>
          {afterUrl ? (
            <div className="relative h-32 rounded-xl overflow-hidden border border-civic-green/40 bg-surface-base">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={afterUrl} alt="Restoration proof" className="w-full h-full object-cover" />
              <div className="absolute bottom-1.5 left-1.5 badge-resolved text-[9px] py-0 px-1.5">
                Restored
              </div>
            </div>
          ) : (
            <div className="h-32 rounded-xl border border-dashed border-border-subtle flex flex-col items-center justify-center text-text-muted text-center p-2 text-[10px]">
              <CheckCircle2 className="w-4 h-4 mb-1 opacity-50" />
              <span>Pending task completion</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FieldEvidencePanel;

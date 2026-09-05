"use client";

import React, { useState } from "react";
import { TaskStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { 
  Navigation, 
  MapPin, 
  Wrench, 
  CheckCircle2, 
  Send, 
  AlertCircle,
  FileText,
  Camera,
  Check,
  Clock,
  UploadCloud,
  X,
  Sparkles
} from "lucide-react";

interface NextActionPanelProps {
  currentStatus: TaskStatus;
  workerNotes: string;
  onWorkerNotesChange: (notes: string) => void;
  onUpdateStatus: (nextStatus: TaskStatus, proofUrl?: string) => Promise<void>;
  isUpdating: boolean;
  className?: string;
}

const EVIDENCE_PRESETS = [
  { label: "Pothole Compaction", url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop" },
  { label: "Electrical Substation", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop" },
  { label: "Water Pipeline Seal", url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop" },
];

export function NextActionPanel({
  currentStatus,
  workerNotes,
  onWorkerNotesChange,
  onUpdateStatus,
  isUpdating,
  className = "",
}: NextActionPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [proofUrl, setProofUrl] = useState<string>(
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturingFile, setIsCapturingFile] = useState(false);

  const handleNativeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File exceeds 5MB municipal limit. Please capture a smaller photo.");
      return;
    }

    setIsCapturingFile(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProofUrl(reader.result);
      }
      setIsCapturingFile(false);
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read device photo. Please retry.");
      setIsCapturingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const getNextActionConfig = () => {
    switch (currentStatus) {
      case "assigned":
        return {
          nextStatus: "en_route" as TaskStatus,
          label: "Start Travel (En Route)",
          icon: Navigation,
          variant: "primary" as const,
          description: "Confirm vehicle departure to site to update municipal telemetry.",
        };
      case "en_route":
        return {
          nextStatus: "arrived" as TaskStatus,
          label: "Confirm Site Arrival",
          icon: MapPin,
          variant: "primary" as const,
          description: "Confirm on-site arrival to alert operations dispatch.",
        };
      case "arrived":
        return {
          nextStatus: "in_progress" as TaskStatus,
          label: "Begin Field Repairs",
          icon: Wrench,
          variant: "primary" as const,
          description: "Initialize physical repair and safety equipment.",
        };
      case "in_progress":
        return {
          nextStatus: "completed" as TaskStatus,
          label: "Submit Evidence & Complete Task",
          icon: CheckCircle2,
          variant: "primary" as const,
          description: "Submit mandatory after-work photographic proof and directives to conclude field work.",
        };
      case "completed":
      default:
        return {
          nextStatus: null,
          label: "Field Task Completed",
          icon: CheckCircle2,
          variant: "secondary" as const,
          description: "Field repairs executed and evidence submitted. Awaiting Operations Control sign-off.",
        };
    }
  };

  const actionConfig = getNextActionConfig();

  const handleExecute = async () => {
    if (!actionConfig.nextStatus) return;
    setErrorMessage(null);

    // Client-side pre-validation for completion evidence
    if (actionConfig.nextStatus === "completed") {
      if (!proofUrl.trim()) {
        setErrorMessage("Completion photographic proof URL is required by municipal protocol.");
        return;
      }
      if (!workerNotes.trim() || workerNotes.trim().length < 5) {
        setErrorMessage("Meaningful completion notes (at least 5 characters) are required.");
        return;
      }
    }

    try {
      await onUpdateStatus(
        actionConfig.nextStatus,
        actionConfig.nextStatus === "completed" ? proofUrl.trim() : undefined
      );
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to advance task status. Please verify site telemetry and retry.");
    }
  };

  return (
    <div className={`card-elevated p-5 sm:p-6 space-y-4 font-mono-data text-xs ${className}`} aria-label="Next Required Field Action">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <span className="font-bold text-white uppercase tracking-wider">
          Primary Field Action
        </span>
        <span className="text-[10px] text-text-muted">Lifecycle Stage</span>
      </div>

      <p className="text-xs text-text-secondary font-sans leading-relaxed">
        {actionConfig.description}
      </p>

      {/* Completion Evidence Section (Required during in_progress) */}
      {currentStatus === "in_progress" && (
        <div className="p-4 rounded-xl bg-surface-elevated border border-sky-500/30 space-y-3 font-sans">
          <div className="flex items-center justify-between text-xs font-bold font-mono-data uppercase">
            <div className="flex items-center gap-2 text-sky-400">
              <Camera className="w-3.5 h-3.5" />
              <span>After-Work Evidence (Protocol §4.2)</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-normal">
              {proofUrl ? "✓ Evidence Ready" : "Photo Required"}
            </span>
          </div>

          {/* Hidden Native File Input Supporting Mobile Camera & Gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleNativeFileSelect}
            className="hidden"
            disabled={isUpdating || isCapturingFile}
          />

          {/* Interactive Capture Controls */}
          <div className="space-y-2">
            {proofUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-border-medium bg-surface-base group">
                <div className="relative h-44 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofUrl}
                    alt="Restoration site proof"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Remove / Retake Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setProofUrl("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 hover:bg-red-600 text-white transition-all shadow-md"
                    title="Remove Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono-data">
                    <span className="px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 font-bold">
                      ✓ Ready to Submit
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 text-sky-400 border border-slate-700 underline"
                    >
                      Retake Photo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-32 rounded-xl border-2 border-dashed border-sky-500/40 hover:border-sky-400 bg-sky-950/20 hover:bg-sky-950/40 transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer space-y-2"
              >
                <div className="p-2.5 rounded-full bg-sky-900/40 text-sky-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isCapturingFile ? "Processing Photo..." : "Take Photo / Choose Image"}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    Tap to open device camera or file gallery (Max 5MB)
                  </span>
                </div>
              </div>
            )}

            {/* Quick Presets for Demo Fallback */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono-data text-text-muted">
                <span>Or use inspection presets:</span>
                {proofUrl && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sky-400 hover:underline"
                  >
                    Upload from Device
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EVIDENCE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setProofUrl(preset.url)}
                    className={`px-2 py-1 rounded text-[10px] font-mono-data transition-all border ${
                      proofUrl === preset.url
                        ? "bg-sky-950 text-sky-300 border-sky-500"
                        : "bg-surface-base hover:bg-slate-800 text-text-secondary border-border-subtle"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Notes Input */}
      {currentStatus !== "completed" && (
        <div className="space-y-1.5 font-sans">
          <label className="text-[10.5px] font-bold text-text-secondary uppercase font-mono-data flex justify-between">
            <span>Field Remediation Directives &amp; Site Notes:</span>
            {currentStatus === "in_progress" && (
              <span className="text-civic-amber text-[10px]">* Required for Completion</span>
            )}
          </label>
          <textarea
            rows={2}
            value={workerNotes}
            onChange={(e) => onWorkerNotesChange(e.target.value)}
            disabled={isUpdating}
            placeholder={
              currentStatus === "in_progress"
                ? "Describe physical restoration completed (e.g., Damaged high-voltage fuses replaced, site cleared, load tested normal)..."
                : "Operational site directives & notes..."
            }
            className="w-full px-3 py-2.5 rounded-xl bg-surface-base border border-border-medium text-xs text-white placeholder-text-muted focus:outline-none focus:border-civic-cyan resize-none"
          />
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 font-sans">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-bold block font-mono-data uppercase">Action Blocked</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      {actionConfig.nextStatus ? (
        <Button
          variant={actionConfig.variant}
          onClick={handleExecute}
          isLoading={isUpdating}
          disabled={isUpdating}
          leftIcon={<actionConfig.icon className="w-4 h-4" />}
          className="w-full py-4 text-sm font-bold font-sans shadow-elevation-md"
        >
          {isUpdating ? "Transmitting Operational State..." : actionConfig.label}
        </Button>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs space-y-1.5 font-sans">
          <div className="flex items-center gap-2 font-bold text-emerald-400 font-mono-data uppercase">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Task Completed &bull; Awaiting Operations Verification</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
            Photographic proof and technical notes have been recorded in the case dossier. The parent civic incident is now in <strong>awaiting_verification</strong> status pending municipal supervisory sign-off.
          </p>
        </div>
      )}
    </div>
  );
}

export default NextActionPanel;
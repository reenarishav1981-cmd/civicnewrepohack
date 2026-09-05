"use client";

import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, X, UploadCloud, Check, Plus } from "lucide-react";

export interface UploadedEvidence {
  file?: File;
  previewUrl: string;
  mediaUrl: string;
  uploadStatus: "idle" | "selected" | "uploaded";
}

interface EvidenceCapturePanelProps {
  mediaUrl: string;
  onMediaUrlChange: (url: string) => void;
  className?: string;
}

const SAMPLE_EVIDENCE = [
  { label: "Pothole Crater", url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop" },
  { label: "Water Pipe Leak", url: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop" },
  { label: "Dark Streetlight", url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop" },
  { label: "Garbage Pile", url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop" },
  { label: "Other", url: "" },
];

export function EvidenceCapturePanel({
  mediaUrl,
  onMediaUrlChange,
  className = "",
}: EvidenceCapturePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onMediaUrlChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className={`space-y-3 font-sans ${className}`} aria-label="Photo evidence capture">
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Top Header Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
          Photo Evidence <span className="text-slate-400 font-normal font-sans">(Optional)</span>
        </label>
        <span className="text-[11px] text-slate-400 font-mono">
          {mediaUrl ? "1 Photo Attached" : "0 Photos Attached"}
        </span>
      </div>

      {/* Upload Zone & Thumbnail Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Active Attached Photo Preview Card */}
        {mediaUrl ? (
          <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 group shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl}
              alt="Attached civic observation evidence"
              className="w-full h-full object-cover"
            />
            
            {/* Remove Action Button */}
            <button
              type="button"
              onClick={() => onMediaUrlChange("")}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 hover:bg-red-600 text-white transition-all shadow-md"
              aria-label="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            
            {/* Bottom Badges */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700 text-sky-400 text-[10px] font-mono font-bold backdrop-blur-sm">
                &#128269; Tap to preview
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-500/40 text-sky-300 text-[10px] font-mono font-bold backdrop-blur-sm">
                Main Evidence
              </span>
            </div>
          </div>
        ) : null}

        {/* Upload / Add Another Photo Dropzone Box */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`h-36 rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-4 text-center cursor-pointer ${
            isDragging
              ? "border-sky-400 bg-sky-950/30"
              : "border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50"
          } ${mediaUrl ? "" : "sm:col-span-2"}`}
        >
          <div className="p-2.5 rounded-full bg-slate-800/80 text-sky-400 mb-2">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-white font-sans">
            {mediaUrl ? "Add Another Photo" : "Upload a photo of the issue"}
          </div>
          <div className="text-[10.5px] text-slate-400 font-sans mt-0.5">
            JPG, PNG up to 5MB (or drag &amp; drop)
          </div>
        </div>

      </div>

      {/* Sample Evidence Presets */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider">
          Sample Evidence Presets:
        </div>

        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          {SAMPLE_EVIDENCE.map((item, idx) => {
            const isSelected = mediaUrl === item.url && item.url !== "";
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (item.url) onMediaUrlChange(item.url);
                  else fileInputRef.current?.click();
                }}
                className={`px-3 py-1 rounded-xl border transition-all font-sans ${
                  isSelected
                    ? "bg-slate-800 border-sky-500 text-sky-400 font-bold shadow-sm"
                    : "bg-slate-900/40 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default EvidenceCapturePanel;

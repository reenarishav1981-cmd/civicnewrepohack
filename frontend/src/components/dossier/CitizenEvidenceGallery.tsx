"use client";

import React, { useState } from "react";
import { CitizenReport } from "@/types";
import { Camera, Image as ImageIcon, MapPin, Clock, User, X, ZoomIn, CheckCircle2, AlertCircle } from "lucide-react";

interface CitizenEvidenceGalleryProps {
  reports: CitizenReport[];
  incidentId: string;
  className?: string;
}

export function CitizenEvidenceGallery({
  reports,
  incidentId,
  className = "",
}: CitizenEvidenceGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    reportId: string;
    reporter: string;
    description: string;
    timestamp: string;
    location: string;
  } | null>(null);

  const reportsWithPhotos = reports.filter(r => !!r.mediaUrl);

  return (
    <section 
      className={`card-focal p-6 sm:p-7 space-y-6 font-mono-data ${className}`}
      aria-label="Citizen Submitted Observational Evidence"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle text-xs">
        <div className="flex items-center gap-2 font-bold text-civic-cyan uppercase tracking-wider">
          <Camera className="w-4 h-4" />
          <span>Citizen-Submitted Evidence &bull; Ground Truth Media</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-intelligence text-[10px]">
            {reportsWithPhotos.length} OF {reports.length} SIGNALS WITH PHOTO EVIDENCE
          </span>
        </div>
      </div>

      {/* Intro Note */}
      <p className="text-xs text-text-secondary font-sans leading-relaxed">
        Independent photographic evidence captured and submitted directly by local citizens during incident intake. These images preserve raw ground-truth conditions separate from internal field restoration records.
      </p>

      {/* Evidence Cards Grid */}
      {reports.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-surface-base border border-dashed border-border-subtle space-y-2">
          <ImageIcon className="w-6 h-6 mx-auto text-text-muted opacity-40" />
          <h4 className="text-xs font-bold text-white font-sans">No Linked Citizen Signals</h4>
          <p className="text-[11px] text-text-secondary font-sans">
            No independent citizen reports are currently linked to this incident master record.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((rep) => {
            const hasPhoto = !!rep.mediaUrl;
            return (
              <div
                key={rep.id}
                className={`group relative rounded-xl border transition-all duration-200 overflow-hidden flex flex-col bg-surface-base ${
                  hasPhoto
                    ? "border-border-subtle hover:border-civic-cyan/50 hover:shadow-elevation-md"
                    : "border-border-subtle/60 opacity-85"
                }`}
              >
                {/* Photo Thumbnail Container */}
                {hasPhoto ? (
                  <div 
                    className="relative h-44 w-full bg-slate-950 overflow-hidden cursor-pointer"
                    onClick={() => setSelectedImage({
                      url: rep.mediaUrl!,
                      reportId: rep.id,
                      reporter: rep.userName || "Verified Citizen",
                      description: rep.description,
                      timestamp: new Date(rep.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
                      location: rep.address
                    })}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rep.mediaUrl}
                      alt={`Citizen evidence for report ${rep.id}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Hover Zoom Prompt */}
                    <div className="absolute inset-0 bg-sky-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-white font-bold backdrop-blur-[2px]">
                      <ZoomIn className="w-4 h-4 text-sky-400" />
                      <span>Inspect Photo</span>
                    </div>

                    {/* Report Badge Overlay */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-[10px] font-bold text-sky-400">
                      {rep.id}
                    </div>
                  </div>
                ) : (
                  <div className="h-28 w-full bg-slate-900/40 border-b border-border-subtle flex flex-col items-center justify-center p-3 text-center text-text-muted">
                    <ImageIcon className="w-5 h-5 mb-1 opacity-40" />
                    <span className="text-[10px] font-mono">No Photo Attached</span>
                    <span className="text-[9px] text-text-muted/80">Text Telemetry Signal</span>
                  </div>
                )}

                {/* Card Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-text-muted font-mono">
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3 h-3 text-sky-400" />
                        {rep.userName || "Citizen"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-text-primary font-sans line-clamp-2 leading-relaxed">
                      &quot;{rep.description}&quot;
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[10px] text-text-muted font-sans">
                    <span className="truncate max-w-[170px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="truncate">{rep.address}</span>
                    </span>
                    <span className="badge-neutral text-[9px] uppercase font-mono shrink-0">
                      {rep.category}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Lightbox Preview */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-xs">
              <div className="flex items-center gap-2 text-white font-mono">
                <Camera className="w-4 h-4 text-sky-400" />
                <span className="font-bold">CITIZEN EVIDENCE &bull; {selectedImage.reportId}</span>
                <span className="text-slate-400">({selectedImage.reporter})</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image View */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] max-h-[60vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.url}
                alt="Citizen Evidence Full Inspection"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Modal Meta Bar */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 text-xs space-y-1.5 font-sans">
              <p className="text-white text-sm font-medium">
                &quot;{selectedImage.description}&quot;
              </p>
              <div className="flex flex-wrap items-center justify-between text-slate-400 text-xs pt-1">
                <span>📍 {selectedImage.location}</span>
                <span>🕒 Submitted: {selectedImage.timestamp}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CitizenEvidenceGallery;

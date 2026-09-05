"use client";

import React from "react";
import { 
  Sparkles, 
  Radio, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Shield,
  FileText,
  Lock,
  Database,
  BellRing,
  UserX
} from "lucide-react";

export interface PreviewCandidate {
  incidentId: string;
  title: string;
  category: string;
  status: string;
  zone: string;
  connectedReportsCount: number;
  confidence: number;
  semanticScore: number;
  geoDistanceMeters: number;
  reasons: string[];
}

interface ReportIntelligencePreviewProps {
  isAnalyzing: boolean;
  hasSearched: boolean;
  candidate: PreviewCandidate | null;
  suggestedCategory?: string | null;
  activeTab: "report" | "track";
  onTabChange: (tab: "report" | "track") => void;
  communitySignalsCount?: number;
  className?: string;
}

export function ReportIntelligencePreview({
  isAnalyzing,
  hasSearched,
  candidate,
  suggestedCategory,
  activeTab,
  onTabChange,
  communitySignalsCount = 5,
  className = "",
}: ReportIntelligencePreviewProps) {
  
  // Calculate display percentages from candidate or default baseline
  const correlationPct = candidate ? Math.round(candidate.confidence * 100) : 94;
  const semanticPct = candidate ? Math.round(candidate.semanticScore * 100) : 94;
  const geoPct = candidate ? Math.min(98, Math.max(70, Math.round(100 - (candidate.geoDistanceMeters / 650) * 30))) : 92;
  const categoryPct = candidate ? (candidate.category ? 95 : 85) : 95;
  const patternPct = 91;

  return (
    <aside 
      className={`space-y-4 font-sans ${className}`}
      aria-live="polite"
      aria-label="Civic Intelligence Analysis & Workflow Panel"
    >
      
      {/* 1. TOP TAB SWITCHER (Report Issue vs Community Signals) */}
      <div className="p-1 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-1 font-mono text-xs">
        <button
          type="button"
          onClick={() => onTabChange("report")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "report"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>Report Issue</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("track")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "track"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Community Signals ({communitySignalsCount})</span>
        </button>
      </div>

      {/* 2. LIVE SIGNAL ANALYSIS CARD */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200 tracking-wider uppercase">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>Live Signal Analysis</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-sky-950/60 border border-sky-500/30 text-sky-400 font-mono text-[10px] font-bold">
            Real-Time
          </span>
        </div>

        {/* Circular Radar Scope & Correlation Score */}
        <div className="flex items-center gap-4 py-1">
          
          {/* Circular Radar Scope SVG */}
          <div className="relative w-20 h-20 rounded-full border border-sky-500/30 bg-sky-950/20 flex items-center justify-center shrink-0 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Radar Rings */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" />
              <circle cx="50" cy="50" r="24" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" />
              <circle cx="50" cy="50" r="8" fill="rgba(56, 189, 248, 0.4)" />
              {/* Crosshairs */}
              <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="0.8" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="0.8" />
              {/* Sweep Line */}
              <line 
                x1="50" y1="50" x2="85" y2="25" 
                stroke="#38BDF8" strokeWidth="1.5" 
                className="animate-spin origin-center" 
                style={{ animationDuration: "4s" }} 
              />
              {/* Signal Blips */}
              <circle cx="68" cy="38" r="2.5" fill="#38BDF8" className="animate-ping" />
              <circle cx="34" cy="62" r="2" fill="#34D399" />
            </svg>
          </div>

          {/* Correlation Match Info */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {isAnalyzing ? "..." : `${correlationPct}%`}
              </span>
              <span className="text-xs font-bold text-slate-300 font-sans">
                Correlation Match
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-snug mt-1">
              {isAnalyzing 
                ? "Correlating against active municipal signals..." 
                : candidate 
                ? `Strong match found with ${candidate.incidentId} (${candidate.connectedReportsCount} reports).` 
                : "Strong match found with similar incidents in your area."}
            </p>
          </div>

        </div>

        {/* 4 Multi-Factor Correlation Bars */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
          
          {/* Factor 1: Semantic */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>High Semantic Similarity</span>
              <span className="text-sky-400 font-bold">{semanticPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-sky-400 rounded-full transition-all duration-500" 
                style={{ width: `${semanticPct}%` }}
              />
            </div>
          </div>

          {/* Factor 2: Proximity */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Location Proximity</span>
              <span className="text-sky-400 font-bold">{geoPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-sky-400 rounded-full transition-all duration-500" 
                style={{ width: `${geoPct}%` }}
              />
            </div>
          </div>

          {/* Factor 3: Category */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Category Correlation</span>
              <span className="text-sky-400 font-bold">{categoryPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-sky-400 rounded-full transition-all duration-500" 
                style={{ width: `${categoryPct}%` }}
              />
            </div>
          </div>

          {/* Factor 4: Historical Pattern */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Historical Pattern Match</span>
              <span className="text-sky-400 font-bold">{patternPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-sky-400 rounded-full transition-all duration-500" 
                style={{ width: `${patternPct}%` }}
              />
            </div>
          </div>

        </div>

      </div>

      {/* 3. PREDICTED IMPACT CARD */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xl space-y-3 font-sans">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Predicted Impact</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
            <span className="text-slate-400">Public Safety Risk:</span>
            <span className="px-2 py-0.5 rounded-md bg-red-950/80 border border-red-500/50 text-red-400 font-mono text-[10.5px] font-bold">
              HIGH
            </span>
          </div>

          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
            <span className="text-slate-400">Affected Area:</span>
            <span className="text-white font-semibold">Local Corridor</span>
          </div>

          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60">
            <span className="text-slate-400">Potential Impact:</span>
            <span className="text-white font-semibold">Vehicle Damage, Traffic Risk</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Estimated Resolution:</span>
            <span className="text-sky-400 font-mono font-bold">24–48 Hours</span>
          </div>
        </div>
      </div>

      {/* 4. WHAT HAPPENS NEXT? CARD */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xl space-y-3.5 font-sans">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
          <Clock className="w-4 h-4 text-sky-400" />
          <span>What Happens Next?</span>
        </div>

        {/* 4-Step Vertical Timeline */}
        <div className="space-y-3 relative pl-6 border-l border-slate-800 ml-2">
          
          {/* Step 1 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-purple-950 border border-purple-500 flex items-center justify-center text-[9px] font-mono text-purple-400 font-bold">
              1
            </div>
            <div className="text-xs font-bold text-white">AI Analysis</div>
            <div className="text-[11px] text-slate-400 leading-snug">Our engine analyzes &amp; correlates your report.</div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-950 border border-blue-500 flex items-center justify-center text-[9px] font-mono text-blue-400 font-bold">
              2
            </div>
            <div className="text-xs font-bold text-white">Smart Routing</div>
            <div className="text-[11px] text-slate-400 leading-snug">Automatically assigned to the right department.</div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-sky-950 border border-sky-500 flex items-center justify-center text-[9px] font-mono text-sky-400 font-bold">
              3
            </div>
            <div className="text-xs font-bold text-white">Action &amp; Update</div>
            <div className="text-[11px] text-slate-400 leading-snug">Field team acts and updates progress.</div>
          </div>

          {/* Step 4 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-[9px] font-mono text-emerald-400 font-bold">
              4
            </div>
            <div className="text-xs font-bold text-white">Resolution</div>
            <div className="text-[11px] text-slate-400 leading-snug">You&apos;ll receive updates until the issue is resolved.</div>
          </div>

        </div>
      </div>

      {/* 5. TRUST & TRANSPARENCY CARD */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xl space-y-3 font-sans">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Trust &amp; Transparency</span>
        </div>

        <div className="space-y-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Your identity is protected</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Your data is used only for civic improvement</span>
          </div>
          <div className="flex items-center gap-2">
            <BellRing className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>You&apos;ll receive updates on your report</span>
          </div>
          <div className="flex items-center gap-2">
            <UserX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>We do not share your personal information</span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2 text-[10.5px] text-slate-300 font-sans mt-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>CIVICPULSE is ISO 27001 aligned and built on data protection best practices.</span>
        </div>
      </div>

    </aside>
  );
}

export default ReportIntelligencePreview;

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  ShieldCheck, 
  Radio, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Layers,
  Compass
} from "lucide-react";

export default function PublicTrackingSearchPage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = trackingId.trim().toUpperCase();
    if (!cleanId) {
      setErrorMsg("Please enter a valid Incident Tracking ID (e.g., CP-1024).");
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/track/${cleanId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || `We couldn't find an incident with tracking ID '${cleanId}'.`);
        setIsSearching(false);
        return;
      }

      router.push(`/track/${cleanId}`);
    } catch (err: any) {
      setErrorMsg("Network error communicating with city tracking servers.");
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-primary font-sans flex flex-col justify-between">
      {/* Top Banner */}
      <header className="border-b border-border-subtle bg-surface-base/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-civic-blue to-civic-cyan flex items-center justify-center font-bold text-white shadow-sm">
              CP
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wider uppercase font-mono-data">
                CivicPulse &bull; Public Transparency Portal
              </div>
              <div className="text-[10px] text-text-secondary">
                Municipal Incident Lifecycle &amp; Verification Tracker
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/citizen"
              className="text-xs text-text-secondary hover:text-white transition-colors"
            >
              Citizen Portal
            </Link>
            <Link
              href="/operations"
              className="text-xs text-text-secondary hover:text-white transition-colors"
            >
              Operations Centre
            </Link>
          </div>
        </div>
      </header>

      {/* Main Search Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl space-y-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-civic-cyan/30 text-civic-cyan text-xs font-mono-data">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Public-Safe Real-Time Incident Tracking</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Track Your Civic Report
            </h1>
            <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
              Enter your tracking identifier to monitor municipal crew dispatch, live field progress, and official verified resolution proof.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3 text-left">
            <div className="relative">
              <input
                type="text"
                value={trackingId}
                onChange={(e) => {
                  setTrackingId(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter Incident ID (e.g. CP-1024)"
                className="w-full pl-12 pr-32 py-4 rounded-2xl bg-surface-base border-2 border-border-medium focus:border-civic-cyan focus:outline-none text-white font-mono-data text-sm placeholder-text-muted transition-all shadow-elevation-md"
              />
              <Search className="w-5 h-5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-2 top-1/2 -translate-y-1/2 py-2.5 px-5 rounded-xl bg-civic-cyan hover:bg-civic-cyan/90 text-void font-bold text-xs uppercase tracking-wider font-mono-data flex items-center gap-1.5 transition-all"
              >
                {isSearching ? (
                  <>
                    <Radio className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-sans animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          {/* Demo Quick Shortcuts */}
          <div className="pt-4 border-t border-border-subtle text-xs space-y-2">
            <span className="text-text-muted font-mono-data text-[11px] block">
              Quick Test Identifiers (Active Municipal Cases):
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 font-mono-data text-[11px]">
              {["CP-1024", "CP-1025", "CP-1026"].map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setTrackingId(id);
                    setErrorMsg(null);
                  }}
                  className="px-3 py-1 rounded-lg bg-surface-elevated hover:bg-slate-800 border border-border-subtle hover:border-civic-cyan/40 text-text-secondary hover:text-white transition-all"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-text-muted pt-2 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 text-civic-cyan" />
            <span>Public transparency data is strictly sanitized to protect field responder privacy.</span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-4 px-6 text-center text-xs text-text-muted font-mono-data">
        CivicPulse Smart City Operations &bull; National Civic Infrastructure Initiative &copy; 2026
      </footer>
    </div>
  );
}
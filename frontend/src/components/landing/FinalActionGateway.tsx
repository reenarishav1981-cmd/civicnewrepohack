import React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Shield, HardHat } from "lucide-react";

export function FinalActionGateway() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border-subtle font-sans text-center">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="font-mono-data text-xs font-bold text-civic-cyan uppercase tracking-wider">
          Experience The Complete System
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Enter The CivicPulse Workflow
        </h2>

        <p className="text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Test the live working loops across all three operational portals. Submit a citizen observation, watch it correlate in Operations Command, and execute the work order in the Field Worker Hub.
        </p>

        {/* 3 Prominent Entry Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 font-mono-data text-xs">
          <Link
            href="/citizen"
            className="btn-primary py-4 px-6 text-sm font-bold font-sans flex items-center justify-center gap-2 w-full sm:w-auto shadow-elevation-md"
          >
            <FileText className="w-4 h-4" />
            <span>Report a Civic Issue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/operations"
            className="btn-secondary py-4 px-6 text-sm font-bold font-sans flex items-center justify-center gap-2 w-full sm:w-auto border-civic-blue/40 hover:border-civic-blue"
          >
            <Shield className="w-4 h-4 text-civic-blue" />
            <span>Enter Operations</span>
          </Link>

          <Link
            href="/field"
            className="px-6 py-4 rounded-xl border border-civic-green/30 bg-surface-base hover:bg-civic-green/10 text-white transition-all text-sm font-bold font-sans flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <HardHat className="w-4 h-4 text-civic-green" />
            <span>Open Field Hub</span>
          </Link>
        </div>

      </div>
    </section>
  );
}

export default FinalActionGateway;

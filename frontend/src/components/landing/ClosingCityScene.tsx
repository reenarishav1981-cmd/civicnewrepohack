"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldAlert, Smartphone, CheckCircle2 } from "lucide-react";

export const ClosingCityScene: React.FC = () => {
  return (
    <section className="py-28 px-4 sm:px-6 lg:px-8 border-t border-border-subtle bg-void relative overflow-hidden text-center">
      
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-civic-blue/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        <div className="badge-resolved inline-flex">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>CLOSED-LOOP CIVIC INTELLIGENCE</span>
        </div>

        <h2 className="heading-display text-white">
          From scattered voices <br />
          <span className="bg-gradient-to-r from-civic-cyan via-civic-blue to-civic-green bg-clip-text text-transparent">
            to verified action.
          </span>
        </h2>

        <p className="text-base sm:text-lg text-text-secondary font-sans leading-relaxed max-w-2xl mx-auto">
          CivicPulse connects citizens, operations teams, and field workers through one intelligent civic response loop. Experience the platform live.
        </p>

        {/* Closing Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-mono-data">
          <Link
            href="/operations"
            className="btn-primary py-3.5 px-6 text-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Explore Mission Control</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/citizen"
            className="btn-secondary py-3.5 px-6 text-sm"
          >
            <Smartphone className="w-4 h-4 text-civic-cyan" />
            <span>Report an Issue</span>
          </Link>
        </div>

        {/* Real-time System Status Indicator */}
        <div className="pt-12 flex items-center justify-center gap-6 font-mono-data text-xs text-text-muted border-t border-border-subtle max-w-xl mx-auto">
          <span className="flex items-center gap-2 text-civic-green">
            <span className="w-2 h-2 rounded-full bg-civic-green animate-pulse" />
            SYSTEM OPERATIONAL
          </span>
          <span>&bull;</span>
          <span>SURAT METRO GRID</span>
          <span>&bull;</span>
          <span className="text-civic-cyan">AI ENGINE ACTIVE</span>
        </div>

      </div>
    </section>
  );
};

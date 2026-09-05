import React from "react";
import Link from "next/link";
import { Radio, Shield } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-surface-base font-sans border-t border-border-subtle">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 font-mono-data text-xs">
        
        {/* Brand & Description */}
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 font-black text-white text-sm font-sans tracking-tight">
            <div className="w-5 h-5 rounded-md bg-civic-blue flex items-center justify-center text-white">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span>CIVICPULSE</span>
          </div>
          <p className="text-[11px] text-text-muted font-sans">
            Civic Intelligence &amp; Operational Dispatch Platform
          </p>
        </div>

        {/* Portal Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 font-sans text-xs">
          <Link href="/" className="text-text-secondary hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/citizen" className="text-text-secondary hover:text-civic-cyan transition-colors">
            Citizen Portal
          </Link>
          <Link href="/operations" className="text-text-secondary hover:text-civic-blue transition-colors">
            Operations Command
          </Link>
          <Link href="/field" className="text-text-secondary hover:text-civic-green transition-colors">
            Field Worker Hub
          </Link>
        </div>

        {/* Live System Status Tag */}
        <div className="flex items-center gap-2 text-[10px] text-civic-green font-bold">
          <span className="w-2 h-2 rounded-full bg-civic-green animate-pulse" />
          <span>Operational Systems Online</span>
        </div>

      </div>
    </footer>
  );
}

export default LandingFooter;

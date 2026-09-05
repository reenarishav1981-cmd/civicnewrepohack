"use client";

import React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Sparkles, 
  Radio, 
  Truck, 
  ShieldCheck 
} from "lucide-react";
import { ThreeHeroScene } from "@/components/landing/hero/ThreeHeroScene";

export function HeroCommandCenter() {
  const featurePills = [
    {
      title: "Smart Correlation",
      subtitle: "AI-powered matching",
      icon: Sparkles,
      iconColor: "text-sky-400",
    },
    {
      title: "Real-time Operations",
      subtitle: "Live mission control",
      icon: Radio,
      iconColor: "text-cyan-400",
    },
    {
      title: "Field Execution",
      subtitle: "Track to resolution",
      icon: Truck,
      iconColor: "text-emerald-400",
    },
    {
      title: "Evidence Verified",
      subtitle: "Accountable outcomes",
      icon: ShieldCheck,
      iconColor: "text-purple-400",
    },
  ];

  return (
    <section className="relative pt-6 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#04060c] font-sans border-b border-slate-800/80">
      
      {/* Ambient Lighting Background */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-sky-600/10 blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[350px] bg-indigo-600/10 blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center min-h-[85vh]">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: EDITORIAL POSITIONING & CTAs (6 Cols)                        */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6 text-left z-10 pt-2">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#08181a] border border-[#1c3a3a] text-[#5fd8d0] font-sans text-xs font-semibold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ee0c8] shadow-[0_0_8px_#3ee0c8]" />
            <span>CONNECTED. INTELLIGENT. ACCOUNTABLE.</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-white tracking-tight leading-[1.06] uppercase font-sans">
            From civic signals<br />
            to <span className="bg-gradient-to-r from-[#6fb3ff] via-[#22d3ee] to-[#8b5cf6] bg-clip-text text-transparent">verified resolution.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-base text-slate-300 font-normal leading-relaxed font-sans max-w-xl">
            CivicPulse connects citizen observations, incident intelligence, operations coordination and field execution through one continuous, transparent workflow.
          </p>

          {/* 4 Feature Micro-Cards Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {featurePills.map((pill, idx) => {
              const Icon = pill.icon;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#0b1122]/90 border border-[#23304c] hover:border-[#3b82f6]/50 transition-all flex items-center gap-3 shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0b1122] border border-[#23304c] flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${pill.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate font-sans">
                      {pill.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-sans mt-0.5">
                      {pill.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary & Secondary Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
            
            {/* Primary: Report a Civic Issue */}
            <Link
              href="/citizen"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] hover:from-[#2563eb] hover:to-[#7c3aed] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <span>Report a Civic Issue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Secondary: Explore Operations */}
            <Link
              href="/operations"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-slate-200 font-bold text-sm bg-[#0d1424] hover:bg-[#121c33] border border-[#263254] hover:border-[#3a4a78] flex items-center justify-center gap-2 transition-all"
            >
              <span>Explore Operations</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 3D ISOMETRIC INTERACTIVE CITY STAGE (7 Cols)                */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 relative z-20">
          <ThreeHeroScene />
        </div>

      </div>

    </section>
  );
}

export default HeroCommandCenter;

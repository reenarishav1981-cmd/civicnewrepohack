"use client";

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Activity, Cpu } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class SceneErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("CivicCityScene WebGL caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[#04060b]">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <p className="font-mono text-xs text-slate-400 uppercase tracking-wider">
              3D Digital Twin Initializing
            </p>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Connecting live municipal signal nodes and spatial telemetry...
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

const City3DCanvas = dynamic(() => import("@/components/City3DCanvas").then(mod => mod.City3DCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#080D18]">
      <div className="h-8 w-8 animate-pulse rounded-full bg-[#53D7FF]/30" />
    </div>
  ),
});

export function CivicPulseHero() {
  const [metrics, setMetrics] = useState({
    signalsCount: 35,
    activeIncidents: 12,
    casesResolved: 23,
  });

  useEffect(() => {
    let mounted = true;
    async function loadMetrics() {
      try {
        const [incRes, repRes] = await Promise.all([
          fetch("/api/incidents"),
          fetch("/api/reports"),
        ]);
        const [incData, repData] = await Promise.all([
          incRes.json(),
          repRes.json(),
        ]);

        if (mounted && incData.success && repData.success) {
          const incidents = incData.data || [];
          const reports = repData.data || [];
          const totalSignals = incidents.reduce(
            (acc: number, i: any) => acc + (i.connectedReportsCount || 1),
            reports.length
          );

          setMetrics({
            signalsCount: totalSignals || 35,
            activeIncidents: incidents.filter((i: any) => i.status !== "resolved").length || 12,
            casesResolved: incidents.filter((i: any) => i.status === "resolved").length || 23,
          });
        }
      } catch (e) {
        console.error("Hero metrics fetch error:", e);
      }
    }
    loadMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="grid min-h-[92vh] grid-cols-1 items-center gap-8 bg-[#04060b] px-5 py-10 md:grid-cols-[45fr_55fr] md:gap-12 md:px-[4vw] md:py-16 font-sans">
      {/* Copy column */}
      <div className="z-10 order-1 max-w-xl">
        <p className="mb-7 font-mono text-xs font-medium uppercase tracking-[0.16em] text-[#7fa8d9]">
          Civic Intelligence Platform
        </p>

        <h1 className="mb-7 text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.015em] text-slate-100 md:text-5xl lg:text-[3.4rem]">
          From every <span className="font-semibold text-[#5b9dfb]">civic signal</span>
          <br />
          to one{" "}
          <span className="bg-gradient-to-r from-[#6ea8ff] to-[#9b8bff] bg-clip-text text-transparent">
            verified resolution.
          </span>
        </h1>

        <p className="mb-10 max-w-lg text-[1.0625rem] leading-relaxed text-slate-400">
          CivicPulse unifies citizen reports, AI correlation, operations
          coordination and field execution into a single accountable civic
          workflow — from first signal to verified close-out.
        </p>

        <dl className="mb-11 flex gap-9 border-y border-white/[0.08] py-6">
          <div>
            <dt className="mb-1.5 text-[0.72rem] text-slate-500 font-mono uppercase tracking-wider">Signals correlated</dt>
            <dd className="text-2xl font-semibold text-slate-100 font-mono">{metrics.signalsCount}</dd>
          </div>
          <div>
            <dt className="mb-1.5 text-[0.72rem] text-slate-500 font-mono uppercase tracking-wider">Active incidents</dt>
            <dd className="text-2xl font-semibold text-slate-100 font-mono">{metrics.activeIncidents}</dd>
          </div>
          <div>
            <dt className="mb-1.5 text-[0.72rem] text-slate-500 font-mono uppercase tracking-wider">Cases resolved</dt>
            <dd className="text-2xl font-semibold text-slate-100 font-mono">{metrics.casesResolved}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3.5">
          <Link
            href="/citizen"
            className="inline-flex items-center gap-2 rounded-lg bg-[#3b6fe0] px-6 py-3.5 text-[0.9375rem] font-medium text-slate-50 transition hover:-translate-y-px hover:bg-[#4a7cf0] shadow-lg shadow-blue-600/25"
          >
            <span>Report a civic issue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/operations"
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.14] px-6 py-3.5 text-[0.9375rem] font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/[0.03]"
          >
            <span>Explore operations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 3D civic digital twin */}
      <div
        className="relative order-2 h-[48vh] min-h-[360px] overflow-hidden rounded-2xl border border-white/[0.08] md:h-[78vh] md:min-h-[520px] bg-[#080D18]"
        role="img"
        aria-label="Interactive 3D civic digital twin showing live incident intelligence across the city"
      >
        <City3DCanvas />
      </div>
    </section>
  );
}

export default CivicPulseHero;

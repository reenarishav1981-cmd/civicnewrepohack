"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Sparkles,
  CheckCircle2,
  ArrowRight,
  User,
  LogOut,
  LogIn,
  Shield,
  HardHat,
  Radio,
  UserCheck
} from "lucide-react";
import { User as UserType } from "@/types";

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.user) {
          setCurrentUser(data.data.user);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession, pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Citizen", href: "/citizen" },
    { label: "Track", href: "/track" },
    { label: "Operations", href: "/operations" },
    { label: "Live Ops", href: "/operations/live" },
    { label: "Executive", href: "/executive" },
    { label: "Intelligence", href: "/operations/intelligence" },
    { label: "Field Worker", href: "/field" },
  ];

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioIndex: Math.floor(Math.random() * 3) })
      });
      const data = await res.json();
      if (data.success) {
        setSimulationToast(`Signal ${data.data.report.id} correlated into ${data.data.incident.id} (${data.data.incident.connectedReportsCount} signals connected)`);
        setTimeout(() => setSimulationToast(null), 4500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-purple-950/60 text-purple-400 border-purple-500/30";
      case "operator":
        return "bg-blue-950/60 text-blue-400 border-blue-500/30";
      case "worker":
        return "bg-emerald-950/60 text-emerald-400 border-emerald-500/30";
      case "citizen":
      default:
        return "bg-sky-950/60 text-sky-400 border-sky-500/30";
    }
  };

  const getRolePortalLink = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return { label: "Admin Hub", href: "/admin" };
      case "operator":
        return { label: "Command Ops", href: "/operations" };
      case "worker":
        return { label: "Field Hub", href: "/field" };
      case "citizen":
      default:
        return { label: "My Reports", href: "/citizen" };
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070C18]/90 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 select-none hover:opacity-95 transition-opacity">
            <div className="relative w-8 h-8 rounded-full border border-sky-400/40 bg-sky-950/40 flex items-center justify-center text-sky-400">
              <span className="w-4 h-4 rounded-full border border-sky-400/70" />
              <span className="absolute w-1.5 h-1.5 rounded-full bg-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white text-base tracking-tight leading-tight">
                CIVIC<span className="text-sky-400">PULSE</span>
              </span>
              <span className="text-[10px] text-slate-400 font-sans tracking-wide">
                Civic Intelligence System
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 font-sans text-xs font-semibold">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors relative py-1 ${
                    isActive
                      ? "text-sky-400 font-bold"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Status Pill & Session Actions */}
          <div className="flex items-center gap-3">
            
            {/* Quick Simulate Trigger */}
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-mono transition-all"
              title="Test real-time AI signal correlation"
            >
              <Sparkles className={`w-3.5 h-3.5 text-sky-400 ${isSimulating ? "animate-spin" : ""}`} />
              <span>{isSimulating ? "Correlating..." : "Simulate Signal"}</span>
            </button>

            {/* User Session State */}
            {!isAuthChecking && (
              currentUser ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 font-sans text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-white font-medium max-w-[120px] truncate">
                      {currentUser.name}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${getRoleBadgeStyle(currentUser.role)}`}>
                      {currentUser.role}
                    </span>
                  </div>

                  <Link
                    href={getRolePortalLink(currentUser.role).href}
                    className="hidden lg:inline-flex text-[11px] font-mono text-sky-400 hover:text-sky-300 underline font-bold"
                  >
                    {getRolePortalLink(currentUser.role).label}
                  </Link>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-sans font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-sky-400" />
                  <span>Sign In</span>
                </Link>
              )
            )}

            {/* Primary Gradient CTA */}
            <Link
              href="/citizen"
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all font-sans shrink-0"
            >
              <span>Report Issue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800 py-2 px-3 bg-[#090E1A] text-xs font-sans">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  isActive ? "bg-slate-800 text-sky-400 font-bold" : "text-slate-400"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {currentUser ? (
            <button
              onClick={handleLogout}
              className="px-2 py-1 text-slate-400 hover:text-red-400 text-xs font-mono"
            >
              Logout ({currentUser.role})
            </button>
          ) : (
            <Link
              href="/login"
              className="px-2 py-1 text-sky-400 font-bold text-xs"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Simulation Live Toast */}
      {simulationToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-slate-900/95 border border-sky-500/40 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 font-mono text-xs">
          <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Live Signal Correlation
            </div>
            <p className="text-xs text-slate-200 mt-1 font-sans leading-relaxed">{simulationToast}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
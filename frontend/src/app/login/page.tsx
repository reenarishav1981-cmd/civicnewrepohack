"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Shield, 
  HardHat, 
  Radio, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  Wrench,
  Droplets,
  Zap,
  Trash2
} from "lucide-react";

interface Persona {
  label: string;
  role: "citizen" | "operator" | "worker" | "admin";
  email: string;
  name: string;
  department?: string;
  icon: React.ElementType;
  badgeColor: string;
  destination: string;
}

const DEMO_PERSONAS: Persona[] = [
  {
    label: "Citizen Persona",
    role: "citizen",
    email: "citizen@civicpulse.gov.in",
    name: "Aarav Sharma",
    icon: UserCheck,
    badgeColor: "bg-sky-950/60 text-sky-400 border-sky-500/30",
    destination: "/citizen"
  },
  {
    label: "Operations Lead",
    role: "operator",
    email: "ops.lead@civicpulse.gov.in",
    name: "Vikram Mehta",
    icon: Radio,
    badgeColor: "bg-blue-950/60 text-blue-400 border-blue-500/30",
    destination: "/operations"
  },
  {
    label: "System Admin",
    role: "admin",
    email: "admin@civicpulse.gov.in",
    name: "Dr. Anita Desai",
    icon: Shield,
    badgeColor: "bg-purple-950/60 text-purple-400 border-purple-500/30",
    destination: "/admin"
  },
  // Field Workers across Departments
  {
    label: "PWD Road Squad Lead",
    role: "worker",
    email: "worker@civicpulse.gov.in",
    name: "Rajesh Kumar",
    department: "PWD Road Alpha",
    icon: HardHat,
    badgeColor: "bg-amber-950/60 text-amber-400 border-amber-500/30",
    destination: "/field"
  },
  {
    label: "PWD Road Specialist",
    role: "worker",
    email: "amit.worker@civicpulse.gov.in",
    name: "Amit Sharma",
    department: "PWD Road Alpha",
    icon: Wrench,
    badgeColor: "bg-amber-950/60 text-amber-400 border-amber-500/30",
    destination: "/field"
  },
  {
    label: "Water & Drainage Lead",
    role: "worker",
    email: "sunil.worker@civicpulse.gov.in",
    name: "Sunil Deshmukh",
    department: "Water Supply Beta",
    icon: Droplets,
    badgeColor: "bg-cyan-950/60 text-cyan-400 border-cyan-500/30",
    destination: "/field"
  },
  {
    label: "Water & Sewer Technician",
    role: "worker",
    email: "suresh.worker@civicpulse.gov.in",
    name: "Suresh Jadhav",
    department: "Water Supply Beta",
    icon: Droplets,
    badgeColor: "bg-cyan-950/60 text-cyan-400 border-cyan-500/30",
    destination: "/field"
  },
  {
    label: "High Voltage Electrical Lead",
    role: "worker",
    email: "manoj.worker@civicpulse.gov.in",
    name: "Manoj Verma",
    department: "Electrical Grid Gamma",
    icon: Zap,
    badgeColor: "bg-yellow-950/60 text-yellow-400 border-yellow-500/30",
    destination: "/field"
  },
  {
    label: "Electrical Grid Specialist",
    role: "worker",
    email: "ramesh.worker@civicpulse.gov.in",
    name: "Ramesh Tiwari",
    department: "Electrical Grid Gamma",
    icon: Zap,
    badgeColor: "bg-yellow-950/60 text-yellow-400 border-yellow-500/30",
    destination: "/field"
  },
  {
    label: "Sanitation Rapid Force Lead",
    role: "worker",
    email: "kiran.worker@civicpulse.gov.in",
    name: "Kiran Rane",
    department: "Sanitation Delta",
    icon: Trash2,
    badgeColor: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
    destination: "/field"
  },
  {
    label: "Sanitation Cleansing Tech",
    role: "worker",
    email: "deepak.worker@civicpulse.gov.in",
    name: "Deepak More",
    department: "Sanitation Delta",
    icon: Trash2,
    badgeColor: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
    destination: "/field"
  }
];

const DEFAULT_PASSWORD = "CivicPulse2026!";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentSessionUser, setCurrentSessionUser] = useState<any | null>(null);

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.user) {
            setCurrentSessionUser(data.data.user);
          }
        }
      } catch {
        // Unauthenticated
      }
    }
    checkExistingSession();
  }, []);

  const routeByRole = (role: string) => {
    const normalized = (role || "").toLowerCase();
    switch (normalized) {
      case "operator":
        return "/operations";
      case "worker":
        return "/field";
      case "admin":
        return "/admin";
      case "citizen":
      default:
        return "/citizen";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Invalid credentials. Please verify email and password.");
        return;
      }

      const user = data.data.user;
      const destination = routeByRole(user.role);
      router.push(destination);
      router.refresh();
    } catch {
      setErrorMessage("Network error while communicating with authorization server.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectPersona = (persona: Persona) => {
    setEmail(persona.email);
    setPassword(DEFAULT_PASSWORD);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#070C18] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-sky-600/10 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[300px] bg-indigo-600/10 blur-[150px] pointer-events-none -z-10" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-sky-400 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Identity Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sign in to Civic<span className="text-sky-400">Pulse</span>
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your official credentials or select an evaluator persona to access role-specific systems.
            </p>
          </div>

          {currentSessionUser && (
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  Signed in as <strong className="text-white">{currentSessionUser.name}</strong> ({currentSessionUser.role.toUpperCase()})
                </span>
              </div>
              <button
                type="button"
                onClick={() => router.push(routeByRole(currentSessionUser.role))}
                className="text-sky-400 hover:underline font-bold text-[11px] font-mono"
              >
                Go to Portal &rarr;
              </button>
            </div>
          )}

          {errorMessage && (
            <div 
              className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@civicpulse.gov.in"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-slate-500 font-mono">Demo: {DEFAULT_PASSWORD}</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security credentials"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate &amp; Enter Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>HTTP-Only Session Cookie</span>
            <span>256-Bit HMAC Verified</span>
          </div>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-slate-900/50 border border-slate-800/80 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>One-Click Persona Switcher</span>
            </div>
            <p className="text-xs text-slate-400">
              Select any persona below to autofill verified credentials for testing.
            </p>
          </div>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {DEMO_PERSONAS.map((p) => {
              const Icon = p.icon;
              const isSelected = email === p.email;
              return (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => selectPersona(p)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 ${
                    isSelected 
                      ? "bg-sky-950/40 border-sky-500/60 shadow-lg shadow-sky-500/10"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">{p.name}</span>
                        <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${p.badgeColor}`}>
                          {p.role}
                        </span>
                        {p.department && (
                          <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {p.department}
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-slate-400 font-mono truncate">{p.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-sky-400 font-mono shrink-0 font-bold">Select</span>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans">
            <span className="font-bold text-slate-300">Security Guarantee:</span> Roles are strictly verified against database records. Public registration creates Citizen only.
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  IssueCategory, 
  CitizenReport,
  Incident 
} from "@/types";
import { IssueCategorySelector } from "@/components/citizen/IssueCategorySelector";
import { LocationCapturePanel } from "@/components/citizen/LocationCapturePanel";
import { EvidenceCapturePanel } from "@/components/citizen/EvidenceCapturePanel";
import { ReportIntelligencePreview, PreviewCandidate } from "@/components/citizen/ReportIntelligencePreview";
import { SubmissionReceipt } from "@/components/citizen/SubmissionReceipt";
import { CitizenReportTracker } from "@/components/citizen/CitizenReportTracker";
import { 
  Sparkles, 
  Radio, 
  AlertCircle, 
  FileText, 
  Send,
  CheckCircle2,
  Lock,
  Compass,
  ArrowRight,
  Shield,
  HelpCircle,
  Activity,
  Layers
} from "lucide-react";

const QUICK_SCENARIOS = [
  { 
    label: "Pothole near ABC School", 
    text: "Dangerous huge pothole near St. Xavier's school gate causing vehicle damage and traffic hazards.", 
    cat: "Road Hazard" as IssueCategory, 
    lat: 21.1702, 
    lng: 72.8311, 
    addr: "Opp. St. Xavier's Model High School, Sector 3, North Corridor Zone",
    mediaUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop"
  },
  { 
    label: "Water Pipe Burst near Hospital", 
    text: "Main drinking water pipeline ruptured and flooding corner pavement near Civil Hospital quarters.", 
    cat: "Water Leakage" as IssueCategory, 
    lat: 21.1755, 
    lng: 72.8250, 
    addr: "Lane 4, Civil Hospital Quarters, Sector 2",
    mediaUrl: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop"
  },
  { 
    label: "Dark Streetlight Ramp", 
    text: "Multiple streetlight poles dark along the curved flyover ramp on Ring Road.", 
    cat: "Streetlight & Power" as IssueCategory, 
    lat: 21.1820, 
    lng: 72.8390, 
    addr: "Ring Road Flyover Ramp, Sector 1",
    mediaUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop"
  },
  { 
    label: "Unrelated Garbage Dump", 
    text: "Pile of dry leaves and construction debris dumped near residential park bench.", 
    cat: "Garbage & Sanitation" as IssueCategory, 
    lat: 21.1910, 
    lng: 72.8550, 
    addr: "Shanti Park, Behind APMC Market, Sector 5",
    mediaUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop"
  }
];

export default function CitizenPortalPage() {
  const [activeTab, setActiveTab] = useState<"report" | "track">("report");

  // Form State
  const [description, setDescription] = useState(
    "Dangerous huge pothole near St. Xavier's school gate causing vehicle damage and traffic hazards."
  );
  const [category, setCategory] = useState<IssueCategory>("Road Hazard");
  const [address, setAddress] = useState("Opp. St. Xavier's Model High School, Sector 3, North Corridor Zone");
  const [latitude, setLatitude] = useState(21.1702);
  const [longitude, setLongitude] = useState(72.8311);
  const [mediaUrl, setMediaUrl] = useState("https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop");
  const [userName, setUserName] = useState("Aarav Sharma");
  const [userPhone, setUserPhone] = useState("+91 98765 43210");
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Real-Time Correlation Preview State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasSearchedPreview, setHasSearchedPreview] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState<PreviewCandidate | null>(null);
  const [previewSuggestedCategory, setPreviewSuggestedCategory] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    report: CitizenReport;
    incident?: Incident;
    connectedIncidentId?: string;
    isNewIncident?: boolean;
    matchReasons?: string[];
    historicalResponseActive?: boolean;
  } | null>(null);

  // Community Reports List
  const [myReports, setMyReports] = useState<CitizenReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Debounce & AbortController Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isMyReportsView, setIsMyReportsView] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const citizenRes = await fetch("/api/citizen/reports");
      if (citizenRes.ok) {
        const citizenData = await citizenRes.json();
        if (citizenData.success && Array.isArray(citizenData.data) && citizenData.data.length > 0) {
          setMyReports(citizenData.data);
          setIsMyReportsView(true);
          return;
        }
      }

      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.success) {
        setMyReports(data.data || []);
        setIsMyReportsView(false);
      }
    } catch (e) {
      console.error("Error fetching reports:", e);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Debounced Correlation Preview
  const runPreviewCorrelation = useCallback(
    async (textDesc: string, catVal: IssueCategory, latVal: number, lngVal: number) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (textDesc.trim().length < 8) {
        setPreviewCandidate(null);
        setPreviewSuggestedCategory(null);
        setHasSearchedPreview(false);
        setIsAnalyzing(false);
        return;
      }

      setIsAnalyzing(true);
      try {
        const res = await fetch("/api/reports/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            description: textDesc,
            category: catVal,
            latitude: latVal,
            longitude: lngVal,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setHasSearchedPreview(true);
          setPreviewCandidate(data.candidate || data.data?.matchedIncident || null);
          setPreviewSuggestedCategory(data.extractedCategory || data.data?.suggestedCategory || null);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Preview correlation error:", err);
        }
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  // Trigger preview on input changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      runPreviewCorrelation(description, category, latitude, longitude);
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [description, category, latitude, longitude, runPreviewCorrelation]);

  // Autofill scenario handler
  const handleSelectScenario = (sc: typeof QUICK_SCENARIOS[0]) => {
    setDescription(sc.text);
    setCategory(sc.cat);
    setLatitude(sc.lat);
    setLongitude(sc.lng);
    setAddress(sc.addr);
    if (sc.mediaUrl) setMediaUrl(sc.mediaUrl);
  };

  // Submit Handler
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !address.trim()) {
      setSubmitError("Please provide both an issue description and location.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          category,
          address,
          latitude,
          longitude,
          mediaUrl: mediaUrl || undefined,
          userName: userName || "Anonymous Citizen",
          userPhone: userPhone || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmissionSuccess({
          report: data.data.report,
          incident: data.data.incident,
          connectedIncidentId: data.data.connectedIncidentId || data.data.report.incidentId,
          isNewIncident: data.data.isNewIncident,
          matchReasons: data.data.matchReasons,
          historicalResponseActive: data.data.historicalResponseActive,
        });
        await fetchReports();
      } else {
        setSubmitError(data.error || "Failed to submit report. Please try again.");
      }
    } catch (e: any) {
      console.error("Submission error:", e);
      setSubmitError("Network connection error. Please check connectivity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070C18] font-sans text-slate-100 antialiased selection:bg-sky-500 selection:text-white pb-16">
      
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION WITH SPATIAL NETWORK BEACON (Compact & Dignified)       */}
      {/* ========================================================================= */}
      <section className="relative pt-8 pb-6 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-[#0B132B]/60 to-[#070C18]">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[250px] bg-sky-600/10 blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Left: Titles */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-sky-400 font-mono text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>PUBLIC CIVIC INTELLIGENCE PORTAL</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Report a Civic Problem
            </h1>
            
            <p className="text-sm text-slate-300 font-sans max-w-xl leading-relaxed">
              Help us build smarter, safer and cleaner communities. Your observation powers real action.
            </p>
          </div>

          {/* Right: Circular Spatial Network Beacon (OBSERVE -> REPORT -> RESOLVE) */}
          <div className="hidden lg:flex items-center gap-6 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            
            {/* Observe Node */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="font-bold">OBSERVE</span>
            </div>
            
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

            {/* Report Beacon */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/50 text-xs font-mono text-white font-bold shadow-lg shadow-blue-950/50">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>REPORT</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

            {/* Resolve Node */}
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-bold">RESOLVE</span>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE (Left 65% Form, Right 35% Live Intelligence)             */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* If successfully submitted, render receipt */}
        {submissionSuccess ? (
          <SubmissionReceipt
            report={submissionSuccess.report}
            incident={submissionSuccess.incident}
            connectedIncidentId={submissionSuccess.connectedIncidentId}
            isNewIncident={submissionSuccess.isNewIncident}
            matchReasons={submissionSuccess.matchReasons}
            historicalResponseActive={submissionSuccess.historicalResponseActive}
            onReset={() => {
              setSubmissionSuccess(null);
              setDescription("");
              setMediaUrl("");
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* =================================================================== */}
            {/* LEFT COLUMN: CITIZEN REPORT PROGRESSIVE WORKSPACE (7 or 8 Cols)     */}
            {/* =================================================================== */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* STAGE 1: QUICK TEST SCENARIOS */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center text-[11px] font-bold">1</span>
                    <span>Quick Test Scenarios</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
                    Click a scenario to pre-fill the form
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
                  {QUICK_SCENARIOS.map((sc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectScenario(sc)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/60 text-slate-300 hover:text-white font-sans text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{sc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* STAGE 2: ISSUE CATEGORY */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center text-[11px] font-bold">2</span>
                    <span>Issue Category</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
                    Select the category that best describes the issue
                  </span>
                </div>

                <IssueCategorySelector
                  selectedCategory={category}
                  onSelectCategory={setCategory}
                  suggestedCategory={previewSuggestedCategory}
                />
              </div>

              {/* STAGE 3: WHAT DID YOU NOTICE? */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center text-[11px] font-bold">3</span>
                    <span>What did you notice?</span>
                    <span className="text-red-400">*</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {description.length}/500
                  </span>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a clear description of the issue... (e.g. Deep pothole causing near misses outside school entrance)."
                    className="w-full p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all font-sans leading-relaxed resize-none"
                  />
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Be as specific as possible. Our AI correlation engine will connect your report with related community signals.</span>
                  </div>
                </div>
              </div>

              {/* STAGE 4: LOCATION & SECTOR */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
                <LocationCapturePanel
                  address={address}
                  onAddressChange={setAddress}
                  latitude={latitude}
                  longitude={longitude}
                  onCoordinatesChange={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />
              </div>

              {/* STAGE 5: PHOTO EVIDENCE */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
                <EvidenceCapturePanel
                  mediaUrl={mediaUrl}
                  onMediaUrlChange={setMediaUrl}
                />
              </div>

              {/* STAGE 6: YOUR DETAILS */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4 font-sans">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center text-[11px] font-bold">6</span>
                  <span>Your Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                      Your Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                      Contact Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-xs text-slate-400 leading-snug">
                    I agree to the CIVICPULSE <span className="text-sky-400 hover:underline">Trust &amp; Privacy Notice</span>
                  </span>
                </label>

                {/* Error Banner */}
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Primary Submission CTA */}
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  disabled={isSubmitting || !agreedTerms}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-black text-sm flex flex-col items-center justify-center gap-0.5 shadow-xl shadow-indigo-500/25 transition-all font-sans disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Send className={`w-4 h-4 ${isSubmitting ? "animate-spin" : ""}`} />
                    <span>{isSubmitting ? "Transmitting Signal..." : "Transmit Civic Observation"}</span>
                  </div>
                  <span className="text-[11px] font-normal text-sky-200">
                    Your report will be analyzed and routed to the right team.
                  </span>
                </button>

              </div>

            </div>

            {/* =================================================================== */}
            {/* RIGHT COLUMN: LIVE CIVIC INTELLIGENCE SIDEBAR (4 or 5 Cols)         */}
            {/* =================================================================== */}
            <div className="lg:col-span-5 sticky top-20">
              {activeTab === "report" ? (
                <ReportIntelligencePreview
                  isAnalyzing={isAnalyzing}
                  hasSearched={hasSearchedPreview}
                  candidate={previewCandidate}
                  suggestedCategory={previewSuggestedCategory}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  communitySignalsCount={myReports.length || 5}
                />
              ) : (
                <div className="space-y-4">
                  <div className="p-1 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-1 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab("report")}
                      className="flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 text-slate-400 hover:text-white"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-400" />
                      <span>Report Issue</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("track")}
                      className="flex-1 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-slate-800 text-white border border-slate-700 shadow-sm"
                    >
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      <span>{isMyReportsView ? "My Reports" : "Community Signals"} ({myReports.length})</span>
                    </button>
                  </div>

                  <CitizenReportTracker
                    reports={myReports}
                    isLoading={isLoadingReports}
                  />
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 3. FOOTER MICRO-BAR (Every signal you send makes your city smarter...)     */}
      {/* ========================================================================= */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-slate-800/80 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-sans">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-400" />
          <span>Every signal you send makes your city smarter. Thank you for being a responsible civic partner.</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
          <span>Need help? <span className="text-sky-400 hover:underline cursor-pointer">Contact Support</span></span>
        </div>
      </footer>

    </div>
  );
}

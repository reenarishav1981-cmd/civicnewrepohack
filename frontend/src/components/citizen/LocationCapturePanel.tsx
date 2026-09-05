"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Crosshair, CheckCircle2, Compass, ExternalLink } from "lucide-react";

interface LocationCapturePanelProps {
  address: string;
  onAddressChange: (address: string) => void;
  latitude: number;
  longitude: number;
  onCoordinatesChange: (lat: number, lng: number, label?: string) => void;
  className?: string;
}

const PRESET_SECTORS = [
  { label: "Sector 3 (Near St. Xavier's)", addr: "Opp. St. Xavier's Model High School, Sector 3", lat: 21.1702, lng: 72.8311 },
  { label: "Sector 2 (Civil Hospital)", addr: "Lane 4, Civil Hospital Quarters, Sector 2", lat: 21.1755, lng: 72.8250 },
  { label: "Sector 1 (Ring Road Flyover)", addr: "Ring Road Flyover Ramp, Sector 1", lat: 21.1820, lng: 72.8390 },
  { label: "Sector 5 (APMC Market)", addr: "Behind APMC Market, Hazira Link Road", lat: 21.1640, lng: 72.8450 },
];

export function LocationCapturePanel({
  address,
  onAddressChange,
  latitude,
  longitude,
  onCoordinatesChange,
  className = "",
}: LocationCapturePanelProps) {
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [locationSource, setLocationSource] = useState<"preset" | "gps" | "manual">("preset");
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingGPS(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        onCoordinatesChange(lat, lng, "Detected Live Location");
        onAddressChange(`Current GPS Location (${lat}° N, ${lng}° E), Sector 3`);
        setLocationSource("gps");
        setIsDetectingGPS(false);
      },
      (err) => {
        console.warn("GPS detection warning:", err);
        setGpsError("Location permission denied. You can select a sector preset below.");
        setIsDetectingGPS(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`space-y-3 font-sans ${className}`} aria-label="Location capture">
      
      {/* Top Header Label with Use Current Location link */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
          <span>Location &amp; Sector</span>
          <span className="text-red-400">*</span>
        </label>
        
        <button
          type="button"
          onClick={handleDetectGPS}
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Use Current Location</span>
        </button>
      </div>

      {/* Main Location Input with Inset GPS Button */}
      <div className="relative">
        <div className="absolute left-3.5 top-3.5 text-sky-400">
          <MapPin className="w-4 h-4" />
        </div>
        
        <input
          type="text"
          value={address}
          onChange={(e) => {
            onAddressChange(e.target.value);
            setLocationSource("manual");
          }}
          placeholder="Enter address, landmark, or street name..."
          className="w-full pl-10 pr-28 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 min-h-[48px] font-sans"
        />
        
        {/* GPS Button inside Input */}
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isDetectingGPS}
          className="absolute right-2 top-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-sky-400 font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isDetectingGPS ? "animate-spin" : ""}`} />
          <span>{isDetectingGPS ? "Locating..." : "Use GPS"}</span>
        </button>
      </div>

      {/* GPS Error Alert */}
      {gpsError && (
        <div className="text-[11px] text-amber-400 font-mono">
          {gpsError}
        </div>
      )}

      {/* Sector Preset Selection */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider">
          <span>Select Nearest Sector (or confirm above location)</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESET_SECTORS.map((sec, idx) => {
            const isSelected = address.includes(sec.label.split(" ")[0]);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onAddressChange(sec.addr);
                  onCoordinatesChange(sec.lat, sec.lng, sec.label);
                  setLocationSource("preset");
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-sans transition-all ${
                  isSelected
                    ? "bg-slate-800 border-sky-500 text-sky-400 font-bold shadow-sm"
                    : "bg-slate-900/40 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                }`}
              >
                {sec.label}
              </button>
            );
          })}
        </div>

        <div className="text-right pt-0.5">
          <span className="text-[11px] text-slate-400 font-sans">
            Can&apos;t find your sector?{" "}
            <span className="text-sky-400 hover:underline cursor-pointer">
              Reference Map &#128506;
            </span>
          </span>
        </div>
      </div>

    </div>
  );
}

export default LocationCapturePanel;

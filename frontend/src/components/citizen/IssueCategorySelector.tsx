"use client";

import React from "react";
import { IssueCategory } from "@/types";
import { 
  AlertTriangle, 
  Droplets, 
  Waves, 
  Trash2, 
  Zap, 
  ShieldAlert, 
  Building2,
  Check
} from "lucide-react";

interface IssueCategorySelectorProps {
  selectedCategory: IssueCategory;
  onSelectCategory: (cat: IssueCategory) => void;
  suggestedCategory?: string | null;
  className?: string;
}

export const CATEGORIES: { 
  id: IssueCategory; 
  label: string; 
  icon: React.FC<{ className?: string }>;
  iconColor: string;
}[] = [
  { id: "Road Hazard", label: "Road Hazard & Potholes", icon: AlertTriangle, iconColor: "text-sky-400" },
  { id: "Water Leakage", label: "Water Pipeline & Leaks", icon: Droplets, iconColor: "text-blue-400" },
  { id: "Drainage & Sewage", label: "Drainage & Overflow", icon: Waves, iconColor: "text-cyan-400" },
  { id: "Garbage & Sanitation", label: "Garbage & Solid Waste", icon: Trash2, iconColor: "text-emerald-400" },
  { id: "Streetlight & Power", label: "Streetlight & Darkness", icon: Zap, iconColor: "text-amber-400" },
  { id: "Public Safety", label: "Public Safety & Hazards", icon: ShieldAlert, iconColor: "text-purple-400" },
  { id: "Infrastructure", label: "Public Infrastructure", icon: Building2, iconColor: "text-indigo-400" },
];

export function IssueCategorySelector({
  selectedCategory,
  onSelectCategory,
  suggestedCategory,
  className = "",
}: IssueCategorySelectorProps) {
  return (
    <div className={`space-y-3 font-sans ${className}`} aria-label="Select issue category">
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {CATEGORIES.map((item) => {
          const isSelected = selectedCategory === item.id;
          const isSuggested = suggestedCategory === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCategory(item.id)}
              className={`relative p-3.5 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-2 group min-h-[90px] ${
                isSelected
                  ? "bg-slate-900/90 border-sky-500 text-white ring-1 ring-sky-500/50 shadow-lg shadow-sky-950/40"
                  : isSuggested
                  ? "bg-slate-900/60 border-sky-500/40 text-slate-200 hover:border-sky-500 hover:text-white"
                  : "bg-slate-900/40 border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-900/60"
              }`}
            >
              {/* Selected Checkmark Badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-slate-950 shadow-sm">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}

              {/* Icon Container */}
              <div
                className={`p-2 rounded-xl transition-colors ${
                  isSelected
                    ? "bg-sky-500/20 text-sky-400"
                    : "bg-slate-800/60 text-slate-400 group-hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? "text-sky-400" : item.iconColor}`} />
              </div>

              {/* Label */}
              <div className="text-xs font-bold leading-tight">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default IssueCategorySelector;

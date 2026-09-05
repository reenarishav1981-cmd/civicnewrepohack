import React from "react";

interface PulseLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const PulseLogo: React.FC<PulseLogoProps> = ({ size = "md", showText = true }) => {
  const dim = size === "sm" ? 22 : size === "lg" ? 36 : 28;

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex items-center justify-center">
        {/* Ambient background ring */}
        <span 
          className="absolute rounded-full bg-civic-cyan/20 animate-ping"
          style={{ width: dim * 1.5, height: dim * 1.5 }}
        />
        {/* Core Node */}
        <svg 
          width={dim} 
          height={dim} 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Outer Pulse Ring */}
          <circle cx="16" cy="16" r="14" stroke="#00F0FF" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />
          {/* Connecting Vectors */}
          <line x1="16" y1="4" x2="16" y2="12" stroke="#0066FF" strokeWidth="1.5" />
          <line x1="16" y1="20" x2="16" y2="28" stroke="#0066FF" strokeWidth="1.5" />
          <line x1="4" y1="16" x2="12" y2="16" stroke="#0066FF" strokeWidth="1.5" />
          <line x1="20" y1="16" x2="28" y2="16" stroke="#0066FF" strokeWidth="1.5" />
          {/* Central Pulse Sphere */}
          <circle cx="16" cy="16" r="6" fill="url(#pulseGrad)" />
          <circle cx="16" cy="16" r="2.5" fill="#FFFFFF" />
          
          <defs>
            <radialGradient id="pulseGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16 16) scale(6)">
              <stop stopColor="#00F0FF" />
              <stop offset="0.7" stopColor="#0066FF" />
              <stop offset="1" stopColor="#003399" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base md:text-lg">
            Civic<span className="text-civic-cyan font-semibold">Pulse</span>
            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-civic-blue/20 text-civic-cyan border border-civic-cyan/30 font-mono">
              AI-OPS
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

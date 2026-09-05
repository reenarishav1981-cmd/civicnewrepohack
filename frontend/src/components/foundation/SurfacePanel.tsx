import React from "react";

export type SurfaceLevel = "canvas" | "quiet" | "interactive" | "focal";

interface SurfacePanelProps extends React.HTMLAttributes<HTMLElement> {
  level?: SurfaceLevel;
  as?: any;
  children: React.ReactNode;
  className?: string;
}

export function SurfacePanel({
  level = "quiet",
  as: Component = "div",
  children,
  className = "",
  ...props
}: SurfacePanelProps) {
  let surfaceClass = "surface-quiet";

  switch (level) {
    case "canvas":
      surfaceClass = "surface-canvas";
      break;
    case "quiet":
      surfaceClass = "surface-quiet";
      break;
    case "interactive":
      surfaceClass = "surface-interactive cursor-pointer";
      break;
    case "focal":
      surfaceClass = "surface-focal";
      break;
  }

  return (
    <Component className={`${surfaceClass} ${className}`} {...props}>
      {children}
    </Component>
  );
}

export default SurfacePanel;

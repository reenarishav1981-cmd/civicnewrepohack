import React from "react";

interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: "default" | "full" | "narrow" | "screen-xl" | "screen-2xl";
}

export function AppShell({
  children,
  header,
  footer,
  className = "",
  maxWidth = "default",
}: AppShellProps) {
  let maxWidthClass = "max-w-7xl mx-auto";

  switch (maxWidth) {
    case "full":
      maxWidthClass = "w-full";
      break;
    case "narrow":
      maxWidthClass = "max-w-4xl mx-auto";
      break;
    case "screen-xl":
      maxWidthClass = "max-w-screen-xl mx-auto";
      break;
    case "screen-2xl":
      maxWidthClass = "max-w-screen-2xl mx-auto";
      break;
    case "default":
    default:
      maxWidthClass = "max-w-7xl mx-auto";
      break;
  }

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col font-sans selection:bg-civic-blue selection:text-white antialiased">
      {/* Accessibility: Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-civic-blue text-white rounded-md text-xs font-bold"
      >
        Skip to main content
      </a>

      {header && <header className="sticky top-0 z-40 w-full">{header}</header>}

      <main id="main-content" className={`flex-1 flex flex-col w-full ${maxWidthClass} ${className}`}>
        {children}
      </main>

      {footer && <footer className="w-full mt-auto">{footer}</footer>}
    </div>
  );
}

export default AppShell;

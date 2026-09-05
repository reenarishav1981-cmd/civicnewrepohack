import React from "react";
import { Sparkles } from "lucide-react";

export type ButtonVariant = 
  | "primary" 
  | "secondary" 
  | "ghost" 
  | "critical" 
  | "danger" 
  | "intelligence";

export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    let variantClass = "btn-primary";
    switch (variant) {
      case "primary":
        variantClass = "btn-primary";
        break;
      case "secondary":
        variantClass = "btn-secondary";
        break;
      case "ghost":
        variantClass = "btn-ghost";
        break;
      case "critical":
      case "danger":
        variantClass = "btn-critical";
        break;
      case "intelligence":
        variantClass = "btn-intelligence";
        break;
    }

    let sizeClass = "px-4 py-2.5 text-xs";
    switch (size) {
      case "sm":
        sizeClass = "px-3 py-1.5 text-[11px]";
        break;
      case "md":
        sizeClass = "px-4 py-2.5 text-xs";
        break;
      case "lg":
        sizeClass = "px-6 py-3.5 text-sm font-bold";
        break;
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Sparkles className="w-3.5 h-3.5 animate-spin shrink-0 text-current" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

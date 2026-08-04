import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-white border border-transparent hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-surface-raised text-text-primary border border-border hover:border-text-muted/30 active:bg-surface-raised",
  ghost: "bg-transparent text-text-primary hover:bg-surface active:bg-border",
  danger: "bg-danger text-white border border-transparent hover:bg-danger/90 active:bg-danger",
  outline: "bg-transparent text-primary border border-primary/30 hover:bg-primary/5 hover:border-primary/50 active:bg-primary/10",
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] font-semibold gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex flex-shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-all duration-150 ease-out select-none",
          "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
          "shadow-[0_1px_2px_rgba(0,0,0,0.05)]", // Subtle apple-like shadow
          variant === "ghost" && "shadow-none",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

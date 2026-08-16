import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "link";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-paper hover:bg-accent-hover shadow-subtle",
  secondary: "bg-paper-soft text-ink hover:bg-border/60 border border-border",
  ghost: "text-ink-muted hover:text-ink hover:bg-paper-soft",
  outline: "border border-border text-ink hover:bg-paper-soft",
  danger: "bg-danger text-white hover:opacity-90 shadow-subtle",
  link: "text-accent hover:text-accent-hover underline-offset-4 hover:underline p-0 h-auto",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
  icon: "h-9 w-9 shrink-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "focus-ring inline-flex items-center justify-center whitespace-nowrap rounded-card font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
          VARIANT_CLASSES[variant],
          variant !== "link" && SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

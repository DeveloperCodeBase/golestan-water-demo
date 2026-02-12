import * as React from "react";

import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost" | "secondary";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
};

const variants: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground hover:opacity-90",
  outline: "border border-border bg-transparent hover:bg-muted",
  ghost: "hover:bg-muted",
  secondary: "bg-secondary text-secondary-foreground hover:opacity-90"
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-sm"
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

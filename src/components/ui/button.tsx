import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium transition duration-200 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

const variants = {
  primary: "bg-black text-white shadow-[0_16px_34px_rgba(0,0,0,0.22)] hover:-translate-y-0.5 hover:bg-zinc-900",
  secondary:
    "border border-black/10 bg-white/70 text-black backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white",
  ghost: "text-black hover:bg-black/5",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
  icon: "h-11 w-11",
};

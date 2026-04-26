import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "glass liquid-highlight relative overflow-hidden rounded-[28px]",
        className,
      )}
      {...props}
    />
  );
}

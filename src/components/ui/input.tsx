import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-black/10 bg-white/70 px-4 text-sm text-black shadow-inner shadow-white/40 backdrop-blur-xl transition placeholder:text-zinc-500 focus:border-black/30",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-black shadow-inner shadow-white/40 backdrop-blur-xl transition placeholder:text-zinc-500 focus:border-black/30",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-2xl border border-black/10 bg-white/70 px-4 text-sm text-black shadow-inner shadow-white/40 backdrop-blur-xl transition focus:border-black/30",
        className,
      )}
      {...props}
    />
  );
}

import Image from "next/image";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-black/10 bg-white text-black",
        className ?? "h-10 w-10",
      )}
      aria-label={name ?? "Usuario"}
    >
      {src ? (
        <Image src={src} alt={name ?? "Avatar"} fill className="object-cover" />
      ) : (
        <UserRound className="h-5 w-5" aria-hidden />
      )}
    </div>
  );
}

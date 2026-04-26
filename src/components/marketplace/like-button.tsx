"use client";

import { Heart } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn, formatCompact } from "@/lib/utils";

export function LikeButton({
  productId,
  initialCount,
  compact = false,
}: {
  productId: string;
  initialCount: number;
  compact?: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: like } = await supabase
        .from("likes")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", data.user.id)
        .maybeSingle();
      setLiked(Boolean(like));
    });
  }, [productId]);

  function toggleLike() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      toast.error("Configura Supabase para usar likes.");
      return;
    }

    startTransition(async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Inicia sesion para guardar favoritos.");
        return;
      }

      const nextLiked = !liked;
      setLiked(nextLiked);
      setCount((value) => value + (nextLiked ? 1 : -1));

      const result = nextLiked
        ? await supabase.from("likes").insert({
            product_id: productId,
            user_id: userData.user.id,
          })
        : await supabase
            .from("likes")
            .delete()
            .eq("product_id", productId)
            .eq("user_id", userData.user.id);

      if (result.error) {
        setLiked(liked);
        setCount((value) => value + (nextLiked ? -1 : 1));
        toast.error(result.error.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/78 px-3 py-2 text-xs font-medium text-black shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white",
        liked && "bg-black text-white",
      )}
      aria-pressed={liked}
      aria-label={liked ? "Quitar like" : "Dar like"}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} aria-hidden />
      {!compact && <span>{formatCompact(Math.max(count, 0))}</span>}
    </button>
  );
}

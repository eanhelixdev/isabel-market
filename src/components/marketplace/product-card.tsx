import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/marketplace/like-button";
import { formatMoney } from "@/lib/utils";
import type { ProductCard as ProductCardType } from "@/types/marketplace";

export function ProductCard({ product }: { product: ProductCardType }) {
  return (
    <article className="group relative overflow-hidden rounded-[30px] border border-white/70 bg-white/60 shadow-[0_18px_50px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_26px_70px_rgba(0,0,0,0.12)]">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full place-items-center text-zinc-400">
              Sin imagen
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent" />
          <div className="absolute left-3 top-3 flex gap-2">
            {product.category && <Badge>{product.category}</Badge>}
            {product.condition && <Badge>{product.condition}</Badge>}
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/products/${product.id}`}>
              <h3 className="line-clamp-2 text-lg font-semibold leading-tight tracking-normal text-black">
                {product.title}
              </h3>
            </Link>
            <p className="mt-1 text-xl font-semibold text-black">
              {formatMoney(product.price, product.currency)}
            </p>
          </div>
          <LikeButton productId={product.id} initialCount={product.likes_count} compact />
        </div>

        <div className="grid gap-2 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" aria-hidden />
            {product.year ? `Anio ${product.year}` : "Antiguedad estimada"}
          </span>
          {product.location && (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden />
              {product.location}
            </span>
          )}
        </div>

        <Link
          href={`/seller/${product.seller_id}`}
          className="flex items-center justify-between rounded-2xl border border-black/5 bg-black/[0.03] px-3 py-2 transition hover:bg-black/[0.06]"
        >
          <span className="flex items-center gap-2">
            <Avatar
              src={product.seller_avatar_url}
              name={product.seller_name}
              className="h-8 w-8"
            />
            <span className="text-sm font-medium text-black">
              {product.seller_name ?? "Vendedor"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {Math.round(product.seller_reputation_score)}
          </span>
        </Link>
      </div>
    </article>
  );
}

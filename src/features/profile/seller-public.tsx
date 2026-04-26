import { CalendarDays, Heart, PackageCheck, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ProductGrid } from "@/components/marketplace/product-grid";
import { GlassCard } from "@/components/ui/glass-card";
import type { ProductCard, SellerPublicProfile } from "@/types/marketplace";

export function SellerPublic({
  seller,
  products,
}: {
  seller: SellerPublicProfile;
  products: ProductCard[];
}) {
  return (
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar src={seller.avatar_url} name={seller.display_name} className="h-20 w-20" />
            <div>
              <h1 className="text-3xl font-semibold text-black">{seller.display_name}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                <CalendarDays className="h-4 w-4" aria-hidden />
                En Isabel Market desde {new Date(seller.created_at).getFullYear()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric icon={<Sparkles className="h-4 w-4" />} label="Score" value={Math.round(seller.reputation_score)} />
            <Metric icon={<PackageCheck className="h-4 w-4" />} label="Vendidos" value={seller.sold_products_count} />
            <Metric icon={<Heart className="h-4 w-4" />} label="Likes" value={seller.likes_received_count} />
          </div>
        </div>
      </GlassCard>
      <ProductGrid products={products} />
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-white/66 px-4 py-3">
      <span className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-black text-white">
        {icon}
      </span>
      <p className="text-lg font-semibold text-black">{value}</p>
      <p className="text-xs text-zinc-600">{label}</p>
    </div>
  );
}

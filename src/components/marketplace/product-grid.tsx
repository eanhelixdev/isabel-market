import { ProductCard } from "@/components/marketplace/product-card";
import { GlassCard } from "@/components/ui/glass-card";
import type { ProductCard as ProductCardType } from "@/types/marketplace";

export function ProductGrid({ products }: { products: ProductCardType[] }) {
  if (products.length === 0) {
    return (
      <GlassCard className="grid min-h-72 place-items-center p-10 text-center">
        <div>
          <p className="text-xl font-semibold text-black">No hay publicaciones aprobadas.</p>
          <p className="mt-2 text-sm text-zinc-600">
            Proba cambiar los filtros o publicar una nueva antiguedad para revision.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

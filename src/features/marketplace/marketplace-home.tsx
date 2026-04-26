import Link from "next/link";
import { ArrowRight, BadgeCheck, Gem, Plus } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ProductGrid } from "@/components/marketplace/product-grid";
import { LiquidScene } from "@/components/three/liquid-scene";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { MarketplaceFilters } from "@/features/marketplace/marketplace-filters";
import type { ProductCard } from "@/types/marketplace";

export function MarketplaceHome({ initialProducts }: { initialProducts: ProductCard[] }) {
  return (
    <PageShell>
      <section className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <LiquidScene />
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div className="pb-2 pt-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-medium text-zinc-700 backdrop-blur-xl">
              <Gem className="h-4 w-4 text-black" aria-hidden />
              Marketplace curado de antiguedades
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-normal text-black sm:text-6xl lg:text-7xl">
              Isabel Market
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-700 sm:text-lg">
              Compra y vende piezas con historia en una experiencia visual,
              rapida y moderada por administradores antes de publicarse.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/sell/new">
                <Button size="lg">
                  <Plus className="h-5 w-5" aria-hidden />
                  Publicar pieza
                </Button>
              </Link>
              <Link href="#feed">
                <Button size="lg" variant="secondary">
                  Explorar mercado
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Button>
              </Link>
            </div>
          </div>

          <GlassCard className="p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Aprobacion previa", "Solo productos revisados aparecen en el feed."],
                ["Pagos con split", "Comision fija del 10% registrada por orden."],
                ["Reputacion viva", "Ventas, likes y publicaciones aprobadas elevan el score."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-3xl bg-white/62 p-4">
                  <BadgeCheck className="mb-4 h-5 w-5 text-black" aria-hidden />
                  <p className="text-sm font-semibold text-black">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-600">{body}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      <section id="feed" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Publicaciones aprobadas</p>
            <h2 className="text-3xl font-semibold tracking-normal text-black">
              Descubrimiento visual
            </h2>
          </div>
          <p className="text-sm text-zinc-600">{initialProducts.length} piezas disponibles</p>
        </div>
        <div className="mb-6">
          <MarketplaceFilters />
        </div>
        <ProductGrid products={initialProducts} />
      </section>
    </PageShell>
  );
}

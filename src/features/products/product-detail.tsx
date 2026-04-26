"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Gem,
  MapPin,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/marketplace/like-button";
import { formatMoney } from "@/lib/utils";
import type { ProductDetail as ProductDetailType } from "@/types/marketplace";

export function ProductDetail({ product }: { product: ProductDetailType }) {
  const gallery = useMemo(
    () =>
      product.images.length
        ? product.images
        : product.image_url
          ? [
              {
                id: `${product.id}-primary`,
                image_url: product.image_url,
                sort_order: 0,
              },
            ]
          : [],
    [product.id, product.image_url, product.images],
  );
  const [selectedImageId, setSelectedImageId] = useState(gallery[0]?.id ?? "");
  const selectedImage =
    gallery.find((image) => image.id === selectedImageId) ?? gallery[0];
  const hero = selectedImage?.image_url ?? product.image_url;
  const thumbnails = selectedImage
    ? gallery.filter((image) => image.id !== selectedImage.id)
    : [];

  return (
    <article
      className="glass liquid-highlight relative mx-auto grid h-full max-w-[1500px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[30px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <header className="relative z-10 flex min-h-16 items-center justify-between gap-3 border-b border-black/10 bg-white/44 px-4 py-3 backdrop-blur-2xl sm:px-5">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap gap-2">
            {product.category && <Badge>{product.category}</Badge>}
            {product.condition && <Badge>{product.condition}</Badge>}
            <Badge className="bg-black text-white">{product.status}</Badge>
          </div>
          <p className="truncate text-sm font-medium text-zinc-600">
            Publicacion curada - {product.seller_name ?? "Vendedor"}
          </p>
        </div>
        <Link
          href="/"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/10 bg-white/76 text-black shadow-sm backdrop-blur-xl transition hover:bg-white"
          aria-label="Cerrar publicacion"
        >
          <X className="h-5 w-5" aria-hidden />
        </Link>
      </header>

      <div className="relative z-10 grid min-h-0 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-none lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)]">
        <section className="grid h-[34svh] min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3 border-b border-black/10 p-3 sm:h-[38svh] sm:p-4 lg:h-auto lg:border-b-0 lg:border-r lg:p-5">
          <div className="relative min-h-0 overflow-hidden rounded-[26px] border border-white/70 bg-white/58 shadow-[0_22px_70px_rgba(0,0,0,0.12)]">
            {hero ? (
              <>
                <Image
                  src={hero}
                  alt=""
                  fill
                  priority
                  className="scale-110 object-cover opacity-18 blur-2xl"
                  aria-hidden
                />
                <Image
                  src={hero}
                  alt={product.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-contain p-3 sm:p-5"
                />
              </>
            ) : (
              <div className="grid h-full place-items-center text-zinc-500">Sin imagen</div>
            )}
          </div>

          {thumbnails.length > 0 && (
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {thumbnails.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImageId(image.id)}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-white/64 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md focus-visible:ring-2 focus-visible:ring-black/45 sm:h-24 sm:w-24"
                  aria-label={`Ver imagen ${index + 1} de ${product.title}`}
                >
                  <Image
                    src={image.image_url}
                    alt={`${product.title} imagen ${index + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <InfoSection>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1
                  id="product-modal-title"
                  className="text-3xl font-semibold leading-tight tracking-normal text-black sm:text-4xl"
                >
                  {product.title}
                </h1>
                <p className="mt-3 text-3xl font-semibold text-black">
                  {formatMoney(product.price, product.currency)}
                </p>
              </div>
              <div className="hidden rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white sm:block">
                Score {Math.round(product.seller_reputation_score)}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/checkout/${product.id}`}>
                <Button>
                  <PackageCheck className="h-4 w-4" aria-hidden />
                  Comprar
                </Button>
              </Link>
              <LikeButton productId={product.id} initialCount={product.likes_count} />
            </div>
          </InfoSection>

          <InfoSection title="Datos de la pieza" icon={<Gem className="h-4 w-4" />}>
            <div className="grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              {product.year && (
                <Fact icon={<CalendarDays className="h-4 w-4" />} label="Anio" value={String(product.year)} />
              )}
              {product.location && (
                <Fact icon={<MapPin className="h-4 w-4" />} label="Ubicacion" value={product.location} />
              )}
              {product.dimensions && (
                <Fact icon={<Ruler className="h-4 w-4" />} label="Medidas" value={product.dimensions} />
              )}
              {product.material && (
                <Fact icon={<Sparkles className="h-4 w-4" />} label="Material" value={product.material} />
              )}
            </div>
          </InfoSection>

          <InfoSection title="Descripcion" scroll>
            <p className="whitespace-pre-line text-sm leading-7 text-zinc-700">
              {product.description}
            </p>
          </InfoSection>

          {product.origin_story && (
            <InfoSection title="Historia de la pieza" scroll>
              <p className="whitespace-pre-line text-sm leading-7 text-zinc-700">
                {product.origin_story}
              </p>
            </InfoSection>
          )}

          <InfoSection title="Vendedor">
            <Link
              href={`/seller/${product.seller_id}`}
              className="flex items-center justify-between rounded-3xl border border-black/10 bg-white/64 p-4 transition hover:bg-white"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Avatar
                  src={product.seller_avatar_url}
                  name={product.seller_name}
                  className="h-12 w-12"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-black">
                    {product.seller_name ?? "Vendedor"}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-zinc-600">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Perfil publico
                  </span>
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {Math.round(product.seller_reputation_score)}
              </span>
            </Link>
          </InfoSection>
        </aside>
      </div>
    </article>
  );
}

function InfoSection({
  children,
  title,
  icon,
  scroll = false,
}: {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  scroll?: boolean;
}) {
  return (
    <section className="border-b border-black/10 py-5 last:border-b-0">
      {title && (
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-black">
          {icon}
          {title}
        </h2>
      )}
      <div
        className={
          scroll
            ? "max-h-[30svh] overflow-y-auto rounded-3xl border border-black/5 bg-white/48 p-4"
            : ""
        }
      >
        {children}
      </div>
    </section>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/54 p-3">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-normal text-zinc-500">
        {icon}
        {label}
      </span>
      <span className="mt-1 block text-sm font-medium text-black">{value}</span>
    </div>
  );
}

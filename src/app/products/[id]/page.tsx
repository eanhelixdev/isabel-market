import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { ProductDetail } from "@/features/products/product-detail";
import { getProductDetail } from "@/lib/marketplace-data";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const product = await getProductDetail(id);
  return {
    title: product?.title ?? "Producto",
  };
}

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const product = await getProductDetail(id);
  if (!product) notFound();

  return (
    <PageShell>
      <section className="h-[calc(100svh-4rem)] overflow-hidden px-3 py-3 sm:px-5 sm:py-4 lg:px-8">
        <ProductDetail product={product} />
      </section>
    </PageShell>
  );
}

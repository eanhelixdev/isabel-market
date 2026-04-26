import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { SellerPublic } from "@/features/profile/seller-public";
import { getSellerProducts, getSellerPublicProfile } from "@/lib/marketplace-data";

export default async function SellerPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [seller, products] = await Promise.all([
    getSellerPublicProfile(id),
    getSellerProducts(id),
  ]);

  if (!seller) notFound();

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SellerPublic seller={seller} products={products} />
      </section>
    </PageShell>
  );
}

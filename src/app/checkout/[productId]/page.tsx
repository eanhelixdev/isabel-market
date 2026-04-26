import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { CheckoutPanel } from "@/features/checkout/checkout-panel";
import { getProductDetail } from "@/lib/marketplace-data";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Checkout",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage(props: { params: Promise<{ productId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  const profile = await getCurrentProfile();
  if (!profile?.onboarding_completed) redirect("/onboarding");

  const { productId } = await props.params;
  const product = await getProductDetail(productId);
  if (!product) redirect("/");

  return (
    <PageShell>
      <section className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-10">
        <CheckoutPanel product={product} />
      </section>
    </PageShell>
  );
}

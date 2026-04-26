import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { ProductForm } from "@/features/products/product-form";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Publicar",
};

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  const profile = await getCurrentProfile();
  if (!profile?.onboarding_completed) redirect("/onboarding");

  return (
    <PageShell>
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <ProductForm />
      </section>
    </PageShell>
  );
}

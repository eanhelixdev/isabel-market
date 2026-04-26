import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { ProfilePanel } from "@/features/profile/profile-panel";
import { createServerSupabaseClient, getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import type { ProductCard } from "@/types/marketplace";

export const metadata = {
  title: "Mi perfil",
};

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const profile = await getCurrentProfile();
  if (!profile?.onboarding_completed) redirect("/onboarding");

  const supabase = await createServerSupabaseClient();
  const { data } = supabase
    ? await supabase
        .from("products")
        .select("id,seller_id,title,description,year,price,currency,status,category,condition,location,approved_at,created_at")
        .eq("seller_id", profile.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const products = (data ?? []).map((product) => ({
    ...product,
    image_url: null,
    likes_count: 0,
    seller_name: profile.display_name,
    seller_avatar_url: profile.avatar_url,
    seller_reputation_score: profile.reputation_score,
  })) as ProductCard[];

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfilePanel profile={profile} products={products} />
      </section>
    </PageShell>
  );
}

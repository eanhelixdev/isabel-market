import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { AdminDashboard } from "@/features/admin/admin-dashboard";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

type AdminPendingProduct = {
  id: string;
  title: string;
  description: string;
  year: number | null;
  price: number;
  currency: string;
  seller_id: string;
  created_at: string;
  product_images?: Array<{
    id: string;
    image_url: string;
    sort_order: number;
  }>;
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") redirect("/");

  const admin = createAdminSupabaseClient();

  const [pendingProducts, users, pending, orders, commissions] = admin
    ? await Promise.all([
        admin
          .from("products")
          .select("id,title,description,year,price,currency,seller_id,created_at,product_images(id,image_url,sort_order)")
          .eq("status", "pending_review")
          .order("created_at", { ascending: true }),
        admin.from("profiles").select("id", { count: "exact", head: true }),
        admin.from("products").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
        admin.from("orders").select("id", { count: "exact", head: true }),
        admin.from("orders").select("commission_amount").eq("status", "paid"),
      ])
    : [
        { data: [] },
        { count: 0 },
        { count: 0 },
        { count: 0 },
        { data: [] },
      ];

  const commissionTotal =
    commissions.data?.reduce(
      (sum: number, row: { commission_amount: number }) => sum + Number(row.commission_amount),
      0,
    ) ?? 0;

  const signedPending = await Promise.all(
    ((pendingProducts.data ?? []) as AdminPendingProduct[]).map(async (product) => {
      const firstImage = product.product_images?.sort(
        (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
      )?.[0]?.image_url;
      if (!firstImage || firstImage.startsWith("http") || !admin) {
        return { ...product, image_url: firstImage ?? null };
      }
      const { data } = await admin.storage
        .from("product-images-private")
        .createSignedUrl(firstImage, 60 * 20);
      return { ...product, image_url: data?.signedUrl ?? null };
    }),
  );

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminDashboard
          pendingProducts={signedPending}
          metrics={{
            users: users.count ?? 0,
            pending: pending.count ?? 0,
            orders: orders.count ?? 0,
            commissions: commissionTotal,
          }}
        />
      </section>
    </PageShell>
  );
}

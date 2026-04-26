"use client";

import { Check, EyeOff, ShieldCheck, Users, Wallet, X } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { formatMoney } from "@/lib/utils";

type PendingProduct = {
  id: string;
  title: string;
  description: string;
  year: number | null;
  price: number;
  currency: string;
  seller_id: string;
  created_at: string;
  image_url?: string | null;
};

type Metrics = {
  users: number;
  pending: number;
  orders: number;
  commissions: number;
};

export function AdminDashboard({
  pendingProducts,
  metrics,
}: {
  pendingProducts: PendingProduct[];
  metrics: Metrics;
}) {
  const [items, setItems] = useState(pendingProducts);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function moderate(productId: string, action: "approve" | "reject" | "archive") {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      toast.error("Configura Supabase para moderar.");
      return;
    }

    startTransition(async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = userData.user
        ? await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", userData.user.id)
            .maybeSingle()
        : { data: null };

      const nextStatus =
        action === "approve" ? "approved" : action === "reject" ? "rejected" : "archived";

      const { error } = await supabase
        .from("products")
        .update({
          status: nextStatus,
          rejection_reason: action === "reject" ? reason : null,
          approved_at: action === "approve" ? new Date().toISOString() : null,
          approved_by: action === "approve" ? profile?.id : null,
        })
        .eq("id", productId);

      if (error) {
        toast.error(error.message);
        return;
      }

      await supabase.from("admin_actions").insert({
        admin_id: profile?.id,
        action_type: action,
        target_type: "product",
        target_id: productId,
        reason: action === "reject" ? reason : null,
      });

      setItems((current) => current.filter((item) => item.id !== productId));
      toast.success("Accion aplicada.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Usuarios" value={metrics.users} icon={<Users className="h-5 w-5" />} />
        <Metric title="Pendientes" value={metrics.pending} icon={<ShieldCheck className="h-5 w-5" />} />
        <Metric title="Ordenes" value={metrics.orders} icon={<Wallet className="h-5 w-5" />} />
        <Metric
          title="Comisiones"
          value={formatMoney(metrics.commissions)}
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      <GlassCard className="p-5 sm:p-7">
        <div className="mb-5">
          <h1 className="text-3xl font-semibold text-black">Panel administrador</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Revision de publicaciones, usuarios, ordenes y comisiones.
          </p>
        </div>

        <div className="mb-4">
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motivo para rechazar o solicitar cambios"
          />
        </div>

        <div className="grid gap-3">
          {items.length === 0 ? (
            <div className="rounded-3xl bg-white/60 p-6 text-sm text-zinc-600">
              No hay publicaciones pendientes.
            </div>
          ) : (
            items.map((product) => (
              <div key={product.id} className="rounded-3xl bg-white/64 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-black">{product.title}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">
                        {product.description}
                      </p>
                      <p className="mt-2 text-sm font-medium text-black">
                        {product.year ?? "Sin anio"} · {formatMoney(product.price, product.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={isPending} onClick={() => moderate(product.id, "approve")}>
                      <Check className="h-4 w-4" aria-hidden />
                      Aprobar
                    </Button>
                    <Button
                      disabled={isPending || !reason.trim()}
                      variant="secondary"
                      onClick={() => moderate(product.id, "reject")}
                    >
                      <X className="h-4 w-4" aria-hidden />
                      Rechazar
                    </Button>
                    <Button disabled={isPending} variant="ghost" onClick={() => moderate(product.id, "archive")}>
                      <EyeOff className="h-4 w-4" aria-hidden />
                      Ocultar
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <GlassCard className="p-5">
      <div className="mb-5 grid h-10 w-10 place-items-center rounded-full bg-black text-white">
        {icon}
      </div>
      <p className="text-sm text-zinc-600">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-black">{value}</p>
    </GlassCard>
  );
}

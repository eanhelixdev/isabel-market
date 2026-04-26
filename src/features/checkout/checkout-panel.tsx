"use client";

import { CreditCard, ShieldCheck } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { formatMoney } from "@/lib/utils";
import type { ProductDetail } from "@/types/marketplace";

export function CheckoutPanel({ product }: { product: ProductDetail }) {
  const [isPending, startTransition] = useTransition();

  function startCheckout() {
    startTransition(async () => {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload.error ?? "No se pudo iniciar el pago.");
        return;
      }

      window.location.href = payload.initPoint;
    });
  }

  return (
    <GlassCard className="mx-auto max-w-2xl p-5 sm:p-7">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-black text-white">
        <CreditCard className="h-5 w-5" aria-hidden />
      </div>
      <h1 className="text-3xl font-semibold text-black">Checkout</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        La confirmacion real se hace por webhook seguro. El frontend nunca marca
        una orden como pagada.
      </p>

      <div className="mt-6 rounded-3xl bg-white/66 p-4">
        <p className="text-sm font-semibold text-black">{product.title}</p>
        <p className="mt-2 text-3xl font-semibold text-black">
          {formatMoney(product.price, product.currency)}
        </p>
        <p className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Comision marketplace 10% registrada en la orden.
        </p>
      </div>

      <Button onClick={startCheckout} disabled={isPending} className="mt-6 w-full">
        {isPending ? "Creando preferencia..." : "Pagar con Mercado Pago"}
      </Button>
    </GlassCard>
  );
}

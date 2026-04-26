import { corsHeaders, json } from "../_shared/cors.ts";
import { verifyMercadoPagoSignature } from "../_shared/mp.ts";
import { adminClient } from "../_shared/supabase.ts";
import { decryptSecret } from "../_shared/secrets.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const paymentId = url.searchParams.get("data.id") ?? body?.data?.id ?? body?.id;
  const orderId = url.searchParams.get("order_id");
  const admin = adminClient();

  const signatureOk = await verifyMercadoPagoSignature(req, paymentId ? String(paymentId) : null);
  if (!signatureOk) return json({ error: "Invalid signature" }, { status: 401 });

  const eventId = `${body?.type ?? "payment"}:${paymentId}:${body?.action ?? "unknown"}`;
  const inserted = await admin
    .from("webhook_events")
    .insert({
      provider: "mercadopago",
      provider_event_id: eventId,
      payload: body,
      status: "received",
    })
    .select("id")
    .single();

  if (inserted.error?.code === "23505") return json({ ok: true, duplicate: true });

  if (!orderId) return json({ ok: true, ignored: true });

  const { data: order } = await admin
    .from("orders")
    .select("id,seller_id,product_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return json({ ok: true, ignored: true });

  const { data: account } = await admin
    .from("seller_payment_accounts")
    .select("access_token_encrypted")
    .eq("seller_id", order.seller_id)
    .eq("provider", "mercadopago")
    .maybeSingle();
  if (!account || !paymentId) return json({ ok: true, ignored: true });

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${await decryptSecret(account.access_token_encrypted)}`,
    },
  });
  if (!paymentResponse.ok) return json({ ok: true, ignored: true });
  const payment = await paymentResponse.json();

  if (payment.status === "approved") {
    await admin.rpc("confirm_paid_order", {
      p_order_id: order.id,
      p_payment_id: String(payment.id),
      p_status_detail: payment.status_detail,
    });
  } else {
    await admin
      .from("orders")
      .update({
        status: payment.status === "rejected" ? "failed" : "payment_created",
        payment_id: String(payment.id),
        payment_status_detail: payment.status_detail,
      })
      .eq("id", order.id);
  }

  await admin
    .from("webhook_events")
    .update({ status: "processed", processed_at: new Date().toISOString() })
    .eq("provider", "mercadopago")
    .eq("provider_event_id", eventId);

  return json({ ok: true });
});

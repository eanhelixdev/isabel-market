import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago/api";
import { decryptSecret, verifyMercadoPagoSignature } from "@/lib/mercadopago/crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const admin = createAdminSupabaseClient();
  if (!admin) return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });

  const text = await request.text();
  const body = text ? JSON.parse(text) : {};
  const paymentId =
    request.nextUrl.searchParams.get("data.id") ??
    request.nextUrl.searchParams.get("id") ??
    body?.data?.id ??
    body?.id;
  const orderId = request.nextUrl.searchParams.get("order_id");

  const signatureOk = verifyMercadoPagoSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId: paymentId ? String(paymentId) : null,
  });

  if (!signatureOk) {
    return NextResponse.json({ error: "Firma invalida" }, { status: 401 });
  }

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

  if (inserted.error?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  let orderQuery = admin
    .from("orders")
    .select("*")
    .limit(1);

  if (orderId) orderQuery = orderQuery.eq("id", orderId);
  else orderQuery = orderQuery.eq("payment_id", String(paymentId));

  const { data: orders } = await orderQuery;
  const order = orders?.[0];

  if (!order) {
    await markWebhook(admin, eventId, "ignored");
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { data: account } = await admin
    .from("seller_payment_accounts")
    .select("access_token_encrypted")
    .eq("seller_id", order.seller_id)
    .eq("provider", "mercadopago")
    .maybeSingle();

  if (!account || !paymentId) {
    await markWebhook(admin, eventId, "missing_account");
    return NextResponse.json({ ok: true, ignored: true });
  }

  const payment = await getPayment(String(paymentId), decryptSecret(account.access_token_encrypted));
  const status = mapPaymentStatus(payment.status);

  await admin
    .from("orders")
    .update({
      payment_id: String(payment.id),
      payment_status_detail: payment.status_detail,
      status,
    })
    .eq("id", payment.external_reference || order.id);

  if (payment.status === "approved") {
    const rpc = await admin.rpc("confirm_paid_order", {
      p_order_id: payment.external_reference || order.id,
      p_payment_id: String(payment.id),
      p_status_detail: payment.status_detail,
    });

    if (rpc.error) {
      await admin
        .from("products")
        .update({ status: "sold", sold_at: new Date().toISOString() })
        .eq("id", order.product_id)
        .eq("status", "approved");
    }
  }

  await markWebhook(admin, eventId, "processed");
  return NextResponse.json({ ok: true });
}

function mapPaymentStatus(status: string) {
  if (status === "approved") return "paid";
  if (status === "rejected" || status === "cancelled") return "failed";
  if (status === "refunded") return "refunded";
  return "payment_created";
}

async function markWebhook(admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>, eventId: string, status: string) {
  await admin
    .from("webhook_events")
    .update({ status, processed_at: new Date().toISOString() })
    .eq("provider", "mercadopago")
    .eq("provider_event_id", eventId);
}

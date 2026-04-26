import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createCheckoutPreference } from "@/lib/mercadopago/api";
import { decryptSecret } from "@/lib/mercadopago/crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validation/checkout";

export const runtime = "nodejs";

const COMMISSION_RATE = 0.1;

export async function POST(request: NextRequest) {
  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  if (!supabase || !admin) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: buyer } = await admin
    .from("profiles")
    .select("id, display_name")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!buyer) {
    return NextResponse.json({ error: "Perfil requerido" }, { status: 403 });
  }

  const { data: product } = await admin
    .from("products")
    .select("id, seller_id, title, price, currency, status")
    .eq("id", parsed.data.productId)
    .maybeSingle();

  if (!product || product.status !== "approved") {
    return NextResponse.json({ error: "Producto no disponible" }, { status: 409 });
  }

  if (product.seller_id === buyer.id) {
    return NextResponse.json({ error: "No podes comprar tu propia publicacion" }, { status: 409 });
  }

  const { data: sellerAccount } = await admin
    .from("seller_payment_accounts")
    .select("*")
    .eq("seller_id", product.seller_id)
    .eq("provider", "mercadopago")
    .eq("status", "active")
    .maybeSingle();

  if (!sellerAccount) {
    return NextResponse.json({ error: "El vendedor debe conectar Mercado Pago" }, { status: 409 });
  }

  const amount = Number(product.price);
  const commissionAmount = Math.round(amount * COMMISSION_RATE * 100) / 100;
  const sellerNetAmount = Math.round((amount - commissionAmount) * 100) / 100;
  const orderId = randomUUID();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      id: orderId,
      buyer_id: buyer.id,
      seller_id: product.seller_id,
      product_id: product.id,
      amount,
      commission_rate: COMMISSION_RATE,
      commission_amount: commissionAmount,
      seller_net_amount: sellerNetAmount,
      payment_provider: "mercadopago",
      status: "pending",
      idempotency_key: parsed.data.idempotencyKey,
    })
    .select("*")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "No se pudo crear la orden" }, { status: 500 });
  }

  const preference = await createCheckoutPreference({
    sellerAccessToken: decryptSecret(sellerAccount.access_token_encrypted),
    orderId: order.id,
    productId: product.id,
    title: product.title,
    amount,
    currency: product.currency ?? "ARS",
    marketplaceFee: commissionAmount,
    buyerEmail: userData.user.email,
  });

  await admin
    .from("orders")
    .update({
      status: "payment_created",
      preference_id: preference.id,
    })
    .eq("id", order.id);

  return NextResponse.json({
    orderId: order.id,
    preferenceId: preference.id,
    initPoint: preference.init_point ?? preference.sandbox_init_point,
  });
}

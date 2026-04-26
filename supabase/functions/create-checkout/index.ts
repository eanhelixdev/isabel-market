import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";
import { createPreference } from "../_shared/mp.ts";
import { decryptSecret } from "../_shared/secrets.ts";

const COMMISSION_RATE = 0.1;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const { productId, idempotencyKey } = await req.json();
  const supabase = userClient(req);
  const admin = adminClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return json({ error: "Unauthorized" }, { status: 401 });

  const { data: buyer } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!buyer) return json({ error: "Profile required" }, { status: 403 });

  const { data: product } = await admin
    .from("products")
    .select("id,seller_id,title,price,currency,status")
    .eq("id", productId)
    .maybeSingle();
  if (!product || product.status !== "approved") {
    return json({ error: "Product unavailable" }, { status: 409 });
  }

  const { data: account } = await admin
    .from("seller_payment_accounts")
    .select("access_token_encrypted")
    .eq("seller_id", product.seller_id)
    .eq("provider", "mercadopago")
    .eq("status", "active")
    .maybeSingle();
  if (!account) return json({ error: "Seller has no Mercado Pago account" }, { status: 409 });

  const amount = Number(product.price);
  const commissionAmount = Math.round(amount * COMMISSION_RATE * 100) / 100;
  const sellerNetAmount = Math.round((amount - commissionAmount) * 100) / 100;

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      buyer_id: buyer.id,
      seller_id: product.seller_id,
      product_id: product.id,
      amount,
      commission_rate: COMMISSION_RATE,
      commission_amount: commissionAmount,
      seller_net_amount: sellerNetAmount,
      payment_provider: "mercadopago",
      status: "pending",
      idempotency_key: idempotencyKey,
    })
    .select("*")
    .single();
  if (error) return json({ error: error.message }, { status: 500 });

  const preference = await createPreference({
    sellerAccessToken: await decryptSecret(account.access_token_encrypted),
    orderId: order.id,
    productId: product.id,
    title: product.title,
    amount,
    currency: product.currency ?? "ARS",
    marketplaceFee: commissionAmount,
  });

  await admin
    .from("orders")
    .update({ status: "payment_created", preference_id: preference.id })
    .eq("id", order.id);

  return json({
    orderId: order.id,
    preferenceId: preference.id,
    initPoint: preference.init_point ?? preference.sandbox_init_point,
  });
});

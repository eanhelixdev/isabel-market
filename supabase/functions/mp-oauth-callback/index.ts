import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const sellerId = url.searchParams.get("seller_id");
  if (!code || !sellerId) return json({ error: "Missing code or seller" }, { status: 400 });

  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: Deno.env.get("MERCADOPAGO_CLIENT_ID"),
      client_secret: Deno.env.get("MERCADOPAGO_CLIENT_SECRET"),
      grant_type: "authorization_code",
      code,
      redirect_uri: Deno.env.get("MERCADOPAGO_REDIRECT_URI"),
    }),
  });
  if (!response.ok) return json({ error: await response.text() }, { status: 502 });

  const token = await response.json();
  const admin = adminClient();
  await admin.from("seller_payment_accounts").upsert(
    {
      seller_id: sellerId,
      provider: "mercadopago",
      provider_user_id: String(token.user_id),
      access_token_encrypted: token.access_token,
      refresh_token_encrypted: token.refresh_token,
      status: "active",
    },
    { onConflict: "seller_id,provider" },
  );

  return json({ ok: true });
});

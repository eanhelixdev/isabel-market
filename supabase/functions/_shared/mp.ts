const encoder = new TextEncoder();

export async function verifyMercadoPagoSignature(req: Request, dataId: string | null) {
  const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!secret || !xSignature || !xRequestId || !dataId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.trim().split("=");
      return [key, value];
    }),
  );
  if (!parts.ts || !parts.v1) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${parts.ts};`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const hex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hex === parts.v1;
}

export async function createPreference(input: {
  sellerAccessToken: string;
  orderId: string;
  productId: string;
  title: string;
  amount: number;
  currency: string;
  marketplaceFee: number;
}) {
  const appUrl = Deno.env.get("APP_URL")!;
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.sellerAccessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.orderId,
    },
    body: JSON.stringify({
      items: [
        {
          id: input.productId,
          title: input.title,
          quantity: 1,
          currency_id: input.currency,
          unit_price: input.amount,
        },
      ],
      marketplace_fee: input.marketplaceFee,
      external_reference: input.orderId,
      notification_url: `${appUrl}/functions/v1/mercadopago-webhook?order_id=${input.orderId}`,
      back_urls: {
        success: `${appUrl}/payment-result?status=success&order_id=${input.orderId}`,
        failure: `${appUrl}/payment-result?status=failure&order_id=${input.orderId}`,
        pending: `${appUrl}/payment-result?status=pending&order_id=${input.orderId}`,
      },
      auto_return: "approved",
    }),
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

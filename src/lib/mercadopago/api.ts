import "server-only";

import { getAppUrl } from "@/lib/utils";

const MP_API = "https://api.mercadopago.com";

export async function exchangeOAuthCode(code: string) {
  const response = await fetch(`${MP_API}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.MERCADOPAGO_CLIENT_ID,
      client_secret: process.env.MERCADOPAGO_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.MERCADOPAGO_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago OAuth failed: ${await response.text()}`);
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token: string;
    user_id: number;
    expires_in: number;
    scope: string;
  };
}

export async function createCheckoutPreference({
  sellerAccessToken,
  orderId,
  productId,
  title,
  amount,
  currency,
  marketplaceFee,
  buyerEmail,
}: {
  sellerAccessToken: string;
  orderId: string;
  productId: string;
  title: string;
  amount: number;
  currency: string;
  marketplaceFee: number;
  buyerEmail?: string | null;
}) {
  const appUrl = getAppUrl();
  const response = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sellerAccessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": orderId,
    },
    body: JSON.stringify({
      items: [
        {
          id: productId,
          title,
          quantity: 1,
          currency_id: currency,
          unit_price: amount,
        },
      ],
      payer: buyerEmail ? { email: buyerEmail } : undefined,
      marketplace_fee: marketplaceFee,
      external_reference: orderId,
      notification_url: `${appUrl}/api/webhooks/mercadopago?order_id=${orderId}`,
      back_urls: {
        success: `${appUrl}/payment-result?status=success&order_id=${orderId}`,
        failure: `${appUrl}/payment-result?status=failure&order_id=${orderId}`,
        pending: `${appUrl}/payment-result?status=pending&order_id=${orderId}`,
      },
      auto_return: "approved",
    }),
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago preference failed: ${await response.text()}`);
  }

  return (await response.json()) as {
    id: string;
    init_point?: string;
    sandbox_init_point?: string;
  };
}

export async function getPayment(paymentId: string, accessToken: string) {
  const response = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago payment fetch failed: ${await response.text()}`);
  }

  return (await response.json()) as {
    id: number;
    status: string;
    status_detail: string;
    external_reference: string;
    transaction_amount: number;
    currency_id: string;
  };
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { encryptSecret, verifyState } from "@/lib/mercadopago/crypto";
import { exchangeOAuthCode } from "@/lib/mercadopago/api";
import { getAppUrl } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const admin = createAdminSupabaseClient();

  if (!code || !state || !admin) {
    return NextResponse.redirect(`${getAppUrl()}/me?mp=error`);
  }

  try {
    const [sellerId] = verifyState(state).split(":");
    const token = await exchangeOAuthCode(code);

    await admin.from("seller_payment_accounts").upsert(
      {
        seller_id: sellerId,
        provider: "mercadopago",
        provider_user_id: String(token.user_id),
        access_token_encrypted: encryptSecret(token.access_token),
        refresh_token_encrypted: encryptSecret(token.refresh_token),
        status: "active",
      },
      {
        onConflict: "seller_id,provider",
      },
    );

    return NextResponse.redirect(`${getAppUrl()}/me?mp=connected`);
  } catch {
    return NextResponse.redirect(`${getAppUrl()}/me?mp=error`);
  }
}

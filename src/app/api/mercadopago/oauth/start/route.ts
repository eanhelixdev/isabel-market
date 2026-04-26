import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils";
import { signState } from "@/lib/mercadopago/crypto";

export const runtime = "nodejs";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile?.onboarding_completed) {
    return NextResponse.json({ error: "Onboarding requerido" }, { status: 401 });
  }

  if (!process.env.MERCADOPAGO_CLIENT_ID || !process.env.MERCADOPAGO_REDIRECT_URI) {
    return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 500 });
  }

  const state = signState(`${profile.id}:${Date.now()}`);
  const url = new URL("https://auth.mercadopago.com.ar/authorization");
  url.searchParams.set("client_id", process.env.MERCADOPAGO_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", process.env.MERCADOPAGO_REDIRECT_URI);
  url.searchParams.set("state", state);

  return NextResponse.json({ url: url.toString(), fallback: getAppUrl() });
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export async function GET() {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const base = {
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    env: {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(anonKey),
      anonKeyLength: anonKey?.length ?? 0,
      hasServiceRoleKey: hasSupabaseAdminEnv(),
      supabaseHost: getSafeHost(supabaseUrl),
      supabaseProjectRef: getProjectRef(supabaseUrl),
    },
  };

  if (!hasSupabaseEnv() || !supabaseUrl || !anonKey) {
    return NextResponse.json(
      {
        ok: false,
        ...base,
        query: null,
        error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { headers: noStoreHeaders(), status: 500 },
    );
  }

  try {
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error, count } = await supabase
      .from("product_cards")
      .select("id,title,status,image_url", { count: "exact" })
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(5);

    return NextResponse.json(
      {
        ok: !error,
        ...base,
        query: {
          table: "product_cards",
          approvedCount: count,
          error: formatSupabaseError(error),
          sample:
            data?.map((product) => ({
              id: product.id,
              title: product.title,
              status: product.status,
              imageUrlKind: getImageUrlKind(product.image_url),
            })) ?? [],
        },
      },
      { headers: noStoreHeaders(), status: error ? 500 : 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        ...base,
        query: null,
        error: error instanceof Error ? error.message : "Unknown Supabase health error.",
      },
      { headers: noStoreHeaders(), status: 500 },
    );
  }
}

function getSafeHost(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return "invalid-url";
  }
}

function getProjectRef(value: string | undefined) {
  const host = getSafeHost(value);
  return host?.endsWith(".supabase.co") ? host.split(".")[0] : null;
}

function getImageUrlKind(value: string | null) {
  if (!value) return "empty";
  return value.startsWith("http") ? "public-url" : "storage-path";
}

function formatSupabaseError(error: SupabaseErrorLike | null) {
  if (!error) return null;
  return {
    message: error.message ?? null,
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  };
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
  };
}

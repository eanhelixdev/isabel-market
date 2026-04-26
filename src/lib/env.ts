export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/auth\/v1\/?$/, "")
    .replace(/\/$/, "");
}

export function hasSupabaseAdminEnv() {
  return Boolean(hasSupabaseEnv() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasMercadoPagoEnv() {
  return Boolean(
    process.env.MERCADOPAGO_CLIENT_ID &&
      process.env.MERCADOPAGO_CLIENT_SECRET &&
      process.env.MERCADOPAGO_PUBLIC_KEY &&
      process.env.MERCADOPAGO_WEBHOOK_SECRET,
  );
}

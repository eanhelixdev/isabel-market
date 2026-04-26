import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  const { productId, action, reason } = await req.json();
  const supabase = userClient(req);
  const admin = adminClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles")
    .select("id,role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return json({ error: "Forbidden" }, { status: 403 });

  const status =
    action === "approve" ? "approved" : action === "reject" ? "rejected" : "archived";

  const { error } = await admin
    .from("products")
    .update({
      status,
      rejection_reason: action === "reject" ? reason : null,
      approved_at: action === "approve" ? new Date().toISOString() : null,
      approved_by: action === "approve" ? profile.id : null,
    })
    .eq("id", productId);
  if (error) return json({ error: error.message }, { status: 500 });

  await admin.from("admin_actions").insert({
    admin_id: profile.id,
    action_type: action,
    target_type: "product",
    target_id: productId,
    reason: action === "reject" ? reason : null,
  });

  return json({ ok: true });
});

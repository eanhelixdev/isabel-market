import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { sellerId } = await req.json();
  const supabase = userClient(req);
  const admin = adminClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin.rpc("recalculate_reputation", {
    p_seller_id: sellerId,
  });
  if (error) return json({ error: error.message }, { status: 500 });

  return json({ score: data });
});

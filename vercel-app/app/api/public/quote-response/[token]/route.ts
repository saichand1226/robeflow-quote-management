import { createClient } from "@supabase/supabase-js";
import { camel } from "@/lib/api-auth";

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Public quote access is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function cleanToken(value: string) {
  const token = decodeURIComponent(value || "").trim();
  return !token || token === "null" || token === "undefined" ? "" : token;
}

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const token = cleanToken((await params).token);
    if (!token) return Response.json({ error: "This quotation link is incomplete. Please ask the sender to email the quote again." }, { status: 400 });

    const { data, error } = await publicClient().rpc("get_public_quote", { p_token: token });
    if (error) throw error;
    const raw = data?.quote;
    if (!raw) return Response.json({ error: "This quotation link is invalid or no longer available." }, { status: 404 });

    return Response.json({ quote: { ...camel(raw), items: (raw.quote_items ?? []).map(camel) } });
  } catch (error) {
    console.error("Public quote load failed", error);
    return Response.json({ error: "The quotation could not be loaded. Please try again shortly." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const token = cleanToken((await params).token);
    if (!token) return Response.json({ error: "This quotation link is incomplete." }, { status: 400 });

    const body = await request.json();
    const status = body.status || body.decision;
    if (!["Accepted", "Declined"].includes(status)) return Response.json({ error: "Choose accept or decline." }, { status: 400 });

    const { data, error } = await publicClient().rpc("respond_to_public_quote", {
      p_token: token,
      p_status: status,
      p_purchase_order_number: body.purchaseOrderNumber?.trim() || "",
      p_comment: body.comment?.trim() || "",
    });
    if (error) throw error;
    if (!data) return Response.json({ error: "This quotation is no longer available." }, { status: 404 });
    return Response.json({ success: true, status: data.status });
  } catch (error) {
    console.error("Public quote response failed", error);
    return Response.json({ error: "Your response could not be saved. Please try again." }, { status: 500 });
  }
}

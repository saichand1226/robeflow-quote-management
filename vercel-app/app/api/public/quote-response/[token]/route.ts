import { createAdminClient } from "@/lib/supabase/admin";
import { camel } from "@/lib/api-auth";

function publicErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/not configured|missing/i.test(message)) return "CONFIG";
  if (/jwt|api key|unauthorized|forbidden|permission/i.test(message)) return "AUTH";
  if (/relation|column|schema|cache|query/i.test(message)) return "SCHEMA";
  return "DATABASE";
}

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const supabase = createAdminClient();
    const token = decodeURIComponent((await params).token || "").trim();
    if (!token || token === "null" || token === "undefined") {
      return Response.json({ error: "This quotation link is incomplete. Please ask the sender to email the quote again." }, { status: 400 });
    }

    const { data: quote, error: quoteError } = await supabase.from("quotes").select("*").eq("acceptance_token", token).maybeSingle();
    if (quoteError) throw quoteError;
    if (!quote) return Response.json({ error: "This quotation link is invalid or no longer available." }, { status: 404 });

    const { data: items, error: itemsError } = await supabase.from("quote_items").select("*").eq("quote_id", quote.id).order("sort_order");
    if (itemsError) throw itemsError;
    return Response.json({ quote: { ...camel(quote), items: (items ?? []).map(camel) } });
  } catch (error) {
    console.error("Public quote load failed", error);
    const code = publicErrorCode(error);
    return Response.json({ error: `The quotation could not be loaded (reference: ${code}).` }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const supabase = createAdminClient();
    const token = decodeURIComponent((await params).token || "").trim();
    if (!token || token === "null" || token === "undefined") return Response.json({ error: "This quotation link is incomplete." }, { status: 400 });
    const body = await request.json(), status = body.status || body.decision;
    if (!["Accepted", "Declined"].includes(status)) return Response.json({ error: "Choose accept or decline." }, { status: 400 });

    const changes: Record<string, string> = { status, customer_comment: body.comment?.trim() || "", purchase_order_number: body.purchaseOrderNumber?.trim() || "" };
    if (status === "Accepted") { changes.accepted_at = new Date().toISOString(); changes.job_stage = "Site measure required"; }
    const { data, error } = await supabase.from("quotes").update(changes).eq("acceptance_token", token).select().maybeSingle();
    if (error) throw error;
    if (!data) return Response.json({ error: "This quotation is no longer available." }, { status: 404 });
    await supabase.from("quote_activities").insert({ quote_id: data.id, action: `Quote ${status.toLowerCase()}`, detail: changes.customer_comment, actor: "Customer" });
    return Response.json({ success: true, status });
  } catch (error) {
    console.error("Public quote response failed", error);
    return Response.json({ error: "Your response could not be saved. Please try again." }, { status: 500 });
  }
}

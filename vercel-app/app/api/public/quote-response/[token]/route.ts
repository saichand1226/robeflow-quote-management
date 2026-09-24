import { createClient } from "@supabase/supabase-js";
import { camel } from "@/lib/api-auth";
import { appUrl, sendEmail } from "@/lib/email";
import { safe } from "@/lib/operational";
import { createAdminClient } from "@/lib/supabase/admin";

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Public quote access is not configured.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function cleanToken(value: string) {
  const token = decodeURIComponent(value || "").trim();
  return !token || token === "null" || token === "undefined" ? "" : token;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const token = cleanToken((await params).token);
    if (!token)
      return Response.json(
        {
          error:
            "This quotation link is incomplete. Please ask the sender to email the quote again.",
        },
        { status: 400 },
      );

    const { data, error } = await publicClient().rpc("get_public_quote", {
      p_token: token,
    });
    if (error) throw error;
    const raw = data?.quote;
    if (!raw)
      return Response.json(
        { error: "This quotation link is invalid or no longer available." },
        { status: 404 },
      );

    return Response.json({
      quote: { ...camel(raw), items: (raw.quote_items ?? []).map(camel) },
    });
  } catch (error) {
    console.error("Public quote load failed", error);
    return Response.json(
      { error: "The quotation could not be loaded. Please try again shortly." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const token = cleanToken((await params).token);
    if (!token)
      return Response.json(
        { error: "This quotation link is incomplete." },
        { status: 400 },
      );

    const body = await request.json();
    const status = body.status || body.decision;
    if (!["Accepted", "Declined"].includes(status))
      return Response.json(
        { error: "Choose accept or decline." },
        { status: 400 },
      );

    const { data, error } = await publicClient().rpc(
      "respond_to_public_quote",
      {
        p_token: token,
        p_status: status,
        p_purchase_order_number: body.purchaseOrderNumber?.trim() || "",
        p_comment: body.comment?.trim() || "",
      },
    );
    if (error) throw error;
    if (!data)
      return Response.json(
        { error: "This quotation is no longer available." },
        { status: 404 },
      );
    try {
      const admin = createAdminClient();
      const { data: quote } = await admin
        .from("quotes")
        .select(
          "id,quote_number,customer_name,project,salesperson_name,customer_comment,status",
        )
        .eq("id", data.quote_id)
        .single();
      if (quote) {
        const { data: salesperson } = await admin
          .from("team_members")
          .select("email")
          .eq("name", quote.salesperson_name)
          .eq("active", true)
          .limit(1)
          .maybeSingle();
        const notify = salesperson?.email || process.env.QUOTE_EMAIL_REPLY_TO;
        if (notify) {
          const mail = await sendEmail({
            to: notify,
            subject: `Customer response: ${quote.quote_number} – ${quote.customer_name}`,
            idempotencyKey:
              `customer-quote-response-${quote.id}-${quote.status}-${encodeURIComponent(quote.customer_comment || "none")}`.slice(
                0,
                250,
              ),
            html: `<!doctype html><html lang="en"><body><div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h1 style="color:#047857">Customer responded to a quotation</h1><p><strong>${safe(quote.customer_name)}</strong> marked quotation <strong>${safe(quote.quote_number)}</strong> as <strong>${safe(quote.status)}</strong>.</p><p><strong>Project:</strong> ${safe(quote.project)}</p><p><strong>Requested change/comment:</strong><br>${safe(quote.customer_comment || "No comment was added.")}</p><p><a href="${appUrl()}/dashboard" style="display:inline-block;background:#047857;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Open Sales workspace</a></p></div></body></html>`,
            text: `${quote.customer_name} marked ${quote.quote_number} as ${quote.status}.\n\nRequested change/comment: ${quote.customer_comment || "No comment was added."}\n\nOpen RobeFlow: ${appUrl()}/dashboard`,
          });
          await Promise.all([
            admin
              .from("quotes")
              .update({
                customer_response_notified_at: new Date().toISOString(),
              })
              .eq("id", quote.id),
            admin.from("email_deliveries").insert({
              quote_id: quote.id,
              kind: "Customer quote response notification",
              recipient: notify,
              provider_id: mail.id,
            }),
            admin.from("quote_activities").insert({
              quote_id: quote.id,
              action: "Sales notified of customer response",
              detail: quote.customer_comment || quote.status,
              actor: "RobeFlow",
            }),
          ]);
        }
      }
    } catch (notificationError) {
      console.error(
        "Sales notification failed after customer response",
        notificationError,
      );
    }
    return Response.json({ success: true, status: data.status });
  } catch (error) {
    console.error("Public quote response failed", error);
    return Response.json(
      { error: "Your response could not be saved. Please try again." },
      { status: 500 },
    );
  }
}

import { appUrl, sendEmail } from "@/lib/email";
import { safe } from "@/lib/operational";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    return Response.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  if (request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: quotes, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("archived", false)
    .not("email", "eq", "");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let quoteReminders = 0;
  let invoiceReminders = 0;
  const failures: string[] = [];
  for (const quote of quotes ?? []) {
    try {
      if (
        ["Draft", "Sent"].includes(quote.status) &&
        quote.valid_until < today &&
        !quote.quote_follow_up_sent_at
      ) {
        const url = `${appUrl()}/quote-response/${quote.acceptance_token}`;
        const mail = await sendEmail({
          to: quote.email,
          subject: `Follow-up on quotation ${quote.quote_number}`,
          idempotencyKey: `automatic-quote-follow-up-${quote.id}-${quote.valid_until}`,
          html: `<!doctype html><html lang="en"><body><div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h1 style="color:#047857">Quotation follow-up</h1><p>Hi ${safe(quote.customer_name)},</p><p>We are following up on quotation <strong>${safe(quote.quote_number)}</strong> for <strong>${safe(quote.project)}</strong>, which passed its valid-until date on ${safe(new Date(`${quote.valid_until}T00:00:00`).toLocaleDateString("en-NZ"))}.</p><p>Please let us know if you would like to proceed or if you would like us to revise anything.</p><p><a href="${url}" style="display:inline-block;background:#047857;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Review quotation</a></p><p>Kind regards,<br><strong>RobeFlow Wardrobes</strong></p></div></body></html>`,
          text: `Hi ${quote.customer_name},\n\nWe are following up on quotation ${quote.quote_number} for ${quote.project}. Please let us know if you would like to proceed or request a revision.\n\n${url}`,
        });
        const now = new Date().toISOString();
        await Promise.all([
          supabase
            .from("quotes")
            .update({ quote_follow_up_sent_at: now })
            .eq("id", quote.id),
          supabase.from("email_deliveries").insert({
            quote_id: quote.id,
            kind: "Automatic quote follow-up",
            recipient: quote.email,
            provider_id: mail.id,
          }),
          supabase.from("quote_activities").insert({
            quote_id: quote.id,
            action: "Automatic quote follow-up sent",
            detail: `Sent after ${quote.valid_until}`,
            actor: "RobeFlow",
          }),
        ]);
        quoteReminders++;
      }

      if (
        quote.status === "Accepted" &&
        quote.invoice_sent_at &&
        quote.invoice_due_date &&
        quote.invoice_due_date < today &&
        !["Paid in Full", "Account"].includes(quote.invoice_status) &&
        !quote.invoice_follow_up_sent_at
      ) {
        const url = `${appUrl()}/invoice/${quote.acceptance_token}`;
        const mail = await sendEmail({
          to: quote.email,
          subject: `Overdue invoice ${quote.invoice_number}`,
          idempotencyKey: `automatic-invoice-follow-up-${quote.id}-${quote.invoice_due_date}`,
          html: `<!doctype html><html lang="en"><body><div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h1 style="color:#047857">Invoice payment reminder</h1><p>Hi ${safe(quote.customer_name)},</p><p>This is a friendly reminder that invoice <strong>${safe(quote.invoice_number)}</strong> for <strong>${safe(quote.project)}</strong> was due on ${safe(new Date(`${quote.invoice_due_date}T00:00:00`).toLocaleDateString("en-NZ"))}.</p><p>If payment has already been made, please disregard this message. Otherwise, please arrange payment or contact us if you need assistance.</p><p><a href="${url}" style="display:inline-block;background:#047857;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">View invoice</a></p><p>Kind regards,<br><strong>RobeFlow Wardrobes</strong></p></div></body></html>`,
          text: `Hi ${quote.customer_name},\n\nInvoice ${quote.invoice_number} was due on ${quote.invoice_due_date}. If payment has already been made, please disregard this reminder.\n\n${url}`,
        });
        const now = new Date().toISOString();
        await Promise.all([
          supabase
            .from("quotes")
            .update({ invoice_follow_up_sent_at: now })
            .eq("id", quote.id),
          supabase.from("email_deliveries").insert({
            quote_id: quote.id,
            kind: "Automatic invoice reminder",
            recipient: quote.email,
            provider_id: mail.id,
          }),
          supabase.from("quote_activities").insert({
            quote_id: quote.id,
            action: "Automatic invoice reminder sent",
            detail: `Due ${quote.invoice_due_date}`,
            actor: "RobeFlow",
          }),
        ]);
        invoiceReminders++;
      }
    } catch (err) {
      failures.push(
        `${quote.id}: ${err instanceof Error ? err.message : "send failed"}`,
      );
    }
  }
  return Response.json({ quoteReminders, invoiceReminders, failures });
}

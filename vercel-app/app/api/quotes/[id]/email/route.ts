import { requireStaff } from "@/lib/api-auth";
import { appUrl, sendEmail } from "@/lib/email";
import { loadQuote, safe } from "@/lib/operational";
import { createQuotePdf } from "@/lib/quote-pdf";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(["Admin", "Sales", "Staff"]);
  if (auth.error) return auth.error;

  const id = Number((await params).id);
  const quote = await loadQuote(auth.supabase, id);
  if (!quote) return Response.json({ error: "Quote not found." }, { status: 404 });
  if (!quote.email) return Response.json({ error: "Add the customer's email address first." }, { status: 400 });

  try {
    const responseToken = quote.acceptanceToken || crypto.randomUUID();
    if (!quote.acceptanceToken) {
      const { error: tokenError } = await auth.supabase
        .from("quotes")
        .update({ acceptance_token: responseToken })
        .eq("id", id);
      if (tokenError) throw new Error("The secure quotation link could not be created.");
      quote.acceptanceToken = responseToken;
    }

    const pdf = await createQuotePdf(quote as never);
    const baseUrl = appUrl().replace(/\/$/, "");
    const url = `${baseUrl}/quote-response/${encodeURIComponent(responseToken)}`;
    const mail = await sendEmail({
      to: quote.email,
      subject: `Quotation ${quote.quoteNumber} for ${quote.project}`,
      idempotencyKey: `quote-${id}-r${quote.revision}-${Date.now().toString().slice(0, -5)}`,
      attachments: [{ filename: `${quote.quoteNumber}.pdf`, content: Buffer.from(pdf).toString("base64") }],
      html: `<!doctype html><html lang="en" dir="ltr"><head><title>Quotation ${safe(quote.quoteNumber)}</title></head><body><div lang="en" dir="ltr" style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h1 style="color:#047857">Your RobeFlow quotation</h1><p>Hi ${safe(quote.customerName)},</p><p>Your quotation for <strong>${safe(quote.project)}</strong> is attached as a PDF.</p><p><a href="${url}" style="display:inline-block;background:#047857;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">View and respond to quote</a></p><p>You can review the quotation, add a purchase-order number or comment, and accept or decline it securely online.</p><p>Kind regards,<br><strong>RobeFlow Wardrobes</strong></p></div></body></html>`,
      text: `Hi ${quote.customerName},\n\nYour quotation ${quote.quoteNumber} for ${quote.project} is attached.\nView and respond: ${url}\n\nKind regards,\nRobeFlow Wardrobes`,
    });

    const now = new Date().toISOString();
    const { data } = await auth.supabase
      .from("quotes")
      .update({ status: "Sent", emailed_at: now, email_id: mail.id, acceptance_token: responseToken })
      .eq("id", id)
      .select()
      .single();
    await auth.supabase.from("email_deliveries").insert({ quote_id: id, kind: "Quote", recipient: quote.email, provider_id: mail.id });
    return Response.json({ quote: { ...quote, status: "Sent", emailedAt: now, emailId: mail.id, acceptanceToken: responseToken, ...(data || {}) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Email could not be sent." }, { status: 502 });
  }
}

import { requireStaff } from "@/lib/api-auth";
import { appUrl, sendEmail } from "@/lib/email";
import { loadQuote, safe } from "@/lib/operational";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(["Admin", "Sales", "Staff"]);
  if (auth.error) return auth.error;
  const id = Number((await params).id), quote = await loadQuote(auth.supabase, id);
  if (!quote) return Response.json({ error: "Quote not found." }, { status: 404 });
  if (!quote.email) return Response.json({ error: "Add the customer's email address first." }, { status: 400 });
  if (["Accepted", "Declined", "Completed"].includes(quote.status)) return Response.json({ error: "This quote no longer requires a follow-up." }, { status: 400 });
  if (!quote.validUntil || quote.validUntil >= new Date().toISOString().slice(0, 10)) return Response.json({ error: "The quotation has not expired yet." }, { status: 400 });
  try {
    const token = quote.acceptanceToken || crypto.randomUUID();
    if (!quote.acceptanceToken) await auth.supabase.from("quotes").update({ acceptance_token: token }).eq("id", id);
    const url = `${appUrl().replace(/\/$/, "")}/quote-response/${encodeURIComponent(token)}`;
    const validDate = new Date(`${quote.validUntil}T00:00:00`).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" });
    const mail = await sendEmail({
      to: quote.email,
      subject: `Following up on quotation ${quote.quoteNumber} – ${quote.project}`,
      idempotencyKey: `quote-follow-up-${id}-${Date.now().toString().slice(0, -5)}`,
      html: `<!doctype html><html lang="en"><body><div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h1 style="color:#047857">Following up on your quotation</h1><p>Hi ${safe(quote.customerName)},</p><p>We’re following up on quotation <strong>${safe(quote.quoteNumber)}</strong> for <strong>${safe(quote.project)}</strong>, which was valid until ${safe(validDate)}.</p><p>Please let us know if you would like to proceed, or if you would like us to review or update anything in the quotation.</p><p><a href="${url}" style="display:inline-block;background:#047857;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Review quotation</a></p><p>Kind regards,<br><strong>RobeFlow Wardrobes</strong></p></div></body></html>`,
      text: `Hi ${quote.customerName},\n\nWe’re following up on quotation ${quote.quoteNumber} for ${quote.project}, which was valid until ${validDate}. Please let us know if you would like to proceed or if you would like anything updated.\n\nReview quotation: ${url}\n\nKind regards,\nRobeFlow Wardrobes`,
    });
    await Promise.all([
      auth.supabase.from("email_deliveries").insert({ quote_id: id, kind: "Quote follow-up", recipient: quote.email, provider_id: mail.id }),
      auth.supabase.from("quote_activities").insert({ quote_id: id, action: "Follow-up email sent", detail: `Expired quotation followed up with ${quote.email}`, actor: auth.profile.full_name }),
    ]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Follow-up email could not be sent." }, { status: 502 });
  }
}

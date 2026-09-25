import { requireStaff, camel } from "@/lib/api-auth";
import { appUrl, sendEmail } from "@/lib/email";
import { createInvoicePdf } from "@/lib/invoice-pdf";
import { loadQuote, safe } from "@/lib/operational";

export async function GET(request: Request) {
  const auth = await requireStaff(["Admin", "Accounts", "Operations", "Staff"]);
  if (auth.error) return auth.error;
  const quoteId = Number(new URL(request.url).searchParams.get("quoteId"));
  const { data, error } = await auth.supabase
    .from("additional_invoices")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false });
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ invoices: (data ?? []).map(camel) });
}

export async function POST(request: Request) {
  const auth = await requireStaff(["Admin", "Accounts", "Operations", "Staff"]);
  if (auth.error) return auth.error;
  const body = await request.json();
  const quoteId = Number(body.quoteId),
    amount = Number(body.amount),
    description = String(body.description || "").trim(),
    dueDate = String(body.dueDate || "");
  const quote = await loadQuote(auth.supabase, quoteId);
  if (!quote || !quote.accountsApproved)
    return Response.json(
      { error: "Approved dispatch job not found." },
      { status: 404 },
    );
  if (!quote.email)
    return Response.json(
      { error: "Add the customer's email address first." },
      { status: 400 },
    );
  if (!(amount > 0) || !description || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
    return Response.json(
      { error: "Enter the missing item, additional price and due date." },
      { status: 400 },
    );

  const { data: existing } = await auth.supabase
    .from("additional_invoices")
    .select("id")
    .eq("quote_id", quoteId);
  const base =
    quote.invoiceNumber || quote.depositInvoiceNumber || quote.quoteNumber;
  const suggested = `${base}-A${(existing?.length || 0) + 1}`;
  const invoiceNumber = String(body.invoiceNumber || suggested)
    .trim()
    .toUpperCase();
  const { data: duplicate } = await auth.supabase
    .from("additional_invoices")
    .select("id")
    .eq("invoice_number", invoiceNumber)
    .limit(1)
    .maybeSingle();
  if (duplicate)
    return Response.json(
      { error: `Additional invoice ${invoiceNumber} already exists.` },
      { status: 409 },
    );

  const { data: settings } = await auth.supabase
    .from("company_settings")
    .select("*")
    .eq("id", 1)
    .single();
  const invoice = {
    ...quote,
    amount,
    items: [
      {
        category: description,
        systemType: "Dispatch adjustment",
        colour: "",
        price: amount,
      },
    ],
    payments: [],
  };
  try {
    const pdf = await createInvoicePdf({
      ...invoice,
      invoiceNumber,
      invoiceDueDate: dueDate,
      bankDetails:
        settings?.bank_details || "XYZ Bank\nAccount: 00-0000-0000000-00",
      companyNameSetting: settings?.company_name || "RobeFlow Wardrobes",
      companyAddress: settings?.address || "Christchurch, New Zealand",
      gstNumber: settings?.gst_number || "",
    } as never);
    const url = `${appUrl()}/invoice/${quote.acceptanceToken}`;
    const mail = await sendEmail({
      to: quote.email,
      subject: `Additional invoice ${invoiceNumber} for ${quote.project}`,
      idempotencyKey: `additional-invoice-${quoteId}-${invoiceNumber}`,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: Buffer.from(pdf).toString("base64"),
        },
      ],
      html: `<!doctype html><html lang="en"><body><div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h1 style="color:#047857">Additional invoice</h1><p>Hi ${safe(quote.customerName)},</p><p>During dispatch preparation we identified an additional requirement for your job:</p><p><strong>${safe(description)}</strong></p><p>Additional amount: <strong>$${amount.toFixed(2)}</strong><br>Due: <strong>${safe(new Date(`${dueDate}T00:00:00`).toLocaleDateString("en-NZ"))}</strong></p><p><a href="${url}" style="display:inline-block;background:#047857;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">View job details</a></p><p>Please contact us if you would like to discuss this adjustment.</p></div></body></html>`,
      text: `Hi ${quote.customerName},\n\nAdditional invoice ${invoiceNumber}: ${description}. Amount: $${amount.toFixed(2)}, due ${dueDate}.`,
    });
    const now = new Date().toISOString();
    const { data, error } = await auth.supabase
      .from("additional_invoices")
      .insert({
        quote_id: quoteId,
        invoice_number: invoiceNumber,
        description,
        amount,
        due_date: dueDate,
        status: "Sent",
        sent_at: now,
        created_by: auth.profile.full_name,
      })
      .select()
      .single();
    if (error) throw error;
    await Promise.all([
      auth.supabase
        .from("email_deliveries")
        .insert({
          quote_id: quoteId,
          kind: "Additional dispatch invoice",
          recipient: quote.email,
          provider_id: mail.id,
        }),
      auth.supabase
        .from("quote_activities")
        .insert({
          quote_id: quoteId,
          action: "Additional invoice sent",
          detail: `${invoiceNumber} · ${description} · $${amount.toFixed(2)}`,
          actor: auth.profile.full_name,
        }),
    ]);
    return Response.json({ invoice: camel(data) }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Additional invoice could not be sent.",
      },
      { status: 502 },
    );
  }
}

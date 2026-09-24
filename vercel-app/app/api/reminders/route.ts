import { requireStaff } from "@/lib/api-auth";
export async function GET() {
  const a = await requireStaff();
  if (a.error) return a.error;
  const { data } = await a.supabase
      .from("quotes")
      .select("*")
      .eq("archived", false),
    today = new Date(),
    soon = new Date(today.getTime() + 7 * 86400000),
    reminders: any[] = [];
  for (const q of data ?? []) {
    const valid = new Date(`${q.valid_until}T00:00:00`);
    if (["Draft", "Sent"].includes(q.status) && valid <= soon)
      reminders.push({
        id: `q-${q.id}`,
        quoteNumber: q.quote_number,
        customerName: q.customer_name,
        message:
          valid < today ? "Quote has expired." : "Quote expires within 7 days.",
        urgency: valid < today ? "Overdue" : "Soon",
        type: "Quote",
        date: q.valid_until,
      });
    if (
      q.status === "Accepted" &&
      q.invoice_sent_at &&
      q.invoice_due_date &&
      !["Paid in Full", "Account"].includes(q.invoice_status)
    ) {
      const due = new Date(`${q.invoice_due_date}T00:00:00`);
      if (due <= soon)
        reminders.push({
          id: `i-${q.id}`,
          quoteNumber: q.invoice_number || q.quote_number,
          customerName: q.customer_name,
          message:
            due < today
              ? "Invoice is overdue."
              : "Invoice is due within 7 days.",
          urgency: due < today ? "Overdue" : "Soon",
          type: "Invoice",
          date: q.invoice_due_date,
        });
    }
  }
  return Response.json({ reminders });
}

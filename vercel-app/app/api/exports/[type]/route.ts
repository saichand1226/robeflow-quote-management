import { requireStaff } from "@/lib/api-auth";

const escape = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
const csv = (headers: string[], rows: unknown[][]) =>
  [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");

export async function GET(
  _: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const auth = await requireStaff([
    "Admin",
    "Accounts",
    "Sales",
    "Operations",
    "Staff",
  ]);
  if (auth.error) return auth.error;
  const { type } = await params;
  let content = "",
    filename = `${type}.csv`;
  if (type === "quotes" || type === "jobs") {
    const { data, error } = await auth.supabase
      .from("quotes")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    content = csv(
      [
        "Quote",
        "Invoice",
        "Customer",
        "Project",
        "Service",
        "Status",
        "Payment",
        "Value",
        "Salesperson",
        "Created",
      ],
      (data ?? []).map((row) => [
        row.quote_number,
        row.invoice_number,
        row.customer_name,
        row.project,
        row.service_type,
        row.status,
        row.invoice_status,
        row.amount,
        row.salesperson_name,
        row.created_at,
      ]),
    );
  } else if (type === "customers") {
    const { data, error } = await auth.supabase
      .from("customers")
      .select("*")
      .order("name");
    if (error) return Response.json({ error: error.message }, { status: 500 });
    content = csv(
      ["Name", "Company", "Email", "Phone", "Address", "Site address"],
      (data ?? []).map((row) => [
        row.name,
        row.company_name,
        row.email,
        row.phone,
        row.address,
        row.site_address,
      ]),
    );
  } else if (type === "payments") {
    if (!["Admin", "Accounts", "Staff"].includes(auth.profile.role))
      return Response.json(
        { error: "Accounts access is required." },
        { status: 403 },
      );
    const { data, error } = await auth.supabase
      .from("payment_transactions")
      .select("*,quotes(quote_number,invoice_number,customer_name)")
      .order("payment_date", { ascending: false });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    content = csv(
      ["Quote", "Invoice", "Customer", "Amount", "Date", "Method", "Reference"],
      (data ?? []).map((row: any) => [
        row.quotes?.quote_number,
        row.quotes?.invoice_number,
        row.quotes?.customer_name,
        row.amount,
        row.payment_date,
        row.method,
        row.reference,
      ]),
    );
  } else
    return Response.json({ error: "Unknown export type." }, { status: 404 });
  return new Response(`\uFEFF${content}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="robeflow-${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

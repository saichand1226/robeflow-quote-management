import { camel, requireStaff, snake } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireStaff(); if (auth.error) return auth.error;
  const { data, error } = await auth.supabase.from("customers").select("*,quotes(id,quote_number,project,status,amount,invoice_status)").eq("archived", false).order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ customers: (data ?? []).map(row => ({ ...camel(row), quotes: (row.quotes ?? []).map(camel) })) });
}

export async function POST(request: Request) {
  const auth = await requireStaff(["Admin", "Sales", "Staff"]); if (auth.error) return auth.error;
  const body = await request.json(); if (!body.name?.trim()) return Response.json({ error: "Customer name is required." }, { status: 400 });
  const { data, error } = await auth.supabase.from("customers").insert(snake({ name: body.name.trim(), companyName: body.companyName?.trim() ?? "", email: body.email?.trim() ?? "", phone: body.phone?.trim() ?? "", address: body.address?.trim() ?? "", siteAddress: body.siteAddress?.trim() ?? "", notes: body.notes?.trim() ?? "" })).select().single();
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ customer: camel(data) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireStaff(["Admin", "Sales", "Staff"]); if (auth.error) return auth.error;
  const body = await request.json(); if (!body.id) return Response.json({ error: "Customer is required." }, { status: 400 });
  const values: Record<string, unknown> = {}; for (const key of ["name","companyName","email","phone","address","siteAddress","notes","archived"]) if (body[key] !== undefined) values[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
  const { data, error } = await auth.supabase.from("customers").update(snake(values)).eq("id", body.id).select().single();
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ customer: camel(data) });
}

import { camel, requireStaff, snake } from "@/lib/api-auth";

const keyFor = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
const clean = (body: any) => ({
  fieldKey: body.fieldKey || keyFor(body.label || "field"),
  label: String(body.label || "").trim(),
  fieldType: body.fieldType || "text",
  options: Array.isArray(body.options)
    ? body.options.map((x: unknown) => String(x).trim()).filter(Boolean)
    : [],
  required: !!body.required,
  showNewQuote: body.showNewQuote !== false,
  showDashboard: !!body.showDashboard,
  showJobCard: !!body.showJobCard,
  active: body.active !== false,
  sortOrder: Number(body.sortOrder) || 0,
  updatedAt: new Date().toISOString(),
});

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const { data, error } = await auth.supabase
    .from("custom_field_definitions")
    .select("*")
    .order("sort_order")
    .order("id");
  return error
    ? Response.json({ error: error.message }, { status: 500 })
    : Response.json({ fields: (data ?? []).map(camel) });
}

export async function POST(request: Request) {
  const auth = await requireStaff(["Admin"]);
  if (auth.error) return auth.error;
  const body = await request.json(),
    field = clean(body);
  if (!field.label)
    return Response.json(
      { error: "Field label is required." },
      { status: 400 },
    );
  const { data, error } = await auth.supabase
    .from("custom_field_definitions")
    .insert(snake(field))
    .select()
    .single();
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ field: camel(data) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireStaff(["Admin"]);
  if (auth.error) return auth.error;
  const body = await request.json(),
    id = Number(body.id),
    field = clean(body);
  if (!id || !field.label)
    return Response.json(
      { error: "Field and label are required." },
      { status: 400 },
    );
  const { data, error } = await auth.supabase
    .from("custom_field_definitions")
    .update(snake(field))
    .eq("id", id)
    .select()
    .single();
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ field: camel(data) });
}

export async function DELETE(request: Request) {
  const auth = await requireStaff(["Admin"]);
  if (auth.error) return auth.error;
  const { id } = await request.json();
  const { data, error } = await auth.supabase
    .from("custom_field_definitions")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", Number(id))
    .select()
    .single();
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ field: camel(data) });
}

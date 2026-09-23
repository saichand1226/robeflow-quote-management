import { camel, requireStaff, snake } from "@/lib/api-auth";
const idFrom = async (c: { params: Promise<{ id: string }> }) =>
  Number((await c.params).id);
export async function GET(_: Request, c: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const id = await idFrom(c);
  const [
    { data: quote, error },
    { data: items },
    { data: activities },
    { data: attachments },
    { data: customValues },
  ] = await Promise.all([
    auth.supabase.from("quotes").select("*").eq("id", id).single(),
    auth.supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", id)
      .order("sort_order"),
    auth.supabase
      .from("quote_activities")
      .select("*")
      .eq("quote_id", id)
      .order("created_at"),
    auth.supabase
      .from("quote_attachments")
      .select("*")
      .eq("quote_id", id)
      .order("created_at"),
    auth.supabase
      .from("quote_custom_field_values")
      .select(
        "field_id,value,custom_field_definitions(id,field_key,label,field_type,required,show_new_quote,show_dashboard,show_job_card,active,sort_order)",
      )
      .eq("quote_id", id),
  ]);
  if (error)
    return Response.json({ error: "Quote not found." }, { status: 404 });
  const root = quote.parent_quote_id || quote.id,
    { data: versions } = await auth.supabase
      .from("quotes")
      .select("id,quote_number,revision,amount,status,created_at")
      .or(`id.eq.${root},parent_quote_id.eq.${root}`)
      .order("revision");
  return Response.json({
    quote: {
      ...camel(quote),
      items: (items ?? []).map(camel),
      activities: (activities ?? []).map(camel),
      attachments: (attachments ?? []).map(camel),
      customFields: (customValues ?? [])
        .filter((value: any) => value.custom_field_definitions?.active)
        .map((value: any) =>
          camel({
            ...value.custom_field_definitions,
            field_id: value.field_id,
            value: value.value,
          }),
        ),
      revisions: (versions ?? []).map((v: any) => ({
        ...camel(v),
        changes:
          v.id === root
            ? ["Original quote created"]
            : ["New revision created from the previous version"],
      })),
    },
  });
}
export async function PATCH(
  request: Request,
  c: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(["Admin", "Sales", "Staff"]);
  if (auth.error) return auth.error;
  const id = await idFrom(c),
    b = await request.json(),
    items = (b.items ?? []).filter((i: { category?: string }) =>
      i.category?.trim(),
    );
  const customFields: Record<string, string> = Array.isArray(b.customFields)
    ? Object.fromEntries(
        b.customFields.map((field: { fieldId: number; value: string }) => [
          field.fieldId,
          field.value,
        ]),
      )
    : (b.customFields ?? {});
  const { data: requiredFields } = await auth.supabase
    .from("custom_field_definitions")
    .select("id,label,required")
    .eq("active", true)
    .eq("show_new_quote", true);
  const missing = (requiredFields ?? []).find(
    (field) => field.required && !String(customFields[field.id] ?? "").trim(),
  );
  if (missing)
    return Response.json(
      { error: `${missing.label} is required.` },
      { status: 400 },
    );
  if (
    !b.customerName?.trim() ||
    !b.project?.trim() ||
    !b.validUntil ||
    !items.length
  )
    return Response.json(
      { error: "Please complete all required fields." },
      { status: 400 },
    );
  const servicePrice = Math.max(0, Number(b.servicePrice) || 0),
    discountPercent = Math.min(
      100,
      Math.max(0, Number(b.discountPercent) || 0),
    ),
    subtotal =
      items.reduce(
        (
          s: number,
          i: { quantity?: number; unitPrice?: number; price?: number },
        ) =>
          s +
          Math.max(1, Number(i.quantity) || 1) *
            Math.max(0, Number(i.unitPrice ?? i.price) || 0),
        0,
      ) + servicePrice,
    amount =
      Math.round(
        (subtotal * (1 - discountPercent / 100) + Number.EPSILON) * 100,
      ) / 100;
  const { data: quote, error } = await auth.supabase
    .from("quotes")
    .update(
      snake({
        customerName: b.customerName.trim(),
        companyName: b.companyName ?? "",
        email: b.email ?? "",
        phone: b.phone ?? "",
        customerAddress: b.customerAddress ?? "",
        siteAddress: b.siteAddress ?? "",
        serviceType: b.serviceType ?? "Pick Up",
        servicePrice,
        salespersonName: b.salespersonName || auth.profile.full_name,
        project: b.project.trim(),
        status: b.status ?? "Draft",
        validUntil: b.validUntil,
        followUpDate: b.followUpDate || null,
        discountPercent,
        amount,
      }),
    )
    .eq("id", id)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  await auth.supabase.from("quote_items").delete().eq("quote_id", id);
  const rows = items.map((i: Record<string, unknown>, sortOrder: number) => {
    const quantity = Math.max(1, Number(i.quantity) || 1),
      unitPrice = Math.max(0, Number(i.unitPrice ?? i.price) || 0);
    return snake({
      quoteId: id,
      category: i.category,
      systemType: i.systemType ?? "I-Robe",
      colour: i.colour ?? "Undecided",
      designSelection: i.designSelection ?? "Custom design",
      hardwareColour: i.hardwareColour ?? "Undecided",
      doorConfiguration: i.doorConfiguration ?? "",
      mirrorOption: i.mirrorOption ?? "",
      frameTrackColour: i.frameTrackColour ?? "Undecided",
      quantity,
      unitPrice,
      description: i.description ?? "",
      price: quantity * unitPrice,
      sortOrder,
    });
  });
  await auth.supabase.from("quote_items").insert(rows);
  await auth.supabase
    .from("quote_custom_field_values")
    .delete()
    .eq("quote_id", id);
  const customRows = Object.entries(customFields)
    .filter(([, value]) => String(value).trim() !== "")
    .map(([fieldId, value]) => ({
      quote_id: id,
      field_id: Number(fieldId),
      value: String(value),
    }));
  if (customRows.length)
    await auth.supabase.from("quote_custom_field_values").insert(customRows);
  await auth.supabase.from("quote_activities").insert({
    quote_id: id,
    action: "Quote updated",
    detail: `Status: ${quote.status}`,
    actor: quote.salesperson_name,
  });
  return Response.json({
    quote: {
      ...camel(quote),
      items: rows.map(camel),
      customFields: Object.entries(customFields).map(([fieldId, value]) => ({
        fieldId: Number(fieldId),
        value,
      })),
    },
  });
}
export async function DELETE(
  _: Request,
  c: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(["Admin", "Sales", "Staff"]);
  if (auth.error) return auth.error;
  const id = await idFrom(c);
  const { error } = await auth.supabase
    .from("quotes")
    .update({ archived: true })
    .eq("id", id);
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ success: true, archived: true });
}
export async function POST(_: Request, c: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(["Admin", "Sales", "Staff"]);
  if (auth.error) return auth.error;
  const id = await idFrom(c),
    { data: source } = await auth.supabase
      .from("quotes")
      .select("*")
      .eq("id", id)
      .single();
  if (!source)
    return Response.json({ error: "Quote not found." }, { status: 404 });
  const root = source.parent_quote_id || source.id,
    { data: versions } = await auth.supabase
      .from("quotes")
      .select("revision")
      .or(`id.eq.${root},parent_quote_id.eq.${root}`)
      .order("revision", { ascending: false })
      .limit(1),
    revision = Number(versions?.[0]?.revision || source.revision || 1) + 1,
    copy = {
      ...source,
      id: undefined,
      quote_number: `${String(source.quote_number).replace(/-R\d+$/, "")}-R${revision}`,
      revision,
      parent_quote_id: root,
      status: "Draft",
      emailed_at: null,
      email_id: null,
      created_at: new Date().toISOString(),
      acceptance_token: crypto.randomUUID(),
    };
  delete copy.id;
  const { data: quote, error } = await auth.supabase
    .from("quotes")
    .insert(copy)
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  const { data: items } = await auth.supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", id);
  if (items?.length)
    await auth.supabase.from("quote_items").insert(
      items.map(({ id: _, quote_id: __, ...x }: any) => ({
        ...x,
        quote_id: quote.id,
      })),
    );
  const { data: customValues } = await auth.supabase
    .from("quote_custom_field_values")
    .select("field_id,value")
    .eq("quote_id", id);
  if (customValues?.length)
    await auth.supabase
      .from("quote_custom_field_values")
      .insert(customValues.map((value) => ({ ...value, quote_id: quote.id })));
  await auth.supabase.from("quote_activities").insert({
    quote_id: quote.id,
    action: "Revision created",
    detail: `Revision ${revision} created from ${source.quote_number}`,
    actor: auth.profile.full_name,
  });
  return Response.json({ quote: camel(quote) }, { status: 201 });
}

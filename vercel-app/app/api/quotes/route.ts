import { camel, requireStaff, snake } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const [{ data, error }, { data: fieldValues }] = await Promise.all([
    auth.supabase
      .from("quotes")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false }),
    auth.supabase
      .from("quote_custom_field_values")
      .select(
        "quote_id,value,custom_field_definitions(id,field_key,label,field_type,show_dashboard,show_job_card,active)",
      ),
  ]);
  return error
    ? Response.json({ error: error.message }, { status: 500 })
    : Response.json({
        quotes: (data ?? []).map((row) => {
          const quote = camel(row),
            status =
              quote.invoiceStatus === "To invoice"
                ? "To be Invoiced"
                : quote.invoiceStatus === "Waiting for payment"
                  ? "Awaiting Deposit"
                  : quote.invoiceStatus === "Part paid"
                    ? "Part Paid"
                    : quote.invoiceStatus === "Paid 50%"
                      ? "50% Paid"
                      : quote.invoiceStatus;
          const customFields = (fieldValues ?? [])
            .filter(
              (value: any) =>
                value.quote_id === row.id &&
                value.custom_field_definitions?.active,
            )
            .map((value: any) =>
              camel({
                field_id: value.custom_field_definitions.id,
                field_key: value.custom_field_definitions.field_key,
                label: value.custom_field_definitions.label,
                field_type: value.custom_field_definitions.field_type,
                show_dashboard: value.custom_field_definitions.show_dashboard,
                show_job_card: value.custom_field_definitions.show_job_card,
                value: value.value,
              }),
            );
          return { ...quote, invoiceStatus: status, customFields };
        }),
      });
}

export async function POST(request: Request) {
  const auth = await requireStaff(["Admin", "Sales", "Staff"]);
  if (auth.error) return auth.error;
  const b = await request.json();
  const { data: customDefinitions } = await auth.supabase
    .from("custom_field_definitions")
    .select("id,label,required")
    .eq("active", true)
    .eq("show_new_quote", true);
  const customFields: Record<string, string> = Array.isArray(b.customFields)
    ? Object.fromEntries(
        b.customFields.map((field: { fieldId: number; value: string }) => [
          field.fieldId,
          field.value,
        ]),
      )
    : (b.customFields ?? {});
  const missing = (customDefinitions ?? []).find(
    (field) => field.required && !String(customFields[field.id] ?? "").trim(),
  );
  if (missing)
    return Response.json(
      { error: `${missing.label} is required.` },
      { status: 400 },
    );
  const items = (b.items ?? []).filter((item: { category?: string }) =>
    item.category?.trim(),
  );
  if (
    !b.customerName?.trim() ||
    !b.project?.trim() ||
    !b.validUntil ||
    !items.length
  )
    return Response.json(
      {
        error:
          "Please complete the customer, project, categories and valid-until date.",
      },
      { status: 400 },
    );
  let customerId = b.customerId;
  if (!customerId) {
    const { data, error } = await auth.supabase
      .from("customers")
      .insert(
        snake({
          name: b.customerName.trim(),
          companyName: b.companyName?.trim() ?? "",
          email: b.email?.trim() ?? "",
          phone: b.phone?.trim() ?? "",
          address: b.customerAddress?.trim() ?? "",
          siteAddress: b.siteAddress?.trim() ?? "",
        }),
      )
      .select()
      .single();
    if (error) return Response.json({ error: error.message }, { status: 400 });
    customerId = data.id;
  }
  const servicePrice = Math.max(0, Number(b.servicePrice) || 0),
    discountPercent = Math.min(
      100,
      Math.max(0, Number(b.discountPercent) || 0),
    );
  const subtotal =
    items.reduce(
      (
        sum: number,
        item: { quantity?: number; unitPrice?: number; price?: number },
      ) =>
        sum +
        Math.max(1, Number(item.quantity) || 1) *
          Math.max(0, Number(item.unitPrice ?? item.price) || 0),
      0,
    ) + servicePrice;
  const amount =
    Math.round(
      (subtotal * (1 - discountPercent / 100) + Number.EPSILON) * 100,
    ) / 100;
  const { data: numbers } = await auth.supabase
    .from("quotes")
    .select("quote_number");
  const nextNumber =
      Math.max(
        1059,
        ...(numbers ?? [])
          .map(
            (row) =>
              String(row.quote_number).match(/^QU-(\d+)(?:-R\d+)?$/i)?.[1],
          )
          .filter(Boolean)
          .map(Number),
      ) + 1,
    quoteNumber = `QU-${nextNumber}`;
  const { data: quote, error } = await auth.supabase
    .from("quotes")
    .insert(
      snake({
        quoteNumber,
        customerId,
        customerName: b.customerName.trim(),
        companyName: b.companyName?.trim() ?? "",
        email: b.email?.trim() ?? "",
        phone: b.phone?.trim() ?? "",
        customerAddress: b.customerAddress?.trim() ?? "",
        siteAddress: b.siteAddress?.trim() ?? "",
        serviceType: b.serviceType ?? "Pick Up",
        servicePrice,
        salespersonName: b.salespersonName?.trim() || auth.profile.full_name,
        project: b.project.trim(),
        amount,
        status: b.status ?? "Draft",
        validUntil: b.validUntil,
        followUpDate: b.followUpDate || null,
        discountPercent,
      }),
    )
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  const rows = items.map((item: Record<string, unknown>, index: number) => {
    const quantity = Math.max(1, Number(item.quantity) || 1),
      unitPrice = Math.max(0, Number(item.unitPrice ?? item.price) || 0);
    return snake({
      quoteId: quote.id,
      category: String(item.category).trim(),
      systemType: item.systemType ?? "I-Robe",
      colour: item.colour ?? "Undecided",
      designSelection: item.designSelection ?? "Custom design",
      hardwareColour: item.hardwareColour ?? "Undecided",
      doorConfiguration: item.doorConfiguration ?? "",
      mirrorOption: item.mirrorOption ?? "",
      frameTrackColour: item.frameTrackColour ?? "Undecided",
      quantity,
      unitPrice,
      description: item.description ?? "",
      price: Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100,
      sortOrder: index,
    });
  });
  const { error: itemError } = await auth.supabase
    .from("quote_items")
    .insert(rows);
  if (itemError)
    return Response.json({ error: itemError.message }, { status: 400 });
  const customRows = Object.entries(customFields)
    .filter(([, value]) => String(value).trim() !== "")
    .map(([fieldId, value]) => ({
      quote_id: quote.id,
      field_id: Number(fieldId),
      value: String(value),
    }));
  if (customRows.length) {
    const { error: customError } = await auth.supabase
      .from("quote_custom_field_values")
      .insert(customRows);
    if (customError)
      return Response.json({ error: customError.message }, { status: 400 });
  }
  await auth.supabase.from("quote_activities").insert({
    quote_id: quote.id,
    action: "Quote created",
    detail: "Draft quotation created",
    actor: b.salespersonName?.trim() || auth.profile.full_name,
  });
  return Response.json({ quote: camel(quote) }, { status: 201 });
}

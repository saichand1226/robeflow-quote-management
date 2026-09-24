import { camel, requireStaff } from "@/lib/api-auth";
const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
  "application/acad",
  "application/dxf",
]);
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(["Admin", "Sales", "Staff"]);
  if (auth.error) return auth.error;
  const id = Number((await params).id),
    form = await request.formData(),
    file = form.get("file");
  if (!(file instanceof File) || !file.size)
    return Response.json({ error: "Choose a file." }, { status: 400 });
  if (file.size > 15 * 1024 * 1024)
    return Response.json(
      { error: "Files must be 15 MB or smaller." },
      { status: 413 },
    );
  if (file.type && !allowedTypes.has(file.type))
    return Response.json(
      {
        error:
          "This file type is not allowed. Use PDF, an image, Excel, DWG or DXF.",
      },
      { status: 415 },
    );
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
    objectKey = `quotes/${id}/${crypto.randomUUID()}-${safe}`,
    upload = await auth.supabase.storage
      .from("robeflow-files")
      .upload(objectKey, await file.arrayBuffer(), {
        contentType: file.type || "application/octet-stream",
      });
  if (upload.error)
    return Response.json({ error: upload.error.message }, { status: 400 });
  const { data, error } = await auth.supabase
    .from("quote_attachments")
    .insert({
      quote_id: id,
      file_name: file.name,
      content_type: file.type || "application/octet-stream",
      size: file.size,
      object_key: objectKey,
    })
    .select()
    .single();
  if (error) {
    await auth.supabase.storage.from("robeflow-files").remove([objectKey]);
    return Response.json({ error: error.message }, { status: 400 });
  }
  await auth.supabase
    .from("quote_activities")
    .insert({
      quote_id: id,
      action: "File uploaded",
      detail: file.name,
      actor: auth.profile.full_name,
    });
  return Response.json({ attachment: camel(data) }, { status: 201 });
}

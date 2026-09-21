import { requireStaff } from "@/lib/api-auth";

export async function GET(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const { data } = await auth.supabase
    .from("quote_attachments")
    .select("object_key")
    .eq("id", Number((await params).documentId))
    .like("object_key", "pick-lists/%")
    .single();
  if (!data) return new Response("Pick list workbook not found.", { status: 404 });
  const { data: signed, error } = await auth.supabase.storage.from("robeflow-files").createSignedUrl(data.object_key, 300);
  if (error || !signed?.signedUrl) return new Response(error?.message || "The workbook could not be opened.", { status: 404 });
  const viewer = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(signed.signedUrl)}`;
  return Response.redirect(viewer, 302);
}

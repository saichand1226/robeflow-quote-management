import { requireStaff } from "@/lib/api-auth";
import {
  defaultJobCardFields,
  jobCardFieldOptions,
  type JobCardFieldKey,
} from "@/lib/job-card-fields";

const allowed = new Set<string>(jobCardFieldOptions.map((field) => field.key));

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  const { data, error } = await auth.supabase
    .from("job_card_preferences")
    .select("visible_fields")
    .eq("id", 1)
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({
    visibleFields: (data?.visible_fields ?? defaultJobCardFields).filter(
      (field: string) => allowed.has(field),
    ),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireStaff(["Admin"]);
  if (auth.error) return auth.error;
  const body = await request.json();
  const visibleFields = Array.isArray(body.visibleFields)
    ? ([
        ...new Set(
          body.visibleFields.filter((field: string) => allowed.has(field)),
        ),
      ] as JobCardFieldKey[])
    : defaultJobCardFields;
  const { data, error } = await auth.supabase
    .from("job_card_preferences")
    .upsert({
      id: 1,
      visible_fields: visibleFields,
      updated_at: new Date().toISOString(),
    })
    .select("visible_fields")
    .single();
  return error
    ? Response.json({ error: error.message }, { status: 400 })
    : Response.json({ visibleFields: data.visible_fields });
}

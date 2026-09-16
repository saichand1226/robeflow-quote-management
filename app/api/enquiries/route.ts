import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { enquiries, enquiryAttachments } from "../../../db/schema";
import { requireOwnerApi } from "../../api-auth";

export async function GET() {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const db = getDb();
  const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt));
  const attachments = await db.select({ id: enquiryAttachments.id, enquiryId: enquiryAttachments.enquiryId, fileName: enquiryAttachments.fileName, size: enquiryAttachments.size }).from(enquiryAttachments);
  return Response.json({ enquiries: rows.map(row => ({ ...row, attachments: attachments.filter(file => file.enquiryId === row.id) })) });
}

export async function PATCH(request: Request) {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const body = await request.json() as { id?: number; status?: string; salespersonName?: string };
  const allowed = ["New","In progress","Quoted","Closed"];
  if (!body.id || !body.status || !allowed.includes(body.status)) return Response.json({ error: "Invalid enquiry status." }, { status: 400 });
  const [enquiry] = await getDb().update(enquiries).set({ status: body.status, salespersonName: body.salespersonName?.trim()??"" }).where(eq(enquiries.id, body.id)).returning();
  return enquiry ? Response.json({ enquiry }) : Response.json({ error: "Enquiry not found." }, { status: 404 });
}

import { env } from "cloudflare:workers";
import { eq, or } from "drizzle-orm";
import { getDb } from "../../../../db";
import { customers, enquiries, enquiryAttachments } from "../../../../db/schema";

export async function POST(request: Request) {
  const form = await request.formData();
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const name = text("name"), email = text("email"), phone = text("phone");
  if (!name || !email || !phone) return Response.json({ error: "Please add your name, email and phone number." }, { status: 400 });
  const files = form.getAll("plans").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.some(file => file.size > 15 * 1024 * 1024)) return Response.json({ error: "Each plan must be 15 MB or smaller." }, { status: 413 });
  const db = getDb();
  const [existingCustomer] = await db.select({ id: customers.id }).from(customers).where(or(eq(customers.email,email),eq(customers.phone,phone))).limit(1);
  if (!existingCustomer) await db.insert(customers).values({ name, email, phone, companyName:text("companyName"), address:text("address"), siteAddress:text("siteAddress") });
  const [enquiry] = await db.insert(enquiries).values({ name, email, phone, companyName:text("companyName"), address:text("address"), siteAddress:text("siteAddress"), projectType:text("projectType")||"Wardrobes", areas:text("areas"), preferredColour:text("preferredColour"), timeframe:text("timeframe"), notes:text("notes") }).returning();
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `enquiries/${enquiry.id}/${crypto.randomUUID()}-${safeName}`;
    await env.BUCKET.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    await db.insert(enquiryAttachments).values({ enquiryId: enquiry.id, fileName: file.name, contentType: file.type || "application/octet-stream", size: file.size, objectKey });
  }
  return Response.json({ success: true, reference: `ENQ-${String(enquiry.id).padStart(4,"0")}` }, { status: 201 });
}

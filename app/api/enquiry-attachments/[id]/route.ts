import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { enquiryAttachments } from "../../../../db/schema";
import { requireOwnerApi } from "../../../api-auth";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const id = Number((await context.params).id);
  const [attachment] = await getDb().select().from(enquiryAttachments).where(eq(enquiryAttachments.id, id)).limit(1);
  if (!attachment) return new Response("Attachment not found.", { status: 404 });
  const object = await env.BUCKET.get(attachment.objectKey);
  if (!object) return new Response("File not found.", { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": attachment.contentType, "Content-Disposition": `attachment; filename="${attachment.fileName.replaceAll('"', '')}"` } });
}

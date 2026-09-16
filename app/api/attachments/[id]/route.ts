import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { quoteAttachments } from "../../../../db/schema";
import { requireOwnerApi } from "../../../api-auth";

async function findAttachment(context: { params: Promise<{ id: string }> }) {
  const id = Number((await context.params).id);
  const [attachment] = await getDb().select().from(quoteAttachments).where(eq(quoteAttachments.id, id)).limit(1);
  return attachment;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const attachment = await findAttachment(context);
  if (!attachment) return new Response("Attachment not found.", { status: 404 });
  const object = await env.BUCKET.get(attachment.objectKey);
  if (!object) return new Response("File not found.", { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": attachment.contentType, "Content-Disposition": `attachment; filename="${attachment.fileName.replaceAll('"', '')}"` } });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const attachment = await findAttachment(context);
  if (!attachment) return Response.json({ error: "Attachment not found." }, { status: 404 });
  await env.BUCKET.delete(attachment.objectKey);
  await getDb().delete(quoteAttachments).where(eq(quoteAttachments.id, attachment.id));
  return Response.json({ success: true });
}

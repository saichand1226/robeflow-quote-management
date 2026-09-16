import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { quoteAttachments, quotes } from "../../../../../db/schema";
import { requireOwnerApi } from "../../../../api-auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const quoteId = Number((await context.params).id);
  const [quote] = await getDb().select({ id: quotes.id }).from(quotes).where(eq(quotes.id, quoteId)).limit(1);
  if (!quote) return Response.json({ error: "Quote not found." }, { status: 404 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) return Response.json({ error: "Choose a file to upload." }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return Response.json({ error: "Files must be 15 MB or smaller." }, { status: 413 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = `quotes/${quoteId}/${crypto.randomUUID()}-${safeName}`;
  await env.BUCKET.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
  const [attachment] = await getDb().insert(quoteAttachments).values({ quoteId, fileName: file.name, contentType: file.type || "application/octet-stream", size: file.size, objectKey }).returning();
  return Response.json({ attachment: { id: attachment.id, fileName: attachment.fileName, contentType: attachment.contentType, size: attachment.size, createdAt: attachment.createdAt } }, { status: 201 });
}

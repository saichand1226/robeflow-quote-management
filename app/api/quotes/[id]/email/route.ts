import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { quoteActivities, quoteAttachments, quoteItems, quotes } from "../../../../../db/schema";
import { createQuotePdf } from "../../../../../lib/quote-pdf";
import { requireOwnerApi } from "../../../../api-auth";

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
function base64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  return btoa(binary);
}

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const id = Number((await context.params).id), db = getDb();
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  if (!quote) return Response.json({ error: "Quote not found." }, { status: 404 });
  if (!quote.email?.trim() || !/^\S+@\S+\.\S+$/.test(quote.email)) return Response.json({ error: "Add a valid customer email address before sending." }, { status: 400 });
  const responseToken=quote.acceptanceToken||crypto.randomUUID();
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)).orderBy(quoteItems.sortOrder);
  const files = await db.select().from(quoteAttachments).where(eq(quoteAttachments.quoteId, id));
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_ATTACHMENT_BYTES) return Response.json({ error: "The drawings exceed the 25 MB email limit. Remove or reduce a file, then try again." }, { status: 413 });
  const pdf = await createQuotePdf({ ...quote, items });
  const attachments: { filename: string; content: string; content_type: string }[] = [{ filename: `${quote.quoteNumber}.pdf`, content: base64(pdf), content_type: "application/pdf" }];
  for (const file of files) {
    const object = await env.BUCKET.get(file.objectKey);
    if (!object) return Response.json({ error: `Drawing ${file.fileName} could not be found.` }, { status: 404 });
    attachments.push({ filename: file.fileName, content: base64(new Uint8Array(await object.arrayBuffer())), content_type: file.contentType });
  }
  const runtime = env as unknown as { RESEND_API_KEY?: string; QUOTE_EMAIL_FROM?: string; QUOTE_EMAIL_REPLY_TO?: string };
  if (!runtime.RESEND_API_KEY) return Response.json({ error: "Email service is not configured." }, { status: 503 });
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${runtime.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({
    from: runtime.QUOTE_EMAIL_FROM || "RobeFlow <onboarding@resend.dev>",
    to: [quote.email.trim()], reply_to: runtime.QUOTE_EMAIL_REPLY_TO,
    subject: `${quote.quoteNumber} - ${quote.project}`,
    html: `<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h2 style="color:#047857">Your wardrobe quotation</h2><p>Hi ${quote.customerName.replace(/[<>&]/g, "")},</p><p>Thank you for the opportunity to provide a quotation for <strong>${quote.project.replace(/[<>&]/g, "")}</strong>.</p><p>Your quotation is attached as a PDF.${files.length ? ` We have also attached ${files.length} design ${files.length === 1 ? "drawing" : "drawings"}.` : ""}</p><p><a href="https://sai-quote-manager.saichandreddy.chatgpt.site/quote-response/${responseToken}" style="display:inline-block;background:#047857;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">View and respond to quote</a></p><p>You can accept or decline, add a purchase-order number, and leave a comment securely online.</p><p>Kind regards,<br><strong>${(quote.salespersonName||"Sai Muddasani").replace(/[<>&]/g, "")}</strong><br>RobeFlow Wardrobes</p></div>`,
    text: `Hi ${quote.customerName},\n\nThank you for the opportunity to provide a quotation for ${quote.project}. Your quotation is attached as a PDF.${files.length ? ` We have also attached ${files.length} design ${files.length === 1 ? "drawing" : "drawings"}.` : ""}\n\nView and respond: https://sai-quote-manager.saichandreddy.chatgpt.site/quote-response/${responseToken}\n\nKind regards,\n${quote.salespersonName||"Sai Muddasani"}\nRobeFlow Wardrobes`,
    attachments,
  }) });
  const result = await response.json() as { id?: string; message?: string; error?: { message?: string } };
  if (!response.ok || !result.id) return Response.json({ error: result.message || result.error?.message || "The email could not be sent." }, { status: 502 });
  const emailedAt = new Date().toISOString();
  const [updated] = await db.update(quotes).set({ status: "Sent", emailedAt, emailId: result.id, acceptanceToken:responseToken }).where(eq(quotes.id, id)).returning();
  await db.insert(quoteActivities).values({quoteId:id,action:"Quote emailed",detail:`Sent to ${quote.email}`,actor:quote.salespersonName});
  return Response.json({ success: true, emailedAt, emailId: result.id, quote: { ...updated, items, attachments: files.map(file => ({ id: file.id, fileName: file.fileName, contentType: file.contentType, size: file.size, createdAt: file.createdAt })) } });
}

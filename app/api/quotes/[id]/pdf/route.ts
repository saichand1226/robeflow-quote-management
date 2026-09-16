import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { quoteItems, quotes } from "../../../../../db/schema";
import { createQuotePdf } from "../../../../../lib/quote-pdf";
import { requireRolesApi } from "../../../../api-auth";

export async function GET(_:Request,context:{params:Promise<{id:string}>}){const denied=await requireRolesApi(["Accounts","Operations","Sales","Staff"]);if(denied)return denied;const id=Number((await context.params).id),db=getDb(),[quote]=await db.select().from(quotes).where(eq(quotes.id,id)).limit(1);if(!quote)return Response.json({error:"Quote not found."},{status:404});const items=await db.select().from(quoteItems).where(eq(quoteItems.quoteId,id)).orderBy(quoteItems.sortOrder),pdf=await createQuotePdf({...quote,items});return new Response(pdf as Uint8Array<ArrayBuffer>,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${quote.quoteNumber}.pdf"`}})}

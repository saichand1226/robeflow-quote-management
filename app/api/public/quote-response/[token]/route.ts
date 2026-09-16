import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { quoteActivities, quoteItems, quotes } from "../../../../../db/schema";

async function token(context:{params:Promise<{token:string}>}){return (await context.params).token}
export async function GET(_:Request,context:{params:Promise<{token:string}>}){
 const value=await token(context),db=getDb();
 const [quote]=await db.select().from(quotes).where(eq(quotes.acceptanceToken,value)).limit(1);
 if(!quote)return Response.json({error:"Quotation not found."},{status:404});
 const items=await db.select().from(quoteItems).where(eq(quoteItems.quoteId,quote.id)).orderBy(quoteItems.sortOrder);
 return Response.json({quote:{quoteNumber:quote.quoteNumber,customerName:quote.customerName,project:quote.project,amount:quote.amount,validUntil:quote.validUntil,status:quote.status,items}});
}
export async function POST(request:Request,context:{params:Promise<{token:string}>}){
 const value=await token(context),body=await request.json() as {decision?:string;purchaseOrderNumber?:string;comment?:string};
 if(!["Accepted","Declined"].includes(body.decision??""))return Response.json({error:"Choose accept or decline."},{status:400});
 const db=getDb(),[source]=await db.select().from(quotes).where(eq(quotes.acceptanceToken,value)).limit(1);
 if(!source)return Response.json({error:"Quotation not found."},{status:404});
 const accepted=body.decision==="Accepted";
 const [quote]=await db.update(quotes).set({status:body.decision!,purchaseOrderNumber:body.purchaseOrderNumber?.trim()??"",customerComment:body.comment?.trim()??"",acceptedAt:accepted?new Date().toISOString():null,jobStage:accepted?"Site measure required":"Awaiting acceptance"}).where(eq(quotes.id,source.id)).returning();
 await db.insert(quoteActivities).values({quoteId:source.id,action:`Customer ${body.decision!.toLowerCase()}`,detail:body.comment?.trim()||"Online response received",actor:source.customerName});
 return Response.json({success:true,status:quote.status});
}

import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { paymentTransactions, quoteActivities, quotes } from "../../../db/schema";
import { requireRolesApi } from "../../api-auth";

export async function GET(request:Request){
 const denied=await requireRolesApi(["Accounts","Staff"]);if(denied)return denied;
 const quoteId=Number(new URL(request.url).searchParams.get("quoteId"));if(!quoteId)return Response.json({error:"Quote is required."},{status:400});
 return Response.json({payments:await getDb().select().from(paymentTransactions).where(eq(paymentTransactions.quoteId,quoteId)).orderBy(asc(paymentTransactions.paymentDate),asc(paymentTransactions.createdAt))});
}
export async function POST(request:Request){
 const denied=await requireRolesApi(["Accounts","Staff"]);if(denied)return denied;
 const body=await request.json() as {quoteId?:number;amount?:number;paymentDate?:string;method?:string;reference?:string;notes?:string;recordedBy?:string};
 const amount=Math.round((Number(body.amount)+Number.EPSILON)*100)/100;if(!body.quoteId||!Number.isFinite(amount)||amount<=0||!body.paymentDate)return Response.json({error:"Enter a payment amount and date."},{status:400});
 const db=getDb(),[quote]=await db.select().from(quotes).where(eq(quotes.id,body.quoteId)).limit(1);if(!quote)return Response.json({error:"Invoice not found."},{status:404});
 const existing=await db.select().from(paymentTransactions).where(eq(paymentTransactions.quoteId,body.quoteId)),paid=existing.reduce((sum,p)=>sum+p.amount,0);
 if(paid+amount>quote.amount+0.009)return Response.json({error:`Payment is more than the remaining balance of $${Math.max(0,quote.amount-paid).toFixed(2)}.`},{status:400});
 const [payment]=await db.insert(paymentTransactions).values({quoteId:body.quoteId,amount,paymentDate:body.paymentDate,method:body.method?.trim()||"Bank transfer",reference:body.reference?.trim()??"",notes:body.notes?.trim()??"",recordedBy:body.recordedBy?.trim()||"RobeFlow"}).returning();
 const totalPaid=Math.round((paid+amount+Number.EPSILON)*100)/100,invoiceStatus=totalPaid>=quote.amount?"Paid in Full":"Part paid";
 await db.update(quotes).set({invoiceStatus}).where(eq(quotes.id,body.quoteId));
 await db.insert(quoteActivities).values({quoteId:body.quoteId,action:"Payment recorded",detail:`$${amount.toFixed(2)} · ${payment.method}${payment.reference?` · ${payment.reference}`:""}`,actor:payment.recordedBy});
 return Response.json({payment,totalPaid,balance:Math.max(0,quote.amount-totalPaid),invoiceStatus},{status:201});
}
export async function DELETE(request:Request){
 const denied=await requireRolesApi(["Accounts"]);if(denied)return denied;const {id}=await request.json() as {id?:number};if(!id)return Response.json({error:"Payment is required."},{status:400});
 const db=getDb(),[payment]=await db.select().from(paymentTransactions).where(eq(paymentTransactions.id,id)).limit(1);if(!payment)return Response.json({error:"Payment not found."},{status:404});
 await db.delete(paymentTransactions).where(eq(paymentTransactions.id,id));const [quote]=await db.select().from(quotes).where(eq(quotes.id,payment.quoteId)).limit(1),remaining=await db.select().from(paymentTransactions).where(eq(paymentTransactions.quoteId,payment.quoteId)),paid=remaining.reduce((sum,p)=>sum+p.amount,0);
 if(quote)await db.update(quotes).set({invoiceStatus:paid<=0?"Waiting for payment":paid>=quote.amount?"Paid in Full":"Part paid"}).where(eq(quotes.id,payment.quoteId));return Response.json({success:true});
}

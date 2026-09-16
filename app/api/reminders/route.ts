import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { paymentTransactions, quotes } from "../../../db/schema";
import { requireOwnerApi } from "../../api-auth";

export async function GET(){
 const denied=await requireOwnerApi();if(denied)return denied;const db=getDb(),all=await db.select().from(quotes).where(eq(quotes.archived,false)),payments=await db.select().from(paymentTransactions),today=new Date().toISOString().slice(0,10),soon=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
 const paidByQuote=new Map<number,number>();for(const payment of payments)paidByQuote.set(payment.quoteId,(paidByQuote.get(payment.quoteId)||0)+payment.amount);
 const reminders=all.flatMap(q=>{const items:{id:string;type:string;urgency:string;quoteId:number;quoteNumber:string;customerName:string;message:string;date:string}[]=[];
  if(q.status==="Sent"&&q.validUntil<=soon)items.push({id:`quote-${q.id}`,type:"Quote",urgency:q.validUntil<today?"Overdue":"Due soon",quoteId:q.id,quoteNumber:q.quoteNumber,customerName:q.customerName,message:q.validUntil<today?"Quote has expired":"Quote expires within 7 days",date:q.validUntil});
  const paid=paidByQuote.get(q.id)||0;if(q.status==="Accepted"&&q.invoiceSentAt&&paid<q.amount)items.push({id:`invoice-${q.id}`,type:"Invoice",urgency:"Payment due",quoteId:q.id,quoteNumber:q.quoteNumber,customerName:q.customerName,message:`$${Math.max(0,q.amount-paid).toFixed(2)} remains unpaid`,date:q.invoiceSentAt.slice(0,10)});
  return items});
 return Response.json({reminders:reminders.sort((a,b)=>a.date.localeCompare(b.date))});
}

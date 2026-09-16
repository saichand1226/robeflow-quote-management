import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { paymentTransactions, quotes } from "../../../db/schema";
import { requireRolesApi } from "../../api-auth";

export async function GET() {
  const denied = await requireRolesApi(["Accounts","Staff"]); if (denied) return denied;
  const db=getDb(),rows = await db.select().from(quotes).where(eq(quotes.status,"Accepted")).orderBy(desc(quotes.createdAt)),payments=await db.select().from(paymentTransactions).orderBy(desc(paymentTransactions.paymentDate),desc(paymentTransactions.createdAt));
  return Response.json({ invoices: rows.map(invoice=>({...invoice,payments:payments.filter(payment=>payment.quoteId===invoice.id),totalPaid:payments.filter(payment=>payment.quoteId===invoice.id).reduce((sum,payment)=>sum+payment.amount,0)})) });
}

export async function PATCH(request: Request) {
  const denied = await requireRolesApi(["Accounts","Staff"]); if (denied) return denied;
  const body = await request.json() as { id?: number; invoiceNumber?: string; invoiceStatus?: string; paymentNote?: string };
  const allowed=["To invoice","Waiting for payment","Part paid","Paid 50%","Paid in Full","Account","Manual message"];
  if (!body.id || !allowed.includes(body.invoiceStatus??"")) return Response.json({ error: "Invalid invoice update." }, { status: 400 });
  if (body.invoiceStatus !== "To invoice" && !body.invoiceNumber?.trim()) return Response.json({ error: "Enter the Xero invoice number first." }, { status: 400 });
  if (body.invoiceStatus === "Manual message" && !body.paymentNote?.trim()) return Response.json({ error: "Enter the manual payment message." }, { status: 400 });
  const changes:{invoiceNumber:string;invoiceStatus:string;paymentNote:string;invoiceSentAt?:string|null}={invoiceNumber:body.invoiceNumber?.trim()??"",invoiceStatus:body.invoiceStatus!,paymentNote:body.paymentNote?.trim()??""};
  if(body.invoiceStatus==="Waiting for payment")changes.invoiceSentAt=new Date().toISOString();
  if(body.invoiceStatus==="To invoice")changes.invoiceSentAt=null;
  const [quote] = await getDb().update(quotes).set(changes).where(eq(quotes.id,body.id)).returning();
  return quote?Response.json({ invoice:quote }):Response.json({ error:"Quote not found." },{status:404});
}

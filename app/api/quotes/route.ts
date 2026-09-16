import { desc,eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { customers, quoteActivities, quoteItems, quotes } from "../../../db/schema";
import { requireOwnerApi } from "../../api-auth";

export async function GET() {
  const denied = await requireOwnerApi(); if (denied) return denied;
  return Response.json({ quotes: await getDb().select().from(quotes).where(eq(quotes.archived,false)).orderBy(desc(quotes.createdAt)) });
}
export async function POST(request: Request) {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const body = await request.json() as { customerId?: number; customerName?: string; companyName?: string; email?: string; phone?: string; customerAddress?: string; siteAddress?: string; serviceType?: string; servicePrice?: number; salespersonName?: string; project?: string; status?: string; validUntil?: string; followUpDate?:string; discountPercent?:number; items?: { category?: string; systemType?: string; colour?: string; designSelection?:string; hardwareColour?:string; doorConfiguration?:string; mirrorOption?:string; price?: number; quantity?:number; unitPrice?:number; description?:string }[] };
  const items = (body.items ?? []).filter(item => item.category?.trim() && Number(item.price) >= 0);
  const servicePrice = Math.max(0,Number(body.servicePrice)||0);
  const discountPercent=Math.min(100,Math.max(0,Number(body.discountPercent)||0));
  const subtotal = items.reduce((total, item) => total + Math.max(1,Number(item.quantity)||1) * Math.max(0,Number(item.unitPrice??item.price)||0), 0) + servicePrice;
  const amount=Math.round((subtotal*(1-discountPercent/100)+Number.EPSILON)*100)/100;
  if (!body.customerName?.trim() || !body.project?.trim() || !items.length || !body.validUntil) return Response.json({ error: "Please complete the customer, project, categories and valid-until date." }, { status: 400 });
  const db = getDb();
  let customerId = body.customerId;
  if (!customerId) {
    const [customer] = await db.insert(customers).values({ name: body.customerName.trim(), companyName: body.companyName?.trim()??"", email: body.email?.trim()??"", phone: body.phone?.trim()??"", address: body.customerAddress?.trim()??"", siteAddress: body.siteAddress?.trim()??"" }).returning();
    customerId = customer.id;
  }
  const [quote] = await db.insert(quotes).values({ quoteNumber: `Q-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`, customerId, customerName: body.customerName.trim(), companyName: body.companyName?.trim()??"", email: body.email?.trim()??"", phone: body.phone?.trim()??"", customerAddress: body.customerAddress?.trim()??"", siteAddress: body.siteAddress?.trim()??"", serviceType:body.serviceType??"Pick Up", servicePrice, salespersonName:body.salespersonName?.trim()||"Sai Muddasani", project: body.project.trim(), amount, status: body.status ?? "Draft", validUntil: body.validUntil, acceptanceToken:crypto.randomUUID(),followUpDate:body.followUpDate??"",discountPercent }).returning();
  await db.insert(quoteItems).values(items.map((item, index) => {const quantity=Math.max(1,Number(item.quantity)||1),unitPrice=Math.max(0,Number(item.unitPrice??item.price)||0);return { quoteId: quote.id, category: item.category!.trim(), systemType: item.systemType??"I-Robe", colour: item.colour??"Undecided", designSelection:item.designSelection??"Custom design", hardwareColour:item.hardwareColour??"Undecided", doorConfiguration:item.doorConfiguration??"", mirrorOption:item.mirrorOption??"", quantity,unitPrice,description:item.description?.trim()??"",price:Math.round((quantity*unitPrice+Number.EPSILON)*100)/100, sortOrder: index }}));
  await db.insert(quoteActivities).values({quoteId:quote.id,action:"Quote created",detail:"Draft quotation created",actor:quote.salespersonName});
  return Response.json({ quote }, { status: 201 });
}

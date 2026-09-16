import { asc, eq, or } from "drizzle-orm";
import { getDb } from "../../../../db";
import { quoteActivities, quoteAttachments, quoteItems, quotes } from "../../../../db/schema";
import { requireOwnerApi } from "../../../api-auth";

type Payload = {
  customerName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  customerAddress?: string;
  siteAddress?: string;
  serviceType?: string;
  servicePrice?: number;
  salespersonName?: string;
  project?: string;
  status?: string;
  validUntil?: string;
  followUpDate?: string;
  discountPercent?: number;
  items?: { category?: string; systemType?: string; colour?: string; designSelection?:string; hardwareColour?:string; doorConfiguration?:string; mirrorOption?:string; price?: number; quantity?:number; unitPrice?:number; description?:string }[];
};

async function quoteId(context: { params: Promise<{ id: string }> }) {
  return Number((await context.params).id);
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const id = await quoteId(context);
  const db = getDb();
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  if (!quote) return Response.json({ error: "Quote not found." }, { status: 404 });
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)).orderBy(quoteItems.sortOrder);
  const attachments = await db.select({ id: quoteAttachments.id, fileName: quoteAttachments.fileName, contentType: quoteAttachments.contentType, size: quoteAttachments.size, createdAt: quoteAttachments.createdAt }).from(quoteAttachments).where(eq(quoteAttachments.quoteId, id));
  const activities=await db.select().from(quoteActivities).where(eq(quoteActivities.quoteId,id)).orderBy(quoteActivities.createdAt);
  const rootId=quote.parentQuoteId||quote.id;
  const family=await db.select().from(quotes).where(or(eq(quotes.id,rootId),eq(quotes.parentQuoteId,rootId))).orderBy(asc(quotes.revision));
  const versions=await Promise.all(family.map(async version=>({quote:version,items:await db.select().from(quoteItems).where(eq(quoteItems.quoteId,version.id)).orderBy(quoteItems.sortOrder)})));
  const revisions=versions.map((version,index)=>({id:version.quote.id,quoteNumber:version.quote.quoteNumber,revision:version.quote.revision,amount:version.quote.amount,status:version.quote.status,createdAt:version.quote.createdAt,changes:index===0?["Original quote created"]:revisionChanges(versions[index-1],version)}));
  return Response.json({ quote: { ...quote, items, attachments, activities, revisions } });
}

type Version={quote:typeof quotes.$inferSelect;items:(typeof quoteItems.$inferSelect)[]};
function revisionChanges(previous:Version,current:Version){
  const changes:string[]=[],labels:[keyof Version["quote"],string][]=[["customerName","Customer"],["project","Project"],["siteAddress","Site address"],["serviceType","Service"],["servicePrice","Service price"],["salespersonName","Salesperson"],["validUntil","Valid until"],["discountPercent","Discount"],["amount","Total"]];
  for(const [key,label] of labels)if(previous.quote[key]!==current.quote[key])changes.push(`${label}: ${display(previous.quote[key])} → ${display(current.quote[key])}`);
  const itemLabels:{key:keyof Version["items"][number];label:string}[]=[{key:"category",label:"area name"},{key:"systemType",label:"system"},{key:"colour",label:"colour"},{key:"designSelection",label:"design"},{key:"hardwareColour",label:"hardware"},{key:"doorConfiguration",label:"door configuration"},{key:"mirrorOption",label:"mirror"},{key:"quantity",label:"quantity"},{key:"unitPrice",label:"unit price"},{key:"description",label:"description"}];
  for(let i=0;i<Math.max(previous.items.length,current.items.length);i++){
    const before=previous.items[i],after=current.items[i];
    if(!before&&after){changes.push(`Added area: ${after.category}`);continue}if(before&&!after){changes.push(`Removed area: ${before.category}`);continue}if(!before||!after)continue;
    for(const field of itemLabels)if(before[field.key]!==after[field.key])changes.push(`${after.category}: ${field.label} ${display(before[field.key])} → ${display(after[field.key])}`);
  }
  return changes.length?changes:["Revision created with no quotation detail changes"];
}
function display(value:unknown){if(value===null||value===undefined||value==="")return "Not set";if(typeof value==="number")return new Intl.NumberFormat("en-NZ",{maximumFractionDigits:2}).format(value);return String(value)}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const id = await quoteId(context);
  const body = await request.json() as Payload;
  const items = (body.items ?? []).filter(item => item.category?.trim()).map((item, index) => {const quantity=Math.max(1,Number(item.quantity)||1),unitPrice=Math.max(0,Number(item.unitPrice??item.price)||0);return {
    quoteId: id, category: item.category!.trim(), systemType: item.systemType??"I-Robe", colour: item.colour??"Undecided", designSelection:item.designSelection??"Custom design", hardwareColour:item.hardwareColour??"Undecided", doorConfiguration:item.doorConfiguration??"", mirrorOption:item.mirrorOption??"", quantity,unitPrice,description:item.description?.trim()??"",price:Math.round((quantity*unitPrice+Number.EPSILON)*100)/100, sortOrder: index,
  }});
  if (!body.customerName?.trim() || !body.project?.trim() || !body.validUntil || !items.length) return Response.json({ error: "Please complete all required fields." }, { status: 400 });
  const servicePrice = Math.max(0,Number(body.servicePrice)||0);
  const discountPercent=Math.min(100,Math.max(0,Number(body.discountPercent)||0));
  const subtotal = items.reduce((total, item) => total + item.price, 0) + servicePrice;
  const amount=Math.round((subtotal*(1-discountPercent/100)+Number.EPSILON)*100)/100;
  const db = getDb();
  const [quote] = await db.update(quotes).set({ customerName: body.customerName.trim(), companyName: body.companyName?.trim()??"", email: body.email?.trim()??"", phone: body.phone?.trim()??"", customerAddress: body.customerAddress?.trim()??"", siteAddress: body.siteAddress?.trim()??"", serviceType:body.serviceType??"Pick Up", servicePrice, salespersonName:body.salespersonName?.trim()||"Sai Muddasani", project: body.project.trim(), status: body.status ?? "Draft", validUntil: body.validUntil, followUpDate:body.followUpDate??"", discountPercent, amount }).where(eq(quotes.id, id)).returning();
  if (!quote) return Response.json({ error: "Quote not found." }, { status: 404 });
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
  await db.insert(quoteItems).values(items);
  await db.insert(quoteActivities).values({quoteId:id,action:"Quote updated",detail:`Status: ${quote.status}`,actor:quote.salespersonName});
  return Response.json({ quote: { ...quote, items } });
}

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const id = await quoteId(context);
  const db = getDb();
  const [source] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  if (!source) return Response.json({ error: "Quote not found." }, { status: 404 });
  const sourceItems = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)).orderBy(quoteItems.sortOrder);
  const rootId=source.parentQuoteId||source.id;
  const family=await db.select().from(quotes).where(eq(quotes.parentQuoteId,rootId));
  const revision=Math.max(source.revision,...family.map(item=>item.revision))+1;
  const [quote] = await db.insert(quotes).values({ quoteNumber: `${source.quoteNumber.replace(/-R\d+$/,"")}-R${revision}`, customerId: source.customerId, customerName: source.customerName, companyName: source.companyName, email: source.email, phone: source.phone, customerAddress: source.customerAddress, siteAddress: source.siteAddress, serviceType:source.serviceType, servicePrice:source.servicePrice, salespersonName:source.salespersonName, project: source.project, amount: source.amount, status: "Draft", validUntil: source.validUntil,revision,parentQuoteId:source.parentQuoteId||source.id,acceptanceToken:crypto.randomUUID(),followUpDate:source.followUpDate,discountPercent:source.discountPercent }).returning();
  if (sourceItems.length) await db.insert(quoteItems).values(sourceItems.map(item => ({ quoteId: quote.id, category: item.category, systemType: item.systemType, colour: item.colour, designSelection:item.designSelection, hardwareColour:item.hardwareColour, doorConfiguration:item.doorConfiguration, mirrorOption:item.mirrorOption, quantity:item.quantity,unitPrice:item.unitPrice||item.price,description:item.description,price: item.price, sortOrder: item.sortOrder })));
  await db.insert(quoteActivities).values({quoteId:quote.id,action:"Revision created",detail:`Revision ${revision} created from ${source.quoteNumber}`,actor:source.salespersonName});
  return Response.json({ quote: { ...quote, items: sourceItems } }, { status: 201 });
}

export async function DELETE(_:Request,context:{params:Promise<{id:string}>}){
 const denied=await requireOwnerApi();if(denied)return denied;const id=await quoteId(context),db=getDb();
 const [quote]=await db.select().from(quotes).where(eq(quotes.id,id)).limit(1);if(!quote)return Response.json({error:"Job not found."},{status:404});
 await db.update(quotes).set({archived:true}).where(eq(quotes.id,id));
 await db.insert(quoteActivities).values({quoteId:id,action:"Job archived",detail:"Moved to archive",actor:quote.salespersonName});
 return Response.json({success:true,archived:true});
}

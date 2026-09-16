import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { customers, quotes } from "../../../db/schema";
import { requireOwnerApi } from "../../api-auth";

export async function GET() {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const db=getDb(),rows=await db.select().from(customers).where(eq(customers.archived,false)).orderBy(desc(customers.createdAt)),allQuotes=await db.select().from(quotes).where(eq(quotes.archived,false)).orderBy(desc(quotes.createdAt));
  return Response.json({ customers: rows.map(customer=>({...customer,quotes:allQuotes.filter(quote=>quote.customerId===customer.id)})) });
}

export async function POST(request: Request) {
  const denied = await requireOwnerApi(); if (denied) return denied;
  const body = await request.json() as { name?: string; companyName?: string; email?: string; phone?: string; address?: string; siteAddress?: string; notes?:string };
  if (!body.name?.trim()) return Response.json({ error: "Customer name is required." }, { status: 400 });
  const [customer] = await getDb().insert(customers).values({ name: body.name.trim(), companyName: body.companyName?.trim()??"", email: body.email?.trim()??"", phone: body.phone?.trim()??"", address: body.address?.trim()??"", siteAddress: body.siteAddress?.trim()??"",notes:body.notes?.trim()??"" }).returning();
  return Response.json({ customer }, { status: 201 });
}

export async function PATCH(request:Request){const denied=await requireOwnerApi();if(denied)return denied;const body=await request.json() as {id?:number;name?:string;companyName?:string;email?:string;phone?:string;address?:string;siteAddress?:string;notes?:string;archived?:boolean};if(!body.id)return Response.json({error:"Customer is required."},{status:400});const changes:{name?:string;companyName?:string;email?:string;phone?:string;address?:string;siteAddress?:string;notes?:string;archived?:boolean}={};for(const key of ["name","companyName","email","phone","address","siteAddress","notes"] as const)if(body[key]!==undefined)changes[key]=body[key]!.trim();if(body.archived!==undefined)changes.archived=body.archived;const [customer]=await getDb().update(customers).set(changes).where(eq(customers.id,body.id)).returning();return customer?Response.json({customer}):Response.json({error:"Customer not found."},{status:404})}

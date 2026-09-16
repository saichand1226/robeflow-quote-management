import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { customers,enquiries,enquiryAttachments,quoteActivities,quoteAttachments,quoteItems,quotes } from "../../../../../db/schema";
import { requireOwnerApi } from "../../../../api-auth";
export async function POST(_:Request,context:{params:Promise<{id:string}>}){
 const denied=await requireOwnerApi();if(denied)return denied;const id=Number((await context.params).id),db=getDb();
 const [enquiry]=await db.select().from(enquiries).where(eq(enquiries.id,id)).limit(1);if(!enquiry)return Response.json({error:"Enquiry not found."},{status:404});
 const [customer]=await db.insert(customers).values({name:enquiry.name,companyName:enquiry.companyName,email:enquiry.email,phone:enquiry.phone,address:enquiry.address,siteAddress:enquiry.siteAddress}).returning();
 const valid=new Date();valid.setDate(valid.getDate()+30);
 const [quote]=await db.insert(quotes).values({quoteNumber:`Q-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,customerId:customer.id,customerName:enquiry.name,companyName:enquiry.companyName,email:enquiry.email,phone:enquiry.phone,customerAddress:enquiry.address,siteAddress:enquiry.siteAddress,project:enquiry.projectType,amount:0,status:"Draft",validUntil:valid.toISOString().slice(0,10),salespersonName:enquiry.salespersonName||"Sai Muddasani",acceptanceToken:crypto.randomUUID(),followUpDate:new Date(Date.now()+7*86400000).toISOString().slice(0,10)}).returning();
 await db.insert(quoteItems).values({quoteId:quote.id,category:enquiry.areas||"Bedroom 1",systemType:"I-Robe",colour:enquiry.preferredColour||"Undecided",price:0,sortOrder:0});
 const plans=await db.select().from(enquiryAttachments).where(eq(enquiryAttachments.enquiryId,id));
 for(const plan of plans){const object=await env.BUCKET.get(plan.objectKey);if(object){const key=`quotes/${quote.id}/${crypto.randomUUID()}-${plan.fileName.replace(/[^a-zA-Z0-9._-]/g,"_")}`;await env.BUCKET.put(key,await object.arrayBuffer(),{httpMetadata:{contentType:plan.contentType}});await db.insert(quoteAttachments).values({quoteId:quote.id,fileName:plan.fileName,contentType:plan.contentType,size:plan.size,objectKey:key})}}
 await db.update(enquiries).set({status:"Quoted"}).where(eq(enquiries.id,id));
 await db.insert(quoteActivities).values({quoteId:quote.id,action:"Created from showroom enquiry",detail:`ENQ-${String(id).padStart(4,"0")} with ${plans.length} plan(s)`,actor:quote.salespersonName});
 return Response.json({quote},{status:201});
}

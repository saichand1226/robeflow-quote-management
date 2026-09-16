import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { paymentTransactions, quoteActivities, quotes } from "../../../db/schema";
import { requireRolesApi } from "../../api-auth";

const services=["Pick Up","Freight","Delivery"];
const statuses=["Awaiting dispatch","Ready","Collected","Dispatched","Delivered"];
const clean=(value:string)=>value.replace(/[<>&]/g,"");

export async function GET(){
 const denied=await requireRolesApi(["Accounts","Operations","Staff"]);if(denied)return denied;
 const db=getDb(),rows=await db.select().from(quotes).where(eq(quotes.accountsApproved,true)),payments=await db.select().from(paymentTransactions);
 return Response.json({jobs:rows.filter(q=>q.status==="Accepted"&&services.includes(q.serviceType)&&!q.archived).map(q=>({...q,totalPaid:payments.filter(p=>p.quoteId===q.id).reduce((sum,p)=>sum+p.amount,0)}))});
}

export async function PATCH(request:Request){
 const denied=await requireRolesApi(["Accounts","Operations","Staff"]);if(denied)return denied;
 const body=await request.json() as {id?:number;accountsApproved?:boolean;dispatchStatus?:string;trackingNumber?:string};
 if(!body.id)return Response.json({error:"Select a job first."},{status:400});
 const db=getDb(),[source]=await db.select().from(quotes).where(eq(quotes.id,body.id)).limit(1);
 if(!source)return Response.json({error:"Job not found."},{status:404});
 if(body.accountsApproved!==undefined){
  if(source.serviceType==="Installation")return Response.json({error:"Installation jobs are managed in Jobs & Installation."},{status:400});
  const [job]=await db.update(quotes).set({accountsApproved:body.accountsApproved}).where(eq(quotes.id,body.id)).returning();
  await db.insert(quoteActivities).values({quoteId:body.id,action:body.accountsApproved?"Approved for dispatch":"Dispatch approval removed",detail:source.serviceType,actor:"Accounts team"});
  return Response.json({job});
 }
 if(!source.accountsApproved)return Response.json({error:"Accounts must approve this job before dispatch."},{status:400});
 if(body.dispatchStatus&&!statuses.includes(body.dispatchStatus))return Response.json({error:"Invalid dispatch status."},{status:400});
 const nextTracking=body.trackingNumber?.trim(),changes:{dispatchStatus?:string;trackingNumber?:string;trackingSentAt?:string}={};
 if(body.dispatchStatus)changes.dispatchStatus=body.dispatchStatus;
 let notified=false;
 if(nextTracking!==undefined){
  if(source.serviceType!=="Freight")return Response.json({error:"Tracking numbers are only used for freight jobs."},{status:400});
  if(!nextTracking)return Response.json({error:"Enter a tracking number."},{status:400});
  if(!source.email)return Response.json({error:"Add the customer's email before sending tracking details."},{status:400});
  const runtime=env as unknown as {RESEND_API_KEY?:string;QUOTE_EMAIL_FROM?:string;QUOTE_EMAIL_REPLY_TO?:string};
  if(!runtime.RESEND_API_KEY)return Response.json({error:"Email service is not configured."},{status:503});
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${runtime.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:runtime.QUOTE_EMAIL_FROM||"RobeFlow <onboarding@resend.dev>",to:[source.email],reply_to:runtime.QUOTE_EMAIL_REPLY_TO,subject:`Tracking details for ${source.project}`,html:`<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h2 style="color:#047857">Your order is on its way</h2><p>Hi ${clean(source.customerName)},</p><p>Your freight order for <strong>${clean(source.project)}</strong> has been dispatched.</p><p>Tracking number: <strong>${clean(nextTracking)}</strong></p><p>Kind regards,<br><strong>RobeFlow Wardrobes</strong></p></div>`,text:`Hi ${source.customerName},\n\nYour freight order for ${source.project} has been dispatched.\nTracking number: ${nextTracking}\n\nKind regards,\nRobeFlow Wardrobes`})});
  if(!response.ok)return Response.json({error:"Tracking was not saved because the customer email could not be sent."},{status:502});
  changes.trackingNumber=nextTracking;changes.trackingSentAt=new Date().toISOString();changes.dispatchStatus="Dispatched";notified=true;
 }
 const [job]=await db.update(quotes).set(changes).where(eq(quotes.id,body.id)).returning();
 await db.insert(quoteActivities).values({quoteId:body.id,action:notified?"Tracking emailed":"Dispatch status changed",detail:notified?nextTracking!:changes.dispatchStatus||"",actor:"Dispatch team"});
 return Response.json({job,notified});
}

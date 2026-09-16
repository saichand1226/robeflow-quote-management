import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { jobScheduleEvents, quoteActivities, quotes } from "../../../db/schema";
import { requireRolesApi } from "../../api-auth";

const eventTypes = ["Site measure", "Installation"];
const statuses = ["Scheduled", "Completed", "Cancelled"];
type Payload = { id?:number; quoteId?:number; eventType?:string; scheduledDate?:string; startTime?:string; endTime?:string; assignedTo?:string; notes?:string; status?:string };

export async function GET() {
  const denied=await requireRolesApi(["Operations","Staff","Sales"]); if(denied)return denied;
  const events=await getDb().select({id:jobScheduleEvents.id,quoteId:jobScheduleEvents.quoteId,eventType:jobScheduleEvents.eventType,scheduledDate:jobScheduleEvents.scheduledDate,startTime:jobScheduleEvents.startTime,endTime:jobScheduleEvents.endTime,assignedTo:jobScheduleEvents.assignedTo,notes:jobScheduleEvents.notes,status:jobScheduleEvents.status,quoteNumber:quotes.quoteNumber,customerName:quotes.customerName,project:quotes.project,siteAddress:quotes.siteAddress}).from(jobScheduleEvents).innerJoin(quotes,eq(jobScheduleEvents.quoteId,quotes.id)).orderBy(asc(jobScheduleEvents.scheduledDate),asc(jobScheduleEvents.startTime));
  return Response.json({events});
}

async function validate(body:Payload,excludeId?:number){
  if(!body.quoteId||!eventTypes.includes(body.eventType??"")||!body.scheduledDate||!body.startTime||!body.endTime||body.startTime>=body.endTime)return "Complete the job, event type, date and a valid time range.";
  if(body.status&&!statuses.includes(body.status))return "Invalid schedule status.";
  if(body.assignedTo){
    const sameDay=await getDb().select().from(jobScheduleEvents).where(eq(jobScheduleEvents.scheduledDate,body.scheduledDate));
    const conflict=sameDay.find(item=>item.id!==excludeId&&item.status!=="Cancelled"&&item.assignedTo.toLowerCase()===body.assignedTo!.trim().toLowerCase()&&body.startTime!<item.endTime&&body.endTime!>item.startTime);
    if(conflict)return `${body.assignedTo} already has another booking during this time.`;
  }
  return null;
}

export async function POST(request:Request){
  const denied=await requireRolesApi(["Operations","Staff","Sales"]);if(denied)return denied;
  const body=await request.json() as Payload,error=await validate(body);if(error)return Response.json({error},{status:error.includes("already")?409:400});
  const db=getDb(),[event]=await db.insert(jobScheduleEvents).values({quoteId:body.quoteId!,eventType:body.eventType!,scheduledDate:body.scheduledDate!,startTime:body.startTime!,endTime:body.endTime!,assignedTo:body.assignedTo?.trim()??"",notes:body.notes?.trim()??"",status:body.status??"Scheduled"}).returning();
  await db.insert(quoteActivities).values({quoteId:event.quoteId,action:`${event.eventType} scheduled`,detail:`${event.scheduledDate} ${event.startTime}–${event.endTime}${event.assignedTo?` · ${event.assignedTo}`:""}`,actor:event.assignedTo||"RobeFlow"});
  return Response.json({event},{status:201});
}

export async function PATCH(request:Request){
  const denied=await requireRolesApi(["Operations","Staff","Sales"]);if(denied)return denied;
  const body=await request.json() as Payload;if(!body.id)return Response.json({error:"Booking is required."},{status:400});
  const error=await validate(body,body.id);if(error)return Response.json({error},{status:error.includes("already")?409:400});
  const [event]=await getDb().update(jobScheduleEvents).set({quoteId:body.quoteId!,eventType:body.eventType!,scheduledDate:body.scheduledDate!,startTime:body.startTime!,endTime:body.endTime!,assignedTo:body.assignedTo?.trim()??"",notes:body.notes?.trim()??"",status:body.status??"Scheduled"}).where(eq(jobScheduleEvents.id,body.id)).returning();
  return event?Response.json({event}):Response.json({error:"Booking not found."},{status:404});
}

export async function DELETE(request:Request){
  const denied=await requireRolesApi(["Operations","Staff"]);if(denied)return denied;
  const {id}=await request.json() as {id?:number};if(!id)return Response.json({error:"Booking is required."},{status:400});
  await getDb().delete(jobScheduleEvents).where(eq(jobScheduleEvents.id,id));return Response.json({success:true});
}

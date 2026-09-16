import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { quoteActivities, quotes } from "../../../../../db/schema";
import { requireRolesApi } from "../../../../api-auth";

const quoteStatuses=["Draft","Sent","Accepted","Declined","Expired"];
const jobStages=["Awaiting acceptance","Site measure required","Measure booked","Measurement completed","Design approved","Deposit received","Materials ordered","Ready for installation","Installation booked","Installed","Completed"];
const dispatchStatuses=["Awaiting dispatch","Ready","Collected","Dispatched","Delivered"];
const pickStatuses=["Not generated","In progress","Picked"];

export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
 const denied=await requireRolesApi(["Sales","Accounts","Operations","Staff"]);if(denied)return denied;
 const id=Number((await context.params).id),body=await request.json() as {status?:string;jobStage?:string;dispatchStatus?:string;pickListStatus?:string;accountsApproved?:string|boolean;actor?:string};
 if(!Number.isInteger(id))return Response.json({error:"Invalid job."},{status:400});
 if(body.status&&!quoteStatuses.includes(body.status))return Response.json({error:"Invalid quote status."},{status:400});
 if(body.jobStage&&!jobStages.includes(body.jobStage))return Response.json({error:"Invalid installation stage."},{status:400});
 if(body.dispatchStatus&&!dispatchStatuses.includes(body.dispatchStatus))return Response.json({error:"Invalid dispatch status."},{status:400});
 if(body.pickListStatus&&!pickStatuses.includes(body.pickListStatus))return Response.json({error:"Invalid pick-list status."},{status:400});
 const changes:Record<string,unknown>={};
 if(body.status)changes.status=body.status;
 if(body.jobStage)changes.jobStage=body.jobStage;
 if(body.dispatchStatus)changes.dispatchStatus=body.dispatchStatus;
 if(body.pickListStatus)changes.pickListStatus=body.pickListStatus;
 if(body.accountsApproved!==undefined)changes.accountsApproved=body.accountsApproved===true||body.accountsApproved==="true";
 if(!Object.keys(changes).length)return Response.json({error:"No board change was supplied."},{status:400});
 const [quote]=await getDb().update(quotes).set(changes).where(eq(quotes.id,id)).returning();
 if(!quote)return Response.json({error:"Job not found."},{status:404});
 const destination=body.status||body.jobStage||body.dispatchStatus||body.pickListStatus||(changes.accountsApproved?"Approved":"Approval removed");
 await getDb().insert(quoteActivities).values({quoteId:id,action:"Job moved on board",detail:String(destination),actor:body.actor||"RobeFlow team"});
 return Response.json({quote});
}

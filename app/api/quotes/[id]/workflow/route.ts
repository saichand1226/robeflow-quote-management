import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { quoteActivities,quotes } from "../../../../../db/schema";
import { requireRolesApi } from "../../../../api-auth";
const stages=["Awaiting acceptance","Site measure required","Measure booked","Measurement completed","Design approved","Deposit received","Materials ordered","Ready for installation","Installation booked","Installed","Completed"];
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
 const denied=await requireRolesApi(["Operations","Staff"]);if(denied)return denied;
 const id=Number((await context.params).id),body=await request.json() as {jobStage?:string;followUpDate?:string;actor?:string};
 if(body.jobStage&&!stages.includes(body.jobStage))return Response.json({error:"Invalid job stage."},{status:400});
 const [quote]=await getDb().update(quotes).set({jobStage:body.jobStage,followUpDate:body.followUpDate}).where(eq(quotes.id,id)).returning();
 if(!quote)return Response.json({error:"Quote not found."},{status:404});
 await getDb().insert(quoteActivities).values({quoteId:id,action:body.jobStage?"Job stage changed":"Follow-up scheduled",detail:body.jobStage||body.followUpDate||"",actor:body.actor||quote.salespersonName});
 return Response.json({quote});
}

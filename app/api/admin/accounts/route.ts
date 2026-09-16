import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { staffAccounts } from "../../../../db/schema";
import { ADMIN_EMAIL } from "../../../api-auth";
import { getChatGPTUser } from "../../../chatgpt-auth";

async function requireAdmin() {
  const user=await getChatGPTUser();
  return user?.email.toLowerCase()===ADMIN_EMAIL ? null : Response.json({error:"Administrator access required."},{status:403});
}
export async function GET(){const denied=await requireAdmin();if(denied)return denied;return Response.json({accounts:await getDb().select().from(staffAccounts).orderBy(desc(staffAccounts.requestedAt))})}
export async function PATCH(request:Request){const denied=await requireAdmin();if(denied)return denied;const body=await request.json() as {id?:number;status?:string;role?:string};if(!body.id||!["Approved","Rejected","Pending"].includes(body.status??"")||!["Sales","Accounts","Operations","Admin","Staff"].includes(body.role??"Staff"))return Response.json({error:"Invalid account update."},{status:400});const [account]=await getDb().update(staffAccounts).set({status:body.status!,role:body.role??"Staff",reviewedAt:new Date().toISOString()}).where(eq(staffAccounts.id,body.id)).returning();return account?Response.json({account}):Response.json({error:"Account not found."},{status:404})}

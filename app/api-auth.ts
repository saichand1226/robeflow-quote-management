import { getChatGPTUser } from "./chatgpt-auth";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { staffAccounts } from "../db/schema";

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

export async function requireOwnerApi() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL) return null;
  const [account] = await getDb().select().from(staffAccounts).where(eq(staffAccounts.email,user.email.toLowerCase())).limit(1);
  if (!account || account.status !== "Approved") return Response.json({ error: "Your staff account is not approved." }, { status: 403 });
  return null;
}

export async function requireAdminApi() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!ADMIN_EMAIL || user.email.toLowerCase() !== ADMIN_EMAIL) return Response.json({ error: "Administrator access required." }, { status: 403 });
  return null;
}

export async function requireRolesApi(allowed:string[]) {
 const user=await getChatGPTUser();
 if(!user)return Response.json({error:"Sign in required."},{status:401});
 if(ADMIN_EMAIL&&user.email.toLowerCase()===ADMIN_EMAIL)return null;
 const [account]=await getDb().select().from(staffAccounts).where(eq(staffAccounts.email,user.email.toLowerCase())).limit(1);
 if(!account||account.status!=="Approved")return Response.json({error:"Your staff account is not approved."},{status:403});
 if(!allowed.includes(account.role)&&account.role!=="Admin")return Response.json({error:"Your role does not have access to this action."},{status:403});
 return null;
}

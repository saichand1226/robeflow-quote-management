import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { staffAccounts } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in with ChatGPT first." }, { status: 401 });
  const email = user.email.toLowerCase();
  const body = await request.json() as { name?: string; role?: string };
  if (!body.name?.trim()) return Response.json({ error: "Enter your full name." }, { status: 400 });
  const db = getDb();
  const [existing] = await db.select().from(staffAccounts).where(eq(staffAccounts.email,email)).limit(1);
  if (existing) return Response.json({ account: existing });
  const [account] = await db.insert(staffAccounts).values({ email, name:body.name.trim(), role:body.role?.trim()||"Staff", status:"Pending" }).returning();
  return Response.json({ account }, { status: 201 });
}

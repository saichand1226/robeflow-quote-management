import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { teamMembers } from "../../../db/schema";
import { requireAdminApi, requireOwnerApi } from "../../api-auth";

export async function GET() {
  const denied = await requireOwnerApi(); if (denied) return denied;
  return Response.json({ team: await getDb().select().from(teamMembers).orderBy(asc(teamMembers.name)) });
}

export async function POST(request: Request) {
  const denied = await requireAdminApi(); if (denied) return denied;
  const body = await request.json() as { name?: string; email?: string; phone?: string; role?: string };
  if (!body.name?.trim()) return Response.json({ error: "Enter the salesperson's name." }, { status: 400 });
  const email=body.email?.trim().toLowerCase()??"";
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  const [member] = await getDb().insert(teamMembers).values({ name: body.name.trim(), email, phone: body.phone?.trim()??"", role: body.role?.trim()||"Salesperson" }).returning();
  return Response.json({ member }, { status: 201 });
}

export async function PATCH(request: Request) {
  const denied = await requireAdminApi(); if (denied) return denied;
  const body = await request.json() as { id?: number; active?: boolean };
  if (!body.id || typeof body.active !== "boolean") return Response.json({ error: "Invalid team update." }, { status: 400 });
  const [member] = await getDb().update(teamMembers).set({ active: body.active }).where(eq(teamMembers.id, body.id)).returning();
  return member ? Response.json({ member }) : Response.json({ error: "Team member not found." }, { status: 404 });
}

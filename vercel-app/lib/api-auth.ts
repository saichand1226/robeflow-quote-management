import { createClient } from "@/lib/supabase/server";

export type StaffRole = "Admin" | "Sales" | "Accounts" | "Operations" | "Staff";

export async function requireStaff(allowed?: StaffRole[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: Response.json({ error: "Sign in required." }, { status: 401 }) };
  const { data: profile } = await supabase.from("staff_profiles").select("id,full_name,role,status").eq("id", user.id).maybeSingle();
  if (!profile || profile.status !== "Approved") return { error: Response.json({ error: "Your staff account is not approved." }, { status: 403 }) };
  if (allowed && profile.role !== "Admin" && !allowed.includes(profile.role as StaffRole)) return { error: Response.json({ error: "Your role does not have access to this action." }, { status: 403 }) };
  return { supabase, user, profile, error: null };
}

export const camel = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value]));

export const snake = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`), value]));

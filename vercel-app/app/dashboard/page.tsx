import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuoteDashboard from "../quote-dashboard";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("staff_profiles").select("full_name,role,status").eq("id", user.id).maybeSingle();
  if (!profile || profile.status !== "Approved") redirect("/pending");
  return <QuoteDashboard currentName={profile.full_name || user.email || "Staff member"} currentEmail={user.email || ""} isAdmin={profile.role === "Admin"} userRole={profile.role} />;
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("staff_profiles").select("status").eq("id", user.id).maybeSingle();
  if (profile?.status === "Approved") redirect("/dashboard");
  return <main className="shell"><div className="dashboard"><Link className="brand" href="/"><span className="mark">R</span>RobeFlow</Link><section className="dash-card"><h1>Account awaiting approval</h1><p>Your email has been verified. An administrator must approve your staff account before the internal workspace becomes available.</p><p><strong>{user.email}</strong></p></section></div></main>;
}

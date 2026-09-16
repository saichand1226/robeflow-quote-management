import QuoteDashboard from "../quote-dashboard";
import { requireChatGPTUser } from "../chatgpt-auth";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { staffAccounts } from "../../db/schema";
import { ADMIN_EMAIL } from "../api-auth";
import AccessScreen from "../access-screen";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StaffHome() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host")?.split(":")[0]?.toLowerCase();
  if (host === "robeflow.saimuddasani.com") {
    redirect("https://sai-quote-manager.saichandreddy.chatgpt.site/staff");
  }
  const user = await requireChatGPTUser("/staff");
  const email = user.email.toLowerCase();
  const isAdmin = email === ADMIN_EMAIL;
  if (!isAdmin) {
    const [account] = await getDb().select().from(staffAccounts).where(eq(staffAccounts.email, email)).limit(1);
    if (!account) return <AccessScreen email={email} name={user.fullName ?? ""} status="Register" />;
    if (account.status !== "Approved") return <AccessScreen email={email} name={account.name} status={account.status === "Rejected" ? "Rejected" : "Pending"} />;
    return <QuoteDashboard currentName={account.name} currentEmail={email} isAdmin={false} userRole={account.role} />;
  }
  return <QuoteDashboard currentName={user.fullName ?? "Sai Muddasani"} currentEmail={email} isAdmin userRole="Admin" />;
}

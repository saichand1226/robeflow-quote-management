"use client";
import { useEffect, useState } from "react";
import { Check, Mail, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
type Account = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  requestedAt: string;
};
const roles = ["Sales", "Accounts", "Operations", "Admin", "Staff"];
export default function StaffAccountsPanel() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  useEffect(() => {
    fetch("/api/admin/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []));
  }, []);
  async function update(account: Account, status = account.status, role = account.role) {
    const response = await fetch("/api/admin/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: account.id, status, role }),
    });
    if (response.ok) {
      const result = await response.json();
      setAccounts((current) => current.map((item) => (item.id === account.id ? result.account : item)));
    }
  }
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <ShieldCheck className="text-emerald-700" />
          Staff roles & approvals
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Review staff requests, assign the correct access role, then approve or reject them.</p>
      </section>
      <section className="grid gap-4">
        {accounts.map((account) => (
          <article key={account.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{account.name}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${account.status === "Approved" ? "bg-emerald-100 text-emerald-800" : account.status === "Rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>{account.status}</span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <Mail className="size-4" />
                  {account.email}
                </p>
                <p className="mt-1 text-xs text-slate-400">Requested {new Date(account.requestedAt).toLocaleDateString("en-NZ")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={account.role} onChange={(e) => update(account, account.status, e.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm font-semibold" aria-label={`Role for ${account.name}`}>
                  {roles.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={() => update(account, "Rejected")}>
                  <X className="size-4" />
                  Reject
                </Button>
                <Button onClick={() => update(account, "Approved")}>
                  <Check className="size-4" />
                  Approve
                </Button>
              </div>
            </div>
          </article>
        ))}
        {!accounts.length && <div className="rounded-2xl border bg-white p-12 text-center text-muted-foreground">No staff registration requests yet.</div>}
      </section>
    </div>
  );
}

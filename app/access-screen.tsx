"use client";
import { useState } from "react";
import { LogOut, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AccessScreen({ email, name, status }: { email: string; name: string; status: "Register" | "Pending" | "Rejected" }) {
  const [fullName, setFullName] = useState(name),
    [role, setRole] = useState("Salesperson"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [currentStatus, setCurrentStatus] = useState(status);
  async function register(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, role }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Registration could not be submitted.");
        return;
      }
      setCurrentStatus("Pending");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-4">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-7 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-700 text-white">
            <WalletCards />
          </span>
          <div>
            <h1 className="text-2xl font-bold">RobeFlow</h1>
            <p className="text-sm text-slate-500">RobeFlow staff access</p>
          </div>
        </div>
        {currentStatus === "Register" ? (
          <form onSubmit={register} className="mt-8 space-y-4">
            <div>
              <h2 className="text-xl font-bold">Register your staff account</h2>
              <p className="mt-1 text-sm text-slate-500">Use your existing Gmail, Outlook or work email. Access begins only after an administrator approves you.</p>
            </div>
            <div className="grid gap-2">
              <Label>Signed-in email</Label>
              <Input value={email} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Requested role</Label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm">
                <option>Salesperson</option>
                <option>Accounts</option>
                <option>Operations</option>
                <option>Manager</option>
                <option>Staff</option>
              </select>
              <p className="text-xs text-slate-500">The administrator will confirm your final role.</p>
            </div>
            {message && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}
            <Button className="w-full" disabled={busy}>
              {busy ? "Submitting…" : "Request access"}
            </Button>
          </form>
        ) : (
          <div className="mt-8 text-center">
            <span className={`mx-auto grid size-14 place-items-center rounded-full ${currentStatus === "Pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
              <ShieldCheck />
            </span>
            <h2 className="mt-4 text-xl font-bold">{currentStatus === "Pending" ? "Approval pending" : "Access not approved"}</h2>
            <p className="mt-2 text-sm text-slate-500">{currentStatus === "Pending" ? "Your request has been sent to the RobeFlow administrator. You can log in after it is approved." : "Your registration was not approved. Contact your administrator if you believe this is a mistake."}</p>
          </div>
        )}
        <a href="/signout-with-chatgpt?return_to=%2F" target="_top" className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <LogOut className="size-4" />
          Log out
        </a>
      </section>
    </main>
  );
}

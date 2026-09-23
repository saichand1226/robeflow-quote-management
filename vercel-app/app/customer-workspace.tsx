"use client";
import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, ChevronDown, DollarSign, Download, ExternalLink, Mail, MapPin, PackageCheck, Paperclip, Pencil, Phone, Plus, QrCode, ReceiptText, Search, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { displayedJobNumber, suggestedInvoiceNumber } from "@/lib/job-reference";

type Customer = {
  id: number;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  siteAddress: string;
  notes: string;
  archived: boolean;
  createdAt: string;
  quotes?: {
    id: number;
    quoteNumber: string;
    project?: string;
    status: string;
    amount: number;
    invoiceStatus: string;
  }[];
};
type EnquiryAttachment = { id: number; fileName: string; size: number };
type TeamMember = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  createdAt: string;
};
type Enquiry = {
  id: number;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  siteAddress: string;
  projectType: string;
  areas: string;
  preferredColour: string;
  timeframe: string;
  notes: string;
  status: string;
  salespersonName: string;
  createdAt: string;
  attachments: EnquiryAttachment[];
};
type Payment = {
  id: number;
  amount: number;
  paymentDate: string;
  method: string;
  reference: string;
  notes: string;
  recordedBy: string;
  createdAt: string;
};
type InvoiceQuote = {
  id: number;
  quoteNumber: string;
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  customerAddress?: string;
  siteAddress: string;
  project: string;
  amount: number;
  invoiceNumber: string;
  invoiceStatus: string;
  paymentNote: string;
  invoiceSentAt?: string;
  jobStage?: string;
  depositInvoiceNumber?: string;
  depositInvoiceSentAt?: string;
  balanceInvoiceNumber?: string;
  balanceInvoiceSentAt?: string;
  orderConfirmationSentAt?: string;
  acceptanceToken: string;
  salespersonName: string;
  serviceType: string;
  servicePrice: number;
  accountsApproved: boolean;
  createdAt: string;
  payments: Payment[];
  totalPaid: number;
};
const intakeUrl = typeof window === "undefined" ? "/customer-intake" : `${window.location.origin}/customer-intake`;

export function CustomersPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]),
    [search, setSearch] = useState(""),
    [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [selected, setSelected] = useState<Customer | null>(null);
  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
  }, []);
  const filtered = useMemo(() => customers.filter((c) => `${c.name} ${c.companyName} ${c.email} ${c.phone} ${c.siteAddress}`.toLowerCase().includes(search.toLowerCase())), [customers, search]);
  async function addCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        window.alert(result.error || "Customer could not be saved.");
        return;
      }
      setCustomers((current) => [result.customer, ...current]);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }
  async function saveCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const response = await fetch("/api/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, id: selected.id }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      window.alert(result.error || "Customer could not be updated.");
      return;
    }
    const updated = { ...selected, ...result.customer };
    setCustomers((current) => current.map((c) => (c.id === selected.id ? updated : c)));
    setSelected(updated);
  }
  async function archiveCustomer() {
    if (!selected || !window.confirm(`Archive ${selected.name}? Their quotes will remain available.`)) return;
    const response = await fetch("/api/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, archived: true }),
    });
    if (response.ok) {
      setCustomers((current) => current.filter((c) => c.id !== selected.id));
      setSelected(null);
    }
  }
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Customers</h2>
          <p className="text-sm text-muted-foreground">Customer contact details and installation addresses.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add customer
        </Button>
      </section>
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone or address…" />
          </div>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((customer) => (
            <article key={customer.id} onClick={() => setSelected(customer)} className="cursor-pointer rounded-2xl border p-5 transition hover:border-emerald-500 hover:shadow-md">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">{customer.name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{customer.name}</h3>
                  {customer.companyName && <p className="truncate text-sm text-muted-foreground">{customer.companyName}</p>}
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    {customer.quotes?.length ?? 0} quote
                    {customer.quotes?.length === 1 ? "" : "s"} · Open profile
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {customer.email && <Line icon={<Mail />}>{customer.email}</Line>}
                {customer.phone && <Line icon={<Phone />}>{customer.phone}</Line>}
                {customer.address && <Line icon={<MapPin />}>{customer.address}</Line>}
                {customer.siteAddress && (
                  <Line icon={<Building2 />}>
                    <span>
                      <strong className="font-medium text-slate-800">Site:</strong> {customer.siteAddress}
                    </span>
                  </Line>
                )}
              </div>
            </article>
          ))}
        </div>
        {!filtered.length && <p className="p-12 text-center text-muted-foreground">No customers match your search.</p>}
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={addCustomer}>
            <DialogHeader>
              <DialogTitle>Add customer</DialogTitle>
              <DialogDescription>Save their details now so they can be selected on future quotes.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5 sm:grid-cols-2">
              <FormField label="Customer name *">
                <Input name="name" required />
              </FormField>
              <FormField label="Company name">
                <Input name="companyName" />
              </FormField>
              <FormField label="Email address">
                <Input name="email" type="email" />
              </FormField>
              <FormField label="Phone number">
                <Input name="phone" type="tel" />
              </FormField>
              <FormField label="Customer address" wide>
                <Input name="address" />
              </FormField>
              <FormField label="Site / installation address" wide>
                <Input name="siteAddress" />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selected} onOpenChange={(value) => !value && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          {selected && (
            <form onSubmit={saveCustomer}>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>Edit customer details, notes and review their quotation history.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-5 sm:grid-cols-2">
                <FormField label="Customer name *">
                  <Input name="name" required defaultValue={selected.name} />
                </FormField>
                <FormField label="Company name">
                  <Input name="companyName" defaultValue={selected.companyName} />
                </FormField>
                <FormField label="Email address">
                  <Input name="email" type="email" defaultValue={selected.email} />
                </FormField>
                <FormField label="Phone number">
                  <Input name="phone" type="tel" defaultValue={selected.phone} />
                </FormField>
                <FormField label="Customer address" wide>
                  <Input name="address" defaultValue={selected.address} />
                </FormField>
                <FormField label="Site / installation address" wide>
                  <Input name="siteAddress" defaultValue={selected.siteAddress} />
                </FormField>
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Internal notes</Label>
                  <textarea name="notes" defaultValue={selected.notes} className="min-h-24 rounded-md border p-3 text-sm" />
                </div>
              </div>
              <section className="mb-5 rounded-xl border">
                <h3 className="border-b px-4 py-3 font-bold">Quote history</h3>
                {selected.quotes?.map((q) => (
                  <div key={q.id} className="flex items-center justify-between border-b px-4 py-3 last:border-0">
                    <div>
                      <p className="font-semibold text-emerald-700">{q.quoteNumber}</p>
                      <p className="text-sm text-slate-500">
                        {q.project || q.status} · {q.status}
                      </p>
                    </div>
                    <strong>
                      {new Intl.NumberFormat("en-NZ", {
                        style: "currency",
                        currency: "NZD",
                      }).format(q.amount)}
                    </strong>
                  </div>
                ))}
                {!selected.quotes?.length && <p className="p-4 text-sm text-slate-500">No quotes for this customer yet.</p>}
              </section>
              <DialogFooter className="justify-between sm:justify-between">
                <Button type="button" variant="destructive" onClick={archiveCustomer}>
                  Archive customer
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                  <Button disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EnquiriesPanel() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]),
    [team, setTeam] = useState<TeamMember[]>([]),
    [search, setSearch] = useState(""),
    [converting, setConverting] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/enquiries")
      .then((r) => r.json())
      .then((d) => setEnquiries(d.enquiries ?? []));
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => setTeam((d.team ?? []).filter((m: TeamMember) => m.active)));
  }, []);
  const filtered = useMemo(() => enquiries.filter((e) => `${e.name} ${e.companyName} ${e.projectType} ${e.areas} ${e.status}`.toLowerCase().includes(search.toLowerCase())), [enquiries, search]);
  async function updateEnquiry(enquiry: Enquiry, changes: { status?: string; salespersonName?: string }) {
    const response = await fetch("/api/enquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: enquiry.id,
        status: changes.status ?? enquiry.status,
        salespersonName: changes.salespersonName ?? enquiry.salespersonName,
      }),
    });
    if (response.ok) {
      const result = await response.json();
      setEnquiries((current) => current.map((item) => (item.id === enquiry.id ? { ...item, ...result.enquiry } : item)));
    }
  }
  async function createQuote(enquiry: Enquiry) {
    setConverting(enquiry.id);
    try {
      const response = await fetch(`/api/enquiries/${enquiry.id}/convert`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) {
        window.alert(result.error || "Quote could not be created.");
        return;
      }
      setEnquiries((current) => current.map((item) => (item.id === enquiry.id ? { ...item, status: "Quoted" } : item)));
      window.alert(`${result.quote.quoteNumber} created as a draft with the customer details and plans.`);
    } finally {
      setConverting(null);
    }
  }
  return (
    <div className="space-y-6">
      <section className="grid gap-5 rounded-2xl border bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="text-xl font-bold">Quotes to do</h2>
          <p className="mt-1 text-sm text-muted-foreground">New showroom enquiries appear here with their contact details, requirements and plans.</p>
          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search enquiries…" />
          </div>
        </div>
        <QrCard />
      </section>
      <div className="grid gap-4">
        {filtered.map((enquiry) => (
          <article key={enquiry.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{enquiry.name}</h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">ENQ-{String(enquiry.id).padStart(4, "0")}</span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">Showroom QR</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {enquiry.companyName || enquiry.projectType} · {new Date(enquiry.createdAt).toLocaleString("en-NZ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select value={enquiry.salespersonName || ""} onChange={(e) => updateEnquiry(enquiry, { salespersonName: e.target.value })} className="h-9 rounded-lg border bg-white px-3 text-sm font-semibold" aria-label={`Assign ${enquiry.name}`}>
                  <option value="">Unassigned</option>
                  <option value="Sai Muddasani">Sai Muddasani</option>
                  {team
                    .filter((m) => m.name !== "Sai Muddasani")
                    .map((member) => (
                      <option key={member.id}>{member.name}</option>
                    ))}
                </select>
                <select value={enquiry.status} onChange={(e) => updateEnquiry(enquiry, { status: e.target.value })} className="h-9 rounded-lg border bg-white px-3 text-sm font-semibold">
                  <option>New</option>
                  <option>In progress</option>
                  <option>Quoted</option>
                  <option>Closed</option>
                </select>
              </div>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <div className="space-y-2 text-sm">
                <Line icon={<Mail />}>{enquiry.email}</Line>
                <Line icon={<Phone />}>{enquiry.phone}</Line>
                {enquiry.siteAddress && <Line icon={<MapPin />}>{enquiry.siteAddress}</Line>}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">
                  {enquiry.projectType}
                  {enquiry.preferredColour && ` · ${enquiry.preferredColour}`}
                </p>
                {enquiry.areas && <p className="mt-2 whitespace-pre-line text-slate-600">{enquiry.areas}</p>}
                {enquiry.timeframe && (
                  <p className="mt-2 text-slate-600">
                    <strong>Timeframe:</strong> {enquiry.timeframe}
                  </p>
                )}
              </div>
              <div className="text-sm">
                {enquiry.notes && <p className="whitespace-pre-line text-slate-600">{enquiry.notes}</p>}
                {enquiry.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {enquiry.attachments.map((file) => (
                      <a key={file.id} href={`/api/enquiry-attachments/${file.id}`} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-medium hover:bg-slate-50">
                        <Paperclip className="size-4" />
                        {file.fileName}
                        <Download className="size-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button disabled={converting === enquiry.id || enquiry.status === "Quoted"} onClick={() => createQuote(enquiry)}>
                {enquiry.status === "Quoted" ? "Draft quote created" : converting === enquiry.id ? "Creating quote…" : "Create draft quote"}
              </Button>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && <div className="rounded-2xl border bg-white p-12 text-center text-muted-foreground">No showroom enquiries yet.</div>}
    </div>
  );
}

export function InvoicesPanel() {
  const [invoices, setInvoices] = useState<InvoiceQuote[]>([]),
    [numbers, setNumbers] = useState<Record<number, string>>({}),
    [notes, setNotes] = useState<Record<number, string>>({}),
    [paymentModes, setPaymentModes] = useState<Record<number, string>>({}),
    [paymentAmounts, setPaymentAmounts] = useState<Record<number, string>>({}),
    [saving, setSaving] = useState<number | null>(null),
    [search, setSearch] = useState(""),
    [statusTab, setStatusTab] = useState("All"),
    [expanded, setExpanded] = useState<number | null>(null),
    [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  async function load() {
    const d = await fetch("/api/invoices").then((r) => r.json()),
      rows = d.invoices ?? [];
    setInvoices(rows);
    setNumbers(Object.fromEntries(rows.map((q: InvoiceQuote) => {
      const balance = q.serviceType === "Installation" && q.jobStage === "Completed" && q.depositInvoiceSentAt && !q.balanceInvoiceSentAt;
      return [q.id, balance ? q.balanceInvoiceNumber || suggestedInvoiceNumber(q, "balance") : q.depositInvoiceNumber || q.invoiceNumber || suggestedInvoiceNumber(q, q.serviceType === "Installation" ? "deposit" : "full")];
    })));
    setNotes(Object.fromEntries(rows.map((q: InvoiceQuote) => [q.id, q.paymentNote ?? ""])));
  }
  useEffect(() => {
    load();
  }, []);
  const filtered = useMemo(() => invoices.filter((q) => (statusTab==="All"||q.invoiceStatus===statusTab)&&`${q.quoteNumber} ${displayedJobNumber(q)} ${q.customerName} ${q.companyName} ${q.project} ${q.invoiceNumber} ${q.salespersonName} ${q.invoiceStatus} ${q.paymentNote}`.toLowerCase().includes(search.toLowerCase())), [invoices, search, statusTab]);
  async function updateInvoice(quote: InvoiceQuote, status: string) {
    setSaving(quote.id);
    try {
      const response = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quote.id,
          invoiceNumber: numbers[quote.id] ?? "",
          invoiceStatus: status,
          paymentNote: notes[quote.id] ?? "",
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        window.alert(result.error || "Invoice status could not be updated.");
        return;
      }
      await load();
    } finally {
      setSaving(null);
    }
  }
  async function sendInvoice(quote: InvoiceQuote) {
    if (!(numbers[quote.id] ?? "").trim()) {
      window.alert("Enter the Xero invoice number first.");
      return;
    }
    if (!quote.email) {
      window.alert("Add the customer email address before sending the invoice.");
      return;
    }
    setSaving(quote.id);
    try {
      const phase = quote.serviceType === "Installation" ? quote.depositInvoiceSentAt ? "balance" : "deposit" : "full";
      const response = await fetch(`/api/invoices/${quote.id}/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phase, invoiceNumber: numbers[quote.id] }),
        }),
        result = await response.json();
      if (!response.ok) {
        window.alert(result.error || "Invoice email could not be sent.");
        return;
      }
      await load();
      window.alert(`${phase === "deposit" ? "50% deposit" : phase === "balance" ? "Remaining balance" : "Full"} invoice ${numbers[quote.id]} was emailed to ${quote.email}.`);
    } finally {
      setSaving(null);
    }
  }
  async function sendOrderConfirmation(quote: InvoiceQuote) {
    if (!quote.email) return window.alert("Add the customer email address before sending the order confirmation.");
    setSaving(quote.id);
    try {
      const response = await fetch(`/api/orders/${quote.id}/email`, { method: "POST" }), result = await response.json();
      if (!response.ok) return window.alert(result.error || "Order confirmation could not be sent.");
      await load();
      window.alert(`Order confirmation was emailed to ${quote.email}.`);
    } finally { setSaving(null); }
  }
  async function recordPayment(event: React.FormEvent<HTMLFormElement>, quote: InvoiceQuote) {
    event.preventDefault();
    setSaving(quote.id);
    const form = event.currentTarget,
      data = Object.fromEntries(new FormData(form));
    if (data.method === "Account") {
      const response = await fetch("/api/invoices", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: quote.id, invoiceNumber: numbers[quote.id] ?? "", invoiceStatus: "Account", paymentNote: notes[quote.id] ?? "" }),
        }),
        result = await response.json();
      setSaving(null);
      if (!response.ok) {
        window.alert(result.error || "The account status could not be saved.");
        return;
      }
      form.reset();
      setPaymentModes((current) => ({ ...current, [quote.id]: "Bank transfer" }));
      await load();
      return;
    }
    const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          quoteId: quote.id,
          recordedBy: "Accounts team",
        }),
      }),
      result = await response.json();
    setSaving(null);
    if (!response.ok) {
      window.alert(result.error || "Payment could not be recorded.");
      return;
    }
    form.reset();
    setPaymentModes((current) => ({ ...current, [quote.id]: "Bank transfer" }));
    await load();
  }
  async function editPayment(event: React.FormEvent<HTMLFormElement>, payment: Payment) {
    event.preventDefault();
    setSaving(payment.id);
    const data = Object.fromEntries(new FormData(event.currentTarget)),
      response = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, id: payment.id }),
      }),
      result = await response.json();
    setSaving(null);
    if (!response.ok) {
      window.alert(result.error || "Payment could not be updated.");
      return;
    }
    setEditingPayment(null);
    await load();
  }
  async function recordQuickPayment(quote: InvoiceQuote) {
    const mode = paymentModes[quote.id] || quote.invoiceStatus,
      amount = Number(paymentAmounts[quote.id]);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("Enter the amount received.");
      return;
    }
    setSaving(quote.id);
    const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          amount,
          paymentDate: new Date().toISOString().slice(0, 10),
          method: "Bank transfer",
      reference: mode === "50% Paid" ? "50% deposit" : "Part payment",
          recordedBy: "Accounts team",
        }),
      }),
      result = await response.json();
    setSaving(null);
    if (!response.ok) {
      window.alert(result.error || "Payment could not be recorded.");
      return;
    }
    setPaymentModes((current) => ({ ...current, [quote.id]: "" }));
    setPaymentAmounts((current) => ({ ...current, [quote.id]: "" }));
    await load();
  }
  async function removePayment(payment: Payment) {
    if (!window.confirm("Delete this payment entry?")) return;
    const response = await fetch("/api/payments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: payment.id }),
    });
    if (response.ok) load();
    else window.alert("Payment could not be deleted.");
  }
  async function approveForDispatch(quote: InvoiceQuote) {
    setSaving(quote.id);
    try {
      const response = await fetch("/api/dispatch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quote.id,
          accountsApproved: !quote.accountsApproved,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        window.alert(result.error || "The dispatch approval could not be updated.");
        return;
      }
      await load();
    } finally {
      setSaving(null);
    }
  }
  const invoiced = invoices.filter((q) => q.invoiceStatus && q.invoiceStatus !== "To be Invoiced"),
    totalInvoiced = invoiced.reduce((sum, q) => sum + q.amount, 0),
    totalPaid = invoices.reduce((sum, q) => sum + Number(q.totalPaid || 0), 0),
    balanceAlerts = invoices.filter((q) => q.serviceType === "Installation" && q.jobStage === "Completed" && !!q.depositInvoiceSentAt && !q.balanceInvoiceSentAt && Number(q.totalPaid || 0) < Number(q.amount));
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Accepted jobs" value={String(invoices.length)} />
        <MetricCard label="Total invoiced" value={money(totalInvoiced)} />
        <MetricCard label="Outstanding" value={money(Math.max(0, totalInvoiced - totalPaid))} tone="amber" />
        <MetricCard label="Payments received" value={money(totalPaid)} tone="emerald" />
      </section>
      {balanceAlerts.length > 0 && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-bold text-amber-950">{balanceAlerts.length} completed installation{balanceAlerts.length === 1 ? " needs" : "s need"} a remaining invoice</p><p className="text-sm text-amber-800">Open the highlighted job below, enter the balance Xero invoice number, and send the remaining invoice.</p></div>
          <Button variant="outline" className="border-amber-400 bg-white" onClick={() => { setStatusTab("All"); setSearch(balanceAlerts[0].quoteNumber); setExpanded(balanceAlerts[0].id); }}>Review now</Button>
        </div>
      </section>}
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Accepted quotes and payments</h2>
            <p className="text-sm text-muted-foreground">Create the invoice, mark it sent, then keep its payment status up to date.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input className="pl-9 sm:w-72" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices or payment status…" />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b px-5 py-3">{["All","To be Invoiced","Awaiting Deposit","50% Paid","Part Paid","Account","Paid in Full"].map(name=><Button key={name} variant={statusTab===name?"default":"outline"} size="sm" onClick={()=>setStatusTab(name)}>{name}<span className="rounded-full bg-white/20 px-1.5 text-xs">{name==="All"?invoices.length:invoices.filter(q=>q.invoiceStatus===name).length}</span></Button>)}</div>
        <div className="grid gap-4 p-5">
          {filtered.map((quote) => {
            const status = quote.invoiceStatus || "To be Invoiced";
            const installation = quote.serviceType === "Installation",
              balanceDue = installation && quote.jobStage === "Completed" && !!quote.depositInvoiceSentAt && !quote.balanceInvoiceSentAt && Number(quote.totalPaid || 0) < Number(quote.amount),
              phaseSent = installation ? balanceDue ? !!quote.balanceInvoiceSentAt : !!quote.depositInvoiceSentAt : !!quote.invoiceSentAt,
              sent = status !== "To be Invoiced",
              open = expanded === quote.id;
            return (
              <article key={quote.id} className="rounded-2xl border p-5">
                <button type="button" onClick={() => setExpanded(open ? null : quote.id)} className="flex w-full flex-col gap-4 text-left lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-emerald-700">{displayedJobNumber(quote)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "Paid in Full" ? "bg-emerald-100 text-emerald-800" : status === "To be Invoiced" ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-800"}`}>{status}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{quote.serviceType || "Pick Up"}</span>
                      {quote.accountsApproved && <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800">Approved for dispatch</span>}
                      {balanceDue && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Remaining invoice due</span>}
                    </div>
                    <h3 className="mt-2 text-lg font-bold">
                      {quote.customerName}
                      {quote.companyName && ` · ${quote.companyName}`}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{quote.project}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <UserRound className="size-4" />
                        {quote.salespersonName || "Sai Muddasani"}
                      </span>
                      {quote.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="size-4" />
                          {quote.email}
                        </span>
                      )}
                      {quote.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-4" />
                          {quote.phone}
                        </span>
                      )}
                      {quote.siteAddress && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-4" />
                          {quote.siteAddress}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="shrink-0 text-2xl font-bold">
                      {new Intl.NumberFormat("en-NZ", {
                        style: "currency",
                        currency: "NZD",
                      }).format(quote.amount)}
                    </p>
                    <ChevronDown className={`size-5 transition ${open ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {open && (
                  <div className="mt-5 grid gap-4 rounded-xl border bg-slate-50 p-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Job service</p>
                      <p className="mt-1 font-semibold">{quote.serviceType || "Pick Up"}</p>
                      <p className="text-sm text-slate-500">{money(Number(quote.servicePrice || 0))} service charge</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Payment position</p>
                      <p className="mt-1 font-semibold">{money(quote.totalPaid || 0)} paid</p>
                      <p className="text-sm text-slate-500">{money(Math.max(0, quote.amount - (quote.totalPaid || 0)))} owing</p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <a href={`/api/quotes/${quote.id}/pdf`} className="inline-flex h-10 items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium">
                        <Download className="size-4" />
                        Quote PDF
                      </a>
                      {quote.invoiceNumber && (
                        <a href={`/api/invoices/${quote.id}/pdf`} className="inline-flex h-10 items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium">
                          <Download className="size-4" />
                          Invoice PDF
                        </a>
                      )}
                      <Button variant="outline" disabled={saving === quote.id || !!quote.orderConfirmationSentAt} onClick={() => sendOrderConfirmation(quote)}>
                        <Mail className="size-4" />
                        {quote.orderConfirmationSentAt ? "Order confirmation sent" : "Email full order confirmation"}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="mt-5 grid gap-3 border-t pt-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                  <div className="grid gap-2">
                    <Label htmlFor={`invoice-${quote.id}`}>{installation ? balanceDue ? "Remaining balance Xero invoice number" : "50% deposit Xero invoice number" : "Xero invoice number"}</Label>
                    <Input
                      id={`invoice-${quote.id}`}
                      value={numbers[quote.id] ?? ""}
                      disabled={phaseSent}
                      onChange={(e) =>
                        setNumbers((current) => ({
                          ...current,
                          [quote.id]: e.target.value,
                        }))
                      }
                      placeholder="e.g. INV-1045"
                      className="disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>
                  {phaseSent ? (
                    <div className="grid gap-2">
                      <Label>Payment status</Label>
                      <div className="flex h-10 items-center rounded-md border bg-white px-3 text-sm font-semibold">{status}</div>
                    </div>
                  ) : (
                    <div />
                  )}
                  {phaseSent ? (
                    <div className="flex gap-2">
                      <a href={`/invoice/${quote.acceptanceToken}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md border bg-white px-4 text-sm font-medium hover:bg-slate-50">
                        <ExternalLink className="size-4" />
                        View invoice
                      </a>
                      {!installation && <Button variant="outline" disabled={saving === quote.id} onClick={() => updateInvoice(quote, "To be Invoiced")}>Move back</Button>}
                    </div>
                  ) : (
                    <Button disabled={saving === quote.id} onClick={() => sendInvoice(quote)}>
                      <Mail className="size-4" />
                      {saving === quote.id ? "Sending…" : installation ? balanceDue ? "Send remaining invoice" : "Send 50% deposit invoice" : "Send invoice"}
                    </Button>
                  )}
                </div>
                {quote.invoiceSentAt && (
                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-cyan-900">Invoice sent {new Date(quote.invoiceSentAt).toLocaleString("en-NZ")}</p>
                    <Button variant={quote.accountsApproved ? "outline" : "default"} disabled={saving === quote.id} onClick={() => approveForDispatch(quote)}>
                      <PackageCheck className="size-4" />
                      {quote.accountsApproved ? "Remove from Dispatch" : "Send to Dispatch"}
                    </Button>
                  </div>
                )}
                {sent && (
                  <details className="mt-4 rounded-xl border bg-slate-50" open={quote.payments?.length > 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between p-4">
                      <span className="flex items-center gap-2 font-semibold">
                        <DollarSign className="size-4 text-emerald-700" />
                        Payment history
                      </span>
                      <span className="text-sm font-bold">
                        {money(quote.totalPaid || 0)} paid · {money(Math.max(0, quote.amount - (quote.totalPaid || 0)))} owing
                      </span>
                    </summary>
                    <div className="border-t p-4">
                      <div className="space-y-2">
                        {quote.payments?.map((payment) => editingPayment?.id === payment.id ? (
                          <form key={payment.id} onSubmit={(event) => editPayment(event, payment)} className="grid gap-3 rounded-lg border border-emerald-300 bg-white p-3 md:grid-cols-[9rem_10rem_10rem_1fr_auto]">
                            <Input name="amount" required type="number" min="0.01" step="0.01" defaultValue={payment.amount} aria-label="Payment amount" />
                            <Input name="paymentDate" required type="date" defaultValue={payment.paymentDate} aria-label="Payment date" />
                            <select name="method" defaultValue={payment.method} className="h-10 rounded-md border bg-white px-3 text-sm" aria-label="Payment method">
                              <option>Bank transfer</option><option>EFTPOS</option><option>Credit card</option><option>Cash</option><option>Other</option>
                            </select>
                            <Input name="reference" defaultValue={payment.reference} placeholder="Reference / notes" />
                            <div className="flex gap-2"><Button disabled={saving === payment.id}>Save</Button><Button type="button" variant="outline" onClick={() => setEditingPayment(null)}>Cancel</Button></div>
                          </form>
                        ) : (
                          <div key={payment.id} className="flex flex-col justify-between gap-2 rounded-lg border bg-white p-3 sm:flex-row sm:items-center">
                            <div>
                              <p className="font-semibold">
                                {money(payment.amount)} · {payment.method}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(`${payment.paymentDate}T00:00:00`).toLocaleDateString("en-NZ")}
                                {payment.reference ? ` · ${payment.reference}` : ""}
                                {payment.notes ? ` · ${payment.notes}` : ""}
                              </p>
                            </div>
                            <div className="flex gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => setEditingPayment(payment)} aria-label="Edit payment"><Pencil className="size-4" /></Button><Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => removePayment(payment)} aria-label="Delete payment"><Trash2 className="size-4" /></Button></div>
                          </div>
                        ))}
                        {!quote.payments?.length && <p className="text-sm text-slate-500">No payments recorded yet.</p>}
                      </div>
                      {(quote.totalPaid || 0) < quote.amount && (
                        <form onSubmit={(e) => recordPayment(e, quote)} className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-[9rem_10rem_10rem_1fr_auto]">
                          <Input name="amount" required={(paymentModes[quote.id] || "Bank transfer") !== "Account"} disabled={(paymentModes[quote.id] || "Bank transfer") === "Account"} type="number" min="0.01" max={Math.max(0, quote.amount - (quote.totalPaid || 0))} step="0.01" placeholder={(paymentModes[quote.id] || "Bank transfer") === "Account" ? "Not required" : "Amount"} />
                          <Input name="paymentDate" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                          <select name="method" value={paymentModes[quote.id] || "Bank transfer"} onChange={(event) => setPaymentModes((current) => ({ ...current, [quote.id]: event.target.value }))} className="h-10 rounded-md border bg-white px-3 text-sm">
                            <option>Bank transfer</option>
                            <option>EFTPOS</option>
                            <option>Credit card</option>
                            <option>Cash</option>
                            <option>Other</option>
                            <option>Account</option>
                          </select>
                          <Input name="reference" placeholder="Reference / notes" />
                          <Button disabled={saving === quote.id}>
                            <Plus className="size-4" />
                            {(paymentModes[quote.id] || "Bank transfer") === "Account" ? "Set Account" : "Add payment"}
                          </Button>
                        </form>
                      )}
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </div>
        {!filtered.length && (
          <div className="p-12 text-center text-muted-foreground">
            <ReceiptText className="mx-auto mb-3 size-8" />
            No accepted quotes are waiting here.
          </div>
        )}
      </section>
    </div>
  );
}
export function TeamPanel() {
  const [team, setTeam] = useState<TeamMember[]>([]),
    [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false);
  function load() {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => setTeam(d.team ?? []));
  }
  useEffect(load, []);
  async function addMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      data = Object.fromEntries(new FormData(form));
    const email = String(data.email ?? "")
      .trim()
      .toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      window.alert("Enter a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, email }),
      });
      const result = await response.json();
      if (!response.ok) {
        window.alert(result.error || "Team member could not be saved.");
        return;
      }
      setTeam((current) => [...current, result.member].sort((a, b) => a.name.localeCompare(b.name)));
      setOpen(false);
      form.reset();
    } finally {
      setSaving(false);
    }
  }
  async function toggle(member: TeamMember) {
    const response = await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, active: !member.active }),
    });
    if (response.ok) {
      const result = await response.json();
      setTeam((current) => current.map((item) => (item.id === member.id ? result.member : item)));
    }
  }
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Sales team</h2>
          <p className="text-sm text-muted-foreground">Add salespeople so quotes and showroom enquiries can be assigned clearly.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add salesperson
        </Button>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">S</span>
            <div>
              <h3 className="font-bold">Sai Muddasani</h3>
              <p className="text-sm text-muted-foreground">Sales & Design Consultant</p>
            </div>
          </div>
          <span className="mt-4 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Active · Default</span>
        </article>
        {team.map((member) => (
          <article key={member.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${member.active ? "" : "opacity-60"}`}>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-slate-100 font-bold">{member.name.slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <h3 className="truncate font-bold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {member.email && <Line icon={<Mail />}>{member.email}</Line>}
              {member.phone && <Line icon={<Phone />}>{member.phone}</Line>}
            </div>
            <Button className="mt-4" variant="outline" size="sm" onClick={() => toggle(member)}>
              {member.active ? "Deactivate" : "Reactivate"}
            </Button>
          </article>
        ))}
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={addMember} noValidate>
            <DialogHeader>
              <DialogTitle>Add salesperson</DialogTitle>
              <DialogDescription>They will appear in assignment menus across RobeFlow.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5 sm:grid-cols-2">
              <FormField label="Name *" wide>
                <Input name="name" required />
              </FormField>
              <FormField label="Role">
                <Input name="role" defaultValue="Salesperson" />
              </FormField>
              <FormField label="Email address *">
                <Input name="email" type="email" required autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="name@gmail.com" />
              </FormField>
              <FormField label="Phone">
                <Input name="phone" type="tel" />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save salesperson"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QrCard() {
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(intakeUrl)}`;
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-slate-50 p-3">
      <img src={qr} alt="QR code for customer quotation form" className="size-24 rounded-lg bg-white" />
      <div>
        <p className="flex items-center gap-2 font-bold">
          <QrCode className="size-4" />
          Showroom QR form
        </p>
        <p className="mt-1 max-w-56 text-xs text-muted-foreground">Print this QR code or open the form on a showroom device.</p>
        <a href={intakeUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
          Open form <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
function Line({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-slate-400">
      {icon}
      <span className="break-all">{children}</span>
    </p>
  );
}
function FormField({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid gap-2 ${wide ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function MetricCard({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "amber" | "emerald" }) {
  const style = tone === "emerald" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" : "bg-white";
  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${style}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  );
}
const money = (value: number) =>
  new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

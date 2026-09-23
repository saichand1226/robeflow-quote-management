"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Columns3,
  Download,
  ExternalLink,
  Filter,
  List,
  MapPin,
  Search,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { displayedJobNumber } from "@/lib/job-reference";
import { displayCustomValue, type CustomFieldValue } from "@/lib/custom-fields";

type Job = {
  id: number;
  quoteNumber: string;
  customerName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  siteAddress?: string;
  project: string;
  amount: number;
  status: string;
  invoiceStatus?: string;
  invoiceNumber?: string;
  depositInvoiceNumber?: string;
  balanceInvoiceNumber?: string;
  validUntil: string;
  followUpDate?: string;
  jobStage?: string;
  salespersonName?: string;
  serviceType?: string;
  accountsApproved?: boolean;
  dispatchStatus?: string;
  trackingNumber?: string;
  pickListStatus?: string;
  acceptanceToken?: string;
  customFields?: CustomFieldValue[];
};
type Board = "Sales" | "Dispatch" | "Installation";
type View = "Board" | "Table";
type Column = {
  name: string;
  match: (job: Job) => boolean;
  changes: Record<string, string>;
};
const cash = (value: number) =>
  new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(value || 0);
const salesColumns: Column[] = [
  {
    name: "Draft",
    match: (j) => j.status === "Draft",
    changes: { status: "Draft" },
  },
  {
    name: "Sent",
    match: (j) => j.status === "Sent",
    changes: { status: "Sent" },
  },
  {
    name: "Accepted",
    match: (j) => j.status === "Accepted",
    changes: { status: "Accepted" },
  },
  {
    name: "Declined / expired",
    match: (j) => ["Declined", "Expired"].includes(j.status),
    changes: { status: "Declined" },
  },
  {
    name: "Sale Lost",
    match: (j) => j.jobStage === "Sale Lost",
    changes: { jobStage: "Sale Lost" },
  },
];
const dispatchColumns: Column[] = [
  {
    name: "Awaiting approval",
    match: (j) => j.status === "Accepted" && !j.accountsApproved,
    changes: { accountsApproved: "false", dispatchStatus: "Awaiting dispatch" },
  },
  {
    name: "Pick list required",
    match: (j) =>
      !!j.accountsApproved &&
      (!j.pickListStatus || j.pickListStatus === "Not generated"),
    changes: {
      accountsApproved: "true",
      dispatchStatus: "Awaiting dispatch",
      pickListStatus: "Not generated",
    },
  },
  {
    name: "Picking",
    match: (j) =>
      !!j.accountsApproved &&
      !["Not generated", "Picked"].includes(
        j.pickListStatus || "Not generated",
      ) &&
      !["Ready", "Collected", "Dispatched", "Delivered"].includes(
        j.dispatchStatus || "",
      ),
    changes: {
      accountsApproved: "true",
      dispatchStatus: "Awaiting dispatch",
      pickListStatus: "In progress",
    },
  },
  {
    name: "Ready",
    match: (j) => j.dispatchStatus === "Ready" || j.pickListStatus === "Picked",
    changes: {
      accountsApproved: "true",
      dispatchStatus: "Ready",
      pickListStatus: "Picked",
    },
  },
  {
    name: "Dispatched",
    match: (j) => ["Dispatched", "Delivered"].includes(j.dispatchStatus || ""),
    changes: { accountsApproved: "true", dispatchStatus: "Dispatched" },
  },
  {
    name: "Completed · payment due",
    match: (j) =>
      ["Completed", "Collected"].includes(j.dispatchStatus || "") &&
      j.invoiceStatus !== "Paid in Full",
    changes: { accountsApproved: "true", dispatchStatus: "Completed" },
  },
];
const installationStages = [
  "Site measure required",
  "Measure booked",
  "Measurement completed",
  "Design approved",
  "Deposit received",
  "Materials ordered",
  "Ready for installation",
  "Installation booked",
  "Installed",
  "Completed",
  "Sale Lost",
];
const installationColumns: Column[] = installationStages.map((name) => ({
  name,
  match: (j) => (j.jobStage || "Site measure required") === name,
  changes: { jobStage: name },
}));

export default function JobBoard({ currentName }: { currentName: string }) {
  const [jobs, setJobs] = useState<Job[]>([]),
    [board, setBoard] = useState<Board>("Sales"),
    [view, setView] = useState<View>("Board"),
    [search, setSearch] = useState(""),
    [salesperson, setSalesperson] = useState("All"),
    [service, setService] = useState("All"),
    [payment, setPayment] = useState("All"),
    [mine, setMine] = useState(false),
    [selected, setSelected] = useState<Job | null>(null),
    [busy, setBusy] = useState<number | null>(null);
  async function load() {
    const r = await fetch("/api/quotes");
    if (r.ok) setJobs((await r.json()).quotes ?? []);
  }
  useEffect(() => {
    load();
  }, []);
  const people = useMemo(
    () =>
      Array.from(
        new Set(jobs.map((j) => j.salespersonName || "Unassigned")),
      ).sort(),
    [jobs],
  );
  const eligible = useMemo(
    () =>
      jobs
        .filter(
          (j) =>
            !["Declined", "Completed"].includes(j.status) &&
            j.jobStage !== "Sale Lost" &&
            !(
              (j.jobStage === "Completed" ||
                j.dispatchStatus === "Completed" ||
                j.dispatchStatus === "Collected") &&
              j.invoiceStatus === "Paid in Full"
            ),
        )
        .filter(
          (j) =>
            board === "Sales" ||
            (board === "Dispatch"
              ? j.status === "Accepted" && j.serviceType !== "Installation"
              : j.status === "Accepted" && j.serviceType === "Installation"),
        ),
    [jobs, board],
  );
  const filtered = useMemo(
    () =>
      eligible.filter(
        (j) =>
          (salesperson === "All" ||
            (j.salespersonName || "Unassigned") === salesperson) &&
          (!mine ||
            (j.salespersonName || "").toLowerCase() ===
              currentName.toLowerCase()) &&
          (service === "All" || (j.serviceType || "Pick Up") === service) &&
          (payment === "All" ||
            (j.invoiceStatus || "To be Invoiced") === payment) &&
          `${j.quoteNumber} ${j.customerName} ${j.companyName || ""} ${j.project} ${j.siteAddress || ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [eligible, salesperson, mine, currentName, service, payment, search],
  );
  const columns =
    board === "Sales"
      ? salesColumns
      : board === "Dispatch"
        ? dispatchColumns
        : installationColumns;
  async function move(job: Job, column: Column) {
    setBusy(job.id);
    const r = await fetch(`/api/quotes/${job.id}/board`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...column.changes, actor: currentName }),
    });
    setBusy(null);
    if (!r.ok) {
      window.alert((await r.json()).error || "The job could not be moved.");
      return;
    }
    await load();
  }
  function card(job: Job) {
    const fields = (job.customFields ?? []).filter(
      (field) => field.showJobCard && field.value,
    );
    return (
      <article
        draggable
        onDragStart={(e) =>
          e.dataTransfer.setData("text/job-id", String(job.id))
        }
        onClick={() => setSelected(job)}
        key={job.id}
        className={`cursor-grab rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md active:cursor-grabbing ${busy === job.id ? "opacity-50" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold text-emerald-700">
            {displayedJobNumber(job)}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold">
            {job.serviceType || "Pick Up"}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-1 font-bold text-slate-900">
          {job.customerName}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
          {job.project}
        </p>
        {fields.length > 0 && (
          <dl className="mt-3 space-y-1 rounded-lg bg-slate-50 p-2 text-xs">
            {fields.map((field) => (
              <div key={field.fieldId} className="flex justify-between gap-2">
                <dt className="truncate text-slate-500">{field.label}</dt>
                <dd className="truncate font-semibold text-slate-800">
                  {displayCustomValue(field.value, field.fieldType)}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge value={job.invoiceStatus || "Invoice pending"} />
          {job.pickListStatus && job.pickListStatus !== "Not generated" && (
            <Badge value={`Pick: ${job.pickListStatus}`} />
          )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-2 border-t pt-3">
          <span className="line-clamp-1 text-xs text-slate-500">
            {job.salespersonName || "Unassigned"}
          </span>
          <strong className="text-sm">{cash(job.amount)}</strong>
        </div>
      </article>
    );
  }
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Columns3 className="text-emerald-700" />
              Job board
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Move compact job cards through Sales, Dispatch and Installation.
              Click a card for full details.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={view === "Board" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("Board")}
            >
              <Columns3 className="size-4" />
              Board
            </Button>
            <Button
              variant={view === "Table" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("Table")}
            >
              <List className="size-4" />
              Table
            </Button>
            <a
              href="#calendar-note"
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium"
            >
              <CalendarDays className="size-4" />
              Calendar in Jobs & installation
            </a>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder="Search jobs, customers or sites…"
            />
          </div>
          <FilterSelect
            value={salesperson}
            onChange={setSalesperson}
            options={["All", ...people]}
            label="Salesperson"
          />
          <FilterSelect
            value={service}
            onChange={setService}
            options={["All", "Installation", "Pick Up", "Freight", "Delivery"]}
            label="Service"
          />
          <FilterSelect
            value={payment}
            onChange={setPayment}
            options={[
              "All",
              "To be Invoiced",
              "Awaiting Deposit",
              "Part Paid",
              "50% Paid",
              "Paid in Full",
              "Account",
            ]}
            label="Payment"
          />
          <Button
            variant={mine ? "default" : "outline"}
            onClick={() => setMine((v) => !v)}
          >
            <UserRound className="size-4" />
            My jobs
          </Button>
          {(search ||
            salesperson !== "All" ||
            service !== "All" ||
            payment !== "All" ||
            mine) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setSalesperson("All");
                setService("All");
                setPayment("All");
                setMine(false);
              }}
            >
              <X className="size-4" />
              Clear
            </Button>
          )}
        </div>
      </section>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["Sales", "Dispatch", "Installation"] as Board[]).map((name) => (
          <Button
            key={name}
            variant={board === name ? "default" : "outline"}
            onClick={() => setBoard(name)}
          >
            {name}
          </Button>
        ))}
      </div>
      {view === "Board" ? (
        <section className="flex min-h-[32rem] gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const rows = filtered.filter(column.match);
            return (
              <div
                key={column.name}
                className="w-72 shrink-0 rounded-2xl bg-slate-100/80 p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = Number(e.dataTransfer.getData("text/job-id")),
                    job = jobs.find((j) => j.id === id);
                  if (job) move(job, column);
                }}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    {column.name}
                  </h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">
                    {rows.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {rows.map(card)}
                  {!rows.length && (
                    <div className="rounded-xl border border-dashed bg-white/60 p-5 text-center text-xs text-slate-400">
                      Drop a job here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <JobTable jobs={filtered} onOpen={setSelected} />
      )}
      <p id="calendar-note" className="text-xs text-slate-500">
        Use Jobs & installation for the scheduling calendar and site-measure
        bookings.
      </p>
      <JobDialog job={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Badge({ value }: { value: string }) {
  const good = value.includes("Paid in Full") || value.includes("Picked"),
    warn = value.includes("pending") || value === "To be Invoiced";
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-bold ${good ? "bg-emerald-100 text-emerald-800" : warn ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-800"}`}
    >
      {value}
    </span>
  );
}
function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-md border bg-white px-3 text-sm"
    >
      <option disabled value="">
        {label}
      </option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}
function JobTable({
  jobs,
  onOpen,
}: {
  jobs: Job[];
  onOpen: (job: Job) => void;
}) {
  return (
    <section className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full min-w-[850px] text-sm">
        <thead className="bg-slate-900 text-white">
          <tr>
            <th className="p-3 text-left">Job</th>
            <th className="p-3 text-left">Customer / project</th>
            <th className="p-3 text-left">Salesperson</th>
            <th className="p-3 text-left">Service</th>
            <th className="p-3 text-left">Stage</th>
            <th className="p-3 text-left">Payment</th>
            <th className="p-3 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              onClick={() => onOpen(job)}
              className="cursor-pointer border-b hover:bg-emerald-50"
            >
              <td className="p-3 font-bold text-emerald-700">
                {displayedJobNumber(job)}
              </td>
              <td className="p-3">
                <strong>{job.customerName}</strong>
                <span className="block text-xs text-slate-500">
                  {job.project}
                </span>
              </td>
              <td className="p-3">{job.salespersonName || "Unassigned"}</td>
              <td className="p-3">{job.serviceType || "Pick Up"}</td>
              <td className="p-3">
                {job.serviceType === "Installation"
                  ? job.jobStage
                  : job.dispatchStatus || job.status}
              </td>
              <td className="p-3">
                <Badge value={job.invoiceStatus || "Invoice pending"} />
              </td>
              <td className="p-3 text-right font-bold">{cash(job.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!jobs.length && (
        <p className="p-10 text-center text-slate-500">
          No jobs match these filters.
        </p>
      )}
    </section>
  );
}
function JobDialog({ job, onClose }: { job: Job | null; onClose: () => void }) {
  return (
    <Dialog
      open={!!job}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {job ? displayedJobNumber(job) : ""} · {job?.customerName}
          </DialogTitle>
          <DialogDescription>{job?.project}</DialogDescription>
        </DialogHeader>
        {job && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge value={job.status} />
              <Badge value={job.invoiceStatus || "Invoice pending"} />
              <Badge value={job.serviceType || "Pick Up"} />
            </div>
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <Detail
                label="Salesperson"
                value={job.salespersonName || "Unassigned"}
              />
              <Detail label="Value" value={cash(job.amount)} />
              <Detail
                label="Customer email"
                value={job.email || "Not recorded"}
              />
              <Detail label="Phone" value={job.phone || "Not recorded"} />
              <Detail
                label="Site address"
                value={job.siteAddress || "Not recorded"}
              />
              <Detail
                label="Valid until"
                value={
                  job.validUntil
                    ? new Date(`${job.validUntil}T00:00:00`).toLocaleDateString(
                        "en-NZ",
                      )
                    : "Not set"
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/quotes/${job.id}/pdf`}
                target="_blank"
                className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium"
              >
                <Download className="size-4" />
                Quote PDF
              </a>
              {job.invoiceStatus && job.invoiceStatus !== "To be Invoiced" && (
                <a
                  href={`/api/invoices/${job.id}/pdf`}
                  target="_blank"
                  className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium"
                >
                  <Download className="size-4" />
                  Invoice PDF
                </a>
              )}
              {job.pickListStatus && job.pickListStatus !== "Not generated" && (
                <a
                  href={`/pick-list/${job.id}`}
                  target="_blank"
                  className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium"
                >
                  <ExternalLink className="size-4" />
                  Pick list
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Search, X } from "lucide-react";
import { displayedJobNumber } from "@/lib/job-reference";

type SearchQuote = {
  id: number;
  quoteNumber: string;
  invoiceNumber?: string;
  customerName: string;
  project: string;
  email?: string;
  phone?: string;
  siteAddress?: string;
  trackingNumber?: string;
  status: string;
};
type Reminder = {
  id: string;
  quoteNumber: string;
  customerName: string;
  message: string;
  urgency: string;
};

export default function WorkspaceHeaderTools({
  quotes,
  onOpen,
}: {
  quotes: SearchQuote[];
  onOpen: (quote: SearchQuote) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false),
    [alertsOpen, setAlertsOpen] = useState(false),
    [query, setQuery] = useState(""),
    [reminders, setReminders] = useState<Reminder[]>([]);
  useEffect(() => {
    fetch("/api/reminders")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setReminders(data?.reminders ?? []))
      .catch(() => {});
  }, []);
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return quotes.slice(0, 8);
    return quotes
      .filter((quote) =>
        [
          quote.quoteNumber,
          quote.invoiceNumber,
          quote.customerName,
          quote.project,
          quote.email,
          quote.phone,
          quote.siteAddress,
          quote.trackingNumber,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 12);
  }, [query, quotes]);
  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => {
          setSearchOpen(true);
          setAlertsOpen(false);
        }}
        className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <Search className="size-4" />
        <span className="hidden md:inline">Search</span>
      </button>
      <button
        onClick={() => {
          setAlertsOpen((value) => !value);
          setSearchOpen(false);
        }}
        className="relative grid size-10 place-items-center rounded-xl border bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {reminders.length > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {Math.min(reminders.length, 99)}
          </span>
        )}
      </button>
      {alertsOpen && (
        <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-4">
            <strong>Action centre</strong>
            <button onClick={() => setAlertsOpen(false)}>
              <X className="size-4" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {reminders.slice(0, 10).map((item) => (
              <article
                key={item.id}
                className="rounded-xl p-3 hover:bg-amber-50"
              >
                <p className="font-semibold">
                  {item.quoteNumber} · {item.customerName}
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                  {item.urgency}
                </span>
              </article>
            ))}
            {!reminders.length && (
              <p className="p-6 text-center text-sm text-slate-500">
                No urgent actions right now.
              </p>
            )}
          </div>
        </div>
      )}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={() => setSearchOpen(false)}
        >
          <section
            className="mx-auto mt-[8vh] max-w-2xl overflow-hidden rounded-3xl border bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b p-4">
              <Search className="size-5 text-emerald-700" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 flex-1 bg-transparent text-base outline-none"
                placeholder="Search customer, quote, invoice, phone, address or tracking…"
              />
              <button onClick={() => setSearchOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.map((quote) => (
                <button
                  key={quote.id}
                  onClick={() => {
                    onOpen(quote);
                    setSearchOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-4 rounded-xl p-3 text-left hover:bg-emerald-50"
                >
                  <div>
                    <p className="font-bold text-emerald-800">
                      {displayedJobNumber(quote)}
                    </p>
                    <p className="font-semibold text-slate-900">
                      {quote.customerName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {quote.project}
                      {quote.siteAddress ? ` · ${quote.siteAddress}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                    {quote.status}
                  </span>
                </button>
              ))}
              {!results.length && (
                <p className="p-10 text-center text-slate-500">
                  No matching jobs found.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

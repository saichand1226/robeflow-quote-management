"use client";
import { useEffect, useState } from "react";
import { Landmark, Printer, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
const money = (value: number) =>
  new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
  }).format(value);
export default function InvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [invoice, setInvoice] = useState<any>(),
    [error, setError] = useState("");
  useEffect(() => {
    params.then(async (p) => {
      try {
        const r = await fetch(
            `/api/public/invoice/${encodeURIComponent(p.token)}`,
          ),
          d = await r.json();
        if (!r.ok) setError(d.error || "Invoice could not be opened.");
        else setInvoice(d.invoice);
      } catch {
        setError("Invoice could not be opened.");
      }
    });
  }, [params]);
  if (error)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <section className="rounded-2xl border bg-white p-8 text-center">
          <h1 className="text-xl font-bold">Unable to open invoice</h1>
          <p className="mt-2 text-slate-600">{error}</p>
        </section>
      </main>
    );
  if (!invoice)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        Loading invoice…
      </main>
    );
  const paid = invoice.payments.reduce(
      (sum: number, p: any) => sum + Number(p.amount),
      0,
    ),
    balance = Math.max(0, invoice.amount - paid);
  return (
    <main className="invoice-print min-h-screen bg-slate-100 p-4 sm:p-10 print:bg-white print:p-0">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <header className="flex flex-col justify-between gap-5 border-b-4 border-emerald-700 pb-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-emerald-700 text-white">
              <WalletCards />
            </span>
            <div>
              <h1 className="text-2xl font-bold">{invoice.company}</h1>
              <p className="text-sm text-slate-500">{invoice.address}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-3xl font-light tracking-wide text-emerald-700">
              INVOICE
            </p>
            <p className="font-bold">{invoice.invoiceNumber}</p>
          </div>
        </header>
        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Bill to
            </p>
            <p className="mt-2 text-lg font-bold">{invoice.customerName}</p>
            {invoice.companyName && <p>{invoice.companyName}</p>}
            <p className="text-sm text-slate-500">{invoice.email}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-slate-500">Invoice date</p>
            <p className="font-semibold">
              {new Date(invoice.invoiceSentAt).toLocaleDateString("en-NZ")}
            </p>
            {invoice.invoiceDueDate && (
              <>
                <p className="mt-2 text-sm text-slate-500">Due date</p>
                <p className="font-semibold">
                  {new Date(
                    `${invoice.invoiceDueDate}T00:00:00`,
                  ).toLocaleDateString("en-NZ")}
                </p>
              </>
            )}
            <p className="mt-2 text-sm text-slate-500">Quote reference</p>
            <p className="font-semibold">{invoice.quoteNumber}</p>
          </div>
        </section>
        <h2 className="mb-3 text-lg font-bold">{invoice.project}</h2>
        <section className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-[1fr_9rem] bg-slate-900 p-3 font-semibold text-white">
            <span>Description</span>
            <span className="text-right">Amount</span>
          </div>
          {invoice.items.map((item: any) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_9rem] border-t p-4"
            >
              <div>
                <p className="font-semibold">{item.category}</p>
                <p className="text-sm text-slate-500">
                  {item.systemType} · {item.colour}
                </p>
              </div>
              <strong className="text-right">{money(item.price)}</strong>
            </div>
          ))}
        </section>
        <section className="ml-auto mt-6 max-w-sm space-y-2">
          <p className="flex justify-between">
            <span>Invoice total</span>
            <strong>{money(invoice.amount)}</strong>
          </p>
          <p className="flex justify-between text-slate-500">
            <span>Payments received</span>
            <span>-{money(paid)}</span>
          </p>
          <p className="flex justify-between border-t-2 border-emerald-700 pt-3 text-xl font-bold">
            <span>Balance due</span>
            <span>{money(balance)}</span>
          </p>
        </section>
        <section className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="flex items-center gap-2 font-bold text-emerald-900">
            <Landmark className="size-5" />
            Pay by bank transfer
          </h2>
          <p className="mt-3 whitespace-pre-line text-slate-700">
            {invoice.bankDetails}
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Open your bank’s app or website and use these details to make the
            payment.
          </p>
        </section>
        <footer className="mt-8 flex justify-end print:hidden">
          <Button onClick={() => window.print()}>
            <Printer />
            Print or save PDF
          </Button>
        </footer>
      </article>
    </main>
  );
}

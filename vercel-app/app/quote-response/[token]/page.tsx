"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, WalletCards, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { quoteItemDetails } from "@/lib/quote-options";
export default function QuoteResponse({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState(""),
    [quote, setQuote] = useState<any>(),
    [error, setError] = useState(""),
    [done, setDone] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    params
      .then(async (p) => {
        setToken(p.token);
        const r = await fetch(
            `/api/public/quote-response/${encodeURIComponent(p.token)}`,
          ),
          d = await r.json();
        if (r.ok) setQuote(d.quote);
        else setError(d.error || "This quotation could not be opened.");
      })
      .catch(() => setError("This quotation could not be opened."));
  }, [params]);
  async function respond(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      button = (e.nativeEvent as SubmitEvent)
        .submitter as HTMLButtonElement | null,
      decision = button?.value || "Accepted";
    setBusy(true);
    try {
      const data = Object.fromEntries(new FormData(form)),
        r = await fetch(
          `/api/public/quote-response/${encodeURIComponent(token)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, decision }),
          },
        ),
        result = await r.json();
      if (r.ok) setDone(result.status);
      else setError(result.error || "Your response could not be submitted.");
    } catch {
      setError("Your response could not be submitted.");
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <section className="max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold">Unable to open quotation</h1>
          <p className="mt-2 text-slate-600">{error}</p>
        </section>
      </main>
    );
  if (!quote)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        Loading quotation…
      </main>
    );
  if (done)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <section className="max-w-lg rounded-2xl border bg-white p-10 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-12 text-emerald-700" />
          <h1 className="mt-4 text-2xl font-bold">Response received</h1>
          <p className="mt-2 text-slate-600">
            Thank you. {quote.quoteNumber} has been marked {done.toLowerCase()}.
          </p>
        </section>
      </main>
    );
  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-700 text-white">
            <WalletCards />
          </span>
          <div>
            <h1 className="text-2xl font-bold">
              Quotation {quote.quoteNumber}
            </h1>
            <p className="text-slate-600">Prepared for {quote.customerName}</p>
          </div>
        </header>
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">{quote.project}</h2>
          <div className="mt-5 divide-y rounded-xl border">
            {quote.items.map((item: any) => (
              <div key={item.id} className="flex justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold">{item.category}</p>
                  <p className="text-sm text-slate-500">
                    {quoteItemDetails(item)}
                  </p>
                </div>
                <strong>${Number(item.price).toLocaleString("en-NZ")}</strong>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t-2 border-emerald-700 pt-4 text-xl font-bold">
            <span>Total incl. GST</span>
            <span>${Number(quote.amount).toLocaleString("en-NZ")}</span>
          </div>
          <form className="mt-7 space-y-4" onSubmit={respond}>
            <div>
              <Label>Purchase order number (optional)</Label>
              <Input className="mt-2" name="purchaseOrderNumber" />
            </div>
            <div>
              <Label>Comment or requested change</Label>
              <textarea
                name="comment"
                className="mt-2 min-h-24 w-full rounded-md border p-3"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" value="Accepted" disabled={busy}>
                <CheckCircle2 />
                Accept quotation
              </Button>
              <Button
                className="flex-1"
                value="Declined"
                variant="outline"
                disabled={busy}
              >
                <XCircle />
                Decline quotation
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

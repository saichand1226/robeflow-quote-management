import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Database, FileText, LockKeyhole, Play, ShieldCheck, Users, WalletCards } from "lucide-react";

export default function Home() {
  const features = [
    [FileText, "Quotes & revisions", "Create quotations, track status and manage design details."],
    [Users, "Customers & sales", "Customer records, salesperson assignment and follow-up workflow."],
    [WalletCards, "Invoices & payments", "Invoice delivery, deposits, balances and payment history."],
    [BriefcaseBusiness, "Jobs & dispatch", "Scheduling, installation, dispatch and warehouse pick lists."],
  ] as const;

  return <main className="min-h-screen bg-[#f4f7f9] text-slate-950">
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-700 text-white"><WalletCards className="size-5"/></span><div><p className="text-lg font-extrabold leading-none">RobeFlow</p><p className="mt-1 text-xs font-medium text-slate-500">Quote & operations management</p></div></div>
        <a href="https://saimuddasani.com" target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-600 hover:text-emerald-700">Sai&apos;s portfolio</a>
      </div>
    </header>

    <section className="relative overflow-hidden bg-[#10213d] text-white">
      <div className="absolute -right-24 -top-24 size-96 rounded-full bg-emerald-400/10 blur-3xl"/>
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-24">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-sm font-bold text-emerald-200"><CheckCircle2 className="size-4"/>Full-stack portfolio project</span><h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">One workspace for every stage of a wardrobe job.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">RobeFlow connects customer enquiries, quotations, pricing, invoices, payments, scheduling, dispatch and installation in one role-based application.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 font-extrabold text-slate-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-300"><Play className="size-4 fill-current"/>Try the interactive demo</Link><a href="https://sai-quote-manager.saichandreddy.chatgpt.site/staff" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3.5 font-bold text-white hover:bg-white/10"><LockKeyhole className="size-4"/>Staff login</a></div><p className="mt-4 flex items-center gap-2 text-sm text-slate-400"><ShieldCheck className="size-4 text-emerald-300"/>The demo uses fictional data and never sends real emails.</p></div>
        <div className="rounded-3xl border border-white/10 bg-white/[.07] p-5 shadow-2xl backdrop-blur"><div className="flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Live workflow</p><p className="mt-1 font-extrabold">RF-2026-1047</p></div><span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-extrabold text-slate-950">Accepted</span></div><div className="mt-5 space-y-3">{["Quotation approved","50% deposit recorded","Site measure scheduled","Pick list generated"].map((item,i)=><div key={item} className="flex items-center gap-3 rounded-xl bg-slate-950/25 p-3"><span className={`grid size-7 place-items-center rounded-full text-xs font-black ${i<3?"bg-emerald-400 text-slate-950":"border border-slate-500 text-slate-300"}`}>{i<3?<CheckCircle2 className="size-4"/>:4}</span><span className="font-semibold">{item}</span></div>)}</div></div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-14"><div className="max-w-2xl"><p className="text-sm font-extrabold uppercase tracking-widest text-emerald-700">What recruiters can explore</p><h2 className="mt-2 text-3xl font-black tracking-tight">A working business application, not a static mock-up.</h2></div><div className="mt-8 grid gap-4 md:grid-cols-2">{features.map(([Icon,title,copy])=><article key={title} className="rounded-2xl border bg-white p-5 shadow-sm"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-5"/></span><h3 className="mt-4 text-lg font-extrabold">{title}</h3><p className="mt-1 leading-6 text-slate-600">{copy}</p></article>)}</div><div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:flex-row sm:items-center"><div><h2 className="text-xl font-extrabold text-emerald-950">Explore the system safely</h2><p className="mt-1 text-emerald-900/70">Switch between Admin, Sales, Accounts and Operations roles inside the demo.</p></div><Link href="/demo" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-extrabold text-white hover:bg-emerald-800">Open RobeFlow demo <ArrowRight className="size-4"/></Link></div></section>

    <footer className="border-t bg-white"><div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>Designed and developed by Saichand Muddasani.</p><p className="flex items-center gap-2"><Database className="size-4"/>React · TypeScript · SQL · Cloud deployment</p></div></footer>
  </main>;
}

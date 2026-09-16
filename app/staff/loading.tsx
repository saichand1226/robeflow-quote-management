import { LoaderCircle, WalletCards } from "lucide-react";

export default function StaffLoading() {
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
    <section className="w-full max-w-sm rounded-2xl border bg-white p-8 text-center shadow-sm">
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-emerald-700 text-white"><WalletCards className="size-6"/></span>
      <h1 className="mt-4 text-xl font-extrabold">Opening RobeFlow</h1>
      <p className="mt-2 text-sm text-slate-500">Checking your secure staff session…</p>
      <LoaderCircle className="mx-auto mt-5 size-5 animate-spin text-emerald-700"/>
    </section>
  </main>;
}

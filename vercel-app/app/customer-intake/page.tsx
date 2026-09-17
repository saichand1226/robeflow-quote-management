"use client";
import { useState } from "react";
import { CheckCircle2, FileUp, Ruler, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CustomerIntakePage(){
 const [sending,setSending]=useState(false),[reference,setReference]=useState("");
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setSending(true);try{const form=new FormData(e.currentTarget);const response=await fetch("/api/public/enquiries",{method:"POST",body:form});const result=await response.json();if(!response.ok){window.alert(result.error||"Your details could not be submitted.");return}setReference(result.reference)}finally{setSending(false)}}
 if(reference)return <main className="grid min-h-screen place-items-center bg-slate-50 p-5"><section className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-xl shadow-slate-200/60"><CheckCircle2 className="mx-auto size-14 text-emerald-600"/><h1 className="mt-5 text-3xl font-bold text-slate-950">Thank you</h1><p className="mt-3 text-slate-600">Your details and plans have been sent to Sai. We’ll review everything and contact you about your quotation.</p><p className="mt-5 rounded-xl bg-emerald-50 py-3 font-semibold text-emerald-800">Reference: {reference}</p></section></main>;
 return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12"><div className="mx-auto max-w-3xl">
 <header className="mb-7 flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-700 text-white"><WalletCards/></span><div><h1 className="text-2xl font-bold text-slate-950">Wardrobe quotation enquiry</h1><p className="text-slate-600">Tell us about your project and upload any plans you have.</p></div></header>
 <form onSubmit={submit} className="overflow-hidden rounded-3xl border bg-white shadow-xl shadow-slate-200/50">
 <section className="border-b p-5 sm:p-7"><h2 className="text-lg font-bold">Your details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
 <Field label="Full name *"><Input name="name" required autoComplete="name"/></Field><Field label="Company name"><Input name="companyName" autoComplete="organization"/></Field>
 <Field label="Email address *"><Input name="email" type="email" required autoComplete="email"/></Field><Field label="Phone number *"><Input name="phone" type="tel" required autoComplete="tel"/></Field>
 <Field label="Your address" wide><Input name="address" autoComplete="street-address"/></Field><Field label="Project / installation address" wide><Input name="siteAddress"/></Field>
 </div></section>
 <section className="border-b p-5 sm:p-7"><div className="flex items-center gap-2"><Ruler className="size-5 text-emerald-700"/><h2 className="text-lg font-bold">Project details</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-2">
 <Field label="What do you need?"><select name="projectType" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Wardrobes</option><option>Walk-in wardrobe</option><option>Sliding doors</option><option>Linen / storage</option><option>Multiple areas</option><option>Other</option></select></Field>
 <Field label="Preferred colour"><select name="preferredColour" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Not sure yet</option><option>White Linear</option><option>Maple Cream</option><option>Grey Ash</option></select></Field>
 <Field label="When do you need it?"><Input name="timeframe" placeholder="e.g. November 2026"/></Field>
 <Field label="Areas / rooms" wide><textarea name="areas" rows={3} className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Bedroom 1, Bedroom 2, walk-in wardrobe"/></Field>
 <Field label="Measurements, ideas or other information" wide><textarea name="notes" rows={4} className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Approximate sizes, storage needs, number of drawers, door preferences…"/></Field>
 </div></section>
 <section className="p-5 sm:p-7"><div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-5"><div className="flex gap-3"><FileUp className="mt-0.5 size-5 text-emerald-700"/><div className="min-w-0"><Label htmlFor="plans" className="text-base font-semibold">Attach plans or photos</Label><p className="mt-1 text-sm text-slate-600">PDFs, drawings, floor plans or photos. Up to 15 MB per file.</p><Input id="plans" name="plans" type="file" multiple accept=".pdf,.dwg,.dxf,image/*" className="mt-4 bg-white"/></div></div></div>
 <p className="mt-4 text-xs leading-5 text-slate-500">By submitting this form, you agree that Simply Wardrobes may contact you about this enquiry.</p>
 <Button className="mt-5 w-full" size="lg" disabled={sending}>{sending?"Sending your details…":"Send quotation enquiry"}</Button></section>
 </form></div></main>
}
function Field({label,wide=false,children}:{label:string;wide?:boolean;children:React.ReactNode}){return <div className={`grid gap-2 ${wide?"sm:col-span-2":""}`}><Label>{label}</Label>{children}</div>}

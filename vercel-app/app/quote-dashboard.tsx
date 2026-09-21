"use client";
import { useEffect, useMemo, useState } from "react";
import { Archive, Building2, BriefcaseBusiness, Columns3, Copy, Download, File, FileSpreadsheet, FileText, LayoutDashboard, Mail, MapPin, Menu, PackagePlus, Paperclip, Pencil, Phone, Plus, ReceiptText, Search, Settings, Trash2, Truck, UserRound, Users, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomersPanel, EnquiriesPanel, InvoicesPanel, TeamPanel } from "./customer-workspace";
import StaffAccountsPanel from "./staff-accounts-panel";
import JobBoard from "./job-board";
import { ActionCentre, ArchivePanel, DispatchPanel, OperationsPanel, ProductsPanel, ReminderCentre, SalesReports, SettingsPanel } from "./operations-workspace";
import { ACCESSORY_OPTIONS, BOARD_COLOURS, DOOR_CONFIGURATIONS, HARDWARE_COLOURS, IROBE_OPTIONS, MIRROR_OPTIONS } from "../lib/quote-options";
type QuoteItem={id?:number;category:string;systemType:string;colour:string;designSelection?:string;hardwareColour?:string;doorConfiguration?:string;mirrorOption?:string;price:number|string;quantity?:number|string;unitPrice?:number|string;description?:string;sortOrder?:number};
type Attachment={id:number;fileName:string;contentType:string;size:number;createdAt?:string};
type Customer={id:number;name:string;companyName:string;email:string;phone:string;address:string;siteAddress:string};
type TeamMember={id:number;name:string;active:boolean};
type Product={id:number;name:string;category:string;price:number;active:boolean};
type CompanySettings={companyName:string;subtitle:string;gstNumber:string;phone:string;email:string;address:string;bankDetails:string;terms:string;warranty:string;installationExclusions:string;emailSignature:string};
type RevisionSummary={id:number;quoteNumber:string;revision:number;amount:number;status:string;createdAt:string;changes:string[]};
type Quote={id:number;quoteNumber:string;customerId?:number;customerName:string;companyName?:string;email?:string;phone?:string;customerAddress?:string;siteAddress?:string;serviceType?:string;servicePrice?:number;salespersonName?:string;project:string;amount:number;status:string;invoiceStatus?:string;paymentNote?:string;invoiceNumber?:string;invoiceSentAt?:string;validUntil:string;createdAt?:string;emailedAt?:string;emailId?:string;revision?:number;followUpDate?:string;purchaseOrderNumber?:string;customerComment?:string;jobStage?:string;discountPercent?:number;items?:QuoteItem[];attachments?:Attachment[];activities?:{id:number;action:string;detail:string;actor:string;createdAt:string}[];revisions?:RevisionSummary[]};
const roundMoney=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
const money=(v:number)=>new Intl.NumberFormat("en-NZ",{style:"currency",currency:"NZD",minimumFractionDigits:2,maximumFractionDigits:2}).format(roundMoney(v));
const printText=(value:unknown)=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]??char));
const printDate=(value?:string)=>new Date(value??Date.now()).toLocaleDateString("en-NZ");
function printQuotation(quote:Quote,items:QuoteItem[],total:number,gst:number,settings?:CompanySettings|null){
 const popup=window.open("","_blank","width=900,height=1100");
 if(!popup){window.alert("Please allow pop-ups for RobeFlow, then try Download PDF again.");return}
 const customerDetails=[quote.companyName,quote.email,quote.phone,quote.customerAddress].filter(Boolean).map(value=>`<div>${printText(value)}</div>`).join("");
 const rows=items.map(item=>{const extra=item.systemType==="I-Robe"?`${item.designSelection||"Custom design"} · Hardware: ${item.hardwareColour||"Undecided"}`:item.systemType==="Accessories"?item.designSelection||"Accessory not selected":item.systemType==="Sliding Doors"?[item.doorConfiguration,item.mirrorOption&&item.mirrorOption!=="No mirror selected"?item.mirrorOption:""].filter(Boolean).join(" · "):"";const base=item.systemType==="Accessories"?item.systemType:`${item.systemType||"I-Robe"} · ${item.colour||"Undecided"}`;return `<tr><td><strong>${printText(item.category)}</strong><span>${printText(base)}${extra?` · ${printText(extra)}`:""}</span></td><td>${printText(money(Number(item.price)))}</td></tr>`}).join("")+(Number(quote.servicePrice)>0?`<tr><td><strong>${printText(quote.serviceType||"Service")}</strong><span>Service charge</span></td><td>${printText(money(Number(quote.servicePrice)))}</td></tr>`:"");
 popup.document.open();
 popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${printText(quote.quoteNumber)} | Quotation</title><style>
  *{box-sizing:border-box}html,body{margin:0;background:#fff;color:#172033;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{padding:14mm}.sheet{width:100%;max-width:186mm;margin:0 auto}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #047857;padding-bottom:18px}.brand{display:flex;align-items:center;gap:12px}.logo{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#047857;color:#fff;font-weight:800;font-size:15px}.brand h1{margin:0;color:#0f172a;font-size:24px}.muted{margin:4px 0 0;color:#64748b;font-size:13px}.quote-title{text-align:right}.quote-title h2{margin:0;color:#047857;font-size:28px;font-weight:300;letter-spacing:2px}.quote-title strong{display:block;margin-top:8px}.details{display:grid;grid-template-columns:1fr 1fr;gap:30px;padding:24px 0}.eyebrow{margin:0 0 10px;color:#94a3b8;font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}.customer-name{margin:0 0 7px;font-size:18px;font-weight:800}.customer-copy{color:#475569;font-size:13px;line-height:1.55;white-space:pre-line}.project{margin-top:9px;color:#334155;font-weight:700}.dates{display:grid;grid-template-columns:1fr 1fr;gap:20px;text-align:right}.label{color:#94a3b8;font-size:13px}.value{margin-top:4px;font-size:14px;font-weight:700}.site{margin-top:18px;text-align:right}.items{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;border:1px solid #dbe3ed;border-radius:14px}.items th{padding:13px 16px;background:#111827;color:#fff;font-size:13px;text-align:left}.items th:last-child,.items td:last-child{text-align:right}.items td{padding:15px 16px;border-top:1px solid #e5eaf1;font-size:15px}.items tr:first-child td{border-top:0}.items td span{display:block;margin-top:6px;color:#64748b;font-size:12px}.summary{width:310px;margin:24px 0 0 auto}.summary-row{display:flex;justify-content:space-between;padding:8px 0;color:#64748b;font-size:13px}.total{display:flex;justify-content:space-between;border-top:2px solid #047857;padding-top:12px;color:#172033;font-size:20px;font-weight:800}.note{margin-top:38px;border-top:1px solid #cbd5e1;padding-top:18px;color:#64748b;font-size:11px;line-height:1.6}.footer{display:flex;justify-content:space-between;margin-top:18px;color:#64748b;font-size:11px}@page{size:A4;margin:0}@media print{body{padding:14mm}.sheet{max-width:none}}
 </style></head><body><main class="sheet"><header class="header"><div class="brand"><div class="logo">RF</div><div><h1>${printText(!settings?.companyName||settings.companyName==="QuoteFlow Wardrobes"?"RobeFlow Wardrobes":settings.companyName)}</h1><p class="muted">${printText(settings?.subtitle||"Custom wardrobe solutions")}</p></div></div><div class="quote-title"><h2>QUOTATION</h2><strong>${printText(quote.quoteNumber)}</strong></div></header><section class="details"><div><p class="eyebrow">Prepared for</p><p class="customer-name">${printText(quote.customerName)}</p><div class="customer-copy">${customerDetails}</div><div class="project">${printText(quote.project)}</div></div><div><div class="dates"><div><div class="label">Issued</div><div class="value">${printDate(quote.createdAt)}</div></div><div><div class="label">Valid until</div><div class="value">${printDate(quote.validUntil)}</div></div></div>${quote.siteAddress?`<div class="site"><div class="label">Site address</div><div class="value">${printText(quote.siteAddress)}</div></div>`:""}</div></section><table class="items"><thead><tr><th>Area / system / colour</th><th>Price incl. GST</th></tr></thead><tbody>${rows}</tbody></table><section class="summary"><div class="summary-row"><span>Includes GST</span><span>${printText(money(gst))}</span></div><div class="total"><span>Total</span><span>${printText(money(total))}</span></div></section><section class="note">${printText(settings?.terms||"Prices are in New Zealand dollars and include GST. This quotation remains valid until the date shown above.")} ${settings?.warranty?`<br><strong>Warranty:</strong> ${printText(settings.warranty)}`:""}${settings?.installationExclusions?`<br><strong>Installation:</strong> ${printText(settings.installationExclusions)}`:""}</section><footer class="footer"><span>${printText(!settings?.companyName||settings.companyName==="QuoteFlow Wardrobes"?"RobeFlow Wardrobes":settings.companyName)} · ${printText(settings?.address||"Christchurch, New Zealand")}${settings?.gstNumber?` · GST ${printText(settings.gstNumber)}`:""}</span><span>${printText(quote.quoteNumber)}</span></footer></main><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`);
 popup.document.close();
 popup.focus();
}
export default function QuoteDashboard({currentName,currentEmail,isAdmin,userRole="Staff"}:{currentName:string;currentEmail:string;isAdmin:boolean;userRole?:string}){
 const christchurchHour=Number(new Intl.DateTimeFormat("en-NZ",{hour:"numeric",hourCycle:"h23",timeZone:"Pacific/Auckland"}).format(new Date())),greeting=christchurchHour<12?"Good morning":christchurchHour<18?"Good afternoon":"Good evening";
 const [quotes,setQuotes]=useState<Quote[]>([]),[customerCount,setCustomerCount]=useState(0),[companySettings,setCompanySettings]=useState<CompanySettings|null>(null),[team,setTeam]=useState<TeamMember[]>([]),[search,setSearch]=useState(""),[serviceFilter,setServiceFilter]=useState("All"),[salesFilter,setSalesFilter]=useState("All"),[selectedJobIds,setSelectedJobIds]=useState<number[]>([]),[open,setOpen]=useState(false),[nav,setNav]=useState(false),[section,setSection]=useState<"dashboard"|"board"|"todo"|"customers"|"invoices"|"dispatch"|"operations"|"products"|"team"|"accounts"|"archive"|"settings">("dashboard"),[saving,setSaving]=useState(false),[statusBusy,setStatusBusy]=useState<number|null>(null),[selected,setSelected]=useState<Quote|null>(null),[recordOpen,setRecordOpen]=useState(false);
 useEffect(()=>{fetch("/api/settings").then(r=>r.ok?r.json():null).then(d=>setCompanySettings(d?.settings??null)).catch(()=>{})},[]);
 useEffect(()=>{if(section==="dashboard"){fetch("/api/quotes").then(r=>r.ok?r.json():null).then(d=>setQuotes(d?.quotes??[])).catch(()=>{});fetch("/api/customers").then(r=>r.ok?r.json():null).then(d=>setCustomerCount(d?.customers?.length??0)).catch(()=>{});fetch("/api/team").then(r=>r.json()).then(d=>setTeam((d.team??[]).filter((m:TeamMember)=>m.active))).catch(()=>{})}},[section]);
 const filtered=useMemo(()=>quotes.filter(q=>(serviceFilter==="All"||(q.serviceType??"Pick Up")===serviceFilter)&&(salesFilter==="All"||(q.salespersonName??"Sai Muddasani")===salesFilter)&&`${q.quoteNumber} ${q.customerName} ${q.project} ${q.status} ${q.serviceType??"Pick Up"} ${q.salespersonName??"Sai Muddasani"}`.toLowerCase().includes(search.toLowerCase())),[quotes,search,serviceFilter,salesFilter]);
 const pipeline=quotes.filter(q=>["Draft","Sent","Accepted"].includes(q.status)).reduce((s,q)=>s+q.amount,0);
 async function createQuote(payload:NewQuotePayload){setSaving(true);try{const r=await fetch("/api/quotes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if(!r.ok)throw Error();const d=await r.json();setQuotes(c=>[d.quote,...c]);return d.quote as Quote}finally{setSaving(false)}}
 async function openQuote(quote:Quote){const r=await fetch(`/api/quotes/${quote.id}`);if(r.ok){const d=await r.json();setSelected(d.quote);setRecordOpen(true)}}
 function replaceQuote(updated:Quote){setQuotes(current=>current.map(q=>q.id===updated.id?updated:q));setSelected(updated)}
 function addDuplicated(copy:Quote){setQuotes(current=>[copy,...current]);setSelected(copy)}
 async function changeStatus(quote:Quote,status:string){if(status===quote.status)return;if(quote.id<0){setQuotes(current=>current.map(q=>q.id===quote.id?{...q,status}:q));return}setStatusBusy(quote.id);try{const details=await fetch(`/api/quotes/${quote.id}`);if(!details.ok)throw Error();const data=await details.json();const updated=await fetch(`/api/quotes/${quote.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data.quote,status})});if(!updated.ok)throw Error();const result=await updated.json();replaceQuote(result.quote)}catch{window.alert("The quote status could not be updated. Please try again.")}finally{setStatusBusy(null)}}
 async function deleteSelectedJobs(){const selectedQuotes=quotes.filter(q=>selectedJobIds.includes(q.id)&&q.id>0);if(!selectedQuotes.length)return;if(!window.confirm(`Archive ${selectedQuotes.length} selected job${selectedQuotes.length===1?"":"s"}? You can restore them later from Archive.`))return;const results=await Promise.all(selectedQuotes.map(q=>fetch(`/api/quotes/${q.id}`,{method:"DELETE"})));const deleted=selectedQuotes.filter((_,index)=>results[index].ok).map(q=>q.id);setQuotes(current=>current.filter(q=>!deleted.includes(q.id)));setSelectedJobIds([]);if(deleted.length!==selectedQuotes.length)window.alert("Some selected jobs could not be archived.")}
 return <div className="min-h-screen bg-background text-foreground">
  <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${nav?"translate-x-0":"-translate-x-full"}`}>
<div className="flex h-20 items-center justify-between border-b border-sidebar-border px-6">
<div className="flex items-center gap-3">
<span className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-slate-950">
<WalletCards className="size-5"/>
</span>
<div>
<strong className="block text-lg">RobeFlow</strong>
<span className="text-xs text-slate-400">Sales workspace</span>
</div>
</div>
<button className="lg:hidden" onClick={()=>setNav(false)} aria-label="Close navigation">
<X/>
</button>
</div>
<nav className="space-y-2 p-4">
<Nav active={section==="dashboard"} icon={<LayoutDashboard/>} label="Dashboard" onClick={()=>{setSection("dashboard");setNav(false)}}/>
<Nav active={section==="board"} icon={<Columns3/>} label="Job board" onClick={()=>{setSection("board");setNav(false)}}/>
<Nav active={section==="todo"} icon={<FileText/>} label="Quotes to do" onClick={()=>{setSection("todo");setNav(false)}}/>
{["Admin","Accounts","Staff"].includes(userRole)&&<Nav active={section==="invoices"} icon={<ReceiptText/>} label="Invoices" onClick={()=>{setSection("invoices");setNav(false)}}/>}
{["Admin","Accounts","Operations","Staff"].includes(userRole)&&<Nav active={section==="dispatch"} icon={<Truck/>} label="Dispatch" onClick={()=>{setSection("dispatch");setNav(false)}}/>}
{["Admin","Operations","Staff"].includes(userRole)&&<Nav active={section==="operations"} icon={<BriefcaseBusiness/>} label="Jobs & installation" onClick={()=>{setSection("operations");setNav(false)}}/>}
<Nav active={section==="customers"} icon={<Users/>} label="Customers" onClick={()=>{setSection("customers");setNav(false)}}/>
{isAdmin&&<Nav active={section==="products"} icon={<PackagePlus/>} label="Products & pricing" onClick={()=>{setSection("products");setNav(false)}}/>}
{isAdmin&&<Nav active={section==="team"} icon={<UserRound/>} label="Sales team" onClick={()=>{setSection("team");setNav(false)}}/>}
{isAdmin&&<Nav active={section==="accounts"} icon={<Users/>} label="Staff approvals" onClick={()=>{setSection("accounts");setNav(false)}}/>}
{isAdmin&&<Nav active={section==="archive"} icon={<Archive/>} label="Archive" onClick={()=>{setSection("archive");setNav(false)}}/>}
{isAdmin&&<Nav active={section==="settings"} icon={<Settings/>} label="Company settings" onClick={()=>{setSection("settings");setNav(false)}}/>}
</nav>
<div className="absolute inset-x-4 bottom-4 rounded-xl border border-sidebar-border bg-sidebar-accent p-4">
<p className="truncate text-sm font-semibold">{currentName}</p>
<p className="truncate text-xs text-slate-400">{currentEmail}</p>
<form action="/auth/signout" method="post"><button type="submit" className="mt-3 flex items-center gap-2 text-xs font-semibold text-white hover:text-emerald-300">Log out</button></form>
</div>
</aside>
  {nav&&<button className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={()=>setNav(false)} aria-label="Close navigation overlay"/>}
  <main className="lg:ml-64">
<header className="flex h-20 items-center justify-between border-b bg-white px-4 sm:px-8">
<div className="flex items-center gap-3">
<button onClick={()=>setNav(true)} className="lg:hidden" aria-label="Open navigation">
<Menu/>
</button>
<div>
<h1 className="text-xl font-bold sm:text-2xl">{section==="dashboard"?`${greeting}, ${currentName.split(" ")[0]}`:section==="board"?"Job board":section==="customers"?"Customer management":section==="invoices"?"Accounts & invoicing":section==="dispatch"?"Dispatch":section==="operations"?"Jobs & installation":section==="products"?"Products & pricing":section==="team"?"Sales team":section==="accounts"?"Staff approvals":section==="archive"?"Archive":section==="settings"?"Company settings":"Showroom enquiries"}</h1>
<p className="hidden text-sm text-muted-foreground sm:block">{section==="dashboard"?"Here’s what’s happening with your quotes.":section==="customers"?"Keep customer details ready for future quotations.":section==="invoices"?"Accepted jobs ready for the accounts team.":section==="team"?"Manage salespeople and job assignments.":section==="accounts"?"Review new Robeflow staff registrations.":"Review new requests and prepare their quotations."}</p>
</div>
</div>
{section==="dashboard"&&["Admin","Sales","Staff"].includes(userRole)&&<NewQuote {...{open,setOpen,createQuote,saving}} onEmailed={replaceQuote}/>}
</header>
  <div className="space-y-7 p-4 sm:p-8">{section==="board"?<JobBoard currentName={currentName}/>:section==="customers"?<CustomersPanel/>:section==="todo"?<EnquiriesPanel/>:section==="invoices"?<InvoicesPanel/>:section==="dispatch"?<DispatchPanel/>:section==="operations"?<OperationsPanel/>:section==="products"?<ProductsPanel/>:section==="team"?<TeamPanel/>:section==="accounts"?<StaffAccountsPanel/>:section==="archive"?<ArchivePanel/>:section==="settings"?<SettingsPanel/>:<>
<ActionCentre quotes={quotes as any}/>
<ReminderCentre/>
<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
<Metric label="Pipeline value" value={money(pipeline)} note="Active opportunities"/>
<Metric label="Total quotes" value={String(quotes.length)} note="Across all statuses"/>
<Metric label="Accepted" value={String(quotes.filter(q=>q.status==="Accepted").length)} note="Ready to schedule"/>
<Metric label="Customers" value={String(customerCount)} note="Active customer records"/>
</section>
<SalesReports quotes={quotes}/>
  <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
<div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
<div>
<h2 className="text-lg font-bold">Recent quotes</h2>
<p className="text-sm text-muted-foreground">Select jobs to archive, or click a quote to view, edit, duplicate or download it.</p>
</div>
<div className="flex items-center gap-2">{selectedJobIds.length>0&&<Button variant="destructive" size="sm" onClick={deleteSelectedJobs}><Archive className="size-4"/>Archive selected ({selectedJobIds.length})</Button>}<div className="relative">
<Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/>
<Input className="w-full pl-9 sm:w-72" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search quotes…"/>
</div></div>
</div>
<div className="flex flex-col gap-3 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2 overflow-x-auto">{["All","Installation","Pick Up","Freight","Delivery"].map(service=><button key={service} onClick={()=>setServiceFilter(service)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${serviceFilter===service?"bg-slate-900 text-white":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{service}</button>)}</div><select value={salesFilter} onChange={e=>setSalesFilter(e.target.value)} className="h-9 rounded-lg border bg-white px-3 text-sm font-semibold" aria-label="Filter by salesperson"><option>All</option><option>Sai Muddasani</option>{team.filter(m=>m.name!=="Sai Muddasani").map(member=><option key={member.id}>{member.name}</option>)}</select></div>
<Table>
<TableHeader>
<TableRow>
<TableHead className="w-12 pl-5"><input type="checkbox" aria-label="Select all jobs" checked={filtered.filter(q=>q.id>0).length>0&&filtered.filter(q=>q.id>0).every(q=>selectedJobIds.includes(q.id))} onChange={e=>setSelectedJobIds(e.target.checked?filtered.filter(q=>q.id>0).map(q=>q.id):[])}/></TableHead>
<TableHead className="pl-5">Quote</TableHead>
<TableHead>Customer</TableHead>
<TableHead>Project</TableHead>
<TableHead>Salesperson</TableHead>
<TableHead>Service</TableHead>
<TableHead>Valid until</TableHead>
<TableHead>Status</TableHead>
<TableHead className="pr-5 text-right">Total incl. GST</TableHead>
</TableRow>
</TableHeader>
<TableBody>{filtered.map(q=>
<TableRow key={q.id} className="cursor-pointer" onClick={()=>openQuote(q)} tabIndex={0} onKeyDown={e=>{if(e.key==="Enter")openQuote(q)}}>
<TableCell className="pl-5" onClick={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}><input type="checkbox" disabled={q.id<0} aria-label={`Select ${q.quoteNumber}`} checked={selectedJobIds.includes(q.id)} onChange={e=>setSelectedJobIds(current=>e.target.checked?[...current,q.id]:current.filter(id=>id!==q.id))}/></TableCell>
<TableCell className="pl-5 font-semibold text-primary">{q.quoteNumber}</TableCell>
<TableCell className="font-medium">{q.customerName}</TableCell>
<TableCell className="max-w-56 truncate text-muted-foreground">{q.project}</TableCell>
<TableCell className="font-medium">{q.salespersonName??"Sai Muddasani"}</TableCell>
<TableCell><span className="font-medium">{q.serviceType??"Pick Up"}</span>{Number(q.servicePrice)>0&&<span className="block text-xs text-muted-foreground">{money(Number(q.servicePrice))}</span>}</TableCell>
<TableCell>{new Date(q.validUntil).toLocaleDateString("en-NZ",{day:"numeric",month:"short",year:"numeric"})}</TableCell>
<TableCell onClick={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>
<div className="flex flex-wrap items-center gap-2"><select value={q.status} disabled={statusBusy===q.id} onChange={e=>changeStatus(q,e.target.value)} className={`h-9 rounded-lg border px-2 text-sm font-semibold ${statusStyle(q.status)}`} aria-label={`Change status for ${q.quoteNumber}`}>
<option>Draft</option><option>Sent</option><option>Accepted</option><option>Declined</option><option>Completed</option>
</select>{q.status==="Accepted"&&<span className={`rounded-full px-2.5 py-1 text-xs font-bold ${q.invoiceStatus==="Paid in Full"?"bg-emerald-100 text-emerald-800":q.invoiceStatus&&q.invoiceStatus!=="To invoice"?"bg-violet-100 text-violet-800":"bg-orange-100 text-orange-800"}`}>{q.invoiceStatus==="Manual message"?(q.paymentNote||"Manual message"):q.invoiceStatus&&q.invoiceStatus!=="To invoice"&&q.invoiceStatus!=="Invoice sent"?q.invoiceStatus:q.invoiceStatus==="Invoice sent"?"Waiting for payment":"Invoice pending"}</span>}</div>
</TableCell>
<TableCell className="pr-5 text-right font-semibold">{money(q.amount)}</TableCell>
</TableRow>)}</TableBody>
</Table>{!filtered.length&&<div className="p-12 text-center text-muted-foreground">No quotes match your search.</div>}</section></>}
</div>
</main>
  <QuoteRecord quote={selected} open={recordOpen} setOpen={setRecordOpen} onUpdated={replaceQuote} onDuplicated={addDuplicated} settings={companySettings}/>
 </div>}
function Nav({icon,label,active=false,onClick}:{icon:React.ReactNode;label:string;active?:boolean;onClick:()=>void}){return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium ${active?"bg-sidebar-primary text-slate-950":"text-slate-300 hover:bg-sidebar-accent hover:text-white"}`}>
<span className="[&>svg]:size-5">{icon}</span>{label}</button>}
function Metric({label,value,note}:{label:string;value:string;note:string}){return <article className="rounded-2xl border bg-white p-5 shadow-sm">
<p className="text-sm font-medium text-muted-foreground">{label}</p>
<p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
<p className="mt-2 text-xs text-muted-foreground">{note}</p>
</article>}
function statusStyle(status:string){return status==="Accepted"?"border-emerald-200 bg-emerald-100 text-emerald-800":status==="Sent"?"border-blue-200 bg-blue-100 text-blue-800":status==="Completed"?"border-violet-200 bg-violet-100 text-violet-800":status==="Declined"||status==="Expired"?"border-rose-200 bg-rose-100 text-rose-700":"border-amber-200 bg-amber-100 text-amber-800"}
type NewQuotePayload={customerId?:number;customerName:string;companyName:string;email:string;phone:string;customerAddress:string;siteAddress:string;serviceType:string;servicePrice:number;salespersonName:string;project:string;status:string;validUntil:string;followUpDate?:string;discountPercent:number;items:{category:string;systemType:string;colour:string;designSelection?:string;hardwareColour?:string;doorConfiguration?:string;mirrorOption?:string;price:number;quantity:number;unitPrice:number;description:string}[]};
function NewQuote({open,setOpen,createQuote,saving,onEmailed}:{open:boolean;setOpen:(v:boolean)=>void;createQuote:(p:NewQuotePayload)=>Promise<Quote|undefined>;saving:boolean;onEmailed:(quote:Quote)=>void}){
 const initialItems=()=>["Bedroom 1","Bedroom 2","Bedroom 3","Storage 1","Bedroom 1","Accessories"].map((category,index)=>({category,systemType:index===4?"Sliding Doors":category==="Accessories"?"Accessories":"I-Robe",colour:"Undecided",designSelection:category==="Accessories"?"":"Custom design",hardwareColour:"Undecided",doorConfiguration:"",mirrorOption:"No mirror selected",quantity:"1",unitPrice:"",description:"",price:""}));
 const [items,setItems]=useState<QuoteItem[]>(initialItems),[customerId,setCustomerId]=useState<number|undefined>(),[customerName,setCustomerName]=useState(""),[companyName,setCompanyName]=useState(""),[email,setEmail]=useState(""),[phone,setPhone]=useState(""),[customerAddress,setCustomerAddress]=useState(""),[siteAddress,setSiteAddress]=useState(""),[customers,setCustomers]=useState<Customer[]>([]),[team,setTeam]=useState<TeamMember[]>([]),[products,setProducts]=useState<Product[]>([]),[customerSearch,setCustomerSearch]=useState(""),[addingCustomer,setAddingCustomer]=useState(false),[customerOpen,setCustomerOpen]=useState(false),[project,setProject]=useState(""),[serviceType,setServiceType]=useState("Installation"),[servicePrice,setServicePrice]=useState(""),[discountPercent,setDiscountPercent]=useState("0"),[salespersonName,setSalespersonName]=useState("Sai Muddasani"),[validUntil,setValidUntil]=useState(""),[followUpDate,setFollowUpDate]=useState(""),[files,setFiles]=useState<File[]>([]),[pickListFile,setPickListFile]=useState<File|null>(null),[uploading,setUploading]=useState(false);
 useEffect(()=>{if(open){fetch("/api/team").then(r=>r.json()).then(d=>setTeam((d.team??[]).filter((m:TeamMember)=>m.active))).catch(()=>{});fetch("/api/products").then(r=>r.json()).then(d=>setProducts((d.products??[]).filter((p:Product)=>p.active))).catch(()=>{})}},[open]);
 useEffect(()=>{if(customerOpen)fetch("/api/customers").then(r=>r.json()).then(d=>setCustomers(d.customers??[])).catch(()=>{})},[customerOpen]);
 const subtotal=roundMoney(items.reduce((sum,item)=>sum+(Number(item.quantity)||1)*(Number(item.unitPrice)||0),0)+(Number(servicePrice)||0)),discount=Math.min(100,Math.max(0,Number(discountPercent)||0)),total=roundMoney(subtotal*(1-discount/100));
 function updateItem(index:number,key:"category"|"systemType"|"colour"|"designSelection"|"hardwareColour"|"doorConfiguration"|"mirrorOption"|"quantity"|"unitPrice"|"description",value:string){setItems(current=>current.map((item,i)=>{if(i!==index)return item;const next={...item,[key]:value};return {...next,price:roundMoney((Number(next.quantity)||1)*(Number(next.unitPrice)||0))}}))}
 function setCatalogPrice(index:number,value:number){updateItem(index,"unitPrice",String(value))}
 function duplicateItem(index:number){setItems(current=>[...current.slice(0,index+1),{...current[index],category:`${current[index].category} copy`},...current.slice(index+1)])}
 function reset(){setItems(initialItems());setCustomerId(undefined);setCustomerName("");setCompanyName("");setEmail("");setPhone("");setCustomerAddress("");setSiteAddress("");setCustomerSearch("");setAddingCustomer(false);setProject("");setServiceType("Installation");setServicePrice("");setDiscountPercent("0");setSalespersonName("Sai Muddasani");setValidUntil("");setFollowUpDate("");setFiles([]);setPickListFile(null)}
 function chooseCustomer(customer:Customer){setCustomerId(customer.id);setCustomerName(customer.name);setCompanyName(customer.companyName);setEmail(customer.email);setPhone(customer.phone);setCustomerAddress(customer.address);setSiteAddress(customer.siteAddress);setCustomerOpen(false)}
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const submitter=(e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;const sendAfterSave=submitter?.value==="email";if(!customerName){setCustomerOpen(true);return}if(sendAfterSave&&!email.trim()){window.alert("Add the customer's email address before saving and emailing the quote.");setCustomerOpen(true);return}const quote=await createQuote({customerId,customerName,companyName,email,phone,customerAddress,siteAddress,serviceType,servicePrice:Number(servicePrice)||0,salespersonName,project,status:"Draft",validUntil,discountPercent:discount,items:items.filter(i=>i.category.trim()).map(i=>({category:i.category,systemType:i.systemType,colour:i.colour,designSelection:i.designSelection,hardwareColour:i.hardwareColour,doorConfiguration:i.doorConfiguration,mirrorOption:i.mirrorOption,quantity:Number(i.quantity)||1,unitPrice:Number(i.unitPrice)||0,description:i.description||"",price:roundMoney((Number(i.quantity)||1)*(Number(i.unitPrice)||0))}))});if(!quote)return;setUploading(true);try{for(const file of files){const data=new FormData();data.append("file",file);const upload=await fetch(`/api/quotes/${quote.id}/attachments`,{method:"POST",body:data});if(!upload.ok)throw new Error(`Could not upload ${file.name}.`)}if(pickListFile){const data=new FormData();data.append("file",pickListFile);const upload=await fetch(`/api/pick-list/${quote.id}/documents`,{method:"POST",body:data});if(!upload.ok){const result=await upload.json();throw new Error(result.error||`Could not upload ${pickListFile.name}.`)}}if(sendAfterSave){const sent=await fetch(`/api/quotes/${quote.id}/email`,{method:"POST"});const result=await sent.json();if(!sent.ok){setOpen(false);reset();window.alert(`Quote ${quote.quoteNumber} was saved as Draft, but the email was not sent: ${result.error||"Please try again from the saved quote."}`);return}onEmailed(result.quote);window.alert(`Quote ${quote.quoteNumber} was emailed to ${email}. The internal pick list was not sent.`)}else window.alert(`Quote ${quote.quoteNumber} was saved as Draft.`);setOpen(false);reset()}catch(error){setOpen(false);reset();window.alert(`The quote was saved, but ${error instanceof Error?error.message:"the files or email could not be completed."}`)}finally{setUploading(false)}}
 return <>
<Dialog open={open} onOpenChange={value=>{setOpen(value);if(!value&&!customerOpen)reset()}}>
<DialogTrigger asChild>
<Button className="gap-2">
<Plus className="size-4"/>
<span className="hidden sm:inline">New quote</span>
<span className="sm:hidden">Quote</span>
</Button>
</DialogTrigger>
<DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
<form onSubmit={submit}>
<DialogHeader>
<DialogTitle>Create a new quote</DialogTitle>
<DialogDescription>Add the customer, prices, customer design files and the internal Excel pick list.</DialogDescription>
</DialogHeader>
<div className="grid gap-4 py-5">
<button type="button" onClick={()=>setCustomerOpen(true)} className="flex w-full items-center justify-between rounded-xl border bg-emerald-50/50 p-4 text-left transition hover:border-emerald-500">
<span className="flex items-center gap-3">
<span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
<UserRound className="size-5"/>
</span>
<span>
<strong className="block">{customerName||"Select or add customer"}</strong>
<span className="text-sm text-muted-foreground">{customerName?(companyName||email||phone||"Customer selected"):"Search existing customers first"}</span>
</span>
</span>
<Pencil className="size-4 text-muted-foreground"/>
</button>
<div className="grid gap-2">
<Label htmlFor="project">Project</Label>
<Input id="project" value={project} onChange={e=>setProject(e.target.value)} placeholder="e.g. New home wardrobes" required/>
</div>
<div className="grid gap-2">
<Label htmlFor="salesperson">Assigned salesperson</Label>
<select id="salesperson" value={salespersonName} onChange={e=>setSalespersonName(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Sai Muddasani</option>{team.filter(m=>m.name!=="Sai Muddasani").map(member=><option key={member.id}>{member.name}</option>)}</select>
</div>
<div className="overflow-hidden rounded-2xl border bg-slate-50/70">
<div className="flex items-center justify-between border-b bg-white px-4 py-3"><div><p className="font-bold text-slate-900">Areas & products</p><p className="text-xs text-muted-foreground">Name each room or storage area, then select its wardrobe system.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{items.length} {items.length===1?"area":"areas"}</span></div>
<div className="space-y-4 p-3 sm:p-4">{items.map((item,index)=>
<div key={index} className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-slate-100">
<div className="mb-4 flex items-center justify-between"><span className="grid size-8 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">{index+1}</span><div className="flex"><Button type="button" variant="ghost" size="sm" onClick={()=>duplicateItem(index)} aria-label={`Duplicate ${item.category}`}><Copy className="size-4"/>Duplicate</Button><Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-destructive" onClick={()=>{if(window.confirm(`Remove ${item.category} from this quote?`))setItems(current=>current.filter((_,i)=>i!==index))}} aria-label={`Remove ${item.category}`}>
<Trash2 className="size-4"/>
</Button></div></div>
<div className="grid gap-3 sm:grid-cols-2">
<div className="grid gap-1.5"><Label htmlFor={`area-name-${index}`}>Area name</Label><Input id={`area-name-${index}`} className="h-10" value={item.category} onChange={e=>updateItem(index,"category",e.target.value)} placeholder="e.g. Bedroom 1, Storage 2" aria-label={`Area ${index+1}`}/></div>
<div className="grid gap-1.5"><Label htmlFor={`system-${index}`}>Wardrobe system</Label><select id={`system-${index}`} value={item.systemType} onChange={e=>{const value=e.target.value;updateItem(index,"systemType",value);const product=products.find(p=>p.name===value);if(product)setCatalogPrice(index,product.price)}} className="h-10 rounded-md border border-input bg-background px-3 text-sm" aria-label={`${item.category} system`}><option>I-Robe</option><option>I-Robe Premium</option><option>Cabinet System</option><option>Free Standing Wardrobe</option><option>Linen</option><option>Sliding Doors</option><option>Accessories</option></select></div>
</div>
<ItemOptions item={item} onChange={(key,value)=>{updateItem(index,key,value);if(key==="designSelection"){const product=products.find(p=>p.name===value);if(product)setCatalogPrice(index,product.price)}}}/>
<div className="mt-3 grid gap-3 sm:grid-cols-[6rem_1fr_1fr]"><div className="grid gap-1.5"><Label htmlFor={`quantity-${index}`} className="text-xs">Quantity</Label><Input id={`quantity-${index}`} type="number" min="1" step="1" value={item.quantity} onChange={e=>updateItem(index,"quantity",e.target.value)}/></div><div className="grid gap-1.5"><Label htmlFor={`unit-price-${index}`} className="text-xs">Unit price incl. GST</Label><Input id={`unit-price-${index}`} type="number" min="0" step="0.01" value={item.unitPrice} onChange={e=>updateItem(index,"unitPrice",e.target.value)} placeholder="$0.00"/></div><div className="grid gap-1.5"><Label className="text-xs">Line total</Label><div className="flex h-10 items-center justify-end rounded-md bg-slate-900 px-3 text-sm font-bold text-white">{money(Number(item.price)||0)}</div></div></div>
<Input className="mt-2" value={item.description} onChange={e=>updateItem(index,"description",e.target.value)} placeholder="Optional measurements or internal description"/>
{item.systemType!=="Accessories"&&<ColourPicker value={item.colour} onChange={value=>updateItem(index,"colour",value)}/>}
</div>)}</div>
<div className="flex items-center justify-between border-t p-3">
<Button type="button" variant="outline" size="sm" onClick={()=>setItems(current=>[...current,{category:`Area ${current.length+1}`,systemType:"I-Robe",colour:"Undecided",designSelection:"Custom design",hardwareColour:"Undecided",doorConfiguration:"",mirrorOption:"No mirror selected",quantity:"1",unitPrice:"",description:"",price:""}])}>
<Plus className="size-4"/>Add area</Button>
<div className="text-right">
<p className="text-xs text-muted-foreground">Total incl. GST</p>
<p className="text-xl font-bold text-primary">{money(total)}</p>
</div>
</div>
</div>
<div className="rounded-xl border bg-slate-50 p-4">
<p className="mb-3 font-semibold">Customer service</p>
<div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="serviceType">Service option</Label><select id="serviceType" value={serviceType} onChange={e=>{const value=e.target.value;setServiceType(value);const product=products.find(p=>p.name===value);if(product)setServicePrice(String(product.price))}} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Installation</option><option>Pick Up</option><option>Freight</option><option>Delivery</option></select></div><div className="grid gap-2"><Label htmlFor="servicePrice">Service price incl. GST</Label><Input id="servicePrice" type="number" min="0" step="0.01" value={servicePrice} onChange={e=>setServicePrice(e.target.value)} placeholder="$0.00"/></div></div>
</div>
<div className="grid gap-4 rounded-xl border bg-amber-50/50 p-4 sm:grid-cols-2 sm:items-end"><div className="grid gap-2"><Label htmlFor="discountPercent">Discount percentage</Label><Input id="discountPercent" type="number" min="0" max="100" step="0.01" value={discountPercent} onChange={e=>setDiscountPercent(e.target.value)} placeholder="0"/></div><div className="text-right"><p className="text-sm text-slate-500">Subtotal {money(subtotal)}</p><p className="font-semibold text-amber-800">Discount {discount}% · −{money(subtotal-total)}</p><p className="mt-1 text-xl font-bold">Total {money(total)}</p></div></div>
<AttachmentPicker files={files} setFiles={setFiles}/>
<div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
<div className="flex items-center gap-2"><FileSpreadsheet className="size-4 text-emerald-700"/><Label htmlFor="pick-list-file">Internal Excel pick list</Label></div>
<p className="mt-1 text-xs leading-5 text-muted-foreground">Fill this workbook manually in Excel. It stays internal for Sales and Dispatch and is never sent to the customer.</p>
<Input id="pick-list-file" className="mt-3 bg-white" type="file" accept=".xlsm,.xlsx,.xls" onChange={e=>setPickListFile(e.target.files?.[0]??null)}/>
{pickListFile&&<p className="mt-2 truncate text-sm font-medium text-emerald-800">Selected: {pickListFile.name}</p>}
</div>
<div className="grid gap-2">
<Label htmlFor="validUntil">Valid until</Label>
<Input id="validUntil" type="date" value={validUntil} onChange={e=>setValidUntil(e.target.value)} required/>
</div>
</div>
<DialogFooter>
<Button type="button" variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
<Button type="submit" name="intent" value="save" variant="outline" disabled={saving||uploading||!items.length}>{saving||uploading?"Saving…":`Save quote · ${money(total)}`}</Button>
<Button type="submit" name="intent" value="email" disabled={saving||uploading||!items.length}>{saving||uploading?"Preparing…":"Save & email quote"}</Button>
</DialogFooter>
</form>
</DialogContent>
</Dialog>
<Dialog open={customerOpen} onOpenChange={setCustomerOpen}>
<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
<DialogHeader>
<DialogTitle>{addingCustomer?"Add a new customer":"Select customer"}</DialogTitle>
<DialogDescription>{addingCustomer?"This customer will be saved for future quotes.":"Search the customer database or add someone new."}</DialogDescription>
</DialogHeader>{!addingCustomer?<div className="py-3">
<div className="relative">
<Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/>
<Input value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} className="pl-9" placeholder="Search name, company, email or phone…"/>
</div>
<div className="mt-3 max-h-72 space-y-2 overflow-y-auto">{customers.filter(c=>`${c.name} ${c.companyName} ${c.email} ${c.phone}`.toLowerCase().includes(customerSearch.toLowerCase())).map(customer=>
<button key={customer.id} type="button" onClick={()=>chooseCustomer(customer)} className="flex w-full items-start gap-3 rounded-xl border p-3 text-left hover:border-emerald-500 hover:bg-emerald-50">
<span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
<UserRound className="size-4"/>
</span>
<span className="min-w-0">
<strong className="block truncate">{customer.name}</strong>
<span className="block truncate text-sm text-muted-foreground">{customer.companyName||customer.email||customer.phone||"Saved customer"}</span>
</span>
</button>)}{customers.length===0&&<p className="py-8 text-center text-sm text-muted-foreground">No customers saved yet.</p>}</div>
<Button type="button" variant="outline" className="mt-4 w-full" onClick={()=>{setAddingCustomer(true);setCustomerId(undefined)}}>
<Plus className="size-4"/>Add new customer</Button>
</div>:<div className="grid gap-4 py-3">
<CustomerField icon={<UserRound/>} label="Customer name" value={customerName} setValue={setCustomerName} placeholder="Full name" required/>
<CustomerField icon={<Building2/>} label="Company name" value={companyName} setValue={setCompanyName} placeholder="Optional company or builder"/>
<CustomerField icon={<Mail/>} label="Email address" value={email} setValue={setEmail} placeholder="customer@email.com"/>
<CustomerField icon={<Phone/>} label="Phone number" value={phone} setValue={setPhone} placeholder="e.g. 021 123 4567"/>
<CustomerField icon={<MapPin/>} label="Customer address" value={customerAddress} setValue={setCustomerAddress} placeholder="Postal or billing address"/>
<CustomerField icon={<MapPin/>} label="Site address" value={siteAddress} setValue={setSiteAddress} placeholder="Installation address"/>
</div>}<DialogFooter>{addingCustomer&&<Button type="button" variant="outline" onClick={()=>setAddingCustomer(false)}>Back</Button>}{addingCustomer&&<Button type="button" onClick={()=>{setCustomerOpen(false);setAddingCustomer(false)}} disabled={!customerName.trim()}>Use this customer</Button>}</DialogFooter>
</DialogContent>
</Dialog>
</>}
function CustomerField({icon,label,value,setValue,placeholder,required=false}:{icon:React.ReactNode;label:string;value:string;setValue:(v:string)=>void;placeholder:string;required?:boolean}){const id=label.toLowerCase().replaceAll(" ","-");return <div className="grid gap-2">
<Label htmlFor={id} className="flex items-center gap-2">
<span className="[&>svg]:size-4 text-primary">{icon}</span>{label}</Label>
<Input id={id} value={value} onChange={e=>setValue(e.target.value)} placeholder={placeholder} required={required}/>
</div>}
function Field({label,name,type="text",placeholder}:{label:string;name:string;type?:string;placeholder?:string}){return <div className="grid gap-2">
<Label htmlFor={name}>{label}</Label>
<Input id={name} name={name} type={type} placeholder={placeholder} required/>
</div>}

const COLOURS=BOARD_COLOURS.map(name=>({name,swatch:name==="White Linear"?"#f4f3ed":name==="Maple Cream"?"#d8bd8c":name==="Grey Ash"?"#9ba1a2":"#ffffff"}));
function ColourPicker({value,onChange}:{value:string;onChange:(value:string)=>void}){return <div className="mt-3"><p className="mb-2 text-xs font-medium text-muted-foreground">Colour</p><div className="flex flex-wrap gap-2">{COLOURS.map(colour=><button key={colour.name} type="button" onClick={()=>onChange(colour.name)} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${value===colour.name?"border-primary ring-2 ring-primary/20":"hover:border-slate-400"}`} style={{backgroundColor:colour.swatch,color:colour.name==="Grey Ash"?"#172033":"#3f3729"}}><span className="size-3 rounded-full border border-black/15 bg-white/40"/>{colour.name}</button>)}</div></div>}

function ItemOptions({item,onChange}:{item:QuoteItem;onChange:(key:"designSelection"|"hardwareColour"|"doorConfiguration"|"mirrorOption",value:string)=>void}){const iRobe=item.systemType==="I-Robe",sliding=item.systemType==="Sliding Doors",accessory=item.systemType==="Accessories";if(!iRobe&&!sliding&&!accessory)return null;return <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">{iRobe&&<><div className="grid gap-1.5"><Label className="text-xs">I-Robe design</Label><select value={item.designSelection||"Custom design"} onChange={e=>onChange("designSelection",e.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm">{IROBE_OPTIONS.map(([name])=><option key={name}>{name}</option>)}</select></div><div className="grid gap-1.5"><Label className="text-xs">Handles & hanging bars</Label><select value={item.hardwareColour||"Undecided"} onChange={e=>onChange("hardwareColour",e.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm">{HARDWARE_COLOURS.map(value=><option key={value}>{value}</option>)}</select></div></>}{accessory&&<div className="grid gap-1.5 sm:col-span-2"><Label className="text-xs">Accessory</Label><select required value={item.designSelection||""} onChange={e=>onChange("designSelection",e.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm"><option value="">Select an accessory</option>{ACCESSORY_OPTIONS.map(value=><option key={value}>{value}</option>)}</select></div>}{sliding&&<><div className="grid gap-1.5"><Label className="text-xs">Door configuration</Label><select value={item.doorConfiguration||""} onChange={e=>onChange("doorConfiguration",e.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm"><option value="">Select configuration</option>{DOOR_CONFIGURATIONS.map(value=><option key={value}>{value}</option>)}</select></div><div className="grid gap-1.5"><Label className="text-xs">Mirror option (optional)</Label><select value={item.mirrorOption||"No mirror selected"} onChange={e=>onChange("mirrorOption",e.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm">{MIRROR_OPTIONS.map(value=><option key={value}>{value}</option>)}</select></div></>}</div>}

function AttachmentPicker({files,setFiles}:{files:File[];setFiles:(files:File[])=>void}){return <div className="rounded-xl border border-dashed bg-muted/20 p-4">
<div className="flex items-center gap-2">
<Paperclip className="size-4 text-primary"/>
<Label htmlFor="design-files">Design attachments</Label>
</div>
<p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, DWG or DXF · maximum 15 MB per file</p>
<Input id="design-files" className="mt-3 bg-white" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf" onChange={e=>setFiles(Array.from(e.target.files??[]))}/>{files.length>0&&<div className="mt-3 space-y-2">{files.map((file,index)=>
<div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
<span className="flex min-w-0 items-center gap-2">
<File className="size-4 shrink-0"/>
<span className="truncate">{file.name}</span>
</span>
<button type="button" onClick={()=>setFiles(files.filter((_,i)=>i!==index))} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${file.name}`}>
<X className="size-4"/>
</button>
</div>)}</div>}</div>}

function QuoteRecord({quote,open,setOpen,onUpdated,onDuplicated,settings}:{quote:Quote|null;open:boolean;setOpen:(v:boolean)=>void;onUpdated:(q:Quote)=>void;onDuplicated:(q:Quote)=>void;settings:CompanySettings|null}){
 const [editing,setEditing]=useState(false),[working,setWorking]=useState<Quote|null>(null),[team,setTeam]=useState<TeamMember[]>([]),[busy,setBusy]=useState(false);
 useEffect(()=>{setWorking(quote);setEditing(false)},[quote]);
 useEffect(()=>{if(open)fetch("/api/team").then(r=>r.json()).then(d=>setTeam((d.team??[]).filter((m:TeamMember)=>m.active))).catch(()=>{})},[open]);
 if(!working)return null;
 const active=working;
 const items=working.items??[];
 const subtotal=items.reduce((sum,item)=>sum+Number(item.price),0)+Number(working.servicePrice??0),discount=Math.min(100,Math.max(0,Number(working.discountPercent)||0));
 const total=roundMoney(subtotal*(1-discount/100))||working.amount;
 const gst=total*3/23;
 function updateField(key:keyof Quote,value:string){setWorking(current=>current?{...current,[key]:value}:current)}
 function updateItem(index:number,key:"category"|"systemType"|"colour"|"designSelection"|"hardwareColour"|"doorConfiguration"|"mirrorOption"|"quantity"|"unitPrice"|"description",value:string){setWorking(current=>current?{...current,items:(current.items??[]).map((item,i)=>{if(i!==index)return item;const next={...item,[key]:key==="quantity"||key==="unitPrice"?Number(value):value};return {...next,price:roundMoney((Number(next.quantity)||1)*(Number(next.unitPrice)||Number(item.price)||0))}})}:current)}
 async function save(){if(active.id<0){setEditing(false);return}setBusy(true);try{const r=await fetch(`/api/quotes/${active.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(active)});if(!r.ok)throw Error();const refreshed=await fetch(`/api/quotes/${active.id}`),d=await refreshed.json();setWorking(d.quote);onUpdated(d.quote);setEditing(false)}finally{setBusy(false)}}
 async function duplicate(){if(active.id<0){return}setBusy(true);try{const r=await fetch(`/api/quotes/${active.id}`,{method:"POST"});if(!r.ok)throw Error();const created=await r.json(),details=await fetch(`/api/quotes/${created.quote.id}`),d=await details.json();setWorking(d.quote);onDuplicated(d.quote);setEditing(true)}finally{setBusy(false)}}
 async function uploadAttachments(files:FileList|null){if(!files?.length||active.id<0)return;setBusy(true);try{const added:Attachment[]=[];for(const file of Array.from(files)){const data=new FormData();data.append("file",file);const r=await fetch(`/api/quotes/${active.id}/attachments`,{method:"POST",body:data});if(r.ok){const d=await r.json();added.push(d.attachment)}}setWorking(current=>current?{...current,attachments:[...(current.attachments??[]),...added]}:current)}finally{setBusy(false)}}
 async function removeAttachment(id:number){if(!confirm("Remove this design attachment?"))return;const r=await fetch(`/api/attachments/${id}`,{method:"DELETE"});if(r.ok)setWorking(current=>current?{...current,attachments:(current.attachments??[]).filter(a=>a.id!==id)}:current)}
 async function emailQuote(){if(active.id<0)return;setBusy(true);try{const r=await fetch(`/api/quotes/${active.id}/email`,{method:"POST"});const d=await r.json();if(!r.ok){window.alert(d.error||"The email could not be sent.");return}setWorking(d.quote);onUpdated(d.quote);window.alert(`Quote ${active.quoteNumber} was emailed to ${active.email}.`)}finally{setBusy(false)}}
 return <Dialog open={open} onOpenChange={setOpen}>
<DialogContent className="quote-dialog-print max-h-[94vh] overflow-y-auto sm:max-w-3xl">
<div className="quote-print-sheet rounded-sm bg-white text-slate-800">
<div className="flex items-start justify-between border-b-4 border-emerald-700 pb-6">
<div>
<div className="flex items-center gap-3">
<span className="grid size-11 place-items-center rounded-xl bg-emerald-700 text-white">
<WalletCards/>
</span>
<div>
<h2 className="text-2xl font-bold text-slate-950">RobeFlow Wardrobes</h2>
<p className="text-sm text-slate-500">Custom wardrobe solutions</p>
</div>
</div>
</div>
<div className="text-right">
<p className="text-3xl font-light tracking-wide text-emerald-700">QUOTATION</p>
<p className="mt-1 font-semibold">{working.quoteNumber}</p>
{working.emailedAt&&<p className="mt-1 text-xs text-slate-500">Emailed {new Date(working.emailedAt).toLocaleString("en-NZ")}</p>}
</div>
</div>
 <div className="grid gap-6 py-6 sm:grid-cols-2">
<div>
<p className="text-xs font-bold uppercase tracking-widest text-slate-400">Prepared for</p>{editing?<div className="mt-3 grid gap-3 sm:grid-cols-2">
<div className="grid gap-1.5"><Label>Customer name</Label><Input value={working.customerName} onChange={e=>updateField("customerName",e.target.value)} /></div>
<div className="grid gap-1.5"><Label>Company name</Label><Input value={working.companyName??""} onChange={e=>updateField("companyName",e.target.value)} placeholder="Optional" /></div>
<div className="grid gap-1.5"><Label>Email address</Label><Input type="email" value={working.email??""} onChange={e=>updateField("email",e.target.value)} placeholder="customer@example.com" /></div>
<div className="grid gap-1.5"><Label>Phone number</Label><Input type="tel" value={working.phone??""} onChange={e=>updateField("phone",e.target.value)} placeholder="Phone number" /></div>
<div className="grid gap-1.5 sm:col-span-2"><Label>Customer address</Label><Input value={working.customerAddress??""} onChange={e=>updateField("customerAddress",e.target.value)} placeholder="Customer postal address" /></div>
</div>:<><p className="mt-2 text-lg font-bold">{working.customerName}</p>{working.companyName&&<p className="text-sm font-medium">{working.companyName}</p>}{working.email&&<p className="mt-1 text-sm text-slate-500">{working.email}</p>}{working.phone&&<p className="text-sm text-slate-500">{working.phone}</p>}{working.customerAddress&&<p className="mt-1 whitespace-pre-line text-sm text-slate-500">{working.customerAddress}</p>}<p className="mt-2 text-sm font-medium text-slate-700">{working.project}</p></>}
</div>
<div>
<div className="grid grid-cols-2 gap-4 text-sm sm:text-right">
<div>
<p className="text-slate-400">Issued</p>
<p className="font-semibold">{new Date(working.createdAt??Date.now()).toLocaleDateString("en-NZ")}</p>
</div>
<div>
<p className="text-slate-400">Valid until</p>{editing?<Input type="date" value={working.validUntil} onChange={e=>updateField("validUntil",e.target.value)}/>:<p className="font-semibold">{new Date(working.validUntil).toLocaleDateString("en-NZ")}</p>}</div>
</div>{editing?<div className="mt-5 grid gap-1.5 text-sm">
<Label>Site address</Label>
<Input value={working.siteAddress??""} onChange={e=>updateField("siteAddress",e.target.value)} placeholder="Installation address" />
</div>:working.siteAddress&&<div className="mt-5 text-sm sm:text-right">
<p className="text-slate-400">Site address</p>
<p className="whitespace-pre-line font-medium">{working.siteAddress}</p>
</div>}</div>
</div>
 <div className="mb-5 rounded-xl border bg-slate-50 p-4">{editing?<div className="grid gap-2"><Label>Assigned salesperson</Label><select value={working.salespersonName??"Sai Muddasani"} onChange={e=>updateField("salespersonName",e.target.value)} className="h-10 rounded-md border border-input bg-white px-3 text-sm"><option>Sai Muddasani</option>{team.filter(m=>m.name!=="Sai Muddasani").map(member=><option key={member.id}>{member.name}</option>)}</select></div>:<div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Prepared by</p><p className="mt-1 font-semibold">{working.salespersonName??"Sai Muddasani"}</p></div>}</div>
 {editing&&<div className="mb-5 grid gap-2">
<Label>Project</Label>
<Input value={working.project} onChange={e=>updateField("project",e.target.value)}/>
</div>}
 <div className="overflow-hidden rounded-xl border border-slate-200">
<div className="grid grid-cols-[1fr_9rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
<span>Area / system / colour</span>
<span className="text-right">Price incl. GST</span>
</div>{items.map((item,index)=>
<div key={index} className="grid grid-cols-[1fr_9rem] items-start border-t border-slate-100 px-4 py-3 first:border-0">
<div>{editing?<div className="space-y-2">
<Input value={item.category} onChange={e=>updateItem(index,"category",e.target.value)}/>
<select aria-label={`System for ${item.category}`} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={item.systemType} onChange={e=>updateItem(index,"systemType",e.target.value)}>
<option>I-Robe</option>
<option>I-Robe Premium</option>
<option>Cabinet System</option>
<option>Free Standing Wardrobe</option>
<option>Linen</option>
<option>Sliding Doors</option>
<option>Accessories</option>
</select>
{item.systemType!=="Accessories"&&<ColourPicker value={item.colour} onChange={value=>updateItem(index,"colour",value)}/>}
<ItemOptions item={item} onChange={(key,value)=>updateItem(index,key,value)}/>
<div className="grid gap-2 sm:grid-cols-[6rem_9rem_1fr]"><div><Label className="text-xs">Quantity</Label><Input className="mt-1" type="number" min="1" value={item.quantity||1} onChange={e=>updateItem(index,"quantity",e.target.value)}/></div><div><Label className="text-xs">Unit price</Label><Input className="mt-1" type="number" min="0" step="0.01" value={item.unitPrice||item.price} onChange={e=>updateItem(index,"unitPrice",e.target.value)}/></div><div><Label className="text-xs">Description</Label><Input className="mt-1" value={item.description||""} onChange={e=>updateItem(index,"description",e.target.value)} placeholder="Measurements or notes"/></div></div>
</div>:<div>
<p className="font-medium">{item.category}</p>
<p className="mt-1 text-xs text-slate-500">{item.systemType} · {item.colour}</p>
{item.systemType==="I-Robe"&&<p className="mt-1 text-xs text-slate-500">{item.designSelection||"Custom design"} · Hardware: {item.hardwareColour||"Undecided"}</p>}
{item.systemType==="Accessories"&&<p className="mt-1 text-xs text-slate-500">{item.designSelection||"Accessory not selected"}</p>}
{item.systemType==="Sliding Doors"&&<p className="mt-1 text-xs text-slate-500">{item.doorConfiguration||"Configuration undecided"}{item.mirrorOption&&item.mirrorOption!=="No mirror selected"?` · ${item.mirrorOption}`:""}</p>}
</div>}</div><span className="text-right font-medium">{money(Number(item.price))}</span></div>)}</div>
 <div className="mt-3 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 sm:grid-cols-[1fr_10rem] sm:items-end">{editing?<><div className="grid gap-2"><Label>Service option</Label><select value={working.serviceType??"Pick Up"} onChange={e=>updateField("serviceType",e.target.value)} className="h-10 rounded-md border border-input bg-white px-3 text-sm"><option>Installation</option><option>Pick Up</option><option>Freight</option><option>Delivery</option></select></div><div className="grid gap-2"><Label>Service price</Label><Input type="number" min="0" step="0.01" value={working.servicePrice??0} onChange={e=>updateField("servicePrice",e.target.value)}/></div></>:<><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Service</p><p className="mt-1 font-semibold">{working.serviceType??"Pick Up"}</p></div><p className="text-right font-semibold">{money(Number(working.servicePrice??0))}</p></>}</div>
 <div className="mt-3 grid gap-3 rounded-xl border bg-amber-50/50 p-4 sm:grid-cols-2 sm:items-end"><div>{editing?<><Label>Discount percentage</Label><Input className="mt-2" type="number" min="0" max="100" step="0.01" value={working.discountPercent??0} onChange={e=>updateField("discountPercent",e.target.value)}/></>:<><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Discount</p><p className="mt-1 font-semibold">{discount}%</p></>}</div><div className="text-right text-sm"><p>Subtotal {money(subtotal)}</p><p className="font-semibold text-amber-800">−{money(subtotal-total)}</p></div></div>
 <div className="mt-3 grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Revision</p><p className="mt-1 font-semibold">Revision {working.revision??1}</p></div><div>{editing?<><Label>Follow-up date</Label><Input className="mt-2" type="date" value={working.followUpDate??""} onChange={e=>updateField("followUpDate",e.target.value)}/></>:<><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Next follow-up</p><p className="mt-1 font-semibold">{working.followUpDate?new Date(working.followUpDate).toLocaleDateString("en-NZ"):"Not scheduled"}</p></>}</div>{working.purchaseOrderNumber&&<div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Purchase order</p><p className="mt-1 font-semibold">{working.purchaseOrderNumber}</p></div>}{working.customerComment&&<div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer comment</p><p className="mt-1 text-sm">{working.customerComment}</p></div>}</div>
 {editing&&<Button type="button" variant="outline" size="sm" className="mt-3" onClick={()=>setWorking(current=>current?{...current,items:[...(current.items??[]),{category:"New area",systemType:"I-Robe",colour:"Undecided",designSelection:"Custom design",hardwareColour:"Undecided",doorConfiguration:"",mirrorOption:"No mirror selected",quantity:1,unitPrice:0,description:"",price:0}]}:current)}>
<Plus className="size-4"/>Add area</Button>}
 <div className="ml-auto mt-6 w-full max-w-xs space-y-2">
<div className="flex justify-between text-sm text-slate-500">
<span>Includes GST</span>
<span>{money(gst)}</span>
</div>
<div className="flex justify-between border-t-2 border-emerald-700 pt-3 text-xl font-bold">
<span>Total</span>
<span>{money(total)}</span>
</div>
</div>
 {working.id>0&&<div className="no-print mt-7 flex flex-col justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:flex-row sm:items-center"><div><h3 className="flex items-center gap-2 font-semibold"><File className="size-4 text-emerald-700"/>Excel pick list</h3><p className="mt-1 text-xs text-slate-600">Create the customer-filled workbook, complete custom designs in Excel, and upload the finished file to this quote.</p></div><a href={`/pick-list/${working.id}`} target="_blank" className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white">Open Excel pick list</a></div>}
 <div className="no-print mt-5 rounded-xl border bg-slate-50 p-4">
<div className="flex flex-wrap items-center justify-between gap-3">
<div>
<h3 className="flex items-center gap-2 font-semibold">
<Paperclip className="size-4 text-emerald-700"/>Design attachments</h3>
<p className="mt-1 text-xs text-slate-500">Plans, drawings and design files saved with this quote.</p>
</div>{working.id>0&&<Label className="cursor-pointer rounded-md bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
<Plus className="mr-1 inline size-4"/>Attach files<Input className="hidden" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf" onChange={e=>uploadAttachments(e.target.files)}/>
</Label>}</div>{working.attachments?.length?<div className="mt-3 grid gap-2 sm:grid-cols-2">{working.attachments.map(file=>
<div key={file.id} className="flex items-center gap-2 rounded-lg border bg-white p-3">
<File className="size-5 shrink-0 text-emerald-700"/>
<a className="min-w-0 flex-1 truncate text-sm font-medium hover:text-emerald-700 hover:underline" href={`/api/attachments/${file.id}`}>{file.fileName}</a>
<span className="text-xs text-slate-400">{(file.size/1024/1024).toFixed(1)} MB</span>
<button onClick={()=>removeAttachment(file.id)} className="text-slate-400 hover:text-red-600" aria-label={`Remove ${file.fileName}`}>
<Trash2 className="size-4"/>
</button>
</div>)}</div>:<p className="mt-3 text-sm text-slate-500">No design files attached.</p>}</div>
 <div className="no-print mt-5 overflow-hidden rounded-xl border bg-white"><div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3"><div><h3 className="font-semibold">Quote revision history</h3><p className="text-xs text-slate-500">A permanent comparison of every quotation version.</p></div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">{working.revisions?.length??1} version{(working.revisions?.length??1)===1?"":"s"}</span></div><div className="divide-y">{(working.revisions??[{id:working.id,quoteNumber:working.quoteNumber,revision:working.revision??1,amount:working.amount,status:working.status,createdAt:working.createdAt??new Date().toISOString(),changes:["Original quote created"]}]).slice().reverse().map(version=><details key={version.id} className="group px-4 py-3" open={version.id===working.id}><summary className="flex cursor-pointer list-none items-center justify-between gap-3"><div><p className="font-semibold">Revision {version.revision} · {version.quoteNumber}</p><p className="text-xs text-slate-500">{new Date(version.createdAt).toLocaleString("en-NZ")} · {version.status}</p></div><strong>{money(version.amount)}</strong></summary><ul className="mt-3 space-y-1.5 border-l-2 border-emerald-600 pl-3">{version.changes.map((change,index)=><li key={index} className="text-sm text-slate-600">{change}</li>)}</ul></details>)}</div></div>
 {working.activities?.length?<div className="no-print mt-5 rounded-xl border bg-white p-4"><h3 className="font-semibold">Activity history</h3><div className="mt-3 space-y-3">{working.activities.slice().reverse().map(activity=><div key={activity.id} className="border-l-2 border-emerald-600 pl-3"><p className="text-sm font-semibold">{activity.action}</p><p className="text-xs text-slate-500">{activity.detail} · {activity.actor} · {new Date(activity.createdAt).toLocaleString("en-NZ")}</p></div>)}</div></div>:null}
 <div className="mt-10 border-t pt-5 text-xs leading-5 text-slate-500">
<p>Thank you for the opportunity to provide this quotation. Prices are in New Zealand dollars and include GST. This quotation remains valid until the date shown above.</p>
<div className="mt-5 flex justify-between">
<span>RobeFlow Wardrobes · Christchurch, New Zealand</span>
<span>{working.quoteNumber}</span>
</div>
</div>
</div>
 <DialogFooter className="no-print mt-5 border-t pt-5">
<div className="flex w-full flex-wrap justify-between gap-2">
<div className="flex gap-2">
<Button variant="outline" onClick={duplicate} disabled={busy||working.id<0}>
<Copy className="size-4"/>Create revision</Button>
<Button variant="outline" onClick={()=>printQuotation(working,items,total,gst,settings)}>
<Download className="size-4"/>Download PDF</Button>
<Button variant="outline" onClick={emailQuote} disabled={busy||working.id<0||!working.email}>
<Mail className="size-4"/>{working.emailedAt?"Resend email":"Email quote"}</Button>
</div>{editing?<div className="flex gap-2">
<Button variant="outline" onClick={()=>{setWorking(quote);setEditing(false)}}>Cancel</Button>
<Button onClick={save} disabled={busy}>{busy?"Saving…":"Save changes"}</Button>
</div>:<Button onClick={()=>setEditing(true)}>
<Pencil className="size-4"/>Edit quote</Button>}</div>
</DialogFooter>
</DialogContent>
</Dialog>}

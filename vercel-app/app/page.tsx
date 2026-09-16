import Link from "next/link";
import { BarChart3, Boxes, FileText, LockKeyhole, Mail, Truck } from "lucide-react";

const features = [
  [FileText, "Quotes & revisions", "Create detailed quotations, maintain revisions and generate professional PDFs."],
  [Mail, "Invoices & payments", "Send invoices, record deposits and keep outstanding balances visible."],
  [Truck, "Jobs & dispatch", "Move approved work through measurement, installation, pickup and freight."],
  [Boxes, "Warehouse pick lists", "Consolidate components and hardware into practical job checklists."],
];

export default function Home() {
  return <main className="shell">
    <nav className="nav"><Link className="brand" href="/"><span className="mark">R</span>RobeFlow</Link><Link className="btn" href="/login"><LockKeyhole size={17}/>Staff login</Link></nav>
    <section className="hero">
      <div><span className="eyebrow">Full-stack portfolio project</span><h1>One workspace for every stage of a wardrobe job.</h1><p>RobeFlow connects customer enquiries, quotations, pricing, invoices, payments, scheduling, dispatch and installation in a single role-based application.</p><div className="actions"><Link className="btn primary" href="/login">Open staff workspace</Link><a className="btn" href="https://github.com/saichand1226/robeflow-quote-management">View source code</a></div></div>
      <div className="preview"><div className="preview-head"><strong>Operations overview</strong><span className="dot"/></div><div className="metric-grid"><div className="metric"><span>Pipeline value</span><strong>$31,985</strong></div><div className="metric"><span>Accepted jobs</span><strong>12</strong></div><div className="metric"><span>Invoices pending</span><strong>3</strong></div><div className="metric"><span>Installations</span><strong>7</strong></div></div><div className="job"><div><strong>Q-2026-1042</strong><div style={{color:"#9fb0c9",fontSize:13,marginTop:4}}>Walk-in wardrobe · Installation</div></div><span className="status">Accepted</span></div><div className="job"><div><strong>Q-2026-1043</strong><div style={{color:"#9fb0c9",fontSize:13,marginTop:4}}>Bedroom storage · Pick up</div></div><span className="status">Ready</span></div></div>
    </section>
    <section className="section"><h2>From first enquiry to final dispatch</h2><div className="cards">{features.map(([Icon,title,copy])=><article className="card" key={String(title)}><Icon color="#087f68"/><strong>{String(title)}</strong><p>{String(copy)}</p></article>)}</div><p style={{display:"flex",gap:8,alignItems:"center",color:"#64748b",marginTop:28}}><BarChart3 size={18}/>Designed and developed by Saichand Muddasani.</p></section>
  </main>;
}

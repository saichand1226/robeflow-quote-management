import Link from "next/link";
import { ArrowRight, BarChart3, Boxes, CheckCircle2, FileSpreadsheet, FileText, LockKeyhole, Mail, PackageCheck, Ruler, Sparkles, Truck } from "lucide-react";

const features = [
  [FileText, "Quote with confidence", "Build accurate room-by-room quotes, attach designs and keep every revision together.", "01"],
  [Mail, "Keep payments visible", "Send professional invoices, record deposits and see what is still outstanding.", "02"],
  [Truck, "Move jobs forward", "Guide installation, pickup, delivery and freight jobs through the correct dispatch steps.", "03"],
  [FileSpreadsheet, "Work from Excel", "Keep the familiar Excel pick list, while every job retains the current file and its history.", "04"],
] as const;
const storageTypes = [
  ["Wardrobes", "Hanging, drawers and doors", "storage-tile storage-tile-one"],
  ["Entry storage", "Benches, shoes and everyday gear", "storage-tile storage-tile-two"],
  ["Pantry & utility", "Shelving, baskets and supplies", "storage-tile storage-tile-three"],
];

export default function Home() {
  return <main className="landing">
    <nav className="landing-nav">
      <Link className="landing-brand" href="/"><span className="landing-mark">R</span><span>RobeFlow<small>Storage workflow</small></span></Link>
      <div className="landing-nav-actions"><a href="#workflow">How it works</a><a href="#storage">Storage ideas</a><Link className="landing-login" href="/login"><LockKeyhole size={16}/>Staff login</Link></div>
    </nav>
    <section className="landing-hero">
      <div className="landing-hero-copy">
        <span className="landing-kicker"><Sparkles size={14}/>Built for custom storage teams</span>
        <h1>From the first idea<br/>to the <em>final fit.</em></h1>
        <p>RobeFlow brings enquiries, storage designs, quotes, payments, Excel pick lists and dispatch into one calm, connected workspace.</p>
        <div className="landing-actions"><Link className="landing-primary" href="/login">Open staff workspace <ArrowRight size={18}/></Link><a className="landing-secondary" href="#workflow">Explore the workflow</a></div>
        <div className="landing-trust"><span><CheckCircle2/>Role-based access</span><span><CheckCircle2/>Excel pick lists</span><span><CheckCircle2/>Live job status</span></div>
      </div>
      <div className="landing-visual">
        <img src="/images/robeflow-storage-hero.png" alt="Custom entry, pantry and wardrobe storage in a bright contemporary home"/>
        <div className="visual-shade"/>
        <div className="visual-label"><span>Featured space</span><strong>Entry + pantry storage</strong><small>Designed, quoted and dispatched in one flow</small></div>
        <div className="floating-job"><span className="floating-icon"><PackageCheck/></span><div><small>Job Q-2026-1042</small><strong>Ready for dispatch</strong></div><span className="live-dot"/></div>
        <div className="floating-metric"><BarChart3/><div><small>Pipeline</small><strong>$31,985</strong></div></div>
      </div>
    </section>
    <section className="landing-stats" aria-label="RobeFlow workflow summary"><div><strong>1</strong><span>connected workspace</span></div><div><strong>4</strong><span>job delivery types</span></div><div><strong>100%</strong><span>internal pick-list control</span></div><div><strong>Live</strong><span>payment & dispatch status</span></div></section>
    <section className="landing-storage" id="storage">
      <div className="section-heading"><span>More than wardrobes</span><h2>Every storage project has a place.</h2><p>RobeFlow can manage the full job whether the brief is bedroom storage, an organised entry, a pantry, utility shelving or a complete custom fit-out.</p></div>
      <div className="storage-grid">{storageTypes.map(([title,copy,className])=><article className={className} key={title}><div><span>Explore</span><h3>{title}</h3><p>{copy}</p><ArrowRight/></div></article>)}</div>
    </section>
    <section className="landing-workflow" id="workflow">
      <div className="section-heading light"><span>The workflow</span><h2>Clear handovers. Fewer loose ends.</h2><p>Every team sees what they need, at the right stage of the job.</p></div>
      <div className="workflow-grid">{features.map(([Icon,title,copy,number])=><article className="workflow-card" key={title}><div className="workflow-top"><span>{number}</span><Icon/></div><h3>{title}</h3><p>{copy}</p><div className="workflow-line"/></article>)}</div>
      <div className="workflow-route"><span><Ruler/>Measure & design</span><ArrowRight/><span><FileText/>Quote & approve</span><ArrowRight/><span><Boxes/>Pick & prepare</span><ArrowRight/><span><Truck/>Dispatch & complete</span></div>
    </section>
    <section className="landing-cta"><div><span>Ready when your team is</span><h2>Keep every storage job flowing.</h2></div><Link className="landing-primary light-button" href="/login">Enter RobeFlow <ArrowRight size={18}/></Link></section>
    <footer className="landing-footer"><Link className="landing-brand" href="/"><span className="landing-mark">R</span><span>RobeFlow<small>Storage workflow</small></span></Link><p>Designed and developed by Saichand Muddasani.</p><a href="https://github.com/saichand1226/robeflow-quote-management" target="_blank" rel="noreferrer">View source code</a></footer>
  </main>;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  async function login(event:React.FormEvent){event.preventDefault();setLoading(true);setError("");const {error}=await createClient().auth.signInWithPassword({email,password});if(error){setError(error.message);setLoading(false);return}router.push("/dashboard");router.refresh()}
  return <main className="auth-wrap"><form className="auth-card" onSubmit={login}><Link className="brand" href="/"><span className="mark">R</span>RobeFlow</Link><h1>Staff login</h1><p>Sign in with your approved organisation account.</p><div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></div>{error&&<div className="message error">{error}</div>}<button className="btn primary" disabled={loading}>{loading?"Signing in…":"Sign in"}</button><div className="small"><Link href="/forgot-password">Forgot password?</Link></div><div className="small">Need access? <Link href="/register">Request an account</Link></div></form></main>
}

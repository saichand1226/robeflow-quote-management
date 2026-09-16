"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPassword(){const[email,setEmail]=useState("");const[message,setMessage]=useState("");async function send(e:React.FormEvent){e.preventDefault();await createClient().auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/reset-password`});setMessage("If an account exists for that email, a password-reset link has been sent.")}return <main className="auth-wrap"><form className="auth-card" onSubmit={send}><Link className="brand" href="/"><span className="mark">R</span>RobeFlow</Link><h1>Reset password</h1><p>Enter your account email and we will send a secure reset link.</p><div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div>{message&&<div className="message">{message}</div>}<button className="btn primary">Send reset link</button><div className="small"><Link href="/login">Back to login</Link></div></form></main>}

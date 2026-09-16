"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPassword(){const[password,setPassword]=useState("");const[message,setMessage]=useState("");const[error,setError]=useState("");async function update(e:React.FormEvent){e.preventDefault();const{error}=await createClient().auth.updateUser({password});if(error){setError(error.message);return}setError("");setMessage("Password updated. You can now return to staff login.")}return <main className="auth-wrap"><form className="auth-card" onSubmit={update}><div className="brand"><span className="mark">R</span>RobeFlow</div><h1>Choose a new password</h1><p>Use at least eight characters and avoid passwords used on other websites.</p><div className="field"><label htmlFor="password">New password</label><input id="password" type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></div>{error&&<div className="message error">{error}</div>}{message&&<div className="message">{message}</div>}<button className="btn primary">Update password</button></form></main>}

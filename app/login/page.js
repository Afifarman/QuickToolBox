'use client';
import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage(){
 const supabase=createClient(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [mode,setMode]=useState('login'); const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false);
 async function submit(e){e.preventDefault();setBusy(true);setMsg('');
  const result=mode==='login'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});
  if(result.error)setMsg(result.error.message); else setMsg(mode==='login'?'Logged in successfully.':'Registration successful. Check your email if confirmation is enabled.'); setBusy(false);
 }
 async function google(){setMsg(''); const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${location.origin}/dashboard`}}); if(error)setMsg(error.message);}
 return <main className="auth-page"><div className="auth-card"><a href="/">← QuickToolBox</a><h1>{mode==='login'?'Welcome back':'Create account'}</h1><p>{mode==='login'?'Login to save tools, history and AI results.':'Create your free QuickToolBox account.'}</p><button onClick={google}>Continue with Google</button><div className="or">or</div><form onSubmit={submit}><input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required/><button className="btn" disabled={busy}>{busy?'Please wait…':mode==='login'?'Login':'Register'}</button></form>{msg&&<p>{msg}</p>}<button className="link-btn" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?"Don't have an account? Register":"Already have an account? Login"}</button></div></main>
}

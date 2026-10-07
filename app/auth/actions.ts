'use server';
import { redirect } from 'next/navigation';import { configured,supabase } from '@/lib/supabase';import { site } from '@/config/site';
export async function authenticate(form:FormData):Promise<{error?:string;message?:string}>{if(!configured())return {error:'Authentication is not configured yet. Explore the demo workspace below.'};const db=await supabase();const mode=String(form.get('mode'));const email=String(form.get('email')||'').trim();const password=String(form.get('password')||'');if(mode==='reset'){const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:`${site.domain}/auth/callback?next=/update-password`});return error?{error:error.message}:{message:'Check your inbox for a password reset link.'}}
if(password.length<8)return {error:'Use at least 8 characters.'};
if(mode==='update'){const {error}=await db.auth.updateUser({password});if(error)return {error:error.message};redirect('/dashboard')}
if(mode==='signup'){const {data,error}=await db.auth.signUp({email,password,options:{data:{first_name:String(form.get('first_name')||'').slice(0,80)},emailRedirectTo:`${site.domain}/auth/callback`}});if(error)return {error:error.message};if(!data.session)return {message:'Check your email to confirm your account, then sign in.'}}else{const {error}=await db.auth.signInWithPassword({email,password});if(error)return {error:error.message}}
redirect('/dashboard')}
export async function logout(){const db=await supabase();await db.auth.signOut();redirect('/login')}

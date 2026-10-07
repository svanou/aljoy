import { redirect } from 'next/navigation';import { supabase } from './supabase';
export async function requireUser(){const db=await supabase();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login');return {db,user}}
export async function requireAdmin(){const {db,user}=await requireUser();const {data,error}=await db.from('profiles').select('role').eq('id',user.id).single();if(error||data?.role!=='admin')redirect('/dashboard');return {db,user}}

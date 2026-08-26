import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const configured = Boolean(url && serviceKey);
export const supabase = configured ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;
export const anonSupabase = url && process.env.SUPABASE_ANON_KEY ? createClient(url, process.env.SUPABASE_ANON_KEY) : null;

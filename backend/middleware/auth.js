import { anonSupabase } from '../services/supabase.js';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !anonSupabase) return res.status(401).json({ error: 'Authentication is required.' });
  const { data, error } = await anonSupabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Your session has expired.' });
  req.user = data.user;
  next();
}

export function requireRole(...roles) {
  return async (req, res, next) => {
    const { data, error } = await req.app.locals.supabase.from('profiles').select('role,full_name,phone,whatsapp').eq('id', req.user.id).single();
    if (error || !data || !roles.includes(data.role)) return res.status(403).json({ error: 'You do not have permission for this action.' });
    req.profile = data;
    next();
  };
}

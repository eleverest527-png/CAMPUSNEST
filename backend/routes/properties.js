import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const allowedTypes = ['Self-contained','Single room','Room and parlour','Shared apartment','Flat','Hostel'];
const allowedUniversities = ['DELSU Abraka','FUPRE'];
const clean = value => typeof value === 'string' ? value.trim() : value;

router.get('/', async (req, res) => {
  const db = req.app.locals.supabase;
  if (!db) return res.status(503).json({ error: 'Supabase is not configured yet.' });
  let query = db.from('properties').select('*, property_images(id,url,sort_order), profiles!properties_owner_id_fkey(full_name,phone,whatsapp)').eq('approval_status','approved');
  const { search, university, location, type, minPrice, maxPrice, sort='newest', page='1', limit='12' } = req.query;
  if (search) query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`);
  if (university) query = query.eq('university', university);
  if (location) query = query.ilike('location', `%${location}%`);
  if (type) query = query.eq('property_type', type);
  if (minPrice) query = query.gte('price', Number(minPrice));
  if (maxPrice) query = query.lte('price', Number(maxPrice));
  query = query.order(sort === 'price_low' ? 'price' : 'created_at', { ascending: sort === 'price_low' });
  const from = (Number(page)-1) * Math.min(Number(limit), 40);
  const { data, error, count } = await query.range(from, from + Math.min(Number(limit), 40) - 1);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data: data ?? [], page: Number(page), total: count ?? data?.length ?? 0 });
});

router.get('/:id', async (req, res) => {
  if (!req.app.locals.supabase) return res.status(503).json({ error: 'Supabase is not configured yet.' });
  const { data, error } = await req.app.locals.supabase.from('properties').select('*, property_images(id,url,sort_order), profiles!properties_owner_id_fkey(full_name,phone,whatsapp)').eq('id', req.params.id).eq('approval_status','approved').single();
  if (error || !data) return res.status(404).json({ error: 'Property not found.' });
  res.json(data);
});

router.post('/', requireAuth, requireRole('agent','landlord'), async (req,res) => {
  const body = req.body;
  if (!clean(body.title) || !Number(body.price) || !allowedUniversities.includes(body.university) || !allowedTypes.includes(body.property_type)) return res.status(400).json({ error: 'Title, price, university and property type are required.' });
  const { data, error } = await req.app.locals.supabase.from('properties').insert({ ...body, title: clean(body.title), description: clean(body.description), location: clean(body.location), owner_id: req.user.id, price: Number(body.price), approval_status: 'pending', verification_status: 'pending' }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', requireAuth, requireRole('agent','landlord','admin'), async (req,res) => {
  const filter = req.profile.role === 'admin' ? { id: req.params.id } : { id: req.params.id, owner_id: req.user.id };
  const { data, error } = await req.app.locals.supabase.from('properties').update({ ...req.body, updated_at: new Date().toISOString(), approval_status: req.profile.role === 'admin' ? req.body.approval_status : 'pending' }).match(filter).select().single();
  if (error || !data) return res.status(404).json({ error: 'Property not found or not owned by you.' });
  res.json(data);
});

router.delete('/:id', requireAuth, requireRole('agent','landlord','admin'), async (req,res) => {
  const filter = req.profile.role === 'admin' ? { id: req.params.id } : { id: req.params.id, owner_id: req.user.id };
  const { error } = await req.app.locals.supabase.from('properties').delete().match(filter);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});
export default router;

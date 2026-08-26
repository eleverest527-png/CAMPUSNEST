import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth, requireRole('student'));
router.get('/', async (req,res) => { const { data,error } = await req.app.locals.supabase.from('favorites').select('property_id, properties(*,property_images(id,url,sort_order))').eq('student_id',req.user.id); if(error) return res.status(500).json({error:error.message}); res.json(data ?? []); });
router.post('/:propertyId', async (req,res) => { const { data,error } = await req.app.locals.supabase.from('favorites').insert({student_id:req.user.id,property_id:req.params.propertyId}).select().single(); if(error && error.code==='23505') return res.status(409).json({error:'Already saved.'}); if(error) return res.status(400).json({error:error.message}); res.status(201).json(data); });
router.delete('/:propertyId', async (req,res) => { const {error}=await req.app.locals.supabase.from('favorites').delete().match({student_id:req.user.id,property_id:req.params.propertyId}); if(error) return res.status(400).json({error:error.message}); res.status(204).end(); });
export default router;

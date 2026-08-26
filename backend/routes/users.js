import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
const router=Router();
router.get('/profile',requireAuth,async(req,res)=>{const {data,error}=await req.app.locals.supabase.from('profiles').select('*').eq('id',req.user.id).single();if(error)return res.status(404).json({error:error.message});res.json(data);});
router.patch('/profile',requireAuth,async(req,res)=>{const allowed={full_name:req.body.full_name,phone:req.body.phone,whatsapp:req.body.whatsapp};const {data,error}=await req.app.locals.supabase.from('profiles').update(allowed).eq('id',req.user.id).select().single();if(error)return res.status(400).json({error:error.message});res.json(data);});
export default router;

const express = require('express');
const supabase = require('../config/supabase');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper: format property with owner_name
const formatProperty = async (prop) => {
  if (!prop.owner_id) return prop;
  const { data: owner } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', prop.owner_id)
    .single();
  return {
    ...prop,
    owner_name: owner?.full_name || 'Unknown',
  };
};

// GET /api/admin/properties (get all properties with optional status filter)
router.get('/properties', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('properties').select('*');

    if (status && ['pending', 'verified', 'rejected'].includes(status)) {
      query = query.eq('verification_status', status);
    }

    const { data: properties, error } = await query;

    if (error) {
      console.error('Get admin properties error:', error);
      return res.status(500).json({ error: 'Failed to fetch properties' });
    }

    const formatted = await Promise.all((properties || []).map((p) => formatProperty(p)));
    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Get admin properties error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/properties/:id (approve/reject property)
router.patch('/properties/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { approval_status } = req.body;

    if (!approval_status || !['verified', 'rejected', 'pending'].includes(approval_status)) {
      return res.status(400).json({ error: 'Invalid approval_status value' });
    }

    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('properties')
      .update({ verification_status: approval_status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update property status error:', updateError);
      return res.status(500).json({ error: 'Failed to update property' });
    }

    const formatted = await formatProperty(updated);
    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Update property status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

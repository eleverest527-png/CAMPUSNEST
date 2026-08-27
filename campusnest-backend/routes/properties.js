const express = require('express');
const supabase = require('../config/supabase');
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');

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

// GET /api/properties (public, filters applied)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { campus, property_type, minPrice, maxPrice, q } = req.query;
    let query = supabase
      .from('properties')
      .select('*')
      .eq('verification_status', 'verified'); // Public browse only shows verified

    if (campus) query = query.eq('campus', campus);
    if (property_type) query = query.eq('property_type', property_type);
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));

    const { data: properties, error } = await query;

    if (error) {
      console.error('Get properties error:', error);
      return res.status(500).json({ error: 'Failed to fetch properties' });
    }

    // Filter by search query on title/description (client-side for simplicity)
    let results = properties || [];
    if (q) {
      const lowerQ = q.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerQ) ||
          (p.description && p.description.toLowerCase().includes(lowerQ))
      );
    }

    // Format with owner names
    const formatted = await Promise.all(results.map((p) => formatProperty(p)));
    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Get properties error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/properties/mine (authenticated, owner's listings)
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', req.user.id);

    if (error) {
      console.error('Get my listings error:', error);
      return res.status(500).json({ error: 'Failed to fetch listings' });
    }

    const formatted = await Promise.all((properties || []).map((p) => formatProperty(p)));
    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Get my listings error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/properties/:id (public, but shows owner_name)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const formatted = await formatProperty(property);
    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Get property error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/properties (create, authenticated landlord/admin)
router.post('/', requireAuth, requireRole('landlord', 'admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      property_type,
      bedrooms,
      campus,
      area,
      amenities,
      images,
    } = req.body;

    if (!title || !price || !property_type || !campus) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: property, error } = await supabase
      .from('properties')
      .insert([
        {
          owner_id: req.user.id,
          title,
          description: description || null,
          price: parseFloat(price),
          property_type,
          bedrooms: bedrooms || 1,
          campus,
          area: area || null,
          amenities: amenities || [],
          images: images || [],
          verification_status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Create property error:', error);
      return res.status(500).json({ error: 'Failed to create property' });
    }

    const formatted = await formatProperty(property);
    return res.status(201).json(formatted);
  } catch (err) {
    console.error('Create property error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/properties/:id (update, owner or admin only)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check ownership
    if (property.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update and reset verification_status to pending
    const updateData = {
      ...req.body,
      verification_status: 'pending',
    };

    const { data: updated, error: updateError } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update property error:', updateError);
      return res.status(500).json({ error: 'Failed to update property' });
    }

    const formatted = await formatProperty(updated);
    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Update property error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/properties/:id (delete, owner or admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check ownership
    if (property.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      console.error('Delete property error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete property' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete property error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

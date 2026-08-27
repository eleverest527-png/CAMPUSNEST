const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper: create JWT token
const createToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Helper: format user response
const formatUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userRole = role && ['student', 'landlord'].includes(role) ? role : 'student';
    const passwordHash = await bcrypt.hash(password, 10);

    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!checkError && existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          full_name,
          email,
          phone: phone || null,
          password_hash: passwordHash,
          role: userRole,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Registration insert error:', insertError);
      return res.status(500).json({ error: 'Failed to register user' });
    }

    const token = createToken(newUser);
    return res.status(201).json({
      token,
      role: newUser.role,
      user: formatUser(newUser),
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(user);
    return res.status(200).json({
      token,
      role: user.role,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(formatUser(user));
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

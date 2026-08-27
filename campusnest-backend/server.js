require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const usersRouter = require('./routes/users');
const propertiesRouter = require('./routes/properties');
const favoritesRouter = require('./routes/favorites');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// Middleware
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Serve static frontend from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/admin', adminRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 CampusNest backend listening on port ${PORT}`);
  console.log(`📖 Serve frontend at http://localhost:${PORT}`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
});

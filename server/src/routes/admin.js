const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply auth: in DEV_MODE or demo inspection, allow authenticated users to inspect SQLite database tables
router.use(authenticate, (req, res, next) => {
  if (req.user?.role === 'admin' || process.env.DEV_MODE === 'true') {
    return next();
  }
  return requireAdmin(req, res, next);
});

// GET /stats - Summary overview
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalItems = db.prepare('SELECT COUNT(*) as count FROM items').get().count;
    const activeLost = db.prepare("SELECT COUNT(*) as count FROM items WHERE type = 'lost' AND status IN ('open', 'matched')").get().count;
    const activeFound = db.prepare("SELECT COUNT(*) as count FROM items WHERE type = 'found' AND status IN ('open', 'matched')").get().count;
    const totalMatches = db.prepare('SELECT COUNT(*) as count FROM matches').get().count;
    const totalReturned = db.prepare("SELECT COUNT(*) as count FROM items WHERE status = 'returned'").get().count;
    const totalVerifications = db.prepare('SELECT COUNT(*) as count FROM verifications').get().count;
    const totalHandovers = db.prepare('SELECT COUNT(*) as count FROM handovers').get().count;

    res.json({
      total_users: totalUsers,
      total_items: totalItems,
      active_lost: activeLost,
      active_found: activeFound,
      total_matches: totalMatches,
      total_returned: totalReturned,
      total_verifications: totalVerifications,
      total_handovers: totalHandovers,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /users - All users
router.get('/users', (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT id, name, email, registration_number, phone, role, karma_points, notification_preferences, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `).all();
    res.json({ users });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /items - All items (including secret_detail for admin inspection)
router.get('/items', (req, res) => {
  try {
    const db = getDb();
    const items = db.prepare(`
      SELECT i.*, u.name as user_name, u.email as user_email,
        (SELECT filename FROM item_images WHERE item_id = i.id LIMIT 1) as image_filename
      FROM items i
      LEFT JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
    `).all();
    res.json({ items });
  } catch (err) {
    console.error('Admin items error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET /images - All item_images
router.get('/images', (req, res) => {
  try {
    const db = getDb();
    const images = db.prepare(`
      SELECT img.*, i.title as item_title, i.type as item_type
      FROM item_images img
      LEFT JOIN items i ON img.item_id = i.id
      ORDER BY img.created_at DESC
    `).all();
    res.json({ images });
  } catch (err) {
    console.error('Admin images error:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// GET /matches - All matches
router.get('/matches', (req, res) => {
  try {
    const db = getDb();
    const matches = db.prepare(`
      SELECT m.*,
        li.title as lost_title, lu.name as lost_user_name,
        fi.title as found_title, fu.name as found_user_name
      FROM matches m
      JOIN items li ON m.lost_item_id = li.id
      JOIN items fi ON m.found_item_id = fi.id
      JOIN users lu ON li.user_id = lu.id
      JOIN users fu ON fi.user_id = fu.id
      ORDER BY m.created_at DESC
    `).all();
    res.json({ matches });
  } catch (err) {
    console.error('Admin matches error:', err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /verifications - All verifications
router.get('/verifications', (req, res) => {
  try {
    const db = getDb();
    const verifications = db.prepare(`
      SELECT v.*, u.name as user_name, u.email as user_email,
        li.title as lost_title, fi.title as found_title, fi.secret_detail as target_secret
      FROM verifications v
      JOIN users u ON v.user_id = u.id
      JOIN matches m ON v.match_id = m.id
      JOIN items li ON m.lost_item_id = li.id
      JOIN items fi ON m.found_item_id = fi.id
      ORDER BY v.created_at DESC
    `).all();
    res.json({ verifications });
  } catch (err) {
    console.error('Admin verifications error:', err);
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
});

// GET /handovers - All handovers
router.get('/handovers', (req, res) => {
  try {
    const db = getDb();
    const handovers = db.prepare(`
      SELECT h.*,
        ou.name as owner_name, fu.name as finder_name,
        li.title as lost_title, fi.title as found_title
      FROM handovers h
      JOIN users ou ON h.owner_id = ou.id
      JOIN users fu ON h.finder_id = fu.id
      JOIN matches m ON h.match_id = m.id
      JOIN items li ON m.lost_item_id = li.id
      JOIN items fi ON m.found_item_id = fi.id
      ORDER BY h.created_at DESC
    `).all();
    res.json({ handovers });
  } catch (err) {
    console.error('Admin handovers error:', err);
    res.status(500).json({ error: 'Failed to fetch handovers' });
  }
});

// GET /notifications - All notifications
router.get('/notifications', (req, res) => {
  try {
    const db = getDb();
    const notifications = db.prepare(`
      SELECT n.*, u.name as user_name, u.email as user_email
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT 100
    `).all();
    res.json({ notifications });
  } catch (err) {
    console.error('Admin notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;

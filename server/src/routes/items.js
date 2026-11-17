const express = require('express');
const { getDb } = require('../db/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const matchingConfig = require('../config/matching');

const router = express.Router();

// Lazy import matching service to avoid circular deps
let matchingService = null;
function getMatchingService() {
  if (!matchingService) {
    matchingService = require('../services/matching');
  }
  return matchingService;
}

// POST / - Create new item
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { type, title, category, description, location, location_detail, date_occurred, secret_detail, item_location } = req.body;

    // Validation
    if (!type || !['lost', 'found'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "lost" or "found".' });
    }
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ error: 'Title must be at least 3 characters.' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Category is required.' });
    }
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters.' });
    }
    if (!location) {
      return res.status(400).json({ error: 'Location is required.' });
    }
    if (!date_occurred) {
      return res.status(400).json({ error: 'Date is required.' });
    }
    if (type === 'found' && !req.file) {
      return res.status(400).json({ error: 'Image is required for found items.' });
    }
    if (type === 'found' && !secret_detail) {
      return res.status(400).json({ error: 'Secret detail is required for found items.' });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO items (user_id, type, title, category, description, location, location_detail, date_occurred, secret_detail, item_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, type, title.trim(), category, description.trim(),
      location, location_detail || null, date_occurred,
      type === 'found' ? (secret_detail || null) : null,
      type === 'found' ? (item_location || null) : null
    );

    const itemId = result.lastInsertRowid;

    // Save image
    if (req.file) {
      db.prepare(`
        INSERT INTO item_images (item_id, filename, original_name, mime_type, size, path)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        itemId, req.file.filename, req.file.originalname,
        req.file.mimetype, req.file.size, req.file.path
      );
    }

    // Trigger matching asynchronously
    getMatchingService().findMatches(itemId).catch(err => {
      console.error('Matching error for item', itemId, ':', err.message);
    });

    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
    const images = db.prepare('SELECT id, filename, original_name, mime_type FROM item_images WHERE item_id = ?').all(itemId);

    res.status(201).json({ item: { ...item, images } });
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Failed to create item.' });
  }
});

// GET / - Browse items
router.get('/', optionalAuth, (req, res) => {
  try {
    const { type, category, location, search, page = 1, limit = 12, sort = 'newest' } = req.query;
    const db = getDb();
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let where = ['1=1'];
    let params = [];

    if (type && ['lost', 'found'].includes(type)) {
      where.push('i.type = ?');
      params.push(type);
    }
    if (category) {
      where.push('i.category = ?');
      params.push(category);
    }
    if (location) {
      where.push('i.location = ?');
      params.push(location);
    }
    if (search) {
      where.push("(i.title LIKE ? OR i.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    // Only show open/matched items in browse
    where.push("i.status IN ('open', 'matched')");

    const orderBy = sort === 'oldest' ? 'i.created_at ASC' : 'i.created_at DESC';
    const whereClause = where.join(' AND ');

    const total = db.prepare(`SELECT COUNT(*) as count FROM items i WHERE ${whereClause}`).get(...params).count;

    const items = db.prepare(`
      SELECT i.id, i.user_id, i.type, i.title, i.category, i.description, i.location,
             i.location_detail, i.date_occurred, i.status, i.item_location, i.created_at,
             u.name as user_name,
             img.filename as image_filename, img.id as image_id
      FROM items i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN item_images img ON img.item_id = i.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset);

    res.json({
      items,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('Browse items error:', err);
    res.status(500).json({ error: 'Failed to fetch items.' });
  }
});

// GET /stats/dashboard
router.get('/stats/dashboard', authenticate, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const myOpenLost = db.prepare("SELECT COUNT(*) as count FROM items WHERE user_id = ? AND type = 'lost' AND status = 'open'").get(userId).count;
    const myOpenFound = db.prepare("SELECT COUNT(*) as count FROM items WHERE user_id = ? AND type = 'found' AND status = 'open'").get(userId).count;

    const matchesWaiting = db.prepare(`
      SELECT COUNT(*) as count FROM matches m
      JOIN items li ON m.lost_item_id = li.id
      JOIN items fi ON m.found_item_id = fi.id
      WHERE (li.user_id = ? OR fi.user_id = ?) AND m.status = 'pending'
    `).get(userId, userId).count;

    const itemsReturned = db.prepare("SELECT COUNT(*) as count FROM items WHERE user_id = ? AND status = 'returned'").get(userId).count;

    res.json({ my_open_lost: myOpenLost, my_open_found: myOpenFound, matches_waiting: matchesWaiting, items_returned: itemsReturned });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// GET /active-lifecycle - Get active user items formatted for lifecycle progress card
router.get('/active-lifecycle', authenticate, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    // Fetch user items with their best match and handover details
    const items = db.prepare(`
      SELECT i.*,
             (SELECT m.id FROM matches m WHERE (m.lost_item_id = i.id OR m.found_item_id = i.id) AND m.score >= 0.5 ORDER BY m.score DESC LIMIT 1) as match_id,
             (SELECT m.status FROM matches m WHERE (m.lost_item_id = i.id OR m.found_item_id = i.id) AND m.score >= 0.5 ORDER BY m.score DESC LIMIT 1) as match_status,
             (SELECT m.score FROM matches m WHERE (m.lost_item_id = i.id OR m.found_item_id = i.id) AND m.score >= 0.5 ORDER BY m.score DESC LIMIT 1) as match_score,
             (SELECT h.status FROM handovers h JOIN matches m ON h.match_id = m.id WHERE (m.lost_item_id = i.id OR m.found_item_id = i.id) LIMIT 1) as handover_status
      FROM items i
      WHERE i.user_id = ?
      ORDER BY CASE i.status
        WHEN 'verifying' THEN 1
        WHEN 'matched' THEN 2
        WHEN 'open' THEN 3
        WHEN 'returned' THEN 4
        ELSE 5 END,
        i.created_at DESC
    `).all(userId);

    res.json({ items });
  } catch (err) {
    console.error('Active lifecycle error:', err);
    res.status(500).json({ error: 'Failed to fetch active lifecycle items.' });
  }
});

// GET /my - My items
router.get('/my', authenticate, (req, res) => {
  try {
    const db = getDb();
    const items = db.prepare(`
      SELECT i.*, img.filename as image_filename, img.id as image_id,
             (SELECT COUNT(*) FROM matches m WHERE m.lost_item_id = i.id OR m.found_item_id = i.id) as match_count
      FROM items i
      LEFT JOIN item_images img ON img.item_id = i.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `).all(req.user.id);

    res.json({ items });
  } catch (err) {
    console.error('My items error:', err);
    res.status(500).json({ error: 'Failed to fetch your items.' });
  }
});

// GET /:id - Item detail
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const item = db.prepare(`
      SELECT i.*, u.name as user_name, u.email as user_email
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!item) return res.status(404).json({ error: 'Item not found.' });

    // Hide secret detail unless admin or owner
    if (req.user?.id !== item.user_id && req.user?.role !== 'admin') {
      delete item.secret_detail;
    }

    const images = db.prepare('SELECT id, filename, original_name, mime_type FROM item_images WHERE item_id = ?').all(item.id);
    res.json({ item: { ...item, images } });
  } catch (err) {
    console.error('Item detail error:', err);
    res.status(500).json({ error: 'Failed to fetch item.' });
  }
});

// PUT /:id - Update item
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const item = db.prepare('SELECT * FROM items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!item) return res.status(404).json({ error: 'Item not found or not yours.' });
    if (item.status !== 'open') return res.status(400).json({ error: 'Can only edit open items.' });

    const { title, category, description, location, location_detail, date_occurred } = req.body;
    db.prepare(`
      UPDATE items SET title = COALESCE(?, title), category = COALESCE(?, category),
        description = COALESCE(?, description), location = COALESCE(?, location),
        location_detail = COALESCE(?, location_detail), date_occurred = COALESCE(?, date_occurred),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(title, category, description, location, location_detail, date_occurred, item.id);

    // Re-trigger matching
    getMatchingService().findMatches(item.id).catch(err => {
      console.error('Re-matching error:', err.message);
    });

    const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(item.id);
    res.json({ item: updated });
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Failed to update item.' });
  }
});

// DELETE /:id - Delete item
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const item = db.prepare('SELECT * FROM items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!item) return res.status(404).json({ error: 'Item not found or not yours.' });
    if (!['open', 'matched'].includes(item.status)) {
      return res.status(400).json({ error: 'Can only delete open or matched items.' });
    }

    // Delete image files from disk
    const images = db.prepare('SELECT path FROM item_images WHERE item_id = ?').all(item.id);
    const fs = require('fs');
    for (const img of images) {
      try { fs.unlinkSync(img.path); } catch {}
    }

    // Delete from DB (cascading will handle item_images, embeddings, etc.)
    db.prepare('DELETE FROM items WHERE id = ?').run(item.id);

    res.json({ message: 'Item deleted.' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

module.exports = router;

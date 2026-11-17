const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const matchingConfig = require('../config/matching');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// POST /confirm - Confirm handover with code
router.post('/confirm', authenticate, async (req, res) => {
  try {
    const { match_id, code } = req.body;
    if (!match_id || !code) {
      return res.status(400).json({ error: 'Match ID and handover code are required.' });
    }

    const db = getDb();
    const handover = db.prepare(`
      SELECT h.*, m.lost_item_id, m.found_item_id
      FROM handovers h
      JOIN matches m ON h.match_id = m.id
      WHERE h.match_id = ?
    `).get(match_id);

    if (!handover) {
      return res.status(404).json({ error: 'Handover not found.' });
    }

    // Only finder can confirm
    if (req.user.id !== handover.finder_id) {
      return res.status(403).json({ error: 'Only the finder can confirm the handover.' });
    }

    if (handover.status === 'completed') {
      return res.status(400).json({ error: 'This handover is already completed.' });
    }

    // Verify code
    const validCode = await bcrypt.compare(code, handover.code_hash);
    if (!validCode) {
      return res.status(400).json({ error: 'Invalid handover code.' });
    }

    // Complete handover
    db.prepare("UPDATE handovers SET status = 'completed', completed_at = datetime('now') WHERE id = ?").run(handover.id);
    db.prepare("UPDATE matches SET status = 'verified' WHERE id = ?").run(match_id);
    db.prepare("UPDATE items SET status = 'returned', updated_at = datetime('now') WHERE id IN (?, ?)").run(
      handover.lost_item_id, handover.found_item_id
    );

    // Award karma points
    db.prepare('UPDATE users SET karma_points = karma_points + ? WHERE id = ?').run(
      matchingConfig.karmaPointsPerReturn, handover.finder_id
    );

    // Notify both users
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, 'handover_complete', 'Item Returned! 🎉', 'The item has been successfully handed over. Thank you!', ?)
    `).run(handover.owner_id, JSON.stringify({ match_id }));

    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, 'handover_complete', 'Item Returned! 🎉', 'You earned ${matchingConfig.karmaPointsPerReturn} karma points for returning the item!', ?)
    `).run(handover.finder_id, JSON.stringify({ match_id }));

    // Delete images from disk and DB for both items
    const images = db.prepare('SELECT path, filename FROM item_images WHERE item_id IN (?, ?)').all(
      handover.lost_item_id, handover.found_item_id
    );
    for (const img of images) {
      try {
        const imgPath = img.path || path.join(uploadsDir, img.filename);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      } catch {}
    }
    db.prepare('DELETE FROM item_images WHERE item_id IN (?, ?)').run(handover.lost_item_id, handover.found_item_id);
    db.prepare('DELETE FROM embeddings WHERE item_id IN (?, ?)').run(handover.lost_item_id, handover.found_item_id);

    res.json({ message: 'Handover completed successfully! The item has been returned.' });
  } catch (err) {
    console.error('Handover confirm error:', err);
    res.status(500).json({ error: 'Failed to confirm handover.' });
  }
});

// GET /status/:matchId
router.get('/status/:matchId', authenticate, (req, res) => {
  try {
    const db = getDb();
    const handover = db.prepare(`
      SELECT h.id, h.code, h.method, h.status, h.created_at, h.completed_at, h.owner_id, h.finder_id
      FROM handovers h
      WHERE h.match_id = ?
    `).get(req.params.matchId);

    if (!handover) return res.status(404).json({ error: 'No handover found for this match.' });

    if (req.user.id !== handover.owner_id && req.user.id !== handover.finder_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Hide plaintext code from finder (only owner and admin see it)
    if (req.user.id !== handover.owner_id && req.user.role !== 'admin') {
      delete handover.code;
    }

    res.json({ handover });
  } catch (err) {
    console.error('Handover status error:', err);
    res.status(500).json({ error: 'Failed to fetch handover status.' });
  }
});

module.exports = router;

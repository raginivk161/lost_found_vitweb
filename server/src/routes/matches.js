const express = require('express');
const bcrypt = require('bcrypt');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const matchingConfig = require('../config/matching');

const router = express.Router();

// Fuzzy text match
function fuzzyTextMatch(answer, secret) {
  if (!answer || !secret) return 0;
  const aWords = answer.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const sWords = secret.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (aWords.length === 0 || sWords.length === 0) return 0;

  const aSet = new Set(aWords);
  const sSet = new Set(sWords);
  const intersection = new Set([...aSet].filter(x => sSet.has(x)));
  const union = new Set([...aSet, ...sSet]);
  const jaccard = intersection.size / union.size;

  // Also check substring containment for longer phrases
  const answerLower = answer.toLowerCase();
  const secretLower = secret.toLowerCase();
  const containsBonus = aWords.some(w => secretLower.includes(w)) ? 0.2 : 0;

  return Math.min(1, jaccard + containsBonus);
}

// GET / - My matches
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const matches = db.prepare(`
      SELECT m.*,
        li.title as lost_title, li.category as lost_category, li.description as lost_description,
        li.location as lost_location, li.status as lost_status, li.user_id as lost_user_id,
        fi.title as found_title, fi.category as found_category, fi.description as found_description,
        fi.location as found_location, fi.status as found_status, fi.user_id as found_user_id,
        li_img.filename as lost_image, fi_img.filename as found_image,
        lu.name as lost_user_name, fu.name as found_user_name
      FROM matches m
      JOIN items li ON m.lost_item_id = li.id
      JOIN items fi ON m.found_item_id = fi.id
      LEFT JOIN item_images li_img ON li_img.item_id = li.id
      LEFT JOIN item_images fi_img ON fi_img.item_id = fi.id
      JOIN users lu ON li.user_id = lu.id
      JOIN users fu ON fi.user_id = fu.id
      WHERE li.user_id = ? OR fi.user_id = ?
      ORDER BY m.score DESC
    `).all(req.user.id, req.user.id);

    res.json({ matches });
  } catch (err) {
    console.error('Get matches error:', err);
    res.status(500).json({ error: 'Failed to fetch matches.' });
  }
});

// GET /for-item/:itemId
router.get('/for-item/:itemId', authenticate, (req, res) => {
  try {
    const db = getDb();
    const item = db.prepare('SELECT * FROM items WHERE id = ? AND user_id = ?').get(req.params.itemId, req.user.id);
    if (!item) return res.status(404).json({ error: 'Item not found or not yours.' });

    const matches = db.prepare(`
      SELECT m.*,
        li.title as lost_title, li.category as lost_category, li.location as lost_location,
        fi.title as found_title, fi.category as found_category, fi.location as found_location,
        li_img.filename as lost_image, fi_img.filename as found_image,
        lu.name as lost_user_name, fu.name as found_user_name,
        li.user_id as lost_user_id, fi.user_id as found_user_id
      FROM matches m
      JOIN items li ON m.lost_item_id = li.id
      JOIN items fi ON m.found_item_id = fi.id
      LEFT JOIN item_images li_img ON li_img.item_id = li.id
      LEFT JOIN item_images fi_img ON fi_img.item_id = fi.id
      JOIN users lu ON li.user_id = lu.id
      JOIN users fu ON fi.user_id = fu.id
      WHERE m.lost_item_id = ? OR m.found_item_id = ?
      ORDER BY m.score DESC
    `).all(req.params.itemId, req.params.itemId);

    res.json({ matches });
  } catch (err) {
    console.error('Get item matches error:', err);
    res.status(500).json({ error: 'Failed to fetch matches.' });
  }
});

// GET /:id - Match detail
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const match = db.prepare(`
      SELECT m.*,
        li.title as lost_title, li.category as lost_category, li.description as lost_description,
        li.location as lost_location, li.date_occurred as lost_date, li.status as lost_status,
        li.user_id as lost_user_id, li.type as lost_type,
        fi.title as found_title, fi.category as found_category, fi.description as found_description,
        fi.location as found_location, fi.date_occurred as found_date, fi.status as found_status,
        fi.user_id as found_user_id, fi.type as found_type, fi.item_location,
        lu.name as lost_user_name, lu.email as lost_user_email, lu.phone as lost_user_phone,
        fu.name as found_user_name, fu.email as found_user_email, fu.phone as found_user_phone
      FROM matches m
      JOIN items li ON m.lost_item_id = li.id
      JOIN items fi ON m.found_item_id = fi.id
      JOIN users lu ON li.user_id = lu.id
      JOIN users fu ON fi.user_id = fu.id
      WHERE m.id = ?
    `).get(req.params.id);

    if (!match) return res.status(404).json({ error: 'Match not found.' });

    // Access control
    if (req.user.id !== match.lost_user_id && req.user.id !== match.found_user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have access to this match.' });
    }

    // Only reveal contact info after verification
    if (match.status !== 'verified') {
      delete match.lost_user_email;
      delete match.lost_user_phone;
      delete match.found_user_email;
      delete match.found_user_phone;
    }

    // Get images
    const lostImages = db.prepare('SELECT id, filename FROM item_images WHERE item_id = ?').all(match.lost_item_id);
    const foundImages = db.prepare('SELECT id, filename FROM item_images WHERE item_id = ?').all(match.found_item_id);

    // Get verification history
    const verifications = db.prepare('SELECT * FROM verifications WHERE match_id = ? ORDER BY created_at DESC').all(match.id);

    // Get handover info
    const handover = db.prepare('SELECT id, method, status, created_at, completed_at FROM handovers WHERE match_id = ?').get(match.id);

    res.json({
      match: {
        ...match,
        lost_images: lostImages,
        found_images: foundImages,
        verifications,
        handover,
      },
    });
  } catch (err) {
    console.error('Match detail error:', err);
    res.status(500).json({ error: 'Failed to fetch match details.' });
  }
});

// POST /:id/claim - Claim "this is mine"
router.post('/:id/claim', authenticate, async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer || answer.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a detailed description (at least 3 characters).' });
    }

    const db = getDb();
    const match = db.prepare(`
      SELECT m.*, fi.secret_detail, li.user_id as lost_user_id, fi.user_id as found_user_id
      FROM matches m
      JOIN items li ON m.lost_item_id = li.id
      JOIN items fi ON m.found_item_id = fi.id
      WHERE m.id = ?
    `).get(req.params.id);

    if (!match) return res.status(404).json({ error: 'Match not found.' });

    // Only the lost item owner can claim
    if (req.user.id !== match.lost_user_id) {
      return res.status(403).json({ error: 'Only the person who lost the item can claim it.' });
    }

    if (match.status === 'verified') {
      return res.status(400).json({ error: 'This match is already verified.' });
    }

    // Check attempt count
    const attempts = db.prepare('SELECT COUNT(*) as count FROM verifications WHERE match_id = ? AND user_id = ?').get(match.id, req.user.id).count;

    if (attempts >= matchingConfig.maxVerificationAttempts) {
      // Lock the claim
      db.prepare("UPDATE matches SET status = 'rejected' WHERE id = ?").run(match.id);

      // Notify admin
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES ((SELECT id FROM users WHERE role = 'admin' LIMIT 1), 'admin_alert', 'Claim Locked',
                'A claim has been locked after too many failed attempts.', ?)
      `).run(JSON.stringify({ match_id: match.id }));

      return res.status(429).json({ error: 'Maximum verification attempts reached. This claim has been flagged for admin review.', locked: true });
    }

    // Compute similarity
    const fuzzyScore = fuzzyTextMatch(answer, match.secret_detail);
    const similarity = fuzzyScore;

    const verified = similarity >= matchingConfig.verificationThreshold;
    const result = verified ? 'verified' : 'failed';

    // Store verification attempt
    db.prepare(`
      INSERT INTO verifications (match_id, user_id, answer, similarity_score, result, attempt_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(match.id, req.user.id, answer, similarity, result, attempts + 1);

    if (verified) {
      // Update match status
      db.prepare("UPDATE matches SET status = 'verified' WHERE id = ?").run(match.id);

      // Update items to verifying
      db.prepare("UPDATE items SET status = 'verifying' WHERE id = ? OR id = ?").run(match.lost_item_id, match.found_item_id);

      // Generate handover code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, 10);

      db.prepare(`
        INSERT INTO handovers (match_id, code, code_hash, owner_id, finder_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(match.id, code, codeHash, req.user.id, match.found_user_id);

      // Notify both users
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (?, 'verification_success', 'Item Verified!', 'Your lost item claim has been verified. Use the handover code to collect your item.', ?)
      `).run(req.user.id, JSON.stringify({ match_id: match.id }));

      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (?, 'verification_success', 'Item Claimed!', 'The owner has verified their claim. They will come to collect the item with a handover code.', ?)
      `).run(match.found_user_id, JSON.stringify({ match_id: match.id }));

      return res.json({
        verified: true,
        handoverCode: code,
        message: 'Verification successful! Use this code at handover.',
      });
    } else {
      const remaining = matchingConfig.maxVerificationAttempts - (attempts + 1);
      return res.json({
        verified: false,
        remainingAttempts: remaining,
        message: remaining > 0
          ? `Verification failed. You have ${remaining} attempt(s) remaining.`
          : 'Verification failed. No more attempts available.',
      });
    }
  } catch (err) {
    console.error('Claim error:', err);
    res.status(500).json({ error: 'Failed to process claim.' });
  }
});

module.exports = router;

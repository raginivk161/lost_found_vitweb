const express = require('express');
const bcrypt = require('bcrypt');
const { getDb } = require('../db/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Strictly enforce authentication and admin role for all admin routes
router.use(authenticate, requireAdmin);

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
    const flaggedClaims = db.prepare(`
      SELECT COUNT(DISTINCT m.id) as count FROM matches m
      WHERE m.status = 'rejected' OR m.id IN (
        SELECT match_id FROM verifications GROUP BY match_id HAVING COUNT(*) >= 3
      )
    `).get().count;

    res.json({
      total_users: totalUsers,
      total_items: totalItems,
      active_lost: activeLost,
      active_found: activeFound,
      total_matches: totalMatches,
      total_returned: totalReturned,
      total_verifications: totalVerifications,
      total_handovers: totalHandovers,
      flagged_claims: flaggedClaims,
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

// GET /flagged-claims - List claims locked or failed after verification attempts
router.get('/flagged-claims', (req, res) => {
  try {
    const db = getDb();
    const flagged = db.prepare(`
      SELECT m.*,
        li.title as lost_title, li.category as lost_category, li.description as lost_description, li.location as lost_location, li.user_id as lost_user_id,
        lu.name as lost_user_name, lu.email as lost_user_email, lu.registration_number as lost_user_reg,
        fi.title as found_title, fi.category as found_category, fi.description as found_description, fi.location as found_location, fi.user_id as found_user_id, fi.secret_detail,
        fu.name as found_user_name, fu.email as found_user_email,
        (SELECT COUNT(*) FROM verifications v WHERE v.match_id = m.id) as attempt_count,
        (SELECT code FROM handovers h WHERE h.match_id = m.id) as handover_code
      FROM matches m
      JOIN items li ON m.lost_item_id = li.id
      JOIN items fi ON m.found_item_id = fi.id
      JOIN users lu ON li.user_id = lu.id
      JOIN users fu ON fi.user_id = fu.id
      WHERE m.status IN ('rejected', 'pending') AND (
        m.status = 'rejected' OR (SELECT COUNT(*) FROM verifications v WHERE v.match_id = m.id) >= 1
      )
      ORDER BY CASE m.status WHEN 'rejected' THEN 1 ELSE 2 END, m.id DESC
    `).all();

    const getVerifs = db.prepare(`
      SELECT v.*, u.name as user_name
      FROM verifications v
      JOIN users u ON v.user_id = u.id
      WHERE v.match_id = ?
      ORDER BY v.attempt_number ASC
    `);

    const claimsWithHistory = flagged.map((f) => ({
      ...f,
      attempts: getVerifs.all(f.id),
    }));

    res.json({ flagged_claims: claimsWithHistory });
  } catch (err) {
    console.error('Flagged claims error:', err);
    res.status(500).json({ error: 'Failed to fetch flagged claims' });
  }
});

// POST /claims/:matchId/verify - Admin manually approves & unlocks a claim
router.post('/claims/:matchId/verify', async (req, res) => {
  try {
    const { matchId } = req.params;
    const db = getDb();

    const match = db.prepare(`
      SELECT m.*, li.title as lost_title, fi.title as found_title,
             li.user_id as lost_user_id, fi.user_id as found_user_id
      FROM matches m
      JOIN items li ON m.lost_item_id = li.id
      JOIN items fi ON m.found_item_id = fi.id
      WHERE m.id = ?
    `).get(matchId);

    if (!match) return res.status(404).json({ error: 'Match not found' });

    // Generate or retrieve handover code
    let handover = db.prepare('SELECT * FROM handovers WHERE match_id = ?').get(matchId);
    let code;
    if (handover && handover.code) {
      code = handover.code;
    } else {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, 10);
      db.prepare(`
        INSERT INTO handovers (match_id, code, code_hash, owner_id, finder_id)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(match_id) DO UPDATE SET code = excluded.code, code_hash = excluded.code_hash
      `).run(matchId, code, codeHash, match.lost_user_id, match.found_user_id);
    }

    // Update match status to 'verified'
    db.prepare("UPDATE matches SET status = 'verified' WHERE id = ?").run(matchId);

    // Update items status to 'verifying'
    db.prepare("UPDATE items SET status = 'verifying' WHERE id IN (?, ?) AND status != 'returned'").run(
      match.lost_item_id, match.found_item_id
    );

    // Record admin approval in verifications
    const nextAttempt = (db.prepare('SELECT COUNT(*) as count FROM verifications WHERE match_id = ?').get(matchId).count || 0) + 1;
    db.prepare(`
      INSERT INTO verifications (match_id, user_id, answer, similarity_score, result, attempt_number)
      VALUES (?, ?, ?, ?, 'verified', ?)
    `).run(matchId, match.lost_user_id, 'Approved and verified by Campus Security Administrator', 1.0, nextAttempt);

    // Notify lost item owner
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, 'verification_success', 'Claim Approved by Admin!',
              ?, ?)
    `).run(
      match.lost_user_id,
      `Campus Security Admin has manually verified your claim for "${match.lost_title}". Your handover code is ${code}.`,
      JSON.stringify({ match_id: match.id, handover_code: code })
    );

    // Notify found item finder
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (?, 'verification_success', 'Item Claim Approved by Admin',
              ?, ?)
    `).run(
      match.found_user_id,
      `Campus Security Admin has verified the owner's claim for your found item "${match.found_title}". The owner has been given the handover code.`,
      JSON.stringify({ match_id: match.id })
    );

    res.json({
      message: 'Claim verified and approved successfully by Admin.',
      handover_code: code,
      match_id: matchId,
    });
  } catch (err) {
    console.error('Admin verify claim error:', err);
    res.status(500).json({ error: 'Failed to verify claim' });
  }
});

// POST /claims/:matchId/reset - Reset attempts so student can try again
router.post('/claims/:matchId/reset', (req, res) => {
  try {
    const { matchId } = req.params;
    const db = getDb();
    db.prepare("DELETE FROM verifications WHERE match_id = ?").run(matchId);
    db.prepare("UPDATE matches SET status = 'pending' WHERE id = ?").run(matchId);
    res.json({ message: 'Verification attempts reset. Student can submit new proof.' });
  } catch (err) {
    console.error('Reset attempts error:', err);
    res.status(500).json({ error: 'Failed to reset attempts' });
  }
});

module.exports = router;

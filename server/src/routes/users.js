const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// GET /profile - Get current user's profile
router.get('/profile', authenticate, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(`
      SELECT id, name, email, registration_number, phone, role, karma_points, notification_preferences, created_at, updated_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found' });
    try {
      user.notification_preferences = JSON.parse(user.notification_preferences || '{}');
    } catch {
      user.notification_preferences = { email: true, inApp: true };
    }

    res.json({ user });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /profile - Update profile details (name, phone)
router.put('/profile', authenticate, (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    const db = getDb();
    db.prepare(`
      UPDATE users 
      SET name = ?, phone = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name.trim(), phone ? phone.trim() : null, req.user.id);

    const updatedUser = db.prepare(`
      SELECT id, name, email, registration_number, phone, role, karma_points, notification_preferences, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    try {
      updatedUser.notification_preferences = JSON.parse(updatedUser.notification_preferences || '{}');
    } catch {
      updatedUser.notification_preferences = { email: true, inApp: true };
    }

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /password - Change password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newHash, req.user.id);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// PUT /notifications - Update notification preferences
router.put('/notifications', authenticate, (req, res) => {
  try {
    const { email, inApp } = req.body;
    const prefs = JSON.stringify({
      email: Boolean(email),
      inApp: inApp !== false
    });

    const db = getDb();
    db.prepare('UPDATE users SET notification_preferences = ?, updated_at = datetime(\'now\') WHERE id = ?').run(prefs, req.user.id);

    res.json({ message: 'Notification preferences updated', preferences: JSON.parse(prefs) });
  } catch (err) {
    console.error('Preferences update error:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// GET /stats - User statistics
router.get('/stats', authenticate, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    const user = db.prepare('SELECT karma_points FROM users WHERE id = ?').get(userId);
    const lostCount = db.prepare("SELECT COUNT(*) as count FROM items WHERE user_id = ? AND type = 'lost'").get(userId).count;
    const foundCount = db.prepare("SELECT COUNT(*) as count FROM items WHERE user_id = ? AND type = 'found'").get(userId).count;
    const returnedCount = db.prepare("SELECT COUNT(*) as count FROM items WHERE user_id = ? AND status = 'returned'").get(userId).count;

    const matchesCount = db.prepare(`
      SELECT COUNT(*) as count FROM matches m
      JOIN items li ON m.lost_item_id = li.id
      JOIN items fi ON m.found_item_id = fi.id
      WHERE li.user_id = ? OR fi.user_id = ?
    `).get(userId, userId).count;

    res.json({
      karma_points: user ? user.karma_points : 0,
      items_lost: lostCount,
      items_found: foundCount,
      items_returned: returnedCount,
      matches_count: matchesCount,
    });
  } catch (err) {
    console.error('User stats error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// DELETE /account - Delete account, all items, and all associated images
router.delete('/account', authenticate, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    // Fetch all image paths for all items belonging to this user
    const images = db.prepare(`
      SELECT img.path, img.filename 
      FROM item_images img
      JOIN items i ON img.item_id = i.id
      WHERE i.user_id = ?
    `).all(userId);

    // Delete image files from disk
    for (const img of images) {
      try {
        const filePath = img.path || path.join(uploadsDir, img.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn('Could not delete image file:', img.filename);
      }
    }

    // Delete user from DB (Foreign keys ON DELETE CASCADE removes items, images, matches, etc.)
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    // Clear cookie
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    res.json({ message: 'Account and all associated data deleted successfully' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;

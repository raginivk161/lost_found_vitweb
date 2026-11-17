const express = require('express');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET / - Return notifications for logged in user
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(req.user.id);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND read = 0
    `).get(req.user.id).count;

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /unread-count - Unread notifications count
router.get('/unread-count', authenticate, (req, res) => {
  try {
    const db = getDb();
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND read = 0
    `).get(req.user.id).count;

    res.json({ count });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PUT /:id/read - Mark single notification as read
router.put('/:id/read', authenticate, (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`
      UPDATE notifications 
      SET read = 1 
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PUT /read-all - Mark all notifications as read
router.put('/read-all', authenticate, (req, res) => {
  try {
    const db = getDb();
    db.prepare(`
      UPDATE notifications 
      SET read = 1 
      WHERE user_id = ? AND read = 0
    `).run(req.user.id);

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// DELETE /:id - Delete a notification
router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`
      DELETE FROM notifications 
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { getDb, closeDb } = require('../src/db/database');

function runCleanup() {
  console.log('[Cleanup Job] Running 30-day resolved/expired image cleanup...');
  const db = getDb();
  const uploadsDir = path.join(__dirname, '..', 'uploads');

  // Find images belonging to items that have been resolved or returned > 30 days ago
  const oldItems = db.prepare(`
    SELECT i.id, i.title, i.status, i.updated_at, img.id as img_id, img.filename, img.path
    FROM items i
    JOIN item_images img ON img.item_id = i.id
    WHERE i.status IN ('returned', 'closed')
      AND datetime(i.updated_at) < datetime('now', '-30 days')
  `).all();

  console.log(`[Cleanup Job] Found ${oldItems.length} old images to clean up.`);

  let deletedCount = 0;
  for (const item of oldItems) {
    try {
      const filePath = item.path || path.join(uploadsDir, item.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      db.prepare('DELETE FROM item_images WHERE id = ?').run(item.img_id);
      db.prepare('DELETE FROM embeddings WHERE item_id = ?').run(item.id);
      deletedCount++;
    } catch (err) {
      console.warn(`Could not delete image for item ${item.id}:`, err.message);
    }
  }

  console.log(`[Cleanup Job] Successfully removed ${deletedCount} images from disk and database.`);
  closeDb();
}

runCleanup();

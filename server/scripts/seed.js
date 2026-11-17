const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const bcrypt = require('bcrypt');
const { getDb, closeDb } = require('../src/db/database');

// Simple function to create sample SVG images and save as PNG/SVG
function createSampleImage(filename, title, color = '#2F5BEA') {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filePath = path.join(uploadsDir, filename);

  // Create an SVG representation and write as file
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#0F1B4C"/>
    <circle cx="300" cy="180" r="90" fill="${color}" opacity="0.8"/>
    <text x="300" y="190" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">
      ${title}
    </text>
    <text x="300" y="340" font-family="sans-serif" font-size="14" fill="#94A3B8" text-anchor="middle">
      VIT Campus Lost &amp; Found Item Verification Photo
    </text>
  </svg>`;

  fs.writeFileSync(filePath, svg);
  return filePath;
}

async function seed() {
  console.log('--- Seeding VIT Lost & Found Database ---');
  const db = getDb();

  // Clear existing data in correct order
  db.exec(`
    DELETE FROM handovers;
    DELETE FROM verifications;
    DELETE FROM matches;
    DELETE FROM notifications;
    DELETE FROM embeddings;
    DELETE FROM item_images;
    DELETE FROM items;
    DELETE FROM otps;
    DELETE FROM users;
  `);

  console.log('Cleared existing database tables.');

  // 1. Create Admin
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vit.edu').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const adminInsert = db.prepare(`
    INSERT INTO users (name, email, registration_number, password_hash, role, karma_points)
    VALUES (?, ?, ?, ?, 'admin', 100)
  `).run('VIT Campus Security Admin', adminEmail, 'ADMIN001', adminHash);
  const adminId = adminInsert.lastInsertRowid;
  console.log(`Created Admin: ${adminEmail} (password: ${adminPassword})`);

  // 2. Create 3 Demo Students
  const defaultUserPassword = 'Student@123';
  const userPasswordHash = await bcrypt.hash(defaultUserPassword, 10);

  const studentsData = [
    { name: 'Aarav Sharma', email: 'aarav.sharma2024@vit.edu', reg: '24BCE1001', karma: 20 },
    { name: 'Priya Patel', email: 'priya.patel2023@vit.edu', reg: '23BCE2045', karma: 40 },
    { name: 'Rohan Kumar', email: 'rohan.kumar2024@vit.edu', reg: '24MIS0089', karma: 10 },
  ];

  const studentIds = [];
  for (const s of studentsData) {
    const res = db.prepare(`
      INSERT INTO users (name, email, registration_number, password_hash, role, karma_points)
      VALUES (?, ?, ?, ?, 'student', ?)
    `).run(s.name, s.email, s.reg, userPasswordHash, s.karma);
    studentIds.push(res.lastInsertRowid);
    console.log(`Created Student: ${s.name} (${s.email}, reg: ${s.reg}, password: ${defaultUserPassword})`);
  }

  // 3. Realistic VIT Items (12 items)
  const itemsData = [
    // 1: Aarav lost black wallet
    {
      userId: studentIds[0],
      type: 'lost',
      title: 'Black Tommy Hilfiger Leather Wallet',
      category: 'Bags & Wallets',
      description: 'Lost my bi-fold black leather wallet. Contains VIT student ID (24BCE1001), bus pass, and ₹500 note. Last seen at TT Food court during lunch.',
      location: 'TT Block',
      location_detail: 'Lawn bench near Nescafe kiosk',
      date: '2026-11-16 13:30',
      secret: null,
      item_loc: null,
      imageFile: 'wallet_black.svg',
      color: '#1E293B',
    },
    // 2: Priya found black wallet (MATCHES ITEM 1!)
    {
      userId: studentIds[1],
      type: 'found',
      title: 'Black Leather Men\'s Wallet',
      category: 'Bags & Wallets',
      description: 'Found a black leather wallet on a bench outside TT Block. It has cards and an ID inside.',
      location: 'TT Block',
      location_detail: 'Bench opposite TT Nescafe',
      date: '2026-11-16 14:00',
      secret: '24BCE1001 ID card and folded 500 rupee note inside back compartment',
      item_loc: 'with me (Priya Patel, Block C 302)',
      imageFile: 'found_wallet.svg',
      color: '#334155',
    },
    // 3: Rohan lost calculator
    {
      userId: studentIds[2],
      type: 'lost',
      title: 'Casio Scientific Calculator fx-991CW',
      category: 'Electronics',
      description: 'Black Casio scientific calculator forgotten on desk in SJT 412 after Calculus CAT exam. Has an Iron Man sticker on the sliding cover.',
      location: 'SJT',
      location_detail: 'Classroom SJT 412, row 3',
      date: '2026-11-15 11:30',
      secret: null,
      item_loc: null,
      imageFile: 'casio_calc.svg',
      color: '#0284C7',
    },
    // 4: Aarav found calculator (MATCHES ITEM 3!)
    {
      userId: studentIds[0],
      type: 'found',
      title: 'Casio Scientific Calculator with Sticker',
      category: 'Electronics',
      description: 'Found scientific calculator left in SJT 4th floor after morning exams.',
      location: 'SJT',
      location_detail: 'SJT 412 podium desk',
      date: '2026-11-15 12:00',
      secret: 'Red and gold Marvel Iron Man sticker on back sliding cover',
      item_loc: 'security desk at SJT Ground Floor',
      imageFile: 'found_calc.svg',
      color: '#0369A1',
    },
    // 5: Priya lost blue umbrella
    {
      userId: studentIds[1],
      type: 'lost',
      title: 'Navy Blue Decathlon Compact Umbrella',
      category: 'Umbrellas',
      description: 'Automatic folding navy blue umbrella left on hook near Library reading hall entry.',
      location: 'Library',
      location_detail: 'Central Library 1st floor bag racks',
      date: '2026-11-14 17:00',
      secret: null,
      item_loc: null,
      imageFile: 'umbrella_blue.svg',
      color: '#1D4ED8',
    },
    // 6: Rohan found blue umbrella (MATCHES ITEM 5!)
    {
      userId: studentIds[2],
      type: 'found',
      title: 'Dark Blue Folding Umbrella',
      category: 'Umbrellas',
      description: 'Found dark blue umbrella left near library lockers entrance.',
      location: 'Library',
      location_detail: 'Locker area entry',
      date: '2026-11-14 18:30',
      secret: 'Decathlon Quechua tag with small yellow wrist lanyard',
      item_loc: 'Library reception desk',
      imageFile: 'found_umbrella.svg',
      color: '#2563EB',
    },
    // 7: Rohan lost Boat Earbuds
    {
      userId: studentIds[2],
      type: 'lost',
      title: 'Boat Airdopes 141 White Case',
      category: 'Headphones & Earbuds',
      description: 'White Boat earbuds case lost at Main Building corridor.',
      location: 'Main Building',
      location_detail: 'Staircase between 2nd and 3rd floor',
      date: '2026-11-13 10:15',
      secret: null,
      item_loc: null,
      imageFile: 'boat_earbuds.svg',
      color: '#E2E8F0',
    },
    // 8: Aarav lost Water Bottle
    {
      userId: studentIds[0],
      type: 'lost',
      title: 'Milton 1000ml Steel Water Bottle',
      category: 'Water Bottles & Containers',
      description: 'Silver insulated stainless steel bottle with scratches on base.',
      location: 'SMV',
      location_detail: 'Room 204 near window',
      date: '2026-11-12 15:45',
      secret: null,
      item_loc: null,
      imageFile: 'milton_bottle.svg',
      color: '#94A3B8',
    },
    // 9: Priya found Laptop Charger
    {
      userId: studentIds[1],
      type: 'found',
      title: 'Dell 65W USB-C Laptop Charger',
      category: 'Chargers & Cables',
      description: 'Found black Dell USB-C charger left plugged into socket at Technology Tower lab.',
      location: 'Technology Tower',
      location_detail: 'TT 308 Computer Lab row 4',
      date: '2026-11-16 09:00',
      secret: 'Orange tape wrapped around the cable near the USB-C pin',
      item_loc: 'with me (Priya Patel)',
      imageFile: 'dell_charger.svg',
      color: '#475569',
    },
    // 10: Aarav found Student ID Card
    {
      userId: studentIds[0],
      type: 'found',
      title: 'VIT Student ID Card in Red Lanyard',
      category: 'ID Cards & Documents',
      description: 'Found student ID card lying on staircase at Anna Auditorium.',
      location: 'Anna Auditorium',
      location_detail: 'Right side staircase',
      date: '2026-11-15 16:30',
      secret: 'Registration number ends in 3142 with CS specialization',
      item_loc: 'block office at GDN Block',
      imageFile: 'student_id.svg',
      color: '#DC2626',
    },
    // 11: Rohan lost Nike Gym Bag
    {
      userId: studentIds[2],
      type: 'lost',
      title: 'Black Nike Drawstring Sports Bag',
      category: 'Sports Equipment',
      description: 'Black bag containing badminton racket and Yonex grip tape forgotten at Sports Complex badminton court.',
      location: 'Sports Complex',
      location_detail: 'Badminton Court 3 bench',
      date: '2026-11-14 19:00',
      secret: null,
      item_loc: null,
      imageFile: 'nike_bag.svg',
      color: '#0F172A',
    },
    // 12: Priya found Spiral Chemistry Notebook
    {
      userId: studentIds[1],
      type: 'found',
      title: 'Spiral Bound Engineering Chemistry Notebook',
      category: 'Books & Notes',
      description: 'Found Classmate spiral notebook with green cover containing handwritten notes for CHY1002.',
      location: 'GDN Block',
      location_detail: 'GDN 102 classroom desk',
      date: '2026-11-13 14:00',
      secret: 'Name written on page 1: Suresh K with drawing of benzene ring',
      item_loc: 'GDN security desk',
      imageFile: 'notes_chem.svg',
      color: '#16A34A',
    },
  ];

  const insertedItemIds = [];
  for (const item of itemsData) {
    const res = db.prepare(`
      INSERT INTO items (user_id, type, title, category, description, location, location_detail, date_occurred, secret_detail, item_location, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `).run(
      item.userId, item.type, item.title, item.category, item.description,
      item.location, item.location_detail, item.date, item.secret, item.item_loc
    );
    const itemId = res.lastInsertRowid;
    insertedItemIds.push(itemId);

    // Create realistic image and insert record
    const imgPath = createSampleImage(item.imageFile, item.title, item.color);
    db.prepare(`
      INSERT INTO item_images (item_id, filename, original_name, mime_type, size, path)
      VALUES (?, ?, ?, 'image/svg+xml', 1024, ?)
    `).run(itemId, item.imageFile, item.imageFile, imgPath);
  }

  console.log(`Created ${insertedItemIds.length} realistic VIT campus items with photo records.`);

  // 4. Run matching to generate initial demo matches
  console.log('Running matching algorithm on seeded items...');
  const { findMatches } = require('../src/services/matching');
  for (const id of insertedItemIds) {
    try {
      await findMatches(id);
    } catch (err) {
      console.warn('Match run notice:', err.message);
    }
  }

  const matchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get().count;
  console.log(`Generated ${matchCount} verified match candidates.`);

  closeDb();
  console.log('✅ Seeding completed successfully!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

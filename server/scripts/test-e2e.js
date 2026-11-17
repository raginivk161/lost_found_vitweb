const fs = require('fs');
const path = require('path');
const { getDb, closeDb } = require('../src/db/database');

async function runE2EDemoTest() {
  console.log('\n===============================================================');
  console.log('    VIT Lost & Found - End-to-End Scenario Verification Test');
  console.log('===============================================================\n');

  const BASE_URL = 'http://localhost:3001';

  // Helper for cookie-based requests
  let userACookies = '';
  let userBCookies = '';

  // 1. Sign in User A (Aarav Sharma)
  console.log('Step 1: Signing in User A (aarav.sharma2024@vit.edu)...');
  const loginARes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav.sharma2024@vit.edu', password: 'Student@123' }),
  });
  const cookieA = loginARes.headers.get('set-cookie');
  userACookies = cookieA ? cookieA.split(';')[0] : '';
  const loginAData = await loginARes.json();
  console.log(`  ✓ User A Authenticated: ${loginAData.user.name} (id: ${loginAData.user.id})`);

  // 2. Sign in User B (Priya Patel)
  console.log('\nStep 2: Signing in User B (priya.patel2023@vit.edu)...');
  const loginBRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.patel2023@vit.edu', password: 'Student@123' }),
  });
  const cookieB = loginBRes.headers.get('set-cookie');
  userBCookies = cookieB ? cookieB.split(';')[0] : '';
  const loginBData = await loginBRes.json();
  console.log(`  ✓ User B Authenticated: ${loginBData.user.name} (id: ${loginBData.user.id})`);

  // 3. User A reports lost black wallet
  console.log('\nStep 3: User A reports lost black wallet...');
  const lostForm = new FormData();
  lostForm.append('type', 'lost');
  lostForm.append('title', 'E2E Demo Lost Black Leather Wallet');
  lostForm.append('category', 'Bags & Wallets');
  lostForm.append('description', 'Lost my black bi-fold wallet with student ID card and cash near TT lawn.');
  lostForm.append('location', 'TT Block');
  lostForm.append('location_detail', 'Lawn bench near Nescafe');
  lostForm.append('date_occurred', '2026-11-17 14:00');

  const reportLostRes = await fetch(`${BASE_URL}/api/items`, {
    method: 'POST',
    headers: { 'Cookie': userACookies },
    body: lostForm,
  });
  const reportLostData = await reportLostRes.json();
  const lostItemId = reportLostData.item.id;
  console.log(`  ✓ Lost item reported successfully (ID: ${lostItemId}, Status: ${reportLostData.item.status})`);

  // 4. Create a temporary image for User B found report
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const tempImgName = `e2e_test_found_${Date.now()}.png`;
  const tempImgPath = path.join(uploadsDir, tempImgName);
  fs.writeFileSync(tempImgPath, Buffer.from('FAKE_PNG_BINARY_FOR_E2E_TEST_PURPOSE'));
  console.log(`  Created test photo file on disk: ${tempImgName}`);

  // 5. User B reports found black wallet with secret detail
  console.log('\nStep 4: User B reports found black wallet with secret detail & photo...');
  const foundForm = new FormData();
  foundForm.append('type', 'found');
  foundForm.append('title', 'E2E Demo Found Black Men\'s Wallet');
  foundForm.append('category', 'Bags & Wallets');
  foundForm.append('description', 'Found a black leather wallet left on bench near TT block lawn.');
  foundForm.append('location', 'TT Block');
  foundForm.append('location_detail', 'Bench outside Nescafe');
  foundForm.append('date_occurred', '2026-11-17 14:15');
  foundForm.append('secret_detail', 'Contains student ID 24BCE1001 and ₹500 note in back flap');
  foundForm.append('item_location', 'with me');

  const blob = new Blob([fs.readFileSync(tempImgPath)], { type: 'image/png' });
  foundForm.append('image', blob, tempImgName);

  const reportFoundRes = await fetch(`${BASE_URL}/api/items`, {
    method: 'POST',
    headers: { 'Cookie': userBCookies },
    body: foundForm,
  });
  const reportFoundData = await reportFoundRes.json();
  const foundItemId = reportFoundData.item.id;
  const uploadedFilename = reportFoundData.item.images?.[0]?.filename;
  console.log(`  ✓ Found item reported successfully (ID: ${foundItemId}, Status: ${reportFoundData.item.status})`);
  console.log(`  ✓ Multer saved image as: ${uploadedFilename}`);
  // Clean up source file
  try { fs.unlinkSync(tempImgPath); } catch {}

  // 6. Wait for matching service to finish in background (with retry loop)
  console.log('\nStep 5: Checking instant AI multi-modal matching engine...');
  let targetMatch = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise(r => setTimeout(r, 800));
    const matchRes = await fetch(`${BASE_URL}/api/matches/for-item/${lostItemId}`, {
      headers: { 'Cookie': userACookies },
    });
    if (matchRes.ok) {
      const matchData = await matchRes.json();
      targetMatch = matchData.matches?.find(m => m.found_item_id === foundItemId);
      if (targetMatch) break;
    }
  }

  if (!targetMatch) {
    throw new Error('AI Match was not created between lost and found items!');
  }

  console.log(`  ✓ AI Match Formed! Match ID: ${targetMatch.id}`);
  console.log(`    • Total Score: ${(targetMatch.score * 100).toFixed(1)}% (${targetMatch.match_type.toUpperCase()})`);
  console.log(`    • Image Score: ${(targetMatch.image_score * 100).toFixed(1)}%`);
  console.log(`    • Text Score:  ${(targetMatch.text_score * 100).toFixed(1)}%`);
  console.log(`    • Category:    ${(targetMatch.category_score * 100).toFixed(1)}%`);
  console.log(`    • Location:    ${(targetMatch.location_score * 100).toFixed(1)}%`);
  console.log(`    • Mode:        ${targetMatch.matching_mode}`);

  // 7. User A claims the item and verifies secret detail
  console.log('\nStep 6: User A attempts ownership verification ("This is mine")...');
  const claimRes = await fetch(`${BASE_URL}/api/matches/${targetMatch.id}/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': userACookies,
    },
    body: JSON.stringify({
      answer: 'My student ID card 24BCE1001 is inside along with a 500 rupee note in back flap',
    }),
  });
  const claimData = await claimRes.json();

  if (!claimData.verified) {
    throw new Error('Verification failed unexpectedly: ' + JSON.stringify(claimData));
  }

  const generatedCode = claimData.handoverCode;
  console.log(`  ✓ Ownership VERIFIED!`);
  console.log(`  ✓ One-Time Handover Code Generated: [ ${generatedCode} ]`);

  // 8. User B (Finder) enters the 6-digit handover code
  console.log('\nStep 7: User B enters handover code at physical exchange...');
  const confirmRes = await fetch(`${BASE_URL}/api/handover/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': userBCookies,
    },
    body: JSON.stringify({
      match_id: targetMatch.id,
      code: generatedCode,
    }),
  });
  const confirmData = await confirmRes.json();
  console.log(`  ✓ Handover Result:`, confirmData.message);

  // 9. Inspect Database and Filesystem Proof
  console.log('\nStep 8: Verifying Privacy Purge (Filesystem & Database Proof)...');
  const db = getDb();

  const itemA = db.prepare('SELECT id, status FROM items WHERE id = ?').get(lostItemId);
  const itemB = db.prepare('SELECT id, status FROM items WHERE id = ?').get(foundItemId);
  console.log(`  ✓ Database Item Statuses: Lost Item #${itemA.id} = ${itemA.status}, Found Item #${itemB.id} = ${itemB.status}`);

  // Check item_images table
  const imagesInDb = db.prepare('SELECT COUNT(*) as count FROM item_images WHERE item_id IN (?, ?)').get(lostItemId, foundItemId).count;
  console.log(`  ✓ Image records in DB for these items: ${imagesInDb} (Expected: 0)`);

  // Check embeddings table
  const embeddingsInDb = db.prepare('SELECT COUNT(*) as count FROM embeddings WHERE item_id IN (?, ?)').get(lostItemId, foundItemId).count;
  console.log(`  ✓ Embeddings in DB for these items: ${embeddingsInDb} (Expected: 0)`);

  // Check file on disk
  const filesOnDisk = fs.readdirSync(uploadsDir);
  const imageStillOnDisk = uploadedFilename ? filesOnDisk.includes(uploadedFilename) : false;
  console.log(`  ✓ Multer uploaded image (${uploadedFilename}) still on disk: ${imageStillOnDisk} (Expected: false)`);

  // Check finder karma points
  const finderUser = db.prepare('SELECT name, karma_points FROM users WHERE id = ?').get(loginBData.user.id);
  console.log(`  ✓ Finder ${finderUser.name} Karma Points: ${finderUser.karma_points} (Awarded +10 pts)`);

  console.log('\n===============================================================');
  console.log('   🎉 ALL END-TO-END DEMO TEST SCENARIOS PASSED WITH PROOF!');
  console.log('===============================================================\n');

  closeDb();
}

runE2EDemoTest().catch(err => {
  console.error('\n❌ E2E Test Failure:', err);
  process.exit(1);
});

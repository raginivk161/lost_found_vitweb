const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const config = require('../src/config/matching');
const {
  computeKeywordSimilarity,
  computeCategoryScore,
  computeLocationScore,
  computeTimeScore,
} = require('../src/services/matching');

async function runMatchTests() {
  console.log('\n======================================================');
  console.log('       VIT Lost & Found - AI Match Test Suite');
  console.log('======================================================\n');

  const testPairs = [
    {
      name: 'Pair 1: High Match (Black leather wallet)',
      lost: {
        title: 'Lost Black Leather Wallet',
        description: 'Lost my black Tommy Hilfiger leather wallet with VIT student ID card and bus pass near TT Food Court.',
        category: 'Bags & Wallets',
        location: 'TT Block',
        date: '2026-11-15',
      },
      found: {
        title: 'Found Men\'s Black Wallet',
        description: 'Found a black leather wallet on a bench near TT Block lawn with some cash and cards.',
        category: 'Bags & Wallets',
        location: 'TT Block',
        date: '2026-11-15',
      },
      expected: 'HIGH (>= 0.70)',
    },
    {
      name: 'Pair 2: High Match (Blue Umbrella in SJT)',
      lost: {
        title: 'Lost Navy Blue Foldable Umbrella',
        description: 'Left my compact navy blue automatic umbrella in SJT 412 during evening class.',
        category: 'Umbrellas',
        location: 'SJT',
        date: '2026-11-16',
      },
      found: {
        title: 'Found Blue Umbrella in SJT 4th Floor',
        description: 'Found blue folding umbrella left behind in SJT classroom 412 on desk.',
        category: 'Umbrellas',
        location: 'SJT',
        date: '2026-11-16',
      },
      expected: 'HIGH (>= 0.70)',
    },
    {
      name: 'Pair 3: Moderate Match (Boat Earbuds / Headphones)',
      lost: {
        title: 'Lost Boat Airdopes Case',
        description: 'Lost white Boat Airdopes charging case with left earbud near Central Library staircase.',
        category: 'Headphones & Earbuds',
        location: 'Library',
        date: '2026-11-14',
      },
      found: {
        title: 'Found White Earbuds Case',
        description: 'Found white bluetooth earbuds charging case near Main Building entrance.',
        category: 'Electronics', // related category
        location: 'Main Building', // nearby location
        date: '2026-11-15',
      },
      expected: 'MODERATE (0.50 - 0.69)',
    },
    {
      name: 'Pair 4: Low Match (Water Bottle vs Laptop Charger)',
      lost: {
        title: 'Lost Milton Stainless Steel Water Bottle',
        description: 'Silver 1L insulated water bottle with red cap forgotten at SJT ground floor water cooler.',
        category: 'Water Bottles & Containers',
        location: 'SJT',
        date: '2026-11-10',
      },
      found: {
        title: 'Found HP Laptop 65W Charger',
        description: 'Found black HP laptop power adapter plugged in near SJT 2nd floor lab.',
        category: 'Chargers & Cables',
        location: 'SJT',
        date: '2026-11-16',
      },
      expected: 'LOW (< 0.50)',
    },
    {
      name: 'Pair 5: Zero/Low Match (Calculator vs Raincoat in different blocks)',
      lost: {
        title: 'Lost Casio Scientific Calculator fx-991EX',
        description: 'Black Casio scientific calculator with sticker on back, left in SMV exam hall.',
        category: 'Electronics',
        location: 'SMV',
        date: '2026-11-01',
      },
      found: {
        title: 'Found Yellow Raincoat',
        description: 'Found yellow waterproof raincoat hanging in Mens Hostel D Annex laundry area.',
        category: 'Clothing',
        location: 'Mens Hostel',
        date: '2026-11-16',
      },
      expected: 'LOW (< 0.50)',
    },
  ];

  for (const pair of testPairs) {
    console.log(`\n▶ ${pair.name}`);
    console.log(`  Lost:  "${pair.lost.title}" (${pair.lost.category} @ ${pair.lost.location})`);
    console.log(`  Found: "${pair.found.title}" (${pair.found.category} @ ${pair.found.location})`);

    const textSim = computeKeywordSimilarity(
      `${pair.lost.title} ${pair.lost.description}`,
      `${pair.found.title} ${pair.found.description}`,
      pair.lost.title,
      pair.found.title
    );
    const catSim = computeCategoryScore(pair.lost.category, pair.found.category);
    const locSim = computeLocationScore(pair.lost.location, pair.found.location);
    const timeSim = computeTimeScore(pair.lost.date, pair.found.date);

    // Using text redistributed weights (no image available in cli script)
    const w = config.noImageWeights;
    const finalScore = (
      w.text * textSim +
      w.category * catSim +
      w.location * locSim +
      w.time * timeSim
    );

    const matchCategory =
      finalScore >= config.thresholds.strong
        ? 'STRONG MATCH (>= 0.70)'
        : finalScore >= config.thresholds.possible
        ? 'POSSIBLE MATCH (0.50 - 0.69)'
        : 'NO MATCH (< 0.50)';

    console.log('  --- Breakdown ---');
    console.log(`  • Text Sim:     ${(textSim * 100).toFixed(1)}% (weight: ${w.text})`);
    console.log(`  • Category Sim: ${(catSim * 100).toFixed(1)}% (weight: ${w.category})`);
    console.log(`  • Location Sim: ${(locSim * 100).toFixed(1)}% (weight: ${w.location})`);
    console.log(`  • Time Sim:     ${(timeSim * 100).toFixed(1)}% (weight: ${w.time})`);
    console.log(`  -> Final Score: ${(finalScore * 100).toFixed(1)}% [${matchCategory}]`);
    console.log(`  -> Expected:    ${pair.expected}`);
  }

  console.log('\n======================================================');
  console.log('   All 5 test pairs evaluated against match algorithm.');
  console.log('======================================================\n');
}

runMatchTests().catch(console.error);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { prepareModel } = require('../src/services/matching');

async function main() {
  console.log('=== VIT Lost & Found: Prepare CLIP Model ===');
  console.log('Checking/downloading CLIP model weights for offline inference...');
  const success = await prepareModel();
  if (success) {
    console.log('Model prepared successfully! You can run matching offline.');
  } else {
    console.log('Using basic TF-IDF matching mode fallback.');
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Model prep error:', err);
  process.exit(0);
});

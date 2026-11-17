const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/database');
const config = require('../config/matching');

let transformers = null;
let tokenizer = null;
let textModel = null;
let processor = null;
let visionModel = null;
let rawImageClass = null;
let modelLoading = false;
let modelError = null;
let modelErrorTime = null;
const MODEL_RETRY_MS = 60 * 1000; // retry after 1 minute if load failed

// Initialize or get CLIP transformers models
async function getPipelines() {
  if (tokenizer && textModel && processor && visionModel) {
    return { tokenizer, textModel, processor, visionModel, rawImageClass };
  }
  // If errored, allow retry after MODEL_RETRY_MS (server restart mid-load, etc.)
  if (modelError) {
    const elapsed = Date.now() - (modelErrorTime || 0);
    if (elapsed < MODEL_RETRY_MS) return null;
    // Reset for retry
    console.log('[AI Matching] Retrying CLIP model load after previous failure...');
    modelError = null;
    modelErrorTime = null;
    tokenizer = null; textModel = null; processor = null; visionModel = null;
  }
  if (modelLoading) {
    while (modelLoading) {
      await new Promise(r => setTimeout(r, 200));
    }
    if (tokenizer && textModel) return { tokenizer, textModel, processor, visionModel, rawImageClass };
    return null;
  }

  modelLoading = true;
  try {
    const mod = await import('@xenova/transformers');
    transformers = mod.default || mod;
    transformers.env.cacheDir = path.join(__dirname, '..', '..', 'models');
    transformers.env.allowLocalModels = true;

    console.log(`[AI Matching] Loading CLIP models (${config.clipModel})...`);
    tokenizer = await transformers.AutoTokenizer.from_pretrained(config.clipModel);
    textModel = await transformers.CLIPTextModelWithProjection.from_pretrained(config.clipModel);
    processor = await transformers.AutoProcessor.from_pretrained(config.clipModel);
    visionModel = await transformers.CLIPVisionModelWithProjection.from_pretrained(config.clipModel);
    rawImageClass = transformers.RawImage;

    console.log('[AI Matching] CLIP text & vision neural models ready for inference.');
    modelLoading = false;
    return { tokenizer, textModel, processor, visionModel, rawImageClass };
  } catch (err) {
    modelError = err;
    modelErrorTime = Date.now();
    modelLoading = false;
    console.warn('[AI Matching] Notice: CLIP model not available. Using robust TF-IDF fallback matching mode.', err.message);
    return null;
  }
}

// Convert Float32Array to Buffer for SQLite storage
function float32ArrayToBuffer(f32) {
  if (!f32) return null;
  return Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength);
}

// Convert Buffer from SQLite back to Float32Array
function bufferToFloat32Array(buf) {
  if (!buf) return null;
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / Float32Array.BYTES_PER_ELEMENT);
}

// Cosine similarity between two float arrays (normalized to 0..1)
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const rawCos = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  // Normalize from [-1, 1] to [0, 1]
  const normalized = (rawCos + 1) / 2;
  return Math.max(0, Math.min(1, normalized));
}

// Basic TF-IDF and keyword similarity fallback
function computeKeywordSimilarity(textA, textB, titleA = '', titleB = '') {
  if (!textA || !textB) return 0;

  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from',
    'of', 'is', 'it', 'my', 'me', 'i', 'was', 'has', 'have', 'had', 'this', 'that',
    'lost', 'found', 'near', 'some', 'left', 'behind', 'after', 'during', 'please'
  ]);

  const tokenize = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stopWords.has(w));
  };

  const getOverlap = (tokensA, tokensB) => {
    if (tokensA.length === 0 || tokensB.length === 0) return 0;
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    let matchCount = 0;
    for (const w of setA) {
      if (setB.has(w)) {
        matchCount += 1.0;
      } else {
        for (const target of setB) {
          if ((w.length >= 4 && target.startsWith(w.slice(0, 4))) ||
              (target.length >= 4 && w.startsWith(target.slice(0, 4)))) {
            matchCount += 0.85;
            break;
          }
        }
      }
    }
    const minLen = Math.min(setA.size, setB.size);
    const overlapRatio = minLen > 0 ? matchCount / minLen : 0;
    const unionCount = setA.size + setB.size - matchCount;
    const jaccard = unionCount > 0 ? matchCount / unionCount : 0;
    return (overlapRatio * 0.7) + (jaccard * 0.3);
  };

  const generalScore = getOverlap(tokenize(textA), tokenize(textB));

  if (titleA && titleB) {
    const titleScore = getOverlap(tokenize(titleA), tokenize(titleB));
    return Math.min(1, (titleScore * 0.6) + (generalScore * 0.4));
  }

  return generalScore;
}

// Compute category similarity
function computeCategoryScore(catA, catB) {
  if (!catA || !catB) return 0;
  if (catA.toLowerCase() === catB.toLowerCase()) return 1.0;

  const related = config.categoryRelations[catA] || [];
  if (related.some(r => r.toLowerCase() === catB.toLowerCase())) {
    return 0.5;
  }
  return 0.0;
}

// Compute location similarity
function computeLocationScore(locA, locB) {
  if (!locA || !locB) return 0.2;
  if (locA.toLowerCase() === locB.toLowerCase()) return 1.0;

  const nearby = config.locationGroups[locA] || [];
  if (nearby.some(n => n.toLowerCase() === locB.toLowerCase())) {
    return 0.6;
  }
  return 0.2;
}

// Compute time decay score
function computeTimeScore(lostDateStr, foundDateStr) {
  if (!lostDateStr || !foundDateStr) return 0.5;
  const lostDate = new Date(lostDateStr);
  const foundDate = new Date(foundDateStr);

  const diffMs = foundDate.getTime() - lostDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Found before lost: might be misreported dates
  if (diffDays < 0) {
    if (Math.abs(diffDays) <= 1) return 0.6; // same/next day discrepancy
    return 0.2;
  }

  // Found on or after lost date: decay with gap
  const decay = diffDays * (config.timeDecayRate || 0.05);
  return Math.max(0, 1 - decay);
}

// Generate text embedding using CLIP
async function generateTextEmbedding(text) {
  const models = await getPipelines();
  if (!models) return null;
  try {
    const textInputs = models.tokenizer([text], { padding: true, truncation: true });
    const { text_embeds } = await models.textModel(textInputs);
    return new Float32Array(text_embeds.data);
  } catch (err) {
    console.warn('Text embedding failed:', err.message);
    return null;
  }
}

// Generate image embedding using CLIP
async function generateImageEmbedding(imagePath) {
  const models = await getPipelines();
  if (!models || !fs.existsSync(imagePath)) return null;
  try {
    // If SVG or standard image, read via RawImage if supported
    const image = await models.rawImageClass.read(imagePath);
    const imageInputs = await models.processor(image);
    const { image_embeds } = await models.visionModel(imageInputs);
    return new Float32Array(image_embeds.data);
  } catch (err) {
    console.warn('Image embedding failed:', err.message);
    return null;
  }
}

// Get or create embeddings for an item
async function getItemEmbeddings(itemId, db) {
  const cached = db.prepare('SELECT image_embedding, text_embedding FROM embeddings WHERE item_id = ?').get(itemId);
  if (cached && (cached.text_embedding || cached.image_embedding)) {
    return {
      textEmbedding: bufferToFloat32Array(cached.text_embedding),
      imageEmbedding: bufferToFloat32Array(cached.image_embedding),
    };
  }

  const item = db.prepare('SELECT title, description, category FROM items WHERE id = ?').get(itemId);
  if (!item) return { textEmbedding: null, imageEmbedding: null };

  const imageRecord = db.prepare('SELECT path, filename FROM item_images WHERE item_id = ? LIMIT 1').get(itemId);
  const fullText = `${item.title}. ${item.description}. Category: ${item.category}`;

  let textF32 = await generateTextEmbedding(fullText);
  let imageF32 = null;

  if (imageRecord) {
    const imagePath = imageRecord.path || path.join(__dirname, '..', '..', 'uploads', imageRecord.filename);
    imageF32 = await generateImageEmbedding(imagePath);
  }

  const textBuf = float32ArrayToBuffer(textF32);
  const imageBuf = float32ArrayToBuffer(imageF32);

  if (textBuf || imageBuf) {
    db.prepare(`
      INSERT INTO embeddings (item_id, image_embedding, text_embedding)
      VALUES (?, ?, ?)
      ON CONFLICT(item_id) DO UPDATE SET
        image_embedding = excluded.image_embedding,
        text_embedding = excluded.text_embedding
    `).run(itemId, imageBuf, textBuf);
  }

  return { textEmbedding: textF32, imageEmbedding: imageF32 };
}

// Main matching trigger: run immediately after every new report against open opposite reports
async function findMatches(itemId) {
  const db = getDb();
  const currentItem = db.prepare(`
    SELECT i.*, img.filename as image_filename, img.path as image_path
    FROM items i
    LEFT JOIN item_images img ON img.item_id = i.id
    WHERE i.id = ?
  `).get(itemId);

  if (!currentItem || currentItem.status !== 'open') {
    return [];
  }

  const oppositeType = currentItem.type === 'lost' ? 'found' : 'lost';
  const candidates = db.prepare(`
    SELECT i.*, img.filename as image_filename, img.path as image_path
    FROM items i
    LEFT JOIN item_images img ON img.item_id = i.id
    WHERE i.type = ? AND i.status IN ('open', 'matched') AND i.user_id != ?
  `).all(oppositeType, currentItem.user_id);

  if (candidates.length === 0) {
    return [];
  }

  // Pre-fetch or generate current item embeddings
  const currentEmbeddings = await getItemEmbeddings(currentItem.id, db);
  const hasAIPipelines = (await getPipelines()) !== null;
  const createdMatches = [];

  for (const candidate of candidates) {
    const lostItem = currentItem.type === 'lost' ? currentItem : candidate;
    const foundItem = currentItem.type === 'found' ? currentItem : candidate;

    // Check if match already exists
    const existing = db.prepare(`
      SELECT id FROM matches 
      WHERE lost_item_id = ? AND found_item_id = ?
    `).get(lostItem.id, foundItem.id);
    if (existing) continue;

    let imageScore = 0;
    let textScore = 0;
    let matchingMode = 'ai';

    const candidateEmbeddings = await getItemEmbeddings(candidate.id, db);

    const hasLostImage = Boolean(lostItem.image_filename);
    const hasFoundImage = Boolean(foundItem.image_filename);

    if (hasAIPipelines && (currentEmbeddings.textEmbedding || candidateEmbeddings.textEmbedding)) {
      // AI matching with CLIP embeddings
      if (currentEmbeddings.textEmbedding && candidateEmbeddings.textEmbedding) {
        textScore = cosineSimilarity(currentEmbeddings.textEmbedding, candidateEmbeddings.textEmbedding);
      }

      if (hasLostImage && hasFoundImage && currentEmbeddings.imageEmbedding && candidateEmbeddings.imageEmbedding) {
        const lostEmb = currentItem.type === 'lost' ? currentEmbeddings.imageEmbedding : candidateEmbeddings.imageEmbedding;
        const foundEmb = currentItem.type === 'found' ? currentEmbeddings.imageEmbedding : candidateEmbeddings.imageEmbedding;
        imageScore = cosineSimilarity(lostEmb, foundEmb);
      } else if (hasFoundImage && candidateEmbeddings.imageEmbedding && currentEmbeddings.textEmbedding) {
        // Image-to-text cross modal
        imageScore = textScore;
      } else {
        imageScore = 0;
      }
    } else {
      // Basic / Fallback TF-IDF mode
      matchingMode = 'basic';
      const textA = `${lostItem.title} ${lostItem.description}`;
      const textB = `${foundItem.title} ${foundItem.description}`;
      textScore = computeKeywordSimilarity(textA, textB, lostItem.title, foundItem.title);
      imageScore = 0;
    }

    const categoryScore = computeCategoryScore(lostItem.category, foundItem.category);
    const locationScore = computeLocationScore(lostItem.location, foundItem.location);
    const timeScore = computeTimeScore(lostItem.date_occurred, foundItem.date_occurred);

    // Dynamic weighting: if lost item has no image, redistribute image weight to text
    let weightsToUse;
    if (!hasLostImage || imageScore === 0) {
      weightsToUse = config.noImageWeights;
    } else {
      weightsToUse = config.weights;
    }

    const totalScore = (
      (weightsToUse.image * imageScore) +
      (weightsToUse.text * textScore) +
      (weightsToUse.category * categoryScore) +
      (weightsToUse.location * locationScore) +
      (weightsToUse.time * timeScore)
    );

    const roundedScore = Math.round(totalScore * 100) / 100;

    // Threshold check (minimum 0.50)
    if (roundedScore >= config.thresholds.minimum) {
      const matchType = roundedScore >= config.thresholds.strong ? 'strong' : 'possible';

      const insertResult = db.prepare(`
        INSERT INTO matches (
          lost_item_id, found_item_id, score, match_type,
          image_score, text_score, category_score, location_score, time_score,
          matching_mode, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(
        lostItem.id, foundItem.id, roundedScore, matchType,
        Math.round(imageScore * 100) / 100,
        Math.round(textScore * 100) / 100,
        Math.round(categoryScore * 100) / 100,
        Math.round(locationScore * 100) / 100,
        Math.round(timeScore * 100) / 100,
        matchingMode
      );

      const matchId = insertResult.lastInsertRowid;

      // Update both items status to 'matched' if they were 'open'
      db.prepare("UPDATE items SET status = 'matched' WHERE id IN (?, ?) AND status = 'open'").run(lostItem.id, foundItem.id);

      // In-app notifications for both users
      const matchPct = Math.round(roundedScore * 100);
      const notifTitle = `New ${matchType === 'strong' ? 'Strong' : 'Potential'} Match (${matchPct}%)`;

      // Notify lost item owner
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (?, 'match_found', ?, ?, ?)
      `).run(
        lostItem.user_id,
        notifTitle,
        `Someone reported finding an item matching your "${lostItem.title}": "${foundItem.title}".`,
        JSON.stringify({ match_id: matchId, item_id: lostItem.id, score: roundedScore })
      );

      // Notify found item owner
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (?, 'match_found', ?, ?, ?)
      `).run(
        foundItem.user_id,
        notifTitle,
        `A reported lost item "${lostItem.title}" matches your found item "${foundItem.title}".`,
        JSON.stringify({ match_id: matchId, item_id: foundItem.id, score: roundedScore })
      );

      createdMatches.push({
        id: matchId,
        score: roundedScore,
        match_type: matchType,
        matching_mode: matchingMode,
      });
    }
  }

  return createdMatches;
}

// Prepare model for offline demo use
async function prepareModel() {
  console.log('[AI Matching] Pre-downloading CLIP model for offline demo readiness...');
  try {
    const pipelines = await getPipelines();
    if (pipelines) {
      console.log('✅ CLIP model downloaded and cached successfully in models directory.');
      return true;
    } else {
      console.log('⚠️ Notice: Model load failed, app will operate in robust basic matching mode.');
      return false;
    }
  } catch (err) {
    console.warn('⚠️ prepareModel warning:', err.message);
    return false;
  }
}

module.exports = {
  findMatches,
  prepareModel,
  cosineSimilarity,
  computeKeywordSimilarity,
  computeCategoryScore,
  computeLocationScore,
  computeTimeScore,
  generateTextEmbedding,
  generateImageEmbedding,
};

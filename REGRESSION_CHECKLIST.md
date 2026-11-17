# VIT Lost & Found - Regression Checklist

This checklist tracks all verified features, test cases, and quality gates for the VIT Lost & Found campus platform. Every item is verified before every release and commit.

---

## 1. Authentication & Access Control
- [x] **Email Domain Enforcement**: Server and client reject non-VIT domains (only `@vit.edu` accepted).
- [x] **Registration Validation**: Mandatory full name, valid registration number (e.g. `24BCE1001`), password min 8 characters.
- [x] **6-Digit Email OTP**: Generated on sign-up, hashed with bcrypt in SQLite `otps` table, 5-minute expiry.
- [x] **OTP Auto-Advance & Paste**: 6-box input auto-advances on typing, handles backspace, and supports 6-digit paste.
- [x] **OTP Cooldown & Rate Limiting**: 30-second cooldown on resend, max 5 attempts before invalidation.
- [x] **Dev Mode OTP Fallback**: When `DEV_MODE=true` and SMTP is unconfigured, OTP logs to console with banner in UI.
- [x] **Secure Session**: JWT stored in `httpOnly`, `sameSite: 'lax'` cookie.
- [x] **Role-Based Protection**: Admin routes (`/api/admin/*`, `/admin`) strictly restricted to `admin` role.

---

## 2. Item Reporting & Management
- [x] **Lost Report**: Title (min 3 chars), category dropdown, description (min 10 chars), VIT block selector + detail, date/time, optional image upload.
- [x] **Found Report**: Image upload is strictly mandatory. Secret detail is strictly mandatory. Location of item ("with me", "security desk", "block office") captured.
- [x] **Secret Detail Protection**: Finder's secret detail is never sent in public item queries; visible only to finder or admin.
- [x] **Drag & Drop Upload**: Supports JPG, PNG, WebP up to 5MB with instant preview and file validation.
- [x] **Item Deletion**: Deletes item row, cascade deletes matches, removes photo files from `/uploads` disk storage.

---

## 3. AI Multi-Modal Matching Engine
- [x] **Instant Trigger**: Matches automatically evaluated immediately upon report submission against all open opposite reports.
- [x] **CLIP Neural Embeddings**: Local offline inference via `@xenova/transformers` (`Xenova/clip-vit-base-patch32`) for 512-dim text & image vectors.
- [x] **Embedding DB Caching**: Embeddings stored as SQLite BLOBs to eliminate re-computation overhead.
- [x] **Weighted Scoring Formula**:
  - Image Cosine Similarity: `45%`
  - Description Text Semantics: `25%`
  - Category Correlation: `15%`
  - Campus Location Proximity: `10%`
  - Temporal Closeness Decay: `5%`
- [x] **Zero-Image Weight Shift**: If no image is provided, image weight shifts to text (`70% text`).
- [x] **Match Thresholds**: `>= 0.70` Strong Match, `0.50 - 0.69` Possible Match, `< 0.50` Hidden.
- [x] **Explainable AI Breakdown**: Every match stores and displays visual breakdown bars for all 5 signals.
- [x] **Offline Pre-Download**: `npm run prepare-model` pre-caches the model for offline presentation environments.
- [x] **Robust Fallback Mode**: Graceful degradation to enhanced TF-IDF keyword overlap if model is unavailable without crashing.
- [x] **Notification Trigger**: Unread notifications created for both users upon match creation.

---

## 4. Ownership Verification & Handover
- [x] **Secret Prompt**: Owner answers "Describe a unique mark or detail"; finder's secret is never exposed.
- [x] **Fuzzy & Semantic Match**: Evaluates overlap against secret detail.
- [x] **Anti-Bruteforce Lock**: Maximum 3 verification attempts; locks claim and notifies admin on 3rd failure.
- [x] **One-Time Handover Code**: On successful verification, generates 6-digit random code shown exclusively to owner.
- [x] **Contact Unlocking**: Owner and finder phone & email become visible only after verified claim.
- [x] **Handover Completion**: Finder inputs 6-digit code. Status transitions to `RETURNED`.
- [x] **Karma Points Award**: Finder receives 10 campus karma points.
- [x] **Privacy Wipe**: Photo files unlinked from `/uploads` disk, image records deleted from DB, embeddings cleared.

---

## 5. UI/UX Design System
- [x] **VIT Palette**: Navy `#0F1B4C`, Primary `#2F5BEA`, Lost Amber `#F59E0B`, Found Green `#10B981`.
- [x] **Responsive Layout**: Desktop sidebar navigation, mobile sticky bottom navigation.
- [x] **Admin Database Viewer**: Accessible at `/admin` for live presentation inspection of SQLite tables (`users`, `items`, `matches`, `verifications`, `handovers`, `images`).
- [x] **Dead Link Audit**: Zero dead links, zero unhandled promises, clean browser console.

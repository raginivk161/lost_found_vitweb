# 🎓 VIT Lost & Found - Campus AI Recovery Platform

> A production-quality, demo-ready web application for Vellore Institute of Technology (VIT) students, faculty, and campus security. Built for the **Design Thinking & Product Lifecycle Management** course.

---

## 🚀 Key Highlights & Architectural Pillars

1. **Local CLIP Multi-Modal AI (Zero Cloud API Costs)**: Runs `Xenova/clip-vit-base-patch32` locally using ONNX runtime in Node.js. Generates 512-dimensional vector embeddings for both photographs and descriptive text without paying external API fees.
2. **Explainable AI (XAI)**: Every match surfaces transparent percentage bars across 5 signals (Image Similarity, Text Semantics, Category Correlation, Campus Location Proximity, and Temporal Closeness).
3. **Fraud-Proof Secret Detail Verification**: Finders record a hidden detail (e.g. serial number, specific cash note, back sticker) that is never revealed to claimants. Claimants must provide matching descriptions.
4. **Digital One-Time Handover Code**: A 6-digit one-time code is generated upon successful verification, ensuring handovers cannot be forged.
5. **Zero-Trace Privacy Lifecycle**: Photos and neural embeddings are permanently deleted from disk and database as soon as an item is marked `RETURNED` or when an account is deleted.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React icons, React Router v7.
- **Backend**: Node.js v22 LTS, Express, Multer, Cookie-Parser, CORS, Express-Rate-Limit.
- **Database**: SQLite via `better-sqlite3` (single inspectable `.db` file in `server/data/lostfound.db`).
- **AI Neural Inference**: `@xenova/transformers` (local quantized CLIP model).
- **Authentication**: Bcrypt password hashing + JWT in `httpOnly` secure cookie + 6-digit Email OTP via Nodemailer SMTP.

---

## ⚡ Quickstart & Running the App

### 1. Prerequisites
- **OS**: Windows (PowerShell) or macOS / Linux.
- **Node.js**: Node.js v20+ or v22 LTS (installed at `C:\NodeLTS` or on system PATH).

### 2. Installation & Setup
Run the following commands in order from the repository root (`C:\lostfoundweb`):

```powershell
# 1. Install dependencies for root, server, and client
npm install
cd server && npm install
cd ../client && npm install
cd ..

# 2. Pre-download the local CLIP neural model for offline demo readiness
npm run prepare-model

# 3. Seed demo accounts, realistic VIT items, sample images, and initial AI matches
npm run seed

# 4. Start both backend (port 3001) and frontend (port 5173) concurrently
npm run dev
```

Once started:
- **Frontend App**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Backend API**: Running at [http://localhost:3001](http://localhost:3001).

---

## 👥 Seeded Demo Accounts

The `npm run seed` command provisions realistic accounts for quick testing:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@vit.edu` | `Admin@123` | Campus Security Admin (Access to `/admin`) |
| **Student 1** | `aarav.sharma2024@vit.edu` | `Student@123` | Aarav Sharma (24BCE1001) |
| **Student 2** | `priya.patel2023@vit.edu` | `Student@123` | Priya Patel (23BCE2045) |
| **Student 3** | `rohan.kumar2024@vit.edu` | `Student@123` | Rohan Kumar (24MIS0089) |

---

## 🔍 How to Inspect the Database During the Demo

### Option A: Built-in Live Web Inspector (`/admin`)
1. Sign in as `admin@vit.edu` (`Admin@123`).
2. Navigate to [http://localhost:5173/admin](http://localhost:5173/admin).
3. Switch between real-time tabs:
   - `items`: View all reports, statuses, and locations.
   - `matches`: Inspect neural similarity scores and matching modes.
   - `users`: View user karma points and registration numbers.
   - `verifications`: See claim attempts and similarity calculations.
   - `handovers`: Check 6-digit codes and timestamps.
   - `images`: Monitor uploaded file paths and sizes.

### Option B: DB Browser for SQLite (Desktop App)
1. Download [DB Browser for SQLite](https://sqlitebrowser.org/).
2. Click **Open Database** and select:
   ```
   C:\lostfoundweb\server\data\lostfound.db
   ```
3. You can execute SQL queries or browse any of the 9 tables directly:
   - `users`, `otps`, `items`, `item_images`, `embeddings`, `matches`, `verifications`, `notifications`, `handovers`.

---

## 🧠 AI Matching Algorithm Specification

### Signal Normalization (0.0 to 1.0)
The matching engine evaluates 5 discrete dimensions:

1. **Image Similarity ($S_{image}$)**: Cosine similarity of 512-dim CLIP image embeddings:
   $$\text{cosine\_sim}(\vec{u}, \vec{v}) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}$$
2. **Text Semantics ($S_{text}$)**: Cosine similarity of CLIP text embeddings of Title + Description.
3. **Category Correlation ($S_{category}$)**:
   - Exact category match: `1.0`
   - Related category (e.g. *Electronics* vs *Chargers & Cables*): `0.5`
   - Unrelated: `0.0`
4. **Campus Location Proximity ($S_{location}$)**:
   - Same campus block (e.g. *SJT* to *SJT*): `1.0`
   - Adjacent block cluster (e.g. *TT Block* to *AB-1*): `0.6`
   - Distinct block: `0.2`
5. **Temporal Closeness ($S_{time}$)**: Decays with the gap in days:
   $$S_{time} = \max(0, 1 - \Delta\text{days} \times 0.05)$$

### Weighted Scoring Formula
$$\text{Score} = 0.45 \cdot S_{image} + 0.25 \cdot S_{text} + 0.15 \cdot S_{category} + 0.10 \cdot S_{location} + 0.05 \cdot S_{time}$$

*Dynamic Redistribution*: If a lost item has no photograph, the image weight shifts to text:
$$\text{Score}_{\text{no image}} = 0.70 \cdot S_{text} + 0.15 \cdot S_{category} + 0.10 \cdot S_{location} + 0.05 \cdot S_{time}$$

### Thresholds
- **Strong Match**: $\ge 0.70$
- **Possible Match**: $0.50 \le \text{Score} < 0.70$
- **Suppressed / Hidden**: $< 0.50$

---

## 🔒 Privacy & Image Deletion Lifecycle

- **On Return**: Once the finder enters the 6-digit handover code, both items transition to `RETURNED`. The backend unlinks and deletes the image files from `server/uploads/` and clears the corresponding rows in `item_images` and `embeddings`.
- **On Account Deletion**: If a student deletes their account, all their uploaded images and reports are unlinked from disk.
- **30-Day Cleanup Script**: Run `node server/scripts/cleanup-job.js` to purge image files for records closed or returned $> 30$ days ago.

---

## ⚙️ Environment Variables Reference (`.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `3001` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `JWT_SECRET` | Secret key for signing auth tokens | *(Auto-generated string)* |
| `ALLOWED_EMAIL_DOMAINS`| Domains accepted for registration | `vit.edu` |
| `DEV_MODE` | Logs OTP to terminal if SMTP is unconfigured | `true` |
| `ADMIN_EMAIL` | Seeded admin email address | `admin@vit.edu` |
| `ADMIN_PASSWORD` | Seeded admin login password | `Admin@123` |
| `SMTP_HOST` | Gmail / SMTP mail server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | *(Optional in dev mode)* |
| `SMTP_PASS` | SMTP application password | *(Optional in dev mode)* |

---

## 🧪 Verification & Testing Commands

```powershell
# Run matching test suite on 5 benchmark pairs
npm run test:match

# Pre-download CLIP neural model
npm run prepare-model

# Re-seed database with realistic demo records
npm run seed

# Run 30-day image cleanup maintenance
node server/scripts/cleanup-job.js
```

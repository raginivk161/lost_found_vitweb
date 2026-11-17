# VIT Lost & Found - 5-Minute Demo Presentation Script

This script provides an exact 5-minute walkthrough of **VIT Lost & Found** tailored for a **Design Thinking & Product Lifecycle Management** demo.

---

## 🎯 Pre-Demo Setup (Do this before opening the browser)
1. Ensure the app is running:
   ```powershell
   npm run seed
   npm run dev
   ```
2. Open your browser to `http://localhost:5173`.
3. Open a second incognito window or alternate browser for multi-user handover testing.

---

## 👥 Demo Accounts Cheatsheet

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin (Security)** | `admin@vit.edu` | `Admin@123` | Security Desk Administrator |
| **Student 1 (Owner)** | `aarav.sharma2024@vit.edu` | `Student@123` | Aarav Sharma (24BCE1001, TT Block) |
| **Student 2 (Finder)** | `priya.patel2023@vit.edu` | `Student@123` | Priya Patel (23BCE2045, TT Block) |
| **Student 3 (Student)**| `rohan.kumar2024@vit.edu` | `Student@123` | Rohan Kumar (24MIS0089, SJT) |

---

## ⏱️ Minute-by-Minute Walkthrough

### Minute 0:00 - 1:00 | Problem Statement & Splash Page
- **Screen:** `http://localhost:5173` (Splash Page)
- **Talking Points:**
  - *"Across 30,000 students at VIT, WhatsApp groups and Instagram pages are inundated with lost ID cards, calculators, and wallets. Items are either never recovered, or claimed fraudulently."*
  - Show the clean SaaS landing page with the slogan: **"Lose it. Report it. AI finds it."**
  - Highlight the 3 core pillars:
    1. **Instant CLIP Multimodal AI Matching** (runs 100% locally on campus servers, no API costs).
    2. **Secret Detail Verification** (prevents fraud without exposing sensitive identifiers).
    3. **Privacy-Preserving Handover** (images and embeddings wiped upon return).

---

### Minute 1:00 - 2:00 | Student Experience: Reporting & AI Matching
- **Action:** Click **"Get Started"** or go to `http://localhost:5173/login`.
- **Sign in as Aarav:**
  - Email: `aarav.sharma2024@vit.edu`
  - Password: `Student@123`
- **Dashboard Overview:**
  - Note the personalized greeting, karma score (20 pts), quick actions, and open items.
- **Reporting an Item:**
  - Click **"Report Lost Item"**.
  - Fill out:
    - **Title:** `Black Tommy Hilfiger Leather Wallet`
    - **Category:** `Bags & Wallets`
    - **Location:** `TT Block` (Spot: *Lawn bench near Nescafe*)
    - **Description:** `Black bi-fold leather wallet with student ID and cash.`
  - Click **"Submit Report & Run AI Match"**.
- **The Magic Moment:**
  - The app submits the item and **instantly displays a Strong Match (85%+)** with Priya's found wallet!
  - Point out the **"Why This Matched"** explainability bars:
    - Image Neural Score: ~85%
    - Description Semantics: ~80%
    - Category Correlation: 100%
    - Campus Location: 100% (both at TT Block)
    - Temporal Closeness: 100%

---

### Minute 2:00 - 3:15 | Fraud Prevention: Secret Detail Verification
- **Screen:** Match Detail Screen (`/matches/:id`)
- **Action as Aarav (Owner):**
  - Click **"Review & Verify"**.
  - Note: Priya's contact info is **hidden/locked** to protect both students from unsolicited contact.
  - Notice the prompt: *"Describe a unique mark, serial, or detail only you would know"*.
  - Explain: *"Priya entered a secret when reporting the wallet. Aarav does NOT know what Priya typed."*
- **Verify Ownership:**
  - Aarav enters: `24BCE1001 ID card and folded 500 rupee note inside back compartment`
  - Click **"Submit Claim Verification"**.
  - **Success!** The screen updates to:
    - **One-Time Handover Code:** e.g., `482915` (highlight this code!).
    - Priya's email and phone are now unlocked for meeting coordination.

---

### Minute 3:15 - 4:15 | Digital Handover & Automatic Privacy Purge
- **Action:** Open Incognito Window or log out and log in as **Priya Patel** (`priya.patel2023@vit.edu` / `Student@123`).
- **Priya's Perspective:**
  - Go to **My Reports -> AI Matches** and open the matched wallet report.
  - Priya sees: *"Ownership Verified Successfully by Aarav Sharma"*.
  - Step 2 appears: **"Enter 6-Digit Handover Code"**.
  - Priya enters the code Aarav gave her: `482915` (or generated code).
  - Click **"Confirm Return"**.
- **Results:**
  - Celebration banner: **"Item Successfully Returned! 🎉"**
  - Priya's karma points increase by **+10 points**.
  - **The Privacy Guarantee:** Open `server/uploads/` in file explorer or show the admin database:
    - The photo files and neural embedding vectors for both items are **deleted immediately**.
    - Only a historical text record remains for campus statistics.

---

### Minute 4:15 - 5:00 | Admin Inspection & Architecture
- **Action:** Log in as **Admin** (`admin@vit.edu` / `Admin@123`) and open `/admin`.
- **Live Database Inspection:**
  - Show the live SQLite inspector tables:
    - `users`: See Aarav, Priya, and updated karma points.
    - `items`: Status is now `returned`.
    - `matches`: Score breakdown and verification record.
    - `handovers`: Status `completed` with timestamp.
    - `images`: Show that image records have been wiped.
- **Concluding Pitch:**
  - *"Zero cloud costs, 100% offline-ready CLIP intelligence, strict vit.edu authentication, and privacy compliance. VIT Lost & Found is production-ready for student rollout."*

# ContentPilot

AI-powered content creation & publishing cho Facebook + WordPress.

## Cấu trúc

```
content-pilot/
├── css/                        ← Design system
│   ├── variables.css           — Design tokens (colors, spacing)
│   ├── base.css                — Reset, typography
│   ├── layout.css              — App shell layout
│   └── components.css          — UI component styles
├── js/
│   ├── app.js                  — Entry point, init
│   ├── config.js               — Constants
│   ├── firebase.js             — Firebase init (Auth, Firestore, Analytics)
│   ├── auth.js                 — Google auth
│   ├── state.js                — Re-export wrapper (backward compat) ←──┐
│   ├── router.js               — SPA routing + query param utils      │
│   ├── services/                                                       │
│   │   ├── db/                 — Domain-based Firestore CRUD ──────────┘
│   │   │   ├── index.js        — Barrel: re-exports db + all modules
│   │   │   ├── collections.js  — Collection name constants
│   │   │   ├── common.js       — Shared helpers (validation, metadata, errors)
│   │   │   ├── brands.js       — Brand CRUD
│   │   │   ├── contents.js     — Content CRUD
│   │   │   └── settings.js     — Settings CRUD
│   │   ├── gemini.js           — AI content generation
│   │   ├── facebook.js         — FB Page publishing
│   │   └── wordpress.js        — WP blog publishing
│   ├── pages/                  — Page renderers
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── create.js
│   │   ├── library.js
│   │   └── brand.js
│   ├── components/             — Reusable UI
│   │   ├── content-card.js
│   │   ├── content-editor.js
│   │   ├── preview-panel.js
│   │   ├── publish-modal.js
│   │   ├── template-picker.js
│   │   └── toast.js            — Toast notifications (showToast + convenience)
│   └── utils/                  — Helpers
│       ├── dom.js
│       ├── format.js
│       └── storage.js
├── scripts/
│   └── verify.js               — Smoke test: module exports + parsing
└── assets/templates/            — Visual templates
```

## Cách chạy

```bash
npm install
npm run dev
```

### Smoke test

```bash
node scripts/verify.js
```

## Service Layer — `js/services/db/`

### Tổng quan

Tất cả Firestore CRUD được tổ chức theo domain:

| Module | Chức năng |
|---|---|
| `collections.js` | Collection name constants |
| `common.js` | Shared helpers: validation, metadata, error normalization |
| `brands.js` | Brand profile CRUD |
| `contents.js` | Content (bài viết) CRUD |
| `settings.js` | User settings CRUD |
| `index.js` | Barrel re-export — import tất cả từ đây |

### Cách thêm domain service mới

1. Tạo file `js/services/db/<domain>.js`
2. Import helpers từ `common.js` và constants từ `collections.js`
3. Sử dụng patterns:

```js
import { db } from '../../firebase.js';
import { COLLECTIONS } from './collections.js';
import { assertUser, withMeta, updateMeta, normalizeError } from './common.js';
import { collection, doc, addDoc, ... } from 'firebase/firestore';

// Create — dùng withMeta()
export async function createItem(data) {
    const docData = withMeta(data, data.userId);
    const ref = await addDoc(collection(db, COLLECTIONS.MY_COLLECTION), docData);
    return ref.id;
}

// Update — dùng updateMeta()
export async function updateItem(id, updates) {
    await updateDoc(doc(db, COLLECTIONS.MY_COLLECTION, id), {
        ...updates,
        ...updateMeta(),
    });
}
```

4. Thêm collection name vào `collections.js`
5. Re-export trong `index.js`
6. (Optional) Re-export trong `state.js` cho backward compat

### Firestore document conventions

Mọi document nên có:

| Field | Mô tả | Khi nào |
|---|---|---|
| `userId` | ID của user tạo document | Create (via `withMeta()`) |
| `createdAt` | Thời gian tạo (`serverTimestamp()`) | Create |
| `updatedAt` | Thời gian cập nhật (`serverTimestamp()`) | Create + Update |

### Validation helpers

```js
assertUser(userId)              // Throw nếu userId falsy
assertRequired(['name'], obj)   // Throw nếu thiếu field bắt buộc
```

### Error handling

```js
normalizeError(err) // → { code, message, details? }
```

### Router query params

```js
import { getQueryParams, getParam, setParam } from './router.js';

getQueryParams()           // { status: 'draft', page: '2' }
getParam('status', 'all')  // 'draft'
setParam('page', '3')      // cập nhật hash URL
```

## Setup

1. Tạo Firebase project → lấy config → paste vào `.env`
2. Bật Google Auth trong Firebase Console
3. Lấy Gemini API key từ Google AI Studio
4. Deploy lên Cloudflare Pages

## Tech Stack

- **Frontend**: Vite + Vanilla JS
- **Auth**: Firebase Auth (Google)
- **Database**: Cloud Firestore
- **AI**: Gemini API
- **Publishing**: Facebook Graph API + WordPress REST API
- **Hosting**: Cloudflare Pages

## How to Test — Manual Checklist (5 bước)

1. **Tạo chiến dịch**: Vào `#campaigns` → điền form → bấm "Tạo chiến dịch" → xác nhận hiện trong danh sách
2. **Tạo content**: Vào `#create` → nhập brief → AI tạo content → xác nhận draft lưu thành công
3. **Xem content theo campaign**: Trang campaigns → bấm "📚 Xem bài viết" → xác nhận library lọc theo campaignId, hiện badge chiến dịch
4. **Duyệt bài**: Vào `#approvals` → bấm "✅ Duyệt" hoặc "❌ Từ chối" (nhập lý do) → xác nhận status cập nhật
5. **Kiểm tra tương thích**: Dashboard, Library (không filter), Brand page vẫn hoạt động bình thường

## Campaign Brief — Test Checklist (5 bước)

1. **Tạo brief**: Campaigns → "📋 Chi tiết" → Brief tab → fill form → save draft
2. **Versioning**: Click "📝 Tạo version mới" → xác nhận version tăng + data clone
3. **Review flow**: Bấm "📤 Gửi duyệt" → status "Đang duyệt" → Approve/Reject → verify
4. **AI integration**: Tạo content với approved brief (`#create?campaignId=...`) → xác nhận prompt bao gồm SMP, RTB, CTA
5. **Fallback**: Tạo content không có campaign → xác nhận flow cũ hoạt động bình thường

## VOC Hub — Test Checklist (5 bước)

1. **Add VOC entry**: Campaign → VOC tab → "➕ Thêm mới" → fill → save → verify in list
2. **CSV import**: Chuẩn bị file CSV (sourceType,content,tags) → import → verify entries xuất hiện
3. **AI Cluster**: Click "🤖 AI Cluster" → verify clusters hiển thị theo 4 nhóm (pain/desire/objection/trigger)
4. **Hook Bank**: Verify 30 hooks + 20 câu xử lý phản đối → lưu Firestore
5. **Persistence**: Refresh trang → verify entries, clusters, hooks vẫn load đúng

## Ideas System — Test Checklist (5 bước)

1. **Create idea**: Campaign → Ideas tab → "➕ Thêm idea" → fill title/angle/funnel → save → verify in Kanban backlog
2. **Kanban move**: Click ◀▶ arrows → idea moves between columns (backlog → shortlisted → in_production)
3. **Scoring**: Click 📊 → set 4 sliders (painLevel, proofPotential, productionFit, conversionFit) → save → verify score shows on card
4. **Content Pack**: Click 📦 → verify 5 assets generated (TikTok, FB, Carousel, Email, Landing) → "Lưu vào Library" → verify in Library page
5. **Ranking**: Click 🏆 → verify ideas sorted by total score desc

## Content Assets — Test Checklist (5 bước)

1. **Create asset**: Campaign → Assets tab → "➕ Thêm asset" → fill type/channel/content → verify in pipeline draft column
2. **QA gate**: Click "🔍 QA" → "✅ QA" checklist → pass tất cả → verify asset chuyển sang approved
3. **Schedule**: Click 📅 → chọn ngày → verify asset chuyển sang scheduled + hiện trong Calendar
4. **Repurpose**: Click 🔄 → chọn channels → verify child assets tạo với template content + "↳ repurposed" label
5. **Brand assets**: Click 🏷️ Brand Assets → thêm proof/certificate → verify persist sau refresh

## Performance & Learning — Test Checklist (5 bước)

1. **Nhập số liệu**: Campaign → Performance tab → "➕ Nhập số liệu" → fill 10 fields → save → verify trong table
2. **CSV import**: Chuẩn bị CSV (date,assetId,views,watchTime,retention3s,ctr,leads,sales,spend,cpa) → import → verify
3. **Top assets**: Nhập ≥ 2 records với assetId → verify Top CTR / Best CPA / Top Retention cards
4. **Experiment**: Click "🧪 Tạo Experiment" → nhập hook gốc → "🤖 Tạo 3 variants" → preview → lưu → verify 3 draft assets
5. **Learning log**: Click "📝 Learning Log" → fill hypothesis/result/insight/next → save → verify hiện trong logs

---

## Production Firebase Setup (Step-by-step)

### 1. Tạo Firebase Project

1. Vào [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Đặt tên (ví dụ: `genki-content-pilot`) → bỏ chọn Analytics nếu không cần → **Create project**
3. Trong Project Overview → click icon **Web (</>)** → đặt nickname (ví dụ: "ContentPilot Web")
4. Copy `firebaseConfig` object → paste vào `.env`:

```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 2. Tạo Firestore Database

1. Firebase Console → **Build → Firestore Database** → **Create database**
2. Chọn region gần nhất (ví dụ: `asia-southeast1` cho Việt Nam)
3. Chọn **Start in test mode** (sẽ set rules sau)

### 3. Bật Authentication

1. Firebase Console → **Build → Authentication** → **Get started**
2. Tab **Sign-in method** → Enable **Google**
3. Nhập support email → **Save**

### 4. Firestore Security Rules

Vào **Firestore → Rules** → paste rules sau:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: user đã đăng nhập
    function isAuth() {
      return request.auth != null;
    }

    // Helper: user sở hữu document
    function isOwner() {
      return request.auth.uid == resource.data.userId;
    }

    // Helper: user tạo document với userId = mình
    function isCreator() {
      return request.auth.uid == request.resource.data.userId;
    }

    // ─── Core Collections ───
    match /brands/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /contents/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /settings/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }

    // ─── Campaign Collections ───
    match /campaigns/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /briefs/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /vocEntries/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /vocClusters/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /hookBanks/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }

    // ─── Ideas & Assets ───
    match /ideas/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /ideaScores/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /assets/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /brandAssets/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }

    // ─── Performance ───
    match /performanceMetrics/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /learningLogs/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /experiments/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }

    // ─── Schedules & Conversions ───
    match /schedules/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
    match /conversions/{docId} {
      allow read, write: if isAuth() && (isOwner() || isCreator());
    }
  }
}
```

> **Note:** Rules này enforce `userId` ownership — mỗi user chỉ CRUD được data của chính mình. Khi deploy production, review kỹ trước khi publish.

### 5. Firestore Indexes

Các query dùng `where()` + `orderBy()` trên field khác nhau cần **composite index**.

**Cách tạo:**
1. Khi app gặp lỗi "requires an index", Firebase sẽ log ra một URL trực tiếp
2. Click URL đó → tự động tạo index trong Firebase Console
3. Hoặc vào: **Firestore → Indexes → Composite → Add index**

**Index thường cần:**
| Collection | Fields | Order |
|---|---|---|
| `contents` | `userId` (Asc) + `createdAt` (Desc) | — |
| `campaigns` | `userId` (Asc) + `createdAt` (Desc) | — |
| `assets` | `campaignId` (Asc) + `status` (Asc) | — |
| `performanceMetrics` | `campaignId` (Asc) + `date` (Desc) | — |

### 6. Local Setup

```bash
# 1. Clone repo
git clone https://github.com/bangluutru/genki-content-pilot.git
cd genki-content-pilot

# 2. Copy env template
cp .env.example .env

# 3. Fill .env với Firebase config + Gemini API key
#    (xem comments trong .env.example để biết lấy ở đâu)

# 4. Install & run
npm install
npm run dev

# 5. Mở http://localhost:5173 → đăng nhập Google
```

### 7. Troubleshooting

| Lỗi | Nguyên nhân | Cách fix |
|---|---|---|
| **Banner "Offline/Demo mode"** | Thiếu env vars | Kiểm tra `.env` có đủ 6 `VITE_FIREBASE_*` keys |
| **"Firebase not configured"** | `.env` chưa được load | Restart dev server sau khi sửa `.env` |
| **"permission-denied"** | Firestore rules chặn | Paste rules ở mục 4 vào Console → Publish |
| **"requires an index"** | Thiếu composite index | Click URL trong error message → tạo index |
| **Auth popup blocked** | Browser chặn popup | Cho phép popup cho `localhost` / domain |
| **"auth/popup-closed-by-user"** | User đóng popup | Thử đăng nhập lại |
| **Build fails** | Dependencies thiếu | Chạy `npm install` rồi `npm run build` |

### 8. Firebase Hosting Deploy

```bash
# 1. Cài Firebase CLI
npm install -g firebase-tools

# 2. Đăng nhập
firebase login

# 3. Init hosting (chỉ cần 1 lần)
firebase init hosting
#   → Chọn project đã tạo
#   → Public directory: dist
#   → Single-page app (rewrite all URLs to /index.html): Yes
#   → Overwrite dist/index.html: No

# 4. Build production
npm run build

# 5. Deploy
firebase deploy --only hosting

# → App sẽ live tại: https://your-project.web.app
```

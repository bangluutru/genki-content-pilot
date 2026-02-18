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

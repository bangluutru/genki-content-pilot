# ContentPilot v2 - AI Content Automation Platform

AI-powered content creation and management platform with multi-language support, dark mode theming, and enterprise-grade design system.

## ✨ Features

- 🤖 **AI Content Generation** - Generate high-quality content with Google Gemini API
- 🌍 **Internationalization (i18n)** - Full support for Vietnamese and English
- 🎨 **Color Proof Design System** - Beautiful, accessible color palette with light/dark modes
- 📱 **Responsive Design** - Mobile-first UI that works on all devices
- 🔐 **Firebase Authentication** - Secure user authentication with Google Sign-In
- 💾 **Cloud Storage** - Store content, brand assets, and user preferences in Firestore
- 📊 **Content Analytics** - Track content performance and publishing metrics
- 🗓️ **Content Calendar** - Schedule and manage content publishing
- ✅ **Approval Workflow** - Multi-level content approval system
- 🎯 **Campaign Management** - Organize content into marketing campaigns

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase project with Firestore and Storage enabled
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd content-pilot-v2
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_GEMINI_API_KEY=your-gemini-api-key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

---

## 🌍 Internationalization (i18n)

ContentPilot supports multiple languages out of the box. Currently supported: **Vietnamese (vi)** and **English (en)**.

### Using Translations in Code

Import the translation function:
```javascript
import { t } from './utils/i18n.js';
```

Use it in your components:
```javascript
// Simple translation
const title = t('dashboard.title'); // "Dashboard" or "Tổng quan"

// Translation with variables
const greeting = t('dashboard.greeting', { name: 'John' }); // "Hello, John"

// Nested keys
const label = t('settings.profile.email'); // Access nested translation
```

### Adding New Translations

1. Add keys to `/src/locales/vi.json`:
```json
{
  "myFeature": {
    "title": "Tiêu đề tính năng",
    "description": "Mô tả chi tiết"
  }
}
```

2. Add English translations to `/src/locales/en.json`:
```json
{
  "myFeature": {
    "title": "Feature Title",
    "description": "Detailed description"
  }
}
```

3. Use in code:
```javascript
const title = t('myFeature.title');
const desc = t('myFeature.description');
```

### Switching Languages

Users can switch languages using the language toggle button in the sidebar (🇻🇳 VI / 🇺🇸 EN).

Programmatically:
```javascript
import { setLocale } from './utils/i18n.js';

await setLocale('en'); // Switch to English
await setLocale('vi'); // Switch to Vietnamese
```

Language preference is automatically saved to:
- **Firestore** - For authenticated users
- **localStorage** - For offline/fallback storage

---

## 🎨 Theming System

ContentPilot uses the **Color Proof** design system with full light/dark mode support.

### Using Themes

Switch themes using the theme toggle button in the sidebar (☀️/🌙).

Programmatically:
```javascript
import { toggleTheme, getTheme } from './utils/theme.js';

await toggleTheme(); // Switch between light/dark
const current = getTheme(); // Returns 'light' or 'dark'
```

Theme preference is persisted to Firestore and localStorage.

### Design Tokens

All colors, spacing, and typography use CSS custom properties defined in `/src/styles/tokens.css`.

#### Color System

```css
/* Use semantic color tokens */
.my-component {
  background-color: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}

/* Available tokens */
--bg                /* Page background */
--surface           /* Card/panel background */
--surface-hover     /* Hover state */
--text              /* Primary text */
--text-muted        /* Secondary text */
--border            /* Border color */
--primary           /* Brand color */
--success           /* Success state */
--warning           /* Warning state */
--error             /* Error state */
```

#### Spacing

```css
.my-component {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  gap: var(--space-2);
}

/* Available spacing scale: --space-1 through --space-12 */
```

#### Typography

```css
.title {
  font-size: var(--font-2xl);
  font-weight: 700;
}

.body {
  font-size: var(--font-base);
  line-height: 1.6;
}

/* Available sizes: --font-xs, --font-sm, --font-base, --font-lg, --font-xl, --font-2xl */
```

### Dark Mode Implementation

The dark mode class (`.dark`) is applied to the `<html>` element and tokens automatically adjust:

```css
/* tokens.css handles this automatically */
:root {
  --bg: white;
  --text: #1a1a1a;
}

.dark {
  --bg: #0f0f0f;
  --text: #e5e5e5;
}
```

No need to manually handle dark mode in components—just use the tokens!

---

## 🏗️ Architecture

### Project Structure

```
content-pilot-v2/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── header.js      # Sidebar with nav, theme, language toggles
│   ├── pages/             # Page components (12 total)
│   │   ├── login.js       # Authentication page
│   │   ├── dashboard.js   # Analytics dashboard
│   │   ├── create.js      # AI content creation
│   │   ├── library.js     # Content library
│   │   ├── calendar.js    # Publishing calendar
│   │   ├── settings.js    # Platform connections & brand settings
│   │   └── ...            # Other pages
│   ├── utils/             # Utility functions
│   │   ├── i18n.js        # Translation system
│   │   ├── theme.js       # Theme management
│   │   ├── state.js       # Global state management
│   │   └── router.js      # Client-side routing
│   ├── services/          # External integrations
│   │   ├── firebase.js    # Firebase config
│   │   ├── auth.js        # Authentication
│   │   ├── firestore.js   # Database operations
│   │   └── ai.js          # Gemini AI integration
│   ├── locales/           # Translation files
│   │   ├── vi.json        # Vietnamese translations
│   │   └── en.json        # English translations
│   ├── styles/            # CSS files
│   │   ├── tokens.css     # Design tokens (Color Proof)
│   │   └── index.css      # Global styles
│   └── main.js            # Application entry point
├── index.html             # HTML template
├── package.json           # Dependencies
└── .env                   # Environment variables
```

### State Management

Simple reactive state using `state.js`:

```javascript
import { store } from './utils/state.js';

// Get state
const user = store.get('user');
const theme = store.get('theme');

// Set state (triggers re-render)
store.set('locale', 'en');

// Subscribe to changes
store.subscribe('theme', (newTheme) => {
  console.log('Theme changed to:', newTheme);
});
```

### Routing

Client-side routing with hash-based URLs:

```javascript
import { router } from './utils/router.js';

// Register routes
router.on('/dashboard', () => import('./pages/dashboard.js'));
router.on('/create', () => import('./pages/create.js'));

// Navigate programmatically
window.location.hash = '#/create';
```

---

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Adding a New Page

1. Create page file in `/src/pages/`:
```javascript
// src/pages/mypage.js
import { t } from '../utils/i18n.js';

export async function render() {
  return `
    <div class="page">
      <h1>${t('mypage.title')}</h1>
      <p>${t('mypage.description')}</p>
    </div>
  `;
}
```

2. Add translations to locale files
3. Register route in `main.js`
4. Add navigation item to `header.js`

### Code Style

- Use ES6+ features (modules, async/await, template literals)
- Follow functional programming patterns
- Use design tokens for all styling
- All user-facing text must use `t()` function
- Keep components small and focused

---

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary and confidential.

---

## 🆘 Support

For questions or issues, please contact the development team.

---

## 🙏 Acknowledgments

- **Color Proof** - Design system and color palette
- **Google Gemini** - AI content generation
- **Firebase** - Backend infrastructure
- **Vite** - Build tool and dev server

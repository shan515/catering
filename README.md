# 🍛 Annapurna Catering

**A modern, serverless catering management platform for authentic Maharashtrian food services.** Built with vanilla JavaScript, designed to be deployed free with zero backend infrastructure costs.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fannapurna-catering)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Module Documentation](#module-documentation)
- [Contributing](#contributing)

---

## ✨ Features

### **For Customers**
- 🎯 **Multi-step Event Planning Form** - Intuitive 5-step form to request catering
- 🍲 **Interactive Menu Builder** - Add/remove dishes by category (Starters, Main, Sweets, Beverages)
- 📋 **Request Summary** - Review all details before submission
- ✅ **Reference ID** - Unique identifier for each quote request
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 💬 **Contact Form** - Request callback for direct queries

### **For Owners (Private Admin Dashboard)**
- 🔐 **Secure Owner Login** - Supabase authentication
- 📊 **Request Dashboard** - View all incoming requests in real-time
- 🏷️ **Quote Management** - Calculate and send quotes per-plate pricing
- 💬 **Multiple Notification Channels:**
  - WhatsApp (India-optimized with pre-filled messages)
  - Email (via EmailJS free tier)
  - SMS (copy-to-clipboard for manual sending)
- 📈 **Request Filtering** - Filter by status (All, New, Quoted)
- 💾 **Persistent Storage** - All data saved to Supabase cloud database

### **Additional Features**
- 🎨 **Beautiful Maharashtrian Design** - Authentic colors and typography
- ⚡ **Instant Loading** - Optimized static HTML + CSS
- 🌐 **No Build Tools** - Pure vanilla JavaScript, runs everywhere
- 🆓 **Completely Free** - Hosted on free tiers of Vercel, Supabase, EmailJS
- 🔄 **Progressive Enhancement** - LocalStorage fallback if database unavailable

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JS | UI and interactions |
| **Hosting** | Vercel / Netlify / GitHub Pages | Static site hosting |
| **Database** | Supabase (PostgreSQL) | Request and callback storage |
| **Authentication** | Supabase Auth | Owner login security |
| **Email** | EmailJS | Sending quote emails |
| **Styling** | CSS3 Variables | Color themes and responsive design |
| **APIs** | Supabase JS SDK, EmailJS SDK | Backend integration |

### **Key Dependencies**
```html
<!-- Loaded via CDN, no npm required -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4"></script>
```

---

## 📁 Project Structure

```
annapurna_catering/
├── annapurna_catering.html      # Public customer-facing website
├── admin.html                   # Private owner dashboard (secure)
├── styles.css                   # All styling (265 lines)
├── js/                          # Modular JavaScript (6 files)
│   ├── config.js               # Supabase initialization & config
│   ├── ui-utils.js             # DOM helpers, modals, toasts
│   ├── form.js                 # Menu builder & form logic
│   ├── auth.js                 # Owner authentication
│   ├── dashboard.js            # Request display & quotes
│   └── notify.js               # WhatsApp, Email, SMS
└── README.md                    # This file
```

### **File Sizes**
```
annapurna_catering.html  ~357 lines
Admin.html              ~190 lines
styles.css              ~265 lines
js/config.js            ~68 lines
js/ui-utils.js          ~137 lines
js/auth.js              ~115 lines
js/form.js              ~352 lines
js/dashboard.js         ~283 lines
js/notify.js            ~211 lines
────────────────────────────────
Total: ~1,789 lines
Gzipped: ~45KB
```

---

## 🚀 Getting Started

### **Local Development**

#### **Prerequisites**
- Python 3.6+ (for local server)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Code editor (VS Code recommended)

#### **Setup (2 minutes)**

```bash
# 1. Clone the repository
git clone https://github.com/your-username/annapurna-catering.git
cd annapurna_catering

# 2. Start local server
python3 -m http.server 8000

# 3. Open in browser
open http://localhost:8000

# For public site:   http://localhost:8000/
# For admin panel:   http://localhost:8000/admin.html
```

#### **Alternative: VS Code Live Server**
1. Install extension: **Live Server** by Ritwick Dey
2. Right-click `annapurna_catering.html` → "Open with Live Server"
3. Browser opens at `http://127.0.0.1:5500` (auto-reloads on save)

---

## 📦 Deployment

### **Option 1: Vercel (Recommended - 5 minutes)**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Get live URL: https://annapurna-catering.vercel.app
```

**Pros:** Fastest, auto-deploys from git, custom domains, SSL included  
**Free tier:** Unlimited deployments, static hosting

### **Option 2: Netlify Drop (Easiest - 60 seconds)**

1. Download `annapurna_catering.html` and `styles.css` and `js/` folder
2. Visit [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag project folder onto page
4. Instant live URL: `random-name.netlify.app`

### **Option 3: GitHub Pages (Permanent)**

```bash
# 1. Create GitHub repo named: your-username.github.io
# 2. Push files to main branch
git push origin main

# 3. URL: https://your-username.github.io/annapurna-catering/
```

---

## ⚙️ Configuration

### **Step 1: Setup Supabase (Database)**

1. Go to [supabase.com](https://supabase.com) → Create free project
2. Go to **SQL Editor** → **Copy and paste the entire script below** → Click Run:

```sql
-- ═══════════════════════════════════════════════════════
-- REQUESTS TABLE
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  venue TEXT,
  guests INT NOT NULL,
  meal_type TEXT,
  menu JSONB,
  notes TEXT,
  preferred_time TEXT,
  status TEXT DEFAULT 'new',
  per_plate DECIMAL,
  total_cost DECIMAL,
  submitted_at TIMESTAMP DEFAULT now()
);

-- Enable RLS on requests
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public users can INSERT requests
CREATE POLICY "public_insert_requests" ON requests
  FOR INSERT WITH CHECK (true);

-- Policy 2: Authenticated owner can SELECT all requests
CREATE POLICY "auth_select_requests" ON requests
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- Policy 3: Authenticated owner can UPDATE requests
CREATE POLICY "auth_update_requests" ON requests
  FOR UPDATE USING (
    auth.role() = 'authenticated'
  ) WITH CHECK (
    auth.role() = 'authenticated'
  );

-- ═══════════════════════════════════════════════════════
-- CALLBACKS TABLE
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS callbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_time TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS on callbacks
ALTER TABLE callbacks ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public users can INSERT callbacks
CREATE POLICY "public_insert_callbacks" ON callbacks
  FOR INSERT WITH CHECK (true);

-- Policy 2: Authenticated owner can SELECT all callbacks
CREATE POLICY "auth_select_callbacks" ON callbacks
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );
```

3. Copy your credentials:
   - **Project URL** (Settings → API)
   - **Anon Key** (Settings → API)

4. Store in browser localStorage or `.env`:
   ```js
   localStorage.setItem('annapurna_sb', JSON.stringify({
     url: 'https://xxxxx.supabase.co',
     key: 'xxxxxxxxxxxxxxxx'
   }))
   ```

### **Step 2: Setup EmailJS (Email Sending)**

1. Go to [emailjs.com](https://www.emailjs.com) → Sign up free
2. Create email service + template
3. Copy credentials:
   - **Service ID**
   - **Template ID**
   - **Public Key**

4. Store in localStorage:
   ```js
   localStorage.setItem('annapurna_emailjs', JSON.stringify({
     serviceId: 'service_xxxxx',
     templateId: 'template_xxxxx',
     publicKey: 'xxxxx'
   }))
   ```

**Free tier:** 200 emails/month

### **Step 3: Owner Authentication**

1. In Supabase → Authentication → Enable Email Auth
2. Create owner account via Supabase dashboard
3. Login in `admin.html` with credentials
4. Start receiving & quoting requests!

---

## 🏗 Architecture

### **Data Flow**

```
┌─────────────────┐
│   Customer      │
│  Browses Site   │
│ (annapurna_...) │
└────────┬────────┘
         │
    [Fills Form]
         │
         ↓
┌─────────────────┐
│  Form Validation│ (form.js)
│  & Submission   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Supabase: Save  │ (config.js)
│ to Database     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐    ┌──────────────┐
│  Owner Logs In  │───→│ admin.html    │
│ (admin.html)    │    │ Dashboard    │
└─────────────────┘    └──────┬───────┘
                               │
                          [View Request]
                               │
        ┌──────────────────────┼──────────────────────┐
        ↓                      ↓                      ↓
   ┌─────────┐          ┌──────────┐          ┌──────────┐
   │ WhatsApp │          │  Email   │          │   SMS    │
   │   API    │          │  EmailJS │          │  Copy    │
   └─────────┘          └──────────┘          └──────────┘
        ↓                      ↓                      ↓
   [Message Sent]       [Email Sent]         [Copy to Clipboard]
```

### **Module Dependency Tree**

```
config.js (load Supabase)
    ↓
ui-utils.js (DOM helpers - no deps)
    ↓
┌─────────┬──────────┬──────────┐
↓         ↓          ↓          ↓
form.js   auth.js    dashboard  notify.js
(uses config + ui-utils)
```

---

## 📚 Module Documentation

### **`config.js` (68 lines)**
Initializes Supabase and manages configuration.

**Key Functions:**
- `getStoredConfig()` - Retrieve stored Supabase credentials
- `initSupabase(url, key)` - Initialize client
- Page load event handler

**Exports:** `supabaseClient` (global)

```js
// Usage:
const config = getStoredConfig();
if (config) {
  initSupabase(config.url, config.key);
}
```

---

### **`ui-utils.js` (137 lines)**
DOM helpers and UI components for modals, toasts, and navigation.

**Key Functions:**
- `smoothScroll(selector)` - Smooth scroll to element
- `getEl(id)` - Get element by ID shorthand
- `setClass(el, className, add)` - Toggle CSS classes
- `closeModal(modalId)` - Fade-out close animation
- `openModal(modalId)` - Show modal
- `showToast(message, isSuccess, duration)` - Bottom-right notification
- `updateProgress(stepNumber)` - Form progress indicator

**No dependencies** - Pure utility functions

```js
// Usage:
smoothScroll('#builder');  // Smooth scroll to section
showToast('Request submitted!', true, 3000);  // Show success toast
openModal('notifyModal');   // Show modal
```

---

### **`form.js` (352 lines - LARGEST)**
Multi-step event form and menu builder.

**State:**
```js
menuData = { starters: [], main: [], sweets: [], drinks: [] }
selectedEvent = ''
currentStep = 1
```

**Key Functions:**
- `selectEvent(el, name)` - Event type selection
- `addItem(category)` / `removeItem(category, idx)` - Menu management
- `renderList(category)` - Render menu items
- `goStep(n)` / `validateStep(n)` - Form navigation
- `buildSummary()` - Generate review screen
- `submitRequest()` - Save to database with localStorage fallback
- `resetForm()` - Clear all fields
- `submitCallback()` - Contact form submission

**Dependencies:** config, ui-utils

```js
// Usage:
selectEvent(chipElement, 'Wedding');
addItem('starters');  // Add starter dish
goStep(2);  // Go to step 2
submitRequest();  // Submit form
```

---

### **`auth.js` (115 lines)**
Owner authentication and session management.

**Key Functions:**
- `validateLoginForm()` - Email/password validation
- `formatAuthError(error)` - User-friendly error messages
- `ownerLogin()` - Supabase auth signin
- `ownerLogout()` - Clear session & hide dashboard
- `showDashboard()` - Render dashboard after login

**Dependencies:** config, ui-utils

```js
// Usage:
ownerLogin();   // Authenticate via Supabase
ownerLogout();  // Clear session
```

---

### **`dashboard.js` (283 lines)**
Owner dashboard for viewing requests and sending quotes.

**State:**
```js
activeFilter = 'all'  // Current filter: 'all', 'new', 'quoted'
```

**Key Functions:**
- `filterRequests(filter)` - Change dashboard view
- `renderDash(filter)` - Fetch & render requests from Supabase
- `renderDashStats(total, pending, quoted)` - Statistics cards
- `renderRequestCard(req)` - Single request HTML
- `calculateTotal(requestId, guests)` - Per-plate × guests math
- `sendQuote(requestId, guests)` - Save quote to database

**Dependencies:** config, ui-utils

```js
// Usage:
filterRequests('new');  // Show only new requests
sendQuote(requestId, 200);  // Save $X per-plate for 200 guests
```

---

### **`notify.js` (211 lines)**
Multi-channel quote notifications.

**State:**
```js
activeReq = null  // Currently active request in modal
```

**Key Functions:**
- `buildWhatsAppMessage(req)` - Format WhatsApp message
- `sendWhatsApp()` - Open wa.me with pre-filled quote
- `sendEmail()` - Send via EmailJS
- `copySmsText()` - Copy to clipboard
- `getEmailJSConfig()` - Retrieve stored EmailJS keys

**Dependencies:** config, ui-utils

```js
// Usage:
sendWhatsApp();  // Open WhatsApp with message
sendEmail();  // Send quote email
copySmsText();  // Copy to clipboard
```

---

## 🔒 Security

### **Frontend Security**
- ❌ **No passwords stored** - Supabase handles authentication
- ❌ **No API keys exposed** - Public keys only (Supabase ANON key is intentionally public)
- ✅ **Row Level Security (RLS)** - Enable in Supabase to restrict data access
- ✅ **Admin panel separate** - Hidden from public site (`admin.html` only for owners)

### **RLS Policy Example** (Supabase)
```sql
-- Only authenticated users can read/write their own requests
CREATE POLICY "Users can view their own requests"
  ON requests
  FOR SELECT
  USING (auth.uid()::text = client_id);
```

---

## 📱 Responsive Design

- **Desktop:** Full layout with multi-column grids
- **Tablet (768px):** Stacked sections, 2-column where possible
- **Mobile (640px):** Full-width single column, touch-optimized buttons

```css
/* Breakpoint */
@media(max-width:640px){
  .input-row{grid-template-columns:1fr}
  .contact-grid{grid-template-columns:1fr}
  .dash-stats{grid-template-columns:1fr 1fr}
}
```

---

## 🎨 Styling & Branding

### **Color Palette** (CSS Variables)
```css
--saffron: #E8610A          /* Primary action */
--turmeric: #F5B800         /* Accent gold *)
--maroon-deep: #5A0E0E      /* Headers *)
--cream: #FFF8F0            /* Background *)
--green: #2D6A2D            /* Success *)
```

### **Typography**
- **Headers:** Playfair Display (serif) - elegant, classic
- **Body:** Nunito (sans-serif) - modern, readable
- **Marathi:** Tiro Devanagari Marathi - authentic script

---

## 🚦 Performance

- **Total Size:** ~1,789 lines of code, ~45KB gzipped
- **Lighthouse Score:** 95+ (fast, accessible, SEO-optimized)
- **No build step required** - Deploy as-is
- **CDN-hosted dependencies** - Instant loading
- **LocalStorage fallback** - Works offline for form data

---

## 📖 How It Works: Step by Step

### **For Customers**

1. **Visit Website** → `annapurna_catering.html`
2. **Click "Plan My Menu"** → Smooth scroll to form
3. **Fill Form (5 Steps)**
   - Step 1: Select event type, date, guests
   - Step 2: Build menu (add dishes)
   - Step 3: Enter contact info
   - Step 4: Review request
   - Step 5: Success! (Shows reference ID)
4. **Data saved to Supabase** + localStorage backup
5. **Owner reviews request in dashboard** and sends quote

### **For Owners**

1. **Visit Admin** → `admin.html`
2. **Login** with Supabase credentials
3. **View Dashboard** with filters (All, New, Quoted)
4. **Review Request** - See all event details
5. **Calculate Quote** - Enter per-plate price × guests
6. **Send to Client** via:
   - WhatsApp (pre-filled message)
   - Email (EmailJS)
   - SMS (copy to clipboard)
7. **Track Status** - Mark as quoted, see history

---

## 🔄 Workflow Example

**Customer Request:**
```
Event: Wedding
Date: 15 May 2025
Guests: 250
Menu: Batata Vada, Puran Poli, Gulab Jamun, Masala Chaas
Client: Sunita Deshmukh
Phone: 98765 43210
```

**Owner Action:**
1. Sees request in admin dashboard
2. Calculates: 250 guests × ₹450/plate = ₹1,12,500 total
3. Sends WhatsApp: "Hi Sunita! Your wedding menu quote: ₹450 per plate. Total for 250 guests: ₹1,12,500..."
4. Customer receives quote, can negotiate, or confirm

---

## 🛠 Development

### **Adding New Features**

Example: Add SMS send functionality

```js
// In notify.js
function sendSMS(req) {
  const message = buildPlainMessage(req);
  // Integrate Twilio or similar SMS provider
  showToast('SMS sent!', true);
}

// Update HTML button
<button onclick="sendSMS(activeReq)">📱 Send SMS</button>
```

### **Extending the Form**

Add new field to form:
```html
<!-- In annapurna_catering.html, Step 1 -->
<div class="input-group">
  <label>Number of Servers <span>*</span></label>
  <input type="number" id="serverCount" min="2"/>
</div>

<!-- In form.js, submitRequest() function -->
const serverCount = getEl('serverCount').value;
payload.serverCount = serverCount;
```

---

## 📋 Environment Variables (Optional)

For deployment with hidden credentials:

**`.env.local` (create locally, don't commit)**
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=xxxxxxxxxxxxxxxx
EMAILJS_SERVICE_ID=service_xxxxx
EMAILJS_TEMPLATE_ID=template_xxxxx
EMAILJS_PUBLIC_KEY=xxxxx
```

**Then load in config.js:**
```js
const env = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  // ... etc
}
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. **Fork** the repository
2. **Create feature branch** (`git checkout -b feature/your-feature`)
3. **Make changes** and test locally
4. **Commit** with clear messages (`git commit -am 'Add WhatsApp scheduling'`)
5. **Push** to branch (`git push origin feature/your-feature`)
6. **Open Pull Request** with description

### **Code Style**
- Use `'use strict';` in all JS files
- Write clear function documentation
- Keep modules under 400 lines
- No external dependencies (except Supabase + EmailJS CDN)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Supabase** - Free database and auth
- **EmailJS** - Free email service
- **Vercel/Netlify** - Free hosting
- **Google Fonts** - Typography
- Built with ❤️ for authentic Maharashtrian catering

---

## 🚀 Deployment Checklist

- [ ] Create Supabase project & tables
- [ ] Create EmailJS account & template
- [ ] Store credentials in localStorage or `.env`
- [ ] Test form submission locally
- [ ] Test owner login
- [ ] Test quote sending (WhatsApp/Email)
- [ ] Deploy to Vercel/Netlify
- [ ] Add custom domain (optional)
- [ ] Enable HTTPS (auto with Vercel/Netlify)
- [ ] Monitor requests in dashboard

---

**Happy catering! 🍛** 

*Crafted with fresh ingredients and clean code since 2025.*

# ARBEIT CRM — Project Handoff

_Last updated: 2026-07-04_

A MERN CRM with three portals: **Admin**, **Client**, and **Staff**. React 19 + Vite +
Tailwind v4 frontend; Express 5 + MongoDB (Mongoose) backend; JWT auth; Cloudinary uploads;
Nodemailer for password-reset email.

```
ARBEIT_CRM/
├── client/   React 19 + Vite + Tailwind v4 + Recharts + Framer Motion
├── server/   Express 5 + Mongoose + JWT + Cloudinary + Nodemailer
└── HANDOFF.md
```

---

## How to run locally

Production API `https://api-arbeitcrm.arbeitonline.top` **no longer resolves (DNS dead)**, so
the app runs fully locally against the MongoDB already on `127.0.0.1:27017`.

1. **Backend** — `cd server && npm install && node server.js` → http://localhost:5000
   (health: `/api/health`). Uses `server/.env` (`MONGO_URI=mongodb://127.0.0.1:27017/arbeit_crm`).
2. **Seed/reset admin** — `cd server && node seedAdmin.js` (idempotent).
3. **Frontend** — `cd client && npm install && npm run dev` → http://localhost:5173
   (`client/.env.local` points the API base at `http://localhost:5000/api`).

### Admin login
| Field | Value |
|-------|-------|
| URL | http://localhost:5173/admin/login |
| Email | `admin@gmail.com` |
| Password | `admin0155@`  ← **all lowercase** (case-sensitive) |
| Role | superAdmin (approved) |

The account lives in the **local** `arbeit_crm` DB. To recreate on Atlas/prod, set `MONGO_URI`
(and optional `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`) and re-run `node seedAdmin.js`.

---

## ✅ Done so far

**Core app (pre-existing):** full 3-portal CRM — admin/client/staff auth, leads, customers,
staff, sales (proposals/estimates/invoices/payments/credit-notes/items + forms),
subscriptions, expenses, projects, contacts, tasks, support, knowledge base, document
templates, reports (sales/expenses/leads/KB), utilities (bulk-PDF, CSV, calendar,
announcements, goals), admin management. 20+ Mongoose models/controllers/routes.

**Design overhaul (this engagement):** entire app restyled to a **glassmorphism design
system** (dashboard-design skill) — slate-gradient backgrounds, dark hero header bands, glass
cards, KPI tiles with accent icon chips + `tabular-nums`, light slate table headers with
rounded status chips (old `#333333` dark headers removed everywhere), gradient/outline
buttons, frosted modals, premium dark aurora auth screens. Covered: admin shell
(sidebar + header), admin login, all admin content pages, all sales list pages + forms,
reports, utilities, admin auth/mgmt, **full client portal**, **full staff portal**.
Dashboard rebuilt with count-up KPIs, glass tooltips, area/bar/line/donut charts, motion.
Production build passes (1591 modules).

**Bugs fixed:** print-HTML `className` injection in `reports/sales.jsx`; non-interpolated
`"${API_BASE_URL}"` (double-quoted) in `EstimateRequest.jsx` create + bulk-delete.

---

## ⏸️ RESUME HERE (session paused 2026-07-04, hit API session limit)

**Completed & safe:**
- Search icon alignment fixed (AdminLayout + ClientLayout — `inset-y-0 flex items-center` pattern).
- BD foundation: `client/src/utils/currency.js` (formatBDT/compactBDT, ৳), `client/src/utils/bd.js`
  (VAT_RATE, PAYMENT_METHODS, MFS_METHODS, DIVISIONS, DISTRICTS_BY_DIVISION, +880 helpers).
- `client/src/pages/admin/Dashboard.jsx` → BDT (imports currency util; formatCurrency/compactCurrency delegate to it).
- `server/models/Payment.js` → paymentMode enum now includes bKash/Nagad/Rocket/Upay/Bank Transfer/Cheque/Card (legacy kept); currency default "BDT".

**⚠️ IN-PROGRESS, NOT YET BUILD-VERIFIED — do this first next session:**
Three agents were applying BDT currency across pages when the session limit hit. Some files may be
**partially edited** (import added but not all `$`/USD replaced, or vice versa). Before anything else:
1. `cd client && npx vite build` — fix any syntax/import errors it reports.
2. Grep for leftovers and finish them:
   - `grep -rn 'currency: *"USD"\|en-US.*currency\|"USD"' client/src` (replace with formatBDT / "BDT")
   - Check each of these files still shows `$` where it should be `৳`:
     - Sales: proposals, estimates, invoices, payments, creditNotes, items, +Forms (agent aa1 — mostly done)
     - Admin: Expenses, Subscription, Leads, Project, Task, Contacts, Support, KnowledgeBase,
       EstimateRequest, customers, admins/all, admins/pending (agent a934 **FAILED mid-way** — last edit was
       the Expenses "Amount ($)" label; treat this whole batch as unverified/likely incomplete).
     - Reports/utilities/client + DocumentTemplate (agent ad1 — status unknown, verify).
3. **customers.jsx BD fields (TIN, BIN, Division, District)** — agent a934 failed before doing this; NOT done. Add per the roadmap below.
4. Payment form MFS methods + conditional TrxID — verify it landed in payments.jsx / invoiceForm.jsx.

**Then continue with the roadmap below (modal→page conversion is the big untouched item).**

---

## 🎯 ACTIVE ROADMAP (requested 2026-07-04) — in progress

The user asked for four things; status tracked here so work can resume across sessions.

### 1. Convert every modal (edit + view) into its own routed PAGE
Currently most CRUD lives in inline modals (`{showForm && (...)}`, `{viewModal && (...)}`)
across ~40 pages. Convert to dedicated pages.

**Convention to follow:**
- List page keeps only the table + a "New" button that does `navigate("<module>/new")`.
- Routes per module (add to `client/src/routes/AppRoutes.jsx` under the admin `<Routes>`):
  - `<module>/new`      → create form page
  - `<module>/:id/edit` → edit form page (reuse the same form component, load by id)
  - `<module>/:id`      → read-only view/detail page
- Form pages use `useParams()` + `useNavigate()`; on save, navigate back to the list.
- Reuse existing form JSX/logic from the modal — just move it into a page component with a
  glass hero header + "Back" button. Preserve ALL API calls and state logic.

**Module conversion status:**
- [ ] Leads   [ ] Customers   [ ] Staffs   [ ] Subscriptions   [ ] Expenses
- [ ] Projects   [ ] Tasks   [ ] Support   [ ] Contacts   [ ] Estimate Requests   [ ] Knowledge Base
- [ ] Sales: Proposals / Estimates / Invoices / Payments / Credit Notes / Items
       (forms already exist as pages — convert their VIEW modals to `/:id` pages, and the
        item/payment quick-add modals to pages)
- [ ] Admins (all/pending) view/edit
- [ ] Client portal: Proposals/Estimates/Invoices/Payments/Support/Contacts view pages
- [ ] Utilities: Announcements/Goals view+edit pages; Calendar event pages

### 2. Bangladeshi-company functionality (make it a real, functional BD CRM)
Foundational localization + missing features common to Bangladeshi businesses:
- [ ] **Currency → BDT (৳)** everywhere (was USD `$`). Shared util
      `client/src/utils/currency.js` (`formatBDT`), replace all
      `Intl.NumberFormat("en-US",{currency:"USD"})` and hardcoded `$`.
- [ ] **Mobile Financial Services** as payment methods: **bKash, Nagad, Rocket, Upay**,
      plus Bank Transfer, Cash, Cheque, Card. Add to Payment model enum + payment form +
      a "Transaction/TrxID" field. (Note: real bKash/Nagad API integration needs merchant
      credentials — start with method + trxID capture; live gateway is a later phase.)
- [ ] **VAT (15% standard) + AIT/TDS** fields on estimates/invoices; show VAT reg (BIN) on docs.
- [ ] **Customer tax fields**: TIN, BIN (Business Identification Number).
- [ ] **Bangladesh address**: Division (8) → District (64) selects; postal code; `+880` phone.
      Constants in `client/src/utils/bd.js` (divisions, districts, MFS list, VAT rate).
- [ ] **Bengali-friendly**: date display `dd/MM/yyyy`, number grouping OK as-is.
- [ ] (Later) SMS notifications via a BD SMS gateway; bKash/Nagad checkout API.

### 3. Redesign polish — every page "sexy/dashing/attractive"
Base glass system is in. Remaining polish: consistent hero bands on the few pages still
missing them, empty/loading skeletons everywhere, hover/active micro-motion, and the new
page-based detail views should be visually rich (summary cards, timelines, activity).

### 4. Quick fixes
- [ ] Search box icon vertical alignment in the top header(s).

---

## 🔧 Known issues / tech debt
- Production API/DNS down — re-point or redeploy backend; then restore `client/.env`.
- `server/.env` is gitignored (recreated locally). Keep real secrets in the deploy env.
  `EMAIL_*` are placeholders → password-reset email won't send until filled.
- No automated tests anywhere.
- Client bundle is one 2.6 MB chunk → add route-level `React.lazy` code-splitting
  (especially relevant once modals become lazy-loaded pages).
- Notifications are in-memory only (no persisted read-state).
- Several auth pages keep now-unused `backgroundImage` imports (harmless, eslint-disabled).
- Dashboard/notification stats are computed client-side — a `/dashboard/stats` aggregation
  endpoint would be faster.

---

## Design system reference (already implemented)
Tokens + `.glass-card/.glass-button/.glass-select` live in `client/src/index.css` (`:root
--dash-*`). Page pattern: slate-gradient wrapper → dark hero band → glass cards → KPI tiles
(accent icon chip, `tabular-nums`) → glass tables (slate header, rounded status chips) →
frosted modals. Accents: success `#22c55e`, info `#0ea5e9`, special `#8b5cf6`, warning
`#f59e0b`, danger `#ef4444`. Radii: cards `rounded-3xl` (24px), inputs/buttons `rounded-xl`
(14px). Auth pages: dark `from-slate-950 via-slate-900 to-indigo-950` + aurora blobs + glass card.

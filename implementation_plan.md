# POS Web Application — Full Implementation Plan

A complete web-based Point of Sale system with warehouse management, cash flow tracking, receipt generation, and a conditional discount engine.

## Current State

The project has a **skeleton** from the previous conversation:
- **Backend**: Express.js server with `pg` (PostgreSQL) driver, 2 partial models (User, Product), empty controllers/middleware/routes dirs
- **Frontend**: Vite + React + TypeScript — still has the default Vite boilerplate (no POS UI)
- **Docker**: docker-compose with MySQL 8.0 + backend + frontend services
- **Schema**: Prisma schema + raw SQL covering Users, Products, Warehouse, CashFlow, DiscountRules, Receipts, ReceiptItems

> [!IMPORTANT]
> **Database conflict**: docker-compose uses MySQL but backend code uses `pg` (PostgreSQL). I will **standardize on MySQL** since docker-compose already configures it, and switch the backend to use `mysql2` + Prisma Client instead of the raw `pg` pool.

---

## Proposed Changes

### Phase 1: Backend Foundation

#### [MODIFY] [docker-compose.yml](file:///home/zero/Documents/POS/docker-compose.yml)
- Keep MySQL as-is, no changes needed

#### [MODIFY] [package.json](file:///home/zero/Documents/POS/backend/package.json)
- Remove `pg` dependency
- Add `mysql2`, `@prisma/client` (or prisma client output)
- Add `nodemon` for dev, `uuid` for receipt numbers
- Add scripts: `"dev"`, `"db:push"`, `"db:seed"`

#### [MODIFY] [.env](file:///home/zero/Documents/POS/backend/.env)
- Update DATABASE_URL to point to MySQL
- Add `DB_HOST=localhost` for local dev (not `db` which is docker-only)

#### [DELETE] [config/db.js](file:///home/zero/Documents/POS/backend/config/db.js)
- Remove raw pg pool — replaced by Prisma Client

#### [DELETE] [models/User.js](file:///home/zero/Documents/POS/backend/models/User.js)
#### [DELETE] [models/Product.js](file:///home/zero/Documents/POS/backend/models/Product.js)
- Remove raw SQL models — Prisma handles this

#### [DELETE] [db/schema.sql](file:///home/zero/Documents/POS/backend/db/schema.sql)
- Remove raw SQL schema — Prisma schema is the source of truth

#### [MODIFY] [prisma/schema.prisma](file:///home/zero/Documents/POS/backend/prisma/schema.prisma)
- Refine relations (Warehouse should be 1:1 with Product via `@unique` on productId)
- Add `userId` to Warehouse model for proper scoping
- Add `appliesToCategory` string field to DiscountRule for category-based discounts
- Ensure all cascade/set-null behaviors are correct

#### [NEW] [backend/prisma/seed.js](file:///home/zero/Documents/POS/backend/prisma/seed.js)
- Seed demo admin user, sample products, warehouse entries, sample discount rules

#### [MODIFY] [server.js](file:///home/zero/Documents/POS/backend/server.js)
- Import Prisma Client
- Register all API route groups
- Add proper error handler with status codes

---

### Phase 2: Backend API Routes & Controllers

#### [NEW] [middleware/auth.js](file:///home/zero/Documents/POS/backend/middleware/auth.js)
- JWT authentication middleware
- Role-based authorization middleware (`requireRole('admin')`)

#### [NEW] [routes/auth.js](file:///home/zero/Documents/POS/backend/routes/auth.js)
- `POST /api/auth/register` — create user
- `POST /api/auth/login` — login, return JWT
- `GET /api/auth/me` — get current user profile

#### [NEW] [routes/products.js](file:///home/zero/Documents/POS/backend/routes/products.js)
- `GET /api/products` — list all products (with search, category filter)
- `POST /api/products` — create product (admin)
- `PUT /api/products/:id` — update product (admin)
- `DELETE /api/products/:id` — soft-delete product (admin)

#### [NEW] [routes/warehouse.js](file:///home/zero/Documents/POS/backend/routes/warehouse.js)
- `GET /api/warehouse` — list inventory with stock levels
- `PUT /api/warehouse/:productId` — update stock quantity
- `GET /api/warehouse/low-stock` — products below reorder level
- `POST /api/warehouse/adjust` — stock adjustment (in/out)

#### [NEW] [routes/discounts.js](file:///home/zero/Documents/POS/backend/routes/discounts.js)
- `GET /api/discounts` — list active discount rules
- `POST /api/discounts` — create rule (admin)
- `PUT /api/discounts/:id` — update rule (admin)
- `DELETE /api/discounts/:id` — delete rule (admin)
- `POST /api/discounts/apply` — calculate discount for a cart

#### [NEW] [routes/receipts.js](file:///home/zero/Documents/POS/backend/routes/receipts.js)
- `POST /api/receipts` — create sale (process checkout, deduct stock, record cash flow)
- `GET /api/receipts` — list receipts with date range filter
- `GET /api/receipts/:id` — get single receipt with items

#### [NEW] [routes/cashflow.js](file:///home/zero/Documents/POS/backend/routes/cashflow.js)
- `GET /api/cashflow` — list transactions with date filter
- `POST /api/cashflow` — record manual income/expense
- `GET /api/cashflow/summary` — daily/weekly/monthly summary

#### [NEW] [routes/dashboard.js](file:///home/zero/Documents/POS/backend/routes/dashboard.js)
- `GET /api/dashboard` — aggregated stats (today's sales, total revenue, low stock count, recent transactions)

---

### Phase 3: Frontend Application

#### Technology decisions
- **React Router** for client-side routing
- **No UI library** — custom CSS with a premium dark glassmorphism theme
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **Google Fonts (Inter)** for modern typography

#### [MODIFY] [frontend/package.json](file:///home/zero/Documents/POS/frontend/package.json)
- Add: `react-router-dom`, `lucide-react`, `react-hot-toast`, `axios`

#### [MODIFY] [frontend/index.html](file:///home/zero/Documents/POS/frontend/index.html)
- Add Google Fonts (Inter) link
- Update title and meta tags for SEO

#### [MODIFY] [frontend/src/index.css](file:///home/zero/Documents/POS/frontend/src/index.css)
- Complete design system overhaul: dark theme, glassmorphism variables, animations, typography

#### [DELETE] [frontend/src/App.css](file:///home/zero/Documents/POS/frontend/src/App.css)
- Remove default Vite styles

#### [MODIFY] [frontend/src/App.tsx](file:///home/zero/Documents/POS/frontend/src/App.tsx)
- Replace boilerplate with React Router setup and app layout

#### [MODIFY] [frontend/src/main.tsx](file:///home/zero/Documents/POS/frontend/src/main.tsx)
- Wrap with BrowserRouter, add Toaster

#### Frontend Pages & Components:

| File | Purpose |
|------|---------|
| [NEW] `src/context/AuthContext.tsx` | Auth state, login/logout, token management |
| [NEW] `src/api/client.ts` | Axios instance with JWT interceptor |
| [NEW] `src/components/Layout.tsx` | Sidebar navigation + top bar + content area |
| [NEW] `src/components/Sidebar.tsx` | Animated sidebar with nav links and icons |
| [NEW] `src/components/ProtectedRoute.tsx` | Auth guard component |
| [NEW] `src/pages/Login.tsx` | Login page with glassmorphism card |
| [NEW] `src/pages/Dashboard.tsx` | Sales metrics, charts, recent activity |
| [NEW] `src/pages/Products.tsx` | Product CRUD with search/filter, table |
| [NEW] `src/pages/Warehouse.tsx` | Inventory levels, low-stock alerts, stock adjust |
| [NEW] `src/pages/POS.tsx` | **Checkout terminal** — product search, cart, discount application, payment |
| [NEW] `src/pages/Receipts.tsx` | Receipt history with date filter, view/print |
| [NEW] `src/pages/CashFlow.tsx` | Transaction log, manual entry, daily summary |
| [NEW] `src/pages/Discounts.tsx` | Discount rule management (admin) |
| [NEW] `src/components/ReceiptModal.tsx` | Printable receipt preview/print dialog |
| [NEW] `src/components/StatsCard.tsx` | Reusable dashboard metric card |
| [NEW] `src/components/Modal.tsx` | Reusable modal component |
| [NEW] `src/components/Table.tsx` | Reusable styled table |

---

## Key Feature Details

### Conditional Price Discount Engine
The discount system supports:
1. **Percentage discount** — e.g., 10% off
2. **Fixed amount** — e.g., $5 off
3. **Buy One Get One (BOGO)** — buy X get Y free
4. **Minimum quantity** — discount only if qty ≥ threshold
5. **Time-based** — active only between `startsAt` and `endsAt`
6. **Scope** — applies to: all products, specific category, or specific product
7. **Stacking** — best single discount wins (no stacking)

### Receipt System
- Auto-generated receipt number: `RCP-YYYYMMDD-XXXX`
- Printable receipt with store name, items, totals, discounts, tax
- Browser `window.print()` with print-specific CSS
- Receipt history with search by date/number

### Warehouse Management
- Stock quantity per product
- Reorder level alerts (visual indicators when below threshold)
- Stock adjustment log (add/remove stock with reason)
- Stock auto-deducted on sale

### Cash Flow
- Auto-recorded on every sale
- Manual income/expense entries
- Daily/weekly/monthly summaries
- Transaction type filtering (sale, expense, income)

---

## UI Design Direction

- **Dark glassmorphism theme** with deep navy/purple gradients
- **Sidebar layout** with animated hover states
- **Card-based dashboard** with gradient accent borders
- **Smooth page transitions** and micro-animations
- **Responsive** — works on tablets for POS use
- **Print-optimized** receipts with clean B&W layout

---

## Estimated Market Price

> [!NOTE]
> **Pricing Analysis for Selling This POS Application**

| Pricing Model | Price Range | Notes |
|---|---|---|
| **One-time License (Single Store)** | $300 – $800 | Basic deployment, no ongoing support |
| **One-time License (Multi-Store)** | $800 – $2,000 | With multi-user, white-labeling |
| **SaaS Monthly (per store)** | $29 – $79/mo | Hosted, includes updates & support |
| **SaaS Annual (per store)** | $290 – $750/yr | ~15-20% discount vs monthly |
| **Custom Development Fee** | $2,000 – $5,000 | If sold as custom project for a client |

**Recommended strategy**: Sell as a **SaaS at $49/mo per store** or as a **one-time license at $499** with optional $99/year support. At this feature level, it competes with basic POS systems like Square POS (free but takes payment fees) and Loyverse.

---

## Verification Plan

### Automated Tests
1. Install frontend dependencies: `cd frontend && npm install`
2. Install backend dependencies: `cd backend && npm install`
3. Start backend: `node server.js` — verify API responses
4. Start frontend: `npm run dev` — verify UI renders
5. Build check: `cd frontend && npm run build` — ensure no TypeScript errors

### Manual Verification (Browser)
1. Open frontend in browser
2. Login with demo credentials
3. Navigate through all pages (Dashboard, Products, Warehouse, POS, Receipts, Cash Flow, Discounts)
4. Test complete POS flow: add products → apply discount → checkout → view receipt
5. Verify receipt print layout
6. Test responsive layout on tablet viewport

---

## Open Questions

> [!IMPORTANT]
> 1. **Database**: The docker-compose uses MySQL but backend code uses PostgreSQL (`pg`). I plan to **switch everything to MySQL** with Prisma — is that OK? Or do you prefer PostgreSQL?
> 2. **Authentication**: Should the app support multiple stores/users, or is it a single-store system?
> 3. **Currency**: What currency should be displayed? (I'll default to USD `$` but can change)
> 4. **Tax**: Should tax be configurable? Default tax rate?

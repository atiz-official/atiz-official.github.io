# Dr.Ease V4 — Frontend (React + Vite + TS)

Decoupled SPA frontend. Talks to the Laravel backend over a JSON API and is
migrated screen-by-screen from the legacy V3 Laravel blade views. Organised as a
**feature-based** codebase with a **tenant layer** so one server can serve many
shops (multi-tenant).

## Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Routing | react-router-dom 7 (`src/app/router.tsx`) |
| HTTP | axios (`src/services/apiClient.ts`) |
| Charts / calendar | Chart.js + react-chartjs-2 · FullCalendar 6 |
| Styles | SatinGlass tokens (`src/styles/tokens.css`) + reused legacy CSS in `public/css/` |

## Run

```bash
npm install
npm run dev                 # http://localhost:5173 (localhost only)
npm run dev -- --host       # also expose on the LAN (vite.config sets host:true)
npm run build               # tsc -b + production build → dist/
```

Set the backend API origin with `VITE_API_URL` (defaults to `/api`, proxied to
`http://localhost:8000` in dev — see `vite.config.ts`). When `VITE_API_URL` is
unset the tenant loader stays a no-op (uses the fallback tenant), so dev runs
cleanly without a backend.

---

## Project structure

```
src/
├── app/                  composition root — wire-up only, no business logic
│   ├── main.tsx          DOM entry: createRoot(...).render(<App/>)  ← index.html points here
│   ├── app.tsx           <App>: AppProviders → Suspense → RouterProvider
│   ├── providers.tsx     AppProviders — wraps the tree (tenant, …); add providers here
│   └── router.tsx        route table (paths → feature pages, route handle = topbar text)
│
├── features/             one folder per business module (16 modules) — the bulk of the app
│   ├── auth/         pages/LoginPage
│   ├── cockpit/      pages/CockpitPage · data.ts
│   ├── appointments/ pages/AppointmentsPage · components/{AppointmentModal,ApptCalendar}
│   ├── queue/        pages/QueuePage · components/BookingModal
│   ├── checkout/     pages/CheckoutPage
│   ├── customers/    pages/CustomersPage · data.ts
│   ├── courses/      pages/CoursesPage
│   ├── inventory/    pages/InventoryPage · components/MovementCharts
│   ├── reports/      pages/ReportsHubPage · data.ts
│   ├── recall/       pages/RecallPage · data.ts
│   ├── certificate/  pages/CertificatePage
│   ├── opd/          pages/OpdPage · data.ts
│   ├── prescription/ pages/PrescriptionPage · data.ts (+ data.test.ts)
│   ├── bills/        pages/BillsPage · data.ts
│   ├── invoice/      pages/InvoicePage · data.ts
│   └── receipt/      pages/ReceiptPage · data.ts
│
├── shared/               cross-feature building blocks (no business logic)
│   ├── components/   Css.tsx · Dropdown.tsx · ErrorBoundary.tsx
│   ├── layouts/      SatinGlassLayout.tsx · Sidebar.tsx
│   └── utils/        thaiMoney.ts
│
├── services/             how the app talks to the backend
│   ├── apiClient.ts      axios instance (baseURL, bearer token, VITE_API_URL)
│   ├── tenantService.ts  loadTenant() — resolves the active shop at boot
│   ├── authService.ts    login / logout / me (stubs until the API is live)
│   ├── cockpitService.ts fetchGlance() — cockpit dashboard data
│   ├── courseService.ts  course / revenue-recognition data
│   └── patientService.ts patient / customer data
│
├── tenants/              multi-tenant layer (see below)
│   ├── types.ts          TenantConfig · FeatureFlags · FeatureKey
│   ├── defaultTenant.ts  fallback only (empty identity, all features OFF)
│   ├── useTenant.ts      TenantContext + useTenant()
│   ├── TenantProvider.tsx resolves the tenant once at boot, shares via context
│   └── IfFeature.tsx     gate UI by a feature flag (UX only — see warning)
│
├── styles/   tokens.css  base reset + a few globals (NOT the SatinGlass tokens —
│                         those live in public/css/satinglass.css)
└── vite-env.d.ts
```

### The five layers — roles

The codebase is organised into five layers. Each has one job, and the allowed
import direction between them is fixed (`A → B` means "A may import from B").

| Layer | Path | Role |
|---|---|---|
| **App_Layer** | `src/app/` | Composition root. Wire-up only — `main`, `app`, `providers`, `router`. Assembles routes and providers from the other layers; holds no business logic. It is the **only** layer allowed to import from features. |
| **Feature_Module** | `src/features/<module>/` | One business module (auth, cockpit, checkout, …). Owns its `pages/`, module-only `components/`, and `data.ts`. The bulk of the app lives here. |
| **Shared_Layer** | `src/shared/` | Cross-feature building blocks reused by 2+ modules — `components/`, `layouts/`, utils. No business logic, and it never imports from a feature. |
| **Service_Layer** | `src/services/` | The single way the app talks to the backend — `apiClient` (axios instance: baseURL + bearer token) plus `*Service` functions. The only place an external HTTP client is created. |
| **Tenant_Layer** | `src/tenants/` | Multi-tenant support — `TenantProvider`, `useTenant`, `IfFeature`, types, `defaultTenant`. Resolves the active shop and gates UI by feature flag. |

Allowed import direction:

```
app/      → features, shared, services, tenants   (sees everything; top layer)
features/ → shared, services, tenants, own module  (never another feature)
shared/   → shared                                 (never features, never app)
services/ → services, external HTTP (axios)        (never features, never app)
tenants/  → tenants, services                      (never features, never app)
```

`app/` is the only layer that sees every feature, so it can assemble routes and
providers. The lower layers (shared / services / tenants) never see features, and
features never see each other.

### Architecture rules

Two rules are enforced automatically by the linter (`npm run lint`), not just by
convention:

1. **Features must not import other features.** A file in `features/<A>/` may not
   import from `features/<B>/` when `A ≠ B`. Within a module, use relative imports
   (`../components/X`); reach `@/features/*` only from `app/`. Shared code between
   features goes to `shared/`, and shared data access goes to `services/`. This
   keeps a change inside `features/checkout` from reaching into `features/customers`.
2. **All backend access goes through the Service_Layer.** Features must not call an
   external HTTP client (`axios`, `fetch`) directly — they call functions exposed by
   `@/services/*`. `services/apiClient.ts` is the single point that sets `baseURL`
   and the bearer token, so there's one place to control how requests are made.

### Module structure standard

Every `features/<module>/` follows the same internal shape, so you can open any
module and know where things live without guessing:

```
features/<module>/
├── pages/                required — route targets, named <Name>Page.tsx
│   └── <Name>Page.tsx
├── components/           optional — components used only by this module
│   └── <Component>.tsx
└── data.ts               optional — demo / static data for this module
```

- **`pages/<Name>Page.tsx` is required.** Every module has at least one page, and
  it's the route target wired up in `app/router.tsx`.
- **`components/` and `data.ts` are optional.** Add them only when a module has its
  own component(s) or demo data; a module with neither simply omits them. The
  standard defines *where each thing goes when it exists*, not that every module
  must have all three (so modules stay as small as they need to be).

What goes where:

| What you're adding | Where it goes |
|---|---|
| A page (a route target) | `features/<module>/pages/<Name>Page.tsx` |
| A component used by only one module | `features/<module>/components/` |
| Demo / static data for one module | `features/<module>/data.ts` |
| A component used by 2+ modules | `shared/components/` |
| Anything that calls the backend | `services/` |

Cross-layer imports use the `@/` alias (`@/shared/...`, `@/services/...`). Within a
module, use relative imports (`../components/X`) — these conventions are enforced,
see [Architecture_Linter rules](#architecture_linter-rules) below.

### Architecture_Linter rules

The architecture rules above aren't just convention — they're enforced by ESLint
(`eslint.config.js`, run via `npm run lint`), so a violation fails the build. The
rules are split into zones by file path, and each maps to a requirement. Keep this
list in sync with `eslint.config.js` whenever a rule changes.

| Zone (`files` glob) | Rule | What it bans | Requirement |
|---|---|---|---|
| `src/features/**` | no cross-feature imports | importing `@/features/*` (any other module) from inside a feature | **R3** |
| `src/features/**` | backend via service only | importing `axios` / `axios/*`, or using the `fetch` global | **R5** |
| `src/features/**` | no cross-layer climbs | relative imports that climb `../../*` past the module boundary | **R6.4** |
| `src/shared/**`, `src/services/**`, `src/tenants/**` | layer direction | importing from `features/*` (alias or relative) | **R4** |
| `src/shared/**`, `src/services/**`, `src/tenants/**` | no cross-layer climbs | relative imports that climb `../../*` past the layer boundary | **R6.4** |
| `src/**` (other layers: `app/`, `styles/`, root) | no cross-layer climbs | relative imports that climb `../../*` past the layer boundary | **R6.4** |

How the rules work and why:

- **R3 — features must not import other features.** All `@/features/*` paths are
  banned *inside* `features/`. Because within-module imports use relative paths
  (R6.2), any `@/features/*` reference is by definition a cross-module reach and is
  blocked. Share code between features via `shared/`, and shared data access via
  `services/`.
- **R4 — lower layers must not import features.** `shared/`, `services/`, and
  `tenants/` may never import `features/*`. Only `app/` (the composition root) is
  free to import features, so it can assemble routes and providers — `app/` is
  intentionally left out of the features-ban globs.
- **R5 — all backend access goes through the Service_Layer.** Features can't import
  `axios` or call the `fetch` global directly; they call functions exposed by
  `@/services/*`. `services/apiClient.ts` is the single place that sets `baseURL`
  and the bearer token.
- **R6.4 — no relative climbs across a boundary.** A `../../*` relative import
  (climbing two or more levels, past a module or layer boundary) is banned
  everywhere under `src/`; use the `@/` alias instead. Imports within the same
  module/layer stay relative (R6.2).

Each rule reports as an `error` with a message that names the rule, cites the
requirement, and suggests the fix — so you can resolve it without leaving the
editor.

---

## Multi-tenant layer

One server, many shops. The **real** tenant (shopId, name, enabled features,
theme) is loaded from the API at boot — never hardcoded.

```
boot → TenantProvider → services/tenantService.loadTenant()
                          │  GET /tenant/me  (skipped if no VITE_API_URL)
                          ▼
                     TenantContext  ──►  useTenant()  /  <IfFeature>
```

- **`defaultTenant`** is a fail-closed fallback: empty identity, every feature
  `false`. Used before the API resolves, or if it fails. Never put a real shop here.
- **`useTenant()`** reads `{ tenant, loading }` anywhere in the tree.
- **`<IfFeature feature="dental">…</IfFeature>`** shows children only when the
  tenant has that flag on.
- **`businessType: 'clinic' | 'service'`** lines up with the dual-product split
  (Dr.Ease clinic vs Ease POS — see `CLAUDE.md` §18), ready to drive theme/flags.

> ⚠️ **`IfFeature` is UX, not security.** It only hides UI — a user can still call
> the API directly. The backend MUST validate the same flag on every request.
> **Frontend gate = UX · Backend gate = Security.**

To add a flag: add it to `FeatureFlags` in `tenants/types.ts`, default it `false`
in `defaultTenant.ts`, and have the backend return it from `/tenant/me`.

---

## Styling

- **`<Css href="/css/<file>.css" />`** (`shared/components/Css`) loads a page's
  CSS. It renders a React 19 `<link rel="stylesheet" precedence>` which hoists to
  `<head>`, dedupes by href, and *suspends* until loaded — so there's no flash of
  unstyled content (the `<Suspense>` in `app/app.tsx` holds the commit). Render it
  at the top of a page; it can even render while the component is "closed" (modals
  do this so opening is instant).
- **`public/css/`** holds the legacy SatinGlass design system + one CSS file per
  page (`cockpit.css`, `customers.css`, …). These are served as static assets
  (Vite's `publicDir` is the legacy `public/`), so legacy paths keep working.
- **`src/styles/tokens.css`** is only a base reset. The SatinGlass design tokens
  (`--sg-*`) are owned by `public/css/satinglass.css` — don't redefine them.
- React 19 keeps a page's stylesheet in `<head>` after the page unmounts, so an
  **unscoped** page rule can leak across SPA navigation. Scope full-page layout
  rules with `:has()` (e.g. `.sg-workspace:has(> .co-layout) { … }`).
- **Modals** render via `createPortal(…, document.body)` to escape `sg-main`'s
  `overflow:hidden` clip (CLAUDE.md §9.2).

---

## Adding a feature / page

Follow these steps to add a page or module that conforms to the
[module structure standard](#module-structure-standard) and passes the
[Architecture_Linter rules](#architecture_linter-rules):

1. Create the page at `src/features/<module>/pages/<Name>Page.tsx` — this is the
   required route target. Add `components/` (module-only components) and `data.ts`
   (demo/static data) only if the module needs them.
2. Keep imports within the rules:
   - Within the module, use **relative** imports (`../components/X`, `./data`).
   - Reach other layers via the **`@/` alias** (`@/shared/...`, `@/services/...`,
     `@/tenants/...`) — never `../../`.
   - Do **not** import another feature (`@/features/<other>`); promote shared code
     to `shared/` and shared backend access to `services/` instead.
3. Talk to the backend only through the Service_Layer: call functions from
   `@/services/*` (built on `services/apiClient.ts`). Don't import `axios` or use
   `fetch` directly inside a feature.
4. Reuse its legacy CSS: extract the blade's `<style>` to `public/css/<page>.css`
   and load it with `<Css href="/css/<page>.css" />`.
5. Register the route in `src/app/router.tsx` (the only layer that may import
   `@/features/*`) with a `handle: { title, subtitle }` — drives the topbar text
   via `useMatches`.
6. Use shared building blocks: `@/shared/components/Dropdown` (glass single/multi
   select), `@/shared/layouts/SatinGlassLayout` shell, etc.
7. Run `npm run lint` to confirm the module respects the architecture rules.

### Strangler-fig migration

The legacy Laravel `public/` is reused as Vite's static dir, so every legacy asset
path (`/css/…`, `/img/…`, `/fonts/…`) keeps working unchanged. That lets us port
one blade page at a time without rewriting asset URLs. Source blades live under
`resources/views/**` and are kept as reference until a page is fully ported.

---

## Routes (pages ported)

All under the SatinGlass layout unless noted. `/login` is standalone; `/`
redirects to `/cockpit`. The route `handle: { title, subtitle }` drives the
topbar text.

| Route | Feature |
|---|---|
| `/login` | `features/auth` — glass login + email-OTP flow |
| `/cockpit` | `features/cockpit` — owner mission control (clinic view) |
| `/reports` | `features/reports` — reports hub (search + category + recency) |
| `/customers` | `features/customers` — master-detail + AI recommendation engine |
| `/checkout` | `features/checkout` — POS with deep-link presets |
| `/queue` | `features/queue` — OPD kanban + consult (SOAP) + in-queue checkout |
| `/summarystock` | `features/inventory` — KPI + alerts + tables + movement charts |
| `/show-appointment` | `features/appointments` — day diary + week/month calendar + add-appointment modal |
| `/course-summary` | `features/courses` — TFRS 15 revenue-recognition |
| `/v3/certificate/new` | `features/certificate` — template library + AI-fill editor |
| `/recall` | `features/recall` — filter grid + broadcast modal |
| `/v3/opd/:hn` | `features/opd` — medical record · SOAP note + diagnosis |
| `/v3/prescription/:vn` | `features/prescription` — prescription · automatic allergy check |
| `/bills` | `features/bills` — payment history · search by date range / doctor |
| `/v3/invoice/:billId` | `features/invoice` — invoice / billing note · A4 print |
| `/v3/receipt/:billId` | `features/receipt` — receipt / tax invoice · A4 print |

Demo data lives in `features/<x>/data.ts` until the backend API endpoints exist.

### Not yet ported

The POS (`body.ease-pos`, bottom tabs) product variant; many secondary legacy
pages (settings, dental, rehab, doctorfee, …); AI Dock modal
(Cmd+K), global search, and i18n switching.

---

## Legacy reference (kept until fully ported, then deletable)

- `resources/views/**` — blade source for porting
- `public/css/**`, `public/js/**` — design system + assets
- `CLAUDE.md`, `docs/**`, wireframe `*.html` — product / design context

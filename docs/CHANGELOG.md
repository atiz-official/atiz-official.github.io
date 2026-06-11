# Changelog — Drease v4 (รวม)

รวม git log ของทั้ง 2 โปรเจ็คในตารางเดียว (ล่าสุดอยู่บนสุด) — generate ด้วย `scripts\update-log.ps1`
แยกรายโปรเจ็ค: [Backend](CHANGELOG-backend.md) | [Frontend](CHANGELOG-frontend.md)

_อัปเดตล่าสุด: 2026-06-11 13:15_

| วันที่-เวลา | โปรเจ็ค | Hash | ผู้แก้ | Branch | รายละเอียด |
|---|---|---|---|---|---|
| 2026-06-11 13:13 | Backend | `bfce954` | tanyarat-atiz | `feat/auth-complete` | Merge remote-tracking branch 'origin/master' into feat/auth-complete |
| 2026-06-11 12:55 | Backend | `6e42136` | tanyarat-atiz | `feat/auth-complete` | feat(tenant): clinic_code isolation - migration 0039, JWT claim, TenantScope, Phase 1 query scoping |
| 2026-06-11 10:43 | Frontend | `2842299` | AomDev | `master` | test: frontend push should appear on the website automatically |
| 2026-06-11 10:41 | Frontend | `01d51d1` | AomDev | `master` | ci: print HTTP status + response in notify workflow for debugging |
| 2026-06-11 10:38 | Backend | `cbbb518` | AomDev | `master` | ci: print HTTP status + response in notify workflow for debugging |
| 2026-06-11 10:34 | Backend | `6b7b9c5` | AomDev | `master` | test: verify notify-to-website pipeline end to end |
| 2026-06-11 10:29 | Frontend | `e5a2723` | AomDev | `master` | merge: frontend/react-spa-scaffold -> master (recall rebuild + reports batch 1-2) |
| 2026-06-11 10:28 | Frontend | `fa5cce3` | tanyarat-atiz | `frontend/react-spa-scaffold` | feat(recall): rebuild Recall page with scene KPI cards + filter grid (v3 layout) + reports polish |
| 2026-06-11 10:24 | Backend | `c96819c` | AomDev | `master` | test: trigger realtime docs pipeline |
| 2026-06-11 10:23 | Frontend | `8963a18` | AomDev | `frontend/react-spa-scaffold` | ci: remove notify workflow from this branch |
| 2026-06-11 10:21 | Frontend | `0892a71` | AomDev | `frontend/react-spa-scaffold` | ci: notify control repo on every push |
| 2026-06-11 10:21 | Frontend | `222e9f6` | AomDev | `master` | ci: notify control repo on every push |
| 2026-06-11 10:20 | Backend | `b247287` | AomDev | `master` | ci: notify control repo on every push |
| 2026-06-10 17:58 | Backend | `95a9e64` | FormDev | `master` | Revert "remove Redis" |
| 2026-06-10 14:13 | Frontend | `d87dc63` | tanyarat-atiz | `frontend/react-spa-scaffold` | feat(reports): port batch 2 part 1 — operative, payment, appointment-stats, import |
| 2026-06-10 13:48 | Frontend | `19de761` | tanyarat-atiz | `frontend/react-spa-scaffold` | docs(spec): add feature-based-restructure + reports-pages-port specs |
| 2026-06-10 13:31 | Frontend | `fe05bcb` | tanyarat-atiz | `frontend/react-spa-scaffold` | feat(reports): fix 404 navigation + port batch 1 (oldbill/commission/df-report) |
| 2026-06-10 13:30 | Frontend | `de2833f` | tanyarat-atiz | `frontend/react-spa-scaffold` | refactor(architecture): enforce feature boundaries via ESLint + import alias standard |
| 2026-06-10 10:21 | Backend | `5fc3b7c` | FormDev | `master` | remove Redis |
| 2026-06-09 17:57 | Frontend | `6ec3485` | tanyarat-atiz | `frontend/react-spa-scaffold` | chore(frontend): prod API guard, Error Boundary, ESLint + Vitest |
| 2026-06-09 17:32 | Frontend | `e280eda` | tanyarat-atiz | `frontend/react-spa-scaffold` | fix(security): use crypto.randomUUID for the checkout idempotency key |
| 2026-06-09 17:01 | Backend | `b14c780` | FormDev | `master` | Fix: name of DB, table and code ref |
| 2026-06-09 16:54 | Frontend | `711c3e3` | tanyarat-atiz | `frontend/react-spa-scaffold` | feat(api): wire cockpit live revenue to backend glance |
| 2026-06-09 16:40 | Frontend | `fea3fb4` | tanyarat-atiz | `master` | feat(api): wire เพิ่มนัด modal customer search to backend |
| 2026-06-09 15:57 | Frontend | `79ef6ea` | tanyarat-atiz | `master` | feat(receipt): port medical receipt + share Thai money helpers (Tier 1) |
| 2026-06-09 15:33 | Frontend | `1db9a09` | tanyarat-atiz | `master` | feat(api): wire checkout service catalog to live courses |
| 2026-06-09 15:10 | Frontend | `01c9bb1` | tanyarat-atiz | `master` | feat(invoice): port medical invoice / ใบแจ้งหนี้ print template (Tier 1) |
| 2026-06-09 14:59 | Frontend | `9c5c462` | tanyarat-atiz | `master` | feat(bills): port payment-history dashboard (Tier 1) |
| 2026-06-09 14:43 | Frontend | `5d62ea5` | tanyarat-atiz | `master` | feat(prescription): port drug order + allergy family-check (Tier 1) |
| 2026-06-09 14:19 | Frontend | `828e694` | tanyarat-atiz | `master` | feat(api): connect frontend to the Go backend (live patient search) |
| 2026-06-09 14:00 | Frontend | `5260559` | tanyarat-atiz | `master` | feat(opd): port OPD / SOAP note editor from blade (Tier 1) |
| 2026-06-09 13:36 | Frontend | `db7a782` | tanyarat-atiz | `master` | docs(frontend): rewrite for feature-based + tenant architecture |
| 2026-06-09 13:35 | Frontend | `12d5982` | tanyarat-atiz | `master` | chore: remove legacy clutter (mockups, screenshots, CHATGPT.md) |
| 2026-06-09 13:27 | Backend | `6178d34` | FormDev | `feat/auth-complete` | first commit |
| 2026-06-09 10:45 | Frontend | `edfd80a` | tanyarat-atiz | `master` | refactor(architecture): Phase 3 — move entry into app/ (router, main, split App) |
| 2026-06-09 10:35 | Frontend | `426b0af` | tanyarat-atiz | `master` | refactor(architecture): Phase 2 — move pages/data into features/ |
| 2026-06-09 10:26 | Frontend | `e88ce68` | tanyarat-atiz | `master` | refactor(architecture): Phase 0+1 — tenant layer + shared module |
| 2026-06-08 15:28 | Frontend | `ef79073` | AomDev | `master` | feat(frontend): unified glass Dropdown + full เพิ่มนัด modal + appointment polish |
| 2026-06-08 13:14 | Frontend | `9b95174` | AomDev | `master` | fix(css): scope full-height page rules so they don't leak across SPA navigation |
| 2026-06-08 13:02 | Frontend | `affed33` | AomDev | `master` | chore(docs): remove V3 backend docs + handover-logging instructions |
| 2026-06-08 12:33 | Frontend | `d664228` | AomDev | `master` | fix(tokens): stop overriding satinglass design tokens with stale values |
| 2026-06-08 12:19 | Frontend | `ff4724e` | AomDev | `master` | feat(queue): wire booking modal — "+ รับคนไข้ใหม่" was a dead button |
| 2026-06-08 12:13 | Frontend | `f10ccb6` | AomDev | `master` | fix(perf): eliminate FOUC — load CSS via React 19 <link precedence> not async |
| 2026-06-08 11:55 | Frontend | `7bc0aa1` | AomDev | `master` | fix(cockpit): repair AI-bar/chips overlap — ai-bar.css extracted mid-comment |
| 2026-06-08 11:44 | Frontend | `47c6f02` | AomDev | `master` | feat(frontend): group A sub-features — Queue SOAP+checkout, calendar, charts, OTP |
| 2026-06-08 11:18 | Frontend | `35d335a` | AomDev | `master` | fix(cockpit): use real CockpitController demo data + restore AI bar/chips |
| 2026-06-08 10:53 | Frontend | `eec4a9a` | AomDev | `master` | feat(frontend): port Appointments, Courses, Certificate, Recall |
| 2026-06-08 10:43 | Frontend | `e4bae9b` | AomDev | `master` | feat(frontend): port Inventory (/summarystock) + update FRONTEND.md |
| 2026-06-08 10:38 | Frontend | `1e9ef7a` | AomDev | `master` | feat(frontend): port OPD Queue kanban (/queue) |
| 2026-06-08 10:35 | Frontend | `72a7825` | AomDev | `master` | feat(frontend): port Reports Hub, Customers (AI rec), Checkout |
| 2026-06-08 10:19 | Frontend | `d1a3d32` | AomDev | `master` | feat(frontend): scaffold React+Vite+TS SPA; port login + cockpit; drop Laravel backend |
| 2026-06-05 19:41 | Frontend | `fa5dd6c` | FormDev | `master` | dreasev3-handoff |

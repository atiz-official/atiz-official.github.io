# Changelog — Frontend ([repo](https://github.com/atiz-official/drease-v4-frontend))

_อัปเดตล่าสุด: 2026-06-11 15:28_ — กลับไป [ตารางรวม](CHANGELOG.md)

| วันที่-เวลา | Hash | ผู้แก้ | Branch | รายละเอียด |
|---|---|---|---|---|
| 2026-06-11 15:19 | `6903b20` | tanyarat-atiz | `frontend/react-spa-scaffold` | feat(auth): attach X-App-Key app card to every API request |
| 2026-06-11 10:43 | `2842299` | AomDev | `master` | test: frontend push should appear on the website automatically |
| 2026-06-11 10:41 | `01d51d1` | AomDev | `master` | ci: print HTTP status + response in notify workflow for debugging |
| 2026-06-11 10:29 | `e5a2723` | AomDev | `master` | merge: frontend/react-spa-scaffold -> master (recall rebuild + reports batch 1-2) |
| 2026-06-11 10:28 | `fa5cce3` | tanyarat-atiz | `frontend/react-spa-scaffold` | feat(recall): rebuild Recall page with scene KPI cards + filter grid (v3 layout) + reports polish |
| 2026-06-11 10:23 | `8963a18` | AomDev | `frontend/react-spa-scaffold` | ci: remove notify workflow from this branch |
| 2026-06-11 10:21 | `0892a71` | AomDev | `frontend/react-spa-scaffold` | ci: notify control repo on every push |
| 2026-06-11 10:21 | `222e9f6` | AomDev | `master` | ci: notify control repo on every push |
| 2026-06-10 14:13 | `d87dc63` | tanyarat-atiz | `frontend/react-spa-scaffold` | feat(reports): port batch 2 part 1 — operative, payment, appointment-stats, import |
| 2026-06-10 13:48 | `19de761` | tanyarat-atiz | `frontend/react-spa-scaffold` | docs(spec): add feature-based-restructure + reports-pages-port specs |
| 2026-06-10 13:31 | `fe05bcb` | tanyarat-atiz | `frontend/react-spa-scaffold` | feat(reports): fix 404 navigation + port batch 1 (oldbill/commission/df-report) |
| 2026-06-10 13:30 | `de2833f` | tanyarat-atiz | `frontend/react-spa-scaffold` | refactor(architecture): enforce feature boundaries via ESLint + import alias standard |
| 2026-06-09 17:57 | `6ec3485` | tanyarat-atiz | `frontend/react-spa-scaffold` | chore(frontend): prod API guard, Error Boundary, ESLint + Vitest |
| 2026-06-09 17:32 | `e280eda` | tanyarat-atiz | `frontend/react-spa-scaffold` | fix(security): use crypto.randomUUID for the checkout idempotency key |
| 2026-06-09 16:54 | `711c3e3` | tanyarat-atiz | `frontend/react-spa-scaffold` | feat(api): wire cockpit live revenue to backend glance |
| 2026-06-09 16:40 | `fea3fb4` | tanyarat-atiz | `master` | feat(api): wire เพิ่มนัด modal customer search to backend |
| 2026-06-09 15:57 | `79ef6ea` | tanyarat-atiz | `master` | feat(receipt): port medical receipt + share Thai money helpers (Tier 1) |
| 2026-06-09 15:33 | `1db9a09` | tanyarat-atiz | `master` | feat(api): wire checkout service catalog to live courses |
| 2026-06-09 15:10 | `01c9bb1` | tanyarat-atiz | `master` | feat(invoice): port medical invoice / ใบแจ้งหนี้ print template (Tier 1) |
| 2026-06-09 14:59 | `9c5c462` | tanyarat-atiz | `master` | feat(bills): port payment-history dashboard (Tier 1) |
| 2026-06-09 14:43 | `5d62ea5` | tanyarat-atiz | `master` | feat(prescription): port drug order + allergy family-check (Tier 1) |
| 2026-06-09 14:19 | `828e694` | tanyarat-atiz | `master` | feat(api): connect frontend to the Go backend (live patient search) |
| 2026-06-09 14:00 | `5260559` | tanyarat-atiz | `master` | feat(opd): port OPD / SOAP note editor from blade (Tier 1) |
| 2026-06-09 13:36 | `db7a782` | tanyarat-atiz | `master` | docs(frontend): rewrite for feature-based + tenant architecture |
| 2026-06-09 13:35 | `12d5982` | tanyarat-atiz | `master` | chore: remove legacy clutter (mockups, screenshots, CHATGPT.md) |
| 2026-06-09 10:45 | `edfd80a` | tanyarat-atiz | `master` | refactor(architecture): Phase 3 — move entry into app/ (router, main, split App) |
| 2026-06-09 10:35 | `426b0af` | tanyarat-atiz | `master` | refactor(architecture): Phase 2 — move pages/data into features/ |
| 2026-06-09 10:26 | `e88ce68` | tanyarat-atiz | `master` | refactor(architecture): Phase 0+1 — tenant layer + shared module |
| 2026-06-08 15:28 | `ef79073` | AomDev | `master` | feat(frontend): unified glass Dropdown + full เพิ่มนัด modal + appointment polish |
| 2026-06-08 13:14 | `9b95174` | AomDev | `master` | fix(css): scope full-height page rules so they don't leak across SPA navigation |
| 2026-06-08 13:02 | `affed33` | AomDev | `master` | chore(docs): remove V3 backend docs + handover-logging instructions |
| 2026-06-08 12:33 | `d664228` | AomDev | `master` | fix(tokens): stop overriding satinglass design tokens with stale values |
| 2026-06-08 12:19 | `ff4724e` | AomDev | `master` | feat(queue): wire booking modal — "+ รับคนไข้ใหม่" was a dead button |
| 2026-06-08 12:13 | `f10ccb6` | AomDev | `master` | fix(perf): eliminate FOUC — load CSS via React 19 <link precedence> not async |
| 2026-06-08 11:55 | `7bc0aa1` | AomDev | `master` | fix(cockpit): repair AI-bar/chips overlap — ai-bar.css extracted mid-comment |
| 2026-06-08 11:44 | `47c6f02` | AomDev | `master` | feat(frontend): group A sub-features — Queue SOAP+checkout, calendar, charts, OTP |
| 2026-06-08 11:18 | `35d335a` | AomDev | `master` | fix(cockpit): use real CockpitController demo data + restore AI bar/chips |
| 2026-06-08 10:53 | `eec4a9a` | AomDev | `master` | feat(frontend): port Appointments, Courses, Certificate, Recall |
| 2026-06-08 10:43 | `e4bae9b` | AomDev | `master` | feat(frontend): port Inventory (/summarystock) + update FRONTEND.md |
| 2026-06-08 10:38 | `1e9ef7a` | AomDev | `master` | feat(frontend): port OPD Queue kanban (/queue) |
| 2026-06-08 10:35 | `72a7825` | AomDev | `master` | feat(frontend): port Reports Hub, Customers (AI rec), Checkout |
| 2026-06-08 10:19 | `d1a3d32` | AomDev | `master` | feat(frontend): scaffold React+Vite+TS SPA; port login + cockpit; drop Laravel backend |
| 2026-06-05 19:41 | `fa5dd6c` | FormDev | `master` | dreasev3-handoff |

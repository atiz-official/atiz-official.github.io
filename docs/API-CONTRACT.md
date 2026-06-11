# API Contract — Drease v4

ตารางกลางบอกว่า endpoint ไหน **backend มีแล้ว / frontend เรียกแล้ว / เชื่อมถึงกันหรือยัง** — ครบทุกเส้น
อัปเดตด้วยมือเมื่อมีการเพิ่ม route (backend: `internal/router/router.go`, frontend: `src/services/*.ts`)

_อัปเดตล่าสุด: 2026-06-11 — backend @`3a9f333` (`feat/auth-complete` — auth สองชั้น X-App-Key + JWT และ rate limit ครบทุกเส้น, PR #2 รอ merge), frontend @`6903b20` (`frontend/react-spa-scaffold` — แนบ X-App-Key แล้ว)_

สถานะ: ✅ เชื่อมแล้ว | 🟡 backend มีแต่ frontend ยังไม่เรียก | 🔴 frontend เรียกแต่ backend ยังไม่มี

Auth (ระบบสองบัตร — ดูรายละเอียด [API-FLOW.md](API-FLOW.md)):
- `public` — ไม่ต้องส่งอะไร (เฉพาะ health check)
- `app-key` — ส่ง `X-App-Key` (บัตรแอป ใบที่ 1) — เส้นสาธารณะที่เรียกจากแอปของเราเท่านั้น
- `URL-token` — ลิงก์จากอีเมล/LINE ที่ auth ฝังใน URL (ส่ง header ไม่ได้)
- `JWT` — ส่ง **สองบัตร**: `X-App-Key` + `Authorization: Bearer <token>` | `JWT+perm` ต้องมีสิทธิ์เพิ่ม

Rate limit: กลุ่มเดารหัส (login/reset/OTP) 10 ครั้ง/นาที/IP แชร์ร่วมกัน · เส้น app-key อื่น 120/นาที/IP · เส้น JWT 300/นาที/**user** — เกินได้ `429` + `Retry-After`

> ⚠️ ช่วง rollout: `APP_AUTH_ENFORCE=false` (log-only) — ยังไม่บังคับ `X-App-Key` จนกว่า frontend จะส่ง header ครบทุกตัว (`AUTH_ENFORCE` คุมชั้น JWT แบบเดียวกัน)

## Health / ระบบ

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| 🟡 | GET | `/` | public | root (Health.Root) |
| 🟡 | GET | `/healthz` | public | health check — ใช้เช็คว่า API ขึ้นแล้ว |
| 🟡 | POST | `/v3/error-log` | app-key | telemetry: รับ error log จาก client |

## Auth / Login

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| 🔴 | POST | `/auth/login` | public | frontend (`authService.ts`) เรียก แต่ backend ทำไว้ที่ `POST /login` — **path ไม่ตรงกัน ต้องเคาะว่าใครย้าย** |
| 🔴 | POST | `/auth/logout` | JWT | frontend เรียก แต่ backend ทำไว้ที่ `POST /logout` |
| 🔴 | GET | `/auth/me` | JWT | frontend ใช้เช็ค session — backend ยังไม่มี |
| 🔴 | GET | `/tenant/me` | JWT | frontend (`tenantService.ts`) ใช้โหลด config คลินิก — backend ยังไม่มี |
| 🟡 | POST | `/login` | app-key | backend มีแล้ว (Auth.PostLogin, โควต้าเดารหัส 10 ครั้ง/นาที/IP) แต่ frontend เรียก `/auth/login` |
| 🟡 | POST | `/logout` | app-key | backend มีแล้ว (Auth.PostLogout) |
| 🟡 | GET | `/api/login/:user/:pass` | app-key | login แบบ legacy API (โควต้าเดารหัสร่วมกับ /login) |
| 🟡 | GET | `/api/test/login/:user/:pass` | app-key | login ทดสอบ (โควต้าเดารหัสร่วมกับ /login) |

## Patient (`/api/*` — Node API เดิม)

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| ✅ | GET | `/api/patient/search` | JWT | ค้นหาคนไข้ — ใช้โดย `patientService.ts` (live patient search) |
| 🟡 | GET | `/api/patient/findbyhn/:hn` | JWT | หาคนไข้จาก HN |
| 🟡 | GET | `/api/patient/lasthn` | JWT | HN ล่าสุด (ใช้ตอนสร้างคนไข้ใหม่) |

## Course (`/api/*` — Node API เดิม)

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| ✅ | GET | `/api/course/item` | JWT | service catalog หน้า checkout — ใช้โดย `courseService.ts` |
| 🟡 | GET | `/api/course/search/item` | JWT | ค้นหาคอร์ส |
| 🟡 | GET | `/api/course/find/itembyid` | JWT | หาคอร์สจาก id |

## Stock (`/api/*` — Node API เดิม)

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| 🟡 | GET | `/api/stock/all` | JWT | รายการสต๊อกทั้งหมด |
| 🟡 | PUT | `/api/stock/active` | JWT | เปิด/ปิดการใช้งานรายการ |

## Cockpit / Dashboard

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| ✅ | GET | `/v3/pos/glance` | JWT | live revenue หน้า cockpit — ใช้โดย `cockpitService.ts` |
| 🟡 | GET | `/v3/money/breakdown` | JWT | breakdown รายได้ |
| 🟡 | GET | `/cockpit` | JWT | หน้า cockpit (ฝั่ง server) |

## Billing / POS

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| 🟡 | POST | `/v3/checkout` | JWT | จ่ายเงิน — frontend มีหน้า checkout แล้วแต่ยังไม่ wire |

## Queue / OPD

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| 🟡 | POST | `/v3/queue/transition` | JWT | ย้ายสถานะคิว (kanban) |
| 🟡 | GET | `/v3/queue/state` | JWT | สถานะคิวปัจจุบัน |
| 🟡 | POST | `/v3/opd/diagnosis` | JWT | บันทึก diagnosis |
| 🟡 | GET | `/v3/opd/diagnoses/:vn` | JWT | ประวัติ diagnosis ตาม VN |

## Deposit / มัดจำ

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| 🟡 | POST | `/v3/deposit/create` | JWT | สร้างมัดจำ |
| 🟡 | GET | `/v3/deposit/balance/:hn` | JWT | ยอดมัดจำคงเหลือของคนไข้ |
| 🟡 | POST | `/v3/deposit/apply` | JWT | ใช้มัดจำตัดยอด |
| 🟡 | GET | `/v3/deposit/policy` | JWT | นโยบายมัดจำ |

## Recall

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| 🟡 | POST | `/v3/recall/broadcast` | JWT | ส่ง broadcast recall |
| 🟡 | GET | `/v3/recall/scene-counts` | JWT | จำนวนคนไข้แต่ละ scene |

## Doctor Fee / ค่ามือแพทย์

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| 🟡 | GET | `/v3/doctor-fee` | JWT+perm `doctor_fee.view` | console ค่ามือแพทย์ |
| 🟡 | POST | `/v3/doctor-fee/save` | JWT+perm `doctor_fee.edit` | บันทึก rule |

## สรุป

| | จำนวน |
|---|---|
| ✅ เชื่อมแล้ว | 3 |
| 🟡 backend มี รอ frontend | 28 |
| 🔴 frontend เรียก แต่ backend ยังไม่มี | 4 |

ที่ต้องเคาะก่อนเพื่อน: กลุ่ม 🔴 ทั้ง 4 เส้น (auth + tenant) เพราะตอนนี้ login จริงผ่าน backend ยังใช้ไม่ได้

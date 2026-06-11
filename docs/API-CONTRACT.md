# API Contract — Drease v4

ตารางกลางบอกว่า endpoint ไหน **backend มีแล้ว / frontend เรียกแล้ว / เชื่อมถึงกันหรือยัง** — ครบทุกเส้น
อัปเดตด้วยมือเมื่อมีการเพิ่ม route (backend: `internal/router/router.go`, frontend: `src/services/*.ts`)

_อัปเดตล่าสุด: 2026-06-11 — backend @`8d93bc7` (merge feat/auth-complete — route ไม่เปลี่ยน แต่ JWT พก claim `clinic` แล้ว), frontend @`e5a2723` (master)_

สถานะ: ✅ เชื่อมแล้ว | 🟡 backend มีแต่ frontend ยังไม่เรียก | 🔴 frontend เรียกแต่ backend ยังไม่มี

Auth: `public` ไม่ต้อง login | `JWT` ต้องแนบ token | `JWT+perm` ต้องมีสิทธิ์เพิ่ม | `throttle` จำกัด 10 ครั้ง/นาที

## Health / ระบบ

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| 🟡 | GET | `/` | public | root (Health.Root) |
| 🟡 | GET | `/healthz` | public | health check — ใช้เช็คว่า API ขึ้นแล้ว |
| 🟡 | POST | `/v3/error-log` | public | telemetry: รับ error log จาก client |

## Auth / Login

| สถานะ | Method | Path | Auth | หมายเหตุ |
|---|---|---|---|---|
| 🔴 | POST | `/auth/login` | public | frontend (`authService.ts`) เรียก แต่ backend ทำไว้ที่ `POST /login` — **path ไม่ตรงกัน ต้องเคาะว่าใครย้าย** |
| 🔴 | POST | `/auth/logout` | JWT | frontend เรียก แต่ backend ทำไว้ที่ `POST /logout` |
| 🔴 | GET | `/auth/me` | JWT | frontend ใช้เช็ค session — backend ยังไม่มี |
| 🔴 | GET | `/tenant/me` | JWT | frontend (`tenantService.ts`) ใช้โหลด config คลินิก — backend ยังไม่มี |
| 🟡 | POST | `/login` | throttle | backend มีแล้ว (Auth.PostLogin, จำกัด 10 ครั้ง/นาที/IP) แต่ frontend เรียก `/auth/login` |
| 🟡 | POST | `/logout` | public | backend มีแล้ว (Auth.PostLogout) |
| 🟡 | GET | `/api/login/:user/:pass` | throttle | login แบบ legacy API |
| 🟡 | GET | `/api/test/login/:user/:pass` | throttle | login ทดสอบ |

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

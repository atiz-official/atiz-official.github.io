# Backend — โครงสร้างเชิงลึก (Go)

เอกสารนี้อธิบายโครงสร้างภายในของ `drease-v4-backend` ให้คนที่ดู control repo เข้าใจว่าหลังบ้านวางโครงยังไง ทำงานทีละขั้นยังไง และมีตารางฐานข้อมูลอะไรบ้าง — สำหรับรายการ endpoint ดู [API-CONTRACT.md](API-CONTRACT.md)

_อัปเดตล่าสุด: 2026-06-11 — อิงโค้ดที่ commit `8d93bc7` (merge PR #1 `feat/auth-complete`)_

## การเปลี่ยนแปลงสำคัญล่าสุด (จาก log ทุก branch)

| เมื่อ | อะไร | ผล |
|---|---|---|
| 2026-06-11 | **PR #1 `feat/auth-complete` ถูก merge เข้า master** | ระบบ tenant isolation: เพิ่มคอลัมน์ `clinic_code` ในตาราง tenant ทั้งหมด (migration 0039), JWT พก claim `clinic`, middleware `TenantScope` |
| 2026-06-10 | Revert "remove Redis" | **Redis 7 กลับมาอยู่ใน stack** (เคยถูกถอดออกไปวันเดียว) |
| 2026-06-09 | เปลี่ยนชื่อ DB | ฐานข้อมูลชื่อ `drease_temporary` และตารางตัด prefix `v3_` ออกหมดแล้ว |

## Stack

| ส่วน | ใช้อะไร |
|---|---|
| ภาษา / Framework | Go 1.25 + Gin |
| Database | PostgreSQL 16 (ผ่าน pgx v5) — DB ชื่อ `drease_temporary` |
| Cache | Redis 7 |
| Migration | golang-migrate — 39 migrations (รันอัตโนมัติตอน `docker compose up`) |
| Query layer | sqlc — เขียน SQL ใน `internal/db/query` → generate Go ไป `internal/db/gen` |
| Auth | JWT (claims: user id, email, name, **clinic**) |

## โครงสร้างโฟลเดอร์

```
cmd/api/main.go      จุดเริ่มโปรแกรม — ประกอบทุกอย่างแล้วสตาร์ท server
internal/
  router/            ทะเบียน route ทั้งหมดไว้ที่เดียว (router.go ไฟล์เดียว ตั้งใจให้เห็นแผนที่ API ครบ)
  controller/        แยกตามโดเมน 13 ตัว: auth, patient, appointment, billing, clinical,
                     cockpit, course, deposit, doctorfee, recall, stock, telemetry, health
  middleware/        Recovery, Logger, CORS, Auth (JWT), TenantScope, Perm, Throttle
  authtoken/         ออก/ตรวจ JWT — payload มี ClinicCode (claim "clinic")
  db/                migrations/ + query/ (SQL ต้นฉบับ) + gen/ (โค้ดที่ sqlc สร้าง) + pool.go
  apperr/            มาตรฐาน error ของทั้งระบบ
  httpx/             ตัวช่วยตอบ JSON ให้ฟอร์แมตเดียวกันทุกเส้น
  pgkit/             ตัวช่วยแปลงชนิดข้อมูล Postgres
  config/            อ่านค่า env (.env)
```

## การทำงานทีละขั้นตอน (request flow)

ทุก request ที่เข้ามาเดินตามนี้:

```
1) Request เข้า Gin
2) Recovery → Logger → CORS          (middleware ทั่วไป: กัน panic, จด log, อนุญาต cross-origin)
3) Auth                              ตรวจ JWT จาก header — แกะ claims ออกมา (ใคร, คลินิกไหน)
4) TenantScope                       ดึง clinic_code จาก claim ฝังไว้ใน context
                                     → ทุก query หลังจากนี้เห็นเฉพาะข้อมูลคลินิกตัวเอง
5) Perm (เฉพาะบางเส้น)               ตรวจสิทธิ์ เช่น doctor_fee.view / doctor_fee.edit
6) Controller                        รับ request → validate → เรียก query
7) sqlc query (internal/db/gen)      คุย PostgreSQL แบบ type-safe
8) ตอบกลับผ่าน httpx                  JSON ฟอร์แมตเดียวกัน / ผิดพลาดผ่าน apperr
```

จุดที่ควรรู้:
- **Tenant isolation (ใหม่):** migration 0039 เพิ่ม `clinic_code` + index ให้ตารางข้อมูลคลินิกทุกตัว (backfill จาก `branch_code` เดิม) — เป้าหมายคือหลายคลินิกใช้ DB เดียวกันโดยมองไม่เห็นข้อมูลกันข้ามคลินิก
- Route แบ่ง 3 กลุ่ม: public (login, healthz, error-log), authed `/v3/*` (งานคลินิก), `/api/*` (ของเดิมจาก Node service ย้ายมารันในตัว)
- login แบบ legacy `/api/login/:user/:pass` มี throttle 10 ครั้ง/นาที

## ตารางฐานข้อมูลทั้งหมด (~80 ตาราง จาก 39 migrations)

### ผู้ใช้ / สิทธิ์ / Auth
| ตาราง | หน้าที่ |
|---|---|
| `users`, `sessions`, `password_resets` | บัญชีผู้ใช้ + session + รีเซ็ตรหัส |
| `role_presets`, `user_roles`, `preview_sessions` | บทบาทและสิทธิ์ (ใช้กับ middleware Perm) |
| `otp_codes` | OTP สำหรับ consent |

### คนไข้ / คลินิก / นัดหมาย
| ตาราง | หน้าที่ |
|---|---|
| `patient`, `doctor`, `clinic` | ข้อมูลหลักคนไข้-หมอ-คลินิก (มี `clinic_code` แล้ว) |
| `appointment`, `clinic_appointment` | นัดหมาย |
| `queue_log` | คิว OPD (kanban หน้า queue) |
| `walkin_counter` | นับ walk-in รายวัน |
| `bookease_event`, `bookease_booking` | จองคิวจากระบบ BookEase ภายนอก |

### เวชระเบียน / คลินิกอล
| ตาราง | หน้าที่ |
|---|---|
| `patient_history`, `patient_diag`, `patient_allergy` | ประวัติ, การวินิจฉัย (OPD/SOAP), แพ้ยา |
| `prescription`, `prescription_item`, `drug`, `icd10` | ใบสั่งยา + ทะเบียนยา + รหัสโรค |
| `lab_order`, `lab_result` | สั่งแล็บ + ผล |
| `treatment_plan`, `treatment_plan_step` | แผนการรักษา |
| `tooth_chart`, `tooth_status` | งานทันตกรรม |
| `tcm_assessment`, `herbal_formula`, `herbal_ingredient` | แพทย์แผนจีน |
| `rehab_assessment`, `rehab_assessment_score` | กายภาพ |
| `clinical_template`, `clinic_template_instance` | template บันทึกตรวจ |
| `attachments`, `photos` | ไฟล์แนบ + รูปก่อน/หลัง |
| `insurance_claim` | เคลมประกัน |
| `patient_consents`, `clinic_consents`, `bill_consents`, `pdpa_consents` | ใบยินยอม + PDPA |

### การเงิน / POS / บิล
| ตาราง | หน้าที่ |
|---|---|
| `bills`, `bills_summary`, `node_bill` | บิลหลัก (ของเดิม v2 + ที่ย้ายจาก Node) |
| `bill_idempotency`, `sales_intent`, `bill_voids` | กันจ่ายซ้ำ, intent ก่อนจ่าย, ยกเลิกบิล |
| `customer_deposits`, `deposit_transactions`, `deposit_policy` | ระบบมัดจำ |
| `edc_provider`, `edc_terminal`, `edc_method`, `edc_session`, `edc_void_log` | เครื่องรูดบัตร/QR (EDC) |
| `shift_close` | ปิดกะเงินสด |
| `doctor_fee_rules`, `doctor_fee_audit`, `bill_doctor_fees`, `sales_commission_rules` | ค่ามือแพทย์ + คอมมิชชั่น |
| `discount_setting`, `print_setting` | ตั้งค่าส่วนลด/ใบเสร็จ |
| `clinic_subscription`, `billing_invoice`, `payment_method` | ค่าบริการระบบ (subscription ของคลินิกกับ Drease) |

### สต๊อก / คอร์ส
| ตาราง | หน้าที่ |
|---|---|
| `stock_item`, `slot_stock`, `pos_stock_items` | คลังยา-เวชภัณฑ์ |
| `stock_movement` | เดินสต๊อกเข้า-ออก (ledger) |
| `course_item`, `course_usage`, `course_usage_ledger` | คอร์ส + การตัดใช้ |

### ระบบ / AI / อื่น ๆ
| ตาราง | หน้าที่ |
|---|---|
| `error_log` | รับ error จาก frontend (`POST /v3/error-log`) |
| `ai_log`, `ai_call`, `custom_report` | งาน AI + รายงานที่ผู้ใช้สร้างเอง |
| `feedback_events` | เก็บ feedback การใช้งาน |
| `onboarding_state` | สถานะการตั้งค่าคลินิกใหม่ |

### เส้นทาง migration (ไล่ตามลำดับ)

- `0001–0004` ฐานราก: users, password_resets, appointment, sessions
- `0005–0033` ยกระบบ v3 มาทีละโดเมน: POS → สต๊อก/คอร์ส → EDC → error log → AI → subscription → คลินิกอล → ICD10/ยา → doctor fee → permissions → เอกสาร/consent → มัดจำ → ปิดกะ → BookEase → walk-in → รูป → template
- `0034–0035` ดึงตารางแกนจาก v2 (bills, patient, doctor, clinic) และจาก Mongo (stock, course, node_bill) เข้า Postgres เดียวกัน
- `0036–0038` เติมคอลัมน์ที่หน้า cockpit/clinical ต้องใช้
- `0039` **tenant isolation** — เพิ่ม `clinic_code` ทุกตารางคลินิก + ผูก users กับคลินิก

## รันยังไง

```bash
cd drease-v4-backend
docker compose up
# ได้ครบ: PostgreSQL 16 (:5432) + Redis 7 (:6379) + migrate (รัน 39 migrations อัตโนมัติ) + API (:8090)
# เช็คว่าขึ้น: http://localhost:8090/healthz
```

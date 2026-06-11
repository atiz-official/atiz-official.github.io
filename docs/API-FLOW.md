# การเดินทางของเส้น API — จากหน้า login ถึงฐานข้อมูล

เอกสารนี้เล่าว่าเกิดอะไรขึ้นบ้างตั้งแต่ user กรอกรหัสผ่านหน้าจอ จนถึงคำตอบกลับมาแสดงผล และอธิบายว่ากลไก **multi-tenant** (หลายคลินิกใช้ DB เดียวกันโดยมองไม่เห็นข้อมูลกันข้ามคลินิก) ทำงานยังไง — อ่านคู่กับ [BACKEND.md](BACKEND.md) (โครงสร้าง) และ [API-CONTRACT.md](API-CONTRACT.md) (รายการ endpoint)

_อัปเดตล่าสุด: 2026-06-11 — อิงโค้ดจริง backend @`c85e683` (`feat/auth-complete` — auth สองชั้น X-App-Key + JWT), frontend @`e5a2723`_

## ภาพรวมทั้งเส้นทาง

```mermaid
sequenceDiagram
    actor U as 👩‍⚕️ User
    participant FE as React SPA<br/>(authService + apiClient)
    participant MW as Gin middleware<br/>(AppAuth → Auth → Throttle → TenantScope → Perm)
    participant CT as Controller
    participant DB as PostgreSQL<br/>(ทุกตารางมี clinic_code)

    Note over U,DB: ── ตอน login (บัตรใบเดียว: X-App-Key) ──
    U->>FE: กรอก email + password
    FE->>MW: POST /login {email, password}<br/>X-App-Key: <key ของแอป>
    MW->>MW: AppAuth: key ถูกต้อง → channel "web"
    MW->>MW: Throttle: นับ IP (โควต้าเดารหัส 10/นาที)
    MW->>CT: ผ่านด่านแอป — ยังไม่ต้องมี token
    CT->>DB: GetUserByEmail → เทียบ bcrypt
    DB-->>CT: user row (รวม clinic_code เช่น "BKK01")
    CT-->>FE: { token (JWT อายุ 7 วัน), user, redirect: "/cockpit" }
    FE->>FE: เก็บ token ลง localStorage ("drease_token")

    Note over U,DB: ── หลังจากนั้น ทุก request (สองบัตร) ──
    U->>FE: เปิดหน้าใด ๆ เช่น ค้นหาคนไข้
    FE->>MW: GET /api/patient/search<br/>X-App-Key + Authorization: Bearer <token> (แนบอัตโนมัติ)
    MW->>MW: AppAuth: บัตรแอป ✓
    MW->>MW: Auth: แกะ token → user_id, email, name, clinic_code
    MW->>MW: ThrottleUser: นับที่ตัว user (300/นาที) ไม่ใช่ IP
    MW->>MW: TenantScope: ไม่มี clinic_code? → 403
    MW->>CT: context พก clinic_code = "BKK01"
    CT->>DB: query ... WHERE clinic_code = 'BKK01'
    DB-->>CT: เฉพาะแถวของคลินิก BKK01
    CT-->>FE: JSON → แสดงผล
```

## ตอนที่ 1 — login: กรอกรหัสแล้วเกิดอะไร

> 🛡️ เส้น login ยังไม่มี token ก่อน login ก็จริง แต่**ไม่ได้เปิดโล่ง**: ต้องมี**บัตรแอป `X-App-Key`** (auth ใบที่ 1 — คำขอที่ไม่ได้มาจากแอปของเราโดนปัดตั้งแต่หน้าประตูเมื่อเปิด enforce), มี rate limit **10 ครั้ง/นาที/IP แชร์ร่วมกันทั้งกลุ่มเดารหัส** (login + password reset + OTP — สลับเส้นเพื่อเอาโควต้าเพิ่มไม่ได้), เทียบรหัสด้วย bcrypt (เดาแต่ละครั้งช้าและแพง), และข้อความ error ไม่บอกว่าอีเมลมีจริงไหม

1. หน้า login เรียก `authService.login()` (ไฟล์ `src/services/authService.ts`) ส่ง `POST` พร้อม body `{ username, password }`
2. backend (`internal/controller/auth/service.go`) ทำ 3 อย่าง:
   - หา user จากอีเมลในตาราง `users`
   - เทียบรหัสผ่านด้วย **bcrypt** (รหัสจริงไม่เคยถูกเก็บ เก็บแต่ hash)
   - อ่าน `users.clinic_code` — **ผูกตั้งแต่ตรงนี้ว่า user คนนี้สังกัดคลินิกไหน**
3. ผ่านแล้ว backend ออก **JWT อายุ 7 วัน** (`internal/authtoken/token.go`) ตอบกลับ:

```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "42", "name": "หมอเอ", "email": "a@clinic.com", "clinic_code": "BKK01" },
  "redirect": "/cockpit",
  "access_token": "eyJ..."   // ชื่อสำรองสำหรับ client สาย OAuth
}
```

4. ข้างใน token (ถอดให้ดู) — นี่คือ "บัตรพนักงาน" ที่ user พกหลังจากนี้:

```json
{
  "sub": "42",              // user id
  "email": "a@clinic.com",
  "name": "หมอเอ",
  "clinic": "BKK01",        // ★ ตัวกั้นเขตคลินิก — ปลอมไม่ได้เพราะถูกเซ็นด้วย secret
  "exp": 1781000000         // หมดอายุใน 7 วัน
}
```

5. frontend เก็บ token ใน `localStorage` คีย์ `drease_token` (จัดการใน `src/services/apiClient.ts`)

> ⚠️ **ปมที่ยังไม่เคาะ:** ตอนนี้ frontend ยิง `POST /auth/login` แต่ backend เปิดประตูไว้ที่ `POST /login` — path ไม่ตรงกัน login จริงจึงยังไม่ผ่าน (ดูกลุ่ม 🔴 ใน [API-CONTRACT.md](API-CONTRACT.md)) ต้องเคาะว่าฝั่งไหนย้ายไปหาอีกฝั่ง

## ตอนที่ 2 — หลัง login: ทุก request พกอะไรไปบ้าง

หลัง login ทุก request พก**สองบัตร**: บัตรแอป (`X-App-Key` — ค่าคงที่ของแอป) และบัตรพนักงาน (`Authorization` — token ของคนนั้น) `apiClient.ts` มี **interceptor** ตัวเดียวทำงานเงียบ ๆ: หยิบ token จาก localStorage มาแนบให้อัตโนมัติ — คนเขียนหน้าไม่ต้องคิดเรื่องนี้เลย

```
GET /api/patient/search?q=สมหญิง
X-App-Key: web:Kx8f...                          ← บัตรใบที่ 1 (ของแอป — ค่าเดียวทุกเส้น)
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...   ← บัตรใบที่ 2 (ของคน — แนบให้เองทุกเส้น)
```

> 📋 **งานฝั่ง frontend ที่ตามมา:** เพิ่มการแนบ `X-App-Key` ใน `apiClient.ts` (ค่าจาก env ตอน build) — ระหว่างที่ยังไม่ส่ง backend อยู่ในโหมด log-only จึงยังใช้งานได้ปกติ

## ตอนที่ 3 — backend รับ request: ด่านตรวจ 5 ชั้น

ทุก request เส้นหลังล็อกอินต้องผ่านด่านตามลำดับ (โค้ดอยู่ `internal/middleware/middleware.go`):

| ด่าน | ทำอะไร | ไม่ผ่านเจออะไร |
|---|---|---|
| **1. AppAuth** | เช็คบัตรแอป `X-App-Key` กับทะเบียน `APP_KEYS` — รู้ด้วยว่า traffic มาจากช่องทางไหน (web/booking/mobile) | `401 unknown app` (ช่วง rollout = log-only) |
| **2. Auth** | แกะ JWT จาก header ตรวจลายเซ็น แล้ววางของลง context: `user_id`, `user_email`, `user_name`, `clinic_code` | `401 unauthenticated` |
| **3. ThrottleUser** | นับโควต้า **ที่ตัวคนจาก token** (300/นาที) ไม่ใช่ IP — token หลุดไปยิงจากกี่ IP ก็โดนนับรวม + log `THROTTLE user:...` ให้เห็น | `429` + `Retry-After` |
| **4. TenantScope** | เช็คว่า context มี `clinic_code` ไหม — ไม่มี = ไม่รู้สังกัด ห้ามแตะข้อมูล | `403 no clinic context` |
| **5. Perm** (เฉพาะบางเส้น) | เช็คสิทธิ์ละเอียด เช่น `/v3/doctor-fee` ต้องมี `doctor_fee.view` | `403` |

ส่วนเส้นสาธารณะแบ่งเป็น 3 เลน: **infra** (`/healthz` — เปิด), **signed-link** (ลิงก์จากอีเมล/LINE — auth ฝังใน URL, ส่ง header ไม่ได้), **public API** (login/OTP/จองคิวข้ามเว็บ — ต้องมีบัตรแอป + throttle ต่อ IP)

ผ่านครบแล้ว controller ค่อยเริ่มทำงาน โดยเรียก `middleware.ClinicCode(c)` เพื่อหยิบรหัสคลินิกไปใช้ใน query

## ตอนที่ 4 — เป้าหมายใหญ่: คลินิก A ต้องไม่เห็นข้อมูลคลินิก B

กลไกมี 3 ชิ้นทำงานร่วมกัน:

1. **ฐานข้อมูล** — migration 0039 เพิ่มคอลัมน์ `clinic_code` + index ให้ทุกตารางข้อมูลคลินิก (patient, doctor, node_bill, stock, deposit, ...)
2. **Query** — sqlc query ฝั่งอ่าน/เขียนกรองด้วย `WHERE clinic_code = $1` เสมอ
3. **ค่าที่ใส่ใน $1 มาจาก JWT เท่านั้น** — ไม่ได้มาจาก parameter ที่ client ส่งมา ดังนั้นต่อให้ผู้ใช้แก้ request เองก็เลือกดูคลินิกอื่นไม่ได้ เพราะ `clinic` ฝังอยู่ใน token ที่เซ็นด้วย secret ฝั่ง server — แก้ token แม้ตัวอักษรเดียว ลายเซ็นพังทันที

```mermaid
flowchart LR
    A["JWT ของหมอคลินิก BKK01"] -->|"claim clinic=BKK01"| B["TenantScope"]
    B --> C["query WHERE clinic_code='BKK01'"]
    C --> D[("DB กลาง<br/>BKK01 + CNX02 + HKT03 ...")]
    D -->|"เห็นเฉพาะแถว BKK01"| A2["ตอบกลับ"]
    X["✏️ user แก้ request เป็น CNX02"] -. "❌ ไม่มีผล — ค่าไม่ได้มาจาก request" .-> C
```

> 📌 **ช่วงเปลี่ยนผ่าน (porting phase):** ถ้า `clinic_code` ใน token ว่าง query จะคืนทุกแถวไปก่อน และ middleware มี flag `enforce` ที่ยังเปิดแบบผ่อนปรนได้ — พอข้อมูลพร้อมทุกคลินิกค่อยบังคับเต็มรูปแบบ ดังนั้น**ตอนนี้ยังไม่ใช่กำแพงสมบูรณ์ จนกว่าจะเปิด enforce ทั้งระบบ**

## สรุปไฟล์ที่เกี่ยวแต่ละฝั่ง

| ขั้น | ฝั่ง | ไฟล์ |
|---|---|---|
| หน้า login เรียก API | frontend | `src/services/authService.ts` |
| เก็บ token + แนบ header อัตโนมัติ | frontend | `src/services/apiClient.ts` |
| รับ login / ออก token | backend | `internal/controller/auth/` (handler → service → repo) |
| โครงสร้าง JWT (claim `clinic`) | backend | `internal/authtoken/token.go` |
| ด่านตรวจ AppAuth / Auth / Throttle / TenantScope / Perm | backend | `internal/middleware/middleware.go` |
| ทะเบียนบัตรแอป (`APP_KEYS`) + flag enforce | backend | `internal/config/config.go`, `.env.example` |
| เพิ่ม clinic_code ทุกตาราง | backend | `internal/db/migrations/0039_*.sql` |

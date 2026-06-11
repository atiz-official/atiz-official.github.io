# การเดินทางของเส้น API — จากหน้า login ถึงฐานข้อมูล

เอกสารนี้เล่าว่าเกิดอะไรขึ้นบ้างตั้งแต่ user กรอกรหัสผ่านหน้าจอ จนถึงคำตอบกลับมาแสดงผล และอธิบายว่ากลไก **multi-tenant** (หลายคลินิกใช้ DB เดียวกันโดยมองไม่เห็นข้อมูลกันข้ามคลินิก) ทำงานยังไง — อ่านคู่กับ [BACKEND.md](BACKEND.md) (โครงสร้าง) และ [API-CONTRACT.md](API-CONTRACT.md) (รายการ endpoint)

_อัปเดตล่าสุด: 2026-06-11 — อิงโค้ดจริง backend @`8d93bc7`, frontend @`e5a2723`_

## ภาพรวมทั้งเส้นทาง

```mermaid
sequenceDiagram
    actor U as 👩‍⚕️ User
    participant FE as React SPA<br/>(authService + apiClient)
    participant MW as Gin middleware<br/>(Auth → TenantScope → Perm)
    participant CT as Controller
    participant DB as PostgreSQL<br/>(ทุกตารางมี clinic_code)

    Note over U,DB: ── ตอน login ──
    U->>FE: กรอก email + password
    FE->>MW: POST /login {email, password}
    MW->>CT: เส้น public ไม่ต้องมี token
    CT->>DB: GetUserByEmail → เทียบ bcrypt
    DB-->>CT: user row (รวม clinic_code เช่น "BKK01")
    CT-->>FE: { token (JWT อายุ 7 วัน), user, redirect: "/cockpit" }
    FE->>FE: เก็บ token ลง localStorage ("drease_token")

    Note over U,DB: ── หลังจากนั้น ทุก request ──
    U->>FE: เปิดหน้าใด ๆ เช่น ค้นหาคนไข้
    FE->>MW: GET /api/patient/search<br/>Authorization: Bearer <token> (แนบอัตโนมัติ)
    MW->>MW: Auth: แกะ token → user_id, email, name, clinic_code
    MW->>MW: TenantScope: ไม่มี clinic_code? → 403
    MW->>CT: context พก clinic_code = "BKK01"
    CT->>DB: query ... WHERE clinic_code = 'BKK01'
    DB-->>CT: เฉพาะแถวของคลินิก BKK01
    CT-->>FE: JSON → แสดงผล
```

## ตอนที่ 1 — login: กรอกรหัสแล้วเกิดอะไร

> 🛡️ เส้น login เป็น public โดยธรรมชาติ (ยังไม่มี token ก่อน login) แต่**ไม่ได้เปิดโล่ง**: มี rate limit **10 ครั้ง/นาที/IP** กันบอทเดารหัส, เทียบรหัสด้วย bcrypt (เดาแต่ละครั้งช้าและแพง), และข้อความ error ไม่บอกว่าอีเมลมีจริงไหม

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

`apiClient.ts` มี **interceptor** ตัวเดียวทำงานเงียบ ๆ: ทุกครั้งที่ส่วนไหนของแอปเรียก API มันจะหยิบ token จาก localStorage มาแนบ header ให้อัตโนมัติ — คนเขียนหน้าไม่ต้องคิดเรื่องนี้เลย

```
GET /api/patient/search?q=สมหญิง
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...   ← แนบให้เองทุกเส้น
```

## ตอนที่ 3 — backend รับ request: ด่านตรวจ 3 ชั้น

ทุก request ที่ไม่ใช่เส้น public ต้องผ่านด่านตามลำดับ (โค้ดอยู่ `internal/middleware/middleware.go`):

| ด่าน | ทำอะไร | ไม่ผ่านเจออะไร |
|---|---|---|
| **1. Auth** | แกะ JWT จาก header ตรวจลายเซ็น แล้ววางของลง context: `user_id`, `user_email`, `user_name`, `clinic_code` | `401 unauthenticated` |
| **2. TenantScope** | เช็คว่า context มี `clinic_code` ไหม — ไม่มี = ไม่รู้สังกัด ห้ามแตะข้อมูล | `403 no clinic context` |
| **3. Perm** (เฉพาะบางเส้น) | เช็คสิทธิ์ละเอียด เช่น `/v3/doctor-fee` ต้องมี `doctor_fee.view` | `403` |

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
| ด่านตรวจ Auth / TenantScope / Perm | backend | `internal/middleware/middleware.go` |
| เพิ่ม clinic_code ทุกตาราง | backend | `internal/db/migrations/0039_*.sql` |

# จำลองการใช้งานจริง — สองเส้น สองระดับ auth

เอกสารนี้จำลองการกรอกข้อมูลและการตอบกลับแบบเห็นของจริงทุก byte: เส้นที่ใช้ **auth ใบเดียว** (login) กับเส้นที่ใช้ **auth สองใบ** (บันทึกคนไข้) — ทุก request/response ในนี้อิงรูปแบบจากโค้ดจริง ไม่ได้แต่งขึ้น อ่านทฤษฎีเต็ม ๆ ได้ที่ [API-FLOW.md](API-FLOW.md)

_อัปเดตล่าสุด: 2026-06-11 — อิงโค้ด backend `feat/auth-complete` working tree (auth สองชั้นเขียนเสร็จแล้ว รอ commit ขึ้น GitHub)_

**ฉากสมมติ:** คุณนิด พนักงานคลินิก BKK01 เปิดหน้าเว็บมาลงทะเบียนคนไข้ใหม่

## เส้นที่ 1 — `POST /login` ใช้ auth ใบเดียว (บัตรแอป)

```mermaid
sequenceDiagram
    actor N as 👩 คุณนิด
    participant B as เบราว์เซอร์<br/>(React SPA)
    participant G1 as 🪪 ด่านแอป<br/>AppAuth
    participant G2 as 🚥 ด่านนับ IP<br/>Throttle 10/นาที
    participant CT as Controller<br/>ตรวจรหัสผ่าน

    N->>B: กรอก nid@bkk01.com + รหัสผ่าน
    B->>G1: POST /login + X-App-Key: web:Kx8f...
    G1->>G2: key ถูกต้อง → channel "web" ✓
    G2->>CT: IP 203.0.113.7 ครั้งที่ 1/10 ✓
    CT->>CT: bcrypt ✓ → อ่าน users.clinic_code = BKK01
    CT-->>B: 200 { token, user, redirect }
    B->>B: เก็บ token (นี่คือ auth ใบที่ 2 ที่เพิ่งเกิด)
```

คุณนิดกดเข้าสู่ระบบ เบราว์เซอร์ส่ง:

```http
POST /login HTTP/1.1
Host: api.drease.com
Content-Type: application/json
X-App-Key: web:Kx8fT3mQz9        ← auth ใบที่ 1 (ฝังมากับตัวเว็บ)

{ "email": "nid@bkk01.com", "password": "S3cret!2026", "remember": true }
```

ตอบกลับ **200**:

```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIs...ส่วนข้อมูล...ลายเซ็น",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "42", "name": "นิด ใจดี", "email": "nid@bkk01.com" },
  "redirect": "/cockpit"
}
```

ข้างใน token ฝังตัวตนไว้แล้ว: `{ uid: "42", name: "นิด ใจดี", clinic: "BKK01", exp: <หมดอายุ 7 วัน> }` — **นี่คือ auth ใบที่ 2 ที่เพิ่งเกิด** เว็บเก็บไว้ใช้กับทุกเส้นหลังจากนี้

### กรณีโดนปัด (เส้นที่ 1)

| สถานการณ์ | ตอบกลับ |
|---|---|
| บอทยิงตรง ๆ ไม่มี `X-App-Key` | `401 {"ok":false,"error":"unknown app"}` — ไม่ทันได้เช็ครหัสผ่านด้วยซ้ำ |
| เดารหัสครั้งที่ 11 ใน 1 นาที จาก IP เดิม | `429` + `Retry-After: 37` + log `THROTTLE ip:203.0.113.7 POST /login` |
| รหัสผ่านผิด | `401 {"ok":false,"error":"อีเมลหรือรหัสผ่านไม่ถูกต้อง"}` (นับโควต้า throttle ด้วย) |

## เส้นที่ 2 — `POST /createpatient` ใช้ auth สองใบพร้อมกัน

```mermaid
sequenceDiagram
    actor N as 👩 คุณนิด
    participant B as เบราว์เซอร์
    participant G1 as 🪪 ด่าน 1 AppAuth
    participant G2 as 🎫 ด่าน 2 Auth (JWT)
    participant G3 as 🚥 ด่าน 3 ThrottleUser
    participant G4 as 🏥 ด่าน 4 TenantScope
    participant CT as Controller

    N->>B: กรอกฟอร์มคนไข้ใหม่ (สมชาย รักษาดี)
    B->>G1: POST /createpatient<br/>X-App-Key + Authorization: Bearer ...
    G1->>G2: บัตรแอป ✓ channel "web"
    G2->>G3: token แท้ ไม่หมดอายุ → uid 42, clinic BKK01 ✓
    G3->>G4: นับที่ตัวคน user:42 ครั้งที่ 8/300 ✓
    G4->>CT: ปักเขต clinic_code = BKK01 ✓
    CT-->>B: 201 { ok: true, HN: "680117" }
    B->>N: เด้งไปหน้าคนไข้ใหม่
```

คุณนิดกรอกฟอร์ม: นายสมชาย รักษาดี เกิด 14/02/2533 เบอร์ 081-234-5678 แพ้ยาเพนิซิลลิน — กดบันทึก:

```http
POST /createpatient HTTP/1.1
Host: api.drease.com
Content-Type: application/json
X-App-Key: web:Kx8fT3mQz9                       ← ใบที่ 1: บัตรแอป (ใบเดิม)
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...    ← ใบที่ 2: บัตรคน (ได้จากเส้นแรก)

{
  "HN": "",
  "Prefixname": "นาย",
  "Firstname": "สมชาย",
  "Lastname": "รักษาดี",
  "Nickname": "ชาย",
  "Tel": "0812345678",
  "ID_Card": "1103700123456",
  "Birthday": "1990-02-14",
  "gender": "male",
  "blood": "O",
  "allergy": "Penicillin",
  "congenital_disease": "",
  "branch_code": "BKK01"
}
```

ตอบกลับ **201**:

```json
{ "ok": true, "HN": "680117" }
```

ระบบออก HN ใหม่ให้ หน้าจอคุณนิดเด้งไปหน้าคนไข้ได้เลย — และคนไข้คนนี้ถูกบันทึก**ในเขตของ BKK01 เท่านั้น** เพราะด่าน 4 ปักเขตจาก token ไม่ใช่จากค่าที่ฟอร์มส่งมา

### กรณีโดนปัด (เส้นที่ 2)

| สถานการณ์ | ตกที่ด่าน | ตอบกลับ |
|---|---|---|
| มีบัตรแอป แต่ลืมแนบ token (ยังไม่ login) | ด่าน 2 | `401 {"ok":false,"error":"unauthenticated"}` |
| token หมดอายุ (เปิดจอทิ้งไว้ข้ามสัปดาห์) | ด่าน 2 | `401` เหมือนกัน → เว็บพากลับหน้า login |
| token คุณนิดหลุด โดนสคริปต์ยิง 301 ครั้ง/นาที จาก 5 IP | ด่าน 3 | `429` + log `THROTTLE user:42 POST /createpatient (over 300/1m0s)` — เห็นทันทีว่า "คุณนิด" กำลังโดนสวมรอย |
| token พนักงาน CNX02 มายิงดูคนไข้ BKK01 | ด่าน 4 | เขตข้อมูลเป็น CNX02 — ค้นเท่าไหร่ก็เจอแต่คนไข้คลินิกตัวเอง ข้ามเขตไม่ได้ |

## สรุปภาพเดียว

```mermaid
flowchart LR
    subgraph L1["เส้นที่ 1: login (บัตรเดียว)"]
        direction LR
        A1["🪪 X-App-Key"] --> D1["ด่านแอป"] --> D2["ด่านนับ IP<br/>10/นาที"] --> R1["✓ ได้ token กลับมา"]
    end
    subgraph L2["เส้นที่ 2: createpatient (สองบัตร)"]
        direction LR
        A2["🪪 X-App-Key<br/>+ 🎫 Bearer token"] --> E1["ด่านแอป"] --> E2["ด่านตัวตน<br/>JWT"] --> E3["ด่านนับคน<br/>300/นาที/user"] --> E4["ด่านเขตคลินิก<br/>TenantScope"] --> R2["✓ ได้ HN กลับมา"]
    end
    R1 -. "token ที่ได้ ใช้เป็นบัตรใบที่ 2" .-> A2

    style R1 fill:#1a2f1f,stroke:#3fb950,color:#e6edf3
    style R2 fill:#1a2f1f,stroke:#3fb950,color:#e6edf3
```

> 📌 สถานะโค้ด: ด่านทั้งหมดรวม AppAuth **เขียนเสร็จแล้ว**ใน branch `feat/auth-complete` (working tree — รอ commit/merge ขึ้น GitHub) · ช่วง rollout เปิดแบบ log-only (`APP_AUTH_ENFORCE=false`) คำขอไม่มีบัตรแอปยังผ่านได้แต่ถูกจดไว้ จนกว่า frontend จะแนบ `X-App-Key` ครบทุกตัว

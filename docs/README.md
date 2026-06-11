# Drease v4 — Control Repository

[![Update changelog](https://github.com/atiz-official/drease-v4-control/actions/workflows/update-changelog.yml/badge.svg)](https://github.com/atiz-official/drease-v4-control/actions/workflows/update-changelog.yml)

Repo นี้เป็น **ตัวควบคุม (umbrella repo)** ของระบบ Drease v4 ทำหน้าที่:

- รวม 2 โปรเจ็คไว้เป็น git submodules และ **ตรึงเวอร์ชัน** ว่า frontend/backend คู่ไหนทำงานด้วยกันได้
- เป็นศูนย์เอกสารภาพรวมของทั้งระบบ (รายละเอียดเชิงลึกอยู่ในเอกสารของแต่ละโปรเจ็คเอง)
- ติดตามการเปลี่ยนแปลงของทั้ง 2 โปรเจ็ค → ดู [CHANGELOG.md](CHANGELOG.md)

## ภาพรวมระบบ

```
┌──────────────────────┐         ┌──────────────────────┐
│  drease-v4-frontend  │  axios  │  drease-v4-backend   │
│  React 19 + Vite     │ ──────► │  Go 1.25 + Gin       │
│  (SPA หน้าคลินิก)      │  REST   │  (API :8090)         │
└──────────────────────┘         └──────────┬───────────┘
                                            │
                                ┌───────────┴───────────┐
                                │ PostgreSQL 16 │ Redis 7│
                                └───────────────────────┘
```

## 📦 Projects

### Backend — [drease-v4-backend/](drease-v4-backend/)

| หัวข้อ | รายละเอียด |
|---|---|
| ภาษา / Framework | Go 1.25 + Gin |
| Database | PostgreSQL 16 (ผ่าน pgx v5) |
| Cache | Redis 7 |
| Multi-tenant | แยกข้อมูลรายคลินิกด้วย `clinic_code` (JWT claim + TenantScope) |
| Migration | golang-migrate — ไฟล์อยู่ `internal/db/migrations` (39 migrations) |
| Query layer | sqlc — เขียน SQL ใน `internal/db/query` → generate Go ไป `internal/db/gen` |
| Auth | JWT |
| รัน | `docker compose up` (API :8090, Postgres :5432) |

โครงสร้างหลัก:

```
cmd/api/          จุดเริ่มโปรแกรม (main.go)
internal/
  router/         กำหนดเส้นทาง API
  controller/     รับ request / ตอบ response
  middleware/     ตรวจ auth ฯลฯ
  db/             migrations + query (sqlc) + connection pool
  config/         อ่านค่า env
```

📖 โครงสร้างเชิงลึก ตารางฐานข้อมูลทั้งหมด และ request flow: [BACKEND.md](BACKEND.md)

### Frontend — [drease-v4-frontend/](drease-v4-frontend/)

| หัวข้อ | รายละเอียด |
|---|---|
| ภาษา / Framework | React 19 + TypeScript + Vite |
| Routing | React Router 7 |
| เรียก API | axios → Go backend |
| UI เสริม | Chart.js (กราฟ), FullCalendar (ตารางนัด) |
| Test / Lint | Vitest + Testing Library, ESLint (บังคับ feature boundaries) |
| รัน | `npm run dev` |

โครงสร้างหลัก (feature-based):

```
src/
  app/            entry, router, App shell
  features/       แยกตามฟีเจอร์ (OPD, queue, ใบเสร็จ, ใบแจ้งหนี้, นัดหมาย, reports ...)
  shared/         component / helper ที่ใช้ร่วมกัน
  services/       ตัวเรียก API
  tenants/        ค่าเฉพาะของแต่ละคลินิก
```

📖 รายละเอียดเพิ่มเติม: [drease-v4-frontend/FRONTEND.md](drease-v4-frontend/FRONTEND.md)

## 🚀 รันทั้งระบบ (สำหรับคนใหม่)

ต้องมี: Docker Desktop + Node.js 20+

```bash
# 1) รัน backend (API + PostgreSQL + migration อัตโนมัติ)
cd drease-v4-backend
docker compose up
# → API พร้อมที่ http://localhost:8090

# 2) ตั้งค่า frontend ให้ชี้ API (ครั้งแรกครั้งเดียว)
cd ../drease-v4-frontend
echo VITE_API_URL=http://localhost:8090 > .env

# 3) รัน frontend
npm install
npm run dev
# → เปิด http://localhost:5173
```

ตรวจว่า backend ขึ้นแล้ว: เปิด http://localhost:8090/healthz ต้องตอบ ok
ดูว่า endpoint ไหนเชื่อมถึงกันแล้วบ้าง: [API-CONTRACT.md](API-CONTRACT.md)

## 🔧 Submodule Cheat Sheet

```bash
# clone ครั้งแรก (ได้ทั้ง control + 2 โปรเจ็ค)
git clone --recurse-submodules https://github.com/atiz-official/drease-v4-control.git

# ถ้า clone มาแล้ว submodule ว่าง
git submodule update --init --recursive

# ดึงเวอร์ชันล่าสุดของทั้ง 2 โปรเจ็ค
git submodule update --remote

# ตรึงเวอร์ชันใหม่ (หลัง submodule ขยับ)
git add drease-v4-backend drease-v4-frontend
git commit -m "chore: bump submodules"
```

## 📜 Tracking Changes

ดูว่าใครแก้อะไรไปบ้าง:

- [CHANGELOG.md](CHANGELOG.md) — ตารางรวมทั้ง 2 โปรเจ็ค เรียงวันล่าสุดบนสุด
- [CHANGELOG-backend.md](CHANGELOG-backend.md) — เฉพาะ backend
- [CHANGELOG-frontend.md](CHANGELOG-frontend.md) — เฉพาะ frontend

อัปเดต CHANGELOG ให้เป็น log ล่าสุด:

```powershell
.\scripts\update-log.ps1


```

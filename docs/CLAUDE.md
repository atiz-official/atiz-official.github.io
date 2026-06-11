# CLAUDE.md — drease-v4-control

## Repo นี้คืออะไร

Umbrella repo ของระบบคลินิก Drease v4 — **เก็บเอกสารภาพรวม + ตรึงเวอร์ชัน 2 submodules** เท่านั้น ไม่มีโค้ดแอปของตัวเอง

- `drease-v4-backend/` — Go 1.25 + Gin + PostgreSQL 16 (sqlc, golang-migrate, JWT)
- `drease-v4-frontend/` — React 19 + TypeScript + Vite (feature-based, งานหลักอยู่ branch `frontend/react-spa-scaffold` ไม่ใช่ master)

## กติกา

- **ห้ามแก้โค้ดใน submodule จาก repo นี้** — ไปแก้ใน repo ของมันเอง แล้วค่อยมา bump pointer ที่นี่
- งานของ repo นี้คือ: อัปเดตเอกสาร, bump submodule pointer, generate changelog
- เอกสารเขียนภาษาไทย หัวข้อ/ศัพท์เทคนิคเป็นอังกฤษได้

## ไฟล์สำคัญ

| ไฟล์ | หน้าที่ |
|---|---|
| `README.md` | ภาพรวมระบบ, stack, วิธีรันทั้งระบบ, submodule cheat sheet |
| `BACKEND.md` | โครงสร้างเชิงลึก backend: ตาราง DB ทั้งหมด, request flow, migration timeline — **อัปเดตด้วยมือ** |
| `API-FLOW.md` | การเดินทางของ request: login → JWT → middleware → tenant isolation — **อัปเดตด้วยมือ** |
| `API-SIMULATION.md` | จำลอง request/response จริง 2 เส้น (auth 1 ใบ / 2 ใบ) + กรณีโดนปัด — **อัปเดตด้วยมือ** |
| `API-CONTRACT.md` | ตาราง endpoint: backend มีอะไร / frontend เรียกอะไร / เชื่อมกันหรือยัง — **อัปเดตด้วยมือ** |
| `CHANGELOG.md` | git log รวม 2 โปรเจ็คตารางเดียว (generate อย่าแก้มือ) |
| `CHANGELOG-backend.md` / `CHANGELOG-frontend.md` | log แยกรายโปรเจ็ค (generate อย่าแก้มือ) |
| `scripts/update-log.ps1` | generate CHANGELOG ทั้ง 3 ไฟล์ — fetch แล้วอ่าน log ทุก remote branch |

## คำสั่งที่ใช้บ่อย

```powershell
# อัปเดต changelog ทั้ง 3 ไฟล์
.\scripts\update-log.ps1

# ดึง submodule ล่าสุด + ตรึงเวอร์ชันใหม่
git submodule update --remote
git add drease-v4-backend drease-v4-frontend
git commit -m "chore: bump submodules"
```

## ข้อควรระวัง

- สคริปต์ `.ps1` ในนี้ต้องเป็น **UTF-8 with BOM** (มีภาษาไทยข้างใน — PowerShell 5.1 อ่าน UTF-8 ไม่มี BOM แล้วพัง)
- submodule เป็น detached HEAD เสมอ (ปกติของ submodule ไม่ใช่ความผิดพลาด)
— เวอร์ชันอาจไม่ตรงกับ submodule ข้างใน เช็คก่อนอ้างอิง

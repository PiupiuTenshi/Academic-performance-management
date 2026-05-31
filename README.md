# Academic Performance Management

Hệ thống quản lý kết quả học tập hỗ trợ nhập điểm, tính điểm tổng kết, xếp loại học lực, tra cứu bảng điểm và quản trị tài khoản theo vai trò.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL

## Project Structure

```text
backend/    Express API
frontend/   React/Vite UI
database/   MySQL schema and seed data
docs/       Project documentation
```

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

API health check: `GET http://localhost:5000/api/v1/health`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Database

```sql
CREATE DATABASE academic_result_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

```bash
mysql -u root -p academic_result_management < database/schema.sql
mysql -u root -p academic_result_management < database/seed.sql
```

## Git Workflow

- Main branch: `main`
- Integration branch: `develop`
- Feature branches: `feature/<scope>`, `chore/<scope>`, `docs/<scope>`
- Commit format: `type: short description`
- Common types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`


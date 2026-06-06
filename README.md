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
npm run db:schema
npm run db:seed
npm run dev
```

API health check: `GET http://localhost:5000/api/v1/health`

Swagger UI:

```text
http://localhost:5000/api-docs
```

Backend release check:

```bash
cd backend
npm run release:check
```

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

## Demo Accounts

All seed accounts use password:

```text
123456
```

| Username | Role |
| --- | --- |
| `admin` | Admin |
| `academic01` | Academic Staff |
| `lecturer01` | Lecturer |
| `student01` | Student |

## Deployment

Backend can be deployed as a Node service from `backend/`.

```bash
cd backend
npm ci
npm start
```

Required production variables:

```env
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:3306/database
JWT_SECRET=<long-random-secret>
CORS_ORIGIN=https://<frontend-domain>
```

Render blueprint is available in `render.yaml`, and a backend Dockerfile is available in `backend/Dockerfile`.

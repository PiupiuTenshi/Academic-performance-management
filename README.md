# Academic Performance Management

Hệ thống quản lý kết quả học tập hỗ trợ nhà trường quản lý điểm theo học phần, tính điểm tổng kết, xếp loại học lực, xử lý thi lại/học lại, tra cứu bảng điểm và quản trị tài khoản theo vai trò.

## Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express, JWT, bcryptjs |
| Database | MySQL, mysql2 |
| Tài liệu API | Swagger UI |
| Export/Import | Excel `.xlsx` bằng SheetJS |

## Cấu Trúc Thư Mục

```text
Academic performance management/
|-- backend/      Express API, business logic, scripts database/test
|-- frontend/     React/Vite UI
|-- database/     Schema, seed data, demo data và CSV nguồn
|-- docs/         Tài liệu phân tích, workflow, deploy, checklist test
|-- render.yaml   Cấu hình deploy Render
`-- README.md
```

## Chức Năng Chính

- Đăng nhập, đăng xuất và phân quyền theo vai trò.
- Sinh viên xem bảng điểm và trạng thái học tập.
- Giảng viên nhập điểm thành phần, import/export Excel và khóa bảng điểm.
- Giáo vụ tính điểm tổng kết, xếp loại học lực, lập danh sách thi lại/học lại.
- Admin quản lý tài khoản, trạng thái hệ thống và nhật ký thao tác.
- API có health check, database check và Swagger UI.

## Yêu Cầu Môi Trường

- Node.js `>= 22` cho backend.
- MySQL `8.x` hoặc tương thích.
- npm đi kèm Node.js.

## Cài Đặt Nhanh

### 1. Tạo database

Đăng nhập MySQL và tạo database:

```sql
CREATE DATABASE academic_result_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 2. Cấu hình backend

```bash
cd backend
npm install
cp .env.example .env
```

Cập nhật file `backend/.env` theo MySQL local:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=academic_result_management
DB_USER=root
DB_PASSWORD=

JWT_SECRET=change_me_in_local_env
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5000,http://localhost:3000,http://localhost:5173,http://localhost:4173
```

Khởi tạo schema và dữ liệu mẫu:

```bash
npm run db:schema
npm run db:seed
npm run db:check
```

Chạy backend:

```bash
npm run dev
```

Backend mặc định chạy tại:

```text
http://localhost:5000
```

### 3. Cấu hình frontend

Mở terminal mới:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:3000
```

Nếu Vite đổi sang cổng khác, xem URL hiển thị trên terminal.

## Tài Khoản Demo

Tất cả tài khoản seed mặc định dùng mật khẩu:

```text
123456
```

| Username | Vai trò |
| --- | --- |
| `admin` | Admin |
| `academic01` | Academic Staff |
| `lecturer01` | Lecturer |
| `N23DCCN001` | Student |

## Đường Dẫn Quan Trọng

### Frontend

| Đường dẫn | Mô tả |
| --- | --- |
| `/login` | Đăng nhập |
| `/dashboard` | Tổng quan |
| `/transcript` | Bảng điểm sinh viên |
| `/grades/input` | Nhập điểm giảng viên |
| `/academic` | Xử lý học vụ |
| `/admin/users` | Quản lý tài khoản |
| `/admin/audit-logs` | Nhật ký hệ thống |
| `/admin/system` | Trạng thái hệ thống |

### Backend

| Endpoint | Mô tả |
| --- | --- |
| `GET /api/v1/health` | Kiểm tra API |
| `GET /api/v1/health/database` | Kiểm tra kết nối database |
| `POST /api/v1/auth/login` | Đăng nhập |
| `GET /api-docs` | Swagger UI |

## Scripts Thường Dùng

### Backend

```bash
npm run dev                 # Chạy API với node --watch
npm start                   # Chạy API production
npm run db:schema           # Tạo schema database
npm run db:seed             # Nạp dữ liệu mẫu
npm run db:demo:build       # Tạo database/demo-data.sql từ CSV nguồn
npm run db:demo             # Nạp bộ demo lớn
npm run db:check            # Kiểm tra kết nối và bảng
npm run test:api            # Regression test API
npm run integration:smoke   # Smoke test tích hợp
npm run release:check       # Kiểm tra trước release
```

### Frontend

```bash
npm run dev       # Chạy Vite dev server
npm run build     # Build production
npm run preview   # Preview bản build
```

## Dữ Liệu Demo Lớn

File `database/demo-data.sql` được tạo từ các CSV trong `database/source-csv/`. Bộ demo này có nhiều sinh viên, học phần, lớp học phần, điểm học kỳ 1, bản ghi thi lại/học lại và học vụ. Điểm học kỳ 2 được để trống để giảng viên nhập thử nghiệm.

Chạy từ thư mục `backend`:

```bash
npm run db:demo:build
npm run db:demo
```

## Kiểm Tra Trước Khi Nộp/Chạy Demo

```bash
cd backend
npm run db:check
npm run test:api
npm run release:check

cd ../frontend
npm run build
```

## Deploy

Backend có thể deploy như một Node service từ thư mục `backend`.

```bash
cd backend
npm ci
npm start
```

Biến môi trường production cần có:

```env
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:3306/database
JWT_SECRET=<long-random-secret>
CORS_ORIGIN=https://<frontend-domain>
```

Repo có sẵn `render.yaml` cho Render và `backend/Dockerfile` cho backend container.

## Tài Liệu Bổ Sung

Tài liệu chi tiết nằm trong thư mục `docs/`, gồm phạm vi đề tài, kế hoạch chia việc, workflow Git, hướng dẫn database, deploy, map file/chức năng và checklist test.

## Git Workflow Gợi Ý

- Nhánh chính: `main`
- Nhánh tích hợp: `develop`
- Nhánh tính năng: `feature/<scope>`, `fix/<scope>`, `docs/<scope>`
- Commit format: `type: short description`
- Type thường dùng: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`

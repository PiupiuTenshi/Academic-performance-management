# Chức năng từng thư mục và từng file trong dự án

## 1. Mục tiêu

File này dùng để giải thích cấu trúc source code của dự án **Hệ thống Quản lý Kết quả Học tập**. Khi thuyết trình hoặc nộp bài, nhóm có thể dùng file này để trả lời câu hỏi: “Mỗi file trong project dùng để làm gì?”.


## 1.1 Phân chia 3 role khi giải thích source code

| Thành viên | Role chính | Phạm vi chịu trách nhiệm |
| --- | --- | --- |
| Thành viên 1 | **Frontend** | Giao diện React, route, form, validate phía client, gọi API, responsive UI, xử lý trạng thái đăng nhập trên client |
| Thành viên 2 | **Backend + QA + Document Lead** | API Node.js/Express, authentication/authorization, business logic, kiểm thử API/chức năng, viết README/tài liệu, tổng hợp checklist nộp |
| Thành viên 3 | **Database + DevOps** | ERD, schema MySQL, seed/migration, kết nối database, Docker/.env, deploy frontend/backend/database, cấu hình production |

Khi thuyết trình, có thể phân công: Frontend trình bày thư mục `frontend/`, Backend + QA + Document Lead trình bày `backend/` và tài liệu/test, Database + DevOps trình bày `database/`, `.env`, Docker và deploy.

## 2. Cấu trúc tổng quát đề xuất

```text
academic-result-management/
├── README.md
├── .gitignore
├── docker-compose.yml
├── backend/
├── frontend/
├── database/
└── docs/
```

| Đường dẫn | Chức năng | Role phụ trách chính |
| --- | --- | --- |
| `README.md` | Giới thiệu dự án, công nghệ, hướng dẫn chạy local/deploy | Backend + QA + Document Lead |
| `.gitignore` | Loại bỏ file không nên push lên GitHub như `.env`, `node_modules`, `dist` | Database + DevOps |
| `docker-compose.yml` | Chạy backend, frontend, MySQL bằng Docker | Database + DevOps |
| `backend/` | Source code API và nghiệp vụ phía server | Backend + QA + Document Lead |
| `frontend/` | Source code giao diện người dùng | Frontend |
| `database/` | Schema, seed data, migration database | Database + DevOps |
| `docs/` | Tài liệu thiết kế, API, deploy, test | Backend + QA + Document Lead |

## 3. Thư mục backend

### 3.1 Cấu trúc backend

```text
backend/
├── package.json
├── .env.example
├── src/
│   ├── server.js
│   ├── app.js
│   ├── config/
│   │   └── database.js
│   ├── constants/
│   │   └── roles.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── student.controller.js
│   │   ├── class.controller.js
│   │   ├── grade.controller.js
│   │   ├── academic.controller.js
│   │   ├── report.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── grade.service.js
│   │   ├── academic.service.js
│   │   ├── retake.service.js
│   │   ├── report.service.js
│   │   └── audit.service.js
│   ├── repositories/
│   │   ├── user.repository.js
│   │   ├── student.repository.js
│   │   ├── lecturer.repository.js
│   │   ├── course.repository.js
│   │   ├── class-section.repository.js
│   │   ├── enrollment.repository.js
│   │   ├── grade.repository.js
│   │   ├── academic-record.repository.js
│   │   ├── retake.repository.js
│   │   └── audit-log.repository.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── student.routes.js
│   │   ├── class.routes.js
│   │   ├── grade.routes.js
│   │   ├── academic.routes.js
│   │   ├── report.routes.js
│   │   └── admin.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   ├── validations/
│   │   ├── auth.validation.js
│   │   ├── grade.validation.js
│   │   └── user.validation.js
│   └── utils/
│       ├── password.util.js
│       ├── jwt.util.js
│       ├── grade-calculator.util.js
│       └── response.util.js
└── tests/
    ├── auth.test.js
    └── grade.test.js
```

### 3.2 File gốc backend

| File | Chức năng |
| --- | --- |
| `backend/package.json` | Khai báo dependency, script chạy backend |
| `backend/.env.example` | Mẫu biến môi trường cho database, JWT, CORS |
| `backend/src/server.js` | Điểm khởi động server, test kết nối DB, listen port |
| `backend/src/app.js` | Cấu hình Express app, middleware, route, error handler |

### 3.3 Config

| File | Chức năng |
| --- | --- |
| `config/database.js` | Tạo connection pool tới MySQL, export hàm query/test connection |

### 3.4 Constants

| File | Chức năng |
| --- | --- |
| `constants/roles.js` | Khai báo role: `STUDENT`, `LECTURER`, `STAFF`, `ADMIN` để dùng thống nhất |

### 3.5 Controllers

Controller nhận request từ client, lấy dữ liệu từ `req`, gọi service và trả response. Controller không nên chứa logic nghiệp vụ phức tạp.

| File | Chức năng |
| --- | --- |
| `auth.controller.js` | Xử lý request đăng nhập, trả JWT và thông tin user |
| `student.controller.js` | Xử lý request tra cứu thông tin sinh viên, bảng điểm sinh viên |
| `class.controller.js` | Xử lý request danh sách lớp học phần, sinh viên trong lớp |
| `grade.controller.js` | Xử lý request nhập điểm, sửa điểm, khóa bảng điểm |
| `academic.controller.js` | Xử lý request tính điểm tổng kết, xếp loại học lực, cảnh báo học vụ |
| `report.controller.js` | Xử lý request xuất bảng điểm, xuất danh sách thi lại/học lại |
| `admin.controller.js` | Xử lý request quản lý tài khoản và xem audit log |

### 3.6 Services

Service chứa nghiệp vụ chính của hệ thống. Đây là nơi tính điểm, kiểm tra điều kiện, phân quyền nghiệp vụ, transaction và gọi repository.

| File | Chức năng |
| --- | --- |
| `auth.service.js` | Kiểm tra username/password, so sánh bcrypt, tạo JWT |
| `user.service.js` | Tạo, khóa, mở khóa, reset mật khẩu tài khoản |
| `grade.service.js` | Nhập điểm, validate điểm, tính điểm tổng kết môn, khóa bảng điểm |
| `academic.service.js` | Tính điểm trung bình học kỳ, GPA, xếp loại học lực, cảnh báo học vụ |
| `retake.service.js` | Xác định thi lại/học lại, lưu điểm thi lại, chọn điểm hợp lệ |
| `report.service.js` | Tạo dữ liệu bảng điểm, danh sách học vụ, xuất PDF/Excel nếu có |
| `audit.service.js` | Ghi log khi sửa điểm, khóa tài khoản, khóa bảng điểm, tính điểm |

### 3.7 Repositories

Repository chỉ chịu trách nhiệm truy vấn database. Service gọi repository, controller không gọi repository trực tiếp.

| File | Chức năng |
| --- | --- |
| `user.repository.js` | Query bảng `users` |
| `student.repository.js` | Query bảng `students` |
| `lecturer.repository.js` | Query bảng `lecturers` |
| `course.repository.js` | Query bảng `courses`, `grade_rules` |
| `class-section.repository.js` | Query bảng `class_sections` |
| `enrollment.repository.js` | Query bảng `enrollments` |
| `grade.repository.js` | Query bảng `grades`, cập nhật điểm |
| `academic-record.repository.js` | Query bảng `academic_records` |
| `retake.repository.js` | Query bảng `retake_results` |
| `audit-log.repository.js` | Query bảng `audit_logs` |

### 3.8 Routes

Routes ánh xạ URL với controller.

| File | Chức năng |
| --- | --- |
| `auth.routes.js` | `/api/v1/auth/login`, `/api/v1/auth/logout` |
| `student.routes.js` | `/api/v1/students/:id/transcript` |
| `class.routes.js` | `/api/v1/classes`, `/api/v1/classes/:id/students` |
| `grade.routes.js` | `/api/v1/grades`, `/api/v1/grades/bulk`, `/api/v1/classes/:id/lock-grades` |
| `academic.routes.js` | `/api/v1/academic/calculate-final`, `/api/v1/academic/classify` |
| `report.routes.js` | `/api/v1/reports/transcript`, `/api/v1/reports/retakes` |
| `admin.routes.js` | `/api/v1/admin/users`, `/api/v1/admin/audit-logs` |

### 3.9 Middlewares

| File | Chức năng |
| --- | --- |
| `auth.middleware.js` | Kiểm tra JWT, gắn `req.user` |
| `role.middleware.js` | Kiểm tra role có được gọi API không |
| `error.middleware.js` | Bắt lỗi tập trung và trả response thống nhất |
| `validate.middleware.js` | Kiểm tra request body/query/params theo schema validation |

### 3.10 Validations

| File | Chức năng |
| --- | --- |
| `auth.validation.js` | Kiểm tra username/password không rỗng |
| `grade.validation.js` | Kiểm tra điểm từ 0 đến 10, đúng kiểu số |
| `user.validation.js` | Kiểm tra dữ liệu tạo/sửa tài khoản |

### 3.11 Utils

| File | Chức năng |
| --- | --- |
| `password.util.js` | Hash password, compare password bằng bcrypt |
| `jwt.util.js` | Tạo token, verify token |
| `grade-calculator.util.js` | Hàm tính điểm tổng kết, xếp trạng thái môn |
| `response.util.js` | Chuẩn hóa response success/error |

## 4. Thư mục frontend

### 4.1 Cấu trúc frontend

```text
frontend/
├── package.json
├── .env.example
├── index.html
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── routes/
    │   └── AppRouter.jsx
    ├── services/
    │   ├── api.js
    │   ├── auth.api.js
    │   ├── grade.api.js
    │   ├── student.api.js
    │   └── admin.api.js
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── DashboardPage.jsx
    │   ├── GradeInputPage.jsx
    │   ├── StudentTranscriptPage.jsx
    │   ├── AcademicProcessingPage.jsx
    │   ├── AdminUsersPage.jsx
    │   └── AuditLogPage.jsx
    ├── components/
    │   ├── layout/
    │   │   ├── Header.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── common/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Table.jsx
    │   │   └── Modal.jsx
    │   └── grades/
    │       ├── GradeTable.jsx
    │       └── GradeStatusBadge.jsx
    ├── hooks/
    │   ├── useAuth.js
    │   └── useFetch.js
    ├── contexts/
    │   └── AuthContext.jsx
    └── utils/
        ├── formatScore.js
        └── roleMenu.js
```

### 4.2 File gốc frontend

| File | Chức năng |
| --- | --- |
| `frontend/package.json` | Dependency và script chạy/build frontend |
| `frontend/.env.example` | Mẫu `VITE_API_BASE_URL` |
| `frontend/index.html` | HTML gốc của Vite/React |
| `frontend/vite.config.js` | Cấu hình Vite |
| `src/main.jsx` | Điểm khởi động React app |
| `src/App.jsx` | Component gốc, bọc router/context |

### 4.3 Services API

| File | Chức năng |
| --- | --- |
| `api.js` | Tạo Axios instance, tự gắn JWT vào header |
| `auth.api.js` | Gọi API login/logout |
| `grade.api.js` | Gọi API nhập điểm, sửa điểm, khóa bảng điểm |
| `student.api.js` | Gọi API tra cứu bảng điểm sinh viên |
| `admin.api.js` | Gọi API quản lý tài khoản, audit log |

### 4.4 Pages

| File | Chức năng |
| --- | --- |
| `LoginPage.jsx` | Form đăng nhập cho Student/Lecturer/Staff/Admin |
| `DashboardPage.jsx` | Trang tổng quan sau đăng nhập, menu theo role |
| `GradeInputPage.jsx` | Giảng viên nhập điểm theo lớp học phần |
| `StudentTranscriptPage.jsx` | Sinh viên xem điểm thành phần, tổng kết, trạng thái môn |
| `AcademicProcessingPage.jsx` | Giáo vụ tính điểm, xếp loại, lập danh sách học vụ |
| `AdminUsersPage.jsx` | Admin tạo/sửa/khóa tài khoản |
| `AuditLogPage.jsx` | Admin xem lịch sử thao tác |

### 4.5 Components

| File | Chức năng |
| --- | --- |
| `Header.jsx` | Thanh đầu trang, hiển thị tên user và nút logout |
| `Sidebar.jsx` | Menu điều hướng theo role |
| `ProtectedRoute.jsx` | Chặn truy cập khi chưa đăng nhập hoặc sai role |
| `Button.jsx` | Component nút dùng lại |
| `Input.jsx` | Component input dùng lại |
| `Table.jsx` | Component bảng dùng lại |
| `Modal.jsx` | Popup xác nhận/xem chi tiết |
| `GradeTable.jsx` | Bảng nhập/xem điểm |
| `GradeStatusBadge.jsx` | Hiển thị trạng thái `DAT`, `THI_LAI`, `HOC_LAI` |

### 4.6 Hooks, Contexts, Utils

| File | Chức năng |
| --- | --- |
| `useAuth.js` | Hook lấy thông tin đăng nhập, login, logout |
| `useFetch.js` | Hook gọi API và quản lý loading/error |
| `AuthContext.jsx` | Lưu user hiện tại và token trên toàn app |
| `formatScore.js` | Format điểm 1 chữ số thập phân |
| `roleMenu.js` | Sinh menu theo role |

## 5. Thư mục database

```text
database/
├── schema.sql
├── seed.sql
├── migrations/
└── backups/
```

| File/Thư mục | Chức năng |
| --- | --- |
| `schema.sql` | Tạo bảng, khóa chính, khóa ngoại, constraint |
| `seed.sql` | Dữ liệu mẫu để demo |
| `migrations/` | Các thay đổi schema theo thời gian nếu dùng migration |
| `backups/` | Backup database local, không nên push file lớn/lộ dữ liệu |

## 6. Thư mục docs

```text
docs/
├── ERD.md
├── API_SPEC.md
├── DATABASE_SETUP.md
├── DEPLOYMENT.md
├── TESTING_CHECKLIST.md
└── USER_GUIDE.md
```

| File | Chức năng |
| --- | --- |
| `ERD.md` | Mô tả thực thể, quan hệ, tên bảng |
| `API_SPEC.md` | Danh sách endpoint, request/response mẫu |
| `DATABASE_SETUP.md` | Hướng dẫn tạo database và import schema |
| `DEPLOYMENT.md` | Hướng dẫn deploy frontend/backend/database |
| `TESTING_CHECKLIST.md` | Checklist kiểm thử trước khi nộp |
| `USER_GUIDE.md` | Hướng dẫn sử dụng cho từng role |

## 7. Luồng gọi code chuẩn

```text
Route -> Controller -> Service -> Repository -> Database
```

Ví dụ nhập điểm:

```text
POST /api/v1/grades/bulk
-> grade.routes.js
-> grade.controller.js
-> grade.service.js
-> grade.repository.js
-> MySQL table grades
-> audit.service.js
-> audit_logs
```

## 8. Nguyên tắc tách trách nhiệm

| Lớp | Được làm | Không nên làm |
| --- | --- | --- |
| Route | Định nghĩa URL và middleware | Không xử lý nghiệp vụ |
| Controller | Nhận request, gọi service, trả response | Không query database trực tiếp |
| Service | Xử lý nghiệp vụ, transaction, gọi repository | Không phụ thuộc giao diện frontend |
| Repository | Truy vấn database | Không xử lý logic điểm phức tạp |
| Middleware | Xác thực, phân quyền, validate | Không tính điểm |
| Utils | Hàm dùng lại độc lập | Không gọi request/response trực tiếp |

## 9. Gợi ý khi giảng viên hỏi từng phần

| Câu hỏi | Cách trả lời ngắn |
| --- | --- |
| Vì sao tách Service và Repository? | Để nghiệp vụ không phụ thuộc trực tiếp vào câu SQL, dễ bảo trì và test |
| Vì sao có AuditLog? | Vì sửa điểm là thao tác nhạy cảm, cần truy vết người sửa, thời gian, giá trị cũ/mới |
| Vì sao có GradeRule? | Vì mỗi môn có thể có trọng số điểm khác nhau, tách ra để không hard-code công thức |
| Vì sao có Enrollment? | Vì Student và ClassSection là quan hệ nhiều-nhiều, Enrollment là bảng trung gian |
| Vì sao có RetakeResult? | Vì điểm thi lại/học lại cần lưu tách biệt với điểm lần đầu |


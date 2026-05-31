# Kế hoạch thực hiện dự án cho nhóm 3 thành viên

## 1. Nguyên tắc chia việc

Dự án được chia theo 3 role chính để tránh trùng việc, dễ kiểm soát tiến độ và dễ giải thích khi báo cáo với giảng viên.

| Thành viên | Role chính | Phạm vi chịu trách nhiệm |
| --- | --- | --- |
| Thành viên 1 | **Frontend** | Giao diện React, route, form, validate phía client, gọi API, responsive UI, xử lý trạng thái đăng nhập trên client |
| Thành viên 2 | **Backend + QA + Document Lead** | API Node.js/Express, authentication/authorization, business logic, kiểm thử API/chức năng, viết README/tài liệu, tổng hợp checklist nộp |
| Thành viên 3 | **Database + DevOps** | ERD, schema MySQL, seed/migration, kết nối database, Docker/.env, deploy frontend/backend/database, cấu hình production |

> Trong thực tế, mỗi thành viên vẫn cần review code của nhau. Role chính chỉ để xác định người chịu trách nhiệm cuối cùng cho từng phần.

## 2. Bảng trách nhiệm tổng quát theo role

| Nhóm công việc | Frontend | Backend + QA + Document Lead | Database + DevOps |
| --- | --- | --- | --- |
| UI/UX | Chủ trì | Góp ý theo API/luồng nghiệp vụ | Góp ý theo dữ liệu cần hiển thị |
| Backend API | Hỗ trợ test bằng UI/Postman | Chủ trì | Hỗ trợ query, index, dữ liệu mẫu |
| Database | Đề xuất dữ liệu cần hiển thị | Dùng schema để viết repository/service | Chủ trì |
| QA/Test | Test UI, test responsive | Chủ trì checklist/test case/API test | Test DB, deploy, biến môi trường |
| Documentation | Chụp màn hình UI, mô tả giao diện | Chủ trì README, API docs, hướng dẫn sử dụng | Viết DB setup, deploy guide, release note |
| Deploy | Kiểm tra domain frontend | Kiểm tra API production | Chủ trì deploy, env, Docker, cloud database |

## 3. Tổng quan các giai đoạn

| Giai đoạn | Tên giai đoạn | Kết quả cần có | Role chính |
| --- | --- | --- | --- |
| Phase 0 | Khởi tạo dự án | Repository, branch, cấu trúc thư mục, coding convention | Database + DevOps |
| Phase 1 | Phân tích và thiết kế | Use case, ERD, API draft, UI flow, database schema draft | Backend + QA + Document Lead |
| Phase 2 | Thiết kế database | MySQL schema, migration, seed data, kết nối DB | Database + DevOps |
| Phase 3 | Backend API | Auth API, Grade API, Academic API, Admin API | Backend + QA + Document Lead |
| Phase 4 | Frontend UI | Màn hình đăng nhập, nhập điểm, tra cứu, admin | Frontend |
| Phase 5 | Tích hợp | Frontend gọi API thật, xử lý lỗi, phân quyền | Cả nhóm |
| Phase 6 | Kiểm thử | Test chức năng, API, database, bảo mật cơ bản | Backend + QA + Document Lead |
| Phase 7 | Deploy và nộp | Deploy demo, README, tài liệu hướng dẫn, tag release | Database + DevOps + Backend + QA + Document Lead |

## 4. Phase 0 - Khởi tạo dự án

### 4.1 Mục tiêu

Thiết lập nền tảng làm việc để cả nhóm code thống nhất, tránh xung đột và dễ review.

### 4.2 Công việc chi tiết

| Công việc | Role phụ trách | Output |
| --- | --- | --- |
| Tạo GitHub repository | Database + DevOps | Repo public/private |
| Tạo branch `main`, `develop` | Database + DevOps | Nhánh chuẩn để làm việc |
| Tạo cấu trúc thư mục ban đầu | Cả nhóm | `backend/`, `frontend/`, `database/`, `docs/` |
| Tạo project React/Vite | Frontend | Thư mục `frontend/` chạy được |
| Tạo project Node.js/Express | Backend + QA + Document Lead | Thư mục `backend/` chạy được |
| Tạo thư mục database và file SQL mẫu | Database + DevOps | `database/schema.sql`, `database/seed.sql` bản đầu |
| Tạo file `.gitignore` | Database + DevOps | Không push `node_modules`, `.env`, build output |
| Tạo README bản đầu | Backend + QA + Document Lead | README có mô tả dự án, cách chạy |
| Tạo `.env.example` | Database + DevOps + Backend + QA + Document Lead | Mẫu biến môi trường backend/database/frontend |
| Thống nhất quy tắc commit | Cả nhóm | Commit convention |

### 4.3 Branch khởi tạo

```bash
git checkout -b chore/init-project
```

### 4.4 Commit gợi ý

```bash
git add .
git commit -m "chore: initialize project structure"
git push origin chore/init-project
```

## 5. Phase 1 - Phân tích và thiết kế

### 5.1 Mục tiêu

Chuyển nội dung báo cáo thành bản thiết kế đủ rõ để code.

### 5.2 Chia việc

| Role | Công việc |
| --- | --- |
| Frontend | Phác thảo wireframe các màn hình chính: login, dashboard, nhập điểm, tra cứu bảng điểm, admin |
| Backend + QA + Document Lead | Chuẩn hóa use case, viết API draft, user flow, checklist requirement, tổng hợp tài liệu |
| Database + DevOps | Chuẩn hóa ERD, danh sách bảng, khóa chính/khóa ngoại, quy ước tên bảng tiếng Anh |

### 5.3 Output cần có

- `docs/ERD.md`
- `docs/API_SPEC.md`
- `docs/UI_FLOW.md`
- `database/schema_draft.sql`
- Danh sách màn hình frontend cần làm.

### 5.4 Checklist hoàn thành

- [ ] Tên entity dùng tiếng Anh đồng bộ: `Student`, `Course`, `Grade`, `GradeRule`.
- [ ] Tên bảng dùng snake_case: `students`, `courses`, `grades`, `grade_rules`.
- [ ] ERD tuần 3 và database tuần 6 không mâu thuẫn.
- [ ] Có danh sách API cần làm.
- [ ] Có danh sách màn hình cần làm.
- [ ] Có tài liệu mô tả ai phụ trách phần nào.

## 6. Phase 2 - Thiết kế database và kết nối DB

### 6.1 Mục tiêu

Tạo database MySQL chạy được ở local, có dữ liệu mẫu để backend và frontend test.

### 6.2 Chia việc

| Role | Công việc |
| --- | --- |
| Frontend | Xác định dữ liệu cần hiển thị trên bảng điểm, form nhập điểm, dashboard; dùng seed/mock để dựng UI |
| Backend + QA + Document Lead | Viết model/repository theo schema, viết API test kết nối DB, cập nhật tài liệu `.env` |
| Database + DevOps | Chủ trì `schema.sql`, `seed.sql`, index, foreign key, Docker MySQL, import/export database |

### 6.3 Output cần có

- `database/schema.sql`
- `database/seed.sql`
- `backend/src/config/database.js`
- `.env.example`
- `docs/DATABASE_SETUP.md`

### 6.4 Bảng cần có tối thiểu

| Bảng | Vai trò | Role phụ trách chính |
| --- | --- | --- |
| `users` | Tài khoản đăng nhập | Database + DevOps |
| `students` | Sinh viên | Database + DevOps |
| `lecturers` | Giảng viên | Database + DevOps |
| `courses` | Môn học | Database + DevOps |
| `semesters` | Học kỳ | Database + DevOps |
| `grade_rules` | Quy tắc tính điểm | Database + DevOps |
| `grade_entry_periods` | Đợt nhập điểm | Database + DevOps |
| `class_sections` | Lớp học phần | Database + DevOps |
| `enrollments` | Sinh viên tham gia lớp học phần | Database + DevOps |
| `grades` | Điểm thành phần/tổng kết | Database + DevOps + Backend + QA + Document Lead |
| `retake_results` | Thi lại/học lại | Database + DevOps + Backend + QA + Document Lead |
| `academic_records` | GPA/xếp loại học kỳ | Database + DevOps + Backend + QA + Document Lead |
| `audit_logs` | Nhật ký thao tác | Database + DevOps + Backend + QA + Document Lead |

## 7. Phase 3 - Backend API

### 7.1 Mục tiêu

Xây dựng REST API để frontend có thể đăng nhập, nhập điểm, tính điểm, tra cứu điểm và quản trị.

### 7.2 Chia việc

| Role | Công việc |
| --- | --- |
| Frontend | Đọc API draft, chuẩn bị service Axios, test API bằng Postman/cURL để biết dữ liệu trả về |
| Backend + QA + Document Lead | Chủ trì Auth API, Grade API, Academic API, Admin API, middleware phân quyền, API documentation, test case |
| Database + DevOps | Hỗ trợ query, kiểm tra index/foreign key, cấu hình `.env`, đảm bảo backend kết nối database ổn định |

### 7.3 API tối thiểu

| Nhóm | Endpoint | Mục đích | Role chính |
| --- | --- | --- | --- |
| Auth | `POST /api/v1/auth/login` | Đăng nhập | Backend + QA + Document Lead |
| Auth | `POST /api/v1/auth/logout` | Đăng xuất phía client | Backend + QA + Document Lead |
| Students | `GET /api/v1/students/:id/transcript` | Tra cứu bảng điểm | Backend + QA + Document Lead |
| Classes | `GET /api/v1/classes/:id/students` | Lấy danh sách sinh viên trong lớp | Backend + QA + Document Lead |
| Grades | `POST /api/v1/grades/bulk` | Nhập điểm hàng loạt | Backend + QA + Document Lead |
| Grades | `PUT /api/v1/grades/:id` | Sửa điểm | Backend + QA + Document Lead |
| Grades | `POST /api/v1/classes/:id/lock-grades` | Khóa bảng điểm | Backend + QA + Document Lead |
| Academic | `POST /api/v1/academic/calculate-final` | Tính điểm tổng kết | Backend + QA + Document Lead |
| Academic | `POST /api/v1/academic/classify` | Xếp loại học lực | Backend + QA + Document Lead |
| Retake | `GET /api/v1/retakes` | Lấy danh sách thi lại/học lại | Backend + QA + Document Lead |
| Admin | `GET /api/v1/admin/audit-logs` | Tra cứu log | Backend + QA + Document Lead |

## 8. Phase 4 - Frontend UI

### 8.1 Mục tiêu

Xây dựng giao diện dễ dùng, rõ vai trò, phục vụ demo cho giảng viên.

### 8.2 Chia việc

| Role | Công việc |
| --- | --- |
| Frontend | Chủ trì code giao diện, route, form, bảng dữ liệu, validate phía client, responsive |
| Backend + QA + Document Lead | Hỗ trợ định dạng response, chuẩn hóa lỗi API, viết hướng dẫn sử dụng, kiểm thử luồng chính |
| Database + DevOps | Cung cấp seed data đủ đẹp để demo, hỗ trợ cấu hình `VITE_API_BASE_URL`, kiểm tra môi trường chạy |

### 8.3 Màn hình cần có

| Màn hình | Actor | Nội dung | Role chính |
| --- | --- | --- | --- |
| LoginPage | Tất cả | Đăng nhập bằng username/password | Frontend |
| DashboardPage | Tất cả | Hiển thị menu theo vai trò | Frontend |
| GradeInputPage | Lecturer | Chọn lớp, nhập điểm, lưu nháp, khóa bảng điểm | Frontend |
| StudentTranscriptPage | Student | Xem bảng điểm, điểm tổng kết, trạng thái môn | Frontend |
| AcademicProcessingPage | Academic Staff | Tính điểm, xếp loại, lập danh sách học vụ | Frontend |
| AdminUsersPage | Admin | Quản lý tài khoản | Frontend |
| AuditLogPage | Admin | Xem lịch sử thao tác | Frontend |

## 9. Phase 5 - Tích hợp frontend và backend

### 9.1 Mục tiêu

Thay dữ liệu giả bằng API thật, đảm bảo đăng nhập, phân quyền, nhập điểm và tra cứu hoạt động trơn tru.

### 9.2 Công việc

| Công việc | Role phụ trách |
| --- | --- |
| Cấu hình Axios base URL | Frontend |
| Lưu JWT vào localStorage/sessionStorage | Frontend |
| Middleware kiểm tra token ở backend | Backend + QA + Document Lead |
| Test phân quyền từng role | Backend + QA + Document Lead |
| Chuẩn hóa response lỗi | Backend + QA + Document Lead + Frontend |
| Kiểm tra CORS | Database + DevOps + Backend + QA + Document Lead |
| Kiểm tra database production/local | Database + DevOps |
| Ghi lại lỗi và checklist tích hợp | Backend + QA + Document Lead |

### 9.3 Checklist tích hợp

- [ ] Frontend gọi đúng `VITE_API_BASE_URL`.
- [ ] Backend bật CORS đúng domain frontend.
- [ ] API trả lỗi rõ ràng khi token hết hạn.
- [ ] Student không gọi được API nhập điểm.
- [ ] Lecturer không gọi được API quản lý tài khoản.
- [ ] Admin xem được audit log.
- [ ] Database có seed user cho từng role: Student, Lecturer, Academic Staff, Admin.

## 10. Phase 6 - Kiểm thử

### 10.1 Mục tiêu

Đảm bảo hệ thống chạy ổn trước khi nộp.

### 10.2 Chia việc

| Role | Công việc |
| --- | --- |
| Frontend | Test giao diện trên desktop/mobile, test form, test trạng thái loading/error/success |
| Backend + QA + Document Lead | Chủ trì test API, test phân quyền, test nghiệp vụ điểm số, viết biên bản test và checklist lỗi |
| Database + DevOps | Test database transaction, seed data, backup/import/export, test môi trường deploy |

### 10.3 Test case bắt buộc

- Đăng nhập đúng/sai mật khẩu.
- Admin khóa tài khoản, tài khoản bị khóa không đăng nhập được.
- Lecturer nhập điểm hợp lệ từ 0 đến 10.
- Hệ thống chặn điểm âm, điểm lớn hơn 10, điểm không phải số.
- Lecturer khóa bảng điểm.
- Academic Staff tính điểm tổng kết sau khi bảng điểm đã khóa.
- Student xem bảng điểm của chính mình.
- Hệ thống xác định thi lại/học lại đúng theo ngưỡng điểm.
- Audit log ghi lại thao tác sửa điểm.
- Frontend hiển thị lỗi API rõ ràng.
- Deploy production không lỗi CORS/database connection.

## 11. Phase 7 - Deploy và nộp bài

### 11.1 Mục tiêu

Có link demo, source code sạch, tài liệu rõ ràng.

### 11.2 Chia việc

| Role | Công việc |
| --- | --- |
| Frontend | Build frontend, kiểm tra route, UI, responsive, cập nhật ảnh demo nếu cần |
| Backend + QA + Document Lead | Kiểm tra API production, hoàn thiện README, API docs, checklist nộp, test cuối |
| Database + DevOps | Chủ trì deploy backend/frontend/database, cấu hình `.env`, domain, CORS, tạo release/tag |

### 11.3 Output cuối cùng

- Link GitHub repository.
- Link demo frontend.
- Link API backend hoặc tài liệu Postman.
- File README hoàn chỉnh.
- Database schema/seed.
- Tài liệu hướng dẫn chạy local và deploy.
- Báo cáo Word/PDF đã đồng bộ thuật ngữ.

## 12. Bảng timeline gợi ý 4 tuần

| Tuần | Frontend | Backend + QA + Document Lead | Database + DevOps |
| --- | --- | --- | --- |
| Tuần 1 | Wireframe + layout React + routing cơ bản | API spec + setup Express + README bản đầu | ERD + schema draft + Git setup + Docker MySQL |
| Tuần 2 | Login UI + GradeInput UI + Transcript UI | Auth API + Grade API + test Postman | Schema/seed hoàn chỉnh + kết nối DB + hỗ trợ query |
| Tuần 3 | Admin UI + Academic UI + tích hợp API | Academic API + Admin/Audit API + checklist test | CORS/env + deploy thử + backup/import/export DB |
| Tuần 4 | Fix UI + responsive + ảnh demo | Test cuối + docs cuối + hướng dẫn sử dụng | Deploy final + production DB + release/tag |

## 13. Quy tắc phối hợp mỗi ngày

Mỗi thành viên trước khi code nên làm:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<ten-chuc-nang>
```

Sau khi code xong:

```bash
git status
git add .
git commit -m "feat: implement grade input api"
git push origin feature/<ten-chuc-nang>
```

Sau đó tạo Pull Request vào `develop`, không tự push thẳng vào `main`.

## 14. Branch mẫu theo từng role

| Role | Branch nên tạo | Nội dung |
| --- | --- | --- |
| Frontend | `feature/frontend-login`, `feature/frontend-grade-input`, `feature/frontend-transcript`, `feature/frontend-admin` | Giao diện, route, form, gọi API |
| Backend + QA + Document Lead | `feature/backend-auth`, `feature/backend-grade-api`, `feature/backend-academic-api`, `docs/api-spec`, `test/api-checklist` | API, service, middleware, kiểm thử, tài liệu |
| Database + DevOps | `feature/database-schema`, `feature/database-seed`, `feature/deployment-config`, `chore/docker-env`, `release/v1.0` | Database, Docker, env, deploy, release |

# Hệ thống Quản lý Kết quả Học tập

## 1. Tóm tắt chủ đề

Dự án **Hệ thống Quản lý Kết quả Học tập** xây dựng một phần mềm hỗ trợ nhà trường quản lý vòng đời điểm số của sinh viên, bao gồm nhập điểm thành phần, tính điểm tổng kết, xếp loại học lực, xử lý học lại/thi lại, tra cứu bảng điểm và ghi nhận nhật ký thao tác quan trọng.

Phạm vi hệ thống tập trung vào dữ liệu học tập, trong đó sinh viên được định danh chủ yếu bằng **mã sinh viên**. Hệ thống không đi sâu vào quản lý lý lịch sinh viên, học phí, khen thưởng/kỷ luật hoặc đăng ký môn học phức tạp.

## 2. Mục tiêu chính

- Cho phép giảng viên nhập và chỉnh sửa điểm theo lớp học phần.
- Tự động tính điểm tổng kết theo quy tắc điểm của từng môn học.
- Xếp loại học lực theo học kỳ hoặc năm học.
- Xác định sinh viên thuộc diện thi lại hoặc học lại.
- Cho phép sinh viên tra cứu bảng điểm theo tài khoản/mã sinh viên.
- Cho phép quản trị viên quản lý tài khoản, phân quyền và nhật ký hệ thống.
- Chuẩn hóa quy trình làm việc nhóm 3 thành viên bằng Git, branch, commit, pull request, test và deploy.

## 3. Phân chia 3 role trong nhóm

| Thành viên | Role chính | Phạm vi chịu trách nhiệm |
| --- | --- | --- |
| Thành viên 1 | **Frontend** | Giao diện React, route, form, validate phía client, gọi API, responsive UI, xử lý trạng thái đăng nhập trên client |
| Thành viên 2 | **Backend + QA + Document Lead** | API Node.js/Express, authentication/authorization, business logic, kiểm thử API/chức năng, viết README/tài liệu, tổng hợp checklist nộp |
| Thành viên 3 | **Database + DevOps** | ERD, schema MySQL, seed/migration, kết nối database, Docker/.env, deploy frontend/backend/database, cấu hình production |

> Ghi chú: Role chính dùng để xác định người chịu trách nhiệm cuối cùng. Khi làm thật, 3 thành viên vẫn cần review chéo và hỗ trợ nhau ở các bước tích hợp.

## 4. Công nghệ đề xuất

> Có thể thay đổi theo yêu cầu môn học, nhưng bộ tài liệu này đang giả định triển khai theo mô hình phổ biến: **ReactJS + Node.js/Express + MySQL**.

| Thành phần | Công nghệ đề xuất | Role phụ trách chính |
| --- | --- | --- |
| Frontend | ReactJS, Vite, Axios | Frontend |
| Backend | Node.js, Express.js | Backend + QA + Document Lead |
| Database | MySQL | Database + DevOps |
| ORM/Query | Sequelize hoặc mysql2 | Backend + QA + Document Lead + Database + DevOps |
| Authentication | JWT + bcrypt | Backend + QA + Document Lead |
| Deploy | Render/Railway/Vercel/VPS + MySQL Cloud | Database + DevOps |
| Tài liệu/kiểm thử | Markdown, Postman, checklist test | Backend + QA + Document Lead |
| Quản lý mã nguồn | Git + GitHub | Cả nhóm, Database + DevOps hỗ trợ cấu hình repo/release |

## 5. Vai trò người dùng của hệ thống

| Vai trò | Mô tả |
| --- | --- |
| Student | Tra cứu bảng điểm, xem trạng thái đạt/rớt/thi lại/học lại |
| Lecturer | Nhập điểm, sửa điểm trong thời gian mở cổng, khóa bảng điểm |
| Academic Staff | Mở/đóng đợt nhập điểm, tính điểm tổng kết, xếp loại học lực, lập danh sách học vụ |
| Admin | Quản lý tài khoản, phân quyền, tra cứu audit log, cấu hình hệ thống |

## 6. Chức năng chính

| Nhóm chức năng | Chức năng | Role phát triển chính |
| --- | --- | --- |
| Authentication | Đăng nhập, đăng xuất, kiểm tra JWT, phân quyền theo vai trò | Backend + QA + Document Lead |
| Student Management | Quản lý thông tin sinh viên tối giản theo mã sinh viên | Backend + QA + Document Lead + Database + DevOps |
| Course/Class Management | Quản lý môn học, học kỳ, lớp học phần, giảng viên phụ trách | Backend + QA + Document Lead + Database + DevOps |
| Grade Management | Nhập điểm thành phần, kiểm tra điểm hợp lệ, tính điểm tổng kết | Backend + QA + Document Lead |
| Academic Processing | Xếp loại học lực, cảnh báo học vụ, xử lý thi lại/học lại | Backend + QA + Document Lead |
| Report | Xuất bảng điểm, danh sách thi lại/học lại, thống kê kết quả | Frontend + Backend + QA + Document Lead |
| Admin & Audit | Quản lý tài khoản, khóa/mở tài khoản, ghi log thao tác nhạy cảm | Backend + QA + Document Lead + Database + DevOps |
| UI/UX | Trang login, dashboard, nhập điểm, tra cứu điểm, admin | Frontend |
| Deployment | Deploy frontend, backend, database, cấu hình biến môi trường | Database + DevOps |

## 7. Cấu trúc tài liệu Markdown trong bộ này

| File | Mục đích |
| --- | --- |
| `README.md` | Tóm tắt chủ đề, công nghệ, chức năng, cách chạy nhanh, phân chia 3 role |
| `01_CHU_DE_VA_PHAM_VI.md` | Mô tả chủ đề, phạm vi, actor, yêu cầu chức năng và phi chức năng |
| `02_KE_HOACH_GIAI_DOAN_3_THANH_VIEN.md` | Kế hoạch chia việc cho 3 role theo từng giai đoạn |
| `03_GIT_BRANCH_COMMIT_WORKFLOW.md` | Quy định tạo branch, commit, pull request, merge và xử lý conflict theo từng role |
| `04_DATABASE_CONNECTION.md` | Hướng dẫn thiết kế, tạo database, kết nối MySQL và seed dữ liệu |
| `05_DEPLOYMENT_GUIDE.md` | Hướng dẫn build, cấu hình môi trường và deploy frontend/backend/database |
| `06_FILE_FUNCTIONS_MAP.md` | Diễn tả chức năng từng thư mục/file trong dự án và role phụ trách |
| `07_TESTING_CHECKLIST.md` | Checklist test chức năng, test API, test database, test trước khi nộp |
| `00_INDEX.md` | Mục lục điều hướng toàn bộ tài liệu |

## 8. Cách chạy nhanh ở local

### 8.1 Clone repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 8.2 Cài backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 8.3 Cài frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 8.4 Tạo database MySQL

```sql
CREATE DATABASE academic_result_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Sau đó import file:

```bash
mysql -u root -p academic_result_management < database/schema.sql
mysql -u root -p academic_result_management < database/seed.sql
```

## 9. Quy ước tên thực thể và bảng

| Thực thể logic | Bảng vật lý |
| --- | --- |
| User | `users` |
| Student | `students` |
| Lecturer | `lecturers` |
| Course | `courses` |
| Semester | `semesters` |
| ClassSection | `class_sections` |
| Enrollment | `enrollments` |
| Grade | `grades` |
| GradeRule | `grade_rules` |
| GradeEntryPeriod | `grade_entry_periods` |
| RetakeResult | `retake_results` |
| AcademicRecord | `academic_records` |
| AuditLog | `audit_logs` |

## 10. Quy trình nộp bài gợi ý

1. Mỗi role tạo branch riêng theo chức năng được giao.
2. Code xong tạo pull request vào `develop`.
3. Backend + QA + Document Lead kiểm thử API/chức năng và cập nhật tài liệu.
4. Frontend kiểm tra UI, responsive và luồng người dùng.
5. Database + DevOps kiểm tra schema, `.env`, Docker/deploy và production database.
6. Merge vào `develop` sau khi chạy test thành công.
7. Tạo release branch `release/v1.0`.
8. Test lần cuối, sửa lỗi nhỏ nếu có.
9. Merge vào `main`.
10. Tạo tag nộp bài:

```bash
git tag -a v1.0-final -m "Final submission for Academic Result Management System"
git push origin v1.0-final
```

# Hướng dẫn Database và Kết nối MySQL

## 1. Mục tiêu

File này hướng dẫn cách thiết kế database, tạo schema MySQL, cấu hình `.env`, kết nối backend với database và seed dữ liệu mẫu cho dự án **Hệ thống Quản lý Kết quả Học tập**.


## 1.1 Role phụ trách phần database

| Thành viên | Role chính | Phạm vi chịu trách nhiệm |
| --- | --- | --- |
| Thành viên 1 | **Frontend** | Giao diện React, route, form, validate phía client, gọi API, responsive UI, xử lý trạng thái đăng nhập trên client |
| Thành viên 2 | **Backend + QA + Document Lead** | API Node.js/Express, authentication/authorization, business logic, kiểm thử API/chức năng, viết README/tài liệu, tổng hợp checklist nộp |
| Thành viên 3 | **Database + DevOps** | ERD, schema MySQL, seed/migration, kết nối database, Docker/.env, deploy frontend/backend/database, cấu hình production |

Trong file này, **Database + DevOps** là role chịu trách nhiệm chính. **Backend + QA + Document Lead** dùng kết nối này để viết API/repository và test. **Frontend** dùng seed data để dựng giao diện và kiểm tra dữ liệu hiển thị.

## 2. Database sử dụng

- Hệ quản trị CSDL: **MySQL**
- Charset: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`
- Tên database đề xuất: `academic_result_management`

## 3. Tạo database local

Đăng nhập MySQL:

```bash
mysql -u root -p
```

Tạo database:

```sql
CREATE DATABASE academic_result_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Tạo user riêng cho project:

```sql
CREATE USER 'academic_app'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON academic_result_management.* TO 'academic_app'@'localhost';
FLUSH PRIVILEGES;
```

## 4. Danh sách bảng chính

| Bảng | Mục đích |
| --- | --- |
| `users` | Lưu tài khoản đăng nhập, mật khẩu đã băm, role |
| `students` | Lưu thông tin sinh viên tối giản |
| `lecturers` | Lưu thông tin giảng viên |
| `courses` | Lưu thông tin môn học |
| `semesters` | Lưu học kỳ/năm học |
| `grade_rules` | Lưu tỷ lệ điểm và ngưỡng đạt/rớt |
| `grade_entry_periods` | Lưu thời gian mở/đóng cổng nhập điểm |
| `class_sections` | Lưu lớp học phần |
| `enrollments` | Lưu sinh viên tham gia lớp học phần |
| `grades` | Lưu điểm thành phần, điểm tổng kết, trạng thái môn |
| `retake_results` | Lưu kết quả thi lại/học lại |
| `academic_records` | Lưu điểm trung bình học kỳ, GPA, xếp loại |
| `audit_logs` | Lưu lịch sử thao tác nhạy cảm |

## 5. Schema SQL mẫu

> Schema này có thể dùng làm bản khởi đầu. Khi code thực tế, nhóm có thể tách thành migration riêng.

```sql
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'LECTURER', 'STAFF', 'ADMIN') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50),
    gpa DECIMAL(4,2) DEFAULT 0,
    warning_level INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE lecturers (
    lecturer_id VARCHAR(20) PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE semesters (
    semester_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    school_year VARCHAR(20) NOT NULL,
    start_date DATE,
    end_date DATE
);

CREATE TABLE grade_rules (
    rule_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    attendance_weight DECIMAL(4,2) NOT NULL DEFAULT 0,
    assignment_weight DECIMAL(4,2) NOT NULL DEFAULT 0,
    midterm_weight DECIMAL(4,2) NOT NULL DEFAULT 0,
    final_weight DECIMAL(4,2) NOT NULL DEFAULT 0,
    pass_threshold DECIMAL(4,2) NOT NULL DEFAULT 4.00,
    retake_threshold DECIMAL(4,2) NOT NULL DEFAULT 4.00,
    CHECK (attendance_weight + assignment_weight + midterm_weight + final_weight = 1.00)
);

CREATE TABLE courses (
    course_id VARCHAR(20) PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL,
    credits INT NOT NULL,
    rule_id BIGINT NOT NULL,
    FOREIGN KEY (rule_id) REFERENCES grade_rules(rule_id)
);

CREATE TABLE grade_entry_periods (
    period_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    semester_id VARCHAR(20) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id)
);

CREATE TABLE class_sections (
    class_id VARCHAR(30) PRIMARY KEY,
    course_id VARCHAR(20) NOT NULL,
    semester_id VARCHAR(20) NOT NULL,
    lecturer_id VARCHAR(20) NOT NULL,
    period_id BIGINT,
    max_students INT DEFAULT 0,
    is_grade_locked BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'OPEN',
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id),
    FOREIGN KEY (lecturer_id) REFERENCES lecturers(lecturer_id),
    FOREIGN KEY (period_id) REFERENCES grade_entry_periods(period_id)
);

CREATE TABLE enrollments (
    enrollment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    class_id VARCHAR(30) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, class_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (class_id) REFERENCES class_sections(class_id)
);

CREATE TABLE grades (
    grade_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT NOT NULL UNIQUE,
    attendance_score DECIMAL(4,1),
    assignment_score DECIMAL(4,1),
    midterm_score DECIMAL(4,1),
    final_score DECIMAL(4,1),
    total_score DECIMAL(4,1),
    status ENUM('DAT', 'KHONG_DAT', 'THI_LAI', 'HOC_LAI') DEFAULT 'KHONG_DAT',
    updated_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id),
    CHECK (attendance_score IS NULL OR attendance_score BETWEEN 0 AND 10),
    CHECK (assignment_score IS NULL OR assignment_score BETWEEN 0 AND 10),
    CHECK (midterm_score IS NULL OR midterm_score BETWEEN 0 AND 10),
    CHECK (final_score IS NULL OR final_score BETWEEN 0 AND 10),
    CHECK (total_score IS NULL OR total_score BETWEEN 0 AND 10)
);

CREATE TABLE retake_results (
    retake_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT NOT NULL,
    retake_score DECIMAL(4,1) NOT NULL,
    accepted_score DECIMAL(4,1),
    attempt_no INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(enrollment_id),
    CHECK (retake_score BETWEEN 0 AND 10)
);

CREATE TABLE academic_records (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    semester_id VARCHAR(20) NOT NULL,
    semester_average DECIMAL(4,2),
    gpa DECIMAL(4,2),
    classification VARCHAR(30),
    warning_level INT DEFAULT 0,
    UNIQUE (student_id, semester_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (semester_id) REFERENCES semesters(semester_id)
);

CREATE TABLE audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50),
    target_id VARCHAR(50),
    before_value JSON,
    after_value JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_user_id) REFERENCES users(user_id)
);
```

## 6. File `.env.example` cho backend

Tạo file `backend/.env.example`:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=academic_result_management
DB_USER=academic_app
DB_PASSWORD=StrongPassword123!

JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=1d

CORS_ORIGIN=http://localhost:5173
```

Khi chạy local, copy:

```bash
cp backend/.env.example backend/.env
```

Không commit file `.env` thật lên GitHub.

## 7. Kết nối MySQL bằng mysql2

Cài thư viện:

```bash
cd backend
npm install mysql2 dotenv
```

Tạo file `backend/src/config/database.js`:

```js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    console.log('Database connected successfully');
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection };
```

Dùng trong `server.js`:

```js
const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Cannot start server:', error.message);
    process.exit(1);
  }
}

bootstrap();
```

## 8. Repository mẫu

`backend/src/repositories/grade.repository.js`:

```js
const { pool } = require('../config/database');

async function findGradeById(gradeId) {
  const [rows] = await pool.execute(
    'SELECT * FROM grades WHERE grade_id = ?',
    [gradeId]
  );
  return rows[0] || null;
}

async function updateGrade(gradeId, data, actorUserId) {
  const sql = `
    UPDATE grades
    SET attendance_score = ?, assignment_score = ?, midterm_score = ?, final_score = ?, updated_by = ?
    WHERE grade_id = ?
  `;

  const params = [
    data.attendanceScore,
    data.assignmentScore,
    data.midtermScore,
    data.finalScore,
    actorUserId,
    gradeId,
  ];

  const [result] = await pool.execute(sql, params);
  return result.affectedRows > 0;
}

module.exports = {
  findGradeById,
  updateGrade,
};
```

## 9. Nguyên tắc an toàn khi truy vấn database

| Nguyên tắc | Lý do |
| --- | --- |
| Dùng parameterized query `?` | Tránh SQL Injection |
| Không nối chuỗi SQL bằng input người dùng | Dễ bị tấn công |
| Không log password/token | Tránh lộ dữ liệu nhạy cảm |
| Dùng transaction khi tính điểm hàng loạt | Tránh lưu dữ liệu nửa chừng |
| Validate điểm trước khi lưu | Đảm bảo điểm nằm trong 0-10 |
| Ghi audit log khi sửa điểm | Có thể truy vết khi có tranh chấp |

## 10. Transaction khi nhập điểm hàng loạt

```js
const { pool } = require('../config/database');

async function bulkUpdateGrades(items, actorUserId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const item of items) {
      await connection.execute(
        `UPDATE grades
         SET attendance_score = ?, assignment_score = ?, midterm_score = ?, final_score = ?, updated_by = ?
         WHERE grade_id = ?`,
        [
          item.attendanceScore,
          item.assignmentScore,
          item.midtermScore,
          item.finalScore,
          actorUserId,
          item.gradeId,
        ]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

## 11. Seed dữ liệu mẫu

Ví dụ `database/seed.sql`:

```sql
INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2b$10$examplehash', 'ADMIN'),
('GV001', '$2b$10$examplehash', 'LECTURER'),
('SV001', '$2b$10$examplehash', 'STUDENT');

INSERT INTO grade_rules (rule_name, attendance_weight, assignment_weight, midterm_weight, final_weight, pass_threshold, retake_threshold)
VALUES ('Default 10-20-20-50', 0.10, 0.20, 0.20, 0.50, 4.00, 4.00);

INSERT INTO semesters (semester_id, name, school_year, start_date, end_date)
VALUES ('HK1_2025', 'Học kỳ 1', '2025-2026', '2025-09-01', '2026-01-15');
```

## 12. Import database

```bash
mysql -u academic_app -p academic_result_management < database/schema.sql
mysql -u academic_app -p academic_result_management < database/seed.sql
```

## 13. Backup database

```bash
mysqldump -u academic_app -p academic_result_management > backup_academic_result.sql
```

## 14. Restore database

```bash
mysql -u academic_app -p academic_result_management < backup_academic_result.sql
```

## 15. Checklist database trước khi nộp

- [ ] Có file `database/schema.sql`.
- [ ] Có file `database/seed.sql`.
- [ ] Có `.env.example` nhưng không có `.env` trên GitHub.
- [ ] Tên bảng đồng bộ tiếng Anh snake_case.
- [ ] Có khóa chính và khóa ngoại rõ ràng.
- [ ] Có ràng buộc điểm từ 0 đến 10.
- [ ] Có bảng `audit_logs`.
- [ ] Backend kết nối database thành công.
- [ ] Có hướng dẫn import database trong README.


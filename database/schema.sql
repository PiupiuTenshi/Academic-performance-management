CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'lecturer', 'academic_staff', 'admin') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED UNIQUE,
  student_code VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS lecturers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED UNIQUE,
  lecturer_code VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lecturers_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS courses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  course_code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  credits TINYINT UNSIGNED NOT NULL
);

CREATE TABLE IF NOT EXISTS semesters (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  starts_on DATE,
  ends_on DATE,
  UNIQUE KEY uq_semesters_name_year (name, academic_year)
);

CREATE TABLE IF NOT EXISTS grade_rules (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  course_id BIGINT UNSIGNED NOT NULL UNIQUE,
  attendance_weight DECIMAL(4, 3) NOT NULL DEFAULT 0.100,
  assignment_weight DECIMAL(4, 3) NOT NULL DEFAULT 0.200,
  midterm_weight DECIMAL(4, 3) NOT NULL DEFAULT 0.200,
  final_weight DECIMAL(4, 3) NOT NULL DEFAULT 0.500,
  passing_score DECIMAL(4, 2) NOT NULL DEFAULT 4.00,
  retake_score DECIMAL(4, 2) NOT NULL DEFAULT 3.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_grade_rules_course FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE IF NOT EXISTS grade_entry_periods (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  semester_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_grade_entry_periods_semester_name (semester_id, name),
  CONSTRAINT fk_grade_entry_periods_semester FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

CREATE TABLE IF NOT EXISTS class_sections (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  section_code VARCHAR(50) NOT NULL UNIQUE,
  course_id BIGINT UNSIGNED NOT NULL,
  semester_id BIGINT UNSIGNED NOT NULL,
  lecturer_id BIGINT UNSIGNED NOT NULL,
  is_grade_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_class_sections_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT fk_class_sections_semester FOREIGN KEY (semester_id) REFERENCES semesters(id),
  CONSTRAINT fk_class_sections_lecturer FOREIGN KEY (lecturer_id) REFERENCES lecturers(id)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  class_section_id BIGINT UNSIGNED NOT NULL,
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enrollments_student_class (student_id, class_section_id),
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_enrollments_class_section FOREIGN KEY (class_section_id) REFERENCES class_sections(id)
);

CREATE TABLE IF NOT EXISTS grades (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  enrollment_id BIGINT UNSIGNED NOT NULL UNIQUE,
  attendance_score DECIMAL(4, 2),
  assignment_score DECIMAL(4, 2),
  midterm_score DECIMAL(4, 2),
  final_score DECIMAL(4, 2),
  total_score DECIMAL(4, 2),
  status ENUM('draft', 'passed', 'failed', 'retake', 'repeat') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_grades_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);

CREATE TABLE IF NOT EXISTS retake_results (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  semester_id BIGINT UNSIGNED NOT NULL,
  grade_id BIGINT UNSIGNED,
  status ENUM('retake', 'repeat') NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_retake_results_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_retake_results_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT fk_retake_results_semester FOREIGN KEY (semester_id) REFERENCES semesters(id),
  CONSTRAINT fk_retake_results_grade FOREIGN KEY (grade_id) REFERENCES grades(id)
);

CREATE TABLE IF NOT EXISTS academic_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT UNSIGNED NOT NULL,
  semester_id BIGINT UNSIGNED NOT NULL,
  average_score DECIMAL(4, 2) NOT NULL,
  total_credits SMALLINT UNSIGNED NOT NULL,
  classification ENUM('weak', 'average', 'good', 'excellent') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_academic_records_student_semester (student_id, semester_id),
  CONSTRAINT fk_academic_records_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_academic_records_semester FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id BIGINT UNSIGNED,
  old_value JSON,
  new_value JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_class_sections_semester ON class_sections(semester_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_section_id);
CREATE INDEX idx_grades_status ON grades(status);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

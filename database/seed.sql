SET @demo_password_hash = '$2b$10$teOi3V5PqpyEUrm76n52iuMhcSmqJY5DVxWdaUSFF9V93WbtKZD16';

INSERT INTO users (username, password_hash, role)
VALUES
  ('admin', @demo_password_hash, 'admin'),
  ('academic01', @demo_password_hash, 'academic_staff'),
  ('lecturer01', @demo_password_hash, 'lecturer'),
  ('student01', @demo_password_hash, 'student')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  is_active = TRUE;

INSERT INTO students (user_id, student_code, full_name, email)
SELECT id, 'SV001', 'Nguyen Van A', 'student01@example.com'
FROM users
WHERE username = 'student01'
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  email = VALUES(email);

INSERT INTO lecturers (user_id, lecturer_code, full_name, email)
SELECT id, 'GV001', 'Tran Thi B', 'lecturer01@example.com'
FROM users
WHERE username = 'lecturer01'
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  email = VALUES(email);

INSERT INTO courses (course_code, name, credits)
VALUES
  ('CS101', 'Nhap mon lap trinh', 3),
  ('DB201', 'Co so du lieu', 3)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  credits = VALUES(credits);

INSERT INTO semesters (name, academic_year, starts_on, ends_on)
VALUES ('Hoc ky 1', '2025-2026', '2025-09-01', '2026-01-15')
ON DUPLICATE KEY UPDATE
  starts_on = VALUES(starts_on),
  ends_on = VALUES(ends_on);

INSERT INTO grade_rules (course_id, attendance_weight, assignment_weight, midterm_weight, final_weight, passing_score, retake_score)
SELECT id, 0.100, 0.200, 0.200, 0.500, 4.00, 3.00
FROM courses
WHERE course_code = 'CS101'
ON DUPLICATE KEY UPDATE
  attendance_weight = VALUES(attendance_weight),
  assignment_weight = VALUES(assignment_weight),
  midterm_weight = VALUES(midterm_weight),
  final_weight = VALUES(final_weight),
  passing_score = VALUES(passing_score),
  retake_score = VALUES(retake_score);

INSERT INTO grade_entry_periods (semester_id, name, starts_at, ends_at, is_open)
SELECT id, 'Dot nhap diem HK1', '2025-12-01 00:00:00', '2026-01-31 23:59:59', TRUE
FROM semesters
WHERE name = 'Hoc ky 1' AND academic_year = '2025-2026'
ON DUPLICATE KEY UPDATE
  starts_at = VALUES(starts_at),
  ends_at = VALUES(ends_at),
  is_open = VALUES(is_open);

INSERT INTO class_sections (section_code, course_id, semester_id, lecturer_id)
SELECT 'CS101-01', c.id, s.id, l.id
FROM courses c
JOIN semesters s ON s.name = 'Hoc ky 1' AND s.academic_year = '2025-2026'
JOIN lecturers l ON l.lecturer_code = 'GV001'
WHERE c.course_code = 'CS101'
ON DUPLICATE KEY UPDATE
  course_id = VALUES(course_id),
  semester_id = VALUES(semester_id),
  lecturer_id = VALUES(lecturer_id);

INSERT INTO enrollments (student_id, class_section_id)
SELECT st.id, cs.id
FROM students st
JOIN class_sections cs ON cs.section_code = 'CS101-01'
WHERE st.student_code = 'SV001'
ON DUPLICATE KEY UPDATE
  enrolled_at = enrolled_at;

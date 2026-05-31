INSERT INTO users (username, password_hash, role)
VALUES
  ('admin', 'replace_with_bcrypt_hash', 'admin'),
  ('lecturer01', 'replace_with_bcrypt_hash', 'lecturer'),
  ('student01', 'replace_with_bcrypt_hash', 'student')
ON DUPLICATE KEY UPDATE username = VALUES(username);

INSERT INTO students (user_id, student_code, full_name, email)
SELECT id, 'SV001', 'Nguyen Van A', 'student01@example.com'
FROM users
WHERE username = 'student01'
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO lecturers (user_id, lecturer_code, full_name, email)
SELECT id, 'GV001', 'Tran Thi B', 'lecturer01@example.com'
FROM users
WHERE username = 'lecturer01'
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO courses (course_code, name, credits)
VALUES
  ('CS101', 'Nhap mon lap trinh', 3),
  ('DB201', 'Co so du lieu', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name), credits = VALUES(credits);


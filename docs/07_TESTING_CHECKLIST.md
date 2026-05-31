# Checklist kiểm thử dự án

## 1. Mục tiêu

Checklist này giúp nhóm kiểm tra hệ thống **Quản lý Kết quả Học tập** trước khi merge code, deploy và nộp bài.


## 1.1 Role phụ trách kiểm thử

| Thành viên | Role chính | Phạm vi chịu trách nhiệm |
| --- | --- | --- |
| Thành viên 1 | **Frontend** | Giao diện React, route, form, validate phía client, gọi API, responsive UI, xử lý trạng thái đăng nhập trên client |
| Thành viên 2 | **Backend + QA + Document Lead** | API Node.js/Express, authentication/authorization, business logic, kiểm thử API/chức năng, viết README/tài liệu, tổng hợp checklist nộp |
| Thành viên 3 | **Database + DevOps** | ERD, schema MySQL, seed/migration, kết nối database, Docker/.env, deploy frontend/backend/database, cấu hình production |

| Nhóm test | Role chính | Ghi chú |
| --- | --- | --- |
| Test UI/responsive | Frontend | Kiểm tra form, bảng, route, mobile/desktop |
| Test API/business logic | Backend + QA + Document Lead | Chủ trì Postman/cURL, phân quyền, nghiệp vụ điểm số |
| Test database/deploy | Database + DevOps | Kiểm tra schema, seed, transaction, production env, CORS |
| Biên bản test/tài liệu lỗi | Backend + QA + Document Lead | Tổng hợp lỗi, trạng thái fix, checklist cuối |

## 2. Quy tắc test chung

- Test theo từng role: Student, Lecturer, Academic Staff, Admin.
- Test cả trường hợp đúng và sai.
- Test API bằng Postman/cURL trước khi tích hợp frontend.
- Test lại sau khi deploy vì môi trường production có thể khác local.
- Ghi lại lỗi bằng issue hoặc checklist, không sửa miệng.

## 3. Test Authentication

| Test case | Bước kiểm tra | Kết quả mong muốn | Trạng thái |
| --- | --- | --- | --- |
| Login đúng | Nhập username/password hợp lệ | Nhận JWT và vào dashboard | [ ] |
| Login sai mật khẩu | Nhập sai password | Trả lỗi 401 | [ ] |
| Login tài khoản bị khóa | Admin khóa user rồi login | Trả lỗi 403 | [ ] |
| Token hết hạn | Dùng token cũ | Bị yêu cầu đăng nhập lại | [ ] |
| Không có token | Gọi API cần auth | Trả lỗi 401 | [ ] |

## 4. Test phân quyền

| Test case | Bước kiểm tra | Kết quả mong muốn | Trạng thái |
| --- | --- | --- | --- |
| Student gọi API nhập điểm | Dùng token Student gọi `/grades/bulk` | Bị chặn 403 | [ ] |
| Lecturer gọi API quản lý user | Dùng token Lecturer gọi `/admin/users` | Bị chặn 403 | [ ] |
| Admin xem audit log | Dùng token Admin gọi `/admin/audit-logs` | Trả danh sách log | [ ] |
| Lecturer nhập điểm lớp không phụ trách | Gọi API nhập điểm class khác | Bị chặn | [ ] |

## 5. Test nhập điểm

| Test case | Input | Kết quả mong muốn | Trạng thái |
| --- | --- | --- | --- |
| Nhập điểm hợp lệ | 8, 7.5, 9, 6.5 | Lưu thành công | [ ] |
| Điểm âm | -1 | Báo lỗi điểm không hợp lệ | [ ] |
| Điểm lớn hơn 10 | 11 | Báo lỗi điểm không hợp lệ | [ ] |
| Điểm là chữ | `abc` | Báo lỗi sai định dạng | [ ] |
| Thiếu điểm | finalScore rỗng | Không cho tính điểm tổng kết nếu bắt buộc đủ điểm | [ ] |
| Sửa điểm | Sửa 7 thành 8 | Lưu điểm mới và ghi audit log | [ ] |
| Nhập điểm ngoài đợt | Đợt nhập điểm đã đóng | Không cho lưu | [ ] |

## 6. Test tính điểm tổng kết

Giả sử công thức:

```text
total = attendance * 0.1 + assignment * 0.2 + midterm * 0.2 + final * 0.5
```

| Test case | Input | Kết quả mong muốn | Trạng thái |
| --- | --- | --- | --- |
| Tính đúng công thức | 8, 7, 6, 9 | `7.9` nếu làm tròn 1 chữ số | [ ] |
| Thiếu điểm thành phần | finalScore null | Không tính, báo thiếu điểm | [ ] |
| Bảng điểm chưa khóa | `is_grade_locked = false` | Không cho Academic Staff tính tổng kết | [ ] |
| Bảng điểm đã khóa | `is_grade_locked = true` | Cho tính tổng kết | [ ] |

## 7. Test trạng thái môn học

| Test case | Điều kiện | Kết quả mong muốn | Trạng thái |
| --- | --- | --- | --- |
| Đạt môn | totalScore >= 4.0 | `DAT` | [ ] |
| Không đạt | totalScore < 4.0 | `KHONG_DAT` hoặc phân loại tiếp | [ ] |
| Thuộc diện thi lại | Theo ngưỡng thi lại của quy định | `THI_LAI` | [ ] |
| Thuộc diện học lại | Theo ngưỡng học lại của quy định | `HOC_LAI` | [ ] |

## 8. Test xếp loại học lực

| Test case | GPA/semesterAverage | Kết quả mong muốn | Trạng thái |
| --- | --- | --- | --- |
| Yếu | < 5.0 | `Yếu` | [ ] |
| Trung bình | 5.0 - 6.4 | `Trung bình` | [ ] |
| Khá | 6.5 - 7.9 | `Khá` | [ ] |
| Giỏi | 8.0 - 10.0 | `Giỏi` | [ ] |
| Dữ liệu học kỳ chưa hoàn tất | Còn lớp chưa tính tổng kết | Không cho xếp loại | [ ] |

## 9. Test Student tra cứu bảng điểm

| Test case | Bước kiểm tra | Kết quả mong muốn | Trạng thái |
| --- | --- | --- | --- |
| Xem toàn bộ bảng điểm | Student login và mở transcript | Hiển thị môn, điểm, trạng thái | [ ] |
| Lọc theo học kỳ | Chọn học kỳ | Chỉ hiển thị môn thuộc học kỳ đó | [ ] |
| Sinh viên chưa có điểm | Dữ liệu rỗng | Hiển thị “Chưa có dữ liệu điểm số” | [ ] |
| Không xem điểm người khác | Student đổi URL sang mã SV khác | Bị chặn hoặc chỉ xem dữ liệu của mình | [ ] |

## 10. Test Admin

| Test case | Bước kiểm tra | Kết quả mong muốn | Trạng thái |
| --- | --- | --- | --- |
| Tạo tài khoản | Admin nhập thông tin user mới | Tạo thành công | [ ] |
| Trùng username | Tạo user đã tồn tại | Báo lỗi | [ ] |
| Khóa tài khoản | Admin khóa user | User không đăng nhập được | [ ] |
| Reset password | Admin reset password | Mật khẩu mới dùng được | [ ] |
| Xem audit log | Admin mở trang audit | Hiển thị thao tác sửa điểm/khóa tài khoản | [ ] |

## 11. Test API bằng cURL

### 11.1 Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

### 11.2 Gọi API cần token

```bash
curl -X GET http://localhost:5000/api/v1/admin/audit-logs \
  -H "Authorization: Bearer <TOKEN>"
```

### 11.3 Nhập điểm

```bash
curl -X PUT http://localhost:5000/api/v1/grades/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "attendanceScore": 8,
    "assignmentScore": 7,
    "midtermScore": 6,
    "finalScore": 9
  }'
```

## 12. Test frontend

| Test case | Bước kiểm tra | Kết quả mong muốn | Trạng thái |
| --- | --- | --- | --- |
| Responsive desktop | Mở Chrome màn hình laptop | Layout rõ ràng | [ ] |
| Responsive mobile | F12 mobile mode | Không vỡ layout nặng | [ ] |
| Form login validate | Để trống username/password | Báo lỗi | [ ] |
| Loading state | Gọi API chậm | Có trạng thái loading | [ ] |
| Error state | API trả lỗi | Hiển thị thông báo dễ hiểu | [ ] |
| Logout | Bấm logout | Xóa token và về login | [ ] |

## 13. Test database

| Test case | SQL kiểm tra | Kết quả mong muốn | Trạng thái |
| --- | --- | --- | --- |
| Có đủ bảng | `SHOW TABLES;` | Thấy các bảng chính | [ ] |
| User có role | `SELECT username, role FROM users;` | Có STUDENT/LECTURER/ADMIN | [ ] |
| Grade có FK enrollment | Kiểm tra constraint | Không có grade mồ côi | [ ] |
| Audit log được ghi | `SELECT * FROM audit_logs ORDER BY created_at DESC;` | Có log sửa điểm | [ ] |

## 14. Test deploy

| Test case | Bước kiểm tra | Kết quả mong muốn | Trạng thái |
| --- | --- | --- | --- |
| Backend health | Mở `/health` | Trả `{status: 'ok'}` | [ ] |
| Frontend production | Mở link demo | Hiển thị LoginPage | [ ] |
| Frontend gọi backend | Login trên link production | Không lỗi CORS | [ ] |
| Database production | Login bằng user seed | Lấy được dữ liệu thật | [ ] |

## 15. Checklist cuối trước khi nộp

- [ ] Repository sạch, không có `.env` thật.
- [ ] README hướng dẫn chạy rõ ràng.
- [ ] Database schema/seed có trong repo.
- [ ] Có link demo hoặc hướng dẫn chạy local.
- [ ] Có tài khoản demo cho từng role.
- [ ] Các branch đã merge vào `main` hoặc `release/v1.0`.
- [ ] Có tag release cuối.
- [ ] Báo cáo Word/PDF đồng bộ tên thực thể tiếng Anh.
- [ ] Ảnh ERD đủ lớn, dễ đọc khi in.
- [ ] Nhóm đã test luồng chính trước khi nộp.


# Mục lục tài liệu dự án

Bộ tài liệu này dùng để hỗ trợ nhóm 3 thành viên triển khai dự án **Hệ thống Quản lý Kết quả Học tập** từ giai đoạn phân tích, chia việc, tạo branch, commit, kết nối database đến deploy và nộp bài.

## Phân chia 3 role chính

| Thành viên | Role chính | Phạm vi chịu trách nhiệm |
| --- | --- | --- |
| Thành viên 1 | **Frontend** | Giao diện React, route, form, validate phía client, gọi API, responsive UI, xử lý trạng thái đăng nhập trên client |
| Thành viên 2 | **Backend + QA + Document Lead** | API Node.js/Express, authentication/authorization, business logic, kiểm thử API/chức năng, viết README/tài liệu, tổng hợp checklist nộp |
| Thành viên 3 | **Database + DevOps** | ERD, schema MySQL, seed/migration, kết nối database, Docker/.env, deploy frontend/backend/database, cấu hình production |

## Danh sách file

| STT | File | Nội dung chính | Khi nào dùng |
| --- | --- | --- | --- |
| 1 | `README.md` | Tóm tắt chủ đề, công nghệ, chức năng, cách chạy nhanh, 3 role nhóm | Đặt ở thư mục gốc GitHub |
| 2 | `01_CHU_DE_VA_PHAM_VI.md` | Chủ đề, mục tiêu, phạm vi, actor, yêu cầu chức năng/NFR | Khi cần giải thích đề tài hoặc viết báo cáo |
| 3 | `02_KE_HOACH_GIAI_DOAN_3_THANH_VIEN.md` | Chia việc theo 3 role: Frontend, Backend + QA + Document Lead, Database + DevOps | Khi nhóm bắt đầu lập kế hoạch thực hiện |
| 4 | `03_GIT_BRANCH_COMMIT_WORKFLOW.md` | Quy tắc branch, commit, pull request, merge theo từng role | Khi làm việc nhóm trên GitHub |
| 5 | `04_DATABASE_CONNECTION.md` | Tạo database, `.env`, kết nối MySQL, migration, seed | Khi bắt đầu backend/database |
| 6 | `05_DEPLOYMENT_GUIDE.md` | Build, deploy backend, frontend, database, checklist production | Khi cần demo hoặc nộp sản phẩm |
| 7 | `06_FILE_FUNCTIONS_MAP.md` | Diễn tả chức năng từng thư mục/file trong source code và role phụ trách | Khi cần thuyết trình hoặc giải thích cấu trúc code |
| 8 | `07_TESTING_CHECKLIST.md` | Checklist kiểm thử chức năng, API, database, bảo mật | Trước khi merge hoặc nộp bài |

## Trình tự đọc đề xuất

1. Đọc `README.md` để hiểu tổng quan dự án và cách chia 3 role.
2. Đọc `01_CHU_DE_VA_PHAM_VI.md` để thống nhất phạm vi.
3. Đọc `02_KE_HOACH_GIAI_DOAN_3_THANH_VIEN.md` để chia việc theo từng giai đoạn.
4. Đọc `03_GIT_BRANCH_COMMIT_WORKFLOW.md` trước khi bắt đầu code.
5. Đọc `04_DATABASE_CONNECTION.md` khi làm database/backend.
6. Đọc `05_DEPLOYMENT_GUIDE.md` khi chuẩn bị demo.
7. Đọc `06_FILE_FUNCTIONS_MAP.md` khi cần trình bày từng file.
8. Dùng `07_TESTING_CHECKLIST.md` để rà soát lần cuối.

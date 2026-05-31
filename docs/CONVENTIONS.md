# Coding and Git Conventions

## Branches

- `main`: source code ổn định để nộp hoặc release.
- `develop`: nhánh tích hợp chính của nhóm.
- `feature/<ten-chuc-nang>`: phát triển chức năng mới.
- `fix/<ten-loi>`: sửa lỗi.
- `docs/<noi-dung>`: cập nhật tài liệu.
- `chore/<cong-viec>`: cấu hình, khởi tạo, công việc phụ trợ.

## Commits

Dùng định dạng:

```text
type: short description
```

Ví dụ:

```text
chore: initialize project structure
feat: implement login api
fix: validate grade range
docs: update database setup guide
```

## Code Style

- JavaScript dùng ES modules.
- Tên file và thư mục dùng kebab-case hoặc camelCase theo ngữ cảnh hiện có.
- API response trả JSON nhất quán.
- Biến môi trường đặt trong `.env`; chỉ commit `.env.example`.


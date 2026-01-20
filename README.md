# Cổng Dịch Vụ Công - Hướng Dẫn Sử Dụng Dự Án

Phiên bản: 1.0.0

Mô tả: Dự án này là một mẫu cổng thông tin Dịch Vụ Công (frontend tĩnh + server API demo). Mục tiêu: minh họa giao diện, API và dữ liệu mẫu để phát triển hoặc triển khai nhanh.

**Nội dung hướng dẫn**
- **Overview**: Tổng quan về dự án và chức năng chính.
- **Yêu cầu**: Phần mềm cần thiết để chạy dự án.
- **Cài đặt & Chạy**: Các bước cài đặt và lệnh chạy.
- **Cấu trúc dự án**: Mô tả các file/folder quan trọng.
- **API**: Tài liệu các endpoint sẵn có và ví dụ gọi.
- **Dữ liệu mẫu**: Mô tả `data/services.json` và cách mở rộng.
- **Phát triển & Triển khai**: Gợi ý cấu hình môi trường và triển khai.
- **Khắc phục sự cố**: Các lỗi thường gặp và cách xử lý.

## Overview
- Ứng dụng bao gồm frontend tĩnh (HTML/CSS/JS) và server Node.js nhỏ dùng Express để phục vụ file tĩnh và cung cấp API demo.
- Mục đích: bản mẫu cho cổng dịch vụ công, bao gồm trang chủ, trang bầu cử, tra cứu, dịch vụ và API mô phỏng.

## Yêu cầu (Prerequisites)
- Node.js (phiên bản 14+ khuyến nghị; Node 16/18 tốt hơn).
- npm (đi kèm Node) hoặc yarn.
- Trình duyệt hiện đại (Chrome, Firefox, Edge).

## Cài đặt & Chạy (Local)
1. Mở terminal tại thư mục gốc dự án (nơi chứa `server.js`).

2. Cài đặt phụ thuộc:

```bash
npm install
```

3. Chạy server (mặc định port 3000):

```bash
npm start
# hoặc
node server.js
```

4. Mở trình duyệt và truy cập:

- Giao diện chính: http://localhost:3000/
- Trang bầu cử: http://localhost:3000/election.html

Lưu ý: có thể thay đổi port bằng biến môi trường `PORT`, ví dụ:

```bash
PORT=8080 npm start
```

## Cấu trúc dự án (đường dẫn & vai trò chính)
Phần này liệt kê toàn bộ nội dung hiện có trong repository và mô tả ngắn cho từng file/folder.

- `index.html`: Trang chủ, hiển thị thống kê, dịch vụ phổ biến, hướng dẫn.
- `election.html`: Trang chi tiết bầu cử (countdown, tra cứu cử tri, lịch, FAQ).
- `404.html`: Trang 404 tĩnh.
- `service-detail.html`: Mẫu trang chi tiết dịch vụ.
- `tracking.html`: Trang theo dõi tiến trình hồ sơ / tracking.
- `server.js`: Server Express nhỏ cung cấp static files và API demo (đọc `data/services.json`).
- `package.json`: Thông tin dự án & script (chạy `start`).
- `README.md`: Hướng dẫn và mô tả dự án (tệp này).
- `js/`: Thư mục chứa mã JavaScript cho frontend:
  - `js/app.js`: Logic frontend chính, gọi API, xử lý hiển thị và form.
  - `js/music-player.js`: Trình phát nhạc (nếu dùng trên giao diện demo).
- `data/`:
  - `data/services.json`: Dữ liệu mẫu gồm `categories`, `services`, `elections`, dùng làm nguồn dữ liệu cho API demo.
- `forms/` (nếu có): chứa các file biểu mẫu / PDF (không bắt buộc trong mẫu này).

## API (Endpoints quan trọng)
Server cung cấp các API demo trong `server.js`. Dưới đây là tóm tắt các endpoint chính và ví dụ gọi.

- `GET /api/categories` — Trả về danh sách danh mục dịch vụ.
- `GET /api/services` — Lấy danh sách dịch vụ (hỗ trợ query: `category`, `search`, `page`, `limit`, `status`).
- `GET /api/services/popular?limit=6` — Lấy dịch vụ phổ biến (theo views).
- `GET /api/services/:id` — Lấy chi tiết dịch vụ theo `id`.
- `GET /api/elections` — Lấy thông tin bầu cử (dữ liệu demo từ `data/services.json`).
- `POST /api/elections/subscribe` — Đăng ký nhận thông báo bầu cử. Body JSON: `{ "email": "a@b.com", "phone": "090...", "name": "..." }`.
- `POST /api/elections/check-voter` — Kiểm tra thông tin cử tri (demo).
- `GET /api/elections/polling-stations` — Tra cứu điểm bỏ phiếu mẫu (hỗ trợ query params `province`, `district`, `ward`).

Ví dụ nhanh (curl):

```bash
curl http://localhost:3000/api/categories | jq
curl "http://localhost:3000/api/services?search=cccd&limit=5" | jq
curl http://localhost:3000/api/services/cap-cccd-lan-dau | jq
```

## Dữ liệu mẫu (`data/services.json`)
- Cấu trúc chính:
  - `categories`: mảng danh mục { id, name, icon, description }
  - `services`: mảng dịch vụ với các trường như `id`, `categoryId`, `name`, `shortDescription`, `fullDescription`, `level`, `status`, `processingTime`, `fee`, `agency`, `requirements`, `process`, `forms`, `relatedServices`, `faqs`, `views`, `rating`.
  - `elections`: thông tin bầu cử, events và dates.
- Ghi chú: để thêm/cập nhật dịch vụ, chỉnh sửa `data/services.json` rồi khởi động lại server.

## Phát triển (Dev)
- Frontend tĩnh: sửa HTML/CSS/JS trong file tương ứng (`index.html`, `election.html`, `js/app.js`).
- Backend demo: `server.js` dùng Express, đọc `data/services.json` để trả dữ liệu. Đây là server mẫu, không dùng DB.
- Khi chuyển sang prod: thay phần đọc file bằng truy vấn DB, thêm xác thực và validation.

## Triển khai (Deployment)
- Triển khai lên VPS hoặc PaaS (Heroku, Railway, Render, DigitalOcean App Platform).
- Ví dụ nhanh với PM2:

```bash
npm install -g pm2
npm install
pm2 start server.js --name mlnweb
pm2 save
```

Sử dụng biến môi trường `PORT` để cấu hình cổng khi deploy.

## Khắc phục sự cố thường gặp
- `port already in use`: đổi `PORT` hoặc tắt process đang chiếm cổng.
- `npm install` thất bại: kiểm tra phiên bản Node/npm, quyền ghi `node_modules`.
- API trả lỗi 500: xem log trên terminal nơi chạy `node server.js`.

## Mở rộng & Gợi ý cải tiến
- Thay file JSON bằng database (MongoDB/Postgres) để quản lý dữ liệu.
- Thêm authentication (OAuth2 / VNeID integration) cho endpoint cần bảo mật.
- Xây dựng CI/CD để deploy tự động.
- Thêm unit tests cho `server.js` và integration tests cho API.

## Đóng góp
- Fork repo, tạo branch, làm thay đổi và gửi pull request. Mô tả rõ mục đích và cách kiểm thử.

---

Nếu bạn muốn, mình có thể:
- Thêm ví dụ Postman collection hoặc file OpenAPI (swagger) cho các endpoint.
- Tạo script deploy (systemd / Dockerfile / docker-compose).

Bạn muốn mình làm tiếp gì? (ví dụ: tạo OpenAPI, thêm Dockerfile, hoặc in nội dung `data/services.json` vào README)
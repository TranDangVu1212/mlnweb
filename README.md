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

**Overview**
- Ứng dụng bao gồm frontend tĩnh (HTML/CSS/JS) và server Node.js nhỏ dùng Express để phục vụ file tĩnh và cung cấp API demo.
- Mục đích: bản mẫu cho cổng dịch vụ công, bao gồm trang chủ, trang bầu cử, tra cứu, dịch vụ và API mô phỏng.

**Yêu cầu (Prerequisites)**
- Node.js (phiên bản 14+ khuyến nghị; Node 16/18 tốt hơn).
- npm (đi kèm Node) hoặc yarn.
- Trình duyệt hiện đại (Chrome, Firefox, Edge).

**Cài đặt & Chạy (Local)**
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

**Cấu trúc dự án (đường dẫn & vai trò chính)**
- `index.html`: Trang chủ, hiển thị thống kê, dịch vụ phổ biến, hướng dẫn.
- `election.html`: Trang chi tiết bầu cử (countdown, tra cứu cử tri, lịch, FAQ).
- `404.html`, `service-detail.html`, `tracking.html`: trang mẫu khác.
- `server.js`: Server Express phục vụ file tĩnh và các API demo.
- `package.json`: Thông tin dự án & scripts (mở, `start`).
- `js/app.js`: Logic frontend, gọi API, render dịch vụ, form handling.
- `data/services.json`: Dữ liệu mẫu (danh mục, dịch vụ, thông tin bầu cử).
- `forms/`, `data/` (nếu có): file biểu mẫu PDF và dữ liệu tĩnh.

**API (Endpoints quan trọng)**
Server cung cấp các API demo trong `server.js`. Dưới đây là tóm tắt và ví dụ gọi.

- `GET /api/categories`
  - Trả về danh sách danh mục dịch vụ.
  - Ví dụ:

```bash
curl http://localhost:3000/api/categories
```

- `GET /api/services` (hỗ trợ query: `category`, `search`, `page`, `limit`, `status`)
  - Lấy danh sách dịch vụ, có phân trang và lọc.
  - Ví dụ:

```bash
curl "http://localhost:3000/api/services?search=cccd&limit=5"
```

- `GET /api/services/popular?limit=6`
  - Lấy dịch vụ phổ biến (theo views).

- `GET /api/services/:id`
  - Lấy chi tiết dịch vụ theo `id` (vd `cap-cccd-lan-dau`).
  - Ví dụ:

```bash
curl http://localhost:3000/api/services/cap-cccd-lan-dau
```

- `GET /api/elections`
  - Lấy thông tin bầu cử (dữ liệu demo từ `data/services.json`).

- `POST /api/elections/subscribe`
  - Đăng ký nhận thông báo bầu cử. Body JSON: `{ "email": "a@b.com", "phone": "090...", "name": "..." }`.

- `POST /api/elections/check-voter`
  - Kiểm tra thông tin cử tri (demo). Body JSON: `{ "idNumber":"...","fullName":"...","birthYear":1990 }`.

- `GET /api/elections/polling-stations?province=...&district=...&ward=...`
  - Tra cứu điểm bỏ phiếu mẫu.

- Ngoài ra server có các route API khác (tra cứu, contact, statistics) — xem `server.js` để biết chi tiết và dữ liệu trả về.

**Dữ liệu mẫu (`data/services.json`)**
- Cấu trúc chính:
  - `categories`: mảng danh mục { id, name, icon, description }
  - `services`: mảng dịch vụ với các trường như `id`, `categoryId`, `name`, `shortDescription`, `fullDescription`, `level`, `status`, `processingTime`, `fee`, `agency`, `requirements`, `process`, `forms`, `relatedServices`, `faqs`, `views`, `rating`.
  - `elections`: thông tin bầu cử, events và dates.
- Để thêm dịch vụ mới: chỉnh sửa `data/services.json` theo mẫu object trong mảng `services` rồi khởi động lại server (hoặc reload nếu server có cơ chế hot-reload).

**Phát triển (Dev)**
- Frontend tĩnh: sửa HTML/CSS/JS trong file tương ứng (`index.html`, `election.html`, `js/app.js`).
- Backend demo: `server.js` dùng Express, đọc `data/services.json` để trả dữ liệu. Đây là server mẫu, không dùng DB.
- Nếu cần kết nối DB thực: thay phần đọc file bằng truy vấn DB và cập nhật API tương ứng.

**Triển khai (Deployment)**
- Triển khai lên VPS hoặc PaaS (Heroku, Railway, Render, DigitalOcean App Platform).
- Ví dụ đơn giản với PM2 trên VPS:

```bash
# cài đặt pm2 nếu chưa có
npm install -g pm2
pm install
pm run start        # kiểm tra chạy ổn
pm2 start server.js --name mlnweb
pm2 save
```

- Sử dụng biến môi trường `PORT` để cấu hình port trên host.
- Khi dùng Nginx làm reverse proxy, cấu hình proxy_pass tới `http://127.0.0.1:3000`.

**Bảo mật & Lưu ý**
- Hiện tại API là demo, không có xác thực. Không dùng trực tiếp cho môi trường production.
- Khi chuyển sang production: thêm HTTPS, rate limiting, validation input, CORS chỉ cho domain tin cậy, logging, và lưu trữ dữ liệu vào DB an toàn.

**Ví dụ gọi API (curl) nhanh**
- Lấy danh mục:

```bash
curl http://localhost:3000/api/categories | jq
```

- Lấy dịch vụ cụ thể:

```bash
curl http://localhost:3000/api/services/cap-cccd-lan-dau | jq
```

- Đăng ký nhận thông báo bầu cử (mẫu):

```bash
curl -X POST http://localhost:3000/api/elections/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phone":"0901234567","name":"Nguyen"}'
```

**Khắc phục sự cố thường gặp**
- Lỗi `port already in use`: đổi `PORT` hoặc tắt process đang chiếm cổng.
- Lỗi `npm install` thất bại: kiểm tra phiên bản Node/npm, quyền ghi thư mục `node_modules`.
- API trả lỗi 500: xem log trên terminal nơi chạy `node server.js` để biết stack trace.

**Mở rộng & Gợi ý cải tiến**
- Thay file JSON bằng database (MongoDB/Postgres) để quản lý dữ liệu.
- Thêm authentication (OAuth2 / VNeID integration) cho các endpoint cần bảo mật.
- Xây dựng CI/CD để deploy tự động.
- Thêm unit tests cho `server.js` và integration tests cho API.

**Đóng góp**
- Fork repo, tạo branch, làm thay đổi và gửi pull request. Mô tả rõ mục đích và cách kiểm thử.

**Bản quyền**
- Tệp `package.json` mặc định ghi license MIT. Kiểm tra và điều chỉnh theo nhu cầu pháp lý của dự án.

---

Nếu bạn muốn, mình có thể:
- Thêm ví dụ Postman collection hoặc file OpenAPI (swagger) cho các endpoint.
- Tạo script deploy (systemd / Dockerfile / docker-compose).

Yêu cầu tiếp theo bạn muốn làm gì?
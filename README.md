# Changli AI Companion — Basic 1.0

Ứng dụng desktop Windows thử nghiệm: Electron + React + Live2D + FastAPI + Ollama + SQLite.

## 1. Yêu cầu
- Windows, Node.js LTS, Python 3.11/3.12, Ollama
- Model AI: `ollama pull qwen2.5:3b`
- Internet khi khởi động Live2D: Cubism Core được tải từ CDN chính thức. Nếu CDN không truy cập được, cần tích hợp Cubism Core theo giấy phép Live2D.

## 2. Chuẩn bị model Changli
Giải nén ZIP model Changli **trên máy của em** vào `models/character/`, sao cho file nằm đúng tại:

`models/character/长离.model3.json`

Cùng thư mục phải có `长离.moc3`, `长离.4096/` và các file liên quan. Model không được đưa vào ZIP project này và đã được loại khỏi Git bằng `.gitignore`.

Lưu ý: model Changli do tác giả bên thứ ba cung cấp, hãy kiểm tra giấy phép trước khi tích hợp. Không xóa watermark, không phân phối lại model.

## 3. Khởi động backend (Terminal 1, tại thư mục project)

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

Nếu máy không có lệnh `py -3.11`, dùng `python -m venv .venv`. Nếu PowerShell chặn activate, dùng CMD với `.venv\Scripts\activate.bat`.

## 4. Khởi động frontend + desktop (Terminal 2, tại thư mục project)

```powershell
npm install
npm run dev
```

Để thử trên trình duyệt, mở `http://127.0.0.1:5173` khi Vite đang chạy.

## 5. Ollama

```powershell
ollama pull qwen2.5:3b
ollama ps
```

Ollama cần chạy nền. Không nhất thiết mở `ollama run` nếu service đang hoạt động.

## 6. Các giới hạn của Basic 1.0
- Có trò chuyện bằng văn bản và lưu lịch sử SQLite. AI chỉ được đưa tối đa 20 tin nhắn gần nhất làm ngữ cảnh; **chưa có hệ thống trí nhớ ngữ nghĩa dài hạn**.
- Chưa có giọng nói, micro, đồng bộ miệng, hay biểu cảm theo cảm xúc.
- Live2D dùng `pixi-live2d-display` và Cubism Core CDN. Đây là tích hợp thử nghiệm, **chưa kiểm thử thực tế trên mọi model**; có thể cần chỉnh tương thích SDK/renderer.
- Desktop window trong suốt, luôn nổi, có thanh kéo và khung chat. Chưa có chế độ click-through.
- Không đóng gói bản EXE; chạy ở chế độ phát triển.

## 7. Khắc phục lỗi
- `Failed to fetch` hoặc `Chưa chạy backend`: kiểm tra Terminal 1 và cổng 8000.
- `Không kết nối được Ollama`: kiểm tra Ollama đang chạy và `ollama list`.
- `Chưa có model`: kiểm tra tên file và vị trí trong `models/character/`.
- `Cubism Core`: kiểm tra mạng, quyền truy cập CDN và giấy phép SDK.
- Nếu màn hình Live2D trống, mở DevTools của Electron (Ctrl+Shift+I) xem lỗi Console; chat vẫn hoạt động độc lập.


## Bản sửa lỗi giao diện trắng
- Đã sửa `useEffect` trong `App.jsx` để không trả về giá trị từ `scrollIntoView`.
- Đã sửa cleanup PixiJS trong `Live2D.jsx`, kiểm tra JSON của model trước khi tải.
- Giải nén model cá nhân vào `models/character/`, sao cho `models/character/长离.model3.json` tồn tại. Không đẩy model lên GitHub nếu không có quyền.
- Sau khi thay code, chạy `npm install` rồi `npm run dev`. Backend Python chạy ở terminal riêng.

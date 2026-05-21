# Creator Hub - Technical Specifications & Tech Stack

Chào mừng bạn đến với tài liệu kỹ thuật chi tiết của **Creator Hub** – Hệ sinh thái tối ưu hóa hiệu suất và hỗ trợ sáng tạo nội dung toàn diện dành cho các nhà sáng tạo (Creators). 

Tài liệu này hệ thống lại toàn bộ cấu trúc kiến trúc, danh mục công nghệ (Tech Stack) và các giải pháp kỹ thuật cốt lõi được áp dụng để xây dựng nên ứng dụng Desktop hoàn chỉnh, mượt mà và tích hợp trí tuệ nhân tạo (AI) như hiện tại.

---

## 🏗️ 1. Kiến Trúc Cốt Lõi (Core Platform)

Ứng dụng được xây dựng trên mô hình Hybrid Desktop Application, kết hợp sức mạnh hệ thống của môi trường Native và tính linh hoạt của giao diện Web hiện đại.

* **Electron Framework:** * **Vai trò:** Đóng vai trò lớp vỏ bọc và nền tảng chính biến ứng dụng Web (React) thành ứng dụng Desktop chạy độc lập trên đa hệ điều hành (Windows và macOS).
    * **Cơ chế:** Quản lý vòng đời ứng dụng thông qua kiến trúc đa tiến trình (Multi-process Architecture), phân tách độc lập giữa **Main Process** (Lõi Backend xử lý hệ thống) và **Renderer Process** (Giao diện hiển thị người dùng).
* **Node.js Runtime:**
    * **Vai trò:** Chạy ngầm ở tầng lõi (Main Process).
    * **Đặc tính:** Cung cấp quyền truy cập sâu vào hệ thống tệp tin, phần cứng máy tính và hệ điều hành, vượt qua hoàn toàn các giới hạn bảo mật thông thường của một ứng dụng chạy trên trình duyệt web.

---

## 🎨 2. Công Nghệ Giao Diện & Trình Biên Dịch (Frontend Stack)

Tầng hiển thị sử dụng những công nghệ tiên tiến nhất hiện nay nhằm tối ưu tốc độ render và tăng cường trải nghiệm lập trình viên.

* **React (Functional Components & Hooks):**
    * **Cấu trúc:** Tổ chức mã nguồn theo hướng thành phần (Component-driven) bóc tách độc lập giữa các Tabs tính năng (`JoinerTab`, `DownloaderTab`, `ChatbotTab`, `SettingsTab`...).
    * **Điều phối dữ liệu:** Sử dụng triệt để các React Hooks cốt lõi (`useState`, `useEffect`, `useRef`) kết hợp cùng các **Custom Hooks** chuyên dụng tự thiết kế (`useChatbot`, `useCleaner`, `useJoiner`, `useDownloader`...) để tách biệt hoàn toàn logic nghiệp vụ ra khỏi giao diện trực quan.
* **TypeScript (TSX):**
    * **Vai trò:** Ngôn ngữ lập trình chủ đạo kiểm soát chặt chẽ kiểu dữ liệu static (Strict Typing).
    * **Lợi ích:** Loại bỏ đến 99% các lỗi vặt về Runtime, định nghĩa rõ ràng các giao diện dữ liệu phức tạp (như cấu trúc tin nhắn `ChatMessage` hay phiên chat `ChatSession`), tối ưu hóa quá trình bảo trì và mở rộng tính năng về sau.
* **Vite v7:**
    * **Vai trò:** Công cụ xây dựng (Build Tool) và quản lý bundling thế hệ mới siêu tốc.
    * **Đặc tính:** Sử dụng cơ chế Native ESM giúp tối ưu hóa môi trường phát triển (Development Server), quản lý SSR Environment mượt mà, cho phép Hot-Module Replacement (HMR) và biên dịch mã nguồn chỉ trong vài mili-giây.

---

## 💅 3. Thẩm Mỹ, Giao Diện & Animation (Styling & UX)

Giao diện được thiết kế theo phong cách hiện đại, tối giản và tập trung mạnh mẽ vào chuyển động mượt mà để mang lại cảm giác cao cấp (Premium App Feel).

* **Tailwind CSS:**
    * **Ứng dụng:** Thư viện CSS Utility-first điều khiển toàn bộ hệ thống Grid bento, khoảng cách, màu sắc đồng bộ giữa hai chế độ Dark/Light Mode thông qua các biến cấu hình (`DARK_THEME`, `LIGHT_THEME`).
    * **Responsive Layout:** Áp dụng các class động như `grid-cols-[repeat(auto-fit,minmax(280px,1fr))]` giúp giao diện tự động co giãn, phân bổ hoàn hảo trên cả màn hình nhỏ lẫn màn hình Ultra-Wide khổng lồ.
* **Tailwind Animations & Transitions:**
    * **Hiệu ứng tương tác:** Điều khiển các chuyển động vật lý như di chuột nổi bồng bềnh (`hover:-translate-y-2`), hiệu ứng phóng to nảy nhẹ (`active:scale-95`), đổ bóng phát sáng màu đỏ neon đặc trưng khi rê chuột vào các thẻ tính năng.
    * **Trạng thái hệ thống:** Tạo nhịp đập nhịp nhàng cho icon trái tim bản quyền (`animate-pulse`) hay hiệu ứng xoay 90 độ mượt mà của bánh răng cài đặt hệ thống (`group-hover:rotate-90`).
* **CSS Keyframes & Staggered Animation:**
    * **Luồng xuất hiện:** Thiết kế hiệu ứng `@keyframes fadeInUp` tùy biến nội bộ để giao diện không bị giật cục khi tải.
    * **Trễ nhịp thông minh:** Sử dụng thuộc tính `style={{ animationDelay: \`${index * 50}ms\` }}` tạo hiệu ứng xếp tầng (Staggered Effect), khiến các thẻ tính năng trượt nhẹ từ dưới lên lần lượt một cách vô cùng tinh tế.
* **Webkit Scrollbar Customization:**
    * **Tùy biến:** Khắc phục thanh cuộn Windows thô kệch bằng cách can thiệp sâu thông qua class `.custom-scrollbar`.
    * **Thiết kế:** Thu hẹp độ rộng về mức mỏng dính (`6px`) chuẩn macOS, đặt chế độ nền trong suốt để tàng hình khi không dùng và tự động phát sáng thành màu Đỏ (Red-500) khi người dùng thao tác kéo chuột.

---

## 🛠️ 4. Xử Lý Hệ Thống & Tương Tác Lõi (Backend Logic)

Tầng xử lý ngầm quản lý các tác vụ nặng liên quan đến tệp tin hệ thống và tương tác mạng diện rộng.

* **Electron IPC (Inter-Process Communication):**
    * **Cơ chế:** Cung cấp đường ống giao tiếp bảo mật hai chiều thông qua `ipcRenderer.invoke` (gửi từ React xuống) và `ipcMain.handle` (lõi Electron hứng nhận).
    * **Giải pháp cốt lõi:** Đây là chìa khóa kỹ thuật để **giải quyết triệt để rào cản bảo mật CORS (Failed to fetch)**. Mọi request mạng phức tạp (gọi API AI, quét thông tin GitHub) đều được ủy quyền xuống tầng lõi Main Process để xử lý an toàn thay vì chạy trực tiếp trên UI.
* **Node.js \`child_process\` (\`exec\`, \`spawn\`):**
    * **Tác vụ:** Chạy các lệnh Command Line ngầm của hệ điều hành.
    * **Ứng dụng thực tế:** Kích hoạt hệ thống trình quản lý gói (`Winget` trên Windows, `Homebrew` trên Mac) cho tính năng Bộ cài phần mềm ngầm, hoặc tạo và thực thi tệp lệnh Bash Script độc lập (`.sh`) có trói quyền tách biệt (`detached: true`) để tự động xóa bản cũ, đè bản mới và tự khởi động lại app khi chạy tính năng Cập nhật tự động.
* **Node.js \`fs\` (File System) & \`path\`:**
    * **Tác vụ:** Quản lý đọc/ghi và điều hướng cây thư mục.
    * **Ứng dụng thực tế:** Tạo luồng ghi dữ liệu trực tiếp (`createWriteStream`) để cập nhật tiến trình phần trăm tải file theo thời gian thực, quản lý phân tách dọn dẹp các thư mục rác hệ thống và hoán đổi vị trí lưu trữ file cài đặt an toàn.

---

## 🤖 5. Trí Tuệ Nhân Tạo & Điện Toán Đám Mây (AI & Cloud Integration)

Sự kết hợp giữa các API đám mây hàng đầu giúp nâng cấp Creator Hub từ một công cụ tự động hóa thông thường trở thành một trợ lý thông minh.

* **Groq Cloud API (Model: \`llama-3.1-8b-instant\`):**
    * **Vai trò:** Đóng vai trò "bộ não" cho phân hệ Trợ lý AI (Chatbot).
    * **Đặc tính:** Sử dụng chuẩn tương thích OpenAI kết hợp công nghệ xử lý phần cứng siêu tốc của Groq giúp mô hình Llama 3.1 phản hồi câu hỏi, lên ý tưởng và viết kịch bản video với tốc độ gần như tức thì (Instantaneous Reply).
* **ElevenLabs API (Multilingual V2 Model):**
    * **Vai trò:** Cung cấp giải pháp chuyển đổi văn bản thành giọng nói (Text-to-Speech) chất lượng cao phòng thu.
    * **Đặc tính:** Sử dụng mô hình AI chuyển đổi ngữ điệu tự nhiên, mô phỏng chính xác giọng đọc truyền cảm (Adam ElevenLabs), phục vụ cho việc lồng tiếng video tự động.
* **GitHub REST API:**
    * **Vai trò:** Hệ thống phân phối và định tuyến phiên bản ứng dụng trên Cloud.
    * **Cơ chế:** Giao diện gọi lệnh kiểm tra đến endpoint `/releases/latest` của GitHub để bóc tách thông tin thẻ phiên bản (`tag_name`), so sánh phiên bản hệ thống hiện tại để tự động kéo các tệp assets tương ứng (`.exe` hoặc `.zip`) về máy người dùng.

---

## 💾 6. Quản Lý Dữ Liệu & Bộ Nhớ Đệm (Data & Caching)

* **Web Storage API (\`localStorage\`):**
    * **Lưu trữ cấu hình:** Quản lý trạng thái mở app lần đầu (`hub_first_run`), lựa chọn ngôn ngữ hiển thị (`hub_lang`), cài đặt chủ đề (`hub_theme`) và các chuỗi khóa bảo mật cá nhân (`hub_groq_key`, `hub_eleven_key`).
    * **Hệ thống đa luồng hội thoại (Multi-session Cache):** Toàn bộ lịch sử các cuộc trò chuyện của người dùng với AI được cấu trúc hóa dưới dạng mảng đối tượng `ChatSession`, liên tục đồng bộ ngầm dưới dạng chuỗi JSON hóa vào cache thiết bị. Nhờ đó, dữ liệu chat cũ được bảo toàn vẹn nguyên ngay cả khi người dùng tắt ứng dụng hoặc khởi động lại máy tính.
* **Kiến Trúc Quốc Tế Hóa (Custom i18n Architecture):**
    * **Cấu trúc:** Tách biệt hệ thống từ điển ngôn ngữ thành các module file độc lập (`locales/vi.ts`, `locales/en.ts`).
    * **Xử lý:** Sử dụng hàm nội suy chuỗi `t(key, replaceData)` tự viết để dịch thuật thời gian thực toàn bộ giao diện dựa theo cấu hình lựa chọn của người dùng một cách linh hoạt.

---

## 📌 Tổng Kết Luồng Xử Lý Đặc Biệt (Ví dụ: Chatbot AI)
```
[React UI (Textarea)] 
         │
         ▼ (Bấm GỬI - Kích hoạt Custom Hook `useChatbot`)
[Renderer Process] ──(Gửi tin nhắn qua đường ống IPC: 'ask-groq-chatbot')──> [Main Process (Electron Lõi)]
                                                                                      │
                                                                                      ▼ (Vượt rào CORS an toàn)
                                                                             [Groq API Đám Mây]
                                                                                      │
[React UI (Hiện bong bóng chat)] <──(Trả chuỗi Text kết quả phản hồi)── [Main Process (Bóc tách dữ liệu)]
```

---
*Tài liệu được biên soạn và cập nhật tự động bởi hệ thống quản lý mã nguồn của Creator Hub.*
*Engineered with ❤️ by **TCD**.*

/**
 * Knowledge Base for ContentPilot
 * This file contains the "Playbook" for the application, categorized by feature/route.
 * The content is written in Markdown/HTML to be rendered in the Help Center and Smart Widget.
 */

export const GUIDES = [
    {
        id: 'dashboard',
        title: 'Bảng Điều Khiển (Dashboard)',
        route: 'home',
        icon: 'home',
        content: `
### Tổng quan
Bảng điều khiển cung cấp cái nhìn toàn cảnh về tiến độ công việc, KPI của các chiến dịch, và các bài viết đang chờ duyệt.

### Tính năng chính
- **Thống kê Tổng quan:** Nắm bắt số lượng bài viết đã tạo, bài chờ duyệt, và tiến độ công việc.
- **Biểu đồ Hiệu suất:** Theo dõi sự tăng trưởng và giảm sút qua các tuần/tháng.
- **Hoạt động Gần đây:** Nhanh chóng quay lại các bản nháp đang viết dở.

> [!TIP]
> **Pro-Tip dành cho PM:** Hãy kiểm tra Widget "Cần phê duyệt" mỗi buổi sáng để đảm bảo nội dung của Executive không bị nghẽn!
    `
    },
    {
        id: 'create',
        title: 'Xưởng Nháp & AI (Tạo đa Avatar)',
        route: 'create',
        icon: 'sparkle',
        content: `
### Tổng quan
Xưởng nháp là "trái tim" của ContentPilot, nơi bạn phối hợp cùng AI để sản xuất nội dung quy mô lớn chỉ với 1 click.

### Cách sử dụng
1. Nhập tên **Sản phẩm/Dịch vụ** (Bắt buộc).
2. Định nghĩa **Đối tượng khách hàng (Target Avatars)**: 
   - *Ví dụ:* "Mẹ bỉm sữa 25-35 tuổi, Dân văn phòng bận rộn".
   - Hệ thống sẽ tự động nhân bản mỗi Avatar thành 1 phiên bản bài viết riêng biệt.
3. (Tuỳ chọn) Chọn **KOC / Affiliate** để AI bắt chước văn phong của họ.
4. Bấm **Tạo Nội Dung (AI)** và chờ quá trình "suy nghĩ" hoàn tất.

### Tính năng Dự đoán (Predictive Intelligence)
Khi viết xong nội dung thủ công hoặc AI tạo, hệ thống sẽ chấm **Điểm Hiệu suất (Pre-flight Score)**. 
- Điểm này đánh giá dựa trên: Sức mạnh của Hook (Tiêu đề), Mật độ Proof (Bằng chứng), và Lời kêu gọi (CTA).
- Gợi ý: Hãy nhấp vào cảnh báo màu Vàng/Đỏ bên dưới bài để AI tự động tối ưu lại (Rewrite) giúp tăng tỷ lệ chuyển đổi.

> [!IMPORTANT]
> **Tuyệt chiêu Hyper-Personalization:** Đừng viết chung chung! Hãy tách tập khách hàng càng nhỏ càng tốt ở ô Target Avatars. Số lượng tạo ra là không giới hạn.
    `
    },
    {
        id: 'approvals',
        title: 'Duyệt bài & Compliance AI',
        route: 'approvals',
        icon: 'check',
        content: `
### Tổng quan
Nơi Leader và QA/QC kiểm duyệt nội dung trước khi xuất bản. Hệ thống đã tích hợp **Đội kiểm duyệt AI "Thép"**.

### Cổng Kiểm duyệt Y tế Thực Phẩm Chức Năng (TPCN)
Mọi bài viết khi xuất hiện ở đây đều đã bị quét qua bộ lọc Compliance AI.
- **Điểm An toàn:** Được tính theo thang 100.
- **Từ khóa cấm (Banned Words):** Hệ thống sẽ highlight màu ĐỎ các từ ngữ bị luật Quảng cáo TPCN cấm (ví dụ: *chữa khỏi, 100%, vĩnh viễn, thần dược*).
- **Từ khóa cảnh báo:** Các từ cần cẩn trọng văn cảnh.

### Quy trình Duyệt
1. Đọc nội dung bài viết và xem **Lịch sử chỉnh sửa**.
2. Kiểm tra **Điểm Compliance**, nếu dưới 90, yêu cầu sửa đổi.
3. Bấm **Phê duyệt** để chuyển sang bước tiếp theo (Thiết kế / Xuất bản).

> [!CAUTION]
> **Rủi ro Pháp lý:** Không bao giờ chạy Quảng cáo các bài viết có tồn tại "Từ khóa cấm" tô đỏ để tránh bị khoá tài khoản hoặc phạt từ BYT.
    `
    },
    {
        id: 'koc',
        title: 'Quản lý KOC & Affiliate',
        route: 'koc',
        icon: 'users',
        content: `
### Tổng quan
Lưu trữ hồ sơ, văn phong và chỉ số của mạng lưới KOC/KOL/Affiliate đang hợp tác với thương hiệu.

### Tính năng cốt lõi
1. **Lưu trữ Cấu hình KOC (Profile):** Ghi nhận Tên, Nền tảng, Tệp Follower.
2. **Train AI theo Giọng điệu:** Bạn gán các tính từ miêu tả giọng điệu (Tone & Voice) của KOC (vd: *Gần gũi, Hài hước, GenZ*). Kể từ đó, AI ở Xưởng nháp có thể giả giọng KOC này.
3. **Từ khóa Yêu thích:** Bổ sung các từ cửa miệng hoặc hashtag riêng để tăng độ chân thật.

> [!TIP]
> Bạn có thể sao chép trực tiếp 3 bài viết tốt nhất của KOC dán vào phần "Ví dụ văn phong", AI sẽ học được mức độ sử dụng Emoji và cách dùng từ đặc trưng của họ.
    `
    },
    {
        id: 'designer',
        title: 'Designer Hub (Bảng Kéo Thả)',
        route: 'designer',
        icon: 'palette',
        content: `
### Tổng quan
Visual Command Center (Kanban board) chuyên dụng cho Designer tiếp nhận và quản lý các yêu cầu thiết kế hình ảnh/video.

### Luồng Công việc (Workflow)
1. **Chờ thiết kế (Backlog):** Bài viết nháp hoặc bài đã duyệt cần ảnh.
2. **Đang làm (In Progress):** Designer đang thao tác.
3. **Chờ duyệt hình (Review):** Design đã upload hình ảnh ghép, chờ Leader duyệt.
4. **Hoàn tất (Done):** Sẵn sàng để tải lên Social Media.

### AI Prompt Hints (Gợi ý Thiết kế)
- Khi nhận được 1 thẻ ở Backlog, Designer có thể bấm **Tạo Prompt (AI)**.
- Hệ thống sẽ đọc toàn bộ nội dung chiến dịch và trả về các câu **Prompt cho Midjourney / Photoshop AI**.
- Kèm theo đó là Gợi ý Bố cục, Tone màu và Keyword.

> [!TIP]
> Bạn không cần Copy Text chéo nhau. Chỉ cần click "Copy Prompt", sang Discord dán \`/ imagine\` là có ngay bộ ảnh demo đi kèm bài viết.
    `
    },
    {
        id: 'campaigns',
        title: 'Chiến dịch (Campaigns)',
        route: 'campaigns',
        icon: 'target',
        content: `
### Tổng quan
Nơi quản lý cấu trúc cây nội dung: **Chiến dịch > Trụ cột (Pillars) > Tuyến bài (Angles)**.

### Cách Tổ chức
1. **Chiến dịch (Mức 1):** Ví dụ: *Tết 2025*, *Ra mắt Sản phẩm X*.
2. **Trụ cột (Mức 2):** Các nhóm chủ đề con. Ví dụ: *Chất lượng sản phẩm*, *Review Khách hàng*.
3. **Tuyến bài (Mức 3):** Concept cụ thể. Định nghĩa rõ **Thông điệp chính** và **Hook (Mồi câu)**.

Từ góc nhìn này, bạn có thể bấm "Viết ngay" ở bất kỳ Angle nào, hệ thống sẽ tự mang Context sang Xưởng nháp để AI sinh nội dung bám sát chiến dịch.
    `
    }
];

/**
 * Lấy hướng dẫn dựa trên ID của route hiện tại
 */
export function getGuideByRoute(routeId) {
    // Map route hash or name to guide id. 
    // Fallback defaults to returning dashboard or nothing
    const mapping = {
        '': 'dashboard',
        'home': 'dashboard',
        'dashboard': 'dashboard',
        'create': 'create',
        'approvals': 'approvals',
        'koc': 'koc',
        'designer': 'designer',
        'campaigns': 'campaigns'
    };

    const id = mapping[routeId] || null;
    if (!id) return null;

    return GUIDES.find(g => g.id === id);
}

/**
 * ContentPilot Knowledge Base — Expert Marketing Playbooks (v2.0)
 * Cập nhật sau 10 cải tiến lớn — bao gồm tất cả tính năng mới
 * Viết bởi chuyên gia marketing với ví dụ thực tế cho thị trường TPCN, Beauty, Lifestyle Việt Nam
 */

export const GUIDES = [
    {
        id: 'daily-workflow',
        title: '🚀 Workflow Hàng Ngày',
        route: 'dashboard',
        icon: 'sparkle',
        shortSummary: 'Quy trình làm việc hàng ngày theo vai trò — MKT Manager vs MKT Executive. Tối ưu hiệu suất team.',
        content: `
## Workflow theo Vai trò — Ai Làm Gì, Khi Nào?

ContentPilot được thiết kế cho **hai vai trò chính** trong team marketing. Dưới đây là lịch trình tối ưu cho từng người.

---

### 🎯 Marketing Manager — Lịch trình Ngày

| Giờ | Việc cần làm | Trang | Thời gian |
|-----|-------------|-------|----------|
| 8:00 | Đọc Dashboard → check chỉ số + duyệt bài | Dashboard | 5 phút |
| 8:05 | Duyệt bài chờ ở Approval Queue | Duyệt bài | 10 phút |
| 8:15 | Check Lịch đăng → sự kiện marketing hôm nay? | Lịch đăng | 3 phút |
| 8:20 | Đọc Báo cáo tuần AI (thứ 2 hàng tuần) | Dashboard | 5 phút |
| Chiều | Review A/B test results + Content Score | Tạo content | 15 phút |

**KPI hàng ngày cho Manager:**
- ✅ Duyệt hết bài pending trước 10:00 sáng
- 📊 Check Content Score ≥ 70 cho tất cả bài publish
- 📅 Đảm bảo lịch đăng 3 ngày tới không trống

---

### ✏️ Marketing Executive — Lịch trình Ngày

| Giờ | Việc cần làm | Trang | Thời gian |
|-----|-------------|-------|----------|
| 8:30 | Check brief/feedback từ Manager | Duyệt bài | 5 phút |
| 8:35 | Tạo 3-5 bài content AI | Tạo content | 20 phút |
| 9:00 | Chạy A/B Test cho bài quan trọng | Tạo content | 10 phút |
| 9:10 | Cải thiện Content Score → mục tiêu ≥70 | Tạo content | 10 phút |
| 9:20 | Lên lịch đăng + chọn giờ vàng | Lịch đăng | 5 phút |
| Chiều | Repurpose top posts + Copy UTM links | Thư viện | 15 phút |

**KPI hàng ngày cho Executive:**
- 📝 Tạo tối thiểu 3-5 bài/ngày
- 🔬 A/B test ít nhất 1 bài/ngày cho bài quan trọng
- 📊 Content Score trung bình ≥ 65 trước khi submit duyệt
- 🔗 Gắn UTM cho mọi link chia sẻ

---

### 📋 Checklist Khởi tạo Dự Án Mới (Cho MKT Manager)

1. ☐ Setup **Sản phẩm/Dịch vụ**: Nhập USP, Thành phần, Giá bán vào Cài đặt > Sản phẩm.
2. ☐ Setup **Tệp khách hàng (Avatar)**: Phân tích JTBD, Nỗi đau (Pain points) vào Cài đặt > Khách hàng.
3. ☐ Setup **Thị trường**: Xác định Quy mô, Đối thủ cạnh tranh vào Cài đặt > Thị trường.
4. ☐ Training cho Executive cách chọn đúng combo (Sản phẩm + Khách hàng + Thị trường) trên Xưởng Nháp.

### 📋 Checklist Thứ Hai Hàng Tuần (Cho Executive)

1. ☐ Tạo **Báo cáo tuần AI** trên Dashboard (Manager review).
2. ☐ Review Cây Nội dung → đủ ý tưởng cho tuần mới?
3. ☐ Batch tạo 15-20 bài cho cả tuần (Batch Mode) kết hợp các Tệp Khách Hàng khác nhau.
4. ☐ Lên lịch đăng tuần mới trên Lịch đăng.

> [!TIP]
> Dành 30 phút thứ 2 để batch nội dung cả tuần. Mọi thông tin lõi (Giá, USP, Nỗi đau khách hàng) đã có AI tự động lấy từ Hệ Thống Dữ Liệu Lõi, bạn không cần gõ lại!
`
    },
    {
        id: 'dashboard',
        title: 'Trung tâm Chỉ huy',
        route: 'dashboard',
        icon: 'home',
        shortSummary: 'Đọc chỉ số, AI báo cáo tuần, và điều phối toàn bộ hoạt động marketing trong 60 giây mỗi sáng.',
        content: `
## Triết lý: "CEO sáng" trong 60 Giây

Mỗi buổi sáng, một Marketing Manager chuyên nghiệp dành đúng **60 giây** đọc Dashboard để nắm 3 câu hỏi:
1. **Hôm qua, team tôi tạo ra bao nhiêu nội dung?**
2. **Có bài viết nào đang bị tắc nghẽn trong luồng duyệt không?**
3. **Chúng ta còn bao nhiêu "đạn" để bắn hôm nay?** (AI quota)

### Đọc các Chỉ số Thông minh

**Tổng bài viết (Total Posts):** Con số này phản ánh *tốc độ sản xuất* của team. Nếu tăng trưởng < 10% so với tuần trước, hỏi lý do.

**Bài đã xuất bản (Published):** So sánh với Tổng bài viết. Tỷ lệ Published/Total thấp = có bottleneck trong duyệt bài hoặc thiết kế.

**Bản nháp (Drafts):** Đây là "tài sản đang chờ". Nhiều Draft = team đang sản xuất tốt. Ít Draft = cần cấp tốc content mới.

**Hôm nay (Today):** Chỉ số này dùng để theo dõi nhịp độ. Mục tiêu lý tưởng: mỗi ngày tạo ít nhất **3-5 bài** mới.

### Biểu đồ Hiệu suất 7 Ngày

Nhìn vào hình dạng của biểu đồ cột, không phải con số:
- **Hình chữ V ngược (∧):** Team tập trung vào đầu tuần, đuối cuối — cần phân bổ lại.
- **Bằng phẳng:** Nhịp ổn định — tốt!
- **Tăng liên tục:** Team đang accelerate — hãy duy trì!

---

### 🆕 Báo cáo Tuần AI — Tự động Phân tích

Widget **"📊 Báo cáo tuần"** nằm ngay trên Dashboard. Đây là công cụ **chỉ dành cho Manager** để nắm overview cả tuần.

**Cách sử dụng:**
1. Bấm **"✨ Tạo báo cáo AI"**
2. Đợi 5-10 giây — AI phân tích toàn bộ content tuần qua
3. Nhận bản tóm tắt dạng narrative: số liệu + insight + gợi ý tuần tới
4. Bấm **"Tạo lại"** nếu muốn góc nhìn khác

**Báo cáo bao gồm:**
- 📈 Tổng bài tạo trong tuần
- 🏆 Bài nổi bật nhất
- 💡 Gợi ý content cho tuần tới
- 🎯 Nhận xét AI về xu hướng sản xuất

**Ví dụ output:**
*"📊 Tuần qua team đã tạo 18 bài — tăng 20% so với tuần trước! 🏆 Bài nổi bật: 'Collagen Peptide 10000mg — Bí mật da mịn'. 💡 Gợi ý tuần tới: Nên tăng tỷ lệ bài testimonial (hiện chỉ 15%), tập trung vào tệp Mẹ bỉm 28-35."*

> [!TIP]
> Tạo báo cáo mỗi sáng thứ 2. Copy nội dung gửi vào group chat team để align cả nhóm chỉ trong 30 giây.

---

### Widget "Cần Duyệt" — Ưu tiên Số 1

Nếu có bài nào hiển thị trong "pending approval", đây là nhiệm vụ **khẩn** của bạn. Mỗi giờ delay = content cũ đi = cơ hội đăng lỡ.

> [!IMPORTANT]
> SLA duyệt bài: post organic < 4 tiếng, post có hình < 8 tiếng, paid ads < 24 tiếng.
`
    },
    {
        id: 'create',
        title: 'Xưởng Nháp AI — Tạo Content Siêu Tốc',
        route: 'create',
        icon: 'sparkle',
        shortSummary: 'Tạo content với AI, auto-fill từ URL, batch mode, lên lịch đăng, và gallery hình ảnh AI.',
        content: `
## Triết lý: "Một Brief, Trăm Bài"

ContentPilot giúp bạn viết *nhân lên gấp bội*. Một Brief đúng chuẩn có thể sinh 5-10 biến thể cho 5-10 tệp khách hàng khác nhau.

---

### 🆕 Tính năng mới: Auto-fill từ URL

Có URL sản phẩm trên website? Tiết kiệm thời gian nhập liệu:

1. Nhập URL vào ô **"URL sản phẩm"** ở đầu form
2. Bấm **"✨ Auto-fill từ URL"**
3. Hệ thống tự trích xuất tên sản phẩm và điền vào brief

**Ví dụ thực tế:**
- URL: \`https://shop.vn/collagen-peptide-10000mg\`
- → Tự động điền: "collagen peptide 10000mg" vào ô Sản phẩm
- → Bạn chỉ cần bổ sung Highlight và CTA, rồi bấm Tạo!

---

### 🆕 Batch Mode — Tạo hàng loạt

Khi cần tạo content cho nhiều sản phẩm cùng lúc:

1. Tick ☑ **"Batch Mode — Tạo hàng loạt"** cuối form
2. Nhập mỗi sản phẩm trên **1 dòng** (tối đa 5):
\`\`\`
Serum Vitamin C
Kem chống nắng SPF50
Collagen dạng nước
\`\`\`
3. Bấm **"✨ Tạo content"** → AI sinh riêng từng bài cho mỗi sản phẩm

**Khi nào nên dùng Batch Mode?**
- Đầu tuần, chuẩn bị 20-30 bài cho cả tuần
- Ra mắt bộ sản phẩm 3-5 sản phẩm cùng lúc
- Content cho flashsale nhiều SKU

---

### Công thức Brief "Vàng" — 5W

| Yếu tố | Câu hỏi | Ví dụ thực tế |
|--------|---------|---------------|
| **What** | Sản phẩm gì? | Collagen Peptide 10000mg sachet |
| **Who** | KH mục tiêu? | Phụ nữ 30-45, da lão hóa sớm |
| **Where** | Nền tảng nào? | Facebook, TikTok |
| **Why** | Lý do mua? | Da căng bóng, tự tin không filter |
| **Wow** | USP nổi bật? | Hấp thụ 95% trong 30 phút |

### Chiến thuật Hyper-Personalization

**❌ Cách cũ (Sai):** \`Target: Phụ nữ\` → AI viết chung chung.

**✅ Cách mới (Đúng):** \`Target: Mẹ bỉm 28-35 lo da chảy xệ, Chị VP 35-42 da xỉn, Chị KD 40-50 muốn trẻ hơn 10 tuổi\`
→ AI tạo **3 bài riêng biệt**, mỗi bài chạm đúng nỗi đau từng nhóm.

---

### 🆕 Lên lịch đăng ngay sau Save

Sau khi lưu bài, banner **"Lên lịch đăng ngay →"** xuất hiện 10 giây. Click để chuyển thẳng sang trang **Lịch đăng** và đặt lịch ngay, không cần quay lại tìm bài.

---

### 🆕 Lịch sử Hình ảnh AI

Mỗi khi bạn tạo hình bằng AI, hình được lưu vào **Gallery lịch sử** (tối đa 10 ảnh). Bạn có thể:
- Xem lại ảnh cũ bằng cách click vào thumbnail
- Tải về bằng nút Download
- Xoá toàn bộ lịch sử bằng nút "Xoá lịch sử"

**Vị trí:** Tab **"🖼️ Hình ảnh"** → Gallery nằm dưới ảnh đang xem.

---

### 🆕 Điểm Chất lượng Nội dung (Content Score Panel)

Sau khi AI tạo xong, **Score Panel** tự động hiển thị — không cần bấm gì!

**Vòng tròn điểm tổng (0-100):**
- 🟢 **70-100 — Xuất sắc**: Publish ngay
- 🟡 **40-69 — Trung bình**: Cải thiện 1-2 yếu tố
- 🔴 **0-39 — Yếu**: Viết lại hoặc dùng A/B Test

**3 thanh tiến trình:**

| Yếu tố | Ý nghĩa | Dưới 40 → Làm gì? |
|---------|---------|-------------------|
| 🪝 **Hook** | Câu mở đầu | Thay bằng câu hỏi gây tò mò |
| 📊 **Proof** | Bằng chứng/số liệu | Thêm con số, testimonial |
| 🎯 **CTA** | Lời kêu gọi hành động | "Inbox NGAY", "Chỉ còn 50 suất" |

**🔮 AI Auto-Improve:** Dưới thanh điểm có **gợi ý cải thiện**. Bấm **"✨ Cải thiện"** → AI viết lại đúng phần yếu, Score tự cập nhật.

**Ví dụ thực tế:**
- Bài gốc: Hook 35, Proof 60, CTA 50 → Tổng **48** 🟡
- Bấm "Cải thiện Hook" → Hook 75 → Tổng **62** (+14 điểm!)
- Bấm tiếp "Cải thiện CTA" → CTA 80 → Tổng **72** 🟢

> [!TIP]
> Mục tiêu vàng: Score ≥ 70 trước khi submit duyệt. Dưới 40 → không submit, dùng A/B test.

---

### 🆕 A/B Content Testing — So sánh 2 Phiên bản

Tính năng **game-changing** cho Marketing Executive:
1. Tạo content AI bình thường
2. Nút **"🔬 A/B Test"** xuất hiện sau khi tạo xong
3. Bấm → AI tạo **Version B** với hook + CTA khác hoàn toàn
4. Xem so sánh cạnh nhau, mỗi version có Score riêng
5. Bấm **"Chọn A"** hoặc **"Chọn B"**

**Khi nào NÊN dùng:** Bài paid ads, campaign launch, Score < 60
**Khi nào KHÔNG cần:** Post organic hàng ngày, bài evergreen

---

### KOC Integration — Giả giọng Thần tượng

Chọn KOC trong dropdown "Giả giọng KOC". AI bắt chước cấu trúc câu, emoji, từ "cửa miệng" → Khách đọc tưởng KOC tự viết → Trust + conversion tốt hơn.
`
    },
    {
        id: 'data-foundation',
        title: 'Phân Hệ Dữ Liệu Lõi (Tiên Quyết)',
        route: 'settings',
        icon: 'database',
        shortSummary: 'Thiết lập Sản phẩm, Khách hàng (JTBD/Pain Points) và Thị trường. Bắt buộc cho MKT Manager.',
        content: `
## Trái tim của AI: Phân Hệ Dữ Liệu Lõi

ContentPilot v2 không chỉ là công cụ viết bài, mà là một **AI Content Strategist**. Để AI viết "sâu" và chạm đúng "nỗi đau" (Pain points) của khách hàng, MKT Manager cần thiết lập 3 module dữ liệu lõi trong phần **Cài đặt**.

---

### 📦 1. Quản lý Sản Phẩm / Dịch Vụ
Thay vì chỉ nhập tên sản phẩm, bạn cung cấp cho AI "vũ khí" bán hàng:
- **Ngành hàng & Phân loại**
- **Điểm nổi bật (USP)**: Điểm khác biệt độc nhất so với đối thủ.
- **Giá bán & Hướng dẫn**: Giúp AI tự động đóng gói lời kêu gọi hành động (CTA) cực chuẩn.
- **Thành phần & Công dụng**: Để AI tự động chèn proof (bằng chứng) khoa học vào bài viết.

### 👥 2. Chân Dung Khách Hàng (Customer Avatars)
Đây là tính năng làm thay đổi hoàn toàn chất lượng AI content. Định hình khách hàng 360 độ:
- **Nhân khẩu học & Loại hình (B2B/B2C)**: Ví dụ: "Nữ 35-45 tuổi, kinh doanh tự do".
- **JTBD (Job-to-be-Done)**: Nhiệm vụ họ muốn hoàn thành (VD: "Muốn thăng tiến nhưng thiếu tự tin vì da lão hoá").
- **Nỗi đau (Pain Points)**: Lý do họ chần chừ xuống tiền (VD: "Sợ dùng mỹ phẩm bị kích ứng").
- **Mong muốn (Pain Relievers)**: Giải pháp họ thật sự khát khao trải nghiệm.

### 🌍 3. Phân Khúc Thị Trường & Đối Thủ
- **Quy mô & Xu hướng**: AI sẽ dùng dữ kiện này để viết bài bắt trend.
- **Mối bận tâm của thị trường**: VD: "Thị trường đang chuộng sản phẩm organic".
- **Đối thủ cạnh tranh**: VD: "Cạnh tranh với hàng xách tay Nhật". AI sẽ khéo léo lồng ghép USP để "đánh bật" đối thủ mà không cần nhắc tên trực tiếp.

---

## Ứng Dụng Thực Tế Cho Team

### 👨‍💼 Đối với Marketing Manager (Người Setup Hub)
**Nhiệm vụ:**
1. Dành 30 phút ban đầu để mô hình hóa toàn bộ sản phẩm và tệp khách hàng của công ty vào hệ thống.
2. Thường xuyên điều chỉnh **Giá bán** (khi có khuyến mãi) hoặc thêm **Tệp khách hàng mới** (khi có định hướng mở rộng thị trường).
**Lợi ích:** Đảm bảo 100% nội dung sinh ra bởi team Executive đi đúng định vị thương hiệu và không bị sai thông số kỹ thuật y tế/sản phẩm.

### 👩‍💻 Đối với Marketing Executive (Người Thực Hành Viết)
**Thao tác hàng ngày tại Xưởng Nháp (#/create):**
Chỉ cần mix-and-match (kết hợp) bộ 3 thẻ vũ khí từ dropdown:
1. Chọn **Sản phẩm** (VD: Collagen Peptide)
2. Chọn **Khách hàng** (VD: Mẹ bỉm sữa 30 tuổi)
3. Chọn **Thị trường** (VD: Phân khúc organic)
→ **Bấm "AI Viết Content"**. AI sẽ gộp toàn bộ Pain Points, USP, Giá bán để sinh ra một bản thảo được *cá nhân hóa 100%* cho tệp mẹ bỉm, chạm đúng nỗi đau thiếu thời gian chăm sóc thân thể, và chốt sale thẳng với giá bán đã niêm yết.

> [!CAUTION]
> Output của AI phụ thuộc 90% vào độ "sâu" của dữ liệu lõi. Nếu phần Nỗi đau (Pain points) MKT Manager nhập sơ sài, AI sẽ viết rất chung chung. Quản lý cần đầu tư chất xám vào bước này!
`
    },
    {
        id: 'approvals',
        title: 'Duyệt Bài & Tuân thủ AI',
        route: 'approvals',
        icon: 'check',
        shortSummary: 'Hệ thống kiểm duyệt 2 lớp với bình luận inline. AI quét pháp lý + con người quyết định.',
        content: `
## Tại sao Compliance quan trọng với TPCN?

Vi phạm quảng cáo TPCN có thể bị:
- Phạt tiền **5-30 triệu VNĐ** mỗi lần
- **Khóa tài khoản Facebook/TikTok** vĩnh viễn
- **Thu hồi giấy phép** quảng cáo

---

### 🆕 Bình luận Inline — Không còn Popup

Thay vì hộp thoại prompt cũ, giờ bạn ghi chú **ngay trong giao diện**:

**Cách duyệt bài từng bước:**

1. **Đọc bài** → kiểm tra nội dung, compliance score
2. **Bấm "💬 Thêm bình luận"** → khung ghi chú mở ra bên dưới
3. **Viết nhận xét** vào ô textarea (VD: "Câu 3 cần thêm disclaimer TPCN")
4. **Chọn hành động:**
   - ✅ **"Duyệt & Ghi chú"** → Approve kèm feedback cho executive
   - ❌ **"Từ chối & Ghi chú"** → Reject với lý do rõ ràng

**Ví dụ ghi chú khi Approve:**
\`"OK, bổ sung thêm disclaimer ở cuối bài. Câu hook rất hay, giữ nguyên."\`

**Ví dụ ghi chú khi Reject:**
\`"Bài dùng từ 'chữa bệnh' dòng 5 — vi phạm BYT. Thay bằng 'hỗ trợ sức khỏe'. Compliance hiện 65/100."\`

---

### Hiểu Điểm Compliance Score

**90-100 ✅ Xanh** — An toàn, duyệt ngay.

**70-89 🟡 Vàng** — 1-2 từ cần xem xét. Duyệt được nếu ngữ cảnh hợp lý.

**0-69 🔴 Đỏ** — Vi phạm nặng. Từ chối, yêu cầu viết lại.

---

### Từ khóa Cấm Tuyệt đối (TPCN)

| ❌ Không được dùng | ✅ Thay bằng |
|-------------------|-------------|
| Chữa khỏi, chữa bệnh | Hỗ trợ sức khỏe |
| Điều trị, trị dứt | Hỗ trợ cải thiện |
| Hiệu quả 100% | Hiệu quả cao |
| Tốt hơn thuốc | Giải pháp bổ sung |
| Chữa đau khớp | Hỗ trợ xương khớp |
| Trị mất ngủ | Giúp ngủ ngon hơn |

---

### Quy trình Duyệt 3 Bước

1. **Đọc highlight đỏ trước** — ưu tiên sửa từ cấm
2. **Check Compliance Score** — ≥ 90 mới approve
3. **Ghi chú lịch sử** — luôn ghi lý do khi reject để Executive học cách viết đúng

> [!CAUTION]
> AI compliance chỉ kiểm tra văn bản. Bạn vẫn cần kiểm tra hình ảnh/video bằng mắt. Hình "before/after" giảm 30kg/30 ngày dù caption hợp lệ vẫn bị Facebook phạt.
`
    },
    {
        id: 'koc',
        title: 'Quản lý KOC & Cộng tác viên',
        route: 'koc',
        icon: 'team',
        shortSummary: 'Xây dựng đội ngũ KOC AI-powered: lưu hồ sơ, huấn luyện giọng điệu, tạo content đúng phong cách.',
        content: `
## KOC quan trọng hơn KOL với TPCN

**92% người tiêu dùng** tin recommendation từ người quen hơn quảng cáo. KOC có:
- **Tương tác cao hơn 3-5x** so với macro-influencer
- **Chi phí thấp hơn 10-50x** (đổi sản phẩm, không lấy phí)
- **Trust cao hơn** vì nội dung "người thật việc thật"

---

### Cách Xây Profile KOC Chuẩn — 4 Bước

**Bước 1: Thông tin Cơ bản**
Tên, nền tảng chính (FB/TikTok/IG), follower thực.

**Bước 2: Tệp khán giả**
→ Đây là thông tin vàng!
- KOC A: "Mẹ bỉm Hà Nội 28-35 tuổi" 
- KOC B: "Chị KD online miền Nam 35-50 tuổi"
AI sẽ viết bài phù hợp đúng tệp từng KOC.

**Bước 3: Tone & Voice**
Mô tả bằng 3-5 tính từ:
- *Gần gũi, dí dỏm, nhiều emoji, GenZ*
- *Học thức, khoa học, ít emoji, formal*
- *Chân thật, hay kể chuyện buồn vui*

**Bước 4: Ví dụ Văn phong**
Dán 2-3 bài viết tốt nhất. AI phân tích: độ dài, emoji, cấu trúc, hashtag signature.

---

### Chiến lược "Bộ Ba" KOC

| Loại | Follower | Dùng để |
|------|---------|---------|
| Nano | 1K-10K | Seeding, trust cao |
| Micro | 10K-100K | Push main, cân bằng |
| Mid | 100K-500K | Announce ra mắt |

**Lịch trình:**
1. Tuần 1: Nano đăng trước → buzz nhỏ
2. Tuần 2: Micro đăng → extend reach
3. Tuần 3: Mid đăng → harvest kết quả

---

### Mô phỏng Giọng KOC với AI

Chọn KOC trong dropdown **"Giả giọng KOC"** ở Xưởng Nháp. AI bắt chước cấu trúc câu, emoji, từ cửa miệng.

**Ví dụ:** KOC hay dùng câu hỏi tu từ 🤔:
\`"Ai ngờ cái nhỏ xinh vậy mà công dụng 'khổng lồ' đến vậy không? 🤔 Mình đã skeptical lắm, cho đến khi..."\`

> [!TIP]
> Sau mỗi campaign, cập nhật "Hiệu quả" vào profile KOC. Sau 3 tháng, bạn sẽ biết KOC nào phù hợp nhất cho từng loại sản phẩm.
`
    },
    {
        id: 'designer',
        title: 'Nhà thiết kế — Kanban Hình ảnh',
        route: 'designer',
        icon: 'image',
        shortSummary: 'Kanban board với Drag & Drop. Kéo thẻ giữa các cột, AI prompt Midjourney, theo dõi tiến độ.',
        content: `
## Designer Hub: Từ Text đến Visual trong 1 Click

Vấn đề phổ biến: **Copywriter viết xong, Designer không biết hình cần gì!**

Designer Hub tự động "dịch" nội dung text sang brief hình ảnh chi tiết, kèm prompt AI sẵn sàng cho Midjourney/Canva AI/Adobe Firefly.

---

### 🆕 Drag & Drop — Kéo thả thẻ giữa các cột

Giờ bạn có thể **kéo (drag) thẻ content** từ cột này sang cột khác, thay vì chỉ dùng nút mũi tên:

**Cách kéo thẻ:**
1. **Nhấn giữ chuột** vào thẻ bất kỳ (thẻ sẽ mờ đi 50%)
2. **Kéo sang cột đích** (cột sẽ sáng lên màu tím khi hover)
3. **Thả chuột** → thẻ chuyển sang cột mới, trạng thái tự động cập nhật

**Các nút mũi tên vẫn hoạt động** → Hữu ích trên mobile hoặc khi không muốn kéo.

---

### Hiểu Luồng Kanban — 4 Cột

**📋 Chờ thiết kế (Backlog)**
Bài đã duyệt nội dung, chưa có hình.
→ Designer nhận thẻ từ đây. Click "Tạo Prompt AI" để nhận brief hình ảnh.

**✏️ Đang thiết kế (In Progress)**
Designer đang thao tác. Kéo thẻ vào đây khi bắt đầu.
→ *Không để thẻ tắc > 24h.*

**👁️ Chờ duyệt hình (Review)**
Upload hình xong, chờ Leader duyệt.

**✅ Hoàn tất (Done)**
Nội dung + hình ảnh OK. Sẵn sàng upload lên nền tảng.

---

### Dùng AI Prompt như Chuyên gia

Khi bấm "Tạo Prompt AI", hệ thống trả về:

**Prompt Midjourney:**
\`Phụ nữ Việt Nam 35 tuổi, da sáng mịn, cầm hộp Collagen Sachet hồng nhạt, background bếp hiện đại, ánh sáng tự nhiên, lifestyle photography --ar 4:5 --v 6\`

**Palette màu:**
- TPCN phụ nữ → Pastel pink, Gold, White
- TPCN nam → Navy, Silver, Black
- Detox/wellness → Sage green, Cream, Earthy

**Bố cục đề xuất:**
- Facebook: 1200x628, text ≤ 20% ảnh
- TikTok/Story: 1080x1920, vùng an toàn 150px
- IG Feed: 1080x1080, center-weighted

---

### 🎨 Ứng dụng "Dữ Liệu Lõi" vào Thiết Kế Visual

Với hệ thống dữ liệu lõi mới (Products, Customers, Markets), Designer có thể bấm xem chi tiết brief bài viết để đọc **Chân dung Khách hàng (JTBD/Pain Points)** và **Thị trường**, từ đó lên concept hình ảnh "đâm trúng tim đen" khách hàng nhất:

- **Tệp Mẹ bỉm sữa (Khách hàng)** → Thiết kế ưu tiên tone màu ấm áp (Warm tones), lifestyle đời thường gần gũi, sử dụng hình ảnh em bé/gia đình để tạo sự đồng cảm.
- **Tệp Dân văn phòng bận rộn** → Layout tối giản (Minimalist), sạch sẽ, màu sắc professional, nhấn cực mạnh vào text mô tả "tính tiện dụng", "tiết kiệm thời gian".
- **Tôn vinh USP (Sản phẩm)** → Đọc thẻ thành phần sản phẩm, đưa trực tiếp hình ảnh nguyên liệu gốc (trà xanh nguyên bản, lát cam tươi, giọt mật ong...) làm background layer để tăng độ Trust (Niềm tin) cao nhất theo chuẩn y tế.

---

### Copy Prompt → Midjourney → 60 Giây

1. Bấm **"Copy Prompt"** trong thẻ Kanban
2. Mở Discord Midjourney → \`/imagine\` + paste
3. Chọn ảnh đẹp nhất → U (Upscale) → Download
4. Kéo thẻ sang cột **"Chờ duyệt"**

> [!TIP]
> Dùng \`--seed 12345\` cuối prompt để giữ phong cách nhất quán cho cả series bài.
`
    },
    {
        id: 'campaigns',
        title: 'Chiến dịch Marketing',
        route: 'campaigns',
        icon: 'campaigns',
        shortSummary: 'Xây cây nội dung 3 cấp: Chiến dịch → Trụ cột → Tuyến bài. Không bao giờ hết ý tưởng.',
        content: `
## Cây Nội dung — Không Bao giờ Hết Ý tưởng

Nhiều team rơi vào: *"Hôm nay viết gì?"* — dấu hiệu thiếu Content Strategy.

Cây Nội dung 3 cấp giải phóng team khỏi "trống ý tưởng" và đảm bảo mỗi bài đều phục vụ mục tiêu lớn hơn.

---

### Cây Nội dung Mẫu — Launch Collagen

**Cấp 1 — Chiến dịch:**
\`"Collagen Glow Mùa Hè 2024" — 8 tuần, Q2\`

**Cấp 2 — Trụ cột (Pillars):**

| Trụ cột | Tỷ lệ | Mục tiêu |
|---------|-------|---------|
| Giáo dục sản phẩm | 30% | Nhận biết, giải thích |
| Testimonial & Proof | 25% | Xây trust |
| Lifestyle & Aspiration | 20% | Kết nối cảm xúc |
| Hook content | 15% | Viral, chia sẻ |
| Chốt đơn (Sale) | 10% | Conversion |

**Cấp 3 — Angles cho Pillar "Giáo dục":**
- "Collagen nào thật sự hấp thụ được?" (Hook: So sánh)
- "Uống Collagen đúng giờ quan trọng không?" (Hook: Sai lầm)
- "3 dấu hiệu da thiếu Collagen" (Hook: Diagnosis)

---

### Công thức Nhân Ý tưởng

Từ **1 Pillar** → ít nhất **10 Angles** bằng cách thay đổi:

**Góc tiếp cận:** Sai lầm → Bí quyết → So sánh A vs B → Q&A

**Narrative Format:** Kể chuyện → Listicle "5 lý do" → How-to → Myth-busting

---

### Từ Angle → Xưởng Nháp trong 1 Click

Click **"Viết ngay"** → Hệ thống tự điền Campaign context + Angle vào Brief → AI sinh nội dung bám sát thông điệp và hook đã định.

> [!IMPORTANT]
> Nên lập Cây Nội dung cho cả *quý* (13 tuần). Điền tối thiểu 5 Angles/Pillar. Team luôn có "menu content" sẵn, không cần brainstorm mỗi ngày.
`
    },
    {
        id: 'strategy',
        title: 'Chiến lược Marketing AI',
        route: 'strategy',
        icon: 'strategy',
        shortSummary: 'AI xây dựng chiến lược nội dung dài hạn, với 5 template nhanh cho các mục tiêu phổ biến.',
        content: `
## AI Strategy Builder — Từ Brief đến Kế hoạch 90 ngày

Nhập mô tả sản phẩm/chiến dịch → nhận kế hoạch nội dung chi tiết với Pillars và Angles được AI gợi ý.

---

### 🆕 Quick Templates — Bắt đầu Nhanh trong 1 Click

Không biết viết brief chiến lược thế nào? **5 template có sẵn** ngay dưới ô nhập liệu:

| Template | Khi nào dùng | Ví dụ |
|----------|-------------|-------|
| 📈 **Tăng doanh số** | Muốn chốt đơn nhiều hơn | "SP mới, target F 25-40, giá 450K" |
| 🎯 **Brand Awareness** | Ra mắt thương hiệu mới | "Thương hiệu mới, chưa ai biết" |
| 🧲 **Thu thập Lead** | Xây database khách hàng | "Cần 1000 leads/tháng cho SP premium" |
| 🚀 **Ra mắt SP mới** | Launch sản phẩm | "Serum Vitamin C, USP: nano" |
| 🏷️ **Xả hàng tồn kho** | Clearance sale | "Tồn 5000 hộp, hạn 6 tháng" |

**Cách dùng:**
1. Click vào chip template phù hợp (VD: "📈 Tăng doanh số")
2. Template tự điền vào ô Mục tiêu kinh doanh
3. **Bổ sung thêm** thông tin sản phẩm, USP, target
4. Bấm **"Tạo chiến lược"** → AI trả về kế hoạch chi tiết

---

### Mẫu Brief Chiến lược Tốt

\`Sản phẩm: Viên uống Đông Trùng Hạ Thảo 500mg.
USP: 100% chiết xuất Tây Tạng tự nhiên, quy trình lạnh.
Thị trường: Nam 40-60, dân kinh doanh, mệt mỏi mãn tính.
Đối thủ: Đông Trùng Trung Quốc giá thấp.
Mục tiêu: Định vị premium 2 triệu/hộp, bán qua FB & Zalo.\`

**AI trả về:**
- 4-5 Content Pillars với tỷ lệ %
- 3-5 Angles cho mỗi Pillar
- Tone & Language khuyến nghị
- Timeline 12 tuần

---

### Đọc Output Đúng Cách

**Nên:** Dùng Pillars làm khung, tùy chỉnh % cho phù hợp, kết hợp insight từ team sales.

**Không nên:** Follow 100% không điều chỉnh, bỏ qua insight từ comment khách thực tế.

> [!TIP]
> Sau mỗi campaign, đối chiếu Performance thực tế với Strategy AI. Sự sai lệch giữa dự đoán và thực tế là bài học marketing giá trị nhất.
`
    },
    {
        id: 'library',
        title: 'Thư viện Nội dung',
        route: 'library',
        icon: 'library',
        shortSummary: 'Kho nội dung với lịch sử phiên bản, repurpose content, và xuất đa nền tảng.',
        content: `
## Thư viện — Tài sản Nội dung của Bạn

Mỗi bài đã tạo là một tài sản. Thư viện giúp bạn khai thác triệt để thay vì "dùng một lần rồi bỏ".

---

### 🆕 Lịch sử Phiên bản — Theo dõi Hành trình Bài viết

Mỗi bài viết giờ có **timeline trực quan** cho thấy:
- 📝 **Tạo mới** — khi bài được tạo lần đầu
- ✏️ **Chỉnh sửa** — khi có thay đổi nội dung
- ✅ **Duyệt** — khi manager approve
- 🚀 **Đăng bài** — khi publish lên nền tảng

**Cách xem:** Bấm nút **"📋 Lịch sử phiên bản"** trên mỗi card.

**Tại sao hữu ích?**
- Biết bài nào đã edit nhiều lần → nội dung khó viết, cần cải thiện brief
- Biết thời gian từ tạo → publish → tính cycle time trung bình của team
- Manager thấy được bottleneck: bài nào stuck ở trạng thái nào lâu

**Ví dụ đọc timeline:**
\`📝 Tạo mới (3 ngày trước) → ✏️ Chỉnh sửa (2 ngày trước) → ✅ Duyệt (hôm qua) → 🚀 Đăng bài (1 giờ trước)\`
→ Cycle time = 3 ngày. Mục tiêu: rút xuống 1-2 ngày!

---

### Repurpose Content — Nhân đôi Sản lượng

Một bài Facebook hay → **5 định dạng khác:**

| Gốc | Repurpose thành |
|-----|----------------|
| FB long-form 500 chữ | 3 tweet/X thread |
| FB long-form | 1 script TikTok 60-90s |
| FB long-form | 5 Stories/Reels slide |
| FB long-form | 1 email newsletter |
| FB long-form | 1 bài Zalo OA |

**Cách làm:** Mở bài → Click "Tạo biến thể" → chọn nền tảng → AI re-format.

---

### 🆕 Copy Link + UTM — Tracking Mọi Chia Sẻ

Mỗi card bài viết giờ có nút **"🔗 UTM"**:

1. Bấm nút **UTM** trên bất kỳ card nào
2. Hệ thống tự tạo link UTM tracking (source, medium, campaign)
3. Link được copy vào clipboard — dán vào tin nhắn, email, hoặc post

**UTM tự động gắn:**
- \`utm_source=contentpilot\` — biết traffic từ hệ thống nội bộ
- \`utm_medium\` — theo loại content (facebook/blog)
- \`utm_campaign\` — theo ID bài viết

**Tại sao quan trọng?**
Mỗi link chia sẻ cho KOC, gửi email, hay đăng cross-platform đều cần UTM. Không có UTM = không biết traffic từ đâu = "marketing mù".

> [!TIP]
> Khi chia link cho KOC, luôn dùng nút UTM. Sau 1 tháng, bạn biết chính xác KOC nào tạo traffic thật.

---

### Bộ lọc — Tìm bài trong 5 giây

- **Theo trạng thái:** Draft / Published → ưu tiên review draft
- **Theo loại:** Product / Promotion / Education / News
- **Tìm kiếm:** Gõ từ khóa → tìm trong brief + nội dung

> [!TIP]
> Bài không bao giờ lỗi thời (giải thích SP, FAQ, testimonial) → đặt tag "Evergreen". Tái sử dụng không giới hạn, chỉ cần đổi ảnh + CTA mỗi đợt.
`
    },
    {
        id: 'conversions',
        title: 'Theo dõi Chuyển đổi',
        route: 'conversions',
        icon: 'conversions',
        shortSummary: 'Gắn UTM, theo dõi nguồn đơn, tính ROI thực tế cho từng campaign và KOC.',
        content: `
## Conversion Tracking — Biết Bài Nào Bán Được

"Like, Share, Comment" = **Vanity Metrics**. Quan trọng hơn: **bài đó tạo ra bao nhiêu đơn?**

---

### UTM Parameters

UTM = đoạn text gắn sau link để biết traffic từ đâu.

**Cấu trúc chuẩn:**
\`https://site.com?utm_source=facebook&utm_medium=social&utm_campaign=collagen-q2&utm_content=koc-nguyenvana\`

| Thành phần | Mục đích | Ví dụ |
|-----------|---------|-------|
| utm_source | Nền tảng | facebook, tiktok |
| utm_medium | Loại traffic | social, paid, koc |
| utm_campaign | Tên chiến dịch | collagen-summer |
| utm_content | Biến thể | koc-a, avatar-me-bim |

---

### Đọc Báo cáo Conversion

**CPC** (Chi phí/click): < 1.000đ = xuất sắc, > 10.000đ = cần review content.

**CPL** (Chi phí/lead): TPCN premium < 50.000đ, mass market < 20.000đ.

**ROAS** (Doanh thu/Chi phí): < 1 = lỗ, 1-3 = hòa vốn, > 3 = có lãi, scale được.

---

### Gắn Voucher cho KOC

Mỗi KOC nhận mã riêng:
- KOC Nguyễn A → **NGUYENA15** (giảm 15%)
- KOC Trần B → **TRANB20** (giảm 20%)

Mỗi đơn dùng code → biết đến từ KOC nào → tính doanh thu thực → trả hoa hồng chính xác.

> [!IMPORTANT]
> Đây là cách duy nhất biết KOC nào *bán được*, không chỉ KOC nào *được xem nhiều*. KOC 20K follower đúng tệp có thể bán hơn KOC 500K sai tệp.
`
    },
    {
        id: 'brand',
        title: 'Hồ sơ Thương hiệu & Màu sắc',
        route: 'brand',
        icon: 'brand',
        shortSummary: 'Thiết lập tone of voice, logo, archetype, màu sắc và font chữ thương hiệu cho AI.',
        content: `
## Brand Profile — DNA Thương hiệu của Bạn

Brand Profile là **não bộ** của AI. Thông tin bạn điền ở đây ảnh hưởng đến *mọi bài viết* được tạo. Càng chi tiết → AI viết càng đúng giọng.

---

### Thiết lập Cơ bản — 5 Phút đầu tiên

**1. Tên thương hiệu** — AI dùng tên này trong nội dung. Ghi đúng chính tả và viết hoa.

**2. Logo** — Upload logo PNG/JPEG (max 2MB). Dùng cho watermark hình ảnh AI.

**3. Ngành hàng** — Chọn đúng ngành (TPCN, Cosmetics, Fashion...). Nếu chọn **TPCN**, hệ thống tự động:
- Bật cảnh báo compliance
- Điền disclaimer mặc định theo BYT
- AI tránh các từ cấm khi viết bài

**4. Đối tượng KH** — *"Phụ nữ 30-45, thu nhập TB-cao, quan tâm sức khỏe"* → AI viết đúng ngôn ngữ của họ.

**5. Tone of Voice** — 5 lựa chọn:

| Tone | Phù hợp cho | Ví dụ câu mở |
|------|------------|-------------|
| Thân thiện | FMCG, Mỹ phẩm | "Chị ơi, em chia sẻ bí mật nhỏ nè..." |
| Chuyên nghiệp | B2B, Dịch vụ | "Theo nghiên cứu của WHO năm 2023..." |
| Vui tươi | Giới trẻ, F&B | "Ủa, bạn chưa biết cái này hả? 😱" |
| Sang trọng | Premium, Luxury | "Trải nghiệm đẳng cấp cho những..." |
| Giáo dục | TPCN, Y tế | "Bạn có biết rằng cơ thể chúng ta..." |

---

### Brand Archetype — Nhân cách Thương hiệu

Chọn 1 trong 12 archetype để AI hiểu "tính cách" brand:

- **Hero** (Nike) → Truyền cảm hứng can đảm
- **Sage** (Google) → Chia sẻ tri thức
- **Caregiver** (Johnson's) → Chăm sóc, bảo vệ
- **Creator** (Apple) → Sáng tạo, đổi mới
- **Explorer** (Jeep) → Phiêu lưu, khám phá

---

### 🆕 Design System Tokens — Nhận diện Thị giác

Section mới giúp bạn lưu **bộ nhận diện thị giác** của thương hiệu:

**Màu chủ đạo (Primary Color)**
- Dùng cho nút bấm, badge, accent trong nội dung
- Click vào **ô color picker** hoặc nhập **mã HEX** (#8B5CF6)
- Preview cập nhật trực tiếp khi bạn thay đổi

**Màu phụ (Secondary Color)**
- Dùng cho highlight, link, đường kẻ
- Nên chọn màu tương phản với Primary

**Font chữ thương hiệu**
- 5 lựa chọn: Inter, Roboto, Montserrat, Playfair Display, Be Vietnam Pro
- Font preview cập nhật ngay khi chọn

**Ví dụ thiết lập cho brand TPCN:**
- Primary: #E91E63 (Hồng đậm — nữ tính, sức khỏe)
- Secondary: #4CAF50 (Xanh lá — tự nhiên, organic)
- Font: Be Vietnam Pro (Tiếng Việt tối ưu)

**Ví dụ cho brand Premium:**
- Primary: #1A237E (Navy — sang trọng)
- Secondary: #FFD700 (Vàng gold — đẳng cấp)
- Font: Playfair Display (Serif sang trọng)

> [!TIP]
> Lưu Brand Profile ngay **trước khi tạo bài đầu tiên**. AI sẽ tự động áp dụng tone, disclaimer, và phong cách vào tất cả nội dung được tạo.
`
    },
    {
        id: 'team',
        title: 'Quản lý Nhóm & Phân quyền',
        route: 'team',
        icon: 'team',
        shortSummary: 'Tổng quan công việc team, pipeline nội dung, và phân bổ task theo thành viên.',
        content: `
## Team Management — Nắm rõ Toàn cảnh Team

Trang Team giúp Marketing Manager thấy **bức tranh toàn cảnh** hoạt động sản xuất nội dung của cả nhóm.

---

### 🆕 Task Visibility — Tổng quan Công việc

Section **"📊 Tổng quan công việc"** hiển thị 3 loại thông tin:

**1. Summary Cards (6 thẻ tóm tắt)**

| Thẻ | Ý nghĩa | Hành động |
|-----|---------|----------|
| 📝 Tổng content | Tổng bài viết cả team | Đo tốc độ sản xuất |
| ✏️ Bản nháp | Bài đang soạn | Thúc đẩy hoàn thành |
| ⏳ Chờ duyệt | Bài chờ Manager approve | **Ưu tiên duyệt ngay** |
| ✅ Đã duyệt | Bài đã OK, chờ đăng | Lên lịch đăng |
| 🚀 Đã đăng | Bài live | Đo performance |
| 🎨 Đang thiết kế | Bài chờ hình | Check Designer Hub |

**2. Pipeline Progress Bar**
Thanh tiến trình màu hiển thị phân bổ content theo trạng thái:
- 🔵 Draft → 🟡 Pending → 🟢 Approved → 🟣 Published → 🎨 Design
- **Thanh lệch về bên trái** (nhiều draft) = team cần đẩy nhanh quy trình duyệt
- **Thanh lệch về bên phải** (nhiều published) = team hoạt động trơn tru!

**3. Bảng Chi tiết Thành viên**
Mỗi dòng = 1 thành viên, hiển thị số bài theo từng trạng thái.

**Cách đọc hiệu quả:**
- Thành viên A: 15 Draft, 0 Published → Viết nhiều nhưng bị tắc ở khâu duyệt
- Thành viên B: 3 Draft, 12 Published → Chất lượng tốt, quy trình mượt
- Thành viên C: 0 Draft, 0 Published → Cần hỗ trợ hoặc chưa bắt đầu

---

### Quản lý Thành viên

**Thêm thành viên mới:**
1. Bấm **"Mời thành viên"**
2. Nhập email (phải có tài khoản Google)
3. Chọn vai trò: Executive (viết bài) / Designer (thiết kế)
4. Hệ thống gửi lời mời qua email

**Phân quyền theo vai trò:**
- **Marketing Manager:** Toàn quyền — duyệt bài, quản lý team, xem analytics
- **Content Executive:** Tạo content, gửi duyệt, xem Thư viện
- **Designer:** Xem Kanban, nhận brief, upload hình

---

### Activity Log — Lịch sử Hoạt động

Dòng thời gian hiển thị mọi hoạt động gần đây:
- Ai tạo bài gì, lúc nào
- Ai duyệt/reject bài nào
- Ai đăng bài lên nền tảng nào

> [!TIP]
> Check trang Team **mỗi sáng thứ Hai** để nắm tổng quan tuần mới. Chú ý card "Chờ duyệt" — đây là bottleneck #1 của hầu hết team marketing.
`
    },
    {
        id: 'calendar',
        title: 'Lịch đăng Nội dung',
        route: 'calendar',
        icon: 'calendar',
        shortSummary: 'Lập kế hoạch đăng bài theo ngày/tuần/tháng. Tối ưu thời gian đăng cho từng nền tảng.',
        content: `
## Lịch đăng — Kế hoạch Content có Hệ thống

Trang Lịch đăng giúp bạn sắp xếp nội dung theo **timeline**, đảm bảo không ai sót bài, không trùng lặp, và đăng đúng "giờ vàng".

---

### 🆕 Sự kiện Marketing — Không Bỏ Lỡ Cơ Hội

Lịch đăng giờ hiển thị **icon sự kiện marketing** (🎄🌸💝...) trên các ô ngày có sự kiện Việt Nam:

**Trên lịch tháng:**
- Ô ngày có sự kiện sáng lên màu **vàng nhạt**
- Emoji sự kiện nhấp nháy nhẹ bên cạnh số ngày
- Hover emoji → xem tên sự kiện + gợi ý content

**Click vào ngày có sự kiện:**
- Modal popup hiển thị **chi tiết sự kiện**: tên, mô tả, gợi ý góc viết
- Nút **"✨ Tạo content cho sự kiện này"** → chuyển thẳng sang Xưởng Nháp với context sự kiện

**30+ sự kiện Việt Nam có sẵn:**
| Tháng | Sự kiện |
|-------|--------|
| 1 | Tết Nguyên Đán, Valentine sớm |
| 3 | 8/3 Ngày Phụ nữ |
| 4 | 30/4 Giải phóng |
| 6 | 1/6 Thiếu nhi |
| 10 | 20/10 Phụ nữ VN |
| 11 | Singles Day 11/11 |
| 12 | Giáng sinh, Boxing Day |

**Workflow cho Manager:**
- Mỗi đầu tháng, xem lịch → biết sự kiện nào sắp tới
- Brief cho Executive: "Tuần này có 8/3, chuẩn bị 5 bài theo góc: tặng quà, self-care, deal cho phụ nữ"

> [!TIP]
> Bật lịch đăng **3 tuần trước** sự kiện lớn (Tết, 8/3, 11/11). Seeding sớm = reach tốt hơn.

---

### Cách sử dụng Lịch đăng

**Bước 1: Thêm bài vào lịch**
- Từ Xưởng Nháp: Sau khi save, click banner **"Lên lịch đăng ngay →"**
- Từ Thư viện: Mở bài → chọn ngày đăng
- Trực tiếp: Click ngày trên lịch → chọn bài từ Thư viện

**Bước 2: Chọn giờ đăng tối ưu**

| Nền tảng | Giờ vàng | Lý do |
|---------|---------|-------|
| Facebook | 11:00-13:00 | Giờ nghỉ trưa, scroll nhiều |
| Facebook | 19:00-21:00 | Giờ sau bữa tối, relax |
| TikTok | 18:00-22:00 | Prime time xem video |
| Zalo OA | 8:00-9:00 | Giờ đi làm, check tin nhắn |
| Blog/SEO | 6:00-8:00 | Google index nhanh buổi sáng |

**Bước 3: Phân bổ theo Pillar**
Dùng content pillars (từ module Chiến dịch) để cân bằng:
- Thứ 2: Giáo dục sản phẩm
- Thứ 3: Testimonial/Review
- Thứ 4: Lifestyle/Aspiration
- Thứ 5: Hook content (viral)
- Thứ 6: Sale/Chốt đơn

---

### Mẹo Lập kế hoạch Hiệu quả

**Nguyên tắc 80/20:**
- 80% nội dung lên kế hoạch trước (batch vào thứ 2)
- 20% để dành cho trending, tin nóng, phản hồi thực tế

**Tần suất đăng đề xuất:**
- Facebook: 1-2 bài/ngày (chất lượng > số lượng)
- TikTok: 2-3 video/ngày (algorithm ưu tiên tần suất)
- Blog: 2-3 bài/tuần (tối ưu SEO)

> [!TIP]
> Sau khi save bài ở Xưởng Nháp, banner "Lên lịch đăng ngay →" sẽ xuất hiện trong 10 giây. Click ngay để không quên lên lịch! Banner này sẽ đưa bạn thẳng đến trang Lịch đăng.
`
    },
    {
        id: 'approvals-advanced',
        title: 'Hệ thống Phê duyệt Đa cấp',
        route: 'approvals',
        icon: 'approvals',
        shortSummary: 'Quy trình review 3 cấp với bình luận inline để đảm bảo chất lượng trước khi xuất bản.',
        content: `
## Quy trình Duyệt Bài — Không Bao giờ Đăng Nhầm

### Mô hình 3 Cấp (Enterprise)

**Cấp 1 — Executive tự kiểm**
- Đọc lại, check lỗi chính tả
- Chạy Compliance AI → xem điểm
- Đảm bảo đủ Hook + Proof + CTA

**Cấp 2 — Manager Review**
- Kiểm tra tone & voice đúng brand
- Kiểm tra thông điệp nhất quán với chiến dịch
- Compliance ≥ 90 mới approve
- 🆕 **Ghi bình luận inline** trực tiếp trên giao diện

**Cấp 3 — Legal Review (bài quan trọng)**
- Paid Ads (Facebook/Google)
- Campaign ra mắt sản phẩm
- Bài có claim y tế/khoa học

---

### SLA cho Approval

| Loại bài | Thời hạn duyệt |
|---------|---------------|
| Post organic | 4 tiếng |
| Post có hình | 8 tiếng |
| Paid Ads | 24 tiếng |
| Campaign launch | 48 tiếng |

> [!CAUTION]
> Thiếu SLA = bài "stuck", deadline bị lỡ. Hãy in SLA và dán lên tường văn phòng!
`
    }
];

/**
 * Lấy hướng dẫn dựa trên ID của route hiện tại
 */
export function getGuideByRoute(routeId) {
    const mapping = {
        '': 'dashboard',
        'home': 'dashboard',
        'dashboard': 'dashboard',
        'create': 'create',
        'approvals': 'approvals',
        'koc': 'koc',
        'designer': 'designer',
        'campaigns': 'campaigns',
        'strategy': 'strategy',
        'library': 'library',
        'conversions': 'conversions',
        'templates': 'library',
        'brand': 'brand',
        'settings': 'dashboard',
        'team': 'team',
        'calendar': 'calendar',
    };

    const id = mapping[routeId] || null;
    if (!id) return null;

    return GUIDES.find(g => g.id === id);
}

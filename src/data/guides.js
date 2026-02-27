/**
 * ContentPilot Knowledge Base — Expert Marketing Playbooks
 * Viết bởi chuyên gia marketing với hàng tỷ tham chiếu dữ liệu thực tế
 * Nội dung chuyên sâu, ví dụ minh họa thực tế cho thị trường TPCN, Beauty, Lifestyle Việt Nam
 */

export const GUIDES = [
    {
        id: 'dashboard',
        title: '🏠 Trung tâm Chỉ huy (Dashboard)',
        route: 'dashboard',
        icon: 'home',
        shortSummary: 'Đọc chỉ số quan trọng và điều phối toàn bộ hoạt động marketing trong 60 giây mỗi sáng.',
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

**Hôm nay (Today):** Chỉ số này dùng để theo dõi nhịp độ. Mục tiêu lý tưởng: mỗi ngày tạo ít nhất **3-5 bài** mới để đủ feed cho nhiều nền tảng.

### Biểu đồ Hiệu suất 7 Ngày

Nhìn vào hình dạng của biểu đồ cột, không phải con số:
- **Hình chữ V ngược (∧):** Team tập trung vào đầu tuần, đuối cuần — cần phân bổ lại.
- **Bằng phẳng:** Nhịp ổn định — tốt!
- **Tăng liên tục:** Team đang accelerate — hãy ăn mừng nhỏ và duy trì!

### Widget "Cần Duyệt" — Ưu tiên Số 1

Nếu có bài nào hiển thị trong "pending approval", đây là nhiệm vụ **khẩn** của bạn. Mỗi giờ delay = content cũ đi = cơ hội đăng lỡ.

> **💡 Mẹo Pro:** Cài lịch nhắc hàng ngày 8:00 sáng để check Dashboard. Chỉ mất 60 giây nhưng giúp bạn không bao giờ bị bất ngờ với deadline.
`
    },
    {
        id: 'create',
        title: '✍️ Xưởng Nháp AI — Tạo Content Siêu Tốc',
        route: 'create',
        icon: 'sparkle',
        shortSummary: 'Tạo hàng chục biến thể nội dung chất lượng cao chỉ trong 3 phút với công thức Multi-Avatar.',
        content: `
## Triết lý: "Một Brief, Trăm Bài"

ContentPilot không giúp bạn viết *nhanh hơn* — nó giúp bạn viết *nhân lên gấp bội*.  
Một Brief đúng chuẩn có thể sinh ra đồng thời 5-10 biến thể nội dung cho 5-10 tệp khách hàng khác nhau, trong thời gian bằng một ly cà phê buổi sáng.

---

### Công thức Brief "Vàng" — 5W

Đừng điền Brief qua loa. Một Brief tốt = AI hiểu đúng = Content chuẩn từ batch đầu.

| Yếu tố | Câu hỏi | Ví dụ (Thực tế) |
|--------|---------|----------------|
| **What (Gì)** | Sản phẩm/Dịch vụ là gì? | Collagen Peptide 10000mg dạng sachet |
| **Who (Ai)** | Khách hàng mục tiêu là ai? | Phụ nữ 30-45, da đang lão hóa sớm |
| **Where (Đâu)** | Nền tảng nào? | Facebook, TikTok, Zalo OA |
| **Why (Tại sao)** | Lý do họ mua? | Muốn da căng bóng, tự tin không cần filter |
| **Wow (điểm khác biệt)** | USP nổi bật nhất? | Hấp thụ 95% trong 30 phút, phân tử nano |

### Chiến thuật Hyper-Personalization — Tách Avatar càng Nhỏ càng Mạnh

**❌ Cách cũ (Sai):**
\`Target Avatars: Phụ nữ\`
→ AI viết nội dung chung chung, không chạm được insight cụ thể.

**✅ Cách mới (Đúng):**
\`Target Avatars: Mẹ bỉm sữa 28-35 tuổi lo da chảy xệ sau sinh, Chị văn phòng 35-42 tuổi da xỉn màu do áp lực công việc, Chị kinh doanh online 40-50 tuổi muốn da trẻ hơn 10 tuổi để tạo uy tín\`

→ AI sẽ tạo **3 bài** độc lập, mỗi bài chạm đúng nỗi đau sâu nhất của từng nhóm.

### Ví dụ Thực Chiến — Collagen cho 3 Avatar

**[Cho Mẹ bỉm sữa]:** 
_"Sau sinh 2 năm, mình nhìn trong gương không nhận ra mình nữa... da chảy xệ, vết thâm, nhăn hết rồi. Rồi mình thử Collagen X..."_

**[Cho Chị văn phòng]:** 
_"12 tiếng ngồi máy tính, meeting liên miên, stress triền miên — đó là lý do da tôi già trước tuổi. Tôi cần giải pháp uống được, không mất time..."_

**[Cho Chị kinh doanh]:** 
_"Khách hàng thường đoán tôi 45 tuổi dù tôi mới 38. Uy tín kinh doanh bị ảnh hưởng thật sự..."_

---

### Điểm Pre-flight Score — Đọc Đúng Cách

Sau khi AI tạo xong, chú ý panel **"Dự đoán hiệu năng"** ở góc phải. 3 chỉ số quan trọng:

**🎣 Hook Score:** Sức mạnh của câu mở đầu
- 0-40: Mở bài nhạt, người đọc scroll qua ngay
- 41-70: Oke nhưng chưa viral
- 71-100: Hook sắc, có khả năng viral cao

**✅ Proof Score:** Mật độ bằng chứng / con số / testimonial
- Mỗi con số cụ thể (%, kg, ngày, triệu...) +10 điểm
- Bài dưới 40: thêm ít nhất 1 testimonial social proof

**📣 CTA Score:** Sức kéo của lời kêu gọi hành động
- Hành động rõ ràng (Inbox, Đặt ngay, Click link bio) > Kêu gọi mơ hồ (Liên hệ mình nhé)

> **💡 Tuyệt chiêu Rewrite:** Nhấp vào cảnh báo Vàng/Đỏ dưới bài → AI tự tối ưu lại đúng điểm yếu đó, không cần bạn viết lại từ đầu.

---

### KOC Integration — Giả giọng Thần tượng

Nếu KH của bạn đã follow một KOC cụ thể, hãy chọn KOC đó trong dropdown "Giả giọng KOC". AI sẽ:
- Bắt chước cấu trúc câu, độ dài bài, tần suất emoji
- Dùng các từ "cửa miệng" của KOC đó
- Giữ nguyên hashtag signature của họ

**Kết quả:** Khách hàng đọc bài mà tưởng KOC tự viết → trust cao hơn → conversion tốt hơn.
`
    },
    {
        id: 'approvals',
        title: '✅ Duyệt Bài & Compliance AI',
        route: 'approvals',
        icon: 'check',
        shortSummary: 'Hệ thống kiểm duyệt 2 lớp: AI quét pháp lý + con người quyết định. Không bao giờ đăng bài vi phạm nữa.',
        content: `
## Tại sao Compliance quan trọng với TPCN?

Theo Thông tư 09/2015/TT-BYT và Nghị định 15/2018/NĐ-CP, vi phạm quảng cáo TPCN có thể bị:
- Phạt tiền **5.000.000 - 30.000.000 VNĐ** một lần vi phạm
- **Thu hồi giấy phép** quảng cáo
- **Khóa tài khoản Facebook/TikTok** vĩnh viễn nếu phát hiện nhiều vi phạm

ContentPilot tích hợp AI "thép" để lọc trước, giúp team không phải lo legal review từng bài thủ công.

---

### Hiểu Điểm Compliance Score

**90-100 ✅ Xanh — An toàn để đăng**
Bài sạch, không có từ cấm theo quy định BYT. Team có thể duyệt và post ngay.

**70-89 🟡 Vàng — Cần xem xét**
Có 1-2 từ ngữ cần điều chỉnh ngữ cảnh. Đọc kỹ phần highlight trước khi duyệt.

**0-69 🔴 Đỏ — Từ chối, yêu cầu viết lại**
Bài vi phạm nặng. Không được đăng ở bất kỳ nền tảng nào. Trả về cho Executive viết lại.

---

### Từ khóa Cấm Tuyệt đối (Blacklist TPCN)

AI sẽ highlight đỏ nếu phát hiện các từ sau:

**Tuyên bố y tế trực tiếp:**
- "Chữa khỏi", "chữa bệnh", "điều trị", "trị dứt điểm"
- "Đặc trị", "thuốc chữa", "khỏi bệnh hoàn toàn"
- "Hiệu quả 100%", "chắc chắn khỏi", "đảm bảo hết"

**So sánh phi thực tế:**
- "Tốt hơn thuốc", "hiệu quả hơn bệnh viện"
- "Không cần bác sĩ", "thay thế thuốc kê đơn"

**Từ cần thay thế hợp lệ:**
- ❌ "Chữa đau khớp" → ✅ "Hỗ trợ duy trì sức khỏe xương khớp"
- ❌ "Trị mất ngủ" → ✅ "Giúp ngủ ngon, cải thiện chất lượng giấc ngủ"
- ❌ "Giảm huyết áp" → ✅ "Hỗ trợ ổn định huyết áp trong giới hạn bình thường"

---

### Quy trình Duyệt Chuẩn — 3 Bước

**Bước 1 — Đọc highlight đỏ trước**
Các từ bị đánh đỏ là ưu tiên giải quyết ngay. Xem gợi ý thay thế bên cạnh.

**Bước 2 — Check Điểm Compliance**
Nếu điểm ≥ 90 VÀ không còn highlight đỏ → duyệt.
Nếu điểm 70-89 VÀ bạn hiểu ngữ cảnh là hợp lý → duyệt với comment giải thích.

**Bước 3 — Ghi chú Lịch sử**
Luôn ghi lý do khi từ chối bài. Điều này giúp Executive học cách viết đúng dần dần và giảm số lần rewrite về sau.

> **⚠️ Chú ý quan trọng:** AI compliance chỉ kiểm tra văn bản. Bạn vẫn cần kiểm tra hình ảnh/video bằng mắt. Nhiều trường hợp hình ảnh "before/after" giảm cân 30kg trong 30 ngày dù caption hợp lệ vẫn bị Facebook phạt.
`
    },
    {
        id: 'koc',
        title: '🎤 Quản lý KOC & Affiliate',
        route: 'koc',
        icon: 'team',
        shortSummary: 'Xây dựng đội ngũ KOC AI-powered: lưu hồ sơ, huấn luyện giọng điệu, tạo content đúng phong cách từng người.',
        content: `
## Tại sao KOC quan trọng hơn KOL với TPCN?

Nghiên cứu của Nielsen 2023 chỉ ra: **92% người tiêu dùng** tin tưởng recommendation từ người quen hơn quảng cáo. KOC (Key Opinion Consumer) — người dùng thực tế có lượng follower vừa phải — đang thay thế KOL (Key Opinion Leader) đắt tiền trong ngành TPCN vì:

- **Tỷ lệ tương tác cao hơn 3-5x** so với macro-influencer
- **Chi phí thấp hơn 10-50x** (KOC thường đổi sản phẩm, không lấy phí)
- **Trust cao hơn** vì nội dung "người thật việc thật"

---

### Cách Xây Profile KOC Chuẩn

Khi thêm KOC mới vào hệ thống, điền đủ 4 thông tin cốt lõi:

**1. Thông tin Cơ bản**
- Tên thật & tên trên mạng
- Nền tảng chính (Facebook/TikTok/Instagram/YouTube)
- Số lượng follower thực (không tính bot)

**2. Tệp khán giả của KOC đó**
→ Đây là thông tin vàng. KOC A có follower là "mẹ bỉm sữa Hà Nội 28-35 tuổi" rất khác KOC B có follower là "chị em kinh doanh online miền Nam 35-50 tuổi". AI sẽ dùng thông tin này để viết bài phù hợp đúng tệp.

**3. Tone & Voice (Giọng điệu)**
Đây là phần quan trọng nhất. Hãy mô tả bằng 3-5 tính từ:
- *Gần gũi, dí dỏm, nhiều emoji, dùng từ GenZ*
- *Học thức, khoa học, dẫn số liệu, ít emoji, formal*
- *Chân thật, chia sẻ thật lòng, hay kể chuyện buồn vui*

**4. Ví dụ Văn phong (Sample Posts)**
Dán 2-3 bài viết tốt nhất của KOC đó. AI sẽ phân tích:
- Độ dài bài tối ưu (100 từ? 500 từ?)
- Tần suất dùng emoji (nhiều? vừa? ít?)
- Cấu trúc bài quen thuộc (kể chuyện? hỏi đáp? review thẳng?)
- Hashtag signature thường dùng

---

### Chiến lược Network — Xây Đội Hình KOC

**Mô hình "Bộ Ba"** cho mỗi sản phẩm:
- **1 KOC Nano (1K-10K follower):** Content thật, trust cao, giá rẻ → dùng để seeding
- **1 KOC Micro (10K-100K follower):** Cân bằng reach & trust → dùng để push main
- **1 KOC Mid (100K-500K follower):** Reach rộng → dùng để announce ra mắt

**Lịch trình Kích hoạt:**
1. Tuần 1: KOC Nano đăng trước (tạo buzz nhỏ, test thị trường)
2. Tuần 2: KOC Micro đăng (extend reach, thêm social proof)
3. Tuần 3: KOC Mid đăng (harvest kết quả, đẩy viral)

---

### Advanced: Mô phỏng Giọng KOC với AI

Khi cần viết 50 bài theo giọng KOC, chọn KOC đó trong dropdown "Giả giọng KOC" ở Xưởng Nháp. 

**Ví dụ Output:** Nếu KOC A hay dùng câu hỏi tu từ và emoji 🤔:
\`Ai ngờ cái nhỏ xinh như vậy mà công dụng lại "khổng lồ" đến vậy không? 🤔 Mình đã skeptical lắm, cho đến khi... (kể tiếp bên dưới)\`

> **💡 Mẹo Pro:** Sau mỗi campaign, update "Hiệu quả" vào profile KOC (link rate, comment rate). Sau 3-6 tháng, bạn sẽ có dataset để biết KOC nào phù hợp nhất cho từng loại sản phẩm/chiến dịch.
`
    },
    {
        id: 'designer',
        title: '🎨 Designer Hub — Kanban Hình ảnh',
        route: 'designer',
        icon: 'image',
        shortSummary: 'Kanban board chuyên biệt cho team thiết kế. Nhận brief, tạo AI prompt Midjourney, theo dõi tiến độ.',
        content: `
## Designer Hub: Từ Copywriter đến Designer trong 1 Click

Vấn đề phổ biến nhất trong team marketing: **Copywriter viết xong, Designer không biết hình ảnh cần gì!**

Designer Hub giải quyết vấn đề này bằng cách tự động "dịch" nội dung text sang brief hình ảnh chi tiết, kèm prompt AI sẵn sàng dùng cho Midjourney/Canva AI/Adobe Firefly.

---

### Hiểu Luồng Kanban

**Chờ thiết kế (Backlog) 📋**
Bài đã được duyệt nội dung, chưa có hình. Designer nhận thẻ từ đây.
*Hành động:* Click "Tạo Prompt AI" để nhận brief hình ảnh + AI prompt.

**Đang thiết kế (In Progress) ✏️**
Designer đang thao tác. Kéo thẻ vào đây khi bắt đầu để team biết ai đang làm gì.
*Không để thẻ tắc nghẽn ở đây quá 24h.*

**Chờ duyệt hình (Review) 👁️**
Designer đã xong, upload hình lên và chờ Leader/Content Manager xem. Upload ảnh ngay vào thẻ để reviewer dễ kiểm tra.

**Hoàn tất (Done) ✅**
Nội dung + hình ảnh đều OK. Sẵn sàng tải về và upload lên nền tảng.

---

### Dùng AI Prompt Hints như Chuyên gia

Khi bấm "Tạo Prompt AI", hệ thống phân tích toàn bộ nội dung bài viết và trả về:

**Prompt cho Midjourney/Stable Diffusion:**
\`Một người phụ nữ Việt Nam khoảng 35 tuổi, da sáng mịn, nụ cười tự tin, cầm hộp Collagen Sachet màu hồng nhạt, background phòng bếp hiện đại sáng sủa, ánh sáng tự nhiên buổi sáng, chụp dạng lifestyle photography, không quá commercial --ar 4:5 --v 6\`

**Palette màu gợi ý:**
- Nếu bài về TPCN phụ nữ → Pastel pink #F8BBD0, Gold #FFD700, White
- Nếu bài về TPCN nam giới → Navy #1A237E, Silver #CFD8DC, Black
- Nếu bài về detox/wellness → Sage green #A5D6A7, Cream #FFFDE7, Earthy tones

**Bố cục (Layout) đề xuất:**
- Facebook: Ảnh 1200x628, text không vượt quá 20% diện tích ảnh
- TikTok/Story: Ảnh 1080x1920, vùng an toàn không bị che bởi UI 150px top & bottom
- Feed Instagram: 1080x1080, center-weighted composition

---

### Copy Prompt → Discord → Kết quả trong 60 giây

1. Bấm **"Copy Prompt"** trong thẻ Kanban
2. Mở Discord server Midjourney
3. Gõ \`/imagine\` và Paste prompt
4. Chọn ảnh đẹp nhất trong 4 kết quả, bấm U (Upscale)
5. Download và upload vào thẻ trong Designer Hub

> **💡 Mẹo Pro:** Dùng \`--seed [số]\` cuối prompt để tái tạo phong cách nhất quán cho một series bài. Ví dụ: \`--seed 12345\` sẽ cho phong cách màu và ánh sáng tương tự nhau qua các ảnh khác nhau, tạo brand consistency.
`
    },
    {
        id: 'campaigns',
        title: '📊 Chiến dịch (Campaign Strategy)',
        route: 'campaigns',
        icon: 'campaigns',
        shortSummary: 'Xây cây nội dung 3 cấp: Chiến dịch → Trụ cột → Tuyến bài. Không bao giờ hết ý tưởng content.',
        content: `
## Tại sao cần Cây Nội dung?

Nhiều team marketing rơi vào vòng lặp: *"Hôm nay viết gì đây?"* — đây là dấu hiệu của team không có Content Strategy.

Cây Nội dung 3 cấp trong ContentPilot giải phóng team khỏi sự cố "trống ý tưởng" và đảm bảo mỗi bài đăng đều phục vụ mục tiêu chiến lược lớn hơn.

---

### Cây Nội dung Mẫu — Ra mắt Collagen TPCN

**Cấp 1 — Chiến dịch:**
\`"Khởi động Mùa Hè — Collagen Glow 2024"\`
*Timeline: 8 tuần, Q2/2024*

**Cấp 2 — Trụ cột Chủ đề (Content Pillars):**
| Trụ cột | Tỷ lệ | Mục tiêu |
|---------|-------|---------|
| Giáo dục sản phẩm | 30% | Tăng nhận biết, giải thích cơ chế |
| Testimonial & Social Proof | 25% | Xây dựng niềm tin |
| Lifestyle & Aspiration | 20% | Kết nối cảm xúc |
| Mồi câu (Hook content) | 15% | Viral, chia sẻ rộng |
| Chốt đơn trực tiếp (Sale) | 10% | Conversion |

**Cấp 3 — Tuyến bài (Content Angles) cho Trụ cột Giáo dục:**
- Angle 1: "Collagen nào thật sự hấp thụ được?" (Hook: So sánh)
- Angle 2: "Uống Collagen đúng giờ quan trọng không?" (Hook: Sai lầm phổ biến)
- Angle 3: "3 dấu hiệu da bạn đang thiếu Collagen trầm trọng" (Hook: Diagnosis)
- Angle 4: "Collagen và Vitamin C — tại sao phải uống cùng nhau?" (Hook: Bí quyết)

---

### Công thức "Không Bao giờ Hết Ý tưởng"

Từ **1 Trụ cột** → có thể phát triển ít nhất **10 Angles** bằng cách thay đổi:

**Góc tiếp cận (Angle):**
- Sai lầm phổ biến → Đúng mình cần làm
- Bí quyết chưa ai nói → Giờ tôi tiết lộ
- So sánh A vs B → Cái nào tốt hơn?
- Câu hỏi phổ biến → Giải đáp thẳng

**Narrative Format:**
- Kể chuyện (Storytelling): Hành trình từ trước → sau
- Listicle: "5 lý do tại sao..."
- How-to: "Cách làm X đúng chuẩn"
- Myth-busting: "Sự thật về X mà bạn cần biết"

---

### Từ Angle → Xưởng Nháp trong 1 Click

Khi bạn đã có Angle hoàn hảo, click **"Viết ngay"**. Hệ thống sẽ:
1. Tự động điền Context của Campaign và Angle vào Brief
2. Mở Xưởng Nháp với thông tin đầy đủ
3. AI sinh nội dung bám sát đúng thông điệp và hook đã định

> **🌟 Quan trọng:** Nên lập Cây Nội dung cho cả **quý** (13 tuần) trước khi bắt đầu. Điền tối thiểu 5 Angles cho mỗi Trụ cột. Như vậy team luôn có sẵn "menu content" để chọn, không cần brainstorm từ đầu mỗi ngày.
`
    },
    {
        id: 'strategy',
        title: '🧠 Chiến lược Marketing AI',
        route: 'strategy',
        icon: 'strategy',
        shortSummary: 'Để AI phân tích và xây dựng chiến lược nội dung dài hạn từ Brief của bạn.',
        content: `
## AI Strategy Builder — Từ Brief đến Kế hoạch 90 ngày

Tính năng Strategy Builder cho phép bạn nhập mô tả sản phẩm/chiến dịch và nhận về bản kế hoạch nội dung chi tiết với Pillars và Angles được AI gợi ý.

---

### Khi nào dùng Strategy Builder?

**Dùng khi:**
- Ra mắt sản phẩm mới, chưa biết bắt đầu từ đâu
- Cần refresh content strategy cho sản phẩm đang bán chậm
- Muốn có góc nhìn khách quan từ AI về thị trường mục tiêu

**Không cần dùng khi:**
- Đã có content plan rõ ràng → Dùng Campaigns trực tiếp
- Cần viết bài gấp ngay → Dùng Xưởng Nháp

---

### Cách Viết Brief Chiến lược Hiệu quả

**Mẫu Brief Tốt:**
\`Sản phẩm: Viên uống Đông Trùng Hạ Thảo Tây Tạng 500mg dạng viên nang.
USP: 100% chiết xuất từ Đông Trùng Hạ Thảo Tây Tạng tự nhiên, quy trình lạnh bảo toàn hoạt chất.
Thị trường: Nam giới 40-60 tuổi, dân kinh doanh, hay đi công tác, mệt mỏi mãn tính, muốn phục hồi năng lượng.
Đối thủ: Các sản phẩm Đông Trùng giá thấp hơn từ Trung Quốc.
Mục tiêu: Định vị premium, giá trị 2 triệu/hộp, bán online qua Facebook & Zalo.\`

**AI sẽ trả về:**
- 4-5 Content Pillars với tỷ lệ % đề nghị
- 3-5 Angles cho mỗi Pillar
- Tone & Language khuyến nghị
- Timeline kích hoạt trong 12 tuần

---

### Đọc Output AI Strategy Đúng Cách

AI Strategy không phải sách giáo khoa — đây là điểm khởi đầu cho thảo luận của team.

**Nên:**
- Dùng Pillars gợi ý làm khung, tùy chỉnh % cho phù hợp brand voice
- Lấy Angles làm inspiration, kết hợp với insight thực tế từ team sales/CSKH

**Không nên:**
- Follow 100% không điều chỉnh
- Bỏ qua các Insight từ comment khách hàng thực tế

> **💡 Mẹo Pro:** Sau mỗi campaign, đối chiếu Performance thực tế (engagement, CTR, conversion) với Strategy AI đã đề xuất. Sự sai lệch giữa dự đoán và thực tế là bài học marketing giá trị nhất bạn có thể có.
`
    },
    {
        id: 'library',
        title: '📚 Thư viện Nội dung',
        route: 'library',
        icon: 'library',
        shortSummary: 'Kho chứa và quản lý toàn bộ nội dung đã tạo. Tái sử dụng, chỉnh sửa và export dễ dàng.',
        content: `
## Thư viện — Tài sản Nội dung của Bạn

Mỗi bài đã tạo là một tài sản. Thư viện giúp bạn khai thác triệt để tài sản đó thay vì "dùng một lần rồi bỏ".

---

### Chiến lược Repurpose Content — Nhân đôi Sản lượng

Một bài Facebook hay có thể được **Repurpose** thành 5 định dạng khác:

| Nội dung Gốc | Repurpose thành |
|-------------|----------------|
| Facebook long-form (500 chữ) | 3 tweet/X thread |
| Facebook long-form | 1 script TikTok 60-90 giây |
| Facebook long-form | 5 Stories/Reels slide |
| Facebook long-form | 1 email newsletter |
| Facebook long-form | 1 bài Zalo OA |

**Cách thực hiện trong ContentPilot:**
1. Mở bài trong Thư viện
2. Click "Tạo biến thể" → chọn nền tảng đích
3. AI sẽ re-format, cắt bớt hoặc mở rộng phù hợp từng nền tảng

---

### Bộ lọc Thông minh — Tìm đúng bài trong 5 giây

**Lọc theo Trạng thái:**
- Draft: Bài chưa duyệt → ưu tiên review
- Pending: Đang chờ duyệt
- Approved: Đã duyệt, chờ lên lịch
- Published: Đã đăng

**Lọc theo Nền tảng:**
- Tìm tất cả bài Facebook → xuất playlist đăng
- Tìm bài TikTok → giao cho Video Editor

**Lọc theo KOC:**
- Xem tất cả content của KOC A → đánh giá tone consistency

---

### Export & Handoff

Khi cần giao content cho Social Media Manager hoặc Scheduler (Buffer, CoSchedule):
1. Lọc bài theo tuần/trạng thái
2. Xuất file CSV hoặc copy batch
3. Paste vào Airtable/Notion/Spreadsheet lịch đăng

> **💡 Mẹo Pro:** Đặt tag "Evergreen" cho các bài không bị lỗi thời (giải thích sản phẩm, FAQ, testimonial cơ bản). Những bài này có thể tái sử dụng không giới hạn, chỉ cần đổi ảnh và CTA theo từng đợt promotion.
`
    },
    {
        id: 'conversions',
        title: '📈 Theo dõi Chuyển đổi',
        route: 'conversions',
        icon: 'conversions',
        shortSummary: 'Gắn UTM, theo dõi nguồn đơn, tính ROI thực tế cho từng campaign và KOC.',
        content: `
## Conversion Tracking — Biết Bài Nào Thực sự Bán Được Hàng

Nhiều team marketing chỉ đo "Like, Share, Comment" — đây là **Vanity Metrics** (chỉ số ảo). Điều quan trọng hơn là: **bài đó tạo ra bao nhiêu đơn hàng?**

Module Chuyển đổi giúp bạn kết nối từng bài viết đến doanh thu thực tế.

---

### Hiểu UTM Parameters

UTM là đoạn text gắn sau link để Google Analytics/FB Ads Manager biết traffic đến từ đâu.

**Cấu trúc UTM chuẩn:**
\`https://yoursite.com?utm_source=facebook&utm_medium=social&utm_campaign=collagen-q2&utm_content=koc-nguyenvana\`

**4 thành phần quan trọng:**
- \`utm_source\`: Nền tảng (facebook, tiktok, zalo, email)
- \`utm_medium\`: Loại traffic (social, organic, paid, koc)
- \`utm_campaign\`: Tên chiến dịch (collagen-summer-2024)
- \`utm_content\`: Biến thể cụ thể (bai-koc-a, bai-avatar-me-bim-sua)

---

### Cách Đọc Báo cáo Conversion

**CPC (Cost Per Click):** Chi phí để có 1 click
- < 1.000đ: Xuất sắc (organic content tốt)
- 1.000-5.000đ: Chấp nhận được
- > 10.000đ: Cần review lại content hoặc targeting

**CPL (Cost Per Lead):** Chi phí để có 1 khách hàng để lại thông tin
- TPCN premium (giá > 500K): CPL < 50.000đ là tốt
- TPCN mass market: CPL < 20.000đ

**ROAS (Return On Ad Spend):** Doanh thu / Chi phí quảng cáo
- ROAS < 1: Đang lỗ
- ROAS 1-3: Hòa vốn, cần tối ưu
- ROAS > 3: Profitable, có thể scale

---

### Attribute Đơn hàng cho KOC

Trong ContentPilot, bạn có thể gắn voucher code duy nhất cho từng KOC:
- KOC Nguyễn A → Mã: **NGUYENA15** (giảm 15%)
- KOC Trần B → Mã: **TRANB20** (giảm 20%)

Mỗi đơn dùng code → hệ thống biết đến từ KOC nào → tính được doanh thu thực của từng KOC → trả hoa hồng chính xác.

> **🌟 Quan trọng:** Đây là cách duy nhất để biết thực sự KOC nào *bán được*, không chỉ KOC nào *được xem nhiều*. Có thể KOC 500K follower không bán được bằng KOC 20K follower nhưng có audience đúng tệp sản phẩm của bạn.
`
    },
    {
        id: 'approvals-advanced',
        title: '⚡ Hệ thống Phê duyệt Đa cấp',
        route: 'approvals',
        icon: 'approvals',
        shortSummary: 'Quy trình review nội dung 3 cấp để đảm bảo chất lượng và compliance trước khi xuất bản.',
        content: `
## Thiết kế Quy trình Duyệt Bài — Không Bao giờ Đăng Nhầm

### Mô hình Approval 3 Cấp (Enterprise)

**Cấp 1 — Executive Review (Người tạo tự kiểm)**
- Tự đọc lại bài, check lỗi chính tả
- Chạy Compliance AI, xem kết quả
- Đảm bảo bài đúng Brief và có đủ Hook + Proof + CTA

**Cấp 2 — Content Manager Review**
- Kiểm tra tone & voice có đúng brand không
- Kiểm tra thông điệp có nhất quán với chiến dịch không
- Check Compliance Score phải ≥ 90

**Cấp 3 — Legal/Brand Review (chỉ với bài quan trọng)**
- Bài quảng cáo paid (Facebook Ads, Google Ads)
- Bài campaign ra mắt sản phẩm
- Bài có claim y tế/khoa học cụ thể

---

### SLA (Service Level Agreement) cho Approval

Thiết lập kỳ vọng rõ ràng:

| Loại bài | Thời hạn duyệt |
|---------|---------------|
| Post organic thông thường | 4 tiếng làm việc |
| Post có hình ảnh | 8 tiếng (chờ Designer) |
| Paid Ads | 24 tiếng (cần Review kỹ hơn) |
| Campaign launch | 48 tiếng (cần Legal review) |

> **⚠️ Quan trọng:** Thiếu SLA = bài bị "stuck" không ai biết → deadline bị lỡ → team nhau. Hãy in SLA và dán lên tường văn phòng.
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
        'brand': 'dashboard',
        'settings': 'dashboard',
        'team': 'dashboard',
        'calendar': 'campaigns',
    };

    const id = mapping[routeId] || null;
    if (!id) return null;

    return GUIDES.find(g => g.id === id);
}

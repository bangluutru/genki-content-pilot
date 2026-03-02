/**
 * Marketing Events Data — Vietnamese market holidays, events, and seasonal trends
 * Used by Calendar and Dashboard for seasonal marketing insights
 */
const MARKETING_EVENTS = [
    // ── Tết & Đầu năm ──
    { date: '01-01', name: 'Tết Dương lịch', category: 'holiday', icon: '🎆', tip: 'Flash sale cuối năm, content "Năm mới - Khởi đầu mới"' },
    { date: '01-25', name: 'Tết Nguyên Đán (≈)', category: 'holiday', icon: '🧧', tip: 'Chiến dịch lớn nhất năm. Chuẩn bị content Tết từ tháng 12. Quà tặng, ưu đãi Tết, content sum họp gia đình.' },
    { date: '02-14', name: 'Valentine\'s Day', category: 'seasonal', icon: '❤️', tip: 'Content tình yêu, quà tặng couple. Combo đôi, ưu đãi cho cặp đôi.' },

    // ── Quốc tế Phụ nữ & Mùa xuân ──
    { date: '03-08', name: 'Quốc tế Phụ nữ', category: 'holiday', icon: '🌷', tip: 'Content tri ân phụ nữ, flash sale cho nữ. Sản phẩm chăm sóc sắc đẹp, sức khỏe.' },
    { date: '03-15', name: 'World Consumer Rights Day', category: 'awareness', icon: '🛡️', tip: 'Content về chất lượng sản phẩm, cam kết thương hiệu.' },

    // ── Tháng 4 ──
    { date: '04-01', name: 'April Fools\' Day', category: 'fun', icon: '🤡', tip: 'Content hài hước, "troll" nhẹ nhàng, engagement cao.' },
    { date: '04-07', name: 'World Health Day', category: 'awareness', icon: '🏥', tip: 'Content sức khỏe, TPCN, lối sống lành mạnh.' },
    { date: '04-22', name: 'Earth Day', category: 'awareness', icon: '🌍', tip: 'Content bền vững, sản phẩm xanh, trách nhiệm xã hội.' },
    { date: '04-30', name: 'Giải phóng miền Nam', category: 'holiday', icon: '🇻🇳', tip: 'Content kỷ niệm, sale nghỉ lễ dài.' },

    // ── Tháng 5 ──
    { date: '05-01', name: 'Quốc tế Lao động', category: 'holiday', icon: '⚒️', tip: 'Sale nghỉ lễ, content tri ân người lao động.' },
    { date: '05-11', name: 'Mother\'s Day', category: 'seasonal', icon: '👩', tip: 'Content tri ân mẹ, quà tặng mẹ. Wellness, sức khỏe, spa.' },
    { date: '05-19', name: 'Ngày sinh Chủ tịch Hồ Chí Minh', category: 'holiday', icon: '🇻🇳', tip: 'Content truyền cảm hứng, giá trị dân tộc.' },

    // ── Tháng 6 ──
    { date: '06-01', name: 'Quốc tế Thiếu nhi', category: 'seasonal', icon: '🧒', tip: 'Content gia đình, sản phẩm trẻ em, hoạt động vui chơi.' },
    { date: '06-06', name: '6.6 Mid-Year Sale', category: 'ecommerce', icon: '🛒', tip: 'Flash sale giữa năm. Combo deal, voucher.' },
    { date: '06-16', name: 'Father\'s Day', category: 'seasonal', icon: '👨', tip: 'Content tri ân cha, quà tặng cha.' },
    { date: '06-28', name: 'Ngày Gia đình VN', category: 'seasonal', icon: '👨‍👩‍👧‍👦', tip: 'Content gia đình Việt, giá trị sum họp.' },

    // ── Tháng 7-8 ──
    { date: '07-07', name: '7.7 Super Sale', category: 'ecommerce', icon: '🛒', tip: 'Sale sàn TMĐT, đồng bộ Shopee/Lazada/TikTok Shop.' },
    { date: '07-20', name: 'Ngày Thương binh Liệt sĩ', category: 'holiday', icon: '🇻🇳', tip: 'Content tri ân, CSR.' },
    { date: '08-08', name: '8.8 Sale', category: 'ecommerce', icon: '🛒', tip: 'Flash sale tháng 8, push sản phẩm mùa hè cuối cùng.' },
    { date: '08-15', name: 'Trung thu', category: 'holiday', icon: '🏮', tip: 'Content mùa Trung thu, quà tặng, bánh trung thu.' },

    // ── Tháng 9-10 ──
    { date: '09-02', name: 'Quốc khánh', category: 'holiday', icon: '🇻🇳', tip: 'Content yêu nước, sale nghỉ lễ.' },
    { date: '09-09', name: '9.9 Super Shopping Day', category: 'ecommerce', icon: '🛒', tip: 'Sale lớn Q3, chuẩn bị mùa cuối năm.' },
    { date: '10-10', name: '10.10 Sale', category: 'ecommerce', icon: '🛒', tip: 'Flash sale tháng 10, đếm ngược 11.11.' },
    { date: '10-20', name: 'Ngày Phụ nữ VN', category: 'holiday', icon: '🌸', tip: 'Content tri ân PNVN, quà tặng, ưu đãi đặc biệt.' },
    { date: '10-31', name: 'Halloween', category: 'fun', icon: '🎃', tip: 'Content sáng tạo, costume, minigame.' },

    // ── Tháng 11-12 (Peak Season) ──
    { date: '11-01', name: 'Khởi động mùa sale cuối năm', category: 'ecommerce', icon: '📢', tip: 'Teaser 11.11, build hype, early-bird deals.' },
    { date: '11-11', name: '11.11 Singles\' Day / Sale khủng', category: 'ecommerce', icon: '🛒', tip: 'SALE LỚN NHẤT NĂM cùng 11.11. Livestream, mega voucher, flash deal.' },
    { date: '11-20', name: 'Ngày Nhà giáo VN', category: 'holiday', icon: '📚', tip: 'Content tri ân thầy cô, quà tặng giáo viên.' },
    { date: '11-24', name: 'Black Friday', category: 'ecommerce', icon: '🏷️', tip: 'Sale cực lớn, bundle deals, countdown timer.' },
    { date: '12-12', name: '12.12 Year-End Sale', category: 'ecommerce', icon: '🛒', tip: 'Flash sale cuối năm, clear kho, ưu đãi bom tấn.' },
    { date: '12-24', name: 'Christmas Eve', category: 'seasonal', icon: '🎄', tip: 'Content Giáng sinh, quà tặng, không khí lễ hội.' },
    { date: '12-25', name: 'Christmas', category: 'seasonal', icon: '🎅', tip: 'Merry Christmas content, sale Noel.' },
    { date: '12-31', name: 'New Year\'s Eve', category: 'seasonal', icon: '🎉', tip: 'Content đếm ngược, tổng kết năm, year in review.' },
];

/**
 * Get upcoming marketing events within N days
 * @param {number} days - lookahead window (default 30)
 * @returns {Array} upcoming events with real date
 */
export function getUpcomingEvents(days = 30) {
    const now = new Date();
    const year = now.getFullYear();

    return MARKETING_EVENTS
        .map(evt => {
            const [mm, dd] = evt.date.split('-').map(Number);
            let eventDate = new Date(year, mm - 1, dd);
            // If event already passed this year, check next year
            if (eventDate < now) {
                eventDate = new Date(year + 1, mm - 1, dd);
            }
            const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
            return { ...evt, realDate: eventDate, daysUntil: diffDays };
        })
        .filter(evt => evt.daysUntil >= 0 && evt.daysUntil <= days)
        .sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Get events for a specific month (for calendar overlay)
 * @param {number} month - 0-indexed month
 * @param {number} year - full year
 * @returns {Array} events in that month
 */
export function getEventsForMonth(month, year) {
    return MARKETING_EVENTS
        .filter(evt => {
            const [mm] = evt.date.split('-').map(Number);
            return mm - 1 === month;
        })
        .map(evt => {
            const [mm, dd] = evt.date.split('-').map(Number);
            return { ...evt, realDate: new Date(year, mm - 1, dd), day: dd };
        })
        .sort((a, b) => a.day - b.day);
}

/**
 * Get all events (for reference)
 */
export function getAllMarketingEvents() {
    return MARKETING_EVENTS;
}

export default MARKETING_EVENTS;

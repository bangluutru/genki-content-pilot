/**
 * Compliance Service — Legal compliance checker for health product content
 * Prevents violations of Vietnam advertising laws (Thông tư 15/2023/TT-BYT)
 */

// Danh sách từ ngữ NGHIÊM CẤM trong quảng cáo TPCN/Thực phẩm
export const BANNED_WORDS = [
    // Từ "chữa bệnh" (vi phạm nghiêm trọng)
    'chữa khỏi', 'điều trị', 'chữa trị', 'chữa bệnh', 'chữa lành',
    'chữa dứt điểm', 'đặc trị', 'trị khỏi', 'hết bệnh', 'khỏi bệnh',
    'chữa dứt', 'chữa tận gốc', 'giải pháp cho bệnh', 'chống lại bệnh',

    // Từ tuyệt đối hoá
    '100%', 'hoàn toàn', 'tuyệt đối', 'chắc chắn', 'đảm bảo khỏi',
    'bảo đảm', 'cam kết khỏi', 'cam kết hiệu quả', 'không lo',
    'không còn', 'hết ngay', 'hiệu quả tức thì', 'ngay lập tức',

    // Từ "thần dược"
    'thần dược', 'bí quyết', 'bí mật', 'độc quyền', 'công thức thần kỳ',
    'phương thuốc thần', 'thần kì', 'thần kỳ', 'kỳ diệu', 'kì diệu',
    'tuyệt vời nhất', 'tốt nhất thế giới', 'số 1 thế giới',

    // Từ so sánh tuyệt đối
    'duy nhất', 'độc nhất', 'không có gì sánh được', 'vượt trội nhất',
    'tốt hơn tất cả', 'mạnh nhất', 'nhanh nhất', 'tốt nhất',

    // Từ liên quan đến thuốc
    'thay thế thuốc', 'thay thuốc', 'không cần thuốc', 'bỏ thuốc',
    'ngừng uống thuốc', 'thay cho thuốc tây', 'hơn cả thuốc',

    // Tên bệnh cụ thể (TPCN không được nói chữa bệnh)
    'ung thư', 'tim mạch', 'tiểu đường', 'cao huyết áp', 'đột quỵ',
    'suy thận', 'suy gan', 'viêm gan', 'HIV', 'AIDS', 'lao',
    'gout', 'xơ gan', 'tắc mạch', 'nhồi máu', 'COVID',

    // Từ liên quan hệ miễn dịch (cần thận trọng)
    'miễn dịch 100%', 'không bao giờ ốm', 'không bị bệnh',
    'tăng miễn dịch tối đa', 'miễn dịch tuyệt đối',
];

// Từ cần CẢNH BÁO (không cấm nhưng cần context đúng)
export const WARNING_WORDS = [
    'hỗ trợ', 'giúp', 'cải thiện', 'tăng cường', 'bổ sung',
    'duy trì', 'nâng cao', 'hỗ trợ điều trị', 'giảm nguy cơ',
    'phòng ngừa', 'tăng đề kháng', 'miễn dịch',
];

// Template disclaimer theo quy định
export const DISCLAIMER_TEMPLATES = {
    tpcn: `📌 LƯU Ý: Sản phẩm này là thực phẩm chức năng, không phải là thuốc, không có tác dụng thay thế thuốc chữa bệnh. Đọc kỹ hướng dẫn sử dụng trước khi dùng.`,

    myPham: `📌 LƯU Ý: Hiệu quả sử dụng tuỳ thuộc vào cơ địa từng người. Sản phẩm không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.`,

    thucPham: `📌 LƢU Ý: Sản phẩm này là thực phẩm, không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.`,
};

/**
 * Check content for compliance violations
 * @param {string} text - Content to check
 * @returns {Object} { violations: Array, warnings: Array, isCompliant: boolean }
 */
export function checkCompliance(text) {
    if (!text) return { violations: [], warnings: [], isCompliant: true };

    const lowerText = text.toLowerCase();
    const violations = [];
    const warnings = [];

    // Check banned words
    BANNED_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
            violations.push({
                word,
                type: 'banned',
                severity: 'high',
                count: matches.length,
                message: `Từ ngữ vi phạm pháp luật: "${word}"`,
                suggestion: getSuggestion(word),
            });
        }
    });

    // Check warning words (context-dependent)
    WARNING_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(text)) {
            warnings.push({
                word,
                type: 'warning',
                severity: 'medium',
                message: `Từ cần thận trọng: "${word}" - Đảm bảo sử dụng đúng ngữ cảnh`,
            });
        }
    });

    return {
        violations,
        warnings,
        isCompliant: violations.length === 0,
        score: calculateComplianceScore(violations, warnings),
    };
}

/**
 * Get suggestion for banned word
 */
function getSuggestion(bannedWord) {
    const suggestions = {
        'chữa khỏi': 'hỗ trợ cải thiện',
        'điều trị': 'hỗ trợ',
        '100%': 'hiệu quả cao',
        'hoàn toàn': 'đáng kể',
        'thần dược': 'giải pháp tự nhiên',
        'bảo đảm': 'có thể giúp',
        'duy nhất': 'độc đáo',
        'ung thư': '[loại bỏ hoặc thay bằng "hỗ trợ sức khỏe"]',
    };

    // Find closest match
    for (const [banned, suggest] of Object.entries(suggestions)) {
        if (bannedWord.includes(banned) || banned.includes(bannedWord)) {
            return suggest;
        }
    }

    return 'cân nhắc viết lại câu';
}

/**
 * Calculate compliance score (0-100)
 */
function calculateComplianceScore(violations, warnings) {
    if (violations.length === 0 && warnings.length === 0) return 100;

    const violationPenalty = violations.length * 20;
    const warningPenalty = warnings.length * 5;

    return Math.max(0, 100 - violationPenalty - warningPenalty);
}

/**
 * Highlight violations in text (returns HTML)
 * @param {string} text - Original text
 * @param {Array} violations - Violations from checkCompliance
 * @returns {string} HTML with highlighted violations
 */
export function highlightViolations(text, violations) {
    if (!violations || violations.length === 0) return text;

    let highlightedText = text;

    violations.forEach(v => {
        const regex = new RegExp(`(${v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlightedText = highlightedText.replace(
            regex,
            '<span class="compliance-violation" title="⚠️ ' + v.message + '">$1</span>'
        );
    });

    return highlightedText;
}

/**
 * Auto-add disclaimer to content
 * @param {string} content - Original content
 * @param {string} type - 'tpcn', 'myPham', or 'thucPham'
 * @returns {string} Content with disclaimer appended
 */
export function addDisclaimer(content, type = 'tpcn') {
    const disclaimer = DISCLAIMER_TEMPLATES[type] || DISCLAIMER_TEMPLATES.tpcn;

    // Check if disclaimer already exists
    if (content.includes(disclaimer)) return content;

    return content + '\n\n' + disclaimer;
}

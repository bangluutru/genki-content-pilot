/**
 * Predictive Intelligence Service
 * Analyzes content structure (Hook, Proof, CTA) to calculate a "Conversion Probability" score.
 */

// Simple heuristic lists
const HOOK_INDICATORS = ['?', '!', 'sốc', 'bất ngờ', 'sự thật', 'tiết lộ', 'bí quyết', 'ngừng ngay', 'sai lầm', 'đừng', 'nếu bạn'];
const PROOF_INDICATORS = ['%', 'chứng minh', 'nghiên cứu', 'khảo sát', 'chuyên gia', 'review', 'khách hàng', 'đánh giá', 'kiểm nghiệm', 'bác sĩ', 'thực tế', 'cam kết'];
const CTA_INDICATORS = ['mua ngay', 'đặt hàng', 'inbox', 'nhắn tin', 'đăng ký', 'nhấp vào', 'click', 'link', 'tham khảo', 'chi tiết tại', 'liên hệ', 'hotline', 'gọi ngay'];

/**
 * Calculates a conversion probability score (0-100) based on content heuristics.
 * @param {string} text - The content text to analyze
 * @returns {Object} { score, breakdown, suggestions }
 */
export function analyzeConversionProbability(text) {
    if (!text || text.trim().length === 0) {
        return { score: 0, breakdown: {}, suggestions: [] };
    }

    const lowerText = text.toLowerCase();
    const lines = lowerText.split('\n').filter(l => l.trim().length > 0);

    // 1. Hook Strength (check first 20% of text or first 3 lines)
    const hookArea = lines.slice(0, Math.max(3, Math.ceil(lines.length * 0.2))).join(' ');
    let hookScore = 0;
    const foundHooks = HOOK_INDICATORS.filter(indicator => hookArea.includes(indicator));
    if (foundHooks.length > 0) hookScore += 15;
    if (foundHooks.length > 1) hookScore += 10;
    if (hookArea.includes('?') && hookArea.includes('!')) hookScore += 5; // A question followed by excitement
    hookScore = Math.min(hookScore, 30); // Max 30 points

    // 2. Proof Density (check entire text)
    let proofScore = 0;
    const foundProofs = PROOF_INDICATORS.filter(indicator => lowerText.includes(indicator));
    if (foundProofs.length > 0) proofScore += 15;
    if (foundProofs.length > 1) proofScore += 10;
    if (foundProofs.length > 2) proofScore += 5;
    // Check for numbers which usually indicate data/proof (e.g., 99%, 10.000, 5) - simple numeric check
    if (/\d+/.test(lowerText)) proofScore += 10;
    proofScore = Math.min(proofScore, 40); // Max 40 points

    // 3. CTA Presence (check last 30% of text or last 4 lines)
    const ctaArea = lines.slice(Math.max(0, lines.length - Math.max(4, Math.ceil(lines.length * 0.3)))).join(' ');
    let ctaScore = 0;
    const foundCTAs = CTA_INDICATORS.filter(indicator => ctaArea.includes(indicator));
    if (foundCTAs.length > 0) ctaScore += 20;
    if (foundCTAs.length > 1) ctaScore += 10;
    ctaScore = Math.min(ctaScore, 30); // Max 30 points

    let totalScore = hookScore + proofScore + ctaScore;

    // Penalize if it's too short or a massive wall of text without breaks
    if (text.length < 150) totalScore -= 15;
    if (lines.length > 0 && text.length / lines.length > 200) totalScore -= 10; // Long paragraphs

    totalScore = Math.max(0, Math.min(100, totalScore)); // Clamp 0-100

    // Generate suggestions
    const suggestions = [];
    if (hookScore < 20) suggestions.push('Mở bài thiếu sự thu hút. Thêm câu hỏi hoặc từ khóa gây tò mò.');
    if (proofScore < 20) suggestions.push('Nội dung thiếu tính thuyết phục. Bổ sung con số, dữ liệu hoặc đánh giá từ khách hàng.');
    if (ctaScore < 20) suggestions.push('Lời kêu gọi hành động (CTA) chưa rõ ràng ở cuối bài. Nên thêm câu lệnh như "Mua ngay" hoặc "Inbox".');
    if (text.length >= 150 && text.length / lines.length > 200) suggestions.push('Bài viết có đoạn quá dài. Hãy tách đoạn ngắn hơn (3-4 dòng/đoạn) để dễ đọc trên điện thoại.');

    return {
        score: totalScore,
        breakdown: {
            hook: Math.round((hookScore / 30) * 100),
            proof: Math.round((proofScore / 40) * 100),
            cta: Math.round((ctaScore / 30) * 100)
        },
        suggestions
    };
}

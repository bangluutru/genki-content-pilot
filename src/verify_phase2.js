
// Verification Script for Phase 2: Intelligence Loop
// Simulates data retrieval and prompt construction with top-performing content.

// Mock firestore data
const mockTopContent = [
    {
        title: "Top Post 1",
        body: "🔥 Siêu phẩm mùa hè! Mua ngay kẻo lỡ. (Revenue Winner)",
        orders: 50,
        revenue: 25000000
    },
    {
        title: "Top Post 2",
        body: "Bi quyết da đẹp đón Tết. Giảm 50% cho combo 3 món.",
        orders: 30,
        revenue: 15000000
    }
];

// Mock function representing fs.getTopPerformingContent
async function getTopPerformingContent(limit) {
    console.log(`fetching top ${limit} performing content...`);
    return mockTopContent.slice(0, limit);
}

// Logic from gemini.js buildSystemPrompt
function buildSystemPrompt(brand, performanceContext = []) {
    let intelligenceContext = '';
    if (performanceContext && performanceContext.length > 0) {
        intelligenceContext = `
PHÂN TÍCH HIỆU QUẢ (INTELLIGENCE):
Dưới đây là các bài viết đã mang lại doanh thu cao nhất cho thương hiệu. Hãy học hỏi giọng văn, cấu trúc và cách kêu gọi hành động (CTA) của chúng:
${performanceContext.map((c, i) => `
${i + 1}. [Hiệu quả: ${c.orders} đơn, ${((c.revenue || 0) / 1000).toFixed(0)}K doanh thu]
"${c.body.substring(0, 300)}..."
`).join('\n')}
`;
    }

    return `Bạn là một Content Marketing Expert...

${intelligenceContext}

QUY TẮC:...`;
}

// MAIN TEST
(async () => {
    console.log("---------------------------------------------------");
    console.log("VERIFYING PHASE 2: INTELLIGENCE LOOP");
    console.log("---------------------------------------------------");

    // 1. Test Data Retrieval Simulation
    const context = await getTopPerformingContent(3);
    if (context.length === 2) console.log("✅ Data Retrieval Simulated Success");
    else console.error("❌ Data Retrieval Failed");

    // 2. Test Prompt Injection
    const prompt = buildSystemPrompt({}, context);
    console.log("\nGenerated System Prompt Segment:");
    console.log(prompt);

    console.log("\n---------------------------------------------------");
    console.log("CHECKS:");

    if (prompt.includes('PHÂN TÍCH HIỆU QUẢ (INTELLIGENCE)')) {
        console.log("✅ Intelligence Section Present");
    } else {
        console.error("❌ Intelligence Section Missing");
    }

    if (prompt.includes('Hiệu quả: 50 đơn')) {
        console.log("✅ Performance Metrics injected");
    } else {
        console.error("❌ Performance Metrics missing");
    }

    if (prompt.includes('Siêu phẩm mùa hè')) {
        console.log("✅ Content Body injected");
    } else {
        console.error("❌ Content Body missing");
    }

})();

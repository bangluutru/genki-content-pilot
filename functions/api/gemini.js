/**
 * Cloudflare Functions Proxy for Gemini API
 * Endpoint: POST /api/gemini
 * 
 * Keeps GEMINI_API_KEY server-side (never exposed to browser).
 * Frontend sends prompt + config, proxy forwards to Google with secret key.
 */
export async function onRequest(context) {
    const { request, env } = context;

    // --- CORS ---
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // --- Validate API Key exists ---
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured on server' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        // --- Parse request from frontend ---
        const { prompt, config = {} } = await request.json();

        if (!prompt) {
            return new Response(JSON.stringify({ error: 'Missing prompt' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const model = config.model || 'gemini-2.0-flash';
        const generationConfig = {
            temperature: config.temperature ?? 0.8,
            topP: config.topP ?? 0.95,
            maxOutputTokens: config.maxOutputTokens ?? 4096,
        };
        if (config.responseMimeType) {
            generationConfig.responseMimeType = config.responseMimeType;
        }

        // --- Call Gemini API (key stays server-side) ---
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig,
            }),
        });

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            return new Response(JSON.stringify({
                error: data.error?.message || 'Gemini API error',
                status: geminiResponse.status,
            }), {
                status: geminiResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Forward clean response ---
        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message || 'Proxy error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}

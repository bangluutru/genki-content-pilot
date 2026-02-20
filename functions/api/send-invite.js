/**
 * Cloudflare Functions — Send Invite Email via Google Apps Script
 * Endpoint: POST /api/send-invite
 *
 * Env var required: GAS_WEBAPP_URL (Google Apps Script Web App URL)
 * Set in Cloudflare Pages > Settings > Environment Variables
 */
export async function onRequest(context) {
    const { request, env } = context;

    // --- CORS ---
    const ALLOWED_ORIGINS = [
        'https://genki-content-pilot.pages.dev',
        'http://localhost:5173',
        'http://localhost:8788',
    ];
    const requestOrigin = request.headers.get('Origin') || '';
    const corsOrigin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];

    const corsHeaders = {
        'Access-Control-Allow-Origin': corsOrigin,
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

    // --- Validate config ---
    const gasUrl = env.GAS_WEBAPP_URL;
    if (!gasUrl) {
        return new Response(JSON.stringify({ error: 'GAS_WEBAPP_URL not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await request.json();
        const { to, subject, html } = body;

        if (!to || !subject || !html) {
            return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Forward to Google Apps Script Web App ---
        const gasResponse = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html }),
        });

        const result = await gasResponse.text();
        let parsed;
        try { parsed = JSON.parse(result); } catch { parsed = { raw: result }; }

        if (!gasResponse.ok && gasResponse.status !== 302) {
            return new Response(JSON.stringify({ error: 'GAS error', details: parsed }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true, details: parsed }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal error', message: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}

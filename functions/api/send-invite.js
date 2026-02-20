/**
 * Cloudflare Functions — Send Invite Email via Resend API
 * Endpoint: POST /api/send-invite
 *
 * Env var required: RESEND_API_KEY (set in Cloudflare Pages > Settings > Environment Variables)
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

    // --- Validate API Key ---
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await request.json();
        const { to, subject, html, from } = body;

        if (!to || !subject || !html) {
            return new Response(JSON.stringify({ error: 'Missing required fields: to, subject, html' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Call Resend API ---
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: from || env.EMAIL_FROM || 'Genki Content Pilot <onboarding@resend.dev>',
                to: [to],
                subject,
                html,
            }),
        });

        const result = await resendResponse.json();

        if (!resendResponse.ok) {
            return new Response(JSON.stringify({ error: result.message || 'Failed to send email', details: result }), {
                status: resendResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true, id: result.id }), {
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

/**
 * Duotone Icon System — Premium Depth SVG Icons
 * Usage: icon('dashboard') or icon('dashboard', 20)
 * Returns inline SVG string with duotone styling (stroke + semi-transparent fill).
 */

const ICONS = {
    // ── Navigation ──────────────────────────────────────
    dashboard: `<rect class="duo-f" x="3" y="3" width="7" height="7" rx="1.5"/><rect class="duo-f" x="14" y="3" width="7" height="7" rx="1.5"/><rect class="duo-f" x="3" y="14" width="7" height="7" rx="1.5"/><rect class="duo-f" x="14" y="14" width="7" height="7" rx="1.5"/><rect class="duo-s" x="3" y="3" width="7" height="7" rx="1.5"/><rect class="duo-s" x="14" y="3" width="7" height="7" rx="1.5"/><rect class="duo-s" x="3" y="14" width="7" height="7" rx="1.5"/><rect class="duo-s" x="14" y="14" width="7" height="7" rx="1.5"/>`,

    campaigns: `<circle class="duo-f" cx="12" cy="12" r="10"/><circle class="duo-s" cx="12" cy="12" r="10"/><circle class="duo-s" cx="12" cy="12" r="6"/><circle class="duo-f" cx="12" cy="12" r="2"/><circle class="duo-s" cx="12" cy="12" r="2"/>`,

    strategy: `<path class="duo-f" d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path class="duo-s" d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><line class="duo-s" x1="9" y1="21" x2="15" y2="21"/>`,

    create: `<polygon class="duo-f" points="16.5 3.5 21 8 7 19 3 20 4 16 16.5 3.5"/><path class="duo-s" d="M12 20h9"/><path class="duo-s" d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>`,

    library: `<path class="duo-f" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path class="duo-s" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path class="duo-s" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,

    calendar: `<rect class="duo-f" x="3" y="4" width="18" height="18" rx="2"/><rect class="duo-s" x="3" y="4" width="18" height="18" rx="2"/><line class="duo-s" x1="16" y1="2" x2="16" y2="6"/><line class="duo-s" x1="8" y1="2" x2="8" y2="6"/><line class="duo-s" x1="3" y1="10" x2="21" y2="10"/>`,

    conversions: `<polygon class="duo-f" points="1 18 8.5 10.5 13.5 15.5 23 6 23 18 1 18"/><polyline class="duo-s" points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline class="duo-s" points="17 6 23 6 23 12"/>`,

    approvals: `<circle class="duo-f" cx="12" cy="12" r="10"/><path class="duo-s" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline class="duo-s" points="22 4 12 14.01 9 11.01"/>`,

    templates: `<rect class="duo-f" x="3" y="3" width="18" height="18" rx="2"/><rect class="duo-s" x="3" y="3" width="18" height="18" rx="2"/><line class="duo-s" x1="9" y1="3" x2="9" y2="21"/><line class="duo-s" x1="3" y1="9" x2="21" y2="9"/>`,

    brand: `<circle class="duo-f" cx="13.5" cy="6.5" r="2.5"/><circle class="duo-f" cx="19" cy="17" r="2"/><circle class="duo-f" cx="6" cy="12" r="3"/><circle class="duo-s" cx="13.5" cy="6.5" r="2.5"/><circle class="duo-s" cx="19" cy="17" r="2"/><circle class="duo-s" cx="6" cy="12" r="3"/>`,

    team: `<circle class="duo-f" cx="9" cy="7" r="4"/><circle class="duo-s" cx="9" cy="7" r="4"/><path class="duo-f" d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path class="duo-s" d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path class="duo-s" d="M16 3.13a4 4 0 0 1 0 7.75"/><path class="duo-s" d="M21 21v-2a4 4 0 0 0-3-3.87"/>`,

    settings: `<circle class="duo-f" cx="12" cy="12" r="3"/><circle class="duo-s" cx="12" cy="12" r="3"/><path class="duo-s" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,

    // ── Actions & UI ────────────────────────────────────
    logout: `<path class="duo-f" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path class="duo-s" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline class="duo-s" points="16 17 21 12 16 7"/><line class="duo-s" x1="21" y1="12" x2="9" y2="12"/>`,

    publish: `<polygon class="duo-f" points="22 2 15 22 11 13 2 9 22 2"/><polygon class="duo-s" points="22 2 15 22 11 13 2 9 22 2"/><line class="duo-s" x1="22" y1="2" x2="11" y2="13"/>`,

    refresh: `<polyline class="duo-s" points="23 4 23 10 17 10"/><polyline class="duo-s" points="1 20 1 14 7 14"/><path class="duo-s" d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>`,

    image: `<rect class="duo-f" x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect class="duo-s" x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle class="duo-s" cx="8.5" cy="8.5" r="1.5"/><polyline class="duo-s" points="21 15 16 10 5 21"/>`,

    chart: `<rect class="duo-f" x="18" y="3" width="4" height="18" rx="1"/><rect class="duo-s" x="18" y="3" width="4" height="18" rx="1"/><rect class="duo-f" x="10" y="8" width="4" height="13" rx="1"/><rect class="duo-s" x="10" y="8" width="4" height="13" rx="1"/><rect class="duo-f" x="2" y="13" width="4" height="8" rx="1"/><rect class="duo-s" x="2" y="13" width="4" height="8" rx="1"/>`,

    pin: `<path class="duo-f" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><path class="duo-s" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle class="duo-s" cx="12" cy="10" r="3"/>`,

    target: `<circle class="duo-f" cx="12" cy="12" r="10"/><circle class="duo-s" cx="12" cy="12" r="10"/><circle class="duo-s" cx="12" cy="12" r="6"/><circle class="duo-s" cx="12" cy="12" r="2"/>`,

    tip: `<circle class="duo-f" cx="12" cy="12" r="10"/><path class="duo-s" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><line class="duo-s" x1="12" y1="16" x2="12" y2="12"/><line class="duo-s" x1="12" y1="8" x2="12.01" y2="8"/>`,

    plane: `<path class="duo-f" d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8l-8.2-1.8a.5.5 0 0 0-.5.2L3 8l5 3L5 14l-3-1-1 1.5 3.5 2 2 3.5L8 19l-1-3 3-3 3 5 1.7-1.3a.5.5 0 0 0 .2-.5z"/><path class="duo-s" d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8l-8.2-1.8a.5.5 0 0 0-.5.2L3 8l5 3L5 14l-3-1-1 1.5 3.5 2 2 3.5L8 19l-1-3 3-3 3 5 1.7-1.3a.5.5 0 0 0 .2-.5z"/>`,

    // ── Role Icons ──────────────────────────────────────
    crown: `<path class="duo-f" d="M2 17l3-10 5 5 2-8 2 8 5-5 3 10z"/><path class="duo-s" d="M2 17l3-10 5 5 2-8 2 8 5-5 3 10z"/><rect class="duo-f" x="2" y="17" width="20" height="4" rx="1"/><rect class="duo-s" x="2" y="17" width="20" height="4" rx="1"/>`,

    pencil: `<path class="duo-s" d="M12 20h9"/><path class="duo-s" d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>`,

    eye: `<path class="duo-f" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><path class="duo-s" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle class="duo-s" cx="12" cy="12" r="3"/>`,

    // ── Misc ────────────────────────────────────────────
    download: `<path class="duo-s" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline class="duo-s" points="7 10 12 15 17 10"/><line class="duo-s" x1="12" y1="15" x2="12" y2="3"/>`,

    edit: `<path class="duo-f" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path class="duo-s" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path class="duo-s" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,

    rotate: `<polyline class="duo-s" points="1 4 1 10 7 10"/><path class="duo-s" d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>`,

    copy: `<rect class="duo-f" x="9" y="9" width="13" height="13" rx="2" ry="2"/><rect class="duo-s" x="9" y="9" width="13" height="13" rx="2" ry="2"/><path class="duo-s" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`,

    save: `<path class="duo-f" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path class="duo-s" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline class="duo-s" points="17 21 17 13 7 13 7 21"/><polyline class="duo-s" points="7 3 7 8 15 8"/>`,

    google: `<path class="duo-s" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path class="duo-s" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path class="duo-s" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path class="duo-s" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>`,

    sparkle: `<polygon class="duo-f" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><polygon class="duo-s" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,

    plus: `<line class="duo-s" x1="12" y1="5" x2="12" y2="19"/><line class="duo-s" x1="5" y1="12" x2="19" y2="12"/>`,

    upload: `<path class="duo-s" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline class="duo-s" points="17 8 12 3 7 8"/><line class="duo-s" x1="12" y1="3" x2="12" y2="15"/>`,

    trash: `<polyline class="duo-s" points="3 6 5 6 21 6"/><path class="duo-f" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path class="duo-s" d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`,

    mic: `<path class="duo-f" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path class="duo-s" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path class="duo-s" d="M19 10v2a7 7 0 0 1-14 0v-2"/><line class="duo-s" x1="12" y1="19" x2="12" y2="23"/><line class="duo-s" x1="8" y1="23" x2="16" y2="23"/>`,

    shield: `<path class="duo-f" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path class="duo-s" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,

    // ── Additional Icons ────────────────────────────────
    phone: `<rect class="duo-f" x="5" y="2" width="14" height="20" rx="2"/><rect class="duo-s" x="5" y="2" width="14" height="20" rx="2"/><line class="duo-s" x1="12" y1="18" x2="12.01" y2="18"/>`,

    blog: `<path class="duo-f" d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path class="duo-s" d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><line class="duo-s" x1="7" y1="9" x2="17" y2="9"/><line class="duo-s" x1="7" y1="13" x2="14" y2="13"/>`,

    camera: `<path class="duo-f" d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><path class="duo-s" d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle class="duo-s" cx="12" cy="13" r="4"/>`,

    gift: `<rect class="duo-f" x="3" y="8" width="18" height="4"/><rect class="duo-s" x="3" y="8" width="18" height="4"/><path class="duo-f" d="M5 12h14v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8z"/><path class="duo-s" d="M5 12h14v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8z"/><line class="duo-s" x1="12" y1="8" x2="12" y2="21"/><path class="duo-s" d="M12 8a4 4 0 0 0-4-4c-1.5 0-3 1.5-3 3 0 2 2 3 4 3"/><path class="duo-s" d="M12 8a4 4 0 0 1 4-4c1.5 0 3 1.5 3 3 0 2-2 3-4 3"/>`,

    star: `<polygon class="duo-f" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/><polygon class="duo-s" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,

    cursor: `<path class="duo-f" d="M5 3l14 6-6 2-2 6z"/><path class="duo-s" d="M5 3l14 6-6 2-2 6z"/>`,

    clipboard: `<path class="duo-f" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path class="duo-s" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect class="duo-s" x="8" y="2" width="8" height="4" rx="1" ry="1"/>`,

    document: `<path class="duo-f" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path class="duo-s" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline class="duo-s" points="14 2 14 8 20 8"/>`,

    fire: `<path class="duo-f" d="M12 23c-4.97 0-9-2.69-9-6 0-4 3.5-7.5 4-10.5.5 3.5 3 5.5 5 5.5 2 0 3.5-1 3-3.5 1.5 2 3 4.5 3 7 0 4-3 7.5-6 7.5z"/><path class="duo-s" d="M12 23c-4.97 0-9-2.69-9-6 0-4 3.5-7.5 4-10.5.5 3.5 3 5.5 5 5.5 2 0 3.5-1 3-3.5 1.5 2 3 4.5 3 7 0 4-3 7.5-6 7.5z"/>`,

    bolt: `<polygon class="duo-f" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/><polygon class="duo-s" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,

    party: `<path class="duo-f" d="M5.8 11.3L2 22l10.7-3.8"/><path class="duo-s" d="M5.8 11.3L2 22l10.7-3.8"/><path class="duo-s" d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01M22 2 15 9l-2-2 7-7M9.1 7.7l-1.4 1.4M13.5 3.3l-1.4 1.4"/>`,

    warning: `<path class="duo-f" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path class="duo-s" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line class="duo-s" x1="12" y1="9" x2="12" y2="13"/><line class="duo-s" x1="12" y1="17" x2="12.01" y2="17"/>`,

    check: `<polyline class="duo-s" points="20 6 9 17 4 12"/>`,

    cross: `<line class="duo-s" x1="18" y1="6" x2="6" y2="18"/><line class="duo-s" x1="6" y1="6" x2="18" y2="18"/>`,

    scissors: `<circle class="duo-f" cx="6" cy="6" r="3"/><circle class="duo-s" cx="6" cy="6" r="3"/><circle class="duo-f" cx="6" cy="18" r="3"/><circle class="duo-s" cx="6" cy="18" r="3"/><line class="duo-s" x1="20" y1="4" x2="8.12" y2="15.88"/><line class="duo-s" x1="14.47" y1="14.48" x2="20" y2="20"/><line class="duo-s" x1="8.12" y1="8.12" x2="12" y2="12"/>`,

    tophat: `<path class="duo-f" d="M9 3h6v8H9z"/><path class="duo-s" d="M9 3h6v8H9z"/><path class="duo-s" d="M4 11h16v2H4z"/><path class="duo-f" d="M4 11h16v2H4z"/>`,

    smiley: `<circle class="duo-f" cx="12" cy="12" r="10"/><circle class="duo-s" cx="12" cy="12" r="10"/><path class="duo-s" d="M8 14s1.5 2 4 2 4-2 4-2"/><line class="duo-s" x1="9" y1="9" x2="9.01" y2="9"/><line class="duo-s" x1="15" y1="9" x2="15.01" y2="9"/>`,

    question: `<circle class="duo-f" cx="12" cy="12" r="10"/><circle class="duo-s" cx="12" cy="12" r="10"/><path class="duo-s" d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line class="duo-s" x1="12" y1="17" x2="12.01" y2="17"/>`,

    book: `<path class="duo-f" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path class="duo-s" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path class="duo-f" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path class="duo-s" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,

    sun: `<circle class="duo-f" cx="12" cy="12" r="5"/><circle class="duo-s" cx="12" cy="12" r="5"/><line class="duo-s" x1="12" y1="1" x2="12" y2="3"/><line class="duo-s" x1="12" y1="21" x2="12" y2="23"/><line class="duo-s" x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line class="duo-s" x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line class="duo-s" x1="1" y1="12" x2="3" y2="12"/><line class="duo-s" x1="21" y1="12" x2="23" y2="12"/>`,

    moon: `<path class="duo-f" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/><path class="duo-s" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,

    fork: `<line class="duo-s" x1="3" y1="2" x2="3" y2="22"/><path class="duo-s" d="M21 8V2l-4 2v4M15 12l6-2"/><path class="duo-s" d="M3 12a9 9 0 0 1 9 0 9 9 0 0 0 9 0"/>`,

    tent: `<path class="duo-f" d="M3 21h18L12 3z"/><path class="duo-s" d="M3 21h18L12 3z"/><path class="duo-s" d="M12 21V11"/>`,

    clock: `<circle class="duo-f" cx="12" cy="12" r="10"/><circle class="duo-s" cx="12" cy="12" r="10"/><polyline class="duo-s" points="12 6 12 12 16 14"/>`,

    search: `<circle class="duo-f" cx="11" cy="11" r="8"/><circle class="duo-s" cx="11" cy="11" r="8"/><line class="duo-s" x1="21" y1="21" x2="16.65" y2="16.65"/>`,

    cart: `<circle class="duo-f" cx="9" cy="21" r="1"/><circle class="duo-s" cx="9" cy="21" r="1"/><circle class="duo-f" cx="20" cy="21" r="1"/><circle class="duo-s" cx="20" cy="21" r="1"/><path class="duo-s" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>`,

    coin: `<circle class="duo-f" cx="12" cy="12" r="10"/><circle class="duo-s" cx="12" cy="12" r="10"/><path class="duo-s" d="M12 6v12M9 9.5a3 3 0 1 1 0 5"/>`,

    newspaper: `<path class="duo-f" d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path class="duo-s" d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><line class="duo-s" x1="7" y1="8" x2="12" y2="8"/><line class="duo-s" x1="7" y1="12" x2="17" y2="12"/><line class="duo-s" x1="7" y1="16" x2="17" y2="16"/><rect class="duo-s" x="14" y="7" width="3" height="4"/>`,

    inbox: `<polyline class="duo-s" points="22 12 16 12 14 15 10 15 8 12 2 12"/><path class="duo-f" d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path class="duo-s" d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>`,

    hand: `<path class="duo-f" d="M18 11V6a2 2 0 0 0-4 0v1a2 2 0 0 0-4 0v1a2 2 0 0 0-4 0v5l-2.2-2.2a2 2 0 0 0-2.83 2.83L7.2 19.8A6 6 0 0 0 11.4 22h4.28a6 6 0 0 0 5.65-4l1.07-3.22A2 2 0 0 0 20.5 12H18z"/><path class="duo-s" d="M18 11V6a2 2 0 0 0-4 0v1a2 2 0 0 0-4 0v1a2 2 0 0 0-4 0v5l-2.2-2.2a2 2 0 0 0-2.83 2.83L7.2 19.8A6 6 0 0 0 11.4 22h4.28a6 6 0 0 0 5.65-4l1.07-3.22A2 2 0 0 0 20.5 12H18z"/>`,

    chart: `<line class="duo-s" x1="18" y1="20" x2="18" y2="10"/><line class="duo-s" x1="12" y1="20" x2="12" y2="4"/><line class="duo-s" x1="6" y1="20" x2="6" y2="14"/><rect class="duo-f" x="15" y="10" width="6" height="10" rx="1" opacity="0.15"/><rect class="duo-f" x="9" y="4" width="6" height="16" rx="1" opacity="0.15"/><rect class="duo-f" x="3" y="14" width="6" height="6" rx="1" opacity="0.15"/>`,

    library: `<path class="duo-f" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path class="duo-s" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path class="duo-f" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path class="duo-s" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,

    megaphone: `<path class="duo-f" d="M18 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6l-4-4V7l4-4h12z"/><path class="duo-s" d="M18 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6l-4-4V7l4-4h12z"/><line class="duo-s" x1="9" y1="9" x2="15" y2="9"/><line class="duo-s" x1="9" y1="13" x2="13" y2="13"/>`,

    film: `<rect class="duo-f" x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><rect class="duo-s" x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line class="duo-s" x1="7" y1="2" x2="7" y2="22"/><line class="duo-s" x1="17" y1="2" x2="17" y2="22"/><line class="duo-s" x1="2" y1="12" x2="22" y2="12"/><line class="duo-s" x1="2" y1="7" x2="7" y2="7"/><line class="duo-s" x1="2" y1="17" x2="7" y2="17"/><line class="duo-s" x1="17" y1="7" x2="22" y2="7"/><line class="duo-s" x1="17" y1="17" x2="22" y2="17"/>`,

    pencil: `<path class="duo-f" d="M12 20h9"/><path class="duo-s" d="M12 20h9"/><path class="duo-f" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/><path class="duo-s" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>`,
};

/**
 * Get a duotone SVG icon as an HTML string.
 * @param {string} name - Icon name from the ICONS map.
 * @param {number} [size=20] - Icon size in pixels.
 * @returns {string} SVG HTML string.
 */
export function icon(name, size = 20) {
    const paths = ICONS[name];
    if (!paths) {
        console.warn(`[icons] Unknown icon: "${name}"`);
        return `<span style="width:${size}px;height:${size}px;display:inline-block;"></span>`;
    }
    return `<svg class="duo-icon" width="${size}" height="${size}" viewBox="0 0 24 24">${paths}</svg>`;
}

/**
 * Get all available icon names.
 * @returns {string[]}
 */
export function getIconNames() {
    return Object.keys(ICONS);
}

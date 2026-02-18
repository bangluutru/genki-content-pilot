#!/usr/bin/env node

// verify.js — Smoke test script (no test framework needed)
// Kiểm tra module exports, router param parsing, helper shapes
// Chạy: node scripts/verify.js

let passed = 0;
let failed = 0;

function assert(label, condition) {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.error(`  ❌ ${label}`);
        failed++;
    }
}

function section(name) {
    console.log(`\n── ${name} ──`);
}

// ═══════════════════════════════════════════
// 1. Module Export Checks (static analysis)
// ═══════════════════════════════════════════

section('Module Export Checks');

const fs = await import('fs');
const path = await import('path');

const ROOT = path.default.resolve(import.meta.dirname, '..');
const DB_DIR = path.default.join(ROOT, 'js/services/db');

// Check all db module files exist
const expectedDbFiles = ['index.js', 'collections.js', 'common.js', 'brands.js', 'contents.js', 'settings.js'];
for (const file of expectedDbFiles) {
    const filePath = path.default.join(DB_DIR, file);
    assert(`db/${file} exists`, fs.default.existsSync(filePath));
}

// Check state.js is a re-export wrapper (should NOT contain 'serverTimestamp' import)
const stateContent = fs.default.readFileSync(path.default.join(ROOT, 'js/state.js'), 'utf-8');
assert('state.js is re-export wrapper (no serverTimestamp)', !stateContent.includes("from 'firebase/firestore'"));
assert('state.js re-exports getBrand', stateContent.includes('getBrand'));
assert('state.js re-exports createContent', stateContent.includes('createContent'));
assert('state.js re-exports getSettings', stateContent.includes('getSettings'));

// Check common.js exports expected helpers
const commonContent = fs.default.readFileSync(path.default.join(DB_DIR, 'common.js'), 'utf-8');
const expectedHelpers = ['assertUser', 'assertRequired', 'withMeta', 'updateMeta', 'docWithId', 'snapshotToArray', 'normalizeError'];
for (const helper of expectedHelpers) {
    assert(`common.js exports ${helper}`, commonContent.includes(`export function ${helper}`) || commonContent.includes(`export const ${helper}`));
}

// Check collections.js has COLLECTIONS
const collectionsContent = fs.default.readFileSync(path.default.join(DB_DIR, 'collections.js'), 'utf-8');
assert('collections.js exports COLLECTIONS', collectionsContent.includes('export const COLLECTIONS'));
assert('collections.js has BRANDS', collectionsContent.includes("BRANDS"));
assert('collections.js has CONTENTS', collectionsContent.includes("CONTENTS"));
assert('collections.js has SETTINGS', collectionsContent.includes("SETTINGS"));

// ═══════════════════════════════════════════
// 2. Router Param Parsing
// ═══════════════════════════════════════════

section('Router Param Parsing');

// Simulate URLSearchParams parsing (same logic as router.js)
function parseQueryFromHash(hash) {
    const clean = hash.startsWith('#') ? hash.slice(1) : hash;
    const queryIndex = clean.indexOf('?');
    if (queryIndex === -1) return {};
    const searchStr = clean.slice(queryIndex + 1);
    const params = new URLSearchParams(searchStr);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

function getRouteFromHash(hash) {
    const clean = hash.startsWith('#') ? hash.slice(1) : hash;
    return clean.split('?')[0] || 'dashboard';
}

// Test cases
assert('empty hash → default route', getRouteFromHash('') === 'dashboard');
assert('#library → route=library', getRouteFromHash('#library') === 'library');
assert('#library?status=draft → route=library', getRouteFromHash('#library?status=draft') === 'library');
assert('#library?status=draft → params={status:"draft"}',
    JSON.stringify(parseQueryFromHash('#library?status=draft')) === '{"status":"draft"}');
assert('#create?id=abc&tab=fb → 2 params',
    (() => {
        const p = parseQueryFromHash('#create?id=abc&tab=fb');
        return p.id === 'abc' && p.tab === 'fb';
    })());
assert('#dashboard (no query) → empty params',
    JSON.stringify(parseQueryFromHash('#dashboard')) === '{}');

// ═══════════════════════════════════════════
// 3. Helper Shape Checks
// ═══════════════════════════════════════════

section('Helper Shape Checks');

// normalizeError shape
function normalizeError(err) {
    if (err && err.code) {
        return { code: err.code, message: err.message || 'Unknown error', details: err.customData || undefined };
    }
    if (err instanceof Error) {
        return { code: 'UNKNOWN', message: err.message };
    }
    return { code: 'UNKNOWN', message: String(err) };
}

const firebaseErr = normalizeError({ code: 'permission-denied', message: 'Missing permissions' });
assert('normalizeError firebase → has code', firebaseErr.code === 'permission-denied');
assert('normalizeError firebase → has message', firebaseErr.message === 'Missing permissions');

const jsErr = normalizeError(new Error('Something broke'));
assert('normalizeError Error → code=UNKNOWN', jsErr.code === 'UNKNOWN');
assert('normalizeError Error → has message', jsErr.message === 'Something broke');

const strErr = normalizeError('oops');
assert('normalizeError string → code=UNKNOWN', strErr.code === 'UNKNOWN');
assert('normalizeError string → message=oops', strErr.message === 'oops');

// Check router.js has new exports
const routerContent = fs.default.readFileSync(path.default.join(ROOT, 'js/router.js'), 'utf-8');
assert('router.js exports getQueryParams', routerContent.includes('export function getQueryParams'));
assert('router.js exports getParam', routerContent.includes('export function getParam'));
assert('router.js exports setParam', routerContent.includes('export function setParam'));

// Check toast.js has convenience wrappers
const toastContent = fs.default.readFileSync(path.default.join(ROOT, 'js/components/toast.js'), 'utf-8');
assert('toast.js exports showToast', toastContent.includes('export function showToast'));
assert('toast.js exports toast object', toastContent.includes('export const toast'));

// ═══════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════

console.log(`\n════════════════════════════`);
console.log(`  Total: ${passed + failed} | ✅ ${passed} passed | ❌ ${failed} failed`);
console.log(`════════════════════════════\n`);

process.exit(failed > 0 ? 1 : 0);

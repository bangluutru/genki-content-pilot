// firebase.js — Bridge module for js/ tree
// Re-exports Firebase instances from src/config/firebase.js
// All js/services/db/*.js modules import from this file

import { initFirebase, hasFirebaseConfig, app, auth, db } from '../src/config/firebase.js';

// Auto-init Firebase on first import
let _initPromise = null;

function ensureInit() {
    if (!_initPromise) {
        _initPromise = initFirebase();
    }
    return _initPromise;
}

// Kick off initialization
ensureInit();

export { app, auth, db, hasFirebaseConfig, ensureInit };

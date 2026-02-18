// auth.js — Bridge module for js/ tree
// Provides getCurrentUser() used by all tab components and pages
// Wraps Firebase auth state from src/config/firebase.js

import { auth, hasFirebaseConfig, ensureInit } from './firebase.js';

let _currentUser = null;

/**
 * Lấy current user (cached in-memory)
 * @returns {{ uid: string, email: string, displayName: string, photoURL: string }|null}
 */
export function getCurrentUser() {
    // Try Firebase auth first
    if (auth?.currentUser) {
        return {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
            photoURL: auth.currentUser.photoURL,
        };
    }
    return _currentUser;
}

/**
 * Lắng nghe auth state changes
 * @param {function} callback - (user|null) => void
 */
export async function onAuthChange(callback) {
    if (!hasFirebaseConfig()) {
        console.warn('⚠️ Firebase chưa cấu hình — auth disabled');
        callback(null);
        return;
    }

    await ensureInit();

    try {
        const { onAuthStateChanged } = await import('firebase/auth');
        if (auth) {
            onAuthStateChanged(auth, (user) => {
                _currentUser = user ? {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                } : null;
                callback(_currentUser);
            });
        } else {
            callback(null);
        }
    } catch (err) {
        console.error('Auth listener error:', err);
        callback(null);
    }
}

/**
 * Đăng nhập Google
 */
export async function loginWithGoogle() {
    if (!hasFirebaseConfig()) {
        throw new Error('Firebase chưa được cấu hình. Kiểm tra file .env');
    }

    await ensureInit();
    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
}

/**
 * Đăng xuất
 */
export async function logout() {
    if (!auth) return;
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    _currentUser = null;
}

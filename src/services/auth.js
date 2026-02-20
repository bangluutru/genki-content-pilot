/**
 * Auth Service — Firebase Google Sign-in with offline fallback
 */
import { hasFirebaseConfig, initFirebase } from '../config/firebase.js';
import { store } from '../utils/state.js';
import { router } from '../utils/router.js';
import { showToast } from '../components/toast.js';
import { upsertUser } from './db/users.js';
import { linkInvitedMember } from './db/members.js';

/** Sign in with Google */
export async function signInWithGoogle() {
    if (!hasFirebaseConfig()) {
        showToast('Firebase chưa được cấu hình. Kiểm tra file .env', 'warning');
        return;
    }

    try {
        store.set('isLoading', true);
        const { auth } = await initFirebase();
        const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
        const googleProvider = new GoogleAuthProvider();

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const authData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
        };

        // Persist user profile to Firestore (creates if new)
        await upsertUser(authData);

        // Auto-link any pending invitations for this email
        linkInvitedMember(authData.email, authData.uid);

        showToast(`Xin chào, ${user.displayName}!`, 'success');
        router.navigate('dashboard');
    } catch (error) {
        console.error('Sign-in error:', error);

        if (error.code === 'auth/popup-closed-by-user') {
            showToast('Đã huỷ đăng nhập', 'warning');
        } else if (error.code === 'auth/popup-blocked') {
            showToast('Popup bị chặn. Vui lòng cho phép popup.', 'error');
        } else {
            showToast('Lỗi đăng nhập. Vui lòng thử lại.', 'error');
        }
    } finally {
        store.set('isLoading', false);
    }
}

/** Sign out */
export async function signOutUser() {
    try {
        if (hasFirebaseConfig()) {
            const { auth } = await initFirebase();
            if (auth) {
                const { signOut } = await import('firebase/auth');
                await signOut(auth);
            }
        }
        store.update({ user: null, brand: null, contents: [] });
        showToast('Đã đăng xuất', 'info');
        router.navigate('login');
    } catch (error) {
        console.error('Sign-out error:', error);
        showToast('Lỗi đăng xuất', 'error');
    }
}

/** Listen to auth state changes */
export async function initAuthListener() {
    if (!hasFirebaseConfig()) {
        console.warn('⚠️ No Firebase config — skipping auth listener');
        return null;
    }

    const { auth } = await initFirebase();
    if (!auth) return null;

    const { onAuthStateChanged } = await import('firebase/auth');

    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const authData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                };
                // Upsert user profile (updates lastActiveAt)
                await upsertUser(authData);
            } else {
                store.set('user', null);
            }
            resolve(user);
        });
    });
}

/** Auth guard for router */
export function authGuard(path) {
    const publicRoutes = ['login'];
    const user = store.get('user');

    if (!user && !publicRoutes.includes(path)) {
        router.navigate('login');
        return false;
    }

    if (user && path === 'login') {
        router.navigate('dashboard');
        return false;
    }

    return true;
}

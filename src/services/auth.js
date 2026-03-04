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
        const { signInWithPopup, GoogleAuthProvider, signOut } = await import('firebase/auth');
        const googleProvider = new GoogleAuthProvider();

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // ACCESS CONTROL: Check if user is authorized before granting access
        const authorized = await isUserAuthorized(user.email, user.uid);
        if (!authorized) {
            await signOut(auth);
            store.set('user', null);
            showToast('Bạn chưa được mời sử dụng ứng dụng. Liên hệ admin để được cấp quyền.', 'error');
            return;
        }

        const authData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
        };

        // Persist user profile to Firestore (creates if new)
        await upsertUser(authData);

        // Auto-link any pending invitations for this email
        await linkInvitedMember(authData.email, authData.uid);

        // Load or auto-initialize workspace for RBAC
        const { loadWorkspace } = await import('./firestore.js');
        await loadWorkspace();

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

/**
 * Check if a user is authorized to use the app.
 * A user is authorized if:
 *   1. Their UID exists in the `users` collection (existing user), OR
 *   2. Their email exists in `workspace_members` (invited user)
 * @param {string} email
 * @param {string} userId - Firebase UID
 * @returns {boolean}
 */
async function isUserAuthorized(email, userId) {
    if (!email && !userId) return false;

    try {
        const { db } = await initFirebase();
        if (!db) return false;

        const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');

        // Check 1: Does the user document exist by UID? (fastest, no index needed)
        if (userId) {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) return true;
        }

        // Check 2: Is the email in workspace_members? (invited user)
        if (email) {
            const membersQuery = query(
                collection(db, 'workspace_members'),
                where('email', '==', email)
            );
            const membersSnap = await getDocs(membersQuery);
            if (!membersSnap.empty) return true;
        }

        return false;
    } catch (error) {
        console.error('Authorization check failed:', error.code, error.message);
        // Fail OPEN for first-time setup: if Firestore rules prevent reading,
        // allow access so the owner can set up the app initially
        console.warn('⚠️ Auth check could not verify — allowing access as fallback');
        return true;
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
        let firstRun = true;
        onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    // ACCESS CONTROL: Verify user is still authorized on session restore
                    const authorized = await isUserAuthorized(user.email, user.uid);
                    if (!authorized) {
                        const { signOut } = await import('firebase/auth');
                        await signOut(auth);
                        store.set('user', null);
                        if (firstRun) { resolve(null); firstRun = false; }
                        return;
                    }

                    const authData = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                    };
                    // Upsert user profile (updates lastActiveAt)
                    await upsertUser(authData);

                    // Load or auto-initialize workspace for RBAC
                    const { loadWorkspace } = await import('./firestore.js');
                    await loadWorkspace();
                } else {
                    store.set('user', null);
                }
            } catch (err) {
                console.error('Auth state handler error:', err);
            }
            if (firstRun) { resolve(user); firstRun = false; }
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

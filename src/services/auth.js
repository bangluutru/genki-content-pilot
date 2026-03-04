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
        const authorized = await isUserAuthorized(user.email);
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
 * Check if a user email is authorized to use the app.
 * A user is authorized if they exist in workspace_members (invited)
 * OR in users collection (already has an account).
 * @param {string} email
 * @returns {boolean}
 */
async function isUserAuthorized(email) {
    if (!email) return false;

    try {
        const { db, collection, query, where, getDocs, doc, getDoc } = await import('./db/helpers.js').then(m => m.getFirestore());

        // Check 1: Is the email in workspace_members? (invited user)
        const membersQuery = query(
            collection(db, 'workspace_members'),
            where('email', '==', email)
        );
        const membersSnap = await getDocs(membersQuery);
        if (!membersSnap.empty) return true;

        // Check 2: Is the email in users collection? (existing user)
        const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', email)
        );
        const usersSnap = await getDocs(usersQuery);
        if (!usersSnap.empty) return true;

        return false;
    } catch (error) {
        console.error('Authorization check failed:', error);
        // Fail CLOSED: if we can't verify, deny access
        return false;
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
                    const authorized = await isUserAuthorized(user.email);
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

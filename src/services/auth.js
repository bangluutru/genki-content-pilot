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

        const authData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
        };

        // STEP 1: Link pending invitations FIRST (converts invited → active member)
        await linkInvitedMember(authData.email, authData.uid);

        // STEP 2: Create/update user profile in Firestore
        await upsertUser(authData);

        // STEP 3: ACCESS CONTROL — now the user doc exists and invitations are linked
        const authorized = await isUserAuthorized(user.email, user.uid);
        if (!authorized) {
            await signOut(auth);
            store.set('user', null);
            showToast('Bạn chưa được mời sử dụng ứng dụng. Liên hệ admin để được cấp quyền.', 'error');
            return;
        }

        // STEP 4: Load or auto-initialize workspace for RBAC
        const { loadWorkspace } = await import('./firestore.js');
        const workspace = await loadWorkspace();
        const allWorkspaces = store.get('userWorkspaces') || [];

        if (!workspace && allWorkspaces.length === 0) {
            showToast('Bạn đã đăng nhập nhưng chưa thuộc workspace nào. Liên hệ admin.', 'warning');
            router.navigate('workspace-selector');
            return;
        }

        showToast(`Xin chào, ${user.displayName}!`, 'success');

        // If multiple workspaces → show selector, else go to dashboard
        if (allWorkspaces.length > 1) {
            router.navigate('workspace-selector');
        } else {
            router.navigate('dashboard');
        }
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
 * Authorization logic:
 *   1. UID exists in `users` collection → authorized (existing registered user)
 *   2. Email exists in `workspace_members` → authorized (invited user)
 *   3. Neither → NOT authorized
 * 
 * FAIL CLOSED: if checks fail, deny access.
 * @param {string} email
 * @param {string} userId - Firebase UID
 * @returns {boolean}
 */
async function isUserAuthorized(email, userId) {
    if (!email && !userId) return false;

    try {
        const { db } = await initFirebase();
        if (!db) {
            console.error('Auth check: Firestore not available');
            return false;
        }

        const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');

        // Check 1: Does the user document exist by UID?
        // Firestore rules allow: `request.auth.uid == userId`
        // So authenticated user CAN read their own document
        if (userId) {
            try {
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    return true; // User is registered
                }
            } catch (e) {
                console.warn('Auth check: users lookup failed:', e.code || e.message);
                // Continue to check 2
            }
        }

        // Check 2: Is the email in workspace_members? (pending invitation)
        // Query by invitedEmail + status to match Firestore security rules
        if (email) {
            try {
                const membersQuery = query(
                    collection(db, 'workspace_members'),
                    where('invitedEmail', '==', email),
                    where('status', '==', 'invited')
                );
                const membersSnap = await getDocs(membersQuery);
                if (!membersSnap.empty) {
                    return true; // User has a pending invitation
                }
            } catch (e) {
                console.warn('Auth check: workspace_members lookup failed:', e.code || e.message);
                // This query may fail due to Firestore rules — not critical
            }
        }

        // Neither check passed → user is not authorized
        return false;
    } catch (error) {
        console.error('Authorization check failed:', error.code, error.message);
        // FAIL CLOSED: deny access if we can't verify
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
    const authOnlyRoutes = ['workspace-selector']; // Needs auth but no workspace
    const user = store.get('user');

    if (!user && !publicRoutes.includes(path)) {
        router.navigate('login');
        return false;
    }

    if (user && path === 'login') {
        const workspace = store.get('workspace');
        router.navigate(workspace ? 'dashboard' : 'workspace-selector');
        return false;
    }

    return true;
}

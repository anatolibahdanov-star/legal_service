// in src/authProvider.ts
import { AuthProvider, UserIdentity } from 'react-admin';

// Assume the user identity is stored in localStorage after login
const authProvider: AuthProvider = {
    // ... other auth methods (login, logout, checkAuth, etc.) ...

    getPermissions: async () => {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if(session?.user) {
            console.log('Set user session in localstorage AFTER PERMISSION', session?.user)
            // localStorage.setItem('user', session?.user)
            return session?.user?.is_super ? Promise.resolve("admin") : Promise.resolve("lower")
        }
        return Promise.reject();
    },
    
    // Recommended for fine-grained access control
    canAccess: async ({ resource, action, record }) => {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if(!session?.user) {
            return false
        }
        const user = session?.user
        if (["delete"].includes(action) && resource === 'requests') {
            // Admins can edit anyone
            if (user.is_super) {
                return true;
            }
            // Users can only edit their own profile (check if record ID matches user ID)
            if (record && record.id === user.id) {
                return true;
            }
            // Otherwise deny access
            return false;
        }
        // Grant access to other actions/resources by default or implement more checks
        return true;
    },

    logout: async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        return Promise.resolve();
    },

    login: async ({ username, password }) => {
        const res = await fetch('/api/auth/signin/credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, redirect: false }),
        });

        if (!res.ok) throw new Error('Login failed');

        const session = await res.json();
        if(session?.user) {
            console.log('Set user session in localstorage AFTER LOGIN', session?.user)
            // localStorage.setItem('user', session?.user)
        }
        // On successful login, NextAuth.js sets a secure cookie.
        return Promise.resolve();
    },

    // called when the API returns an error status (401 or 403)
    checkError: ({ status }) => {
        if (status === 401 || status === 403) {
            return Promise.reject();
        }
        return Promise.resolve();
    },

    // called when the user navigates to a new location, to check for authentication
    checkAuth: async () => {
        // Check session status on the client
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        // console.log('session AFTER CHECK AUTH', session)
        if(session?.user) {
        //    console.log('Set user session in localstorage AFTER CHECK AUTH', session?.user)
        //    localStorage.setItem('user', session?.user)
            return Promise.resolve()
        }
        return Promise.reject();
    },
};

export default authProvider;

import { supabase } from '/js/supabaseClient.js';

/**
 * Get the currently logged‑in user (returns null if not logged in)
 */
export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Redirect logged‑out users away from protected pages
 * (profile, update-profile, event registration, etc.)
 */
export async function redirectIfLoggedOut() {
    const user = await getUser();
    if (!user) {
        window.location.href = '/pages/login.html';
    }
}

/**
 * Redirect logged‑in users away from login/register pages
 */
export async function redirectIfLoggedIn() {
    const user = await getUser();
    if (user) {
        window.location.href = '/pages/profile.html';
    }
}

/**
 * Require login but do NOT redirect — returns boolean
 * Useful for pages that behave differently depending on login state
 */
export async function requireLogin() {
    const user = await getUser();
    return !!user;
}

/**
 * Log out and redirect to login page
 */
export async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/pages/login.html';
}

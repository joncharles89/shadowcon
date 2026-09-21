import { supabase } from '/js/supabaseClient.js';

/**
 * Get the currently logged-in user
 */
export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Redirect to login page if user is not logged in
 */
export async function requireLogin() {
    const user = await getUser();
    if (!user) {
        window.location.href = '/pages/login.html';
    }
}

/**
 * Redirect logged-in users away from login/register pages
 */
export async function redirectIfLoggedIn() {
    const user = await getUser();
    if (user) {
        window.location.href = '/pages/profile.html';
    }
}

/**
 * Log out and reload the page
 */
export async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
}

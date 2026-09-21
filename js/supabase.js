import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabase = createClient(
    'https://yypfjlnlwilzzvpgtbwa.supabase.co',
    'sb_publishable_G-_r-PPQyg1CN1CwHQuqnQ_8l41VzeK'
);

async function updateNavAuth() {
    const { data: { user } } = await supabase.auth.getUser();

    const desktop = document.getElementById('nav-auth-desktop');
    const mobile = document.getElementById('nav-auth-mobile');

    if (user) {
        // Logged in
        desktop.innerHTML = '<a href="/pages/profile.html">Profile</a><a href="#" id="logoutLink">Logout</a>';

        mobile.innerHTML = '<a href="/pages/profile.html">Profile</a><a href="#" id="logoutLinkMobile">Logout</a>';
    } else {
        // Logged out
        desktop.innerHTML = '<a href="/pages/login.html">Login</a>';
        mobile.innerHTML = '<a href="/pages/login.html">Login</a>';
    }

    // Logout handlers
    const logoutDesktop = document.getElementById('logoutLink');
    const logoutMobile = document.getElementById('logoutLinkMobile');

    if (logoutDesktop) {
        logoutDesktop.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });
    }

    if (logoutMobile) {
        logoutMobile.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });
    }
}

updateNavAuth();
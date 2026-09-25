import { supabase } from '/js/supabaseClient.js';

// Unlock time for rounds
const ROUNDS_UNLOCK_TIME = new Date("2026-10-22T17:00:00");

// Check if rounds should be visible
function roundsAreUnlocked() {
    const now = new Date();
    return now >= ROUNDS_UNLOCK_TIME;
}

async function loadNav() {
    const placeholder = document.getElementById('nav-placeholder');
    if (!placeholder) return;

    // Load nav HTML
    const html = await fetch('/components/nav.html').then(r => r.text());
    placeholder.innerHTML = html;

    // After nav loads, activate session-aware logic
    updateNavAuth();
    activateMobileMenu();
}

async function updateNavAuth() {
    const { data: { user } } = await supabase.auth.getUser();

    const desktopAuth = document.getElementById('nav-auth-desktop');
    const mobileAuth = document.getElementById('nav-auth-mobile');

    const desktopLinks = document.querySelector('.nav-links');
    const mobileLinks = document.getElementById('mobileMenu');

    if (!desktopAuth || !mobileAuth || !desktopLinks || !mobileLinks) return;

    let isAdmin = false;

    if (user) {
        // Check admin table
        const { data: adminRow } = await supabase
            .from("admins")
            .select("id")
            .eq("id", user.id)
            .single();

        isAdmin = !!adminRow;
    }

    // Determine if rounds should be visible
    const showRounds = isAdmin || roundsAreUnlocked();

    // Remove existing rounds links from nav.html
    desktopLinks.querySelectorAll('a[href="/pages/rounds.html"]').forEach(el => el.parentElement.remove());
    mobileLinks.querySelectorAll('a[href="/pages/rounds.html"]').forEach(el => el.parentElement.remove());

    // Re-insert rounds link only if allowed
    if (showRounds) {
        const desktopRounds = document.createElement('li');
        desktopRounds.innerHTML = `<a href="/pages/rounds.html">Rounds</a>`;
        desktopLinks.insertBefore(desktopRounds, desktopAuth);

        const mobileRounds = document.createElement('li');
        mobileRounds.innerHTML = `<a href="/pages/rounds.html">Rounds</a>`;
        mobileLinks.insertBefore(mobileRounds, mobileAuth);
    }

    // Auth section
    if (user) {
        desktopAuth.innerHTML = `
            <a href="/pages/profile.html">Profile</a>
            ${isAdmin ? ` | <a href="/pages/admin.html">Admin</a>` : ""}
        `;

        mobileAuth.innerHTML = `
            <a href="/pages/profile.html">Profile</a>
            ${isAdmin ? ` | <a href="/pages/admin.html">Admin</a>` : ""}
        `;
    } else {
        desktopAuth.innerHTML = `<a href="/pages/login.html">Login</a>`;
        mobileAuth.innerHTML = `<a href="/pages/login.html">Login</a>`;
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

function activateMobileMenu() {
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (!burger || !mobileMenu) return;

    burger.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
    });

    // Expandable submenu
    const toggles = document.querySelectorAll('.expand-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('open');
            toggle.nextElementSibling.classList.toggle('open');
        });
    });
}

loadNav();

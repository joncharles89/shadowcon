import { supabase } from '/js/supabaseClient.js';

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

    const desktop = document.getElementById('nav-auth-desktop');
    const mobile = document.getElementById('nav-auth-mobile');

    if (!desktop || !mobile) return;

    if (user) {
        desktop.innerHTML = `
            <a href="/pages/profile.html">Profile</a>`
            //| <a href="#" id="logoutLink">Logout</a>`
        ;

        mobile.innerHTML = `
            <a href="/pages/profile.html">Profile</a>`
            //| <a href="#" id="logoutLinkMobile">Logout</a>`
        ;
    } else {
        desktop.innerHTML = `<a href="/pages/login.html">Login</a>`;
        mobile.innerHTML = `<a href="/pages/login.html">Login</a>`;
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

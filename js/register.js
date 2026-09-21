import { supabase } from '/js/supabaseClient.js';
import { redirectIfLoggedIn } from '/js/auth.js';

/**
 * Attach registration behaviour to your register page
 */
export function initRegisterForm() {
    redirectIfLoggedIn(); // Prevent logged-in users from registering again

    const registerBtn = document.getElementById('registerBtn');
    const message = document.getElementById('registerMessage');

    if (!registerBtn || !message) return;

    registerBtn.addEventListener('click', async () => {
        message.textContent = 'Creating account...';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            message.textContent = error.message;
            message.style.color = '#c76b6b';
            return;
        }

        message.textContent = 'Account created! Check your email to verify.';
        message.style.color = '#c7a96b';

        // Optional: auto-create profile row
        // (requires RLS policy allowing insert)
        /*
        await supabase.from('profiles').insert({
            id: data.user.id,
            username: email.split('@')[0]
        });
        */

        // Redirect after short delay
        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 1500);
    });
}

import { supabase } from '/js/supabaseClient.js';

export function initForgotPasswordForm() {
    const resetBtn = document.getElementById('resetBtn');
    const message = document.getElementById('resetMessage');

    resetBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value.trim();

        if (!email) {
            message.textContent = "Please enter your email.";
            message.style.color = "#c76b6b";
            return;
        }

        message.textContent = "Sending reset email...";
        message.style.color = "#c7a96b";

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/pages/reset-password.html`
        });

        if (error) {
            message.textContent = error.message;
            message.style.color = "#c76b6b";
            return;
        }

        message.textContent = "Check your email for the reset link.";
        message.style.color = "#c7a96b";
    });
}

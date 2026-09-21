import { supabase } from '/js/supabaseClient.js';

export function initPasswordResetForm() {
    const updateBtn = document.getElementById('updatePasswordBtn');
    const message = document.getElementById('resetMessage');

    updateBtn.addEventListener('click', async () => {
        const password = document.getElementById('password').value.trim();

        if (!password) {
            message.textContent = "Please enter a new password.";
            message.style.color = "#c76b6b";
            return;
        }

        message.textContent = "Updating password...";
        message.style.color = "#c7a96b";

        const { data, error } = await supabase.auth.updateUser({
            password
        });

        if (error) {
            message.textContent = error.message;
            message.style.color = "#c76b6b";
            return;
        }

        message.textContent = "Password updated! You can now log in.";
        message.style.color = "#c7a96b";

        setTimeout(() => {
            window.location.href = "/pages/login.html";
        }, 1500);
    });
}

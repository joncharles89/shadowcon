import { supabase } from '/js/supabaseClient.js';
import { redirectIfLoggedIn } from '/js/auth.js';

/**
 * Attach registration behaviour to your register page
 */
export function initRegisterForm() {
    const registerBtn = document.getElementById('registerBtn');
    const message = document.getElementById('registerMessage');

    registerBtn.addEventListener('click', async () => {
        message.textContent = "Creating account...";
        message.style.color = "#c7a96b";

        const email = document.getElementById('email').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !username || !password) {
            message.textContent = "Please fill in all fields.";
            message.style.color = "#c76b6b";
            return;
        }

        if (/\s/.test(username)) {
            message.textContent = "Username cannot contain spaces.";
            message.style.color = "#c76b6b";
            return;
        }

        // Create the Supabase user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username
                }
            }
        });

        if (error) {
            message.textContent = error.message;
            message.style.color = "#c76b6b";
            return;
        }

        message.textContent = "Account created! Please check your email to verify.";
        message.style.color = "#c7a96b";
    });
}

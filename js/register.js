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
        const name = document.getElementById('name').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !name || !password) {
            message.textContent = "Please fill in all fields.";
            message.style.color = "#c76b6b";
            return;
        }


        // Create the Supabase user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name
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

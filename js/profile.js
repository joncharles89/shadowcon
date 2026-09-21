import { supabase } from '/js/supabaseClient.js';
import { getUser, logout } from '/js/auth.js';

/**
 * Load and render the user's profile into #profile-root
 */
export async function loadProfile() {
    const root = document.getElementById('profile-root');
    if (!root) return;

    const user = await getUser();

    if (!user) {
        root.innerHTML = `
            <div class="not-logged-in">
                <h2>You are not logged in</h2>
                <p><a href="/pages/login.html">Login here</a></p>
            </div>
        `;
        return;
    }

    // Try to fetch profile data
    let profileData = null;
    try {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        profileData = data;
    } catch (e) {
        // No profile table or no row — ignore
    }

    root.innerHTML = `
        <div class="profile-container">
            <h1>Your Profile</h1>

            <div class="profile-field">
                <strong>Email:</strong><br>${user.email}
            </div>

            ${profileData ? `
                <div class="profile-field">
                    <strong>Username:</strong><br>${profileData.username || "(none set)"}
                </div>
                <a href="/pages/team.html" style="text-decoration:none; color:inherit;">
                    <div class="team-button">
                        <strong>Team:</strong><br>${profileData.team || "(none set)"}
                    </div>
                </a>
            ` : `
                <div class="profile-field">
                    <strong>No profile data found.</strong><br>
                    Create a 'profiles' table to store user info.
                </div>
            `}
            <!--<a href="/pages/update-profile.html" class="logout-btn" style="margin-top: 10px; margin-bottom: 12px; display:block;">
                Update Profile
            </a> -->
            <button class="logout-btn" id="logoutBtn">Logout</button>
        </div>
    `;

    document.getElementById('logoutBtn').addEventListener('click', logout);
}

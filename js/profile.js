import { supabase } from '/js/supabaseClient.js';
import { getUser, logout } from '/js/auth.js';

const currentEventId = "369a1d4a-283f-41d6-bfc2-f83cee4b7818"; 

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

    let profileData = null;
    let team = null;

    try {
        const { data } = await supabase
            .from('v_profile')
            .select(`
                id,
                name,
                army_name,
                team_name,
                enabled
            `)
            .eq('id', user.id)
            .single();

        profileData = data;

    } catch (e) {
        // ignore
    }

    root.innerHTML = `
        <div class="profile-container">
            <h1>Your Profile</h1>

            <div class="profile-field">
                <strong>Email:</strong><br>${user.email}
            </div>

            ${profileData ? `
                <div class="profile-field">
                    <strong>Name:</strong><br>${profileData.name || "(none set)"}
                </div>

                <div class="profile-field">
                    <strong>Army:</strong><br>${profileData.army_name || "(none set)"}
                </div>

                ${profileData.team_name ? `
                    <a href="/pages/team.html" style="text-decoration:none; color:inherit;">
                        <div class="team-button">
                            <strong>Team:</strong><br>${profileData.team_name}
                        </div>
                    </a>
                ` : `
                    <div class="team-button" style="cursor:default; opacity:0.7;">
                        <strong>Team:</strong><br>(none set)
                    </div>
                `}
            ` : `
                <div class="profile-field">
                    <strong>No profile data found.</strong><br>
                    Create a 'profiles' table to store user info.
                </div>
            `}

            <a href="/pages/update-profile.html" class="btn" style="margin-top: 10px; margin-bottom: 12px; display:block;">
                Update Profile
            </a>
            <button class="btn" id="logoutBtn">Logout</button>
        </div>
    `;

    document.getElementById('logoutBtn').addEventListener('click', logout);
}

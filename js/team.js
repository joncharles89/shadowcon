import { supabase } from '/js/supabaseClient.js';

export async function initTeamPage() {
    const teamMessage = document.getElementById('teamMessage');
    const teamImageWrapper = document.getElementById('teamImageWrapper');

    // 1. Check login state
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        teamMessage.textContent = "You are not currently logged in.";
        teamMessage.style.color = "#c76b6b";
        return;
    }

    // 2. Load profile
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('team')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        teamMessage.textContent = "Could not load your profile.";
        teamMessage.style.color = "#c76b6b";
        return;
    }

    // 3. No team assigned
    if (!profile.team) {
        teamMessage.textContent = "You have not yet been allocated to a team.";
        teamMessage.style.color = "#c7a96b";
        return;
    }

    // 4. Team assigned → show image
    teamMessage.textContent = `You are on Team ${profile.team.toUpperCase()}.`;
    teamMessage.style.color = "#c7a96b";

    const teamImages = {
        Rebel: "/img/teams/alpha.png",
        Emperor: "/img/teams/beta.png",
        Kalla: "/img/teams/gamma.png"
    };

    const imgSrc = teamImages[profile.team];

    if (!imgSrc) {
        teamImageWrapper.innerHTML = `<p style="color:#c76b6b;">Team image not found.</p>`;
        return;
    }

    teamImageWrapper.innerHTML = `
        <img src="${imgSrc}" 
             alt="Team ${profile.team}" 
             style="max-width:300px; border:1px solid rgba(199,169,107,0.3); border-radius:6px;">
    `;
}

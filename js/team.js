import { supabase } from '/js/supabaseClient.js';

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

export async function initTeamPage() {
    const teamMessage = document.getElementById('teamMessage');
    const teamImageWrapper = document.getElementById('teamImageWrapper');
    const teamPageWrapper = document.getElementById('teamPageWrapper');

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

    // 4. Team assigned → apply background + show image
    const team = profile.team.toLowerCase();

    teamPageWrapper.classList.add(`team-${team}`);

    const teamNames = {
        rebels: "Rebel Forces",
        emperor: "Emperor Vaelon",
        kalla: "Kalla's Strike Force"
    };

    teamMessage.innerHTML = `<h1>${toTitleCase(teamNames[team])}</h1>`;
    teamMessage.style.color = "#c7a96b";

    const teamImages = {
        rebels: "/img/teams/alpha.png",
        emperor: "/img/factions/TriadWhite.svg",
        kalla: "/img/teams/gamma.png"
    };

    const imgSrc = teamImages[team];

    if (!imgSrc) {
        teamImageWrapper.innerHTML = `<p style="color:#c76b6b;">Team image not found.</p>`;
        return;
    }

    teamImageWrapper.innerHTML = `
        <img src="${imgSrc}" 
             alt="Team ${team}" 
             style="max-width:300px;">
    `;
}

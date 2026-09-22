import { supabase } from '/js/supabaseClient.js';
import { getUser } from '/js/auth.js';
import { loadPairingsAdmin } from '/js/admin-pairings.js';
import { loadTeamsAdmin } from '/js/admin-teams.js';
import { loadPlayersAdmin } from '/js/admin-players.js';

async function initAdmin() {
    const user = await getUser();

    if (!user) {
        document.getElementById("admin-content").innerHTML = `
            <div class="admin-section">
                <h2>You must be logged in</h2>
            </div>
        `;
        return;
    }

    const { data: admin } = await supabase
        .from("admins")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!admin) {
        document.getElementById("admin-content").innerHTML = `
            <div class="admin-section">
                <h2>Access Denied</h2>
                <p>You are not an admin.</p>
            </div>
        `;
        return;
    }

    setupTabs();
    loadPairingsAdmin();
}

function setupTabs() {
    const tabs = document.querySelectorAll(".admin-tabs button");
    const content = document.getElementById("admin-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const tabName = tab.getAttribute("data-tab");

            if (tabName === "pairings") loadPairingsAdmin();
            if (tabName === "teams") loadTeamsAdmin();
            if (tabName === "players") loadPlayersAdmin();
        });
    });
}

initAdmin();

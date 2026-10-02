import { supabase } from '/js/supabaseClient.js';
import { renderPairingsTable, showCreatePairingModal, autoPair } from '/js/admin-pairings.js';
import { renderTeamsAdmin } from '/js/admin-teams.js';
import { renderPlayersAdmin } from '/js/admin-players.js';
import { renderVotingConfigAdmin } from '/js/admin-voting-config.js';
import { renderVotingAdmin } from '/js/admin-voting.js';



let currentEventId = null;
let currentRoundNumber = 1;

export async function initAdmin() {
    const navItems = document.querySelectorAll('.admin-nav-item');

    const mobileMenu = document.getElementById("adminMobileMenu");
    const mobileItems = mobileMenu ? mobileMenu.querySelectorAll('button') : [];

    console.log("📱 Mobile admin items found:", mobileItems.length);

    const params = new URLSearchParams(window.location.search);
    currentEventId = params.get("event") || null;
    currentRoundNumber = Number(params.get("round")) || 1;

    // Default section
    loadPairingsTab();

    function activate(section) {
        // Clear active states
        navItems.forEach(i => i.classList.remove('active'));
        mobileItems.forEach(i => i.classList.remove('active'));

        // Highlight desktop
        document
            .querySelector(`.admin-nav-item[data-section="${section}"]`)
            ?.classList.add('active');

        // Highlight mobile
        document
            .querySelector(`#adminMobileMenu button[data-section="${section}"]`)
            ?.classList.add('active');

        // Load section
        if (section === "pairings") loadPairingsTab();
        if (section === "teams") loadTeamsTab();
        if (section === "players") loadPlayersTab();
        if (section === "voting-config") loadVotingConfigTab();
        if (section === "voting") loadVotingTab();
        if (section === "league") loadLeagueTab();
    }

    navItems.forEach(btn => {
        btn.addEventListener('click', () => activate(btn.dataset.section));
    });

    mobileItems.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log("📱 Mobile admin click:", btn.dataset.section);
            activate(btn.dataset.section);
            mobileMenu.style.display = "none";
        });
    });

    const toggle = document.getElementById("adminMobileToggle");
    if (toggle) {
        toggle.addEventListener("click", () => {
            const isOpen = mobileMenu.style.display === "flex";
            mobileMenu.style.display = isOpen ? "none" : "flex";
        });
    }
}


async function loadPairingsTab() {
    const content = document.getElementById('admin-content');

    const { data: events } = await supabase
        .from("events")
        .select("id, name")
        .order("name");

    if (!currentEventId && events.length > 0) {
        currentEventId = events[0].id;
    }

    content.innerHTML = `
        <div class="pairings-header">

            <div class="pairings-row">
                <label class="pairings-label">Event:</label>
                <select id="eventSelect" class="admin-select">
                    ${events.map(ev => `
                        <option value="${ev.id}" ${ev.id === currentEventId ? "selected" : ""}>
                            ${ev.name}
                        </option>
                    `).join("")}
                </select>
            </div>

            <div class="round-buttons" style="margin-top:12px">
                ${[1,2,3,4,5].map(r => `
                    <button class="round-btn ${r === currentRoundNumber ? "active" : ""}" data-round="${r}">
                        Round ${r}
                    </button>
                `).join("")}
            </div>

            <div class="pairings-actions" style="margin-top:12px">
                <button id="createPairingBtn" class="admin-btn">Create Pairing</button>
                <button id="autoPairBtn" class="admin-btn">Auto Pair</button>
            </div>
        </div>

        <div id="pairings-table"></div>
    `;

    document.getElementById("eventSelect").addEventListener("change", async (e) => {
        currentEventId = e.target.value;

        const params = new URLSearchParams(window.location.search);
        params.set("event", currentEventId);
        window.history.replaceState({}, "", `${window.location.pathname}?${params}`);

        await renderPairingsTable(currentEventId, currentRoundNumber);
    });

    document.querySelectorAll(".round-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            currentRoundNumber = Number(btn.dataset.round);

            const params = new URLSearchParams(window.location.search);
            params.set("round", currentRoundNumber);
            window.history.replaceState({}, "", `${window.location.pathname}?${params}`);

            loadPairingsTab();
        });
    });

    await renderPairingsTable(currentEventId, currentRoundNumber);

    document.getElementById("createPairingBtn").onclick = () =>
        showCreatePairingModal(currentEventId, currentRoundNumber);

    document.getElementById("autoPairBtn").onclick = () =>
        autoPair(currentEventId, currentRoundNumber);
}

async function loadTeamsTab() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `<h2>Teams</h2><div id="teams-admin"></div>`;
    await renderTeamsAdmin();
}

async function loadPlayersTab() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `<h2>Players</h2><div id="players-admin"></div>`;
    await renderPlayersAdmin();
}

async function loadVotingConfigTab() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `<h2>Voting Configuration</h2><div id="voting-config-admin"></div>`;
    await renderVotingConfigAdmin(currentEventId);
}

async function loadVotingTab() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `<h2>Voting</h2><div id="voting-admin"></div>`;
    await renderVotingAdmin(currentEventId);
}

async function loadLeagueTab() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `<h2>League Tables</h2><div id="league-admin"></div>`;
    await renderLeagueAdmin(currentEventId);
}

document.addEventListener("DOMContentLoaded", () => {
    initAdmin();
});
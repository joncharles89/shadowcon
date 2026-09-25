import { supabase } from '/js/supabaseClient.js';
import { renderPairingsTable, showCreatePairingModal, autoPair } from '/js/admin-pairings.js';
import { renderTeamsAdmin } from '/js/admin-teams.js';
import { renderPlayersAdmin } from '/js/admin-players.js';

let currentEventId = null;
let currentRoundNumber = 1;

export async function initAdmin() {
    const tabs = document.querySelectorAll('.admin-tabs button');

    const params = new URLSearchParams(window.location.search);
    currentEventId = params.get("event") || null;
    currentRoundNumber = Number(params.get("round")) || 1;

    loadPairingsTab();

    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;

            if (tab === "pairings") loadPairingsTab();
            if (tab === "teams") loadTeamsTab();
            if (tab === "players") loadPlayersTab();
        });
    });
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

            <div class="round-buttons">
                ${[1,2,3,4,5].map(r => `
                    <button class="round-btn ${r === currentRoundNumber ? "active" : ""}" data-round="${r}">
                        Round ${r}
                    </button>
                `).join("")}
            </div>

            <div class="pairings-actions">
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

initAdmin();

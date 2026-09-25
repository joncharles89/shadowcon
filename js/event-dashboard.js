import { supabase } from '/js/supabaseClient.js';

const TEAM_ICONS = {
    "Emperor": "/img/factions/TriadWhite.svg",
    "Rebels": "/img/factions/Rebels.svg",
    "Kalla": "/img/factions/Kalla.svg"
};

function getTeamIcon(teamName) {
    return TEAM_ICONS[teamName] || null;
}

function getEventFromURL() {
    const params = new URLSearchParams(window.location.search);
    const eventid = params.get("event");
    return eventid ? eventid : "369a1d4a-283f-41d6-bfc2-f83cee4b7818";
}

function getRoundFromURL() {
    const params = new URLSearchParams(window.location.search);
    const round = Number(params.get("round"));
    return isNaN(round) ? 1 : round;
}

/* ---------------------------------------------
   Fetch round end time from Supabase
--------------------------------------------- */
async function fetchRoundEnd(eventId, roundNumber) {
    const { data, error } = await supabase
        .from("event_rounds")
        .select("round_end")
        .eq("event_id", eventId)
        .eq("round", roundNumber)
        .single();

    if (error) {
        console.error("Error fetching round end:", error);
        return null;
    }

    return data?.round_end || null;
}

/* ---------------------------------------------
   Countdown Timer
--------------------------------------------- */
function startCountdown(roundEndISO) {
    const timerEl = document.getElementById("timer");
    if (!timerEl || !roundEndISO) return;

    const endTime = new Date(roundEndISO).getTime();

    function tick() {
        const now = Date.now();
        const diff = endTime - now;

        if (diff <= 0) {
            timerEl.textContent = "00:00";
            return;
        }

        const totalSeconds = Math.floor(diff / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");

        timerEl.textContent = `${hours}:${minutes}`;

        setTimeout(tick, 1000);
    }

    tick();
}

/* ---------------------------------------------
   Fetch pairings
--------------------------------------------- */
async function fetchPairings(eventId, roundNumber) {
    const { data, error } = await supabase
        .from("v_event_pairings_with_players")
        .select("*")
        .eq("event_id", eventId)
        .eq("round_number", roundNumber)
        .order("table_number", { ascending: true });

    if (error) {
        console.error("Error fetching pairings:", error);
        return [];
    }

    return data;
}

/* ---------------------------------------------
   Render tables
--------------------------------------------- */
async function renderTables(eventId, roundNumber) {
    const container = document.getElementById("tables-container");
    container.innerHTML = "";

    const pairings = await fetchPairings(eventId, roundNumber);

    pairings.forEach(p => {
        const div = document.createElement("div");
        div.className = "table-entry";

        const icon1 = getTeamIcon(p.player1_team);
        const icon2 = getTeamIcon(p.player2_team);

        div.innerHTML = `
            <div class="table-entry-title">${p.table_number} - ${p.table_name}</div>

            <div class="table-entry-players">
                ${icon1 ? `<img class="team-icon-small" src="${icon1}" alt="${p.player1_team}">` : ""}
                ${p.player1_name}
                <span class="vs-text">vs</span>
                ${p.player2_name}
                ${icon2 ? `<img class="team-icon-small" src="${icon2}" alt="${p.player2_team}">` : ""}
            </div>
        `;

        container.appendChild(div);
    });
}


/* ---------------------------------------------
   Round Picker (left side)
--------------------------------------------- */
async function renderRoundPicker(eventId, activeRound) {
    const picker = document.createElement("div");
    picker.id = "round-picker";
    picker.className = "round-picker";

    const { data, error } = await supabase
        .from("event_rounds")
        .select("round")
        .eq("event_id", eventId)
        .order("round", { ascending: true });

    if (error) {
        console.error("Error fetching rounds:", error);
        return;
    }

    data.forEach(r => {
        const btn = document.createElement("button");
        btn.className = "round-picker-btn";
        if (r.round === activeRound) btn.classList.add("active");

        btn.textContent = r.round;

        btn.onclick = () => {
            const url = new URL(window.location.href);
            url.searchParams.set("round", r.round);
            window.location.href = url.toString();
        };

        picker.appendChild(btn);
    });

    document.body.appendChild(picker);
}


/* ---------------------------------------------
   Init
--------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
    const eventId = getEventFromURL();
    const roundNumber = getRoundFromURL();

    // Round title
    document.getElementById("round-title").textContent = `Round ${roundNumber}`;

    // Round picker
    await renderRoundPicker(eventId, roundNumber);

    // Round end time
    const roundEndISO = await fetchRoundEnd(eventId, roundNumber);

    // Render tables
    await renderTables(eventId, roundNumber);

    // Start countdown
    startCountdown(roundEndISO);
});

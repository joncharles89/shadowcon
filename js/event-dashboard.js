import { supabase } from '/js/supabaseClient.js';

// Set the round end time (ISO string or from Supabase)
const ROUND_END_ISO = "2026-09-24T20:30:00"; // example

function getEventFromURL() {
    const params = new URLSearchParams(window.location.search);
    const eventid = params.get("event");
    return eventid ? eventid : "369a1d4a-283f-41d6-bfc2-f83cee4b7818";
}

function getRoundFromURL() {
    const params = new URLSearchParams(window.location.search);
    const round = Number(params.get("round"));
    return isNaN(round) ? 1 : round; // default to round 1
}

function startCountdown() {
    const timerEl = document.getElementById("timer");
    if (!timerEl) return;

    const endTime = new Date(ROUND_END_ISO).getTime();

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

async function fetchPairings(eventId, roundNumber) {
    const { data, error } = await supabase
        .from("event_pairings_with_players")
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

async function renderTables(eventId, roundNumber) {
    const left = document.getElementById("tables-left");
    const right = document.getElementById("tables-right");

    left.innerHTML = "";
    right.innerHTML = "";

    const pairings = await fetchPairings(eventId, roundNumber);

    pairings.forEach((p, idx) => {
        const col = idx < 8 ? left : right;

        const div = document.createElement("div");
        div.className = "table-entry";

        div.innerHTML = `
            <div class="table-entry-title">Table ${p.table_number}</div>
            <div class="table-entry-players">
                ${p.player1_name} vs ${p.player2_name}
            </div>
        `;

        col.appendChild(div);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const eventId = getEventFromURL();
    const roundNumber = getRoundFromURL();

    document.getElementById("round-title").textContent = `Round ${roundNumber}`;

    renderTables(eventId, roundNumber);

    startCountdown();
});

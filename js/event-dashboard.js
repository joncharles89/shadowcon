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

        if (p.locked) {
            div.classList.add("complete");
        }

        const icon1 = getTeamIcon(p.player1_team);
        const icon2 = getTeamIcon(p.player2_team);

        const swing1 = p.p1_scoreswing > 0 ? ` <span class="score-swing">+${p.p1_scoreswing.toFixed(0)}</span>` : "";
        const swing2 = p.p2_scoreswing > 0 ? ` <span class="score-swing">+${p.p2_scoreswing.toFixed(0)}</span>` : "";

        div.innerHTML = `
            <div class="table-entry-title">${p.table_number} - ${p.table_name}</div>

            <div class="table-entry-players">
                ${icon1 ? `<img class="team-icon-small" src="${icon1}" alt="${p.player1_team}">` : ""}
                ${p.player1_name}${swing1}
                <span class="vs-text">vs</span>
                ${p.player2_name}
                ${icon2 ? `<img class="team-icon-small" src="${icon2}" alt="${p.player2_team}">` : ""}${swing2}
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

async function renderSwingScoreboard(eventId, roundNumber) {
    const scoreboard = document.getElementById("swing-scoreboard");
    scoreboard.innerHTML = "";

    const { data, error } = await supabase
        .from("v_regionswing")
        .select("*")
        .eq("event_id", eventId)
        .lte("round_number", roundNumber)
        .order("region", { ascending: true });

    if (error) {
        console.error("Error fetching region swing:", error);
        return;
    }

    // Combine rounds into cumulative totals
    const regionTotals = {};
    let totalRebels = 0;
    let totalEmperors = 0;

    data.forEach(row => {
        if (!regionTotals[row.region]) {
            regionTotals[row.region] = { rebels: 0, emperors: 0 };
        }

        regionTotals[row.region].rebels += row.totalrebelscore || 0;
        regionTotals[row.region].emperors += row.totalemperorscore || 0;

        totalRebels += row.totalrebelscore || 0;
        totalEmperors += row.totalemperorscore || 0;
    });

    // Convert totals into cumulative swing
    const regions = Object.keys(regionTotals).map(region => {
        const rebels = regionTotals[region].rebels;
        const emperors = regionTotals[region].emperors;

        const swing = rebels - emperors; // corrected logic

        return { region, swing };
    });

    // Render each region
    regions.forEach(region => {
        const swing = region.swing || 0;
        const cappedSwing = Math.max(-10, Math.min(10, swing));
        const percent = ((cappedSwing + 10) / 20) * 100;

        const regionDiv = document.createElement("div");
        regionDiv.className = "swing-region";

        regionDiv.innerHTML = `
            <div class="swing-region-name">${region.region}</div>

            <div class="swing-bar-wrapper">
                <div class="swing-label">
                    Emperor
                    <img src="/img/factions/TriadWhite.svg" class="swing-faction-icon">
                </div>

                <div class="swing-bar">
                    <div class="swing-marker" style="left: ${percent}%"></div>
                </div>

                <div class="swing-label">
                    Rebels
                    <img src="/img/factions/Rebels.svg" class="swing-faction-icon">
                </div>
            </div>
        `;

        scoreboard.appendChild(regionDiv);
    });

    // TOTAL SWING SUMMARY
    const totalSwing = totalRebels - totalEmperors;
    const cappedTotal = Math.max(-10, Math.min(10, totalSwing));
    const totalPercent = ((cappedTotal + 10) / 20) * 100;

    const totalDiv = document.createElement("div");
    totalDiv.className = "swing-total";

    totalDiv.innerHTML = `
        <div class="swing-total-label">Total Swing</div>

        <div class="swing-total-bar-wrapper">
            <div class="swing-label">
                Emperor
                <img src="/img/factions/TriadWhite.svg" class="swing-faction-icon">
            </div>

            <div class="swing-total-bar">
                <div class="swing-total-marker" style="left: ${totalPercent}%"></div>
            </div>

            <div class="swing-label">
                Rebels
                <img src="/img/factions/Rebels.svg" class="swing-faction-icon">
            </div>
        </div>
    `;

    scoreboard.appendChild(totalDiv);
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

    // Render regional swing
    await renderSwingScoreboard(eventId, roundNumber);

    // Start countdown
    startCountdown(roundEndISO);
});


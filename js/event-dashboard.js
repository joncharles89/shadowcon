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

function teamPriority(team) {
    if (team === "Emperor") return 1;
    if (team === "Kalla") return 2;
    if (team === "Rebels") return 3;
    return 99;
}

function normalizeTeams(p) {
    const players = [
        {
            id: p.player1_id,
            name: p.player1_name,
            team: p.player1_team,
            swing: p.p1_scoreswing
        },
        {
            id: p.player2_id,
            name: p.player2_name,
            team: p.player2_team,
            swing: p.p2_scoreswing
        }
    ];

    players.sort((a, b) => teamPriority(a.team) - teamPriority(b.team));

    p.player1_id = players[0].id;
    p.player1_name = players[0].name;
    p.player1_team = players[0].team;
    p.p1_scoreswing = players[0].swing;

    p.player2_id = players[1].id;
    p.player2_name = players[1].name;
    p.player2_team = players[1].team;
    p.p2_scoreswing = players[1].swing;
}

function regionToClass(regionName) {
    return regionName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
}

/* ---------------------------------------------
   Fetch round end time
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
        normalizeTeams(p);

        const entry = document.createElement("div");
        entry.className = "table-entry";

        const regionClass = regionToClass(p.region);
        entry.classList.add(regionClass);

        if (p.locked) {
            entry.classList.add("complete");
        }

        const swing1 = p.p1_scoreswing > 0 ? ` <span class="score-swing">+${p.p1_scoreswing.toFixed(0)}</span>` : "";
        const swing2 = p.p2_scoreswing > 0 ? ` <span class="score-swing">+${p.p2_scoreswing.toFixed(0)}</span>` : "";

        entry.innerHTML = `
            <span class="table-entry-title">${p.table_number} - ${p.table_name}</span>
            <span class="table-col swing">${swing1 || ""}</span>
            <img class="team-icon-small" src="${getTeamIcon(p.player1_team)}">
            <span class="table-col player2">${p.player1_name}</span>
            <span class="vs-text">vs</span>
            <span class="table-col player2">${p.player2_name}</span>
            <img class="team-icon-small" src="${getTeamIcon(p.player2_team)}">
            <span class="table-col swing">${swing2 || ""}</span>
        `;

        container.appendChild(entry);
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

    // Round buttons
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

    /* ---------------------------------------------
       Sidebar Tabs
    --------------------------------------------- */
    const tabsWrapper = document.createElement("div");
    tabsWrapper.className = "sidebar-tabs";

    const tabNames = [
        { id: "pairings", label: "P" },
        { id: "battleplan", label: "B" },
        { id: "map", label: "M" }
    ];

    tabNames.forEach((t, index) => {
        const tabBtn = document.createElement("button");
        tabBtn.className = "sidebar-tab-btn";
        tabBtn.dataset.tab = t.id;
        tabBtn.textContent = t.label;

        if (index === 0) tabBtn.classList.add("active");

        tabsWrapper.appendChild(tabBtn);
    });

    picker.appendChild(tabsWrapper);

    document.body.appendChild(picker);
}

/* ---------------------------------------------
   Swing Scoreboard
--------------------------------------------- */
async function renderSwingScoreboard(eventId, roundNumber) {
    const scoreboard = document.getElementById("swing-scoreboard");
    scoreboard.innerHTML = "";

    const regionGrid = document.createElement("div");
    regionGrid.className = "swing-region-grid";
    scoreboard.appendChild(regionGrid);

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

    const regions = Object.keys(regionTotals).map(region => {
        const rebels = regionTotals[region].rebels;
        const emperors = regionTotals[region].emperors;
        const swing = rebels - emperors;

        return { region, swing };
    });

    regions.forEach(region => {
        const swing = region.swing || 0;
        const swingcap = 7;
        const cappedSwing = Math.max(-swingcap, Math.min(swingcap, swing));
        const percent = ((cappedSwing + swingcap) / (swingcap * 2)) * 100;

        const regionDiv = document.createElement("div");
        regionDiv.className = "swing-region";
        regionDiv.classList.add(regionToClass(region.region));

        regionDiv.innerHTML = `
            <div class="swing-region-name">${region.region}</div>

            <div class="swing-bar-wrapper">
                <div class="swing-label">
                    Emperor
                    <img src="/img/factions/TriadWhite.svg" class="swing-faction-icon">
                </div>

                <div class="swing-bar">
                    <div class="swing-centre-line"></div>
                    <div class="swing-marker" style="left: ${percent}%"></div>
                </div>

                <div class="swing-label">
                    Rebels
                    <img src="/img/factions/Rebels.svg" class="swing-faction-icon">
                </div>
            </div>
        `;

        regionGrid.appendChild(regionDiv);
    });

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
                <div class="swing-centre-line"></div>
                <div class="swing-total-marker" style="left: ${totalPercent}%"></div>
            </div>

            <div class="swing-label">
                Rebels
                <img src="/img/factions/Rebels.svg" class="swing-faction-icon">
            </div>
        </div>
    `;

    regionGrid.appendChild(totalDiv);
}

/* ---------------------------------------------
   Sidebar Tab Logic
--------------------------------------------- */
function initTabs() {
    const tabs = document.querySelectorAll('.sidebar-tab-btn');

    const views = {
        pairings: document.getElementById('view-pairings'),
        battleplan: document.getElementById('view-battleplan'),
        map: document.getElementById('view-map')
    };

    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;

            Object.keys(views).forEach(key => {
                views[key].style.display = (key === tab) ? 'block' : 'none';
            });

            if (tab === 'battleplan') {
                loadBattleplan();
            }
        });
    });
}

/* ---------------------------------------------
   Load Battleplan HTML
--------------------------------------------- */
async function loadBattleplan() {
    const urlParams = new URLSearchParams(window.location.search);
    const round = urlParams.get('round') || 1;

    try {
        const html = await fetch(`/battleplans/round-${round}.html`).then(r => r.text());
        document.getElementById('battleplan-container').innerHTML = html;
    } catch (err) {
        document.getElementById('battleplan-container').innerHTML =
            `<p style="color:#c76b6b;">Battleplan not found for round ${round}</p>`;
    }
}

/* ---------------------------------------------
   Init
--------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
    const eventId = getEventFromURL();
    const roundNumber = getRoundFromURL();

    document.getElementById("round-title").textContent = `Round ${roundNumber}`;

    await renderRoundPicker(eventId, roundNumber);

    initTabs();

    const roundEndISO = await fetchRoundEnd(eventId, roundNumber);

    await renderTables(eventId, roundNumber);
    await renderSwingScoreboard(eventId, roundNumber);

    startCountdown(roundEndISO);
});

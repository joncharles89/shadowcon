import { supabase } from '/js/supabaseClient.js';
import { openModal, closeModal } from '/js/admin-modal.js'; // You already have these helpers

//------------------------------------------------------------
// MAIN ENTRY POINT
//------------------------------------------------------------
export async function loadPairingsAdmin() {
    const root = document.getElementById("admin-content");

    // Load events
    const { data: events } = await supabase
        .from("events")
        .select("id, name")
        .order("name");

    if (!events || events.length === 0) {
        root.innerHTML = `<p>No events found.</p>`;
        return;
    }

    const defaultEventId = events[0].id;

    root.innerHTML = `
        <div class="admin-section">
            <h2>Pairings</h2>

            <label>Event</label>
            <select id="admin-event-select">
                ${events.map(e => `
                    <option value="${e.id}">${e.name}</option>
                `).join("")}
            </select>

            <div class="admin-round-filters">
                ${[1,2,3,4,5].map(r => `
                    <button class="admin-btn admin-round-btn" data-round="${r}">
                        Round ${r}
                    </button>
                `).join("")}
            </div>

            <div id="admin-pairings-table"></div>
        </div>
    `;

    const eventSelect = document.getElementById("admin-event-select");
    const roundButtons = document.querySelectorAll(".admin-round-btn");

    let currentEventId = defaultEventId;
    let currentRound = 1;

    eventSelect.value = defaultEventId;

    eventSelect.addEventListener("change", () => {
        currentEventId = eventSelect.value;
        renderPairingsTable(currentEventId, currentRound);
    });

    roundButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            currentRound = Number(btn.dataset.round);
            roundButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            renderPairingsTable(currentEventId, currentRound);
        });
    });

    roundButtons[0].classList.add("active");
    renderPairingsTable(currentEventId, currentRound);
}

//------------------------------------------------------------
// RENDER PAIRINGS TABLE
//------------------------------------------------------------
async function renderPairingsTable(eventId, roundNumber) {
    const container = document.getElementById("admin-pairings-table");

    const { data: pairings } = await supabase
        .from("event_pairings")
        .select(`
            id,
            round_number,
            table_name,
            table_number,
            player1_id,
            player2_id,
            player1_score,
            player2_score,
            locked,
            player1:profiles!event_pairings_player1_id_fkey(name, team_id),
            player2:profiles!event_pairings_player2_id_fkey(name, team_id)
        `)
        .eq("event_id", eventId)
        .eq("round_number", roundNumber)
        .order("table_number");

    container.innerHTML = `
        <button class="admin-btn" id="createPairingBtn">Create Pairing</button>
        <button class="admin-btn" id="autoPairBtn">Auto Pair</button>

        <table class="admin-table">
            <tr>
                <th>Table</th>
                <th>Player 1</th>
                <th>Player 2</th>
                <th>Scores</th>
                <th>Actions</th>
            </tr>
            ${pairings.map(p => `
                <tr>
                    <td>${p.table_name} ${p.table_number}</td>
                    <td>${p.player1?.name || "?"}</td>
                    <td>${p.player2?.name || "?"}</td>
                    <td>${p.player1_score ?? "-"} / ${p.player2_score ?? "-"}</td>
                    <td>
                        <button class="admin-btn" data-edit="${p.id}">Edit</button>
                        <button class="admin-btn" data-delete="${p.id}">Delete</button>
                    </td>
                </tr>
            `).join("")}
        </table>
    `;

    document.getElementById("createPairingBtn").onclick = () =>
        showCreatePairingModal(eventId, roundNumber);

    document.getElementById("autoPairBtn").onclick = () =>
        autoPairRound(eventId, roundNumber);

    document.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => editPairing(btn.dataset.edit));
    });

    document.querySelectorAll("[data-delete]").forEach(btn => {
        btn.addEventListener("click", async () => {
            await supabase.from("event_pairings").delete().eq("id", btn.dataset.delete);
            renderPairingsTable(eventId, roundNumber);
        });
    });
}

//------------------------------------------------------------
// CREATE PAIRING MODAL
//------------------------------------------------------------
async function showCreatePairingModal(eventId, roundNumber) {
    const { data: players } = await supabase
        .from("profiles")
        .select("id, name, team_id");

    const { data: existingPairings } = await supabase
        .from("event_pairings")
        .select("player1_id, player2_id")
        .eq("event_id", eventId)
        .eq("round_number", roundNumber);

    const pairedIds = new Set();
    existingPairings?.forEach(p => {
        if (p.player1_id) pairedIds.add(p.player1_id);
        if (p.player2_id) pairedIds.add(p.player2_id);
    });

    const availablePlayers = players.filter(p => !pairedIds.has(p.id));

    const playerOptions = availablePlayers
        .map(p => `<option value="${p.id}" data-team="${p.team_id ?? ""}">${p.name}</option>`)
        .join("");

    const { data: tables } = await supabase
        .from("tables")
        .select("id, name, number")
        .eq("event_id", eventId)
        .order("number");

    const tableOptions = tables
        .map(t => `<option value="${t.id}">${t.name} (${t.number})</option>`)
        .join("");

    openModal(`
        <h3>Create Pairing (Round ${roundNumber})</h3>

        <label>Table</label>
        <select id="pairing-table">${tableOptions}</select>

        <label>Player 1</label>
        <select id="pairing-player1">
            <option value="">Select player</option>
            ${playerOptions}
        </select>

        <label>Player 2</label>
        <select id="pairing-player2">
            <option value="">Select player</option>
            ${playerOptions}
        </select>

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="cancelModal">Cancel</button>
            <button class="admin-modal-btn" id="savePairing">Create</button>
        </div>
    `);

    const p1Select = document.getElementById("pairing-player1");
    const p2Select = document.getElementById("pairing-player2");

    p1Select.addEventListener("change", () => {
        const selectedId = p1Select.value;
        const selectedTeam = p1Select.selectedOptions[0]?.dataset.team || "";

        [...p2Select.options].forEach(opt => {
            if (!opt.value) return;
            const team = opt.dataset.team || "";
            const isSamePlayer = opt.value === selectedId;
            const isSameTeam = selectedTeam && team && selectedTeam === team;
            opt.disabled = isSamePlayer || isSameTeam;
        });
    });

    document.getElementById("cancelModal").onclick = closeModal;

    document.getElementById("savePairing").onclick = async () => {
        const tableId = document.getElementById("pairing-table").value;
        const player1Id = p1Select.value;
        const player2Id = p2Select.value;

        if (!tableId || !player1Id || !player2Id) return;

        const table = tables.find(t => t.id === tableId);

        await supabase.from("event_pairings").insert({
            event_id: eventId,
            round_number: roundNumber,
            table_name: table.name,
            table_number: table.number,
            player1_id: player1Id,
            player2_id: player2Id
        });

        closeModal();
        renderPairingsTable(eventId, roundNumber);
    };
}

//------------------------------------------------------------
// EDIT PAIRING MODAL
//------------------------------------------------------------
async function editPairing(id) {
    const { data: pairing } = await supabase
        .from("event_pairings")
        .select("*")
        .eq("id", id)
        .single();

    const { data: players } = await supabase
        .from("profiles")
        .select("id, name");

    const playerOptions1 = players
        .map(p => `<option value="${p.id}" ${p.id === pairing.player1_id ? "selected" : ""}>${p.name}</option>`)
        .join("");

    const playerOptions2 = players
        .map(p => `<option value="${p.id}" ${p.id === pairing.player2_id ? "selected" : ""}>${p.name}</option>`)
        .join("");

    openModal(`
        <h3>Edit Pairing</h3>

        <label>Round Number</label>
        <input id="edit-round" type="number" value="${pairing.round_number}">

        <label>Table Name</label>
        <input id="edit-table-name" type="text" value="${pairing.table_name}">

        <label>Table Number</label>
        <input id="edit-table-number" type="number" value="${pairing.table_number}">

        <label>Player 1</label>
        <select id="edit-player1">${playerOptions1}</select>

        <label>Player 2</label>
        <select id="edit-player2">${playerOptions2}</select>

        <label>Player 1 Score</label>
        <input id="edit-score1" type="number" value="${pairing.player1_score ?? ""}">

        <label>Player 2 Score</label>
        <input id="edit-score2" type="number" value="${pairing.player2_score ?? ""}">

        <label>Locked</label>
        <select id="edit-locked">
            <option value="false" ${!pairing.locked ? "selected" : ""}>Unlocked</option>
            <option value="true" ${pairing.locked ? "selected" : ""}>Locked</option>
        </select>

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="cancelModal">Cancel</button>
            <button class="admin-modal-btn" id="saveEditPairing">Save</button>
        </div>
    `);

    document.getElementById("cancelModal").onclick = closeModal;

    document.getElementById("saveEditPairing").onclick = async () => {
        await supabase.from("event_pairings").update({
            round_number: Number(document.getElementById("edit-round").value),
            table_name: document.getElementById("edit-table-name").value,
            table_number: Number(document.getElementById("edit-table-number").value),
            player1_id: document.getElementById("edit-player1").value,
            player2_id: document.getElementById("edit-player2").value,
            player1_score: Number(document.getElementById("edit-score1").value),
            player2_score: Number(document.getElementById("edit-score2").value),
            locked: document.getElementById("edit-locked").value === "true"
        }).eq("id", id);

        closeModal();
        renderPairingsTable(pairing.event_id, pairing.round_number);
    };
}

//------------------------------------------------------------
// AUTO PAIRING
//------------------------------------------------------------
async function autoPairRound(eventId, roundNumber) {
    const { data: players } = await supabase
        .from("profiles")
        .select("id, name, team_id");

    const { data: allPairings } = await supabase
        .from("event_pairings")
        .select("*")
        .eq("event_id", eventId);

    const { data: tables } = await supabase
        .from("tables")
        .select("*")
        .eq("event_id", eventId)
        .order("number");

    const pairedThisRound = new Set();
    allPairings
        .filter(p => p.round_number === roundNumber)
        .forEach(p => {
            if (p.player1_id) pairedThisRound.add(p.player1_id);
            if (p.player2_id) pairedThisRound.add(p.player2_id);
        });

    const opponentHistory = new Map();
    const tableHistory = new Map();

    players.forEach(p => {
        opponentHistory.set(p.id, new Set());
        tableHistory.set(p.id, new Set());
    });

    allPairings.forEach(p => {
        if (p.player1_id && p.player2_id) {
            opponentHistory.get(p.player1_id).add(p.player2_id);
            opponentHistory.get(p.player2_id).add(p.player1_id);
        }
        if (p.table_number != null) {
            tableHistory.get(p.player1_id).add(p.table_number);
            tableHistory.get(p.player2_id).add(p.table_number);
        }
    });

    let pool = players.filter(p => !pairedThisRound.has(p.id));
    pool = pool.sort(() => Math.random() - 0.5);

    const usedTables = new Set(
        allPairings
            .filter(p => p.round_number === roundNumber && p.table_number != null)
            .map(p => p.table_number)
    );

    const availableTables = tables.filter(t => !usedTables.has(t.number));

    const newPairings = [];

    while (pool.length >= 2 && availableTables.length > 0) {
        const p1 = pool.shift();

        const opps = opponentHistory.get(p1.id);
        const tablesUsed = tableHistory.get(p1.id);

        const candidate = pool.find(p2 => {
            if (p2.team_id && p1.team_id && p2.team_id === p1.team_id) return false;
            if (opps.has(p2.id)) return false;
            return true;
        });

        if (!candidate) continue;

        const table = availableTables.find(t => !tablesUsed.has(t.number));
        if (!table) break;

        newPairings.push({
            event_id: eventId,
            round_number: roundNumber,
            table_name: table.name,
            table_number: table.number,
            player1_id: p1.id,
            player2_id: candidate.id
        });

        opponentHistory.get(p1.id).add(candidate.id);
        opponentHistory.get(candidate.id).add(p1.id);
        tableHistory.get(p1.id).add(table.number);
        tableHistory.get(candidate.id).add(table.number);

        pool = pool.filter(p => p.id !== candidate.id);
        availableTables.splice(availableTables.indexOf(table), 1);
    }

    if (newPairings.length === 0) {
        alert("No valid auto-pairings could be created.");
        return;
    }

    await supabase.from("event_pairings").insert(newPairings);
    renderPairingsTable(eventId, roundNumber);
}

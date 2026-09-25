import { supabase } from '/js/supabaseClient.js';
import { openModal, closeModal } from '/js/admin-modal.js';
import { buildHistory, validatePairing, getValidOpponents } from '/js/pairing-rules.js';

const TEAM_ICONS = {
    "Emperor": "/img/factions/TriadWhite.svg",
    "Rebels": "/img/factions/Rebels.svg",
    "Kalla": "/img/factions/Kalla.svg"
};

function getTeamIcon(teamName) {
    return TEAM_ICONS[teamName] || "/img/SwordIcon.svg";
}

/* ============================================================
   Render Pairings Table
   ============================================================ */
export async function renderPairingsTable(eventId, roundNumber) {
    const container = document.getElementById("pairings-table");

    const { data: pairings, error } = await supabase
        .from("event_pairings_with_players")
        .select("*")
        .eq("event_id", eventId)
        .eq("round_number", roundNumber)
        .order("table_number");

    if (error) {
        console.error("Pairings fetch error:", error);
        container.innerHTML = `<p class="error">Failed to load pairings.</p>`;
        return;
    }

    container.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Table</th>
                    <th>Player 1</th>
                    <th>Player 2</th>
                    <th>Scores</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${pairings.map(p => `
                    <tr>
                        <td>${p.table_name} ${p.table_number}</td>

                        <td>
                            <img class="team-icon-small" src="${getTeamIcon(p.player1_team)}">
                            ${p.player1_name || "?"}
                        </td>

                        <td>
                            <img class="team-icon-small" src="${getTeamIcon(p.player2_team)}">
                            ${p.player2_name || "?"}
                        </td>

                        <td>${p.player1_score ?? 0} / ${p.player2_score ?? 0}</td>

                        <td>
                            <button class="admin-btn" data-edit="${p.id}">Edit</button>
                            <button class="admin-btn" data-delete="${p.id}">Delete</button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    container.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => {
            showEditPairingModal(btn.dataset.edit, eventId, roundNumber);
        });
    });

    container.querySelectorAll("[data-delete]").forEach(btn => {
        btn.addEventListener("click", async () => {
            await supabase.from("event_pairings").delete().eq("id", btn.dataset.delete);
            renderPairingsTable(eventId, roundNumber);
        });
    });

    // Fetch all enabled players WITH team name
    const { data: allPlayers } = await supabase
        .from("profiles")
        .select(`
            id,
            name,
            team_id,
            teams (
                name
            )
        `)
        .eq("enabled", true);

    // Determine which players are already paired this round
    const pairedIds = new Set();
    pairings.forEach(p => {
        if (p.player1_id) pairedIds.add(p.player1_id);
        if (p.player2_id) pairedIds.add(p.player2_id);
    });

    // Filter unpaired players
    const unpaired = allPlayers.filter(p => !pairedIds.has(p.id));

    // Render unpaired list
    const unpairedHtml = unpaired.length === 0
        ? `<p class="no-unpaired">All players are paired this round.</p>`
        : `
            <h3 class="unpaired-title">Unpaired Players</h3>
            <ul class="unpaired-list">
                ${unpaired.map(p => {
                    const teamName = p.teams?.name || null;
                    return `
                        <li>
                            <img class="team-icon-small" src="${getTeamIcon(teamName)}">
                            ${p.name}
                        </li>
                    `;
                }).join("")}
            </ul>
        `;

    container.insertAdjacentHTML("beforeend", unpairedHtml);

}

/* ============================================================
   Create Pairing Modal
   ============================================================ */
export async function showCreatePairingModal(eventId, roundNumber) {
    const { data: players } = await supabase
        .from("profiles")
        .select("id, name, team_id")
        .eq("enabled", true)
        .order("name");

    const { data: tables } = await supabase
        .from("tables")
        .select("id, name, number")
        .eq("event_id", eventId)
        .order("number");

    const { data: allPairings } = await supabase
        .from("event_pairings")
        .select("player1_id, player2_id, table_number, round_number")
        .eq("event_id", eventId);

    const { opponentHistory, tableHistory } = buildHistory(allPairings, roundNumber);

    openModal(`
        <h3>Create Pairing</h3>

        <label>Table</label>
        <select id="create-table">
            ${tables.map(t => `<option value="${t.id}">${t.name} (${t.number})</option>`).join("")}
        </select>

        <label>Player 1</label>
        <select id="create-player1">
            ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join("")}
        </select>

        <label>Player 2</label>
        <select id="create-player2"></select>

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="cancelModal">Cancel</button>
            <button class="admin-modal-btn" id="saveCreatePairing">Create</button>
        </div>
    `);

    const tableSelect = document.getElementById("create-table");
    const p1Select = document.getElementById("create-player1");
    const p2Select = document.getElementById("create-player2");

    function refreshCreateDropdowns() {
        const tableId = tableSelect.value;
        const table = tables.find(t => t.id === tableId);
        const tableNumber = table.number;

        const p1 = players.find(p => p.id === p1Select.value);

        const validOpponents = getValidOpponents(p1, players, tableNumber, opponentHistory, tableHistory);

        p2Select.innerHTML = validOpponents
            .map(p => `<option value="${p.id}">${p.name}</option>`)
            .join("");
    }

    p1Select.addEventListener("change", refreshCreateDropdowns);
    tableSelect.addEventListener("change", refreshCreateDropdowns);

    refreshCreateDropdowns();

    document.getElementById("cancelModal").onclick = closeModal;

    document.getElementById("saveCreatePairing").onclick = async () => {
        const tableId = tableSelect.value;
        const table = tables.find(t => t.id === tableId);

        const player1 = players.find(p => p.id === p1Select.value);
        const player2 = players.find(p => p.id === p2Select.value);

        const error = validatePairing(player1, player2, table.number, opponentHistory, tableHistory);
        if (error) {
            alert(error);
            return;
        }

        await supabase.from("event_pairings").insert({
            event_id: eventId,
            round_number: roundNumber,
            table_name: table.name,
            table_number: table.number,
            player1_id: player1.id,
            player2_id: player2.id
        });

        closeModal();
        renderPairingsTable(eventId, roundNumber);
    };
}

/* ============================================================
   Edit Pairing Modal
   ============================================================ */
export async function showEditPairingModal(pairingId, eventId, roundNumber) {
    const { data: pairing } = await supabase
        .from("event_pairings_with_players")
        .select("*")
        .eq("id", pairingId)
        .single();

    const { data: players } = await supabase
        .from("profiles")
        .select("id, name, team_id")
        .eq("enabled", true)
        .order("name");

    const { data: tables } = await supabase
        .from("tables")
        .select("id, name, number")
        .eq("event_id", eventId)
        .order("number");

    const { data: allPairings } = await supabase
        .from("event_pairings")
        .select("player1_id, player2_id, table_number, round_number")
        .eq("event_id", eventId);

    const { opponentHistory, tableHistory } = buildHistory(allPairings, roundNumber);

    openModal(`
        <h3>Edit Pairing</h3>

        <label>Table</label>
        <select id="edit-table">
            ${tables.map(t => `<option value="${t.id}">${t.name} (${t.number})</option>`).join("")}
        </select>

        <label>Player 1</label>
        <select id="edit-player1">
            ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join("")}
        </select>

        <label>Player 2</label>
        <select id="edit-player2"></select>

        <label>Player 1 Score</label>
        <input id="edit-score1" type="number" min="0" value="${pairing.player1_score ?? 0}">

        <label>Player 2 Score</label>
        <input id="edit-score2" type="number" min="0" value="${pairing.player2_score ?? 0}">

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

    const tableSelect = document.getElementById("edit-table");
    const p1Select = document.getElementById("edit-player1");
    const p2Select = document.getElementById("edit-player2");

    const currentTable = tables.find(t => t.number === pairing.table_number);
    if (currentTable) tableSelect.value = currentTable.id;

    p1Select.value = pairing.player1_id;

    function refreshEditDropdowns() {
        const tableId = tableSelect.value;
        const table = tables.find(t => t.id === tableId);
        const tableNumber = table.number;

        const p1 = players.find(p => p.id === p1Select.value);

        const validOpponents = getValidOpponents(p1, players, tableNumber, opponentHistory, tableHistory);

        p2Select.innerHTML = validOpponents
            .map(p => `<option value="${p.id}">${p.name}</option>`)
            .join("");

        if (validOpponents.some(p => p.id === pairing.player2_id)) {
            p2Select.value = pairing.player2_id;
        } else {
            p2Select.value = "";
        }
    }

    refreshEditDropdowns();

    tableSelect.addEventListener("change", refreshEditDropdowns);
    p1Select.addEventListener("change", refreshEditDropdowns);

    document.getElementById("cancelModal").onclick = closeModal;

    document.getElementById("saveEditPairing").onclick = async () => {
        const tableId = tableSelect.value;
        const table = tables.find(t => t.id === tableId);

        const player1 = players.find(p => p.id === p1Select.value);
        const player2 = players.find(p => p.id === p2Select.value);

        const error = validatePairing(player1, player2, table.number, opponentHistory, tableHistory);
        if (error) {
            alert(error);
            return;
        }

        await supabase
            .from("event_pairings")
            .update({
                table_name: table.name,
                table_number: table.number,
                player1_id: player1.id,
                player2_id: player2.id,
                player1_score: Number(document.getElementById("edit-score1").value),
                player2_score: Number(document.getElementById("edit-score2").value),
                locked: document.getElementById("edit-locked").value === "true"
            })
            .eq("id", pairingId);

        closeModal();
        renderPairingsTable(eventId, roundNumber);
    };
}

/* ============================================================
   Auto Pairing
   ============================================================ */
function showAutoPairPreviewModal(eventId, roundNumber, previewPairings, conflictList, allPlayers) {
    const rows = previewPairings.map((p, i) => {
        const conflicts = conflictList[i];
        const conflictHtml = conflicts.length
            ? `<ul class="conflict-warnings">${conflicts.map(c => `<li>${c}</li>`).join("")}</ul>`
            : `<span class="no-conflicts">No conflicts</span>`;

        return `
            <tr>
                <td>${p.table_name} ${p.table_number}</td>
                <td>
                    <img class="team-icon-small" src="${getTeamIcon(p.player1_team)}">
                    ${p.player1_name}
                </td>
                <td>
                    <img class="team-icon-small" src="${getTeamIcon(p.player2_team)}">
                    ${p.player2_name}
                </td>
                <td>${conflictHtml}</td>
            </tr>
        `;
    }).join("");

    // Determine unpaired players
    const pairedIds = new Set();
    previewPairings.forEach(p => {
        pairedIds.add(p.player1_id);
        pairedIds.add(p.player2_id);
    });

    const unpaired = allPlayers.filter(p => !pairedIds.has(p.id));

    const unpairedHtml = unpaired.length === 0
        ? `<p class="no-unpaired">All players have been paired.</p>`
        : `
            <h3 class="unpaired-title">Unpaired This Round</h3>
            <ul class="unpaired-list">
                ${unpaired.map(p => `
                    <li>
                        <img class="team-icon-small" src="${getTeamIcon(p.teams?.name || null)}">
                        ${p.name}
                    </li>
                `).join("")}
            </ul>
        `;

    openModal(`
        <h3>Auto‑Pair Preview</h3>

        <table class="admin-table">
            <thead>
                <tr>
                    <th>Table</th>
                    <th>Player 1</th>
                    <th>Player 2</th>
                    <th>Conflicts</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>

        ${unpairedHtml}

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="cancelAutoPair">Cancel</button>
            <button class="admin-modal-btn" id="confirmAutoPair">Confirm</button>
        </div>
    `);

    document.getElementById("cancelAutoPair").onclick = closeModal;

    document.getElementById("confirmAutoPair").onclick = async () => {
        const cleanPairings = previewPairings.map(p => ({
            event_id: p.event_id,
            round_number: p.round_number,
            table_name: p.table_name,
            table_number: p.table_number,
            player1_id: p.player1_id,
            player2_id: p.player2_id
        }));

        await supabase.from("event_pairings").insert(cleanPairings);
        closeModal();
        renderPairingsTable(eventId, roundNumber);
    };
}


export async function autoPair(eventId, roundNumber) {
    const { data: players } = await supabase
        .from("profiles")
        .select("id, name, team_id, teams(name)")
        .eq("enabled", true)
        .order("name");

    const { data: tables } = await supabase
        .from("tables")
        .select("id, name, number")
        .eq("event_id", eventId)
        .order("number");

    const { data: allPairings } = await supabase
        .from("event_pairings")
        .select("player1_id, player2_id, table_number, round_number")
        .eq("event_id", eventId);

    const { opponentHistory, tableHistory } = buildHistory(allPairings, roundNumber);

    let unpaired = [...players];
    const previewPairings = [];
    const conflictList = [];

    for (let i = 0; i < tables.length; i++) {
        if (unpaired.length < 2) break;

        const table = tables[i];
        const tableNumber = table.number;

        let chosenP1 = null;
        let chosenP2 = null;

        // Try each player as P1 until we find a valid opponent
        for (let p1 of unpaired) {
            const validOpponents = unpaired.filter(p2 => {
                if (p2.id === p1.id) return false;
                return validatePairing(p1, p2, tableNumber, opponentHistory, tableHistory) === null;
            });

            if (validOpponents.length > 0) {
                chosenP1 = p1;
                chosenP2 = validOpponents[0];
                break;
            }
        }

        // If no valid pairing for this table, skip it
        if (!chosenP1 || !chosenP2) {
            continue;
        }

        // Remove chosen players from unpaired
        unpaired = unpaired.filter(p => p.id !== chosenP1.id && p.id !== chosenP2.id);

        previewPairings.push({
            event_id: eventId,
            round_number: roundNumber,
            table_name: table.name,
            table_number: table.number,
            player1_id: chosenP1.id,
            player2_id: chosenP2.id,
            player1_name: chosenP1.name,
            player2_name: chosenP2.name,
            player1_team: chosenP1.teams?.name || null,
            player2_team: chosenP2.teams?.name || null
        });

        conflictList.push([]); // we only accept valid pairings
    }

    showAutoPairPreviewModal(eventId, roundNumber, previewPairings, conflictList, players);

}

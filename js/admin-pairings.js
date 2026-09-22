import { supabase } from '/js/supabaseClient.js';

function openModal(html) {
    const backdrop = document.createElement("div");
    backdrop.className = "admin-modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "admin-modal";
    modal.innerHTML = html;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeModal();
    });
}

function closeModal() {
    const backdrop = document.querySelector(".admin-modal-backdrop");
    if (backdrop) backdrop.remove();
}


export async function loadPairingsAdmin() {
    const root = document.getElementById("admin-content");

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
            player1:profiles!event_pairings_player1_id_fkey(name),
            player2:profiles!event_pairings_player2_id_fkey(name)
        `)
        .order("round_number");

    root.innerHTML = `
        <div class="admin-section">
            <h2>Pairings</h2>

            <button class="admin-btn" id="createPairingBtn">Create New Pairing</button>

            <table class="admin-table">
                <tr>
                    <th>Round</th>
                    <th>Table</th>
                    <th>Player 1</th>
                    <th>Player 2</th>
                    <th>Scores</th>
                    <th>Actions</th>
                </tr>

                ${pairings.map(p => `
                    <tr>
                        <td>${p.round_number}</td>
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
        </div>
    `;

    document.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => editPairing(btn.dataset.edit));
    });

    document.querySelectorAll("[data-delete]").forEach(btn => {
        btn.addEventListener("click", () => deletePairing(btn.dataset.delete));
    });

    document.getElementById("createPairingBtn").addEventListener("click", () => {
        showCreatePairingModal();
    });

}

async function editPairing(id) {
    const { data: pairing } = await supabase
        .from("event_pairings")
        .select("*")
        .eq("id", id)
        .single();

    const { data: players } = await supabase
        .from("profiles")
        .select("id, name");

    const playerOptions = players
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
        <select id="edit-player1">${playerOptions}</select>

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
        loadPairingsAdmin();
    };
}


async function deletePairing(id) {
    await supabase.from("event_pairings").delete().eq("id", id);
    loadPairingsAdmin();
}

async function showCreatePairingModal() {
    const { data: players } = await supabase
        .from("profiles")
        .select("id, name");

    const playerOptions = players
        .map(p => `<option value="${p.id}">${p.name}</option>`)
        .join("");

    openModal(`
        <h3>Create Pairing</h3>

        <label>Round Number</label>
        <input id="pairing-round" type="number" min="1">

        <label>Table Name</label>
        <input id="pairing-table-name" type="text">

        <label>Table Number</label>
        <input id="pairing-table-number" type="number" min="1">

        <label>Player 1</label>
        <select id="pairing-player1">${playerOptions}</select>

        <label>Player 2</label>
        <select id="pairing-player2">${playerOptions}</select>

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="cancelModal">Cancel</button>
            <button class="admin-modal-btn" id="savePairing">Create</button>
        </div>
    `);

    document.getElementById("cancelModal").onclick = closeModal;

    document.getElementById("savePairing").onclick = async () => {
        const round = Number(document.getElementById("pairing-round").value);
        const tableName = document.getElementById("pairing-table-name").value;
        const tableNumber = Number(document.getElementById("pairing-table-number").value);
        const player1 = document.getElementById("pairing-player1").value;
        const player2 = document.getElementById("pairing-player2").value;

        await supabase.from("event_pairings").insert({
            event_id: DEFAULT_EVENT_ID,
            round_number: round,
            table_name: tableName,
            table_number: tableNumber,
            player1_id: player1,
            player2_id: player2
        });

        closeModal();
        loadPairingsAdmin();
    };
}



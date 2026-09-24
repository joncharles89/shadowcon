import { supabase } from '/js/supabaseClient.js';
import { openModal, closeModal } from '/js/admin-modal.js';

//------------------------------------------------------------
// LOAD PLAYERS TABLE
//------------------------------------------------------------
export async function loadPlayersAdmin() {
    const root = document.getElementById("admin-content");

    const { data: players } = await supabase
        .from("profiles")
        .select("id, name, army_name, team_id");

    const { data: teams } = await supabase
        .from("teams")
        .select("id, name")
        .order("name");

    root.innerHTML = `
        <div class="admin-section">
            <h2>Players</h2>

            <table class="admin-table">
                <tr>
                    <th>Name</th>
                    <th>Army</th>
                    <th>Team</th>
                    <th>Actions</th>
                </tr>

                ${players.map(p => `
                    <tr>
                        <td>${p.name}</td>
                        <td>${p.army_name}</td>
                        <td>${teamName(p.team_id, teams)}</td>
                        <td>
                            <button class="admin-btn" data-edit="${p.id}">Edit</button>
                        </td>
                    </tr>
                `).join("")}
            </table>
        </div>
    `;

    document.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => editPlayerModal(btn.dataset.edit));
    });
}

// Helper to show team name
function teamName(teamId, teams) {
    const t = teams.find(x => x.id === teamId);
    return t ? t.name : "-";
}

//------------------------------------------------------------
// EDIT PLAYER MODAL
//------------------------------------------------------------
async function editPlayerModal(playerId) {
    // Load player
    const { data: player } = await supabase
        .from("profiles")
        .select("id, name, army_name, team_id")
        .eq("id", playerId)
        .single();

    // Load teams
    const { data: teams } = await supabase
        .from("teams")
        .select("id, name")
        .order("name");

    const teamOptions = teams
        .map(t => `
            <option value="${t.id}" ${t.id === player.team_id ? "selected" : ""}>
                ${t.name}
            </option>
        `)
        .join("");

    openModal(`
        <h3>Edit Player</h3>

        <label>Name</label>
        <input id="edit-player-name" type="text" value="${player.name}">

        <label>Army</label>
        <input id="edit-player-army" type="text" value="${player.army_name}">

        <label>Team</label>
        <select id="edit-player-team">
            <option value="">No Team</option>
            ${teamOptions}
        </select>

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="cancelModal">Cancel</button>
            <button class="admin-modal-btn" id="savePlayer">Save</button>
        </div>
    `);

    document.getElementById("cancelModal").onclick = closeModal;

    document.getElementById("savePlayer").onclick = async () => {
        const newName = document.getElementById("edit-player-name").value.trim();
        const newArmy = document.getElementById("edit-player-army").value.trim();
        const newTeam = document.getElementById("edit-player-team").value || null;

        await supabase
            .from("profiles")
            .update({
                name: newName,
                army_name: newArmy,
                team_id: newTeam
            })
            .eq("id", playerId);

        closeModal();
        loadPlayersAdmin();
    };
}

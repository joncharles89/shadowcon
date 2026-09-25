import { supabase } from '/js/supabaseClient.js';
import { openModal, closeModal } from '/js/admin-modal.js';

export async function renderPlayersAdmin() {
    const root = document.getElementById("players-admin");
    if (!root) return;

    const { data: players } = await supabase
        .from("profiles")
        .select("id, name, army_name, team_id, enabled")
        .order("name");

    const { data: teams } = await supabase
        .from("teams")
        .select("id, name")
        .order("name");

    const teamMap = new Map(teams.map(t => [t.id, t.name]));

    root.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Army</th>
                    <th>Team</th>
                    <th>Enabled</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${players.map(p => `
                    <tr>
                        <td>${p.name}</td>
                        <td>${p.army_name || "-"}</td>
                        <td>${teamMap.get(p.team_id) || "-"}</td>
                        <td>${p.enabled ? "Yes" : "No"}</td>
                        <td>
                            <button class="admin-btn" data-edit="${p.id}">Edit</button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    // Attach edit handlers
    root.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => openPlayerEditModal(btn.dataset.edit, players, teams));
    });
}

/* ============================================================
   Player Edit Modal
   ============================================================ */
function openPlayerEditModal(playerId, players, teams) {
    const player = players.find(p => p.id === playerId);

    const teamOptions = teams
        .map(t => `<option value="${t.id}" ${t.id === player.team_id ? "selected" : ""}>${t.name}</option>`)
        .join("");

    openModal(`
        <h3>Edit Player</h3>

        <label>Name</label>
        <input id="edit-name" type="text" value="${player.name}">

        <label>Army</label>
        <input id="edit-army" type="text" value="${player.army_name || ""}">

        <label>Team</label>
        <select id="edit-team">
            <option value="">No Team</option>
            ${teamOptions}
        </select>

        <label>Enabled</label>
        <select id="edit-enabled">
            <option value="true" ${player.enabled ? "selected" : ""}>Enabled</option>
            <option value="false" ${!player.enabled ? "selected" : ""}>Disabled</option>
        </select>

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="cancelModal">Cancel</button>
            <button class="admin-modal-btn" id="savePlayer">Save</button>
        </div>
    `);

    document.getElementById("cancelModal").onclick = closeModal;

    document.getElementById("savePlayer").onclick = async () => {
        const name = document.getElementById("edit-name").value.trim();
        const army = document.getElementById("edit-army").value.trim();
        const teamId = document.getElementById("edit-team").value || null;
        const enabled = document.getElementById("edit-enabled").value === "true";

        await supabase.from("profiles").update({
            name,
            army_name: army,
            team_id: teamId,
            enabled,
            updated_at: new Date()
        }).eq("id", playerId);

        closeModal();
        renderPlayersAdmin();
    };
}

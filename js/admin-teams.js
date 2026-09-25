import { supabase } from '/js/supabaseClient.js';
import { openModal, closeModal } from '/js/admin-modal.js';

export async function renderTeamsAdmin() {
    const root = document.getElementById("teams-admin");
    if (!root) return;

    const { data: teams } = await supabase
        .from("teams")
        .select("id, name")
        .order("name");

    root.innerHTML = `
        <div class="teams-header">
            <button id="createTeamBtn" class="admin-btn">Create Team</button>
        </div>

        <table class="admin-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${teams.map(t => `
                    <tr>
                        <td>${t.name}</td>
                        <td>
                            <button class="admin-btn" data-edit="${t.id}">Edit</button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    document.getElementById("createTeamBtn").onclick = () =>
        openTeamEditModal(null, teams);

    root.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => openTeamEditModal(btn.dataset.edit, teams));
    });
}

/* ============================================================
   Team Edit / Create Modal
   ============================================================ */
function openTeamEditModal(teamId, teams) {
    const team = teams.find(t => t.id === teamId) || { name: "" };

    openModal(`
        <h3>${teamId ? "Edit Team" : "Create Team"}</h3>

        <label>Team Name</label>
        <input id="team-name" type="text" value="${team.name}">

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="cancelModal">Cancel</button>
            <button class="admin-modal-btn" id="saveTeam">${teamId ? "Save" : "Create"}</button>
        </div>
    `);

    document.getElementById("cancelModal").onclick = closeModal;

    document.getElementById("saveTeam").onclick = async () => {
        const name = document.getElementById("team-name").value.trim();

        if (!name) return;

        if (teamId) {
            await supabase.from("teams").update({ name }).eq("id", teamId);
        } else {
            await supabase.from("teams").insert({ name });
        }

        closeModal();
        renderTeamsAdmin();
    };
}

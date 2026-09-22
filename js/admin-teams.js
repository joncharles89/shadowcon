import { supabase } from '/js/supabaseClient.js';

export async function loadTeamsAdmin() {
    const root = document.getElementById("admin-content");

    const { data: teams } = await supabase
        .from("teams")
        .select("id, name");

    root.innerHTML = `
        <div class="admin-section">
            <h2>Teams</h2>

            <button class="admin-btn" id="createTeamBtn">Create Team</button>

            <table class="admin-table">
                <tr>
                    <th>Name</th>
                    <th>Actions</th>
                </tr>

                ${teams.map(t => `
                    <tr>
                        <td>${t.name}</td>
                        <td>
                            <button class="admin-btn" data-edit="${t.id}">Edit</button>
                            <button class="admin-btn" data-delete="${t.id}">Delete</button>
                        </td>
                    </tr>
                `).join("")}
            </table>
        </div>
    `;
}

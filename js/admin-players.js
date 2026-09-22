import { supabase } from '/js/supabaseClient.js';

export async function loadPlayersAdmin() {
    const root = document.getElementById("admin-content");

    const { data: players } = await supabase
        .from("profiles")
        .select("id, name, army_name, team_id");

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
                        <td>${p.team_id ?? "-"}</td>
                        <td>
                            <button class="admin-btn" data-edit="${p.id}">Edit</button>
                        </td>
                    </tr>
                `).join("")}
            </table>
        </div>
    `;
}

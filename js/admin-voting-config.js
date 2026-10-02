import { supabase } from '/js/supabaseClient.js';
import { openModal, closeModal } from '/js/admin-modal.js';

/* ============================================================
   Render Voting Admin Section
   ============================================================ */

export async function renderVotingConfigAdmin(currentEventId) {
    const root = document.getElementById("voting-config-admin");
    if (!root) return;

    const { data: config } = await supabase
        .from("voting_config")
        .select("*")
        .eq("event_id", currentEventId)
        .order("vote_type");

    root.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Vote Type</th>
                    <th>Opens</th>
                    <th>Closes</th>
                    <th>Enabled</th>
                    <th>Message</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${config.map(row => `
                    <tr>
                        <td>${formatVoteType(row.vote_type)}</td>
                        <td>${formatDate(row.opens_at)}</td>
                        <td>${formatDate(row.closes_at)}</td>
                        <td>${row.is_enabled ? "Yes" : "No"}</td>
                        <td>${row.message || "-"}</td>
                        <td>
                            <button class="admin-btn" data-edit="${row.id}">Edit</button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    root.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => openVotingEditModal(btn.dataset.edit, config));
    });
}

/* ============================================================
   Helpers
   ============================================================ */

function formatVoteType(type) {
    if (type === "coolest_army") return "Coolest Army";
    if (type === "favourite_coplayer") return "Favourite Co‑Player";
    return type;
}

function formatDate(ts) {
    return new Date(ts).toLocaleString();
}

/* ============================================================
   Edit Modal
   ============================================================ */

function openVotingEditModal(id, config) {
    const row = config.find(c => c.id === id);

    openModal(`
        <h3>Edit Voting Window</h3>

        <label>Vote Type</label>
        <input type="text" value="${formatVoteType(row.vote_type)}" disabled>

        <label>Opens At</label>
        <input id="edit-opens" type="datetime-local" value="${toLocalInput(row.opens_at)}">

        <label>Closes At</label>
        <input id="edit-closes" type="datetime-local" value="${toLocalInput(row.closes_at)}">

        <label>Enabled</label>
        <select id="edit-enabled">
            <option value="true" ${row.is_enabled ? "selected" : ""}>Enabled</option>
            <option value="false" ${!row.is_enabled ? "selected" : ""}>Disabled</option>
        </select>

        <label>Message (optional)</label>
        <input id="edit-message" type="text" value="${row.message || ""}">

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="cancelModal">Cancel</button>
            <button class="admin-modal-btn" id="saveVoting">Save</button>
        </div>
    `);

    document.getElementById("cancelModal").onclick = closeModal;

    document.getElementById("saveVoting").onclick = async () => {
        const opens = document.getElementById("edit-opens").value;
        const closes = document.getElementById("edit-closes").value;
        const enabled = document.getElementById("edit-enabled").value === "true";
        const message = document.getElementById("edit-message").value.trim();

        const payload = {
            opens_at: new Date(opens).toISOString(),
            closes_at: new Date(closes).toISOString(),
            is_enabled: enabled,
            message: message || null
        };

        console.log("🔍 PATCH Debug — ID:", id);
        console.log("🔍 PATCH Debug — Payload:", payload);

        const { data, error } = await supabase
            .from("voting_config")
            .update(payload)
            .eq("id", id);

        console.log("🔍 PATCH Debug — Response Data:", data);
        console.log("🔍 PATCH Debug — Response Error:", error);

        if (error) {
            alert("Supabase rejected the update. Check console for details.");
            return;
        }

        closeModal();
        renderVotingConfigAdmin(row.event_id);
    };
}

/* ============================================================
   Convert timestamp → datetime-local input format
   ============================================================ */

function toLocalInput(ts) {
    const d = new Date(ts);
    const pad = n => n.toString().padStart(2, "0");

    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

import { supabase } from '/js/supabaseClient.js';
import { openModal, closeModal } from '/js/admin-modal.js';

/* ============================================================
   Render Voting Admin
   ============================================================ */

export async function renderVotingAdmin(eventId) {
    const root = document.getElementById("voting-admin");
    if (!root) return;

    // 1. Fetch players FIRST
    const { data: players } = await supabase
        .from("profiles")
        .select("id, name, enabled")
        .eq("enabled", true)
        .order("name");

    function playerName(id) {
        const p = players.find(x => x.id === id);
        return p ? p.name : "-";
    }

    // 2. Fetch votes AFTER players
    const { data: coolest } = await supabase
        .from("coolest_army_votes")
        .select("*, profiles!coolest_army_votes_voter_id_fkey(name)")
        .eq("event_id", eventId);

    const { data: favourite } = await supabase
        .from("favourite_coplayer_votes")
        .select("*, profiles!favourite_coplayer_votes_voter_id_fkey(name)")
        .eq("event_id", eventId);
    
    // 2b. Fetch missing votes for display
    const { data: missing } = await supabase
        .from("v_missing_votes")
        .select("*")
        .eq("event_id", eventId);

    const coolestVoterIds = new Set(coolest.map(v => v.voter_id));
    const favouriteVoterIds = new Set(favourite.map(v => v.voter_id));

    const missingCoolest = players.filter(p => !coolestVoterIds.has(p.id));
    const missingFavourite = players.filter(p => !favouriteVoterIds.has(p.id));

    // 3. Render tables safely
    root.innerHTML = `
        <div class="admin-section">
            <h3>Coolest Army Votes</h3>
            <button class="admin-btn" id="addCoolestVote">Add Vote</button>

            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Voter</th>
                        <th>1st</th>
                        <th>2nd</th>
                        <th>3rd</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${coolest.map(v => `
                        <tr>
                            <td>${v.profiles.name}</td>
                            <td>${playerName(v.rank1_player_id)}</td>
                            <td>${playerName(v.rank2_player_id)}</td>
                            <td>${playerName(v.rank3_player_id)}</td>
                            <td>
                                <button class="admin-btn" data-edit-coolest="${v.id}">Edit</button>
                                <button class="admin-btn" data-delete-coolest="${v.id}">Delete</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            <h4 class="unpaired-title">Players Missing Coolest Army Vote</h4>
            ${
                missingCoolest.length === 0
                    ? `<p class="no-unpaired">All enabled players have voted.</p>`
                    : `
                        <ul class="unpaired-list">
                            ${missingCoolest.map(p => `
                                <li>
                                    ${p.name}
                                    <button class="admin-btn" data-add-coolest="${p.id}" style="margin-left:10px;">
                                        Add Vote
                                    </button>
                                </li>
                            `).join("")}
                        </ul>
                    `
            }
        </div>
    `;

    root.innerHTML += `
        <div class="admin-section">
            <h3>Favourite Co‑Player Votes</h3>
            <button class="admin-btn" id="addFavouriteVote">Add Vote</button>

            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Voter</th>
                        <th>Choice 1</th>
                        <th>Choice 2</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${favourite.map(v => `
                        <tr>
                            <td>${v.profiles.name}</td>
                            <td>${playerName(v.choice1_player_id)}</td>
                            <td>${playerName(v.choice2_player_id)}</td>
                            <td>
                                <button class="admin-btn" data-edit-favourite="${v.id}">Edit</button>
                                <button class="admin-btn" data-delete-favourite="${v.id}">Delete</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            <h4 class="unpaired-title">Players Missing Favourite Co‑Player Vote</h4>
            ${
                missingFavourite.length === 0
                    ? `<p class="no-unpaired">All enabled players have voted.</p>`
                    : `
                        <ul class="unpaired-list">
                            ${missingFavourite.map(p => `
                                <li>
                                    ${p.name}
                                    <button class="admin-btn" data-add-favourite="${p.id}" style="margin-left:10px;">
                                        Add Vote
                                    </button>
                                </li>
                            `).join("")}
                        </ul>
                    `
            }
        </div>
    `;

    /* ============================================================
       Add/Edit/Delete Coolest Army Votes
       ============================================================ */

    document.getElementById("addCoolestVote").onclick = () =>
        openCoolestModal(null, players, eventId);

    root.querySelectorAll("[data-edit-coolest]").forEach(btn => {
        btn.onclick = () => openCoolestModal(btn.dataset.editCoolest, players, eventId);
    });

    root.querySelectorAll("[data-delete-coolest]").forEach(btn => {
        btn.onclick = async () => {
            await supabase.from("coolest_army_votes").delete().eq("id", btn.dataset.deleteCoolest);
            renderVotingAdmin(eventId);
        };
    });

    /* ============================================================
       Add/Edit/Delete Favourite Co‑Player Votes
       ============================================================ */

    document.getElementById("addFavouriteVote").onclick = () =>
        openFavouriteModal(null, players, eventId);

    root.querySelectorAll("[data-edit-favourite]").forEach(btn => {
        btn.onclick = () => openFavouriteModal(btn.dataset.editFavourite, players, eventId);
    });

    root.querySelectorAll("[data-delete-favourite]").forEach(btn => {
        btn.onclick = async () => {
            await supabase.from("favourite_coplayer_votes").delete().eq("id", btn.dataset.deleteFavourite);
            renderVotingAdmin(eventId);
        };
    });

    // Buttons for missing vote additions
    root.querySelectorAll("[data-add-coolest]").forEach(btn => {
        btn.onclick = () => openCoolestModal(null, players, eventId, btn.dataset.addCoolest);
    });

    root.querySelectorAll("[data-add-favourite]").forEach(btn => {
        btn.onclick = () => openFavouriteModal(null, players, eventId, btn.dataset.addFavourite);
    });

}

/* ============================================================
   Coolest Army Modal
   ============================================================ */

async function openCoolestModal(id, players, eventId, preselectVoterId = null) {
    let existing = null;

    if (id) {
        const { data } = await supabase
            .from("coolest_army_votes")
            .select("*")
            .eq("id", id)
            .single();
        existing = data;
    }

    openModal(`
        <h3>${id ? "Edit" : "Add"} Coolest Army Vote</h3>

        <label>Voter</label>
        <select id="vote-voter">
            ${players.map(p => `
                <option value="${p.id}" ${existing?.voter_id === p.id || preselectVoterId === p.id ? "selected" : ""}>
                    ${p.name}
                </option>
            `).join("")}
        </select>

        <label>1st Place</label>
        <select id="vote-r1">
            ${players.map(p => `
                <option value="${p.id}" ${existing?.rank1_player_id === p.id ? "selected" : ""}>
                    ${p.name}
                </option>
            `).join("")}
        </select>

        <label>2nd Place</label>
        <select id="vote-r2">
            ${players.map(p => `
                <option value="${p.id}" ${existing?.rank2_player_id === p.id ? "selected" : ""}>
                    ${p.name}
                </option>
            `).join("")}
        </select>

        <label>3rd Place</label>
        <select id="vote-r3">
            ${players.map(p => `
                <option value="${p.id}" ${existing?.rank3_player_id === p.id ? "selected" : ""}>
                    ${p.name}
                </option>
            `).join("")}
        </select>

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="cancelModal">Cancel</button>
            <button class="admin-modal-btn" id="saveVote">Save</button>
        </div>
    `);

    document.getElementById("cancelModal").onclick = closeModal;

    document.getElementById("saveVote").onclick = async () => {
        const payload = {
            event_id: eventId,
            voter_id: document.getElementById("vote-voter").value,
            rank1_player_id: document.getElementById("vote-r1").value,
            rank2_player_id: document.getElementById("vote-r2").value,
            rank3_player_id: document.getElementById("vote-r3").value
        };

        if (id) {
            await supabase.from("coolest_army_votes").update(payload).eq("id", id);
        } else {
            await supabase.from("coolest_army_votes").insert(payload);
        }

        closeModal();
        renderVotingAdmin(eventId);
    };
}

/* ============================================================
   Favourite Co‑Player Modal
   ============================================================ */

async function openFavouriteModal(id, players, eventId, preselectVoterId = null) {
    let existing = null;

    if (id) {
        const { data } = await supabase
            .from("favourite_coplayer_votes")
            .select("*")
            .eq("id", id)
            .single();
        existing = data;
    }

    openModal(`
        <h3>${id ? "Edit" : "Add"} Favourite Co‑Player Vote</h3>

        <label>Voter</label>
        <select id="vote-voter">
            ${players.map(p => `
                <option value="${p.id}" ${existing?.voter_id === p.id || preselectVoterId === p.id ? "selected" : ""}>
                    ${p.name}
                </option>
            `).join("")}
        </select>

        <label>Choice 1</label>
        <select id="vote-c1">
            ${players.map(p => `
                <option value="${p.id}" ${existing?.choice1_player_id === p.id ? "selected" : ""}>
                    ${p.name}
                </option>
            `).join("")}
        </select>

        <label>Choice 2</label>
        <select id="vote-c2">
            ${players.map(p => `
                <option value="${p.id}" ${existing?.choice2_player_id === p.id ? "selected" : ""}>
                    ${p.name}
                </option>
            `).join("")}
        </select>

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="cancelModal">Cancel</button>
            <button class="admin-modal-btn" id="saveVote">Save</button>
        </div>
    `);

    document.getElementById("cancelModal").onclick = closeModal;

    document.getElementById("saveVote").onclick = async () => {
        const payload = {
            event_id: eventId,
            voter_id: document.getElementById("vote-voter").value,
            choice1_player_id: document.getElementById("vote-c1").value,
            choice2_player_id: document.getElementById("vote-c2").value
        };

        if (id) {
            await supabase.from("favourite_coplayer_votes").update(payload).eq("id", id);
        } else {
            await supabase.from("favourite_coplayer_votes").insert(payload);
        }

        closeModal();
        renderVotingAdmin(eventId);
    };
}

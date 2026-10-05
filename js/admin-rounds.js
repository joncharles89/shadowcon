// admin-rounds.js
import { supabase } from "./supabaseClient.js";
import { openModal, closeModal } from '/js/admin-modal.js';

export async function loadRoundsSection(eventId) {
    const container = document.getElementById("admin-content");
    container.innerHTML = `
        <div class="admin-section" id="rounds-section">
            <h2>Round Management</h2>
            <p class="admin-text-muted">
                Update round end times for the event. These values are used by the event dashboard timer.
            </p>

            <table class="admin-table" id="rounds-table">
                <thead>
                    <tr>
                        <th>Round</th>
                        <th>End Time</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="rounds-table-body"></tbody>
            </table>
        </div>
    `;

    loadRounds(eventId);
}

async function loadRounds(eventId) {
    const { data, error } = await supabase
        .from("event_rounds")
        .select("*")
        .eq("event_id", eventId)
        .order("round", { ascending: true });

    if (error) {
        console.error("Error loading rounds:", error);
        return;
    }

    const tbody = document.getElementById("rounds-table-body");
    tbody.innerHTML = "";

    data.forEach(round => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${round.round}</td>
            <td>${round.round_end ? new Date(round.round_end).toLocaleString() : "<i>Not set</i>"}</td>
            <td>
                <button class="admin-btn" data-edit-round="${round.id}">
                    Edit
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    attachEditHandlers();
}

function attachEditHandlers() {
    document.querySelectorAll("[data-edit-round]").forEach(btn => {
        btn.addEventListener("click", () => {
            const roundId = btn.getAttribute("data-edit-round");
            openEditModal(roundId);
        });
    });
}

async function openEditModal(roundId) {
    // Fetch the round
    const { data, error } = await supabase
        .from("event_rounds")
        .select("*")
        .eq("id", roundId)
        .single();

    if (error) {
        console.error("Error fetching round:", error);
        return;
    }

    openModal(`
        <h3>Edit Round ${data.round}</h3>
        <label>Round End Time</label>
        <input type="datetime-local" id="roundEndInput" value="${formatForInput(data.round_end)}">

        <div class="admin-modal-buttons">
            <button class="admin-modal-btn" id="saveRoundBtn">Save</button>
            <button class="admin-modal-btn" id="cancelRoundBtn">Cancel</button>
        </div>
    `);

    document.getElementById("saveRoundBtn").addEventListener("click", async () => {
        const input = document.getElementById("roundEndInput").value;

        if (!input) {
            alert("Please select a valid end time.");
            return;
        }

        const newEnd = new Date(input).toISOString();

        console.log("Saving new end time:", newEnd, "for round ID:", roundId);

        const { error: updateError } = await supabase
            .from("event_rounds")
            .update({ round_end: newEnd })
            .eq("id", roundId);

        if (updateError) {
            console.error("Error updating round:", updateError);
            alert("Failed to update round.");
            return;
        }

        closeModal();
        loadRounds(data.event_id);
    });

    document.getElementById("cancelRoundBtn").addEventListener("click", closeModal);
}

function formatForInput(timestamp) {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    return d.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
}

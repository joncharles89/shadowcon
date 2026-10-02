import { supabase } from '/js/supabaseClient.js';

export async function renderLeagueAdmin(eventId) {
    const root = document.getElementById("league-admin");
    if (!root) return;

    // Fetch Coolest Army scores
    const { data: coolest } = await supabase
        .from("v_coolest_army_scores")
        .select("*")
        .eq("event_id", eventId)
        .order("points", { ascending: false });

    // Fetch Favourite Co‑Player scores
    const { data: favourite } = await supabase
        .from("v_favourite_coplayer_scores")
        .select("*")
        .eq("event_id", eventId)
        .order("votecount", { ascending: false });

    root.innerHTML = `
        <div class="league-section">
            <button class="league-toggle" data-target="coolest-table">
                Coolest Army Scores ▼
            </button>

            <div id="coolest-table" class="league-table collapsed">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Rank 1</th>
                            <th>Rank 2</th>
                            <th>Rank 3</th>
                            <th>Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${coolest.map(row => `
                            <tr>
                                <td>${row.name}</td>
                                <td>${row.rank1}</td>
                                <td>${row.rank2}</td>
                                <td>${row.rank3}</td>
                                <td>${row.points}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="league-section">
            <button class="league-toggle" data-target="favourite-table">
                Favourite Co‑Player Scores ▼
            </button>

            <div id="favourite-table" class="league-table collapsed">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Votes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${favourite.map(row => `
                            <tr>
                                <td>${row.name}</td>
                                <td>${row.votecount}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Toggle logic
    root.querySelectorAll(".league-toggle").forEach(btn => {
        btn.onclick = () => {
            const target = document.getElementById(btn.dataset.target);
            const isCollapsed = target.classList.contains("collapsed");

            if (isCollapsed) {
                target.classList.remove("collapsed");
                btn.innerHTML = btn.innerHTML.replace("▼", "▲");
            } else {
                target.classList.add("collapsed");
                btn.innerHTML = btn.innerHTML.replace("▲", "▼");
            }
        };
    });
}

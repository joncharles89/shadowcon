import { supabase } from '/js/supabaseClient.js';
import { getUser } from '/js/auth.js';

/*
 * Set this to the UUID of the event shown on this page.
 * Alternatively, use ?event_id=<UUID> in the page URL.
 */
const DEFAULT_EVENT_ID = "369a1d4a-283f-41d6-bfc2-f83cee4b7818";

const TEAM_ICONS = {
    "rebels": "/img/factions/TriadWhite.svg",
    "emperor": "/img/factions/TriadWhite.svg",
    "kalla": "/img/factions/TriadWhite.svg"
};

function getEventId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('event_id') || DEFAULT_EVENT_ID;
    //return DEFAULT_EVENT_ID;
}

function getTeamIcon(teamObj) {
    if (!teamObj || !teamObj.name) {
        return null;
    }

    const key = teamObj.name.toLowerCase();
    const icon = TEAM_ICONS[key] || null;

    return icon;
}

async function loadEventInfo() {
    const root = document.getElementById('eventInfoRoot');

    if (!root) {
        console.error('rounds.js: #eventInfoRoot was not found.');
        return;
    }

    const user = await getUser();

    if (!user) {
        root.innerHTML = `
            <div class="card">
                <h2>You are not logged in</h2>
                <p><a href="/pages/login.html">Login here</a></p>
            </div>
        `;
        return;
    }

    const eventId = getEventId();

    if (!eventId) {
        root.innerHTML = `
            <div class="card">
                <h2>Event not configured</h2>
                <p>This page needs a valid event ID.</p>
            </div>
        `;
        return;
    }

    const { data: pairings, error } = await supabase
        .from('event_pairings')
        .select(`
            id,
            event_id,
            round_number,
            table_name,
            table_number,
            player1_id,
            player2_id,
            player1_score,
            player2_score,
            player1_submitted_at,
            player2_submitted_at,
            locked,

            player1:profiles!event_pairings_player1_id_fkey (
                name,
                army_name
            ),

            player2:profiles!event_pairings_player2_id_fkey (
                name,
                army_name
            ),
            team1:teams!event_pairings_player1_team_id_fkey (
                id,
                name
            ),
            team2:teams!event_pairings_player2_team_id_fkey (
                id,
                name
            )
        `)
        .eq('event_id', eventId)
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .order('round_number', { ascending: true });

    if (error) {
        console.error('Error loading pairings:', error);

        root.innerHTML = `
            <div class="card">
                <h2>Error loading event information</h2>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
        return;
    }

    if (!pairings || pairings.length === 0) {
        root.innerHTML = `
            <div class="card">
                <p>No games found for this event.</p>
            </div>
        `;
        return;
    }

    root.innerHTML = pairings
        .map(pairing => renderPairingCard(pairing, user))
        .join('');

    attachScoreFormListeners();
}

function renderPairingCard(p, user) {
    const isPlayer1 = p.player1_id === user.id;

    const player1Name = p.player1?.name || 'Player 1';
    const player2Name = p.player2?.name || 'Player 2';

    const player1Army = p.player1?.army_name || '(no army)';
    const player2Army = p.player2?.army_name || '(no army)';

    const player1Score = p.player1_score;
    const player2Score = p.player2_score;

    const player1Team = p.team1;
    const player2Team = p.team2;

    const player1Icon = getTeamIcon(player1Team);
    const player2Icon = getTeamIcon(player2Team);

    const bothScoresExist =
        player1Score !== null &&
        player1Score !== undefined &&
        player2Score !== null &&
        player2Score !== undefined;

    const locked = p.locked === true;

    /*
     * Each player may only enter their own score.
     * If their score already exists, it is displayed as read-only.
     */
    const yourScore = isPlayer1 ? player1Score : player2Score;

    const yourScoreExists =
        yourScore !== null &&
        yourScore !== undefined;

    return `
        <div class="round-card" data-game-id="${escapeHtml(p.id)}">

            <div class="round-header">
                <h2>Round ${escapeHtml(p.round_number)}</h2>
            </div>

            <div class="round-table">
                ${escapeHtml(p.table_name || '')}<br>
                Table ${escapeHtml(p.table_number ?? '')}
            </div>

            <div class="round-grid">

                <div class="round-label">
                    ${player1Icon ? `<img class="team-icon" src="${player1Icon}" alt="${escapeHtml(p.team1.name)}">` : ""}
                    ${escapeHtml(player1Name)}
                </div>

                <div class="round-label">
                    ${player2Icon ? `<img class="team-icon" src="${player2Icon}" alt="${escapeHtml(p.team2.name)}">` : ""}
                    ${escapeHtml(player2Name)}
                </div>

                <div>
                    ${escapeHtml(player1Army)}
                </div>

                <div>
                    ${escapeHtml(player2Army)}
                </div>

                <div>
                    ${
                        player1Score !== null &&
                        player1Score !== undefined
                            ? `<strong>${escapeHtml(player1Score)}</strong>`
                            : (
                                isPlayer1 && !locked
                                    ? `
                                        <input
                                            type="number"
                                            name="yourScore"
                                            min="0"
                                            step="1"
                                            placeholder="Your score"
                                        >
                                    `
                                    : `<span class="score-pending">—</span>`
                            )
                    }
                </div>

                <div>
                    ${
                        player2Score !== null &&
                        player2Score !== undefined
                            ? `<strong>${escapeHtml(player2Score)}</strong>`
                            : (
                                !isPlayer1 && !locked
                                    ? `
                                        <input
                                            type="number"
                                            name="yourScore"
                                            min="0"
                                            step="1"
                                            placeholder="Your score"
                                        >
                                    `
                                    : `<span class="score-pending">—</span>`
                            )
                    }
                </div>

            </div>

            ${
                locked
                    ? `
                        <p class="score-status" style="
                            text-align:center;
                            margin-top:10px;
                            color:#c7a96b;
                        ">
                            Scores submitted.
                        </p>
                    `
                    : yourScoreExists
                        ? `
                            <p class="score-status" style="
                                text-align:center;
                                margin-top:10px;
                            ">
                                Your score has been submitted.
                                Waiting for your co-player.
                            </p>
                        `
                        : `
                            <div class="score-form-inline">
                                <button
                                    class="btn submit-inline-btn"
                                    data-game-id="${escapeHtml(p.id)}"
                                >
                                    Submit My Score
                                </button>

                                <p class="score-status"></p>
                            </div>
                        `
            }

        </div>
    `;
}

function attachScoreFormListeners() {
    const buttons = document.querySelectorAll('.submit-inline-btn');

    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const gameId = button.getAttribute('data-game-id');
            const card = button.closest('.round-card');
            const status = card.querySelector('.score-status');

            const scoreInput = card.querySelector(
                "input[name='yourScore']"
            );

            if (!scoreInput) {
                status.textContent = 'No score field is available.';
                status.style.color = '#c76b6b';
                return;
            }

            const rawScore = scoreInput.value.trim();

            const score = rawScore === ''
                ? null
                : Number.parseInt(rawScore, 10);

            if (score === null || Number.isNaN(score)) {
                status.textContent = 'Please enter your score.';
                status.style.color = '#c76b6b';
                return;
            }

            if (score < 0) {
                status.textContent = 'Score cannot be negative.';
                status.style.color = '#c76b6b';
                return;
            }

            button.disabled = true;
            scoreInput.disabled = true;

            status.textContent = 'Submitting...';
            status.style.color = '';

            try {
                /*
                 * The RPC determines whether the caller is player 1
                 * or player 2 and updates only that player's score.
                 *
                 * It also refuses to modify a locked pairing and refuses
                 * to overwrite an already-submitted score.
                 */
                const { data, error } = await supabase.rpc(
                    'submit_score',
                    {
                        p_pairing_id: gameId,
                        p_score: score
                    }
                );

                if (error) {
                    throw error;
                }

                status.textContent =
                    data?.message || 'Score submitted!';

                status.style.color = '#c7a96b';

                /*
                 * Reload so that:
                 * - the submitted score is displayed
                 * - the input disappears
                 * - locked becomes visible once both players submit
                 */
                await loadEventInfo();

            } catch (error) {
                console.error('Error submitting score:', error);

                status.textContent =
                    error.message || 'Error submitting score.';

                status.style.color = '#c76b6b';

                button.disabled = false;
                scoreInput.disabled = false;
            }
        });
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

loadEventInfo();
import { supabase } from '/js/supabaseClient.js';
import { getUser } from '/js/auth.js';

/* ============================================================
   SHADOWCON — VOTING PAGE
   ============================================================ */

const root = document.getElementById('voting-root');
let currentUser = null;
let players = [];
let currentEventId = "369a1d4a-283f-41d6-bfc2-f83cee4b7818"; // You will set this per event
let votingConfig = {};


/* ============================================================
   INITIAL LOAD
   ============================================================ */

(async function initVoting() {
    currentUser = await getUser();

    if (!currentUser) {
        root.innerHTML = `
            <div class="card">
                <h2>You are not logged in</h2>
                <p><a href="/pages/login.html">Login here</a></p>
            </div>
        `;
        return;
    }

    // Fetch event players
    await loadVotingConfig();
    await loadPlayers();
    renderVotingUI();        // creates dropdowns (or not)
    await loadExistingVotes(); // only fills if dropdowns exist
    setupDropdowns();        // only attaches listeners if dropdowns exist
    setupSubmitHandlers();   // only attaches if buttons exist

})();

/* ============================================================
   LOAD PLAYERS FOR DROPDOWNS
   ============================================================ */

async function loadPlayers() {
    // TODO: Set currentEventId based on your event system
    currentEventId = "369a1d4a-283f-41d6-bfc2-f83cee4b7818"; // Kalla Reborn

    const { data } = await supabase
        .from('v_event_players')
        .select('player_id, name')
        .eq('event_id', currentEventId);

    players = data
        .filter(p => p.player_id !== currentUser.id)
        .map(p => ({
            id: p.player_id,
            name: p.name
        }));
}

async function loadExistingVotes() {
    // Coolest Army
    const { data: ca } = await supabase
        .from('coolest_army_votes')
        .select('*')
        .eq('event_id', currentEventId)
        .eq('voter_id', currentUser.id)
        .single();

    const ca1 = document.getElementById('ca-rank1');
    const ca2 = document.getElementById('ca-rank2');
    const ca3 = document.getElementById('ca-rank3');

    if (ca && ca1 && ca2 && ca3) {
        ca1.value = ca.rank1_player_id || "";
        ca2.value = ca.rank2_player_id || "";
        ca3.value = ca.rank3_player_id || "";
    }

    // Favourite Co‑Player
    const { data: fc } = await supabase
        .from('favourite_coplayer_votes')
        .select('*')
        .eq('event_id', currentEventId)
        .eq('voter_id', currentUser.id)
        .single();

    const fc1 = document.getElementById('fc-choice1');
    const fc2 = document.getElementById('fc-choice2');

    if (fc && fc1 && fc2) {
        fc1.value = fc.choice1_player_id || "";
        fc2.value = fc.choice2_player_id || "";
    }
}


async function loadVotingConfig() {
    const { data } = await supabase
        .from('voting_config')
        .select('*')
        .eq('event_id', currentEventId);

    votingConfig = {};

    data.forEach(row => {
        votingConfig[row.vote_type] = row;
    });
}

/* ============================================================
   RENDER UI
   ============================================================ */

function renderVotingUI() {
    const now = new Date();

    root.innerHTML = "";

    /* ---------------------------
       Coolest Army
       --------------------------- */
    const caCfg = votingConfig.coolest_army;

    if (caCfg && caCfg.is_enabled) {
        if (now < new Date(caCfg.opens_at)) {
            root.innerHTML += `
                <div class="card">
                    <h2>Coolest Army</h2>
                    <p>Voting opens at ${new Date(caCfg.opens_at).toLocaleString()}</p>
                </div>
            `;
        } else if (now > new Date(caCfg.closes_at)) {
            root.innerHTML += `
                <div class="card">
                    <h2>Coolest Army</h2>
                    <p>Voting has closed.</p>
                </div>
            `;
        } else {
            root.innerHTML += `
                <div class="card" id="coolest-army-section">
                    <h2>Coolest Army</h2>
                    <p>Select your top 3 armies.</p>

                    <div class="vote-group">
                        <label>1st Place</label>
                        <select id="ca-rank1"></select>
                    </div>

                    <div class="vote-group">
                        <label>2nd Place</label>
                        <select id="ca-rank2"></select>
                    </div>

                    <div class="vote-group">
                        <label>3rd Place</label>
                        <select id="ca-rank3"></select>
                    </div>

                    <button class="btn" id="submit-coolest">Save Vote</button>
                </div>
            `;
        }
    }

    /* ---------------------------
       Favourite Co‑Player
       --------------------------- */
    const fcCfg = votingConfig.favourite_coplayer;

    if (fcCfg && fcCfg.is_enabled) {
        if (now < new Date(fcCfg.opens_at)) {
            root.innerHTML += `
                <div class="card">
                    <h2>Favourite Co‑Player</h2>
                    <p>Voting opens at ${new Date(fcCfg.opens_at).toLocaleString()}</p>
                </div>
            `;
        } else if (now > new Date(fcCfg.closes_at)) {
            root.innerHTML += `
                <div class="card">
                    <h2>Favourite Co‑Player</h2>
                    <p>Voting has closed.</p>
                </div>
            `;
        } else {
            root.innerHTML += `
                <div class="card" id="favourite-coplayer-section">
                    <h2>Favourite Co‑Player</h2>
                    <p>Select the two players you enjoyed playing with the most.</p>

                    <div class="vote-group">
                        <label>Choice 1</label>
                        <select id="fc-choice1"></select>
                    </div>

                    <div class="vote-group">
                        <label>Choice 2</label>
                        <select id="fc-choice2"></select>
                    </div>

                    <button class="btn" id="submit-favourite">Save Vote</button>
                </div>
            `;
        }
    }
}

function notify(message) {
    const box = document.createElement('div');
    box.className = 'vote-notice';
    box.textContent = message;

    root.prepend(box);

    setTimeout(() => {
        box.style.opacity = '0';
        setTimeout(() => box.remove(), 400);
    }, 2000);
}


/* ============================================================
   DROPDOWN LOGIC — NO DUPLICATES
   ============================================================ */

function populateDropdown(dropdown, excludedIds = []) {
    const previousValue = dropdown.value; // remember current selection

    dropdown.innerHTML = `<option value="">-- Select Player --</option>`;

    players.forEach(p => {
        if (!excludedIds.includes(p.id)) {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            dropdown.appendChild(opt);
        }
    });

    // restore selection if still valid
    if (previousValue && !excludedIds.includes(previousValue)) {
        dropdown.value = previousValue;
    }
}

function setupDropdowns() {
    const ca1 = document.getElementById('ca-rank1');
    const ca2 = document.getElementById('ca-rank2');
    const ca3 = document.getElementById('ca-rank3');

    const fc1 = document.getElementById('fc-choice1');
    const fc2 = document.getElementById('fc-choice2');

    // If the dropdowns don't exist (voting closed/not open), stop here
    if (!ca1 || !ca2 || !ca3 || !fc1 || !fc2) {
        return;
    }

    const updateCoolest = () => {
        const selected = [ca1.value, ca2.value, ca3.value].filter(v => v);

        populateDropdown(ca1, selected.filter(v => v !== ca1.value));
        populateDropdown(ca2, selected.filter(v => v !== ca2.value));
        populateDropdown(ca3, selected.filter(v => v !== ca3.value));
    };

    const updateFavourite = () => {
        const selected = [fc1.value, fc2.value].filter(v => v);

        populateDropdown(fc1, selected.filter(v => v !== fc1.value));
        populateDropdown(fc2, selected.filter(v => v !== fc2.value));
    };

    // Initial population
    updateCoolest();
    updateFavourite();

    // Listeners
    [ca1, ca2, ca3].forEach(el => el.addEventListener('change', updateCoolest));
    [fc1, fc2].forEach(el => el.addEventListener('change', updateFavourite));
}

/* ============================================================
   SUBMIT HANDLERS
   ============================================================ */

function setupSubmitHandlers() {
    const btnCoolest = document.getElementById('submit-coolest');
    const btnFavourite = document.getElementById('submit-favourite');

    // If buttons don't exist (voting closed/not open), stop here
    if (btnCoolest) {
        btnCoolest.addEventListener('click', submitCoolestArmy);
    }

    if (btnFavourite) {
        btnFavourite.addEventListener('click', submitFavouriteCoplayer);
    }
}


async function submitCoolestArmy() {
    const rank1 = document.getElementById('ca-rank1').value;
    const rank2 = document.getElementById('ca-rank2').value;
    const rank3 = document.getElementById('ca-rank3').value;

    if (!rank1 || !rank2 || !rank3) {
        notify("Please select all 3 players.");
        return;
    }

    await supabase
        .from('coolest_army_votes')
        .upsert({
            event_id: currentEventId,
            voter_id: currentUser.id,
            rank1_player_id: rank1,
            rank2_player_id: rank2,
            rank3_player_id: rank3
        }, {
            onConflict: 'event_id,voter_id'
        });


    notify("Coolest Army vote saved.");
}

async function submitFavouriteCoplayer() {
    const choice1 = document.getElementById('fc-choice1').value;
    const choice2 = document.getElementById('fc-choice2').value;

    if (!choice1 || !choice2) {
        alert("Please select both players.");
        return;
    }

    await supabase
        .from('favourite_coplayer_votes')
        .upsert({
            event_id: currentEventId,
            voter_id: currentUser.id,
            choice1_player_id: choice1,
            choice2_player_id: choice2
        }, {
            onConflict: 'event_id,voter_id'
        });


    notify("Favourite Co-Player vote saved.");
}

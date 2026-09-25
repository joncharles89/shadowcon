// Build opponent + table history from previous rounds only
export function buildHistory(allPairings, roundNumber) {
    const opponentHistory = new Map();
    const tableHistory = new Map();

    allPairings
        .filter(p => p.round_number < roundNumber)   // STRICTLY earlier rounds
        .forEach(p => {
            if (!p.player1_id || !p.player2_id) return;

            if (!opponentHistory.has(p.player1_id)) opponentHistory.set(p.player1_id, new Set());
            if (!opponentHistory.has(p.player2_id)) opponentHistory.set(p.player2_id, new Set());
            opponentHistory.get(p.player1_id).add(p.player2_id);
            opponentHistory.get(p.player2_id).add(p.player1_id);

            if (!tableHistory.has(p.player1_id)) tableHistory.set(p.player1_id, new Set());
            if (!tableHistory.has(p.player2_id)) tableHistory.set(p.player2_id, new Set());
            tableHistory.get(p.player1_id).add(p.table_number);
            tableHistory.get(p.player2_id).add(p.table_number);
        });

    return { opponentHistory, tableHistory };
}

// Validate a single pairing
export function validatePairing(player1, player2, tableNumber, opponentHistory, tableHistory) {
    if (player1.id === player2.id) {
        return "A player cannot be paired against themselves.";
    }

    if (player1.team_id && player2.team_id && player1.team_id === player2.team_id) {
        return "Players from the same team cannot be paired.";
    }

    const p1Opponents = opponentHistory.get(player1.id) || new Set();
    if (p1Opponents.has(player2.id)) {
        return "These players have already played each other.";
    }

    const p1Tables = tableHistory.get(player1.id) || new Set();
    const p2Tables = tableHistory.get(player2.id) || new Set();
    if (p1Tables.has(tableNumber) || p2Tables.has(tableNumber)) {
        return "One of these players has already played on this table.";
    }

    return null; // valid
}

// Filter valid opponents for dropdowns
export function getValidOpponents(selectedPlayer, players, tableNumber, opponentHistory, tableHistory) {
    const playedOpponents = opponentHistory.get(selectedPlayer.id) || new Set();
    const playedTables = tableHistory.get(selectedPlayer.id) || new Set();

    return players.filter(p => {
        if (p.id === selectedPlayer.id) return false;
        if (selectedPlayer.team_id && p.team_id && selectedPlayer.team_id === p.team_id) return false;
        if (playedOpponents.has(p.id)) return false;
        if (playedTables.has(tableNumber)) return false;
        return true;
    });
}

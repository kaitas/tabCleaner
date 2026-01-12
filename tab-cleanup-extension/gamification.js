/**
 * gamification.js
 * Handles game state, scoring (Karma), and Fever Time logic.
 */

const FEVER_START_HOUR = 18;
const FEVER_END_HOUR = 22;
const BASE_SCORE_CLOSE = 10;
const SCORE_PENALTY_BLANK = -1;
const FEVER_MULTIPLIER = 2;

// Initial state
const INITIAL_STATE = {
    karma: 0,
    totalTabsClosed: 0,
    badges: [],
    lastUpdated: null
};

/**
 * Loads the current game state from storage.
 */
export async function loadGameState() {
    const data = await chrome.storage.local.get({ gameState: INITIAL_STATE });
    return data.gameState;
}

/**
 * Saves the game state to storage.
 */
export async function saveGameState(state) {
    state.lastUpdated = new Date().toISOString();
    await chrome.storage.local.set({ gameState: state });
}

/**
 * Checks if it is currently Fever Time (18:00 - 22:00 local time).
 */
export function isFeverTime() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= FEVER_START_HOUR && hour < FEVER_END_HOUR;
}

/**
 * Calculates the score for closing tabs.
 * @param {number} normalCount Number of normal tabs closed
 * @param {number} blankCount Number of blank/new tabs closed (penalty)
 */
export function calculateScore(normalCount, blankCount) {
    let multiplier = 1;
    if (isFeverTime()) {
        multiplier = FEVER_MULTIPLIER;
    }

    const normalScore = normalCount * BASE_SCORE_CLOSE * multiplier;
    const penaltyScore = blankCount * SCORE_PENALTY_BLANK; // No multiplier for negative? Or yes? Usually penalties are flat or also multiplied. Let's keep flat for now unless requested.

    return normalScore + penaltyScore;
}

/**
 * Updates the state after closing tabs.
 * @param {number} normalCount Number of normal tabs closed
 * @param {number} blankCount Number of blank tabs closed
 * @returns {object} The updated state and score delta
 */
export async function processTabClose(normalCount, blankCount = 0) {
    if (normalCount <= 0 && blankCount <= 0) return null;

    const state = await loadGameState();
    const scoreDelta = calculateScore(normalCount, blankCount);
    const totalCount = normalCount + blankCount;

    state.karma += scoreDelta;
    state.totalTabsClosed += totalCount;

    // Check for badges (Simple examples)
    if (state.totalTabsClosed >= 100 && !state.badges.includes('novice_cleaner')) {
        state.badges.push('novice_cleaner');
    }

    await saveGameState(state);

    return {
        newState: state,
        addedKarma: scoreDelta,
        isFever: isFeverTime()
    };
}

/**
 * gamification.js
 * Handles game state, scoring (Karma), and Fever Time logic.
 */

const FEVER_START_HOUR = 18;
const FEVER_END_HOUR = 22;
const BASE_SCORE_CLOSE = 10;
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
 * Calculates the score for closing a certain number of tabs.
 * @param {number} count Number of tabs closed
 */
export function calculateScore(count) {
    let multiplier = 1;
    if (isFeverTime()) {
        multiplier = FEVER_MULTIPLIER;
    }
    return count * BASE_SCORE_CLOSE * multiplier;
}

/**
 * Updates the state after closing tabs.
 * @param {number} count Number of tabs closed
 * @returns {object} The updated state and score delta
 */
export async function processTabClose(count) {
    if (count <= 0) return null;

    const state = await loadGameState();
    const scoreDelta = calculateScore(count);

    state.karma += scoreDelta;
    state.totalTabsClosed += count;

    // Check for badges (Simple examples)
    // v0.4.1: Add more complex badge logic later
    if (state.totalTabsClosed >= 100 && !state.badges.includes('novice_cleaner')) {
        state.badges.push('novice_cleaner');
        // We might want to notify about new badge here
    }

    await saveGameState(state);

    return {
        newState: state,
        addedKarma: scoreDelta,
        isFever: isFeverTime()
    };
}

/**
 * Resets the daily counters (if we decide to have daily limits/streaks)
 * Call this periodically if needed.
 */
export async function checkDailyReset() {
    // Placeholder for daily streak logic
}

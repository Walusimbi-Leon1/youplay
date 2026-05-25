/**
 * Payout Calculator for YouPlay
 * Calculates earnings (in cents) based on performance and room size
 * All amounts stored as integers (cents) to avoid floating point errors
 */

/**
 * Payout tables for different room sizes
 * Returns the payout in cents for each position
 * Format: position -> cents
 */
const PAYOUT_TABLES = {
  2: [10, 5],
  3: [10, 7, 3],
  4: [10, 8, 5, 2], // Rounded from 7.5, 2.5
  5: [10, 8, 5, 2, 1], // Rounded from 7.5, 2.5
  6: [10, 9, 8, 7, 6, 5],
  7: [10, 9, 8, 7, 6, 5, 4],
  8: [10, 9, 8, 7, 6, 5, 4, 3],
  9: [10, 9, 8, 7, 6, 5, 4, 3, 2],
  10: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
};

/**
 * Calculate payout for a player based on submission position and player count
 * @param {number} position - Submission position (1-indexed, 1st place = position 1)
 * @param {number} totalPlayers - Total number of players in the room
 * @param {string} activityType - Type of activity (quiz, word_fix, speed_type, etc.)
 * @returns {number} - Payout amount in cents (0 for wrong answer or timeout)
 *
 * RULES:
 * - Standard activities: Position-based payout from table
 * - Speed type: Special handling (use calculateSpeedTypePayout instead)
 * - Wrong answer/timeout: Return 0 (position = 0 or undefined)
 *
 * EXAMPLES:
 * - calculatePayout(1, 2, 'quiz') = 10 (first place, 2 players) = $0.10
 * - calculatePayout(2, 2, 'quiz') = 5 (second place, 2 players) = $0.05
 * - calculatePayout(0, 2, 'quiz') = 0 (wrong answer) = $0.00
 * - calculatePayout(1, 5, 'word_fix') = 10 (first place, 5 players) = $0.10
 * - calculatePayout(3, 5, 'word_fix') = 5 (third place, 5 players) = $0.05
 */
export const calculatePayout = (position, totalPlayers, activityType = 'standard') => {
  // Validate inputs
  if (!position || position < 1 || totalPlayers < 1) {
    return 0; // Wrong answer, no submission, or invalid input
  }

  // Speed type has special handling - use dedicated function
  if (activityType === 'speed_type') {
    console.warn('Use calculateSpeedTypePayout() for speed_type activities');
    return 0;
  }

  // Ensure position doesn't exceed totalPlayers
  if (position > totalPlayers) {
    return 0;
  }

  // Get the appropriate payout table
  // For rooms with >10 players, use the 10-player table (decreases by $0.01 per position)
  const playerCount = Math.min(totalPlayers, 10);
  const payoutTable = PAYOUT_TABLES[playerCount];

  if (!payoutTable) {
    console.error(`No payout table for ${playerCount} players`);
    return 0;
  }

  // Get payout for this position (0-indexed array)
  return payoutTable[position - 1] || 0;
};

/**
 * Calculate payout for speed type activity
 * @param {boolean} isCorrect - Whether the answer was correct
 * @param {number} timeRemaining - Seconds remaining (not used for standard payout, but for future bonus features)
 * @returns {number} - Payout amount in cents (10 for correct, 0 for wrong/timeout)
 *
 * RULES:
 * - Correct answer: Always $0.10 (10 cents) regardless of order
 * - Wrong answer or timeout: $0.00 (0 cents)
 *
 * EXAMPLES:
 * - calculateSpeedTypePayout(true, 5) = 10 (correct)
 * - calculateSpeedTypePayout(false, 0) = 0 (timeout/wrong)
 */
export const calculateSpeedTypePayout = (isCorrect, timeRemaining = 0) => {
  return isCorrect ? 10 : 0;
};

/**
 * Format cents amount as a money string
 * @param {number} cents - Amount in cents (integer)
 * @returns {string} - Formatted money string (e.g., "$0.10", "$1.50", "$10.00")
 *
 * EXAMPLES:
 * - formatMoney(10) = "$0.10"
 * - formatMoney(5) = "$0.05"
 * - formatMoney(150) = "$1.50"
 * - formatMoney(1000) = "$10.00"
 * - formatMoney(0) = "$0.00"
 */
export const formatMoney = (cents) => {
  if (typeof cents !== 'number' || cents < 0) {
    return '$0.00';
  }

  const dollars = Math.floor(cents / 100);
  const remainingCents = cents % 100;

  return `$${dollars}.${remainingCents.toString().padStart(2, '0')}`;
};

/**
 * Get payout details for display
 * @param {number} position - Submission position (1-indexed)
 * @param {number} totalPlayers - Total players in room
 * @param {string} activityType - Activity type
 * @returns {object} - { cents, formatted, position }
 *
 * EXAMPLE:
 * getPayoutDetails(1, 4, 'quiz') returns:
 * { cents: 10, formatted: "$0.10", position: 1, totalPlayers: 4 }
 */
export const getPayoutDetails = (position, totalPlayers, activityType = 'standard') => {
  let cents;

  if (activityType === 'speed_type') {
    cents = calculateSpeedTypePayout(position >= 1, 0); // position >= 1 means correct
  } else {
    cents = calculatePayout(position, totalPlayers, activityType);
  }

  return {
    cents,
    formatted: formatMoney(cents),
    position,
    totalPlayers,
    activityType,
  };
};

/**
 * Get all payouts for a room (for display/preview)
 * @param {number} totalPlayers - Total players in room
 * @param {string} activityType - Activity type
 * @returns {array} - Array of payout objects [{position, cents, formatted}, ...]
 *
 * EXAMPLE:
 * getAllPayouts(3, 'quiz') returns:
 * [
 *   { position: 1, cents: 10, formatted: "$0.10" },
 *   { position: 2, cents: 7, formatted: "$0.07" },
 *   { position: 3, cents: 3, formatted: "$0.03" }
 * ]
 */
export const getAllPayouts = (totalPlayers, activityType = 'standard') => {
  const payouts = [];

  for (let position = 1; position <= totalPlayers; position++) {
    const cents =
      activityType === 'speed_type'
        ? calculateSpeedTypePayout(true, 0) // Show full payout for all positions
        : calculatePayout(position, totalPlayers, activityType);

    payouts.push({
      position,
      cents,
      formatted: formatMoney(cents),
    });
  }

  return payouts;
};

/**
 * Calculate total payout for correct answers in a room
 * (Useful for game balance analysis)
 * @param {number} totalPlayers - Total players in room
 * @param {string} activityType - Activity type
 * @returns {number} - Total cents that will be distributed if all players answer correctly
 */
export const getTotalRoomPayout = (totalPlayers, activityType = 'standard') => {
  if (activityType === 'speed_type') {
    return calculateSpeedTypePayout(true, 0) * totalPlayers;
  }

  return getAllPayouts(totalPlayers, activityType).reduce((sum, p) => sum + p.cents, 0);
};

/**
 * Rank System for YouPlay
 * XP based progression system with 8 ranks
 */

const RANKS = [
  { name: 'Rookie', minXP: 0, maxXP: 499, color: '#6b7280' },
  { name: 'Apprentice', minXP: 500, maxXP: 1499, color: '#10b981' },
  { name: 'Scholar', minXP: 1500, maxXP: 3499, color: '#3b82f6' },
  { name: 'Wordsmith', minXP: 3500, maxXP: 6999, color: '#8b5cf6' },
  { name: 'Linguist', minXP: 7000, maxXP: 12999, color: '#f97316' },
  { name: 'Lexicon Master', minXP: 13000, maxXP: 22999, color: '#ef4444' },
  { name: 'Word Wizard', minXP: 23000, maxXP: 37999, color: '#ec4899' },
  { name: 'Word God', minXP: 38000, maxXP: Infinity, color: '#f59e0b' },
];

/**
 * Get rank information from XP amount
 * @param {number} xp - Total XP points
 * @returns {object} - Rank object with name, minXP, maxXP, color
 */
export const getRankFromXP = (xp) => {
  return RANKS.find((rank) => xp >= rank.minXP && xp <= rank.maxXP) || RANKS[0];
};

/**
 * Get XP needed for next rank
 * @param {number} xp - Current XP
 * @returns {number} - XP needed to reach next rank
 */
export const getXPForNextRank = (xp) => {
  const currentRank = getRankFromXP(xp);
  const currentRankIndex = RANKS.findIndex((r) => r.name === currentRank.name);

  if (currentRankIndex === RANKS.length - 1) {
    return 0; // Already at max rank
  }

  const nextRank = RANKS[currentRankIndex + 1];
  return Math.max(0, nextRank.minXP - xp);
};

/**
 * Calculate XP gain based on game performance
 * @param {number} position - Placement (1st, 2nd, 3rd, etc)
 * @param {number} streak - Current win streak
 * @param {string} difficulty - Question difficulty (easy, medium, hard)
 * @returns {number} - XP gained
 */
export const calculateXPGain = (position, streak, difficulty = 'medium') => {
  const baseXP = {
    1: 300,
    2: 200,
    3: 150,
    default: 50,
  };

  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2,
  };

  let streakMultiplier = 1;
  if (streak >= 5) streakMultiplier = 2.0;
  else if (streak >= 3) streakMultiplier = 1.5;

  const base = baseXP[position] || baseXP.default;
  const difficulty_mult = difficultyMultiplier[difficulty] || 1;

  return Math.floor(base * difficulty_mult * streakMultiplier);
};

/**
 * Calculate coins gain based on game performance
 * @param {number} position - Placement (1st, 2nd, 3rd, etc)
 * @param {number} streak - Current win streak
 * @param {string} difficulty - Question difficulty (easy, medium, hard)
 * @returns {number} - Coins gained
 */
export const calculateCoinsGain = (position, streak, difficulty = 'medium') => {
  const baseCoins = {
    1: 150,
    2: 100,
    3: 75,
    default: 25,
  };

  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2,
  };

  let streakMultiplier = 1;
  if (streak >= 5) streakMultiplier = 2.0;
  else if (streak >= 3) streakMultiplier = 1.5;

  const base = baseCoins[position] || baseCoins.default;
  const difficulty_mult = difficultyMultiplier[difficulty] || 1;

  return Math.floor(base * difficulty_mult * streakMultiplier);
};

/**
 * Get current level from XP
 * Level increases every 1000 XP
 * @param {number} xp - Total XP
 * @returns {number} - Current level
 */
export const getLevelFromXP = (xp) => {
  return Math.floor(xp / 1000) + 1;
};

/**
 * Get progress to next level (0-1)
 * @param {number} xp - Total XP
 * @returns {number} - Progress percentage (0-1)
 */
export const getLevelProgress = (xp) => {
  const currentLevel = getLevelFromXP(xp);
  const xpForCurrentLevel = (currentLevel - 1) * 1000;
  const xpForNextLevel = currentLevel * 1000;
  const xpInLevel = xp - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  return xpInLevel / xpNeededForLevel;
};

/**
 * Get progress to next rank (0-1)
 * @param {number} xp - Total XP
 * @returns {number} - Progress percentage (0-1)
 */
export const getRankProgress = (xp) => {
  const currentRank = getRankFromXP(xp);
  const rankIndex = RANKS.findIndex((r) => r.name === currentRank.name);

  if (rankIndex === RANKS.length - 1) {
    return 1; // At max rank
  }

  const xpInRank = xp - currentRank.minXP;
  const xpNeededForRank = currentRank.maxXP - currentRank.minXP + 1;
  return Math.min(1, xpInRank / xpNeededForRank);
};

export const RANK_COLORS = {
  'Rookie': '#6b7280',
  'Apprentice': '#10b981',
  'Scholar': '#3b82f6',
  'Wordsmith': '#8b5cf6',
  'Linguist': '#f97316',
  'Lexicon Master': '#ef4444',
  'Word Wizard': '#ec4899',
  'Word God': '#f59e0b',
};

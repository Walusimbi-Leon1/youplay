/**
 * Card System for YouPlay
 * Manages card generation, activity types, and card selection logic
 */

// Activity type definitions - exactly 10 types
export const ACTIVITY_TYPES = {
  QUIZ: {
    id: 'quiz',
    label: 'Quiz',
    color: '#3b82f6', // blue
    icon: '❓',
    timeLimit: 10,
    description: 'Answer a general knowledge question',
  },
  WORD_FIX: {
    id: 'word_fix',
    label: 'Word Fix',
    color: '#7c3aed', // purple
    icon: '🔤',
    timeLimit: 15,
    description: 'Form a word from scrambled letters',
  },
  SPEED_TYPE: {
    id: 'speed_type',
    label: 'Speed Type',
    color: '#f97316', // orange
    icon: '⚡',
    timeLimit: 30,
    description: 'Type the given sentence as fast as possible',
  },
  FILL_BLANK: {
    id: 'fill_blank',
    label: 'Fill Blank',
    color: '#22c55e', // green
    icon: '📝',
    timeLimit: 15,
    description: 'Fill in the missing word in a sentence',
  },
  WORD_BUILD: {
    id: 'word_build',
    label: 'Word Build',
    color: '#ec4899', // pink
    icon: '🎯',
    timeLimit: 10,
    description: 'Form any valid word containing the given letters',
  },
  WORD_COMPLETE: {
    id: 'word_complete',
    label: 'Word Complete',
    color: '#06b6d4', // cyan
    icon: '✏️',
    timeLimit: 10,
    description: 'Fill in the missing letters of a word',
  },
  MEDIA: {
    id: 'media',
    label: 'Media',
    color: '#ef4444', // red
    icon: '🎬',
    timeLimit: 10,
    description: 'Answer a question about entertainment',
  },
  TRANSLATOR: {
    id: 'translator',
    label: 'Translator',
    color: '#eab308', // yellow
    icon: '🌍',
    timeLimit: 10,
    description: 'Give the English meaning of a word',
  },
  COUNTRY: {
    id: 'country',
    label: 'Country',
    color: '#14b8a6', // teal
    icon: '🗺️',
    timeLimit: 10,
    description: 'Name the country of the given city',
  },
  ELEMENTS: {
    id: 'elements',
    label: 'Elements',
    color: '#6366f1', // indigo
    icon: '⚛️',
    timeLimit: 10,
    description: 'Give the chemical symbol of an element',
  },
};

/**
 * Get all activity types as array
 * @returns {Array} - Array of activity type objects
 */
export const getAllActivityTypes = () => {
  return Object.values(ACTIVITY_TYPES);
};

/**
 * Get activity type by ID
 * @param {string} id - Activity type ID
 * @returns {object} - Activity type object
 */
export const getActivityTypeById = (id) => {
  return Object.values(ACTIVITY_TYPES).find((type) => type.id === id);
};

/**
 * Generate cards for a round
 * Creates 10 cards with each activity type appearing exactly once
 * @returns {Array} - Array of 10 card objects with numbers 1-10 and activity types
 */
export const generateRoundCards = () => {
  const activities = Object.values(ACTIVITY_TYPES);
  const cards = [];

  // Shuffle activities array
  const shuffled = [...activities].sort(() => Math.random() - 0.5);

  // Create cards with numbers 1-10, each with a unique activity
  for (let i = 1; i <= 10; i++) {
    cards.push({
      id: `card_${i}`,
      number: i,
      activityType: shuffled[i - 1].id,
      isFlipped: false,
      isSelected: false,
    });
  }

  return cards;
};

/**
 * Get next card selector based on player rotation
 * @param {Array} playerIds - Array of player IDs in order
 * @param {number} round - Current round number
 * @returns {string} - User ID of the player who should select the card
 */
export const getCardSelectorForRound = (playerIds, round) => {
  if (!playerIds || playerIds.length === 0) return null;
  const index = (round - 1) % playerIds.length;
  return playerIds[index];
};

/**
 * Validate card selection
 * @param {Array} cards - Array of card objects
 * @param {string} cardId - Card ID being selected
 * @returns {boolean} - Is valid selection
 */
export const isValidCardSelection = (cards, cardId) => {
  const card = cards.find((c) => c.id === cardId);
  return card && !card.isSelected;
};

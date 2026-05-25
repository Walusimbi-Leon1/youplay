/**
 * Game Engine for YouPlay
 * Handles room creation, game flow, scoring, and real-time synchronization
 */

import { ref, set, get, update, push, remove, onValue, off } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';
import { fetchQuestionByActivityType } from './questionFetcher';
import { calculatePayout, calculateSpeedTypePayout } from './payoutCalculator';
import {
  calculateXPGain,
  calculateCoinsGain,
  getRankFromXP,
  getLevelFromXP,
} from './rankSystem';
import { v4 as uuidv4 } from 'uuid';
import {
  generateRoundCards,
  getCardSelectorForRound,
  getActivityTypeById,
} from './cardSystem';

/**
 * Generate a unique 6-digit room code
 * @returns {string} - 6 digit room code
 */
export const generateRoomCode = () => {
  return Math.random().toString().slice(2, 8).padEnd(6, '0');
};

/**
 * Create a new game room
 * @param {string} hostId - Host user ID
 * @param {string} hostName - Host username
 * @param {number} maxPlayers - Maximum players (default 8)
 * @param {number} totalRounds - Total rounds (default 10)
 * @returns {object} - Room data
 */
export const createRoom = async (hostId, hostName, maxPlayers = 8, totalRounds = 10) => {
  try {
    const roomCode = generateRoomCode();
    const roomId = uuidv4();
    const now = new Date().getTime();

    // Increment roomsCreated counter on the host's profile (create if missing)
    try {
      const userRef = ref(database, `wordbet/users/${hostId}`);
      const userSnap = await get(userRef);
      let roomsCount = 0;
      if (userSnap.exists() && typeof userSnap.val().roomsCreated === 'number') {
        roomsCount = userSnap.val().roomsCreated;
      }
      roomsCount += 1;
      await update(userRef, { roomsCreated: roomsCount });

      // Build a human-friendly room name based on host name + count
      var roomName = `${hostName} ${roomsCount}`;
    } catch (err) {
      // If updating the user's counter fails, fall back to a simple name
      var roomName = `${hostName}`;
    }

    const roomData = {
      roomCode,
      roomName,
      hostId,
      hostName,
      status: 'waiting',
      createdAt: now,
      maxPlayers,
      currentRound: 0,
      totalRounds,
      players: {
        [hostId]: {
          username: hostName,
          score: 0,
          coins: 0,
          streak: 0,
          isReady: true,
          isConnected: true,
          roundEarnings: 0,
          totalEarnings: 0,
        },
      },
      currentQuestion: null,
      answers: {},
      usedQuestions: {}, // Track used questions per activity type
      questionQueue: {}, // Pre-fetched questions ahead
      submissionOrder: [], // Track order of submissions for payout calculation
      playerSelections: {}, // Track which card each player selected during card_selection phase
    };

    const roomRef = ref(database, `wordbet/rooms/${roomId}`);
    await set(roomRef, roomData);

    return { roomId, ...roomData };
  } catch (error) {
    throw new Error(`Error creating room: ${error.message}`);
  }
};

/**
 * Join an existing room
 * @param {string} roomCode - Room code
 * @param {string} userId - User ID
 * @param {string} username - Username
 * @returns {object} - Room data
 */
export const joinRoom = async (roomCode, userId, username) => {
  try {
    // Find room by code
    const roomsRef = ref(database, 'wordbet/rooms');
    const snapshot = await get(roomsRef);

    if (!snapshot.exists()) {
      throw new Error('No rooms found');
    }

    let targetRoomId = null;
    snapshot.forEach((child) => {
      if (child.val().roomCode === roomCode && child.val().status === 'waiting') {
        targetRoomId = child.key;
      }
    });

    if (!targetRoomId) {
      throw new Error('Room not found or game already started');
    }

    // Add player to room
    const playerRef = ref(database, `wordbet/rooms/${targetRoomId}/players/${userId}`);
    await set(playerRef, {
      username,
      score: 0,
      coins: 0,
      streak: 0,
      isReady: true,
      isConnected: true,
      roundEarnings: 0,
      totalEarnings: 0,
    });

    // Get updated room data
    const roomRef = ref(database, `wordbet/rooms/${targetRoomId}`);
    const roomSnapshot = await get(roomRef);
    return { roomId: targetRoomId, ...roomSnapshot.val() };
  } catch (error) {
    throw new Error(`Error joining room: ${error.message}`);
  }
};

/**
 * Subscribe to active rooms (waiting or playing) and invoke callback with an array of rooms
 * @param {(rooms: Array)} callback
 * @returns {function} unsubscribe
 */
export const subscribeToActiveRooms = (callback) => {
  const roomsRef = ref(database, 'wordbet/rooms');
  const listener = onValue(roomsRef, (snapshot) => {
    const active = [];
    snapshot.forEach((child) => {
      const val = child.val();
      const players = val.players ? Object.keys(val.players).length : 0;
      if (players > 0 && (val.status === 'waiting' || val.status === 'playing')) {
        active.push({ roomId: child.key, ...val, playerCount: players });
      }
    });
    callback(active);
  });

  return () => off(roomsRef);
};

/**
 * Leave a room
 * @param {string} roomId - Room ID
 * @param {string} userId - User ID
 */
export const leaveRoom = async (roomId, userId) => {
  try {
    const playerRef = ref(database, `wordbet/rooms/${roomId}/players/${userId}`);
    await remove(playerRef);
  } catch (error) {
    throw new Error(`Error leaving room: ${error.message}`);
  }
};

/**
 * Update player ready status
 * @param {string} roomId - Room ID
 * @param {string} userId - User ID
 * @param {boolean} isReady - Ready status
 */
export const setPlayerReady = async (roomId, userId, isReady) => {
  try {
    const readyRef = ref(database, `wordbet/rooms/${roomId}/players/${userId}/isReady`);
    await set(readyRef, isReady);
  } catch (error) {
    throw new Error(`Error updating ready status: ${error.message}`);
  }
};

/**
 * Select a card from the grid and start the activity
 * @param {string} roomId - Room ID
 * @param {string} userId - User ID - must be the current card selector
 * @param {string} cardId - Card ID to select
 * @returns {object} - Activity data
 */
export const selectCard = async (roomId, userId, cardId) => {
  try {
    const roomRef = ref(database, `wordbet/rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    const room = roomSnapshot.val();

    // Validate that current user is the card selector
    if (room.cardSelector !== userId) {
      throw new Error('Only the card selector can choose a card');
    }

    // Find the selected card
    const selectedCard = room.cards.find((card) => card.id === cardId);
    if (!selectedCard) {
      throw new Error('Card not found');
    }

    // Check if this user already selected a card
    const playerSelections = room.playerSelections || {};
    if (playerSelections[userId]) {
      throw new Error('You have already selected a card');
    }

    // Store selection in Firebase WITHOUT flipping card or changing phase
    // This allows the 10-second timer to complete before revealing
    const playerSelectionsRef = ref(database, `wordbet/rooms/${roomId}/playerSelections/${userId}`);
    await set(playerSelectionsRef, cardId);

    return {
      success: true,
      cardId: cardId,
      message: 'Card selection stored. Awaiting timer completion...',
    };
  } catch (error) {
    throw new Error(`Error selecting card: ${error.message}`);
  }
};

/**
 * End card selection phase and transition to activity
 * Called when the 10-second selection timer expires
 * @param {string} roomId - Room ID
 * @param {string} userId - User ID (should be the cardSelector)
 * @param {string} selectedCardId - Card ID (if not provided, auto-picks random)
 */
export const endCardSelection = async (roomId, userId, selectedCardId = null) => {
  try {
    const roomRef = ref(database, `wordbet/rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    const room = roomSnapshot.val();

    // Validate that timer is expired and we're in card selection phase
    if (room.roundPhase !== 'card_selection') {
      throw new Error('Not in card selection phase');
    }

    if (room.cardSelector !== userId) {
      throw new Error('Only the card selector can end card selection');
    }

    const playerSelections = room.playerSelections || {};
    let cardIdToUse = selectedCardId || playerSelections[userId];

    // If no selection made, auto-pick random card
    if (!cardIdToUse) {
      const unselectedCards = room.cards.filter(c => !playerSelections[userId] || c.id !== playerSelections[userId]);
      if (unselectedCards.length === 0) {
        throw new Error('No cards available');
      }
      cardIdToUse = unselectedCards[Math.floor(Math.random() * unselectedCards.length)].id;
      // Store the auto-picked selection
      const playerSelectionsRef = ref(database, `wordbet/rooms/${roomId}/playerSelections/${userId}`);
      await set(playerSelectionsRef, cardIdToUse);
    }

    // Find the selected card
    const selectedCard = room.cards.find((card) => card.id === cardIdToUse);
    if (!selectedCard) {
      throw new Error('Selected card not found');
    }

    // Mark all cards as flipped for activity phase
    const updatedCards = room.cards.map((card) =>
      card.id === cardIdToUse ? { ...card, isSelected: true, isFlipped: true } : { ...card, isFlipped: true }
    );

    // Get activity type and fetch dynamic question
    const activityType = selectedCard.activityType;
    const activityDetails = getActivityTypeById(activityType);
    
    // Fetch fresh question dynamically
    let question = await fetchQuestionByActivityType(activityType);
    
    // Track used question in Firebase
    const usedQuestions = room.usedQuestions || {};
    if (!usedQuestions[activityType]) {
      usedQuestions[activityType] = [];
    }
    usedQuestions[activityType].push(question.id);
    
    const now = new Date().getTime();

    // Update room: flip all cards, change phase to activity, load question
    // Start master round timer (30 seconds per round)
    const roundEndsAt = now + 30000; // 30 seconds from now
    
    const updates = {
      selectedCard: selectedCard,
      cards: updatedCards,
      roundPhase: 'activity',
      roundStartedAt: now,
      roundEndsAt: roundEndsAt,
      usedQuestions: usedQuestions,
      currentQuestion: {
        id: question.id,
        type: question.type,
        question: question.question,
        answer: question.answer,
        timeLimit: activityDetails.timeLimit,
        startedAt: now,
        roundNumber: room.currentRound,
        activityType: activityType,
        points: question.points || 100,
      },
      answers: {},
    };

    // Update main room data
    await update(roomRef, updates);

    // Store activity start time for the selector
    const activityStartRef = ref(database, `wordbet/rooms/${roomId}/players/${userId}/activityStartedAt`);
    await set(activityStartRef, now);

    return {
      success: true,
      card: selectedCard,
      question: question,
      message: 'Card selection complete. Activity started.',
    };
  } catch (error) {
    throw new Error(`Error ending card selection: ${error.message}`);
  }
};

/**
 * Start the game
 * @param {string} roomId - Room ID
 */
export const startGame = async (roomId) => {
  try {
    const roomRef = ref(database, `wordbet/rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    const room = roomSnapshot.val();

    // Check if host and at least 1 player
    const playerCount = Object.keys(room.players).length;
    if (playerCount < 1) {
      throw new Error('Need at least 1 player to start game');
    }

    // Create player order array for rotation
    const playerIds = Object.keys(room.players);
    const cards = generateRoundCards();
    
    // Initialize usedQuestions tracking
    const usedQuestions = {};
    const activityTypes = ['quiz', 'word_fix', 'speed_type', 'fill_blank', 'word_build', 'word_complete', 'media', 'translator', 'country', 'elements'];
    activityTypes.forEach(type => {
      usedQuestions[type] = [];
    });

    // Update room status with card system initialized
    await update(roomRef, {
      status: 'playing',
      currentRound: 1,
      playerOrder: playerIds,
      roundPhase: 'card_selection', // Phases: card_selection -> activity
      cards: cards.map((card) => ({
        ...card,
        isFlipped: false,
        isSelected: false,
      })),
      selectedCard: null,
      cardSelector: getCardSelectorForRound(playerIds, 1),
      currentQuestion: null,
      answers: {},
      usedQuestions: usedQuestions,
      questionQueue: {},
      submissionOrder: [],
      playerSelections: {}, // Reset for new round
    });
  } catch (error) {
    throw new Error(`Error starting game: ${error.message}`);
  }
};

/**
 * Submit an answer
 * @param {string} roomId - Room ID
 * @param {string} userId - User ID
 * @param {string} answer - Player's answer
 * @param {number} timeRemaining - Seconds remaining
 * @returns {object} - Answer validation result with earnings
 */
export const submitAnswer = async (roomId, userId, answer, timeRemaining) => {
  try {
    const roomRef = ref(database, `wordbet/rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    const room = roomSnapshot.val();
    const currentQuestion = room.currentQuestion;
    const correctAnswer = currentQuestion.answer.toUpperCase();
    const playerAnswer = answer.toUpperCase();
    const isCorrect = playerAnswer === correctAnswer;

    // Calculate time bonus
    const timeBonus = Math.floor(timeRemaining * 0.5);

    // Track submission order for payout calculation
    let submissionOrder = room.submissionOrder || [];
    const currentSubmissionPosition = submissionOrder.length + 1;

    // Calculate earnings (in cents)
    let earnings = 0;
    if (isCorrect) {
      const activityType = currentQuestion.activityType;
      const totalPlayers = Object.keys(room.players).length;

      if (activityType === 'speed_type') {
        earnings = calculateSpeedTypePayout(true, timeRemaining);
      } else {
        earnings = calculatePayout(currentSubmissionPosition, totalPlayers, activityType);
      }
    }

    // Record answer with earnings
    const answerRef = ref(
      database,
      `wordbet/rooms/${roomId}/answers/${userId}`
    );
    await set(answerRef, {
      answer: playerAnswer,
      submittedAt: new Date().getTime(),
      isCorrect,
      timeBonus: isCorrect ? timeBonus : 0,
      earnings: earnings,
      submissionPosition: currentSubmissionPosition,
    });

    if (isCorrect) {
      // Update submission order
      submissionOrder.push(userId);

      // Update player score and earnings
      const playerRef = ref(database, `wordbet/rooms/${roomId}/players/${userId}`);
      const playerSnapshot = await get(playerRef);
      const player = playerSnapshot.val();

      const points = currentQuestion.points + (isCorrect ? timeBonus : 0);
      const newScore = player.score + points;
      const newStreak = player.streak + 1;
      const newRoundEarnings = (player.roundEarnings || 0) + earnings;
      const newTotalEarnings = (player.totalEarnings || 0) + earnings;

      await update(playerRef, {
        score: newScore,
        streak: newStreak,
        roundEarnings: newRoundEarnings,
        totalEarnings: newTotalEarnings,
      });

      // Update all-time earnings and balance for user profile
      const userRef = ref(database, `wordbet/users/${userId}`);
      const userSnapshot = await get(userRef);
      const user = userSnapshot.val() || {};

      const allTimeEarnings = (user.allTimeEarnings || 0) + earnings;
      const balance = (user.balance || 0) + earnings;

      await update(userRef, {
        allTimeEarnings,
        balance,
      });

      // Update room submission order
      await update(roomRef, {
        submissionOrder,
      });

      return {
        isCorrect: true,
        points,
        newStreak,
        earnings,
        earnedFormatted: `$${(earnings / 100).toFixed(2)}`,
      };
    }

    return { isCorrect: false, points: 0, newStreak: 0, earnings: 0 };
  } catch (error) {
    throw new Error(`Error submitting answer: ${error.message}`);
  }
};

/**
 * Move to next round
 * @param {string} roomId - Room ID
 * @param {array} usedQuestionIds - Already used question IDs
 */
export const endRound = async (roomId, usedQuestionIds = []) => {
  try {
    const roomRef = ref(database, `wordbet/rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    const room = roomSnapshot.val();

    const nextRound = room.currentRound + 1;

    if (nextRound > room.totalRounds) {
      // Game is finished
      await update(roomRef, {
        status: 'finished',
      });
      return { gameEnded: true };
    }

    // Generate new cards for next round
    const newCards = generateRoundCards();
    const nextCardSelector = getCardSelectorForRound(room.playerOrder, nextRound);
    
    // Reset usedQuestions for new round
    const usedQuestions = {};
    const activityTypes = ['quiz', 'word_fix', 'speed_type', 'fill_blank', 'word_build', 'word_complete', 'media', 'translator', 'country', 'elements'];
    activityTypes.forEach(type => {
      usedQuestions[type] = [];
    });

    // Clear answers and update round with new cards
    await update(roomRef, {
      currentRound: nextRound,
      roundPhase: 'card_selection',
      cards: newCards.map((card) => ({
        ...card,
        isFlipped: false,
        isSelected: false,
      })),
      selectedCard: null,
      cardSelector: nextCardSelector,
      currentQuestion: null,
      answers: {},
      usedQuestions: usedQuestions,
      submissionOrder: [],
      playerSelections: {}, // Reset player selections for new round
    });

    return { gameEnded: false, round: nextRound };
  } catch (error) {
    throw new Error(`Error ending round: ${error.message}`);
  }
};

/**
 * End game and update player profiles
 * @param {string} roomId - Room ID
 */
export const endGame = async (roomId) => {
  try {
    const roomRef = ref(database, `wordbet/rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    const room = roomSnapshot.val();

    // Get final scores
    const players = room.players;
    const sortedPlayers = Object.entries(players)
      .sort((a, b) => b[1].score - a[1].score)
      .map(([userId, data], index) => ({
        userId,
        ...data,
        position: index + 1,
      }));

    // Update player profiles with game results
    for (const player of sortedPlayers) {
      const userRef = ref(database, `wordbet/users/${player.userId}`);
      const userSnapshot = await get(userRef);
      const user = userSnapshot.val();

      // Calculate rewards
      const xpGain = calculateXPGain(player.position, player.streak, 'medium');
      const coinsGain = calculateCoinsGain(player.position, player.streak, 'medium');

      const newXP = (user.xp || 0) + xpGain;
      const newCoins = (user.coins || 0) + coinsGain;
      const newWins = player.position === 1 ? (user.totalWins || 0) + 1 : user.totalWins;
      const newRank = getRankFromXP(newXP).name;
      const newLevel = getLevelFromXP(newXP);

      await update(userRef, {
        xp: newXP,
        coins: newCoins,
        totalWins: newWins,
        totalGamesPlayed: (user.totalGamesPlayed || 0) + 1,
        rank: newRank,
        level: newLevel,
        winStreak: player.position === 1 ? (user.winStreak || 0) + 1 : 0,
        bestStreak: Math.max(user.bestStreak || 0, player.position === 1 ? (user.winStreak || 0) + 1 : 0),
      });
    }

    // Update leaderboards
    await updateLeaderboards(sortedPlayers);

    return sortedPlayers;
  } catch (error) {
    throw new Error(`Error ending game: ${error.message}`);
  }
};

/**
 * Update global leaderboards
 * @param {array} sortedPlayers - Players sorted by score
 */
const updateLeaderboards = async (sortedPlayers) => {
  try {
    for (const player of sortedPlayers) {
      const userRef = ref(database, `wordbet/users/${player.userId}`);
      const userSnapshot = await get(userRef);
      const user = userSnapshot.val();

      // Update all-time leaderboard
      const allTimeRef = ref(
        database,
        `wordbet/leaderboard/allTime/${player.userId}`
      );
      await set(allTimeRef, {
        username: user.username,
        totalWins: user.totalWins,
        coins: user.coins,
        rank: user.rank,
        level: user.level,
      });

      // Update weekly leaderboard (simplified)
      const weeklyRef = ref(
        database,
        `wordbet/leaderboard/weekly/${player.userId}`
      );
      const weeklySnapshot = await get(weeklyRef);
      const weeklyData = weeklySnapshot.val() || {
        username: user.username,
        wins: 0,
        coins: 0,
      };

      if (player.position === 1) {
        weeklyData.wins = (weeklyData.wins || 0) + 1;
      }
      weeklyData.coins = (weeklyData.coins || 0) + (player.position <= 3 ? 50 : 10);

      await set(weeklyRef, weeklyData);
    }
  } catch (error) {
    console.error('Error updating leaderboards:', error);
  }
};

/**
 * Subscribe to room updates
 * @param {string} roomId - Room ID
 * @param {function} callback - Callback function
 * @returns {function} - Unsubscribe function
 */
export const subscribeToRoom = (roomId, callback) => {
  const roomRef = ref(database, `wordbet/rooms/${roomId}`);
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
  return unsubscribe;
};

/**
 * Subscribe to leaderboard updates
 * @param {function} callback - Callback function
 * @returns {function} - Unsubscribe function
 */
export const subscribeToLeaderboard = (callback) => {
  const leaderboardRef = ref(database, 'wordbet/leaderboard/allTime');
  const unsubscribe = onValue(leaderboardRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const sorted = Object.entries(data)
        .map(([userId, user]) => ({ userId, ...user }))
        .sort((a, b) => b.totalWins - a.totalWins);
      callback(sorted);
    }
  });
  return unsubscribe;
};

export const subscribeToWeeklyLeaderboard = (callback) => {
  const leaderboardRef = ref(database, 'wordbet/leaderboard/weekly');
  const unsubscribe = onValue(leaderboardRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const sorted = Object.entries(data)
        .map(([userId, user]) => ({ userId, ...user }))
        .sort((a, b) => b.wins - a.wins);
      callback(sorted);
    }
  });
  return unsubscribe;
};

/**
 * Subscribe to coins leaderboard (ranked by money)
 * @param {function} callback - Callback function
 * @returns {function} - Unsubscribe function
 */
export const subscribeToCoinsLeaderboard = (callback) => {
  const usersRef = ref(database, 'wordbet/users');
  const unsubscribe = onValue(usersRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const sorted = Object.entries(data)
        .map(([userId, user]) => ({
          userId,
          username: user.username || 'Unknown',
          coins: user.coins || 0,
          dailyStreak: user.dailyStreak || 0,
        }))
        .sort((a, b) => b.coins - a.coins);
      callback(sorted);
    } else {
      callback([]);
    }
  });
  return unsubscribe;
};

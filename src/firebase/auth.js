import { ref, set, get, update } from 'firebase/database';
import { database } from './firebaseConfig';

const getDiscordAvatarUrl = (user) => {
  if (user.avatar && !user.avatar.startsWith('http')) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  }

  if (user.avatar) {
    return user.avatar;
  }

  const fallbackIndex = Number(user.discriminator || 0) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${fallbackIndex}.png`;
};

const generateGuestId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `guest_${crypto.randomUUID()}`;
  }
  return `guest_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
};

const getDisplayUsername = (user) => {
  if (user.global_name) {
    return user.global_name;
  }

  if (user.username && user.discriminator) {
    return `${user.username}#${user.discriminator}`;
  }

  return user.username || 'Discord Player';
};

export const createOrUpdateDiscordUserProfile = async (user) => {
  try {
    const userRef = ref(database, `wordbet/users/${user.id}`);
    const snapshot = await get(userRef);
    const now = new Date().getTime();
    const profileData = {
      username: getDisplayUsername(user),
      discordUsername: user.username,
      discriminator: user.discriminator,
      discordUserId: user.id,
      avatarUrl: getDiscordAvatarUrl(user),
      updatedAt: now,
    };

    if (!snapshot.exists()) {
      const initialData = {
        ...profileData,
        createdAt: now,
        level: 1,
        xp: 0,
        coins: 0,
        rank: 'Rookie',
        totalGamesPlayed: 0,
        totalWins: 0,
        winStreak: 0,
        bestStreak: 0,
        badges: {},
        roomsCreated: 0,
        dailyStreak: 1,
        lastVisit: now,
      };
      await set(userRef, initialData);
      return initialData;
    }

    await update(userRef, profileData);
    return { ...snapshot.val(), ...profileData };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const createGuestUserProfile = async (username) => {
  try {
    const userId = generateGuestId();
    const userRef = ref(database, `wordbet/users/${userId}`);
    const now = new Date().getTime();
    const initialData = {
      userId,
      username,
      isGuest: true,
      createdAt: now,
      coins: 0,
      level: 1,
      rank: 'Rookie',
      xp: 0,
      totalGamesPlayed: 0,
      totalWins: 0,
      winStreak: 0,
      bestStreak: 0,
      badges: {},
      roomsCreated: 0,
      dailyStreak: 1,
      lastVisit: now,
      updatedAt: now,
    };

    await set(userRef, initialData);
    return initialData;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = ref(database, `wordbet/users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateUserProfile = async (userId, data) => {
  try {
    const userRef = ref(database, `wordbet/users/${userId}`);
    await update(userRef, data);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Record a daily visit for a user. Increments `dailyStreak` if visit is consecutive, resets if missed.
 * Returns the updated profile object.
 */
export const recordDailyVisit = async (userId) => {
  try {
    const userRef = ref(database, `wordbet/users/${userId}`);
    const snapshot = await get(userRef);
    const now = new Date().getTime();

    if (!snapshot.exists()) {
      throw new Error('User not found');
    }

    const profile = snapshot.val();
    const last = profile.lastVisit || 0;

    const msPerDay = 24 * 60 * 60 * 1000;
    const lastDay = Math.floor(last / msPerDay);
    const nowDay = Math.floor(now / msPerDay);

    let dailyStreak = profile.dailyStreak || 0;

    if (lastDay === nowDay) {
      // already visited today — no change
    } else if (lastDay === nowDay - 1) {
      // consecutive day
      dailyStreak = (dailyStreak || 0) + 1;
    } else {
      // missed a day or first visit
      dailyStreak = 1;
    }

    await update(userRef, { dailyStreak, lastVisit: now, updatedAt: now });

    const updatedSnap = await get(userRef);
    return updatedSnap.val();
  } catch (error) {
    throw new Error(error.message);
  }
};

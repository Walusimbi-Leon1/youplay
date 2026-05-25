import React, { createContext, useState, useEffect } from 'react';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import {
  createGuestUserProfile,
  createOrUpdateDiscordUserProfile,
  getUserProfile,
  updateUserProfile,
} from '../firebase/auth';
import { recordDailyVisit } from '../firebase/auth';

export const AuthContext = createContext();

const STORAGE_KEY = 'youplay_discord_user';

const getDiscordAvatarUrl = (user) => {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  }

  const fallbackIndex = Number(user.discriminator || 0) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${fallbackIndex}.png`;
};

const getStoredSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveSession = (session) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
};

const clearSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = getStoredSession();
      if (!storedUser) {
        setLoading(false);
        return;
      }

      try {
        let profile = await getUserProfile(storedUser.id);
        if (profile) {
          // record today's visit and get updated profile
          try {
            profile = await recordDailyVisit(storedUser.id);
          } catch (e) {
            console.warn('recordDailyVisit failed:', e.message || e);
          }
          setUserProfile(profile);
          setCurrentUser(storedUser);
        } else {
          const newProfile = await createOrUpdateDiscordUserProfile(storedUser);
          // record visit for the newly created profile
          try {
            const updated = await recordDailyVisit(storedUser.id);
            setUserProfile(updated);
          } catch (e) {
            setUserProfile(newProfile);
          }
          setCurrentUser(storedUser);
        }
      } catch (error) {
        console.error('Error restoring Discord session:', error);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginWithDiscord = async () => {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
    if (!clientId) {
      throw new Error('Discord client ID is not configured. Add VITE_DISCORD_CLIENT_ID to your environment.');
    }

    try {
      const sdk = new DiscordSDK(clientId);
      await sdk.ready();

      const authorizeResponse = await sdk.commands.authorize({ scopes: ['identify'] });
      const authResponse = await sdk.commands.authenticate({ access_token: authorizeResponse.code });

      const discordUser = authResponse.user;
      if (!discordUser?.id) {
        throw new Error('Discord authorization failed.');
      }

      let profile = await createOrUpdateDiscordUserProfile(discordUser);
      try {
        profile = await recordDailyVisit(discordUser.id);
      } catch (e) {
        // ignore visit update errors
      }
      const appUser = {
        id: discordUser.id,
        uid: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        avatarUrl: getDiscordAvatarUrl(discordUser),
        isGuest: false,
      };

      setCurrentUser(appUser);
      setUserProfile(profile);
      saveSession(appUser);

      return appUser;
    } catch (err) {
      const friendly = err?.message || String(err);
      throw new Error(
        `Discord login failed: ${friendly}.\nNote: the Discord Embedded SDK requires the app to run inside the Discord client (it expects a "frame_id" query param).\nOpen the app inside Discord to sign in.`
      );
    }
  };

  const loginAsGuest = async (username) => {
    if (!username || !username.trim()) {
      throw new Error('Please enter a username to continue.');
    }

    let profile = await createGuestUserProfile(username.trim());
    try {
      profile = await recordDailyVisit(profile.userId);
    } catch (e) {
      // ignore
    }
    const appUser = {
      id: profile.userId,
      uid: profile.userId,
      username: profile.username,
      isGuest: true,
    };

    setCurrentUser(appUser);
    setUserProfile(profile);
    saveSession(appUser);

    return appUser;
  };

  const logout = async () => {
    clearSession();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    loginWithDiscord,
    loginAsGuest,
    logout,
    updateUserProfile,
    getUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

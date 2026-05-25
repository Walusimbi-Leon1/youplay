import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { currentUser, loginWithDiscord, loginAsGuest } = useAuth();
  const isEmbedded = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('frame_id');
  const [loading, setLoading] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleDiscordLogin = async () => {
    setLoading(true);
    try {
      await loginWithDiscord();
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Unable to authenticate with Discord');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestStart = async () => {
    if (!guestName.trim()) {
      toast.error('Please enter a username to continue.');
      return;
    }

    setLoading(true);
    try {
      await loginAsGuest(guestName.trim());
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Unable to start guest session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrapper landing-page">
      <section className="hero-card card landing-card">
        <div className="hero-copy">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            YouPlay
          </motion.h1>
          <p className="hero-subtitle">
            Multiplayer word battles. Play instantly with friends anywhere — no account required.
          </p>

          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={handleDiscordLogin}
              disabled={loading || !isEmbedded}
              title={!isEmbedded ? 'Open inside Discord to sign in with Discord' : ''}
            >
              {loading ? 'Connecting...' : 'Play with Discord'}
            </button>
            <button className="btn btn-guest" onClick={() => setGuestMode(!guestMode)} disabled={loading}>
              Play as Guest
            </button>
          </div>

          {!isEmbedded && (
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              This app must be opened inside the Discord client to sign in with Discord. Choose "Play as Guest" or open the app inside Discord.
            </p>
          )}

          {guestMode && (
            <div className="guest-card card">
              <h3>Play as Guest</h3>
              <p>Enter a display name to join the game immediately.</p>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Choose your username"
                className="guest-input"
              />
              <button className="btn btn-secondary guest-start" onClick={handleGuestStart} disabled={loading}>
                {loading ? 'Starting...' : 'Start Playing'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Landing;

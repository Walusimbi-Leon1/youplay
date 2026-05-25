import React from 'react';
import { useAuth } from '../hooks/useAuth';
import RankBadge from '../components/RankBadge.jsx';
import { getLevelProgress } from '../utils/rankSystem';

const Profile = () => {
  const { userProfile } = useAuth();
  const progress = getLevelProgress(userProfile?.xp || 0);

  return (
    <main className="page-wrapper profile-page">
      <div className="card profile-card">
        <div className="profile-header">
          <div className="avatar-circle">
            {userProfile?.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt={userProfile?.username || 'Avatar'} />
            ) : (
              userProfile?.username?.charAt(0) || '😀'
            )}
          </div>
          <div>
            <h1>{userProfile?.username || 'Player'}</h1>
            <RankBadge rank={userProfile?.rank || 'Rookie'} size="lg" showXP xp={userProfile?.xp || 0} />
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-stat card mini-card">
            <span>Games played</span>
            <strong>{userProfile?.totalGamesPlayed || 0}</strong>
          </div>
          <div className="profile-stat card mini-card">
            <span>Wins</span>
            <strong>{userProfile?.totalWins || 0}</strong>
          </div>
          <div className="profile-stat card mini-card">
            <span>Best streak</span>
            <strong>{userProfile?.bestStreak || 0}</strong>
          </div>
          <div className="profile-stat card mini-card">
            <span>Win rate</span>
            <strong>{userProfile?.totalGamesPlayed ? `${Math.round((userProfile.totalWins / userProfile.totalGamesPlayed) * 100)}%` : '0%'}</strong>
          </div>
        </div>

        <div className="xp-progress card mini-card">
          <div className="progress-row">
            <span>Level progress</span>
            <strong>{Math.round(progress * 100)}%</strong>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        <div className="badge-collection card mini-card">
          <h2>Badge collection</h2>
          <div className="badges-grid">
            <span className="badge-item">⚡ Quick Thinker</span>
            <span className="badge-item">🧩 Puzzle Master</span>
            <span className="badge-item">🏆 Rising Star</span>
            <span className="badge-item">🔥 Flawless Sprint</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Profile;

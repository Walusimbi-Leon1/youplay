import React, { useEffect, useState } from 'react';
import { subscribeToLeaderboard, subscribeToWeeklyLeaderboard } from '../utils/gameEngine';
import { useAuth } from '../hooks/useAuth';

const Leaderboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('allTime');
  const [allTime, setAllTime] = useState([]);
  const [weekly, setWeekly] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((players) => {
      setAllTime(players);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToWeeklyLeaderboard((players) => {
      setWeekly(players);
    });
    return unsubscribe;
  }, []);

  const topList = activeTab === 'allTime' ? allTime : weekly;

  return (
    <main className="page-wrapper leaderboard-page">
      <div className="card leaderboard-card page-card">
        <div className="leaderboard-header">
          <div>
            <h1>Leaderboard</h1>
            <p>See the top players dominating YouPlay.</p>
          </div>
          <div className="leaderboard-tabs">
            <button className={`tab-btn ${activeTab === 'allTime' ? 'active' : ''}`} onClick={() => setActiveTab('allTime')}>
              All Time
            </button>
            <button className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`} onClick={() => setActiveTab('weekly')}>
              Weekly
            </button>
          </div>
        </div>

        <div className="leaderboard-list">
          {topList.length === 0 ? (
            <div className="empty-state">No leaderboard data yet.</div>
          ) : (
            topList.map((player, index) => (
              <div key={player.userId} className={`leaderboard-row ${player.userId === currentUser?.uid ? 'highlight' : ''}`}>
                <span>{index + 1}. {player.username}</span>
                <span>{activeTab === 'allTime' ? `${player.totalWins || 0} wins` : `${player.wins || 0} wins`}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default Leaderboard;

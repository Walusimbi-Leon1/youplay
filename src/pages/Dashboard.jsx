import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { createRoom, joinRoom, subscribeToCoinsLeaderboard, subscribeToActiveRooms } from '../utils/gameEngine';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [hasRoomCode, setHasRoomCode] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeRooms, setActiveRooms] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToCoinsLeaderboard((players) => {
      setLeaderboard(players.slice(0, 5));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToActiveRooms((rooms) => {
      setActiveRooms(rooms);
    });
    return unsubscribe;
  }, []);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const room = await createRoom(currentUser?.uid || '', userProfile.username || 'Guest');
      toast.success('Room created!');
      navigate(`/room/${room.roomId}`);
    } catch (error) {
      toast.error(error.message || 'Could not create room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!hasRoomCode) {
      toast.error('Enter a room code');
      return;
    }

    setIsCreating(true);
    try {
      const room = await joinRoom(hasRoomCode.trim(), currentUser?.uid || '', userProfile.username || 'Guest');
      toast.success('Joined room successfully');
      navigate(`/room/${room.roomId}`);
    } catch (error) {
      toast.error(error.message || 'Unable to join room');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="page-wrapper dashboard-page">
      <div className="page-header">
        <div>
          <h1>Welcome back, {userProfile?.username || 'Player'}.</h1>
          <p>Rank: {userProfile?.rank || 'Rookie'} • Level {userProfile?.level || 1}</p>
        </div>
      </div>

      <div className="grid-layout">
        <section className="card action-card">
          <h2>Quick actions</h2>
          <div className="dashboard-actions">
            <button className="btn btn-primary" onClick={handleCreateRoom} disabled={isCreating}>
              {isCreating ? 'Starting...' : 'CREATE ROOM'}
            </button>
            <div className="active-rooms-panel">
              <h3>Active rooms</h3>
              {activeRooms.length === 0 && <p>No active rooms right now.</p>}
              <div className="rooms-list">
                {activeRooms.map((r) => (
                  <div key={r.roomId} className="room-item">
                    <div>
                      <strong>{r.roomName || r.roomCode}</strong>
                      <div className="muted">Host: {r.hostName} • Players: {r.playerCount}</div>
                    </div>
                    <div>
                      <button
                        className="btn btn-secondary"
                        onClick={async () => {
                          setIsCreating(true);
                          try {
                            const room = await joinRoom(r.roomCode, currentUser?.uid || '', userProfile.username || 'Guest');
                            toast.success('Joined room successfully');
                            navigate(`/room/${room.roomId}`);
                          } catch (error) {
                            toast.error(error.message || 'Unable to join room');
                          } finally {
                            setIsCreating(false);
                          }
                        }}
                        disabled={isCreating}
                      >
                        JOIN
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid-layout">
        <section className="card history-card">
          <h2>Recent games</h2>
          <div className="recent-list">
            <div className="recent-item">
              <span>Night Puzzle Rush</span>
              <span>+120 XP</span>
            </div>
            <div className="recent-item">
              <span>Speed Typer</span>
              <span>+80 XP</span>
            </div>
            <div className="recent-item">
              <span>Ranked Word Battle</span>
              <span>+150 XP</span>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => toast.success('Daily challenge ready!')}>
            Daily Challenge
          </button>
        </section>

        <section className="card leaderboard-card">
          <h2>Top Rankings (by coins)</h2>
          <div className="leaderboard-list">
            {leaderboard.map((player, index) => (
              <div key={player.userId} className="leaderboard-row">
                <span>{index + 1}. {player.username}</span>
                <div className="leaderboard-stats">
                  <strong>💵 {player.coins}</strong>
                  <span>🔥 {player.dailyStreak}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;

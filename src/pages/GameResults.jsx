import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { subscribeToRoom, endGame } from '../utils/gameEngine';
import LoadingScreen from '../components/LoadingScreen';

const GameResults = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = subscribeToRoom(roomId, (roomData) => {
      setRoom(roomData);
      if (roomData?.status === 'finished') {
        const players = Object.entries(roomData.players || {}).map(([userId, player]) => ({ userId, ...player }));
        const sorted = players.sort((a, b) => b.score - a.score);
        setResults(sorted);
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (room?.status !== 'finished' && room?.currentRound >= room?.totalRounds) {
      endGame(roomId).catch(console.error);
    }
  }, [room, roomId]);

  if (!room) {
    return <LoadingScreen />;
  }

  return (
    <main className="page-wrapper results-page">
      <div className="card results-card">
        <h1>Game Results</h1>
        <p>Final standings for room {room.roomCode}</p>

        <div className="results-grid">
          {results.map((player, index) => (
            <div key={player.userId} className={`result-row ${index === 0 ? 'winner' : ''}`}>
              <div>
                <span className="result-position">#{index + 1}</span>
                <strong>{player.username}</strong>
              </div>
              <div>{player.score} pts</div>
            </div>
          ))}
        </div>

        <div className="result-actions">
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/room/${roomId}`)}>
            Revisit Room
          </button>
        </div>
      </div>
    </main>
  );
};

export default GameResults;

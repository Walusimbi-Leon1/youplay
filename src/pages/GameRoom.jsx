import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { subscribeToRoom, setPlayerReady, startGame, leaveRoom } from '../utils/gameEngine';

const GameRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [room, setRoom] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToRoom(roomId, (roomData) => {
      setRoom(roomData);
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (room?.status === 'playing') {
      navigate(`/game/${roomId}`);
    }
  }, [room, navigate, roomId]);

  const handleToggleReady = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await setPlayerReady(roomId, currentUser.uid, !isReady);
      setIsReady((prev) => !prev);
    } catch (error) {
      toast.error(error.message || 'Could not update ready status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    setLoading(true);
    try {
      await startGame(roomId);
      toast.success('Game starting!');
    } catch (error) {
      toast.error(error.message || 'Unable to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUser) return;
    await leaveRoom(roomId, currentUser.uid);
    navigate('/dashboard');
  };

  if (!room) {
    return (
      <main className="page-wrapper">
        <div className="card">
          <h2>Loading room...</h2>
        </div>
      </main>
    );
  }

  const players = Object.entries(room.players || {}).map(([id, player]) => ({ userId: id, ...player }));
  const playerCount = players.length;
  const isHost = currentUser?.uid === room.hostId;

  return (
    <main className="page-wrapper room-page">
      <div className="room-header card">
        <div>
          <h1>{room.roomName || room.roomCode}</h1>
          <p>Host: {room.hostName}</p>
        </div>
        <div className="room-actions">
          <button className="btn btn-secondary" onClick={handleLeave}>
            Leave Room
          </button>
        </div>
      </div>

      <div className="card room-body">
        <h2>Players</h2>
        <div className="player-list">
          {players.map((player) => (
            <div key={player.userId} className="player-card">
              <div>
                <strong>{player.username}</strong>
                <div className="player-meta">{player.score} pts • {player.isConnected ? 'Connected' : 'Offline'}</div>
              </div>
              <span>{player.isConnected ? '🟢' : '⚪'}</span>
            </div>
          ))}
        </div>

        <div className="room-footer">
          <p>{playerCount} players connected</p>
          {isHost && (
            <button
              className="btn btn-primary"
              disabled={loading || playerCount < 1}
              onClick={handleStartGame}
            >
              Start Game
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export default GameRoom;

import React from 'react';
import { motion } from 'framer-motion';

const ScoreBoard = ({ players = [], leadingId }) => {
  return (
    <motion.div className="scoreboard card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2>Live scoreboard</h2>
      <div className="score-items">
        {players.map((player) => (
          <div key={player.userId} className={`score-row ${player.userId === leadingId ? 'leader' : ''}`}>
            <div>
              <strong>{player.username}</strong>
              <div className="score-meta">Streak: {player.streak || 0}</div>
            </div>
            <span>{player.score || 0} pts</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ScoreBoard;

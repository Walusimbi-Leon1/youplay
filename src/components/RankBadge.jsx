import React from 'react';
import { motion } from 'framer-motion';
import { RANK_COLORS } from '../utils/rankSystem';
import './RankBadge.css';

const RankBadge = ({ rank, size = 'md', showXP = false, xp = 0 }) => {
  const rankColor = RANK_COLORS[rank] || RANK_COLORS['Rookie'];

  const sizeClasses = {
    sm: 'rank-badge-sm',
    md: 'rank-badge-md',
    lg: 'rank-badge-lg',
  };

  return (
    <motion.div
      className={`rank-badge ${sizeClasses[size]}`}
      style={{ borderColor: rankColor, color: rankColor }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="rank-badge-content">
        <span className="rank-icon">⭐</span>
        <div>
          <div className="rank-name">{rank}</div>
          {showXP && <div className="rank-xp">{xp} XP</div>}
        </div>
      </div>
    </motion.div>
  );
};

export default RankBadge;

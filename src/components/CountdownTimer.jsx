import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './CountdownTimer.css';

const CountdownTimer = ({ timeLimit = 30, onTimeUp, isActive = true }) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  // Reset timeRemaining when timeLimit prop changes
  useEffect(() => {
    setTimeRemaining(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (!isActive || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          onTimeUp?.();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp]);

  const percentage = (timeRemaining / timeLimit) * 100;
  let colorClass = 'timer-green';
  let isFlashing = false;

  // Color states:
  // Flashing red: ≤ 3 seconds
  // Red: ≤ 5 seconds
  // Yellow: ≤ half time (or 50% of timeLimit)
  // Green: > half time
  
  if (timeRemaining <= 3) {
    colorClass = 'timer-red';
    isFlashing = true;
  } else if (timeRemaining <= 5) {
    colorClass = 'timer-red';
  } else if (percentage <= 50) {
    colorClass = 'timer-yellow';
  }

  return (
    <div className={`countdown-timer ${colorClass} ${isFlashing ? 'flashing' : ''}`}>
      <motion.svg
        className="timer-circle"
        viewBox="0 0 100 100"
        animate={percentage <= 10 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: percentage <= 10 ? Infinity : 0, duration: 0.5 }}
      >
        <circle className="timer-bg" cx="50" cy="50" r="45" />
        <circle
          className="timer-progress"
          cx="50"
          cy="50"
          r="45"
          style={{
            strokeDashoffset: 283 - (283 * percentage) / 100,
          }}
        />
      </motion.svg>
      <div className="timer-text">{timeRemaining}s</div>
    </div>
  );
};

export default CountdownTimer;

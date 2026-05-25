import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import './CoinAnimation.css';

/**
 * Floating earnings animation
 * @param {number} amount - Amount in cents (e.g., 10 = $0.10)
 * @param {function} onComplete - Callback when animation ends
 * @param {string} type - Animation type: 'coins', 'earnings', 'bonus' (default: 'earnings')
 */
const CoinAnimation = ({ amount, onComplete, type = 'earnings' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Format amount as money
  const formatMoney = (cents) => {
    const dollars = Math.floor(cents / 100);
    const remainingCents = cents % 100;
    return `$${dollars}.${remainingCents.toString().padStart(2, '0')}`;
  };

  const displayAmount = formatMoney(amount);

  return (
    <motion.div
      className={`coin-animation coin-animation--${type}`}
      initial={{ opacity: 0, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -100, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: 'easeOut' }}
    >
      <span className="coin-animation__text">
        {type === 'earnings' && '💰 '}
        +{displayAmount}
      </span>
    </motion.div>
  );
};

export default CoinAnimation;

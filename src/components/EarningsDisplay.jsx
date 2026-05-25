import React from 'react';
import './EarningsDisplay.css';

/**
 * Display player's earnings for current round
 * Shows on scoreboard and game UI
 */
const EarningsDisplay = ({ 
  roundEarnings = 0,
  totalEarnings = 0,
  format = 'round', // 'round', 'total', 'both'
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const formatMoney = (cents) => {
    const dollars = Math.floor(cents / 100);
    const remainingCents = cents % 100;
    return `$${dollars}.${remainingCents.toString().padStart(2, '0')}`;
  };

  const sizeClass = `earnings-display--${size}`;
  const formatClass = `earnings-display--${format}`;

  if (format === 'round') {
    return (
      <div className={`earnings-display ${sizeClass} ${formatClass}`}>
        <span className="earnings-display__label">Round Earnings:</span>
        <span className="earnings-display__amount earnings-display__amount--gold">
          {formatMoney(roundEarnings)}
        </span>
      </div>
    );
  }

  if (format === 'total') {
    return (
      <div className={`earnings-display ${sizeClass} ${formatClass}`}>
        <span className="earnings-display__label">Total Earned:</span>
        <span className="earnings-display__amount earnings-display__amount--gold">
          {formatMoney(totalEarnings)}
        </span>
      </div>
    );
  }

  // Both
  return (
    <div className={`earnings-display ${sizeClass} ${formatClass}`}>
      <div className="earnings-display__row">
        <span className="earnings-display__label">This Round:</span>
        <span className="earnings-display__amount earnings-display__amount--gold">
          {formatMoney(roundEarnings)}
        </span>
      </div>
      <div className="earnings-display__row">
        <span className="earnings-display__label">Game Total:</span>
        <span className="earnings-display__amount earnings-display__amount--gold">
          {formatMoney(totalEarnings)}
        </span>
      </div>
    </div>
  );
};

export default EarningsDisplay;

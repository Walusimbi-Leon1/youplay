import React from 'react';
import './BalanceCard.css';

/**
 * Displays player's earnings summary
 * Shows on dashboard, results page, and profile
 */
const BalanceCard = ({
  balance = 0,
  allTimeEarnings = 0,
  gameEarnings = 0,
  lastGameEarnings = 0,
  mode = 'full', // 'full', 'compact', 'summary'
}) => {
  const formatMoney = (cents) => {
    const dollars = Math.floor(cents / 100);
    const remainingCents = cents % 100;
    return `$${dollars}.${remainingCents.toString().padStart(2, '0')}`;
  };

  if (mode === 'compact') {
    return (
      <div className="balance-card balance-card--compact">
        <div className="balance-card__item">
          <span className="balance-card__label">Current Balance:</span>
          <span className="balance-card__value">{formatMoney(balance)}</span>
        </div>
      </div>
    );
  }

  if (mode === 'summary') {
    return (
      <div className="balance-card balance-card--summary">
        <h3 className="balance-card__title">Earnings Summary</h3>
        <div className="balance-card__row">
          <span className="balance-card__label">Lifetime Earnings:</span>
          <span className="balance-card__value">{formatMoney(allTimeEarnings)}</span>
        </div>
        <div className="balance-card__row">
          <span className="balance-card__label">Last Game:</span>
          <span className="balance-card__value">{formatMoney(lastGameEarnings)}</span>
        </div>
      </div>
    );
  }

  // Full mode
  return (
    <div className="balance-card balance-card--full">
      <div className="balance-card__main">
        <div className="balance-card__balance-section">
          <h2 className="balance-card__title">Your Balance</h2>
          <div className="balance-card__balance-amount">
            {formatMoney(balance)}
          </div>
          <p className="balance-card__subtitle">Withdrawable Balance</p>
        </div>
      </div>

      <div className="balance-card__stats">
        <div className="balance-card__stat">
          <span className="balance-card__stat-label">Lifetime Earnings</span>
          <span className="balance-card__stat-value">
            {formatMoney(allTimeEarnings)}
          </span>
        </div>
        <div className="balance-card__stat">
          <span className="balance-card__stat-label">This Game</span>
          <span className="balance-card__stat-value">
            {formatMoney(gameEarnings)}
          </span>
        </div>
        <div className="balance-card__stat">
          <span className="balance-card__stat-label">Last Game</span>
          <span className="balance-card__stat-value">
            {formatMoney(lastGameEarnings)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;

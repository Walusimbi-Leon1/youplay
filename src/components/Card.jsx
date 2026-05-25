import React from 'react';
import { getActivityTypeById } from '../utils/cardSystem';
import './Card.css';

/**
 * Card component for card selection
 * During selection phase: Cards stay face-down, show bob animation on selection
 * During activity phase: Cards flip to reveal activity type
 */
const Card = ({ 
  card, 
  isSelectable = false, 
  onSelect, 
  cardSelector, 
  currentUserId,
  roundPhase = 'card_selection',
  userSelectedCard = false // Whether current user selected this card
}) => {
  const activityType = getActivityTypeById(card.activityType);
  const isCurrentPlayerSelector = cardSelector === currentUserId;
  // During activity phase, all cards flip to reveal activities
  const shouldFlip = roundPhase === 'activity' || card.isFlipped;
  
  // Check if any player selected this card (for showing indicator to others)
  const hasSelectionIndicator = card.selectionIndicators && Object.keys(card.selectionIndicators).length > 0;
  const otherPlayersSelected = card.selectionIndicators && 
    Object.keys(card.selectionIndicators).filter(id => id !== currentUserId).length > 0;

  const handleCardClick = () => {
    if (isSelectable && isCurrentPlayerSelector && !userSelectedCard && roundPhase === 'card_selection') {
      onSelect(card.id);
    }
  };

  return (
    <div
      className={`card-item ${shouldFlip ? 'flipped' : ''} ${
        isSelectable && isCurrentPlayerSelector && !userSelectedCard ? 'selectable' : ''
      } ${userSelectedCard ? 'user-selected' : ''} ${
        otherPlayersSelected && !userSelectedCard ? 'other-selected' : ''
      }`}
      onClick={handleCardClick}
      style={{
        cursor:
          isSelectable && isCurrentPlayerSelector && !userSelectedCard && roundPhase === 'card_selection'
            ? 'pointer'
            : 'default',
      }}
    >
      <div className="card-inner">
        {/* Face down side */}
        <div className="card-face card-front">
          <div className="card-number">{card.number}</div>
          <div className="card-lock-icon">🔒</div>
        </div>

        {/* Face up side */}
        <div
          className="card-face card-back"
          style={{
            backgroundColor: activityType?.color || '#e5e7eb',
          }}
        >
          <div className="activity-icon">{activityType?.icon}</div>
          <div className="activity-label">{activityType?.label}</div>
        </div>
      </div>

      {/* Selection indicator for current user */}
      {userSelectedCard && roundPhase === 'card_selection' && (
        <div className="card-indicator card-indicator--user">✓</div>
      )}

      {/* Selection indicator for other players */}
      {otherPlayersSelected && roundPhase === 'card_selection' && (
        <div className="card-indicator card-indicator--other" />
      )}
    </div>
  );
};

export default Card;

import React from 'react';
import Card from './Card';
import './CardGrid.css';

/**
 * CardGrid component for displaying 10 cards in a responsive layout
 * @param {Array} cards - Array of card objects
 * @param {boolean} isSelectable - Whether cards can be selected
 * @param {Function} onSelectCard - Callback when card is selected
 * @param {string} cardSelector - ID of player whose turn it is
 * @param {string} currentUserId - Current user ID
 * @param {string} roundPhase - Current phase ('card_selection' or 'activity')
 * @param {Object} playerSelections - Map of userId to cardId (which card they selected)
 */
const CardGrid = ({ 
  cards = [], 
  isSelectable = false, 
  onSelectCard, 
  cardSelector, 
  currentUserId,
  roundPhase = 'card_selection',
  playerSelections = {}
}) => {
  const isCurrentPlayerSelector = cardSelector === currentUserId;
  const currentUserSelectedCardId = playerSelections[currentUserId];

  return (
    <div className="card-grid-container">
      <div className="card-grid-header">
        {roundPhase === 'card_selection' ? (
          <>
            <p className="card-grid-title">Choose a Card</p>
            <p className="card-grid-subtitle">Select a card to reveal the activity</p>
          </>
        ) : (
          <>
            <p className="card-grid-title">Activity Cards</p>
            <p className="card-grid-subtitle">Activities have been revealed</p>
          </>
        )}
      </div>

      <div className="card-grid">
        {cards.map((card) => {
          const userSelected = currentUserSelectedCardId === card.id;
          // Count how many other players selected this card
          const othersSelectedCount = Object.entries(playerSelections)
            .filter(([userId, cardId]) => userId !== currentUserId && cardId === card.id)
            .length;
          
          return (
            <Card
              key={card.id}
              card={card}
              isSelectable={isSelectable && isCurrentPlayerSelector}
              onSelect={onSelectCard}
              cardSelector={cardSelector}
              currentUserId={currentUserId}
              roundPhase={roundPhase}
              userSelectedCard={userSelected}
            />
          );
        })}
      </div>

      {roundPhase === 'card_selection' && (
        <div className="card-selection-info">
          {isCurrentPlayerSelector ? (
            <p className="info-active">✨ It's your turn! Select a card</p>
          ) : (
            <p className="info-waiting">Waiting for player to select a card...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CardGrid;

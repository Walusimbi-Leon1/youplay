import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import CountdownTimer from '../components/CountdownTimer.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import AnswerInput from '../components/AnswerInput.jsx';
import ScoreBoard from '../components/ScoreBoard.jsx';
import CoinAnimation from '../components/CoinAnimation.jsx';
import CardGrid from '../components/CardGrid.jsx';
import { subscribeToRoom, submitAnswer, endRound, selectCard, endCardSelection } from '../utils/gameEngine';
import { getActivityTypeById } from '../utils/cardSystem';

const Game = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [room, setRoom] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [showCoins, setShowCoins] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [selectingCard, setSelectingCard] = useState(false);
  const [selectionTimeRemaining, setSelectionTimeRemaining] = useState(10);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToRoom(roomId, (roomData) => {
      setRoom(roomData);
      // Reset selection timer when entering card_selection phase
      if (roomData.roundPhase === 'card_selection') {
        setSelectionTimeRemaining(10);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (room?.status === 'finished') {
      navigate(`/results/${roomId}`);
    }
  }, [room, navigate, roomId]);

  // Reset submission states when entering a new activity
  useEffect(() => {
    if (room?.roundPhase === 'activity' && currentQuestion) {
      setSubmitted(false);
      setAnswerResult(null);
      setSubmissionMessage('');
      setShowCoins(false);
      setCoinAmount(0);
    }
  }, [room?.currentRound, room?.roundPhase]);

  // Handle selection timer countdown
  useEffect(() => {
    if (room?.roundPhase !== 'card_selection' || !room?.cardSelector) {
      return;
    }

    if (selectionTimeRemaining <= 0) {
      // Timer expired - end card selection and transition to activity
      // Only the card selector can trigger this
      if (room.cardSelector === currentUser?.uid) {
        endCardSelection(roomId, currentUser.uid)
          .then(() => {
            toast.success('Card selection complete!');
          })
          .catch((error) => {
            toast.error(error.message || 'Failed to complete card selection');
          });
      }
      return;
    }

    const timer = setTimeout(() => {
      setSelectionTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectionTimeRemaining, room, currentUser?.uid]);

  const currentQuestion = room?.currentQuestion;
  const roundPhase = room?.roundPhase; // 'card_selection' or 'activity'
  const cards = room?.cards || [];
  const cardSelector = room?.cardSelector;

  const players = useMemo(() => {
    const rawPlayers = Object.entries(room?.players || {}).map(([userId, player]) => ({ userId, ...player }));
    return rawPlayers.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [room]);

  const timeRemaining = useMemo(() => {
    if (!currentQuestion) return 0;
    const elapsed = Math.floor((Date.now() - currentQuestion.startedAt) / 1000);
    return Math.max(0, currentQuestion.timeLimit - elapsed);
  }, [currentQuestion, room]);

  const player = players.find((p) => p.userId === currentUser?.uid);
  const selectorPlayer = players.find((p) => p.userId === cardSelector);

  const handleSelectCard = async (cardId) => {
    if (selectingCard || cardSelector !== currentUser?.uid) return;

    setSelectingCard(true);
    try {
      await selectCard(roomId, currentUser.uid, cardId);
      toast.success('Card selected!');
      setSelectionTimeRemaining(10);
    } catch (error) {
      toast.error(error.message || 'Failed to select card');
    } finally {
      setSelectingCard(false);
    }
  };

  const handleSubmitAnswer = async (value) => {
    if (!currentQuestion || !currentUser || submitted) return;

    setSubmitted(true);

    try {
      const result = await submitAnswer(roomId, currentUser.uid, value, timeRemaining);
      setAnswerResult(result);

      if (result.isCorrect) {
        // Correct answer: show gold animation and success message
        setCoinAmount(result.earnings);
        setShowCoins(true);
        setSubmissionMessage('Correct! Well done');
        toast.success('Great answer!', { duration: 3000 });
      } else {
        // Wrong answer: show error message
        setSubmissionMessage('Wrong answer. Wait for the next round.');
        toast.error('Wrong answer!', { duration: 3000 });
      }
    } catch (error) {
      setSubmissionMessage('Error submitting answer');
      toast.error(error.message || 'Answer failed');
    }
  };

  // Handle timeout - auto-submit as wrong answer
  const handleActivityTimeout = () => {
    if (!submitted && currentUser) {
      setSubmitted(true);
      setAnswerResult({ isCorrect: false, points: 0, earnings: 0 });
      setSubmissionMessage('Time\'s up! Wait for the next round.');
      toast.error('Time\'s up!');
    }
  };

  const handleEndRound = async () => {
    try {
      const next = await endRound(roomId, [currentQuestion?.id]);
      if (next.gameEnded) {
        navigate(`/results/${roomId}`);
      }
      setSubmitted(false);
      setAnswerResult(null);
      setSelectionTimeRemaining(10);
    } catch (error) {
      toast.error(error.message || 'Could not advance round');
    }
  };

  if (!room) {
    return (
      <main className="page-wrapper">
        <div className="card">
          <h2>Waiting for the game to start...</h2>
        </div>
      </main>
    );
  }

  // Card Selection Phase
  if (roundPhase === 'card_selection') {
    return (
      <main className="page-wrapper game-page">
        <div className="game-top card">
          <div>
            <h1>Round {room.currentRound} of {room.totalRounds}</h1>
            <p>Card Selection Phase</p>
            {selectorPlayer && (
              <p className="selector-info">
                {cardSelector === currentUser?.uid
                  ? '✨ Your turn to select a card!'
                  : `Waiting for ${selectorPlayer.username} to select a card...`}
              </p>
            )}
          </div>
          {/* Show countdown timer for all players during selection */}
          <CountdownTimer 
            timeLimit={10} 
            isActive={true}
            onTimeUp={() => setSelectionTimeRemaining(0)}
          />
        </div>

        <div className="game-grid">
          <section className="card selection-panel">
            <CardGrid
              cards={cards}
              isSelectable={true}
              onSelectCard={handleSelectCard}
              cardSelector={cardSelector}
              currentUserId={currentUser?.uid}
              roundPhase={roundPhase}
              playerSelections={room.playerSelections || {}}
            />
          </section>

          <aside className="card scoreboard-panel">
            <ScoreBoard players={players} leadingId={players[0]?.userId} />
          </aside>
        </div>
      </main>
    );
  }

  // Activity Phase
  if (roundPhase === 'activity' && !currentQuestion) {
    return (
      <main className="page-wrapper">
        <div className="card">
          <h2>Loading activity...</h2>
        </div>
      </main>
    );
  }

  // Activity Phase with Question
  if (roundPhase === 'activity' && currentQuestion) {
    return (
      <main className="page-wrapper game-page">
        <div className="game-top card">
          <div>
            <h1>Round {room.currentRound} of {room.totalRounds}</h1>
            <p>Activity: {currentQuestion.type.replace(/_/g, ' ')}</p>
          </div>
          <CountdownTimer timeLimit={currentQuestion.timeLimit} onTimeUp={handleActivityTimeout} />
        </div>

        <div className="game-grid">
          <section className="card question-panel">
            {/* Small card grid showing revealed activities */}
            <div className="activity-cards-grid">
              {cards.map((card) => (
                <div key={card.id} className="activity-card-small">
                  <div className="activity-card-content">
                    <div className="activity-icon-small" style={{color: getActivityTypeById(card.activityType)?.color}}>
                      {getActivityTypeById(card.activityType)?.icon}
                    </div>
                    <div className="activity-label-small">
                      {getActivityTypeById(card.activityType)?.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <QuestionCard question={currentQuestion} />
            <AnswerInput onSubmit={handleSubmitAnswer} disabled={submitted} />
            {submissionMessage && (
              <div className={`answer-feedback ${answerResult?.isCorrect ? 'correct' : 'wrong'}`}>
                {submissionMessage}
              </div>
            )}
            {answerResult?.isCorrect && (
              <div className="submission-status waiting">
                <p>Waiting for round to end...</p>
              </div>
            )}
            <div className="round-summary">
              <span>Streak: {player?.streak || 0}</span>
              <span>Score: {player?.score || 0}</span>
            </div>
            {answerResult && (
              <button className="btn btn-secondary" onClick={handleEndRound}>
                Continue
              </button>
            )}
          </section>

          <aside className="card scoreboard-panel">
            <ScoreBoard players={players} leadingId={players[0]?.userId} />
          </aside>
        </div>

        {showCoins && (
          <CoinAnimation
            amount={coinAmount}
            onComplete={() => setShowCoins(false)}
            type="earnings"
          />
        )}
      </main>
    );
  }

  return (
    <main className="page-wrapper">
      <div className="card">
        <h2>Game state loading...</h2>
      </div>
    </main>
  );
};

export default Game;

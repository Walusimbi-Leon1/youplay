import React from 'react';
import { motion } from 'framer-motion';

const QuestionCard = ({ question }) => {
  const { type, question: text, answer } = question;
  const letters = type === 'scrambled_word' ? question.question.split(' ').pop().split('') : [];

  return (
    <motion.div className="card question-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}> 
      <div className="question-label">{type.replace('_', ' ').toUpperCase()}</div>
      <h2>{text}</h2>
      {type === 'scrambled_word' ? (
        <div className="scrambled-tiles">
          {letters.map((letter, idx) => (
            <motion.span key={`${letter}-${idx}`} className="tile" whileHover={{ scale: 1.05 }}>
              {letter}
            </motion.span>
          ))}
        </div>
      ) : (
        <div className="question-detail">Type your answer below to complete this round.</div>
      )}
      {type === 'speed_type' && <div className="hint">Challenge: type the phrase exactly as shown.</div>}
      {type === 'fill_blank' && <div className="hint">Fill in the blank with the missing word or phrase.</div>}
    </motion.div>
  );
};

export default QuestionCard;

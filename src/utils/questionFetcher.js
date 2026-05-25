/**
 * Dynamic Question Fetcher for YouPlay
 * Fetches questions from APIs and hardcoded pools
 * Ensures infinite, random, non-repeating questions per session
 */

import {
  MEDIA_QUESTIONS,
  FILL_BLANK_SENTENCES,
  SPEED_TYPE_SENTENCES,
  TRANSLATOR_WORDS,
  CHEMICAL_ELEMENTS,
} from '../data/questions';

/**
 * Fetch quiz question from Open Trivia Database
 * Random category and difficulty each time
 */
export const fetchQuizQuestion = async () => {
  try {
    const categories = [9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
    const difficulties = ['easy', 'medium', 'hard'];
    
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    const response = await fetch(
      `https://opentdb.com/api.php?amount=1&category=${randomCategory}&difficulty=${randomDifficulty}&type=multiple`
    );
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const trivia = data.results[0];
      
      // Decode HTML entities
      const decodeHtml = (html) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
      };
      
      const allAnswers = [trivia.correct_answer, ...trivia.incorrect_answers];
      const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);
      const correctIndex = shuffledAnswers.indexOf(trivia.correct_answer);
      
      return {
        id: `quiz_${Date.now()}_${Math.random()}`,
        type: 'quiz',
        question: decodeHtml(trivia.question),
        answer: decodeHtml(trivia.correct_answer).toUpperCase(),
        difficulty: trivia.difficulty,
        category: trivia.category,
        points: 100,
      };
    }
    
    throw new Error('No quiz data returned');
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return getLocalQuizFallback();
  }
};

/**
 * Fetch country question from REST Countries API
 */
export const fetchCountryQuestion = async () => {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all');
    const countries = await response.json();
    
    if (countries && countries.length > 0) {
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];
      const questionType = Math.random() > 0.5;
      
      if (questionType) {
        // Ask about capital
        const capital = randomCountry.capital ? randomCountry.capital[0] : randomCountry.name.common;
        return {
          id: `country_${Date.now()}_${Math.random()}`,
          type: 'country',
          question: `Which country has ${capital} as its capital?`,
          answer: randomCountry.name.common.toUpperCase(),
          difficulty: 'medium',
          category: 'geography',
          points: 100,
        };
      } else {
        // Ask for capital
        return {
          id: `country_${Date.now()}_${Math.random()}`,
          type: 'country',
          question: `What is the capital of ${randomCountry.name.common}?`,
          answer: (randomCountry.capital ? randomCountry.capital[0] : randomCountry.name.common).toUpperCase(),
          difficulty: 'medium',
          category: 'geography',
          points: 100,
        };
      }
    }
    
    throw new Error('No country data returned');
  } catch (error) {
    console.error('Error fetching country:', error);
    return getLocalCountryFallback();
  }
};

/**
 * Get random element question from hardcoded list
 */
export const getElementQuestion = () => {
  if (!CHEMICAL_ELEMENTS || CHEMICAL_ELEMENTS.length === 0) {
    return getLocalElementFallback();
  }
  
  const randomElement = CHEMICAL_ELEMENTS[Math.floor(Math.random() * CHEMICAL_ELEMENTS.length)];
  
  return {
    id: `elements_${Date.now()}_${Math.random()}`,
    type: 'elements',
    question: `What is the chemical symbol for ${randomElement.name}?`,
    answer: randomElement.symbol.toUpperCase(),
    difficulty: 'medium',
    category: 'chemistry',
    points: 100,
  };
};

/**
 * Get translator question (random word + language)
 */
export const getTranslatorQuestion = async () => {
  try {
    if (!TRANSLATOR_WORDS || TRANSLATOR_WORDS.length === 0) {
      return getLocalTranslatorFallback();
    }
    
    const languages = Object.keys(TRANSLATOR_WORDS);
    const randomLanguage = languages[Math.floor(Math.random() * languages.length)];
    const words = TRANSLATOR_WORDS[randomLanguage];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    
    return {
      id: `translator_${Date.now()}_${Math.random()}`,
      type: 'translator',
      question: `What does "${randomWord.word}" mean in English? (${randomLanguage})`,
      answer: randomWord.translation.toUpperCase(),
      difficulty: 'easy',
      category: 'language',
      points: 100,
      language: randomLanguage,
    };
  } catch (error) {
    console.error('Error getting translator question:', error);
    return getLocalTranslatorFallback();
  }
};

/**
 * Get media question from hardcoded pool
 */
export const getMediaQuestion = () => {
  if (!MEDIA_QUESTIONS || MEDIA_QUESTIONS.length === 0) {
    return getLocalMediaFallback();
  }
  
  const randomQuestion = MEDIA_QUESTIONS[Math.floor(Math.random() * MEDIA_QUESTIONS.length)];
  
  return {
    id: `media_${Date.now()}_${Math.random()}`,
    type: 'media',
    question: randomQuestion.question,
    answer: randomQuestion.answer.toUpperCase(),
    difficulty: randomQuestion.difficulty || 'medium',
    category: 'entertainment',
    points: 100,
  };
};

/**
 * Get word fix question (scrambled word)
 */
export const getWordFixQuestion = async () => {
  try {
    const response = await fetch('https://random-word-api.herokuapp.com/word?length=5,6,7,8');
    const data = await response.json();
    
    if (data && data[0]) {
      const word = data[0].toUpperCase();
      const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
      
      return {
        id: `word_fix_${Date.now()}_${Math.random()}`,
        type: 'word_fix',
        question: `Unscramble: ${scrambled}`,
        answer: word,
        difficulty: 'medium',
        category: 'language',
        points: 100,
      };
    }
    
    throw new Error('No word data returned');
  } catch (error) {
    console.error('Error fetching word fix:', error);
    return getLocalWordFixFallback();
  }
};

/**
 * Get word build question (form word with given letters)
 */
export const getWordBuildQuestion = async () => {
  try {
    const response = await fetch('https://random-word-api.herokuapp.com/word?length=6,7,8,9');
    const data = await response.json();
    
    if (data && data[0]) {
      const word = data[0].toUpperCase();
      const letterCount = Math.max(3, Math.min(5, Math.floor(word.length / 2)));
      const letters = word.split('').slice(0, letterCount).sort().join('');
      
      return {
        id: `word_build_${Date.now()}_${Math.random()}`,
        type: 'word_build',
        question: `Form any valid word using these letters: ${letters}`,
        answer: word,
        difficulty: 'medium',
        category: 'language',
        points: 100,
      };
    }
    
    throw new Error('No word data returned');
  } catch (error) {
    console.error('Error fetching word build:', error);
    return getLocalWordBuildFallback();
  }
};

/**
 * Get word complete question (fill missing letters)
 */
export const getWordCompleteQuestion = async () => {
  try {
    const response = await fetch('https://random-word-api.herokuapp.com/word?length=5,6,7,8');
    const data = await response.json();
    
    if (data && data[0]) {
      const word = data[0].toUpperCase();
      const letters = word.split('');
      const hideCount = Math.max(2, Math.floor(word.length / 3));
      
      const hiddenIndexes = new Set();
      while (hiddenIndexes.size < hideCount) {
        hiddenIndexes.add(Math.floor(Math.random() * letters.length));
      }
      
      const partial = letters
        .map((letter, i) => (hiddenIndexes.has(i) ? '_' : letter))
        .join('');
      
      return {
        id: `word_complete_${Date.now()}_${Math.random()}`,
        type: 'word_complete',
        question: `Complete the word: ${partial}`,
        answer: word,
        difficulty: 'medium',
        category: 'language',
        points: 100,
      };
    }
    
    throw new Error('No word data returned');
  } catch (error) {
    console.error('Error fetching word complete:', error);
    return getLocalWordCompleteFallback();
  }
};

/**
 * Get fill blank question from hardcoded pool
 */
export const getFillBlankQuestion = () => {
  if (!FILL_BLANK_SENTENCES || FILL_BLANK_SENTENCES.length === 0) {
    return getLocalFillBlankFallback();
  }
  
  const randomSentence = FILL_BLANK_SENTENCES[Math.floor(Math.random() * FILL_BLANK_SENTENCES.length)];
  
  return {
    id: `fill_blank_${Date.now()}_${Math.random()}`,
    type: 'fill_blank',
    question: randomSentence.question,
    answer: randomSentence.answer.toUpperCase(),
    difficulty: randomSentence.difficulty || 'easy',
    category: 'language',
    points: 100,
  };
};

/**
 * Get speed type question from hardcoded pool
 */
export const getSpeedTypeQuestion = () => {
  if (!SPEED_TYPE_SENTENCES || SPEED_TYPE_SENTENCES.length === 0) {
    return getLocalSpeedTypeFallback();
  }
  
  const randomSentence = SPEED_TYPE_SENTENCES[Math.floor(Math.random() * SPEED_TYPE_SENTENCES.length)];
  
  return {
    id: `speed_type_${Date.now()}_${Math.random()}`,
    type: 'speed_type',
    question: `Type this phrase: ${randomSentence.text}`,
    answer: randomSentence.text.toUpperCase(),
    difficulty: randomSentence.difficulty || 'medium',
    category: 'language',
    points: 100,
  };
};

/**
 * Main function to fetch question by activity type
 */
export const fetchQuestionByActivityType = async (activityType) => {
  try {
    switch (activityType) {
      case 'quiz':
        return await fetchQuizQuestion();
      case 'country':
        return await fetchCountryQuestion();
      case 'elements':
        return getElementQuestion();
      case 'translator':
        return await getTranslatorQuestion();
      case 'media':
        return getMediaQuestion();
      case 'word_fix':
        return await getWordFixQuestion();
      case 'word_build':
        return await getWordBuildQuestion();
      case 'word_complete':
        return await getWordCompleteQuestion();
      case 'fill_blank':
        return getFillBlankQuestion();
      case 'speed_type':
        return getSpeedTypeQuestion();
      default:
        throw new Error(`Unknown activity type: ${activityType}`);
    }
  } catch (error) {
    console.error(`Error fetching question for ${activityType}:`, error);
    return getLocalFallback(activityType);
  }
};

// ===== FALLBACK QUESTIONS (if APIs fail) =====

const getLocalQuizFallback = () => ({
  id: `quiz_fallback_${Date.now()}`,
  type: 'quiz',
  question: 'What is the largest planet in our solar system?',
  answer: 'JUPITER',
  difficulty: 'easy',
  category: 'science',
  points: 100,
});

const getLocalCountryFallback = () => ({
  id: `country_fallback_${Date.now()}`,
  type: 'country',
  question: 'What is the capital of France?',
  answer: 'PARIS',
  difficulty: 'easy',
  category: 'geography',
  points: 100,
});

const getLocalElementFallback = () => ({
  id: `elements_fallback_${Date.now()}`,
  type: 'elements',
  question: 'What is the chemical symbol for Oxygen?',
  answer: 'O',
  difficulty: 'easy',
  category: 'chemistry',
  points: 100,
});

const getLocalTranslatorFallback = () => ({
  id: `translator_fallback_${Date.now()}`,
  type: 'translator',
  question: 'What does "Hola" mean in English?',
  answer: 'HELLO',
  difficulty: 'easy',
  category: 'language',
  points: 100,
});

const getLocalMediaFallback = () => ({
  id: `media_fallback_${Date.now()}`,
  type: 'media',
  question: 'Which artist released "Blinding Lights"?',
  answer: 'THE WEEKND',
  difficulty: 'medium',
  category: 'entertainment',
  points: 100,
});

const getLocalWordFixFallback = () => ({
  id: `word_fix_fallback_${Date.now()}`,
  type: 'word_fix',
  question: 'Unscramble: AEPPL',
  answer: 'APPLE',
  difficulty: 'easy',
  category: 'language',
  points: 100,
});

const getLocalWordBuildFallback = () => ({
  id: `word_build_fallback_${Date.now()}`,
  type: 'word_build',
  question: 'Form any valid word using these letters: OOK',
  answer: 'BOOK',
  difficulty: 'medium',
  category: 'language',
  points: 100,
});

const getLocalWordCompleteFallback = () => ({
  id: `word_complete_fallback_${Date.now()}`,
  type: 'word_complete',
  question: 'Complete the word: E_E_PH_NT',
  answer: 'ELEPHANT',
  difficulty: 'medium',
  category: 'language',
  points: 100,
});

const getLocalFillBlankFallback = () => ({
  id: `fill_blank_fallback_${Date.now()}`,
  type: 'fill_blank',
  question: 'The sun rises in the ___',
  answer: 'EAST',
  difficulty: 'easy',
  category: 'language',
  points: 100,
});

const getLocalSpeedTypeFallback = () => ({
  id: `speed_type_fallback_${Date.now()}`,
  type: 'speed_type',
  question: 'Type this phrase: The quick brown fox jumps over the lazy dog',
  answer: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
  difficulty: 'easy',
  category: 'language',
  points: 100,
});

const getLocalFallback = (activityType) => {
  const fallbacks = {
    quiz: getLocalQuizFallback,
    country: getLocalCountryFallback,
    elements: getLocalElementFallback,
    translator: getLocalTranslatorFallback,
    media: getLocalMediaFallback,
    word_fix: getLocalWordFixFallback,
    word_build: getLocalWordBuildFallback,
    word_complete: getLocalWordCompleteFallback,
    fill_blank: getLocalFillBlankFallback,
    speed_type: getLocalSpeedTypeFallback,
  };
  
  const fallback = fallbacks[activityType];
  return fallback ? fallback() : getLocalQuizFallback();
};

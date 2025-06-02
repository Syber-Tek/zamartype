import { useState, useEffect, useRef, useCallback } from 'react';

// Word bank for generating random sets
const wordBank = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'Qwabiz',
  'Elon', 'Musk','yo', 'technology', 'Ghana','USA','dad', 'mom', 'weather','forest', 'programming', 'arduino', 'spaceX', 
];

const TypingSimulator = () => {
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle, typing, finished
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Track typing history for accuracy calculation
  const [typedHistory, setTypedHistory] = useState([]);
  const [completedWords, setCompletedWords] = useState([]);
  
  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  // Generate random words - FIXED: Removed duplicate dependency array
  const generateWords = useCallback(() => {
    const shuffled = [...wordBank].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 30);
  }, []);

  // Initialize words on component mount
  useEffect(() => {
    setWords(generateWords());
  }, [generateWords]);

  // Timer effect
  useEffect(() => {
    if (status === 'typing' && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 0.1);
      }, 100);
    } else if (status !== 'typing' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status]);

  // Calculate WPM based on completed words
  const calculateWPM = () => {
    if (elapsedTime === 0) return 0;
    const timeInMinutes = elapsedTime / 60;
    const wordsCompleted = completedWords.length;
    const currentWordProgress = currentInput.length > 0 ? currentInput.length / 5 : 0;
    return Math.round((wordsCompleted + currentWordProgress) / timeInMinutes);
  };

  // Calculate accuracy from typing history
  const calculateAccuracy = () => {
    const allTypedChars = typedHistory.length;
    if (allTypedChars === 0) return 100;
    const correctChars = typedHistory.filter(entry => entry.correct).length;
    return Math.round((correctChars / allTypedChars) * 100);
  };

  // Calculate overall performance grade
  const calculateGrade = () => {
    const wpm = calculateWPM();
    const accuracy = calculateAccuracy();
    
    // Combined score: 70% weight on accuracy, 30% weight on speed
    const speedScore = Math.min(wpm / 60 * 100, 100);
    const combinedScore = (accuracy * 0.7) + (speedScore * 0.3);
    
    // Grade boundaries
    if (combinedScore >= 95) return { grade: 'A+', color: 'text-green-400', score: combinedScore };
    if (combinedScore >= 90) return { grade: 'A', color: 'text-green-400', score: combinedScore };
    if (combinedScore >= 85) return { grade: 'A-', color: 'text-green-500', score: combinedScore };
    if (combinedScore >= 80) return { grade: 'B+', color: 'text-blue-400', score: combinedScore };
    if (combinedScore >= 75) return { grade: 'B', color: 'text-blue-400', score: combinedScore };
    if (combinedScore >= 70) return { grade: 'B-', color: 'text-blue-500', score: combinedScore };
    if (combinedScore >= 65) return { grade: 'C+', color: 'text-yellow-400', score: combinedScore };
    if (combinedScore >= 60) return { grade: 'C', color: 'text-yellow-500', score: combinedScore };
    if (combinedScore >= 55) return { grade: 'C-', color: 'text-yellow-600', score: combinedScore };
    if (combinedScore >= 50) return { grade: 'D+', color: 'text-orange-400', score: combinedScore };
    if (combinedScore >= 45) return { grade: 'D', color: 'text-orange-500', score: combinedScore };
    if (combinedScore >= 40) return { grade: 'D-', color: 'text-red-400', score: combinedScore };
    return { grade: 'F', color: 'text-red-500', score: combinedScore };
  };

  // Get performance feedback message
  const getPerformanceMessage = () => {
    const wpm = calculateWPM();
    const accuracy = calculateAccuracy();
    const grade = calculateGrade();
    
    if (grade.grade.startsWith('A')) {
      return accuracy >= 95 ? 'Excellent! Outstanding accuracy and speed!' : 'Great job! Very good performance!';
    }
    if (grade.grade.startsWith('B')) {
      return wpm > 40 ? 'Good speed! Work on accuracy for better results.' : 'Solid performance! Try to increase your speed.';
    }
    if (grade.grade.startsWith('C')) {
      return accuracy < 85 ? 'Focus on accuracy - slow down if needed.' : 'Decent work! Keep practicing to improve speed.';
    }
    if (grade.grade.startsWith('D')) {
      return 'Keep practicing! Focus on accuracy first, then speed.';
    }
    return 'Take your time and focus on accuracy. Speed will come with practice.';
  };

  // Reset function
  const resetTest = () => {
    setWords(generateWords());
    setCurrentInput('');
    setCurrentWordIndex(0);
    setStatus('idle');
    setElapsedTime(0);
    setTypedHistory([]);
    setCompletedWords([]);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    inputRef.current?.focus();
  };

  // Handle key down events
  const handleKeyDown = (e) => {
    if (status === 'idle' && e.key !== 'Tab' && e.key !== 'Shift') {
      setStatus('typing');
    }

    if (status === 'Completed' && e.key === 'Enter') {
      e.preventDefault();
      resetTest();
      return;
    }

    if (e.key === 'Backspace') {
      if (currentInput.length === 0 && currentWordIndex > 0) {
        const previousWord = words[currentWordIndex - 1];
        setCurrentWordIndex(prev => prev - 1);
        setCurrentInput(previousWord);
        setCompletedWords(prev => prev.slice(0, -1));
        setTypedHistory(prev => prev.slice(0, -(previousWord.length + 1)));
      }
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    const currentWord = words[currentWordIndex];
    if (!currentWord) return;

    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      
      for (let i = 0; i < Math.max(typedWord.length, currentWord.length); i++) {
        const typedChar = typedWord[i] || '';
        const expectedChar = currentWord[i] || '';
        const isCorrect = typedChar === expectedChar && typedChar !== '';
      
        setTypedHistory(prev => [...prev, {
          char: typedChar,
          expected: expectedChar,
          correct: isCorrect,
          timestamp: Date.now()
        }]);
      }
      
      setTypedHistory(prev => [...prev, {
        char: ' ',
        expected: ' ',
        correct: true,
        timestamp: Date.now()
      }]);
      
      setCompletedWords(prev => [...prev, {
        typed: typedWord,
        expected: currentWord,
        correct: typedWord === currentWord
      }]);
      
      setCurrentWordIndex(prev => prev + 1);
      setCurrentInput('');
      
      if (currentWordIndex + 1 >= words.length) {
        setStatus('Completed');
      }
      return;
    }

    const newInput = value;
    if (newInput.length > currentWord.length + 10) return;
    
    if (newInput.length > currentInput.length) {
      const addedChar = newInput[newInput.length - 1];
      const expectedChar = currentWord[newInput.length - 1] || '';
      const isCorrect = addedChar === expectedChar;
    
      setTypedHistory(prev => [...prev, {
        char: addedChar,
        expected: expectedChar,
        correct: isCorrect,
        timestamp: Date.now()
      }]);
    } else if (newInput.length < currentInput.length) {
      const removedCount = currentInput.length - newInput.length;
      setTypedHistory(prev => prev.slice(0, -removedCount));
    }
  
    setCurrentInput(newInput);
  };

  // Render word with character highlighting - FIXED: Proper return statement
  const renderWord = (word, wordIndex) => {
    const isCurrentWord = wordIndex === currentWordIndex;
    const isCompletedWord = wordIndex < currentWordIndex;
    const typedWord = isCurrentWord ? currentInput : '';
    const completedWordData = completedWords[wordIndex];

    return (
      <span key={wordIndex} className="relative inline-block mr-3 mb-1">
        {word.split('').map((char, charIndex) => {
          let className = 'text-gray-500';
          
          if (isCurrentWord) {
            if (charIndex < typedWord.length) {
              className = typedWord[charIndex] === char
                ? 'text-green-400'
                : 'text-red-400';
            } else if (charIndex === typedWord.length) {
              className = 'relative text-gray-500';
            }
          } else if (isCompletedWord && completedWordData) {
            const typedChar = completedWordData.typed[charIndex];
            if (typedChar === char) {
              className = 'text-green-400';
            } else if (typedChar) {
              className = 'text-red-400';
            } else {
              className = 'text-gray-600';
            }
          }
          
          return (
            <span key={charIndex} className={className}>
              {char}
              {isCurrentWord && charIndex === typedWord.length && (
                <span className="absolute -top-0.5 left-0 w-0.5 h-7 bg-green-400 animate-pulse"></span>
              )}
            </span>
          );
        })}
        
        {isCurrentWord && typedWord.length > word.length && (
          <>
            <span className="text-red-400">
              {typedWord.slice(word.length)}
            </span>
            <span className="relative">
              <span className="absolute -top-0.5 left-0 w-0.5 h-7 bg-green-400 animate-pulse"></span>
            </span>
          </>
        )}
        
        {isCompletedWord && completedWordData && completedWordData.typed.length > word.length && (
          <span className="text-red-400">
            {completedWordData.typed.slice(word.length)}
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen text-white bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-black bg-green-600 rounded">
            ZT
          </div>
          <span className="text-lg font-light text-gray-300 font-jetbrains">Zamar⚡Type</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center flex-1 p-8 font-jetbrains">
        <div className="w-full max-w-4xl">
        
          {/* Stats display */}
          <div className="flex items-end justify-center mb-8 space-x-8">
            <div className="text-left">
              <div className="text-6xl font-light leading-none text-green-500">
                {calculateWPM()}
              </div>
              <div className="mt-1 text-center text-xl text-gray-400 ">WPM</div>
            </div>
            <div className="text-left">
              <div className="text-6xl font-light leading-none text-green-400">
                {calculateAccuracy()}%
              </div>
              <div className="mt-1 text-xl text-gray-400 text-center">ACCURACY</div>
            </div>
            <div className="text-left">
              <div className={`text-6xl font-light leading-none ${calculateGrade().color}`}>
                {calculateGrade().grade}
              </div>
              <div className="mt-1 text-xl text-gray-400 text-center">GRADE</div>
            </div>
          </div>

          {/* Performance feedback */}
          <div className="mb-8 text-center">
            <div className="mb-2 text-sm text-gray-300">
              Performance Score: <span className={calculateGrade().color}>{Math.round(calculateGrade().score)}/100</span>
            </div>
            <div className="max-w-md mx-auto text-sm text-gray-400">
              {getPerformanceMessage()}
            </div>
          </div>

          {/* Words display */}
          <div className="mb-8 text-center">
            <div className="max-w-4xl mx-auto font-mono text-2xl leading-relaxed text-left">
              {words.map((word, index) => renderWord(word, index))}
            </div>
          </div>

          {/* Hidden input */}
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="absolute opacity-0 -z-10"
            autoFocus
          />

          {/* Status and instructions */}
          <div className="mt-8 text-center">
            <div className="text-sm text-gray-500">
              {status === 'idle' && 'Click here or start typing'}
              {status === 'typing' && 'Keep typing... (Backspace to correct mistakes)'}
              {status === 'finished' && (
                <div>
                  <div className="mb-2">Test completed!</div>
                  <div className={`text-lg font-semibold ${calculateGrade().color} mb-1`}>
                    Final Grade: {calculateGrade().grade} ({Math.round(calculateGrade().score)}/100)
                  </div>
                  <div className="mb-2 text-sm text-gray-400">
                    {getPerformanceMessage()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Press Enter to restart
                  </div>
                </div>
              )}
            </div>
          
            {/* Restart button */}
            <button
              onClick={resetTest}
              className="px-4 py-2 mt-4 text-md text-gray-400 transition-colors hover:text-green-900 rounded-full bg-green-600"
            >
              Restart Test
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mt-8 text-center">
            <div className="text-sm text-gray-600">
              {currentWordIndex}/{words.length}
            </div>
          </div>
        </div>
      </div>

      {/* Click handler for the entire area */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => inputRef.current?.focus()}
      />
    </div>
  );
};

export default TypingSimulator;
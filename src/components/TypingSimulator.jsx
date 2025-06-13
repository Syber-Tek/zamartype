import React, { useState, useEffect, useRef, useCallback } from 'react';
import WordBanks from './WordBanks'; // Corrected import to include .js extension and assume default export

const TypingSimulator = () => {
  // Core state
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle, typing, finished, failed
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Test customization 
  const [testMode, setTestMode] = useState('time'); // 'time' or 'words'
  const [timeLimit, setTimeLimit] = useState(60); // in seconds
  const [wordCount, setWordCount] = useState(50);
  const [difficulty, setDifficulty] = useState('normal'); // normal, expert, master
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [wordLength, setWordLength] = useState('all');

  // Improved tracking state
  const [allTypedChars, setAllTypedChars] = useState([]); // Complete character history
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [completedWords, setCompletedWords] = useState([]);
  const [errors, setErrors] = useState(0); // Track errors for more granular accuracy

  // UI state
  const [isOutOfFocus, setIsOutOfFocus] = useState(false);
  const [showOutOfFocusWarning, setShowOutOfFocusWarning] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(soundEnabled); // Ref for soundEnabled to use in useCallback

  // Refs for DOM elements and intervals
  const inputRef = useRef(null);
  const intervalRef = useRef(null);
  const outOfFocusTimeoutRef = useRef(null);

  // --- NEW: AudioContext management ---
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Initialize AudioContext only once when component mounts
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        // Resume context if it was suspended (e.g., by browser policy)
        if (audioContextRef.current.state === 'suspended') {
          const resumeContext = () => {
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
              audioContextRef.current.resume();
            }
            document.removeEventListener('keydown', resumeContext);
            document.removeEventListener('click', resumeContext);
          };
          // Try to resume on user interaction
          document.addEventListener('keydown', resumeContext, { once: true });
          document.addEventListener('click', resumeContext, { once: true });
        }
      } catch (error) {
        console.error("Failed to create AudioContext:", error);
        audioContextRef.current = null; // Ensure it's null if creation fails
      }
    }

    // Cleanup AudioContext on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
        audioContextRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs once on mount and once on unmount

  // Update the soundEnabled ref whenever soundEnabled state changes
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Enhanced typewriter sound effect - now re-uses the AudioContext
  const playTypewriterSound = useCallback((isCorrect = true, isBackspace = false) => {
    if (!soundEnabledRef.current || !audioContextRef.current || audioContextRef.current.state === 'suspended') {
      return; // Do not play if sound is disabled, context is null, or suspended
    }

    const audioContext = audioContextRef.current; // Use the existing context

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      let frequency = 800;
      let duration = 0.08;
      let volume = 0.15;

      if (isBackspace) {
        frequency = 400;
        duration = 0.06;
        volume = 0.1;
      } else if (!isCorrect) {
        frequency = 200;
        duration = 0.12;
        volume = 0.08;
      } else {
        frequency = 750 + Math.random() * 100;
      }

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  }, []); // Dependencies removed as soundEnabled is accessed via ref and audioContext via ref

  // Generate words based on settings
  const generateWords = useCallback(() => {
    // Crucial check: Ensure WordBanks is loaded and contains data
    if (!WordBanks || !WordBanks.common) {
        console.error("WordBanks not loaded or structure incorrect. Check WordBanks.js");
        return []; // Return empty array to prevent further errors
    }

    let selectedWords = [...WordBanks.common];

    if (includeNumbers) selectedWords = [...selectedWords, ...WordBanks.numbers];
    if (includePunctuation) selectedWords = [...selectedWords, ...WordBanks.punctuation];

    // Filter by word length
    if (wordLength !== 'all') {
      selectedWords = selectedWords.filter(word => {
        // Ensure word is a string before calling .replace
        if (typeof word !== 'string') return false; 
        const len = word.replace(/[^a-zA-Z0-9]/g, '').length; // Account for non-alphanumeric in length
        switch (wordLength) {
          case 'short': return len <= 4;
          case 'medium': return len >= 5 && len <= 8;
          case 'long': return len >= 9 && len <= 12;
          case 'thicc': return len > 12;
          default: return true;
        }
      });
    }
    
    // Add a check here for empty selectedWords after filtering
    if (selectedWords.length === 0) {
        console.warn("No words found after applying filters. Using default common words.");
        selectedWords = [...WordBanks.common]; // Fallback to common words if filters make it empty
    }


    const shuffled = [...selectedWords].sort(() => Math.random() - 0.5);
    // Ensure enough words are generated for time mode, otherwise use wordCount
    const count = testMode === 'words' ? wordCount : Math.max(wordCount, 200);
    return shuffled.slice(0, count);
  }, [includeNumbers, includePunctuation, wordLength, testMode, wordCount]);

  // Reset function (moved for better organization and clarity)
  const resetTest = useCallback((shouldFocus = true) => {
    setWords(generateWords()); // Generate words as part of reset
    setCurrentInput('');
    setCurrentWordIndex(0);
    setStatus('idle');
    setStartTime(null);
    setElapsedTime(0);
    setAllTypedChars([]);
    setCorrectChars(0);
    setTotalChars(0);
    setCompletedWords([]);
    setErrors(0); // Reset errors
    setIsOutOfFocus(false);
    setShowOutOfFocusWarning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (shouldFocus) {
      setTimeout(() => inputRef.current?.focus(), 50); // Re-focus after state updates
    }
  }, [generateWords]); // `generateWords` is a dependency here

  // Initialize words on component mount and when settings change
  useEffect(() => {
    resetTest(false); // Call resetTest to initialize words and state
  }, [resetTest, testMode, timeLimit, wordCount, difficulty, includeNumbers, includePunctuation, wordLength]);
  // Removed `generateWords` from this dependency array as `resetTest` already depends on it,
  // preventing a potential re-render loop with `resetTest` being a dependency.


  // Focus management
  useEffect(() => {
    const handleFocus = () => {
      setIsOutOfFocus(false);
      setShowOutOfFocusWarning(false);
      if (outOfFocusTimeoutRef.current) {
        clearTimeout(outOfFocusTimeoutRef.current);
      }
      // Re-focus the input after a short delay to ensure it catches
      setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleBlur = () => {
      if (status === 'typing') {
        setIsOutOfFocus(true);
        outOfFocusTimeoutRef.current = setTimeout(() => {
          setShowOutOfFocusWarning(true);
        }, 1000); // Show warning after 1 second of blur
      }
    };

    // Initial focus on mount
    inputRef.current?.focus();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (outOfFocusTimeoutRef.current) {
        clearTimeout(outOfFocusTimeoutRef.current);
      }
    };
  }, [status]); // Depend on status to re-attach/detach blur listener appropriately

  // High-frequency timer for smooth updates
  useEffect(() => {
    if (status === 'typing' && !isOutOfFocus) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        if (startTime) {
          const newElapsed = (now - startTime) / 1000;
          setElapsedTime(newElapsed);

          // End test if time limit reached
          if (testMode === 'time' && newElapsed >= timeLimit) {
            setStatus('finished');
            clearInterval(intervalRef.current); // Stop timer immediately
          }
        }
      }, 50); // Update every 50ms for smooth responsiveness
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, isOutOfFocus, testMode, timeLimit, startTime]);

  // Calculate metrics with improved accuracy
  const calculateMetrics = useCallback(() => {
    const timeInMinutes = Math.max(elapsedTime / 60, 0.01); // Avoid division by zero

    // WPM: (correct characters / 5) / time in minutes
    // Raw WPM: (total typed characters / 5) / time in minutes
    // Accuracy consideration: Net WPM = WPM - (incorrect words / time in minutes)
    const netCorrectChars = allTypedChars.filter(char => char.correct).length;
    const wpm = Math.round(netCorrectChars / 5 / timeInMinutes);

    // Accuracy: (correct characters / total characters typed) * 100
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

    return { wpm, accuracy, correctChars: netCorrectChars, totalChars, errors };
  }, [elapsedTime, allTypedChars, correctChars, totalChars, errors]);


  // Get performance message
  const getPerformanceMessage = useCallback(() => {
    const { wpm } = calculateMetrics();

    if (wpm >= 80) return "Lightning fast! 🚀";
    if (wpm >= 60) return "Excellent speed! 🔥";
    if (wpm >= 40) return "Great job! 👍";
    if (wpm >= 20) return "Good progress! 📈";
    return "Keep practicing! 💪";
  }, [calculateMetrics]);


  // Handle key events
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault(); // Prevent tab navigation
      return;
    }

    setCapsLockOn(e.getModifierState('CapsLock'));

    // Only start typing if the status is idle and a valid key is pressed
    if (status === 'idle' && e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey) {
      setStatus('typing');
      setStartTime(Date.now());
    }

    // Restart on finished or failed by pressing Enter
    if ((status === 'finished' || status === 'failed') && e.key === 'Enter') {
      e.preventDefault();
      resetTest();
      return;
    }

    // Expert mode: fail on incorrect word submission (spacebar)
    if (difficulty === 'expert' && e.key === ' ') {
      const currentWord = words[currentWordIndex];
      // Only check if currentInput is not empty, allowing partial correct words
      if (currentInput.trim() !== currentWord && currentInput.length > 0) {
        setStatus('failed');
        return;
      }
    }

    // Master mode: fail on any incorrect key
    if (difficulty === 'master' && status === 'typing' && e.key.length === 1) {
      const currentWord = words[currentWordIndex];
      // Check if the typed character is not the expected one AND it's not a space (space handled by inputChange)
      if (e.key !== currentWord[currentInput.length] && e.key !== ' ' && currentInput.length < currentWord.length) {
        setStatus('failed');
        return;
      }
    }

    // Play typewriter sound with context
    // Only play sound if test is active and not out of focus
    if (status === 'typing' && !isOutOfFocus) {
      if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.altKey && !e.metaKey) { // Only for actual character input
        const expectedChar = words[currentWordIndex]?.[currentInput.length];
        const isCorrectChar = e.key === expectedChar;
        playTypewriterSound(isCorrectChar, false);
      } else if (e.key === 'Backspace') {
        playTypewriterSound(true, true); // Backspace sound
      }
    }

    // Handle backspace - crucial for accurate metrics and UI state
    if (e.key === 'Backspace') {
      e.preventDefault(); // Prevent default browser backspace behavior
      if (currentInput.length > 0) {
        const removedChar = currentInput[currentInput.length - 1];
        const expectedChar = words[currentWordIndex][currentInput.length - 1];

        setCurrentInput(prev => prev.slice(0, -1));

        setAllTypedChars(prev => prev.slice(0, -1)); // Remove the last char from history
        setTotalChars(prev => prev - 1); // Decrement total chars

        if (removedChar === expectedChar) {
          setCorrectChars(prev => prev - 1); // Decrement correct chars if it was correct
        } else {
          setErrors(prev => prev - 1); // Decrement errors if it was an error
        }

      } else if (currentWordIndex > 0) {
        // Move back to the previous word if at the start of the current word
        const previousWord = words[currentWordIndex - 1];
        const lastCompletedWordData = completedWords[completedWords.length - 1];

        // Recalculate metrics for the previous word correctly
        let charsToRevert = previousWord.length + 1; // +1 for the space that was typed after it

        setAllTypedChars(prev => prev.slice(0, -charsToRevert));
        setTotalChars(prev => prev - charsToRevert);
        setCorrectChars(prev => prev - (lastCompletedWordData.correctWordChars + 1)); // Revert correct chars for previous word + space
        setErrors(prev => prev - lastCompletedWordData.wordErrors); // Revert errors for previous word

        setCurrentWordIndex(prev => prev - 1);
        setCurrentInput(previousWord); // Set input to the previous word
        setCompletedWords(prev => prev.slice(0, -1)); // Remove the last completed word
      }
    }
  }, [status, difficulty, currentInput, currentWordIndex, words, completedWords, playTypewriterSound, resetTest, isOutOfFocus]);


  // Handle input change with improved tracking for `totalChars`, `correctChars`, and `errors`
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    const currentWord = words[currentWordIndex];

    if (!currentWord || status !== 'typing') {
      setCurrentInput(''); // Clear input if test is not active
      return;
    }

    // Prevent typing beyond the current word if difficulty is expert/master
    if ((difficulty === 'expert' || difficulty === 'master') && value.length > currentWord.length && !value.endsWith(' ')) {
      // Allow one extra character for potential space entry to trigger word completion
      if (value.length > currentWord.length + 1) return;
    }

    if (value.endsWith(' ')) {
      const typedWord = value.trim(); // Trim space before comparison

      // If typed word is empty and space is pressed, do nothing (prevent empty word submission)
      if (typedWord.length === 0 && currentInput.length === 0) {
        setCurrentInput(''); // Keep input empty
        return;
      }

      const wordCorrect = typedWord === currentWord;
      let wordCorrectChars = 0;
      let wordErrors = 0;

      // Track each character in the word, comparing typed vs. expected
      for (let i = 0; i < Math.max(typedWord.length, currentWord.length); i++) {
        const typedChar = typedWord[i] || '';
        const expectedChar = currentWord[i] || '';
        const isCharCorrect = typedChar === expectedChar && typedChar !== '';

        if (isCharCorrect) {
          wordCorrectChars++;
        } else if (typedChar !== '') { // This means a character was typed but it's incorrect or extra
          wordErrors++;
        } else if (expectedChar !== '') { // This means a character was missed
          wordErrors++;
        }

        // Add character to history
        setAllTypedChars(prev => [...prev, {
          char: typedChar,
          expected: expectedChar,
          correct: isCharCorrect,
          timestamp: Date.now()
        }]);
      }

      // Add space character to history (always correct if it completes a word)
      setAllTypedChars(prev => [...prev, {
        char: ' ',
        expected: ' ',
        correct: true,
        timestamp: Date.now()
      }]);

      // Update global counters
      setTotalChars(prev => prev + Math.max(typedWord.length, currentWord.length) + 1); // +1 for the space
      setCorrectChars(prev => prev + wordCorrectChars + 1); // +1 for the space
      setErrors(prev => prev + wordErrors); // Add errors for the word

      setCompletedWords(prev => [...prev, {
        typed: typedWord,
        expected: currentWord,
        correct: wordCorrect,
        correctWordChars: wordCorrectChars, // Store for accurate backspace logic
        wordErrors: wordErrors, // Store for accurate backspace logic
      }]);

      const nextWordIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextWordIndex);
      setCurrentInput(''); // Clear input for the next word

      // Check completion based on test mode
      if (testMode === 'words' && nextWordIndex >= wordCount) {
        setStatus('finished');
      } else if (testMode === 'time' && currentWordIndex + 1 >= words.length) {
        // If in time mode and run out of words, regenerate or finish
        // This will trigger the useEffect for settings change if generateWords changes
        setWords(generateWords());
      }

      return; // Stop further processing for space-ended input
    }

    // Handle character-by-character input (for non-space characters)
    // This logic handles direct input, not backspace (which is in handleKeyDown)
    if (value.length > currentInput.length) { // Character added
      const addedChar = value[value.length - 1];
      const expectedChar = currentWord[value.length - 1] || '';
      const isCorrect = addedChar === expectedChar;

      setAllTypedChars(prev => [...prev, {
        char: addedChar,
        expected: expectedChar,
        correct: isCorrect,
        timestamp: Date.now()
      }]);

      setTotalChars(prev => prev + 1);
      if (isCorrect) {
        setCorrectChars(prev => prev + 1);
      } else {
        setErrors(prev => prev + 1); // Increment error count for incorrect character
      }
    }
    // Note: Decrementing logic for backspace is now exclusively in handleKeyDown

    setCurrentInput(value);
  }, [words, currentWordIndex, currentInput, testMode, wordCount, difficulty, generateWords, status]);


  // Render word with character-level feedback and typewriter effects
  const renderWord = (word, wordIndex) => {
    const isCurrentWord = wordIndex === currentWordIndex;
    const isCompletedWord = wordIndex < currentWordIndex;
    const typedWord = isCurrentWord ? currentInput : '';
    const completedWordData = completedWords[wordIndex];

    return (
      <span key={wordIndex} className="relative inline-block mb-1 mr-3 transition-all duration-100">
        {word.split('').map((char, charIndex) => {
          let className = 'relative text-gray-500 transition-all duration-75';
          let showCharacterHighlight = false;

          if (isCurrentWord) {
            if (charIndex < typedWord.length) {
              const isCorrect = typedWord[charIndex] === char;
              className = isCorrect
                ? 'text-green-400 transition-all duration-75 relative'
                : 'text-red-400 bg-red-900/30 transition-all duration-75 relative';
            } else if (charIndex === typedWord.length) {
              // This is the character *after* the current input, where the cursor should be
              className = 'relative text-gray-400 transition-all duration-75';
            }
          } else if (isCompletedWord && completedWordData) {
            const typedChar = completedWordData.typed[charIndex];
            if (typedChar === char) {
              className = 'relative text-green-400';
            } else if (typedChar) {
              className = 'relative text-red-400 bg-red-900/30';
            } else {
              className = 'relative text-gray-600'; // Untyped characters in a completed, but incorrect, word
            }
          }

          // Apply pulse to the current character being typed (if correct) or the character after if incorrect
          if (isCurrentWord && charIndex === typedWord.length - 1 && typedWord.length > 0) {
            const isLastTypedCharCorrect = typedWord[charIndex] === char;
            if (isLastTypedCharCorrect) {
              showCharacterHighlight = true;
            }
          } else if (isCurrentWord && charIndex === typedWord.length && typedWord.length <= word.length) {
            // Apply pulse to the next expected character (cursor position)
             showCharacterHighlight = true;
          }


          return (
            <span key={charIndex} className={className}>
              {char}

              {/* Typewriter effect for the currently active character */}
              {showCharacterHighlight && (
                <span className={`absolute inset-0 rounded-sm ${typedWord[charIndex] === char ? 'bg-green-400/20' : 'bg-red-400/20'} animate-pulse`}></span>
              )}

              {/* Main cursor - now dynamically positioned within the word */}
              {isCurrentWord && charIndex === typedWord.length && (
                <span className="absolute -top-0.5 left-0 w-0.5 h-7 bg-green-400 animate-pulse transition-all duration-150" style={{ transform: 'translateX(-50%)' }}></span>
              )}
            </span>
          );
        })}

        {/* Handle extra characters (errors) */}
        {isCurrentWord && typedWord.length > word.length && (
          <>
            <span className="relative text-red-400 bg-red-900/30">
              {typedWord.slice(word.length).split('').map((char, idx) => (
                <span key={idx} className="relative">
                  {char}
                  {/* Highlight for the very last incorrectly typed character */}
                  {idx === typedWord.slice(word.length).length - 1 && (
                    <span className="absolute inset-0 rounded-sm bg-red-400/20 animate-pulse"></span>
                  )}
                </span>
              ))}
            </span>
            {/* Cursor after extra characters */}
            <span className="relative">
              <span className="absolute -top-0.5 left-0 w-0.5 h-7 bg-green-400 animate-pulse transition-all duration-150"></span>
            </span>
          </>
        )}
        {/* Add a space after each word for readability if it's not the last word */}
        {wordIndex < words.length - 1 && <span className="text-gray-500">&nbsp;</span>}
      </span>
    );
  };

  // Only calculate metrics when needed, based on current state
  const { wpm, accuracy, correctChars: netCorrectChars, totalChars: netTotalChars } = calculateMetrics();

  return (
    <div className="flex flex-col min-h-screen text-white bg-gray-900">
      {/* Out of focus warning */}
      {showOutOfFocusWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => inputRef.current?.focus()}>
          <div className="p-6 text-center bg-gray-800 rounded-lg">
            <h2 className="mb-2 text-xl font-bold text-red-400">⚠️ Out of Focus</h2>
            <p className="text-gray-300">Click here to continue typing</p>
          </div>
        </div>
      )}

      {/* Caps lock warning */}
      {capsLockOn && status === 'typing' && (
        <div className="fixed z-40 p-3 bg-yellow-600 rounded-lg top-4 right-4">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span className="text-sm font-medium">Caps Lock is ON</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-black bg-green-500 rounded">
            ZT
          </div>
          <span className="text-lg font-light text-gray-300">Zamar⚡Type</span>
        </div>

        {/* Settings panel */}
        <div className="flex items-center space-x-4 text-sm">
          <select
            value={testMode}
            onChange={(e) => setTestMode(e.target.value)}
            className="px-2 py-1 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={status === 'typing'}
          >
            <option value="time">Time</option>
            <option value="words">Words</option>
          </select>

          {testMode === 'time' && (
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="px-2 py-1 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={status === 'typing'}
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={120}>120s</option>
            </select>
          )}

          {testMode === 'words' && (
            <select
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="px-2 py-1 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={status === 'typing'}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          )}

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-2 py-1 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={status === 'typing'}
          >
            <option value="normal">Normal</option>
            <option value="expert">Expert</option>
            <option value="master">Master</option>
          </select>

          {/* New options for word content */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={() => setIncludeNumbers(!includeNumbers)}
              disabled={status === 'typing'}
              className="text-green-500 rounded form-checkbox"
            />
            <span>Numbers</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includePunctuation}
              onChange={() => setIncludePunctuation(!includePunctuation)}
              disabled={status === 'typing'}
              className="text-green-500 rounded form-checkbox"
            />
            <span>Punctuation</span>
          </label>
          <select
            value={wordLength}
            onChange={(e) => setWordLength(e.target.value)}
            className="px-2 py-1 bg-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={status === 'typing'}
          >
            <option value="all">All Lengths</option>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
            <option value="thicc">Thicc</option>
          </select>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1 rounded transition-colors ${soundEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-700'}`}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center flex-1 p-4">
        <div className="w-full max-w-6xl mx-auto">

          {/* Stats display */}
          <div className="flex items-end justify-center mb-8 space-x-12">
            <div className="text-center">
              <div className="text-6xl font-light leading-none text-green-500">
                {wpm}
              </div>
              <div className="mt-1 text-xl text-gray-400">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-light leading-none text-green-400">
                {accuracy}%
              </div>
              <div className="mt-1 text-xl text-gray-400">Accuracy</div>
            </div>
            {testMode === 'time' && (
              <div className="text-center">
                <div className="text-6xl font-light leading-none text-yellow-400">
                  {Math.max(0, (timeLimit - elapsedTime)).toFixed(1)}
                </div>
                <div className="mt-1 text-xl text-gray-400">Time Left</div>
              </div>
            )}
          </div>

          {/* Performance feedback */}
          <div className="mb-8 text-center">
            <div className="text-lg text-gray-300">
              {getPerformanceMessage()}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {netCorrectChars}/{netTotalChars} characters correct
            </div>
          </div>

          {/* Words display */}
          <div className="mb-8 text-center">
            <div className="w-full max-w-5xl mx-auto text-3xl leading-relaxed">
              {/* Only render words if 'words' state is populated to prevent errors */}
              {words.length > 0 ? (
                words.slice(currentWordIndex > 5 ? currentWordIndex - 5 : 0, currentWordIndex + 15).map((word, index) => {
                  const actualIndex = (currentWordIndex > 5 ? currentWordIndex - 5 : 0) + index;
                  return renderWord(word, actualIndex);
                })
              ) : (
                <p className="text-gray-500">Loading words... Ensure WordBanks.js is correctly configured.</p>
              )}
            </div>
          </div>

          {/* Hidden input */}
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="absolute opacity-0 pointer-events-none -z-10"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />

          {/* Status and instructions */}
          <div className="mt-8 text-center">
            <div className="text-sm text-gray-500">
              {status === 'idle' && 'Click here or start typing'}
              {status === 'typing' && (
                <div>
                  Keep typing...
                  {difficulty === 'expert' && ' (Incorrect words will end the test)'}
                  {difficulty === 'master' && ' (Any mistake will end the test)'}
                </div>
              )}
              {status === 'finished' && (
                <div>
                  <div className="mb-2 text-lg text-green-400">Test completed! 🎉</div>
                  <div className="mb-2">{getPerformanceMessage()}</div>
                  <div className="text-xs">Press Enter to restart</div>
                </div>
              )}
              {status === 'failed' && (
                <div>
                  <div className="mb-2 text-lg text-red-400">Test Failed! 💥</div>
                  <div className="mb-2">
                    {difficulty === 'expert' && 'You submitted an incorrect word.'}
                    {difficulty === 'master' && 'You made a mistake. Try again!'}
                  </div>
                  <div className="text-xs">Press Enter to restart</div>
                </div>
              )}
            </div>

            {/* Control buttons */}
            <div className="flex justify-center mt-4 space-x-4">
              <button
                onClick={() => resetTest()} // Ensure resetTest is called with no args for default focus
                className="px-6 py-2 text-white transition-colors bg-green-600 rounded-full hover:bg-green-700"
              >
                Restart Test
              </button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-8 text-center">
            <div className="text-sm text-gray-600">
              {currentWordIndex}/{testMode === 'words' ? wordCount : words.length}
            </div>
            <div className="w-full h-2 max-w-md mx-auto mt-2 bg-gray-800 rounded-full">
              <div
                className="h-2 transition-all duration-300 bg-green-500 rounded-full"
                style={{
                  width: `${(currentWordIndex / (testMode === 'words' ? wordCount : words.length)) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Click handler for focus */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => {
          inputRef.current?.focus();
          // No need for a second setTimeout here, handleFocus takes care of it
        }}
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent default browser behavior that might unfocus input
        }}
        // The rest of the onMouseDown is not included in your provided code snippet.
        // If there was more, make sure it's closed properly with an ending '</div>'
      ></div> {/* Added closing div for the click handler */}
    </div>
  );
};

export default TypingSimulator;
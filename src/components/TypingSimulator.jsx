import React, { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import Logo from "./Logo";
import WordBanks from "./WordBanks";
import Navbar from "./Navbar";
import TypeSound from "../assets/type.wav";

const TypingSimulator = () => {
	const [words, setWords] = useState([]);
	const [currentWordIndex, setCurrentWordIndex] = useState(0);
	const [currentCharIndex, setCurrentCharIndex] = useState(0);
	const [userInput, setUserInput] = useState("");
	const [testMode, setTestMode] = useState("time");
	const [timeLimit, setTimeLimit] = useState(30);
	const [wordCount, setWordCount] = useState(50);
	const [timeLeft, setTimeLeft] = useState(30);
	const [isActive, setIsActive] = useState(false);
	const [isCompleted, setIsCompleted] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [startTime, setStartTime] = useState(null);
	const textContainerRef = useRef(null);
	const currentWordRef = useRef(null);
	const [isBackspaceHeld, setIsBackspaceHeld] = useState(false);
	const [, setBackspaceTimer] = useState(null);
	const [scrollOffset, setScrollOffset] = useState(0);
	const [stats, setStats] = useState({
		wpm: 0,
		accuracy: 100,
		correctChars: 0,
		incorrectChars: 0,
		totalChars: 0,
		correctWords: 0,
		incorrectWords: 0,
	});
	const [charStates, setCharStates] = useState([]);
	const [wordStates, setWordStates] = useState([]);

	const inputRef = useRef(null);
	const timerRef = useRef(null);
	const audioRef = useRef(null);
	const testAreaRef = useRef(null);

	// Generate random words
	const generateWords = useCallback(() => {
		const targetCount = testMode === "words" ? wordCount : 200; // Generate more for time mode
		const newWords = [];
		const wordList = WordBanks.common;

		for (let i = 0; i < targetCount; i++) {
			const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
			newWords.push(randomWord);
		}

		setWords(newWords);

		// Initialize character and word states
		const newCharStates = newWords.map((word) =>
			word.split("").map(() => ({ status: "untyped" }))
		);
		const newWordStates = newWords.map(() => ({ status: "untyped" }));

		setCharStates(newCharStates);
		setWordStates(newWordStates);
	}, [wordCount, testMode]);

	// Add this useEffect for audio initialization
	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.load();
			audioRef.current.volume = 1; // Volume must be between 0.0 and 1.0
		}
	}, []);

	// Play typing sound
	const playTypeSound = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.currentTime = 0;
			audioRef.current.play().catch(() => {});
		}
	}, []);

	// Reset test
	const resetTest = useCallback(() => {
		setCurrentWordIndex(0);
		setCurrentCharIndex(0);
		setUserInput("");
		setTimeLeft(timeLimit);
		setIsActive(false);
		setIsCompleted(false);
		setShowResults(false);
		setStartTime(null);
		setStats({
			wpm: 0,
			accuracy: 100,
			correctChars: 0,
			incorrectChars: 0,
			totalChars: 0,
			correctWords: 0,
			incorrectWords: 0,
		});
		generateWords();
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, [timeLimit, generateWords]);

	// Calculate final stats
	const calculateFinalStats = useCallback(() => {
		const timeElapsed =
			testMode === "time"
				? (timeLimit - timeLeft) / 60
				: startTime
				? (Date.now() - startTime) / 60000
				: 1;

		const grossWPM = stats.correctChars / 5 / Math.max(timeElapsed, 0.1);
		const netWPM = Math.max(
			0,
			grossWPM - stats.incorrectChars / 5 / Math.max(timeElapsed, 0.1)
		);
		const accuracy =
			stats.totalChars > 0
				? (stats.correctChars / stats.totalChars) * 100
				: 100;

		return {
			wpm: Math.round(netWPM),
			accuracy: Math.round(accuracy),
			correctChars: stats.correctChars,
			incorrectChars: stats.incorrectChars,
			totalChars: stats.totalChars,
		};
	}, [stats, timeLimit, timeLeft, startTime, testMode]);

	// Timer effect
	useEffect(() => {
		if (isActive && timeLeft > 0 && !isCompleted && testMode === "time") {
			timerRef.current = setInterval(() => {
				setTimeLeft((time) => {
					if (time <= 1) {
						setIsActive(false);
						setIsCompleted(true);
						setShowResults(true);
						return 0;
					}
					return time - 1;
				});
			}, 1000);
		} else {
			clearInterval(timerRef.current);
		}

		return () => clearInterval(timerRef.current);
	}, [isActive, timeLeft, isCompleted, testMode]);

	// Handle key press

	// Enhanced backspace handler
	const handleBackspace = useCallback(() => {
		// If we're at the very beginning, do nothing
		if (currentWordIndex === 0 && currentCharIndex === 0) {
			return;
		}

		const newCharStates = [...charStates];

		// If we're at the beginning of current word, go back to previous word
		if (currentCharIndex === 0 && currentWordIndex > 0) {
			// Move to previous word's end
			const previousWordIndex = currentWordIndex - 1;
			const previousWordLength = words[previousWordIndex].length;

			setCurrentWordIndex(previousWordIndex);
			setCurrentCharIndex(previousWordLength);

			// Reconstruct user input for the previous word
			setUserInput(words[previousWordIndex]);

			return;
		}

		// Normal character deletion within current word
		if (currentCharIndex > 0) {
			// Remove character from user input
			setUserInput((prev) => prev.slice(0, -1));

			// Move cursor back
			const newCharIndex = currentCharIndex - 1;
			setCurrentCharIndex(newCharIndex);

			// Reset character state to untyped
			if (
				newCharStates[currentWordIndex] &&
				newCharStates[currentWordIndex][newCharIndex]
			) {
				newCharStates[currentWordIndex][newCharIndex].status = "untyped";
				setCharStates(newCharStates);
			}
		}
	}, [currentWordIndex, currentCharIndex, charStates, words]);

	const handleKeyPress = (e) => {
		if (isCompleted || showResults) return;

		const char = e.key;

		// Start test on first keypress
		if (!isActive && char.length === 1) {
			setIsActive(true);
			setStartTime(Date.now());
		}

		// Play sound for regular characters
		if (char.length === 1) {
			playTypeSound();
		}

		if (char === " ") {
			e.preventDefault();

			if (userInput.trim() === "") return;

			const currentWord = words[currentWordIndex];
			const typedWord = userInput.trim();
			const isCorrect = typedWord === currentWord;

			// Update word state
			const newWordStates = [...wordStates];
			newWordStates[currentWordIndex].status = isCorrect
				? "correct"
				: "incorrect";
			setWordStates(newWordStates);

			// Update character states - PRESERVE existing states, don't overwrite
			const newCharStates = [...charStates];

			// Only update character states that haven't been set yet
			// This preserves the real-time feedback from typing
			for (let i = 0; i < currentWord.length; i++) {
				if (i < typedWord.length) {
					// Only update if the character state doesn't already exist (shouldn't happen in normal flow)
					// The character states should already be set from real-time typing
					if (
						!newCharStates[currentWordIndex][i] ||
						newCharStates[currentWordIndex][i].status === "untyped"
					) {
						newCharStates[currentWordIndex][i] = {
							status: currentWord[i] === typedWord[i] ? "correct" : "incorrect",
						};
					}
				} else {
					// Mark missing characters (when typed word is shorter than target word)
					newCharStates[currentWordIndex][i] = {
						status: "missing",
					};
				}
			}

			// Handle extra characters (when typed word is longer than target word)
			// These should already be marked as incorrect from real-time typing, but let's ensure consistency
			for (let i = currentWord.length; i < typedWord.length; i++) {
				if (!newCharStates[currentWordIndex][i]) {
					newCharStates[currentWordIndex][i] = {
						status: "incorrect",
					};
				}
			}

			setCharStates(newCharStates);

			// Update stats - count based on actual character states, not word correctness
			let correctCount = 0;
			let incorrectCount = 0;
			let totalCount = Math.max(typedWord.length, currentWord.length);

			// Count correct characters
			for (let i = 0; i < Math.min(typedWord.length, currentWord.length); i++) {
				if (typedWord[i] === currentWord[i]) {
					correctCount++;
				} else {
					incorrectCount++;
				}
			}

			// Add missing characters as incorrect
			if (currentWord.length > typedWord.length) {
				incorrectCount += currentWord.length - typedWord.length;
			}

			// Add extra characters as incorrect
			if (typedWord.length > currentWord.length) {
				incorrectCount += typedWord.length - currentWord.length;
			}

			setStats((prev) => ({
				...prev,
				correctChars: prev.correctChars + correctCount,
				incorrectChars: prev.incorrectChars + incorrectCount,
				totalChars: prev.totalChars + totalCount,
				correctWords: prev.correctWords + (isCorrect ? 1 : 0),
				incorrectWords: prev.incorrectWords + (isCorrect ? 0 : 1),
			}));

			// Move to next word or complete test
			if (currentWordIndex < words.length - 1) {
				setCurrentWordIndex((prev) => prev + 1);
				setCurrentCharIndex(0);
				setUserInput("");

				// Check if word mode is complete
				if (testMode === "words" && currentWordIndex + 1 >= wordCount) {
					setIsCompleted(true);
					setIsActive(false);
					setShowResults(true);
				}
			} else {
				setIsCompleted(true);
				setIsActive(false);
				setShowResults(true);
			}
		} // Updated backspace handling in handleKeyPress
		else if (char === "Backspace") {
			e.preventDefault();

			// Play sound once for the initial press
			playTypeSound();

			// Execute the backspace action
			handleBackspace();

			if (!isBackspaceHeld) {
				setIsBackspaceHeld(true);

				// Set up a delay before starting rapid deletion
				const initialDelay = setTimeout(() => {
					// Set up interval for held backspace (without sound)
					const backspaceInterval = setInterval(() => {
						handleBackspace(); // No sound here - only the logic
					}, 75);

					setBackspaceTimer(backspaceInterval);

					// Clear interval when key is released
					const handleKeyUp = (upEvent) => {
						if (upEvent.key === "Backspace") {
							clearInterval(backspaceInterval);
							clearTimeout(initialDelay);
							setIsBackspaceHeld(false);
							setBackspaceTimer(null);
							document.removeEventListener("keyup", handleKeyUp);
						}
					};

					document.addEventListener("keyup", handleKeyUp);
				}, 300); // 300ms delay before starting rapid deletion

				// Handle key release during initial delay
				const handleInitialKeyUp = (upEvent) => {
					if (upEvent.key === "Backspace") {
						clearTimeout(initialDelay);
						setIsBackspaceHeld(false);
						document.removeEventListener("keyup", handleInitialKeyUp);
					}
				};

				document.addEventListener("keyup", handleInitialKeyUp);
			}
		} else if (char.length === 1 && char.match(/[a-zA-Z0-9.,!?;:'"()-]/)) {
			// Reset backspace held state for any other key
			setIsBackspaceHeld(false);

			setUserInput((prev) => prev + char);
			setCurrentCharIndex((prev) => prev + 1);

			// Update character state in real-time
			const newCharStates = [...charStates];
			const currentWord = words[currentWordIndex];
			if (currentCharIndex < currentWord.length) {
				newCharStates[currentWordIndex][currentCharIndex].status =
					char === currentWord[currentCharIndex] ? "correct" : "incorrect";
				setCharStates(newCharStates);
			}
		}

		// Handle Escape or Tab to reset
		if (char === "Escape" || char === "Tab") {
			e.preventDefault();
			resetTest();
		}
	};

	// Initialize on mount
	useEffect(() => {
		generateWords();
	}, [generateWords]);

	// Add this useEffect to automatically reset the test when settings change.
	useEffect(() => {
		// This ensures the test resets with the new settings.
		resetTest();
	}, [timeLimit, wordCount, testMode, resetTest]);

	// This useEffect handles auto-scrolling to keep the current word in view.
	useEffect(() => {
		if (
			!currentWordRef.current ||
			!testAreaRef.current ||
			!textContainerRef.current
		) {
			return;
		}

		const containerHeight = testAreaRef.current.clientHeight;
		const wordElement = currentWordRef.current;
		const containerRect = testAreaRef.current.getBoundingClientRect();
		const wordRect = wordElement.getBoundingClientRect();

		// Calculate the position of the current word relative to the container
		const wordTop = wordRect.top - containerRect.top;
		const wordBottom = wordRect.bottom - containerRect.top;

		// Define a visible area within the container (e.g., the middle third)
		const visibleTop = containerHeight / 3;
		const visibleBottom = (containerHeight * 2) / 3;

		// We use setScrollOffset with a function to get the latest scrollOffset
		// and avoid stale state issues.
		setScrollOffset((currentOffset) => {
			if (wordBottom > visibleBottom) {
				return currentOffset - (wordBottom - visibleBottom);
			} else if (wordTop < visibleTop) {
				return currentOffset - (wordTop - visibleTop);
			}
			return currentOffset; // No change needed
		});
	}, [currentWordIndex]);

	// Reset scroll when test resets
	useEffect(() => {
		if (currentWordIndex === 0 && currentCharIndex === 0) {
			setScrollOffset(0);
		}
	}, [currentWordIndex, currentCharIndex]);

	const finalStats = calculateFinalStats();
	const displayStats = showResults
		? finalStats
		: {
				wpm: 0,
				accuracy: 100,
				time:
					testMode === "time"
						? timeLeft
						: Math.round((Date.now() - (startTime || Date.now())) / 1000),
		  };

	return (
		<div className="flex flex-col min-h-screen text-white">
			{/* Audio element */}
			<audio ref={audioRef} preload="auto">
				<source src={TypeSound} type="audio/wav" />
			</audio>

			<Logo />

			{/* Stats Display */}
			<div className="flex items-center justify-center mx-auto mb-8 space-x-12">
				<div className="text-center">
					<div className="text-6xl font-light text-green-600">
						{displayStats.wpm}
					</div>
					<div className="text-xs tracking-widest text-gray-500 uppercase">
						wpm
					</div>
				</div>
				<div className="text-center">
					<div className="text-6xl font-light text-green-600">
						{displayStats.accuracy}%
					</div>
					<div className="text-xs tracking-widest text-gray-500 uppercase">
						acc
					</div>
				</div>
				<div className="text-center">
					<div className="text-6xl font-light text-green-600">
						{testMode === "time" ? timeLeft : displayStats.time}
					</div>
					<div className="text-xs tracking-widest text-gray-500 uppercase">
						{testMode === "time" ? "time" : "sec"}
					</div>
				</div>
			</div>

			<Navbar
				timeLimit={timeLimit}
				setTimeLimit={setTimeLimit}
				wordCount={wordCount}
				setWordCount={setWordCount}
				testMode={testMode}
				setTestMode={setTestMode}
				onReset={resetTest}
				className="mx-auto"
			/>

			{/* Typing Area */}
			<div
				ref={testAreaRef}
				className="relative w-full max-w-6xl mx-auto mt-5 mb-8"
				style={{ height: "176px" }}
			>
				{showResults ? (
					<div className="mt-10 text-center">
						<div className="mb-4 text-3xl text-green-500">Test Complete!</div>
						<div className="grid max-w-md grid-cols-2 gap-8 mx-auto">
							<div className="text-center">
								<div className="text-4xl font-light text-green-500">
									{finalStats.wpm}
								</div>
								<div className="text-sm text-gray-500">WPM</div>
							</div>
							<div className="text-center">
								<div className="text-4xl font-light text-green-500">
									{finalStats.accuracy}%
								</div>
								<div className="text-sm text-gray-500">Accuracy</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-light text-gray-400">
									{finalStats.correctChars}
								</div>
								<div className="text-sm text-gray-500">Correct</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-light text-gray-400">
									{finalStats.incorrectChars}
								</div>
								<div className="text-sm text-gray-500">Incorrect</div>
							</div>
						</div>
						<button
							onClick={resetTest}
							className="px-4 py-2 mt-6 text-green-500 transition-colors rounded hover:text-green-700"
						>
							Try Again
						</button>
					</div>
				) : (
					<>
						{/* Scrollable container */}
						<div
							className="relative h-full overflow-hidden"
							style={{ height: "175px" }}
						>
							<div
								ref={textContainerRef}
								className="text-[2rem] leading-relaxed relative text-gray-500 p-6 rounded-lg backdrop-blur-sm transition-transform duration-200 ease-out"
								style={{ transform: `translateY(${scrollOffset}px)` }}
							>
								<div className="flex flex-wrap">
									{words.map((word, wordIndex) => (
										<React.Fragment key={wordIndex}>
											<span
												ref={
													wordIndex === currentWordIndex ? currentWordRef : null
												}
												className={`inline-block mr-3 mb-1 ${
													wordIndex === currentWordIndex ? "current-word" : ""
												}`}
											>
												{word.split("").map((char, charIndex) => {
													let className = "text-gray-500";

													if (
														charStates[wordIndex] &&
														charStates[wordIndex][charIndex]
													) {
														const status =
															charStates[wordIndex][charIndex].status;
														if (status === "correct") {
															className = "text-gray-300";
														} else if (status === "incorrect") {
															className = "text-red-500";
														} else if (status === "missing") {
															className = "text-red-300 bg-red-500/10";
														}
													}

													// Current character cursor
													if (
														wordIndex === currentWordIndex &&
														charIndex === currentCharIndex &&
														isActive
													) {
														className +=
															" border-l-2 border-green-500 animate-pulse";
													}

													return (
														<span key={charIndex} className={className}>
															{char}
														</span>
													);
												})}
												{/* Show cursor at end of current word if needed */}
												{wordIndex === currentWordIndex &&
													currentCharIndex >= word.length &&
													isActive && (
														<span className="border-l-2 border-green-500 animate-pulse ml-0.5"></span>
													)}
											</span>
										</React.Fragment>
									))}
								</div>
							</div>
						</div>

						{/* Hidden input */}
						<input
							ref={inputRef}
							className="absolute inset-0 z-10 opacity-0 cursor-default"
							value={userInput}
							onChange={() => {}}
							onKeyDown={handleKeyPress}
							onBlur={() => {
								if (!showResults) {
									setTimeout(() => inputRef.current?.focus(), 0);
								}
							}}
							autoComplete="off"
							autoCapitalize="off"
							autoCorrect="off"
							spellCheck={false}
						/>
					</>
				)}
			</div>

			{/* Footer Controls */}
			<div className="flex items-center justify-center pb-8 mt-auto space-x-6">
				<button
					onClick={resetTest}
					className="flex items-center space-x-2 text-sm text-gray-500 transition-colors hover:text-green-500"
				>
					<RefreshCw size={16} />
					<span>restart test</span>
				</button>

				<div className="text-xs text-gray-600">tab or esc - restart test</div>
			</div>
		</div>
	);
};

export default TypingSimulator;

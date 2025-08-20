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
	const playTypeSound = () => {
		if (audioRef.current) {
			audioRef.current.currentTime = 0;
			audioRef.current.play().catch(() => {});
		}
	};

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
	const handleKeyPress = (e) => {
		if (isCompleted || showResults) return;

		const char = e.key;

		// Start test on first keypress
		if (!isActive && char.length === 1) {
			setIsActive(true);
			setStartTime(Date.now());
		}

		// Play sound
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

			// Update character states
			const newCharStates = [...charStates];
			for (let i = 0; i < currentWord.length; i++) {
				if (i < typedWord.length) {
					newCharStates[currentWordIndex][i].status =
						currentWord[i] === typedWord[i] ? "correct" : "incorrect";
				} else {
					newCharStates[currentWordIndex][i].status = "missing";
				}
			}
			setCharStates(newCharStates);

			// Update stats
			//   const correctCharsInWord = Math.min(typedWord.length, currentWord.length);
			const correctCount = typedWord
				.split("")
				.reduce(
					(count, char, i) =>
						i < currentWord.length && char === currentWord[i]
							? count + 1
							: count,
					0
				);

			setStats((prev) => ({
				...prev,
				correctChars: prev.correctChars + correctCount,
				incorrectChars:
					prev.incorrectChars +
					(Math.max(typedWord.length, currentWord.length) - correctCount),
				totalChars:
					prev.totalChars + Math.max(typedWord.length, currentWord.length),
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
		} else if (char === "Backspace") {
			if (userInput.length > 0) {
				playTypeSound();
				setUserInput((prev) => prev.slice(0, -1));
				setCurrentCharIndex((prev) => Math.max(0, prev - 1));

				// Update character state
				const newCharStates = [...charStates];
				if (
					currentCharIndex > 0 &&
					currentCharIndex <= words[currentWordIndex].length
				) {
					newCharStates[currentWordIndex][currentCharIndex - 1].status =
						"untyped";
					setCharStates(newCharStates);
				}
			}
		} else if (char.length === 1 && char.match(/[a-zA-Z0-9.,!?;:'"()-]/)) {
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
					<div className="text-xs text-gray-500 uppercase tracking-widest">
						wpm
					</div>
				</div>
				<div className="text-center">
					<div className="text-6xl font-light text-green-600">
						{displayStats.accuracy}%
					</div>
					<div className="text-xs text-gray-500 uppercase tracking-widest">
						acc
					</div>
				</div>
				<div className="text-center">
					<div className="text-6xl font-light text-green-600">
						{testMode === "time" ? timeLeft : displayStats.time}
					</div>
					<div className="text-xs text-gray-500 uppercase tracking-widest">
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
	className="relative mx-auto max-w-6xl w-full mb-8 mt-5"
	style={{ height: "176px" }}
>
	{showResults ? (
		<div className="text-center mt-10">
			<div className="text-3xl text-green-500 mb-4">Test Complete!</div>
			<div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
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
				className="mt-6 px-4 py-2 text-green-500 hover:text-green-700 rounded transition-colors"
			>
				Try Again
			</button>
		</div>
	) : (
		<>
			{/* Scrollable container */}
			<div 
				className="h-full overflow-hidden relative"
				style={{ height: "175px" }}
			>
				<div 
					ref={textContainerRef}
					className="text-[2rem] leading-relaxed relative text-gray-500 p-6 rounded-lg backdrop-blur-sm transition-transform duration-200 ease-out"
					style={{ transform: `translateY(${scrollOffset}px)` }}
				>
					<div className="flex flex-wrap">
						{words
							.map((word, wordIndex) => (
								<React.Fragment key={wordIndex}>
									<span
										ref={wordIndex === currentWordIndex ? currentWordRef : null}
										className={`inline-block mr-3 mb-1 ${
											wordIndex === currentWordIndex ? 'current-word' : ''
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
				className="absolute inset-0 opacity-0 cursor-default z-10"
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
			<div className="flex items-center justify-center space-x-6 mt-auto pb-8">
				<button
					onClick={resetTest}
					className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors text-sm"
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

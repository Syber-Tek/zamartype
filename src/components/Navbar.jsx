import { Timer, Type } from "lucide-react";

const Navbar = ({
	timeLimit,
	setTimeLimit,
	wordCount,
	setWordCount,
	testMode,
	setTestMode,
}) => {
	return (
		<div className="flex items-center justify-center w-full px-4 mx-auto">
			<nav className="flex items-center justify-between w-full max-w-lg text-gray-500 bg-gray-700/50 rounded-xl">
				{/* Test Mode Buttons */}
				<div className="flex items-center space-x-1">
					{/* Time  */}
					<button
						onClick={() => setTestMode("time")}
						className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
							testMode === "time"
								? "text-green-600 "
								: "text-gray-500 hover:text-gray-300"
						}`}
					>
						<Timer className="w-4 h-4" />
						<span className="text-sm font-medium">time</span>
					</button>
					{/* Words  */}
					<button
						onClick={() => setTestMode("words")}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
							testMode === "words"
								? "text-green-600 "
								: "text-gray-500 hover:text-gray-300"
						}`}
					>
						<Type className="w-4 h-4" />
						<span className="text-sm font-medium">words</span>
					</button>
				</div>

				{/* Divider */}
				<div class="h-6 w-1 bg-gray-600 rounded-lg "></div>

				{/* Time & Word Options */}
				{testMode === "time" ? (
					<div className="flex space-x-0.5">
						{["15", "30", "60", "120"].map((time) => (
							<button
								key={time}
								onClick={() => setTimeLimit(time)}
								className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
									timeLimit === time
										? "text-green-600 "
										: "text-gray-500 hover:text-gray-300"
								}`}
							>
								{time}
							</button>
						))}
					</div>
				) : (
					<div className="flex space-x-0.5">
						{["10", "25", "50", "100"].map((count) => (
							<button
								key={count}
								onClick={() => setWordCount(count)}
								className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
									wordCount === count
										? "text-green-600 "
										: "text-gray-500 hover:text-gray-300"
								}`}
							>
								{count}
							</button>
						))}
					</div>
				)}
			</nav>
		</div>
	);
};

export default Navbar;

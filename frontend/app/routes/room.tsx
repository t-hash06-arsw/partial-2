import { useState } from "react";

export function meta() {
	return [
		{ title: "Tic-Tac-Toe Game" },
		{
			name: "description",
			content: "A simple Tic-Tac-Toe game built with React",
		},
	];
}

function Square({
	value,
	onSquareClick,
}: {
	value: string | null;
	onSquareClick: () => void;
}) {
	const getValueColor = () => {
		if (value === "X") return "text-blue-600";
		if (value === "O") return "text-red-600";
		return "";
	};

	return (
		<button
			type="button"
			className={`w-16 h-16 border-2 border-gray-700 font-bold text-2xl bg-white hover:bg-gray-100 transition-colors ${getValueColor()}`}
			onClick={onSquareClick}
		>
			{value}
		</button>
	);
}

function Board({
	xIsNext,
	squares,
	onPlay,
}: {
	xIsNext: boolean;
	squares: (string | null)[];
	onPlay: (nextSquares: (string | null)[]) => void;
}) {
	function handleClick(i: number) {
		if (calculateWinner(squares) || squares[i]) {
			return;
		}
		const nextSquares = squares.slice();
		if (xIsNext) {
			nextSquares[i] = "X";
		} else {
			nextSquares[i] = "O";
		}
		onPlay(nextSquares);
	}

	const winner = calculateWinner(squares);
	let status: string;
	if (winner) {
		status = "Winner: " + winner;
	} else {
		status = "Next player: " + (xIsNext ? "X" : "O");
	}

	return (
		<div className="flex flex-col items-center">
			<div className="mb-6 text-xl font-bold text-gray-800">{status}</div>
			<div className="grid grid-rows-3 gap-0 w-fit shadow-lg rounded-lg overflow-hidden">
				<div className="flex">
					<Square value={squares[0]} onSquareClick={() => handleClick(0)} />
					<Square value={squares[1]} onSquareClick={() => handleClick(1)} />
					<Square value={squares[2]} onSquareClick={() => handleClick(2)} />
				</div>
				<div className="flex">
					<Square value={squares[3]} onSquareClick={() => handleClick(3)} />
					<Square value={squares[4]} onSquareClick={() => handleClick(4)} />
					<Square value={squares[5]} onSquareClick={() => handleClick(5)} />
				</div>
				<div className="flex">
					<Square value={squares[6]} onSquareClick={() => handleClick(6)} />
					<Square value={squares[7]} onSquareClick={() => handleClick(7)} />
					<Square value={squares[8]} onSquareClick={() => handleClick(8)} />
				</div>
			</div>
		</div>
	);
}

export default function Room() {
	const [history, setHistory] = useState<(string | null)[][]>([
		Array(9).fill(null),
	]);
	const [currentMove, setCurrentMove] = useState(0);
	const xIsNext = currentMove % 2 === 0;
	const currentSquares = history[currentMove];

	function handlePlay(nextSquares: (string | null)[]) {
		const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
		setHistory(nextHistory);
		setCurrentMove(nextHistory.length - 1);
	}

	function jumpTo(nextMove: number) {
		setCurrentMove(nextMove);
	}

	const moves = history.map((_squares, move) => {
		let description: string;
		if (move > 0) {
			description = `Go to move #${move}`;
		} else {
			description = "Go to game start";
		}
		return (
			<li
				key={`move-${
					// biome-ignore lint/suspicious/noArrayIndexKey: Being used as a unique identifier for each moves
					move
				}`}
				className="mb-2"
			>
				<button
					type="button"
					className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
					onClick={() => jumpTo(move)}
				>
					{description}
				</button>
			</li>
		);
	});

	return (
		<div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
			<div className="flex flex-col lg:flex-row gap-12 items-start">
				<div className="bg-white p-8 rounded-xl shadow-xl">
					<h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
						Tic-Tac-Toe
					</h1>
					<Board
						xIsNext={xIsNext}
						squares={currentSquares}
						onPlay={handlePlay}
					/>
				</div>
				<div className="bg-white p-6 rounded-xl shadow-xl">
					<h2 className="text-xl font-semibold mb-4 text-gray-800">
						Game History
					</h2>
					<ol className="list-none space-y-1">{moves}</ol>
				</div>
			</div>
		</div>
	);
}

function calculateWinner(squares: (string | null)[]) {
	const lines = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6],
	];
	for (let i = 0; i < lines.length; i++) {
		const [a, b, c] = lines[i];
		if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
			return squares[a];
		}
	}
	return null;
}

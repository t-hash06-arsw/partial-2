import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { io, Socket } from "socket.io-client";

export function meta() {
	return [
		{ title: "Tic-Tac-Toe Game" },
		{
			name: "description",
			content: "A simple Tic-Tac-Toe game built with React",
		},
	];
}

interface Movement {
	id: string;
	roomId: string;
	player: string;
	position: number;
	moveNumber: number;
	board: string;
	createdAt: string;
}

interface GameState {
	room: {
		id: string;
		players: string;
		board: string;
		currentPlayer: string | null;
		gameStatus: string;
		winner: string | null;
	};
	history: Movement[];
	playerSymbol: string;
	playerIndex: number;
}

function Square({
	value,
	onSquareClick,
	disabled,
}: {
	value: string | null;
	onSquareClick: () => void;
	disabled: boolean;
}) {
	const getValueColor = () => {
		if (value === "X") return "text-blue-600";
		if (value === "O") return "text-red-600";
		return "";
	};

	return (
		<button
			type="button"
			className={`w-16 h-16 border-2 border-gray-700 font-bold text-2xl bg-white hover:bg-gray-100 transition-colors ${getValueColor()} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
			onClick={onSquareClick}
			disabled={disabled}
		>
			{value}
		</button>
	);
}

function Board({
	squares,
	onPlay,
	disabled,
}: {
	squares: (string | null)[];
	onPlay: (position: number) => void;
	disabled: boolean;
}) {
	function handleClick(i: number) {
		if (squares[i] || disabled) {
			return;
		}
		onPlay(i);
	}

	return (
		<div className="flex flex-col items-center">
			<div className="grid grid-rows-3 gap-0 w-fit shadow-lg rounded-lg overflow-hidden">
				<div className="flex">
					<Square value={squares[0]} onSquareClick={() => handleClick(0)} disabled={disabled} />
					<Square value={squares[1]} onSquareClick={() => handleClick(1)} disabled={disabled} />
					<Square value={squares[2]} onSquareClick={() => handleClick(2)} disabled={disabled} />
				</div>
				<div className="flex">
					<Square value={squares[3]} onSquareClick={() => handleClick(3)} disabled={disabled} />
					<Square value={squares[4]} onSquareClick={() => handleClick(4)} disabled={disabled} />
					<Square value={squares[5]} onSquareClick={() => handleClick(5)} disabled={disabled} />
				</div>
				<div className="flex">
					<Square value={squares[6]} onSquareClick={() => handleClick(6)} disabled={disabled} />
					<Square value={squares[7]} onSquareClick={() => handleClick(7)} disabled={disabled} />
					<Square value={squares[8]} onSquareClick={() => handleClick(8)} disabled={disabled} />
				</div>
			</div>
		</div>
	);
}

export default function Room() {
	const { roomId } = useParams();
	const [socket, setSocket] = useState<Socket | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
	const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
	const [gameStatus, setGameStatus] = useState<string>("waiting");
	const [winner, setWinner] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [username, setUsername] = useState<string>("");

	useEffect(() => {
		// Get username from URL search params
		const searchParams = new URLSearchParams(window.location.search);
		const usernameParam = searchParams.get("username");
		
		if (!usernameParam) {
			setError("Username is required. Please go back and enter a username.");
			return;
		}

		setUsername(usernameParam);

		const newSocket = io(`http://${import.meta.env.VITE_BACKEND_URL}`);
		setSocket(newSocket);

		newSocket.on("connect", () => {
			console.log("Connected to server");
			newSocket.emit("joinGame", { roomId, username: usernameParam });
		});

		newSocket.on("gameState", (state: GameState) => {
			console.log("Game state received:", state);
			setGameState(state);
			const parsedBoard = JSON.parse(state.room.board);
			setBoard(parsedBoard);
			setCurrentPlayer(state.room.currentPlayer);
			setGameStatus(state.room.gameStatus);
			setWinner(state.room.winner);
		});

		newSocket.on("playerJoined", (data) => {
			console.log("Player joined:", data);
			setGameStatus(data.gameStatus);
		});

		newSocket.on("boardUpdated", (data) => {
			console.log("Board updated:", data);
			setBoard(data.board);
			setCurrentPlayer(data.currentPlayer);
			setGameStatus(data.gameStatus);
			setWinner(data.winner);
		});

		newSocket.on("error", (data) => {
			console.error("Error:", data);
			setError(data.message);
		});

		return () => {
			newSocket.close();
		};
	}, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

	function handlePlay(position: number) {
		if (!socket || !gameState) return;
		
		socket.emit("makeMove", {
			roomId,
			position,
		});
	}

	function jumpToMove(moveNumber: number) {
		if (!socket) return;
		
		socket.emit("restoreToMove", {
			roomId,
			moveNumber,
		});
	}

	const calculateWinner = (squares: (string | null)[]) => {
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
		for (const [a, b, c] of lines) {
			if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
				return squares[a];
			}
		}
		return null;
	};

	const winnerResult = calculateWinner(board);
	const isDraw = !winnerResult && board.every((cell) => cell !== null);

	let status: string;
	if (gameStatus === "waiting") {
		status = `Waiting for player 2... Room ID: ${roomId}`;
	} else if (winner) {
		if (winner === "draw") {
			status = "Game ended in a draw!";
		} else if (gameState) {
			// Show username instead of symbol
			const players = JSON.parse(gameState.room.players);
			const winnerUsername = winner === "X" ? players[0] : players[1];
			status = `Winner: ${winnerUsername} (${winner})!`;
		} else {
			status = `Winner: ${winner}!`;
		}
	} else if (isDraw) {
		status = "Game ended in a draw!";
	} else if (winnerResult) {
		if (gameState) {
			const players = JSON.parse(gameState.room.players);
			const winnerUsername = winnerResult === "X" ? players[0] : players[1];
			status = `Winner: ${winnerUsername} (${winnerResult})!`;
		} else {
			status = `Winner: ${winnerResult}!`;
		}
	} else if (gameState) {
		const players = JSON.parse(gameState.room.players);
		const isMyTurn = currentPlayer === players[gameState.playerIndex];
		status = isMyTurn 
			? `Your turn (${gameState.playerSymbol})` 
			: `Waiting for ${currentPlayer}...`;
	} else {
		status = "Loading...";
	}

	const canPlay = gameState && 
		gameStatus === "playing" && 
		!winner && 
		!winnerResult &&
		currentPlayer === JSON.parse(gameState.room.players)[gameState.playerIndex];

	// Build history for display
	const moves = [
		<li key="move-0" className="mb-2">
			<button
				type="button"
				className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
				onClick={() => jumpToMove(0)}
			>
				Go to game start
			</button>
		</li>
	];

	if (gameState?.history) {
		for (const move of gameState.history) {
			moves.push(
				<li key={`move-${move.moveNumber}`} className="mb-2">
					<button
						type="button"
						className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
						onClick={() => jumpToMove(move.moveNumber)}
					>
						Go to move #{move.moveNumber} ({move.player} at position {move.position})
					</button>
				</li>
			);
		}
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
			<div className="flex flex-col lg:flex-row gap-12 items-start">
				<div className="bg-white p-8 rounded-xl shadow-xl">
					<h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
						Tic-Tac-Toe
					</h1>
					{gameState && (
						<div className="text-center text-sm text-gray-600 mb-4">
							<p className="font-semibold">Playing as: {username}</p>
							<p>Symbol: {gameState.playerSymbol}</p>
							{gameState.room.players && JSON.parse(gameState.room.players).length === 2 && (
								<p className="text-xs mt-1">
									Opponent: {JSON.parse(gameState.room.players).find((p: string) => p !== username)}
								</p>
							)}
						</div>
					)}
					<div className="mb-6 text-xl font-bold text-gray-800 text-center">{status}</div>
					{error && (
						<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
							{error}
						</div>
					)}
					<Board
						squares={board}
						onPlay={handlePlay}
						disabled={!canPlay}
					/>
				</div>
				<div className="bg-white p-6 rounded-xl shadow-xl max-h-[600px] overflow-y-auto">
					<h2 className="text-xl font-semibold mb-4 text-gray-800">
						Game History
					</h2>
					<ol className="list-none space-y-1">{moves}</ol>
				</div>
			</div>
		</div>
	);
}

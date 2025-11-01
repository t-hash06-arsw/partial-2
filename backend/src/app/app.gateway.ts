import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { and, desc, eq } from "drizzle-orm";
import { Server, Socket } from "socket.io";
import { DrizzleClient } from "src/drizzle/drizzle.client";
import { movements, rooms } from "./app.schema";

@WebSocketGateway({
	cors: "*", 
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	
	private socketToUsername = new Map<string, string>();
	
	private usernameToSocket = new Map<string, string>();

	public constructor(private readonly drizzle: DrizzleClient) {}

	handleConnection(client: Socket) {
		console.log(`Client connected: ${client.id}`);
	}

	handleDisconnect(client: Socket) {
		console.log(`Client disconnected: ${client.id}`);
		const username = this.socketToUsername.get(client.id);
		if (username) {
			this.socketToUsername.delete(client.id);
			this.usernameToSocket.delete(username);
		}
	}

	@SubscribeMessage("joinGame")
	async handleJoinGame(client: Socket, data: { roomId: string; username: string }) {
		const { roomId, username } = data;

		if (!username || username.trim().length === 0) {
			client.emit("error", { message: "Username is required" });
			return;
		}

		const [gameRoom] = await this.drizzle.client
			.select()
			.from(rooms)
			.where(eq(rooms.id, roomId));

		if (!gameRoom) {
			client.emit("error", { message: "Room not found" });
			return;
		}

		const players = JSON.parse(gameRoom.players);

		
		if (players.length >= 2 && !players.includes(username)) {
			client.emit("error", { message: "Room is full" });
			return;
		}

		
		this.socketToUsername.set(client.id, username);
		this.usernameToSocket.set(username, client.id);

		
		if (!players.includes(username)) {
			players.push(username);
			
			
			const gameStatus = players.length === 2 ? "playing" : "waiting";
			const currentPlayer = players.length === 2 ? players[0] : null;

			await this.drizzle.client
				.update(rooms)
				.set({
					players: JSON.stringify(players),
					gameStatus,
					currentPlayer,
				})
				.where(eq(rooms.id, roomId));
		}

		client.join(roomId);

		
		const history = await this.drizzle.client
			.select()
			.from(movements)
			.where(eq(movements.roomId, roomId))
			.orderBy(movements.moveNumber);

		
		const playerSymbol = players[0] === username ? "X" : "O";

		
		const [updatedRoom] = await this.drizzle.client
			.select()
			.from(rooms)
			.where(eq(rooms.id, roomId));

		client.emit("gameState", {
			room: updatedRoom,
			history,
			playerSymbol,
			playerIndex: players.indexOf(username),
			username,
		});

		
		const updatedHistory = await this.drizzle.client
			.select()
			.from(movements)
			.where(eq(movements.roomId, roomId))
			.orderBy(movements.moveNumber);

		this.server.to(roomId).emit("playerJoined", {
			players: JSON.parse(updatedRoom.players),
			gameStatus: updatedRoom.gameStatus,
			history: updatedHistory,
		});
	}

	@SubscribeMessage("makeMove")
	async handleMakeMove(
		client: Socket,
		data: { roomId: string; position: number },
	) {
		const username = this.socketToUsername.get(client.id);
		if (!username) {
			client.emit("error", { message: "Username not found" });
			return;
		}

		const [gameRoom] = await this.drizzle.client
			.select()
			.from(rooms)
			.where(eq(rooms.id, data.roomId));

		if (!gameRoom) {
			client.emit("error", { message: "Room not found" });
			return;
		}

		if (gameRoom.gameStatus !== "playing") {
			client.emit("error", { message: "Game is not active" });
			return;
		}

		if (gameRoom.currentPlayer !== username) {
			client.emit("error", { message: "Not your turn" });
			return;
		}

		const board = JSON.parse(gameRoom.board);
		const players = JSON.parse(gameRoom.players);

		
		if (data.position < 0 || data.position > 8 || board[data.position] !== null) {
			client.emit("error", { message: "Invalid move" });
			return;
		}

		
		const playerSymbol = players[0] === username ? "X" : "O";
		
		
		board[data.position] = playerSymbol;

		
		const winner = this.calculateWinner(board);
		const isDraw = !winner && board.every((cell) => cell !== null);

		
		const nextPlayer = winner || isDraw ? null : players[0] === username ? players[1] : players[0];
		const gameStatus = winner || isDraw ? "finished" : "playing";
		const winnerValue = winner ? winner : isDraw ? "draw" : null;

		
		const [lastMove] = await this.drizzle.client
			.select()
			.from(movements)
			.where(eq(movements.roomId, data.roomId))
			.orderBy(desc(movements.moveNumber))
			.limit(1);

		const moveNumber = lastMove ? lastMove.moveNumber + 1 : 1;

		
		await this.drizzle.client.insert(movements).values({
			roomId: data.roomId,
			player: playerSymbol,
			position: data.position,
			moveNumber,
			board: JSON.stringify(board),
		});

		
		await this.drizzle.client
			.update(rooms)
			.set({
				board: JSON.stringify(board),
				currentPlayer: nextPlayer,
				gameStatus,
				winner: winnerValue,
			})
			.where(eq(rooms.id, data.roomId));

		
		const updatedHistory = await this.drizzle.client
			.select()
			.from(movements)
			.where(eq(movements.roomId, data.roomId))
			.orderBy(movements.moveNumber);

		
		this.server.to(data.roomId).emit("boardUpdated", {
			board,
			currentPlayer: nextPlayer,
			gameStatus,
			winner: winnerValue,
			history: updatedHistory,
			lastMove: {
				player: playerSymbol,
				position: data.position,
				moveNumber,
			},
		});
	}

	@SubscribeMessage("restoreToMove")
	async handleRestoreToMove(
		client: Socket,
		data: { roomId: string; moveNumber: number },
	) {
		const [gameRoom] = await this.drizzle.client
			.select()
			.from(rooms)
			.where(eq(rooms.id, data.roomId));

		if (!gameRoom) {
			client.emit("error", { message: "Room not found" });
			return;
		}

		let board: (string | null)[];
		let moveNumber: number;

		if (data.moveNumber === 0) {
			
			board = Array(9).fill(null);
			moveNumber = 0;
		} else {
			
			const [move] = await this.drizzle.client
				.select()
				.from(movements)
				.where(and(eq(movements.roomId, data.roomId), eq(movements.moveNumber, data.moveNumber)))
				.limit(1);

			if (!move) {
				client.emit("error", { message: "Move not found" });
				return;
			}

			board = JSON.parse(move.board);
			moveNumber = move.moveNumber;
		}

		
		const winner = this.calculateWinner(board);
		const isDraw = !winner && board.every((cell) => cell !== null);
		
		const players = JSON.parse(gameRoom.players);
		const nextPlayer = winner || isDraw ? null : moveNumber % 2 === 0 ? players[0] : players[1];
		const gameStatus = winner || isDraw ? "finished" : players.length === 2 ? "playing" : "waiting";
		const winnerValue = winner ? winner : isDraw ? "draw" : null;

		
		await this.drizzle.client
			.update(rooms)
			.set({
				board: JSON.stringify(board),
				currentPlayer: nextPlayer,
				gameStatus,
				winner: winnerValue,
			})
			.where(eq(rooms.id, data.roomId));

		
		const updatedHistory = await this.drizzle.client
			.select()
			.from(movements)
			.where(eq(movements.roomId, data.roomId))
			.orderBy(movements.moveNumber);

		
		this.server.to(data.roomId).emit("boardUpdated", {
			board,
			currentPlayer: nextPlayer,
			gameStatus,
			winner: winnerValue,
			history: updatedHistory,
		});
	}

	private calculateWinner(squares: (string | null)[]): string | null {
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
	}
}

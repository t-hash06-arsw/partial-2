import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { eq } from "drizzle-orm";
import { Server, Socket } from "socket.io";
import { DrizzleClient } from "src/drizzle/drizzle.client";
import { rooms } from "./app.schema";

@WebSocketGateway({})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	public constructor(private readonly drizzle: DrizzleClient) {}

	handleConnection(client: Socket) {
		console.log(`Client connected: ${client.id}`);
	}

	handleDisconnect(client: Socket) {
		console.log(`Client disconnected: ${client.id}`);
		// // const roomId = this.playerRooms.get(client.id);
		// // if (roomId) {
		// // 	this.rooms.delete(roomId);
		// // 	this.playerRooms.delete(client.id);
		// // }
	}

	@SubscribeMessage("joinGame")
	async handleJoinGame(client: Socket, roomId: string) {
		const [gameRoom] = await this.drizzle.client
			.select()
			.from(rooms)
			.where(eq(rooms.id, roomId));

		if (!gameRoom || gameRoom.players.length >= 2) {
			client.emit("error", { message: "Cannot join game" });
			return;
		}

		const updatedPlayers = [...gameRoom.players, client.id];
		await this.drizzle.client
			.update(rooms)
			.set({
				players: JSON.stringify(updatedPlayers),
				gameStatus: "playing",
			})
			.where(eq(rooms.id, roomId));

		client.join(roomId);
		this.server.to(roomId).emit("gameStarted", { players: updatedPlayers });
	}

	@SubscribeMessage("makeMove")
	async handleMakeMove(
		client: Socket,
		data: { roomId: string; position: number },
	) {
		const [gameRoom] = await this.drizzle.client
			.select()
			.from(rooms)
			.where(eq(rooms.id, data.roomId));

		if (!gameRoom || gameRoom.currentPlayer !== client.id) {
			client.emit("error", { message: "Invalid move" });
			return;
		}

		const playerSymbol = gameRoom.players[0] === client.id ? "X" : "O";
		const nextPlayer =
			gameRoom.players[0] === client.id
				? gameRoom.players[1]
				: gameRoom.players[0];

		await this.drizzle.client
			.update(rooms)
			.set({
				board: JSON.stringify(
					[
						...JSON.parse(gameRoom.board),
						...[...Array(9)].map((_, i) =>
							i === data.position ? playerSymbol : null,
						),
					].filter((v) => v !== null),
				),
				currentPlayer: nextPlayer,
			})
			.where(eq(rooms.id, data.roomId));

		this.server.to(data.roomId).emit("boardUpdated", {
			board: gameRoom.board,
			currentPlayer: nextPlayer,
		});
	}
}

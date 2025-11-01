import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

function generateRoomIdentifier(): string {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateMovementIdentifier(): string {
	return Math.random().toString(36).substring(2, 16).toUpperCase();
}

export const rooms = sqliteTable("rooms", {
	id: text().$defaultFn(generateRoomIdentifier).primaryKey().notNull(),
	players: text().notNull().default("[]"), // JSON stringified array of usernames
	board: text().notNull().default('[null,null,null,null,null,null,null,null,null]'), // JSON stringified array with 9 positions
	currentPlayer: text(), // username of current player
	gameStatus: text().notNull().default("waiting"), // "waiting" | "playing" | "finished"
	winner: text(), // 'X', 'O', or 'draw'
	createdAt: text()
		.$defaultFn(() => new Date().toISOString())
		.notNull(),
});

export const movements = sqliteTable("movements", {
	id: text().$defaultFn(generateMovementIdentifier).primaryKey().notNull(),
	roomId: text()
		.notNull()
		.references(() => rooms.id),
	player: text().notNull(), // 'X' or 'O'
	position: integer().notNull(), // 0-8 for tic tac toe board
	moveNumber: integer().notNull(),
	board: text().notNull(), // Board state after this move
	createdAt: text()
		.$defaultFn(() => new Date().toISOString())
		.notNull(),
});

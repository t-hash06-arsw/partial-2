import { sqliteTable, text } from "drizzle-orm/sqlite-core";

function generateRoomIdentifier(): string {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const rooms = sqliteTable("rooms", {
	id: text().$defaultFn(generateRoomIdentifier).notNull(),
});

export const movements = sqliteTable("movements", {
	id: text().$defaultFn(generateRoomIdentifier).primaryKey().notNull(),
	roomId: text()
		.notNull()
		.references(() => rooms.id),
	player: text().notNull(), // 'X' or 'O'
	position: text().notNull(), // 0-8 for tic tac toe board
	moveNumber: text().notNull(),
	createdAt: text()
		.$defaultFn(() => new Date().toISOString())
		.notNull(),
});

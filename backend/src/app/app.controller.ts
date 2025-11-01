import {
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DrizzleClient } from "src/drizzle/drizzle.client";
import { rooms } from "./app.schema";

@Controller("/api")
export class AppController {
	constructor(private readonly drizzle: DrizzleClient) {}

	@Get("/rooms/:id")
	async getRoomById(@Param("id") id: string) {
		const room = await this.drizzle.client
			.select()
			.from(rooms)
			.where(eq(rooms.id, id))
			.limit(1);

		if (!room[0]) {
			throw new NotFoundException("Room not found");
		}

		return room[0];
	}

	@Post("/rooms")
	async createNewRoom() {
		const [room] = await this.drizzle.client
			.insert(rooms)
			.values({ currentPlayer: "X" })
			.returning();

		return room;
	}
}

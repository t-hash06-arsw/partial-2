import { Controller, Post } from "@nestjs/common";
import { DrizzleClient } from "src/drizzle/drizzle.client";
import { rooms } from "./app.schema";

@Controller("/api")
export class AppController {
	constructor(private readonly drizzle: DrizzleClient) {}

	@Post("/room")
	async createNewRoom() {
		const [room] = await this.drizzle.client
			.insert(rooms)
			.values({})
			.returning();

		return room;
	}
}

import { Injectable } from "@nestjs/common";
import { drizzle } from "drizzle-orm/libsql/node";

@Injectable()
export class DrizzleClient {
	public readonly client: ReturnType<typeof drizzle>;

	public constructor() {
		this.client = drizzle(process.env.DATABASE_URL || "file:./database.db");
	}
}

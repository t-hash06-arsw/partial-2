import { Module } from "@nestjs/common";
import { DrizzleClient } from "src/drizzle/drizzle.client";
import { DrizzleModule } from "src/drizzle/drizzle.module";
import { AppController } from "./app.controller";

@Module({
	imports: [DrizzleModule],
	controllers: [AppController],
	providers: [DrizzleClient],
	exports: [DrizzleClient],
})
export class AppModule {}

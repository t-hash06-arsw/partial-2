import { Module } from "@nestjs/common";
import { DrizzleClient } from "src/drizzle/drizzle.client";
import { DrizzleModule } from "src/drizzle/drizzle.module";
import { AppController } from "./app.controller";
import { AppGateway } from "./app.gateway";

@Module({
	imports: [DrizzleModule],
	controllers: [AppController],
	providers: [DrizzleClient, AppGateway],
	exports: [DrizzleClient],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { DrizzleClient } from "src/drizzle/drizzle.client";
import { DrizzleModule } from "src/drizzle/drizzle.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
	imports: [DrizzleModule],
	controllers: [AppController],
	providers: [AppService, DrizzleClient],
	exports: [DrizzleClient],
})
export class AppModule {}

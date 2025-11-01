import { HeroUIProvider } from "@heroui/react";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
	return <HeroUIProvider>{children}</HeroUIProvider>;
}

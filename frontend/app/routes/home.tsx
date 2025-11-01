import { Button, Input } from "@heroui/react";

export default function Home() {
	return (
		<main className="w-dvw h-dvh overflow-hidden flex items-center justify-center">
			<div className="p-8 shadow-large rounded-medium flex flex-col gap-4">
				<div className="flex gap-4">
					<Input placeholder="Room Id" />
					<Button color="success">Join room</Button>
				</div>

				<p className="w-full text-center text-small text-default-500">
					Or you can just
				</p>

				<Button color="primary">Create a new room</Button>
			</div>
		</main>
	);
}

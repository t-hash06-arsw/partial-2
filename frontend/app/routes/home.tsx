import { Button, Input } from "@heroui/react";
import { useNavigate } from "react-router";

export default function Home() {
	const navigate = useNavigate();

	const handleNewRoom = async () => {
		const request = await fetch(
			`http://${import.meta.env.VITE_BACKEND_URL}/api/rooms`,
			{
				method: "POST",
			},
		);

		const room = await request.json();

		navigate(`/room?roomId=${room.id}`);
	};

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

				<Button color="primary" onPress={handleNewRoom}>
					Create a new room
				</Button>
			</div>
		</main>
	);
}

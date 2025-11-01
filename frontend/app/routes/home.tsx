import { Button, Input } from "@heroui/react";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function Home() {
	const navigate = useNavigate();
	const [roomId, setRoomId] = useState("");
	const [username, setUsername] = useState("");
	const [error, setError] = useState("");

	const handleNewRoom = async () => {
		if (!username.trim()) {
			setError("Please enter a username");
			return;
		}

		setError("");

		const request = await fetch(
			`http://${import.meta.env.VITE_BACKEND_URL}/api/rooms`,
			{
				method: "POST",
			},
		);

		const room = await request.json();

		navigate(`/room/${room.id}?username=${encodeURIComponent(username.trim())}`);
	};

	const handleJoinRoom = () => {
		if (!username.trim()) {
			setError("Please enter a username");
			return;
		}

		if (!roomId.trim()) {
			setError("Please enter a room ID");
			return;
		}

		setError("");
		navigate(`/room/${roomId.trim()}?username=${encodeURIComponent(username.trim())}`);
	};

	return (
		<main className="w-dvw h-dvh overflow-hidden flex items-center justify-center bg-linear-to-br from-blue-50 to-purple-50">
			<div className="p-8 shadow-large rounded-medium flex flex-col gap-4 bg-white min-w-[400px]">
				<h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Tic-Tac-Toe</h1>
				
				{error && (
					<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
						{error}
					</div>
				)}

				<Input 
					label="Username"
					placeholder="Enter your username" 
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					required
					className="mb-2"
				/>
				
				<div className="border-t border-gray-200 pt-4 mt-2">
					<p className="text-sm text-gray-600 mb-3">Join existing room:</p>
					<div className="flex gap-2">
						<Input 
							placeholder="Room ID" 
							value={roomId}
							onChange={(e) => setRoomId(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
						/>
						<Button color="success" onPress={handleJoinRoom}>
							Join
						</Button>
					</div>
				</div>

				<p className="w-full text-center text-small text-default-500 my-2">
					or
				</p>

				<Button color="primary" onPress={handleNewRoom} size="lg">
					Create New Room
				</Button>
			</div>
		</main>
	);
}

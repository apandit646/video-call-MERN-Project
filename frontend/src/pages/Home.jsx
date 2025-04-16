import React, { useEffect, useState } from "react";
import { UseSocket } from "../providers/Socket";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const socket = UseSocket();
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!room) {
      setError("Please enter a room name");
      return;
    }

    setError("");
    setLoading(true);

    socket.emit("join-room", {
      roomId: room,
      emailId: email,
    });

    console.log(`Joining room: ${room} with email: ${email}`);

    // Set a timeout to handle potential connection issues
    setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError("Connection timeout. Please try again.");
      }
    }, 5000);
  };

  const handleRoomJoin = (roomId) => {
    console.log("Room joined successfully:", roomId);
    setLoading(false);
    navigate(`/room/${roomId}`);
  };

  useEffect(() => {
    socket.on("joined-room", (data) => {
      console.log("joined-room event received:", data);
      handleRoomJoin(data.roomId);
    });

    socket.on("error-joining-room", (data) => {
      setLoading(false);
      setError(data.message || "Error joining room. Please try again.");
    });

    // Clean up on unmount
    return () => {
      socket.off("joined-room");
      socket.off("error-joining-room");
    };
  }, [socket]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Welcome</h1>
          <p className="text-gray-600 mt-2">Join a room to start chatting</p>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1 ml-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-gray-50"
            />
          </div>

          <div>
            <label
              htmlFor="room"
              className="block text-sm font-medium text-gray-700 mb-1 ml-1"
            >
              Room Name
            </label>
            <input
              id="room"
              type="text"
              placeholder="Enter a room name"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 bg-gray-50"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleJoinRoom}
            disabled={loading}
            className={`w-full py-3 rounded-xl transition duration-200 font-medium text-white shadow-lg ${
              loading
                ? "bg-purple-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 hover:shadow-xl transform hover:-translate-y-1"
            }`}
          >
            {loading ? "Connecting..." : "Join Room"}
          </button>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">Need help? Contact support</p>
          </div>
        </div>
      </div>
    </div>
  );
};

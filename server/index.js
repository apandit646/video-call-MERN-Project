const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http"); // Needed to combine Express and Socket.IO
const { Server } = require("socket.io");

const app = express();
const port = 8000;

// Middleware
app.use(express.json());
app.use(cors());

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Attach Socket.IO to the server
const io = new Server(server, {
    cors: {
        origin: true, // Adjust in production
        methods: ["GET", "POST"]
    }
});


const emailToSocketMapping = new Map();


// Socket.IO events
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Handle your socket events here
    socket.on("message", (data) => {
        console.log("Message received:", data);
        // Example: broadcast to all clients
        io.emit("message", data);
    });

    socket.on("join-room", data => {
        const { roomId, emailId } = data;
        socket.join(roomId);
        emailToSocketMapping.set(emailId, socket.id);
        console.log(`${emailId} joined room ${roomId}`);
        socket.emit("joined-room", { roomId });
        socket.broadcast.to(roomId).emit("user-joined", { emailId })
    })

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// Start the combined server
server.listen(port, () => {
    console.log(`Server (HTTP + Socket.IO) is running on port ${port}`);
});

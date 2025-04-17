const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const port = 8000;

app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"]
    }
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", data => {
        const { roomId, emailId } = data;
        socket.join(roomId);

        emailToSocketMapping.set(emailId, socket.id);
        socketToEmailMapping.set(socket.id, emailId);

        console.log(`${emailId} joined room ${roomId}`);
        socket.emit("joined-room", { roomId });

        socket.broadcast.to(roomId).emit("user-joined", { emailId });

        // Handle calling another user
        socket.on("call-user", data => {
            const { emailId, offer } = data;
            const fromEmail = socketToEmailMapping.get(socket.id);
            const targetSocketId = emailToSocketMapping.get(emailId);

            if (targetSocketId) {
                io.to(targetSocketId).emit("incoming-call", {
                    from: fromEmail,
                    offer
                });
            }
        });

        // Handle answering a call
        socket.on("call-accepted", data => {
            const { emailId, answer } = data;
            const fromEmail = socketToEmailMapping.get(socket.id);
            const targetSocketId = emailToSocketMapping.get(emailId);

            if (targetSocketId) {
                io.to(targetSocketId).emit("call-accepted", {
                    from: fromEmail,
                    answer
                });
            }
        });
    });

    socket.on("disconnect", () => {
        const email = socketToEmailMapping.get(socket.id);
        emailToSocketMapping.delete(email);
        socketToEmailMapping.delete(socket.id);
        console.log("User disconnected:", socket.id);
    });
});

server.listen(port, () => {
    console.log(`Server (HTTP + Socket.IO) is running on port ${port}`);
});

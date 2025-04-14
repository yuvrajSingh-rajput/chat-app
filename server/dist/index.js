"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const uuid_1 = require("uuid");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const allSockets = new Map();
wss.on("connection", (socket) => {
    console.log("User connected!");
    socket.on("message", (data) => {
        try {
            const message = JSON.parse(data.toString());
            // Handle creating a room
            if (message.type === "create-room") {
                const newRoomId = (0, uuid_1.v4)();
                allSockets.set(newRoomId, [socket]);
                socket.send(JSON.stringify({
                    type: "room-created",
                    payload: {
                        roomId: newRoomId,
                    }
                }));
                console.log(`new room created: ${newRoomId}`);
            }
            else if (message.type == "join") {
                const roomId = message.payload.roomId;
                if (!allSockets.has(roomId)) {
                    socket.send(JSON.stringify({
                        type: "error",
                        payload: {
                            message: `Room ${roomId} does not exist. Please check the Room ID.`
                        }
                    }));
                    return;
                }
                // Avoid duplicate join
                const roomSockets = allSockets.get(roomId);
                if (!roomSockets.includes(socket)) {
                    roomSockets.push(socket);
                }
                roomSockets.forEach((s) => {
                    if (s !== socket && s.readyState === ws_1.WebSocket.OPEN) {
                        s.send(JSON.stringify({
                            type: "user-joined",
                            payload: {
                                message: "a new user joined the room",
                                roomId: roomId,
                            }
                        }));
                    }
                });
                console.log(`User joined room: ${roomId}`);
            }
            // Handle chat messages
            else if (message.type === "chat") {
                let currentRoomId = null;
                // Find the room this socket belongs to
                for (const [roomId, sockets] of allSockets.entries()) {
                    if (sockets.includes(socket)) {
                        currentRoomId = roomId;
                        break;
                    }
                }
                if (currentRoomId) {
                    const roomSockets = allSockets.get(currentRoomId);
                    // Broadcast to other clients in the room
                    roomSockets.forEach((s) => {
                        if (s !== socket && s.readyState === ws_1.WebSocket.OPEN) {
                            s.send(JSON.stringify({
                                type: "chat",
                                payload: {
                                    message: message.payload.message,
                                }
                            }));
                        }
                    });
                }
            }
        }
        catch (err) {
            console.error("Failed to parse message", err);
        }
    });
    socket.on("close", () => {
        console.log("User disconnected");
        // Remove socket from all rooms
        for (const [roomId, sockets] of allSockets.entries()) {
            const filtered = sockets.filter((s) => s !== socket);
            if (filtered.length > 0) {
                allSockets.set(roomId, filtered);
            }
            else {
                allSockets.delete(roomId);
            }
        }
    });
});

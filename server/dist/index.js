"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const uuid_1 = require("uuid");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const allSockets = new Map();
wss.on("connection", (socket) => {
    console.log("User connected!");
    socket.on("message", (data) => {
        var _a, _b;
        try {
            const message = JSON.parse(data.toString());
            console.log("Server received:", message);
            // Handle creating a room
            if (message.type === "create-room") {
                const newRoomId = (0, uuid_1.v4)();
                // Add the socket to the new room along with the username and roomName
                allSockets.set(newRoomId, [
                    {
                        socket,
                        username: message.payload.username,
                        roomName: message.payload.roomName,
                    },
                ]);
                const response = {
                    type: "room-created",
                    payload: {
                        roomName: message.payload.roomName,
                        username: message.payload.username,
                        roomId: newRoomId,
                    },
                };
                console.log("Sending room-created:", response);
                socket.send(JSON.stringify(response));
                console.log(`New room created: ${newRoomId}`);
            }
            // Handle joining a room
            else if (message.type === "join-room") {
                const roomId = message.payload.roomId;
                if (!allSockets.has(roomId)) {
                    const errorResponse = {
                        type: "error",
                        payload: {
                            message: `Room ${roomId} does not exist. Please check the Room ID.`,
                        },
                    };
                    console.log("Sending error:", errorResponse);
                    socket.send(JSON.stringify(errorResponse));
                    return;
                }
                // Avoid duplicate join
                const roomSockets = allSockets.get(roomId);
                if (!roomSockets.some((s) => s.socket === socket)) {
                    roomSockets.push({
                        socket,
                        username: message.payload.username,
                        roomName: ((_a = roomSockets[0]) === null || _a === void 0 ? void 0 : _a.roomName) || "",
                    });
                }
                // Notify the joining user
                const joinResponse = {
                    type: "user-joined",
                    payload: {
                        message: `${message.payload.username} has joined the room.`,
                        roomId: roomId,
                        username: message.payload.username,
                        roomName: ((_b = roomSockets[0]) === null || _b === void 0 ? void 0 : _b.roomName) || "",
                    },
                };
                console.log("Sending user-joined to joining user:", joinResponse);
                socket.send(JSON.stringify(joinResponse));
                // Notify others in the room
                roomSockets.forEach((s) => {
                    var _a;
                    if (s.socket !== socket && s.socket.readyState === ws_1.WebSocket.OPEN) {
                        const otherResponse = {
                            type: "user-joined",
                            payload: {
                                message: `${message.payload.username} has joined the room.`,
                                roomId: roomId,
                                username: message.payload.username,
                                roomName: ((_a = roomSockets[0]) === null || _a === void 0 ? void 0 : _a.roomName) || "",
                            },
                        };
                        console.log("Sending user-joined to others:", otherResponse);
                        s.socket.send(JSON.stringify(otherResponse));
                    }
                });
                console.log(`User joined room: ${roomId}`);
            }
            // Handle chat messages
            else if (message.type === "chat") {
                let currentRoomId = null;
                const { id, content, timestamp, username } = message.payload;
                // Find the room this socket belongs to
                for (const [roomId, sockets] of allSockets.entries()) {
                    if (sockets.some((s) => s.socket === socket)) {
                        currentRoomId = roomId;
                        break;
                    }
                }
                if (currentRoomId) {
                    const roomSockets = allSockets.get(currentRoomId);
                    // Broadcast to all clients (including sender for syncing UI)
                    roomSockets.forEach((s) => {
                        if (s.socket.readyState === ws_1.WebSocket.OPEN) {
                            const chatResponse = {
                                type: "chat",
                                payload: {
                                    id,
                                    content,
                                    timestamp: new Date(timestamp).toISOString(),
                                    username,
                                    roomId: currentRoomId,
                                },
                            };
                            console.log(`Broadcasting to room ${currentRoomId}:`, chatResponse);
                            s.socket.send(JSON.stringify(chatResponse));
                        }
                    });
                }
                else {
                    console.warn("Chat message ignored: User not in any room");
                }
            }
            // Handle leaving a room
            else if (message.type === "leave-room") {
                const roomId = message.payload.roomId;
                const username = message.payload.username;
                const roomUsers = allSockets.get(roomId);
                if (roomUsers) {
                    const updatedUsers = roomUsers.filter((u) => u.socket !== socket);
                    if (updatedUsers.length > 0) {
                        allSockets.set(roomId, updatedUsers);
                        // Notify others in the room
                        updatedUsers.forEach((u) => {
                            if (u.socket.readyState === ws_1.WebSocket.OPEN) {
                                const leaveResponse = {
                                    type: "user-left",
                                    payload: {
                                        message: `${username} has left the room`,
                                        roomId: roomId,
                                        username,
                                    },
                                };
                                console.log("Sending user-left:", leaveResponse);
                                u.socket.send(JSON.stringify(leaveResponse));
                            }
                        });
                    }
                    else {
                        // No users left in room, delete it
                        allSockets.delete(roomId);
                    }
                    // Notify the leaving user
                    if (socket.readyState === ws_1.WebSocket.OPEN) {
                        const leaveResponse = {
                            type: "user-left",
                            payload: {
                                message: `${username} has left the room`,
                                roomId: roomId,
                                username,
                            },
                        };
                        console.log("Sending user-left to leaving user:", leaveResponse);
                        socket.send(JSON.stringify(leaveResponse));
                    }
                    console.log(`${username} left room: ${roomId}`);
                }
            }
        }
        catch (err) {
            console.error("Failed to parse message:", err);
        }
    });
    socket.on("close", () => {
        console.log("User disconnected");
        for (const [roomId, sockets] of allSockets.entries()) {
            const filtered = sockets.filter((s) => s.socket !== socket);
            if (filtered.length !== sockets.length) {
                // Find user who left
                const user = sockets.find((s) => s.socket === socket);
                if (user) {
                    filtered.forEach((s) => {
                        if (s.socket.readyState === ws_1.WebSocket.OPEN) {
                            s.socket.send(JSON.stringify({
                                type: "user-left",
                                payload: {
                                    username: user.username,
                                    roomId,
                                    message: `${user.username} has disconnected.`,
                                },
                            }));
                        }
                    });
                }
            }
            if (filtered.length > 0) {
                allSockets.set(roomId, filtered);
            }
            else {
                allSockets.delete(roomId);
            }
        }
    });
});

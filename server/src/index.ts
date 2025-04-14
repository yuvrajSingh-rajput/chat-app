import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

const wss = new WebSocketServer({ port: 8080 });

const allSockets: Map<string, { socket: WebSocket, username: string, roomName: string }[]> = new Map();

wss.on("connection", (socket) => {
  console.log("User connected!");

  socket.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Handle creating a room
      if (message.type === "create-room") {
        const newRoomId: string = uuidv4();

        // Add the socket to the new room along with the username and roomName
        allSockets.set(newRoomId, [{
          socket,
          username: message.payload.username,
          roomName: message.payload.roomName
        }]);

        socket.send(JSON.stringify({
          type: "room-created",
          payload: {
            roomName: message.payload.roomName,
            username: message.payload.username,
            roomId: newRoomId,
          }
        }));

        console.log(`New room created: ${newRoomId}`);
      }

      // Handle joining a room
      else if (message.type === "join-room") {
        const roomId: string = message.payload.roomId;

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
        const roomSockets = allSockets.get(roomId)!;
        if (!roomSockets.some(s => s.socket === socket)) {
          roomSockets.push({
            socket,
            username: message.payload.username,
            roomName: roomSockets[0]?.roomName || '' // Assuming the room name is consistent
          });
        }

        // Notify others in the room that a new user joined
        roomSockets.forEach((s) => {
          if (s.socket !== socket && s.socket.readyState === WebSocket.OPEN) {
            s.socket.send(JSON.stringify({
              type: "user-joined",
              payload: {
                message: `${message.payload.username} has joined the room.`,
                roomId: roomId,
                username: message.payload.username,
                roomName: roomSockets[0]?.roomName || ''
              }
            }));
          }
        });

        console.log(`User joined room: ${roomId}`);
      }

      // Handle chat messages
      else if (message.type === "chat") {
        let currentRoomId: string | null = null;

        // Find the room this socket belongs to
        for (const [roomId, sockets] of allSockets.entries()) {
          if (sockets.some(s => s.socket === socket)) {
            currentRoomId = roomId;
            break;
          }
        }

        if (currentRoomId) {
          const roomSockets = allSockets.get(currentRoomId)!;

          // Broadcast to other clients in the room
          roomSockets.forEach((s) => {
            if (s.socket !== socket && s.socket.readyState === WebSocket.OPEN) {
              s.socket.send(JSON.stringify({
                type: "chat",
                payload: {
                  message: message.payload.message,
                  username: s.username
                }
              }));
            }
          });
        }
      }
      
      else if (message.type === "leave-room") {
        const roomId: string = message.payload.roomId;
        const username: string = message.payload.username;
      
        const roomUsers = allSockets.get(roomId);
        if (roomUsers) {
          const updatedUsers = roomUsers.filter(u => u.socket !== socket);
          if (updatedUsers.length > 0) {
            allSockets.set(roomId, updatedUsers);
      
            // Notify others in the room
            updatedUsers.forEach(u => {
              if (u.socket.readyState === WebSocket.OPEN) {
                u.socket.send(JSON.stringify({
                  type: "user-left",
                  payload: {
                    message: `${username} has left the room`,
                    roomId: roomId,
                  }
                }));
              }
            });
          } else {
            // No users left in room, delete it
            allSockets.delete(roomId);
          }
      
          console.log(`${username} left room: ${roomId}`);
        }
      }
      
    } catch (err) {
      console.error("Failed to parse message", err);
    }
  });

  socket.on("close", () => {
    console.log("User disconnected");

    // Remove socket from all rooms
    for (const [roomId, sockets] of allSockets.entries()) {
      const filtered = sockets.filter((s) => s.socket !== socket);
      if (filtered.length > 0) {
        allSockets.set(roomId, filtered);
      } else {
        allSockets.delete(roomId);
      }
    }
  });
});

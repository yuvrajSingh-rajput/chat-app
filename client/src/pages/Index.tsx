import { useEffect, useState } from "react";
import JoinRoom from "@/components/JoinRoom";
import ChatRoom from "@/components/ChatRoom";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

export interface MessageData {
  id: string;
  content: string;
  timestamp: Date;
  isCurrentUser: boolean;
  username?: string;
}

const Index = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.onopen = () => {
      setIsConnected(true);
      console.log("websocket connection established!");
    };
    ws.onmessage = (e: MessageEvent) => {
      const response = JSON.parse(e.data);
      console.log("Received message:", response);

      if (response.type == "room-created") {
        setCurrentRoom(response.payload.roomId);
        setUsername(response.payload.username);
        setRoomName(response.payload.roomName);
        toast({
          title: `room: ${response.payload.roomName} created!`,
          description: `${response.payload.username} created a new room with ID: ${response.payload.roomId}!`,
        });
      } else if (response.type == "user-joined") {
        setCurrentRoom(response.payload.roomId);
        setUsername(response.payload.username);
        setRoomName(response.payload.roomName);
        toast({
          title: `${response.payload.username} joined!`,
          description: `room ID: ${response.payload.roomId}!`,
        });
      } // In Index.tsx
      else if (response.type === "chat") {
        if (response.payload.roomId === currentRoom) {
          const newMessage: MessageData = {
            id: response.payload.id,
            content: response.payload.content,
            timestamp: new Date(response.payload.timestamp),
            isCurrentUser: response.payload.username === username,
            username: response.payload.username,
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      } else if (response.type === "error") {
        toast({
          variant: "destructive",
          title: "error in joining",
          description: response.payload.message,
        });
      } else if (response.type === "user-left") {
        toast({
          title: `${response.payload.username} left.`,
          description: `${response.payload.message} ${response.payload.roomId}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "error",
          description: "some unexpected error occured",
        });
      }
    };
    ws.onerror = (e) => {
      console.log("websocket error: ", e);
    };
    ws.onclose = () => {
      setSocket(null);
      console.log("websocket connection closed!");
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <main className="flex-1 container mx-auto p-4 md:p-6 max-w-5xl">
        {!currentRoom ? (
          <div className="h-full flex items-center justify-center py-12">
            <JoinRoom isConnected={isConnected} socket={socket} />
          </div>
        ) : (
          <div className="h-[80vh] bg-white rounded-lg shadow-md overflow-hidden border">
            <ChatRoom
              messages={messages}
              roomName={roomName}
              roomId={currentRoom}
              username={username}
              socket={socket}
              setCurrentRoom={setCurrentRoom}
              connected={isConnected}
            />
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
};

export default Index;

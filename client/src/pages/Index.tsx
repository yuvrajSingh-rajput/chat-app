import { useEffect, useState, useRef } from 'react';
import JoinRoom from '@/components/JoinRoom';
import ChatRoom from '@/components/ChatRoom';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

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
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { toast } = useToast();

  // Use refs to persist critical state
  const currentRoomRef = useRef<string | null>(null);
  const usernameRef = useRef<string>('');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log('Index useEffect running, socketRef:', socketRef.current);

    // Prevent multiple WebSocket connections
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already open, skipping creation');
      return;
    }

    const ws = new WebSocket('ws://localhost:8080');
    socketRef.current = ws;
    setSocket(ws);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connection established, ws:', ws);
    };

    ws.onmessage = (e: MessageEvent) => {
      try {
        const response = JSON.parse(e.data);
        console.log('Received message:', JSON.stringify(response, null, 2));

        if (response.type === 'room-created') {
          console.log('Handling room-created:', {
            roomId: response.payload.roomId,
            username: response.payload.username,
            roomName: response.payload.roomName,
            currentRoomRef: currentRoomRef.current,
            usernameRef: usernameRef.current,
          });
          currentRoomRef.current = response.payload.roomId;
          usernameRef.current = response.payload.username || 'Unknown';
          setRoomName(response.payload.roomName || 'Unnamed Room');
          toast({
            title: `Room: ${response.payload.roomName} created!`,
            description: `${response.payload.username} created a new room with ID: ${response.payload.roomId}!`,
          });
        } else if (response.type === 'user-joined') {
          console.log('Handling user-joined:', {
            roomId: response.payload.roomId,
            username: response.payload.username,
            roomName: response.payload.roomName,
            currentRoomRef: currentRoomRef.current,
            usernameRef: usernameRef.current,
          });
          currentRoomRef.current = response.payload.roomId;
          usernameRef.current = response.payload.username || 'Unknown';
          setRoomName(response.payload.roomName || 'Unnamed Room');
          toast({
            title: `${response.payload.username} joined!`,
            description: `Room ID: ${response.payload.roomId}!`,
          });
        } else if (response.type === 'chat') {
          console.log('Chat message details:', {
            payload: response.payload,
            currentRoomRef: currentRoomRef.current,
            usernameRef: usernameRef.current,
          });
          if (response.payload.roomId === currentRoomRef.current) {
            const newMessage: MessageData = {
              id: response.payload.id,
              content: response.payload.content,
              timestamp: new Date(response.payload.timestamp),
              isCurrentUser: response.payload.username === usernameRef.current,
              username: response.payload.username,
            };
            if (isNaN(newMessage.timestamp.getTime())) {
              console.error('Invalid timestamp:', response.payload.timestamp);
              newMessage.timestamp = new Date();
            }
            setMessages((prev) => {
              const updated = [...prev, newMessage];
              console.log('Updated messages:', updated);
              return updated;
            });
          } else {
            console.warn('Message ignored: Room ID mismatch', {
              messageRoomId: response.payload.roomId,
              currentRoomRef: currentRoomRef.current,
            });
          }
        } else if (response.type === 'error') {
          console.error('Server error:', response.payload.message);
          toast({
            variant: 'destructive',
            title: 'Error in joining',
            description: response.payload.message,
          });
        } else if (response.type === 'user-left') {
          console.log('User left:', response.payload);
          toast({
            title: `${response.payload.username} left.`,
            description: `${response.payload.message} ${response.payload.roomId}.`,
          });
        } else {
          console.warn('Unknown message type:', response.type);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Some unexpected error occurred',
          });
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err, e.data);
      }
    };

    ws.onerror = (e) => {
      console.error('WebSocket error:', e);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed, ws:', ws);
      setSocket(null);
      setIsConnected(false);
      socketRef.current = null;
      // Persist currentRoomRef and usernameRef
    };

    return () => {
      console.log('Cleaning up WebSocket, socketRef:', socketRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  // Log state changes
  useEffect(() => {
    console.log('State updated:', {
      currentRoomRef: currentRoomRef.current,
      usernameRef: usernameRef.current,
      isConnected,
    });
  }, [isConnected]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <main className="flex-1 container mx-auto p-4 md:p-6 max-w-5xl">
        {!currentRoomRef.current ? (
          <div className="h-full flex items-center justify-center py-12">
            <JoinRoom isConnected={isConnected} socket={socket} />
          </div>
        ) : (
          <div className="h-[80vh] bg-white rounded-lg shadow-md overflow-hidden border">
            <ChatRoom
              messages={messages}
              roomName={roomName}
              roomId={currentRoomRef.current}
              username={usernameRef.current}
              socket={socket}
              setCurrentRoom={(value: string) => (currentRoomRef.current = value)}
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
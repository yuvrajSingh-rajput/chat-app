
import { useState, useEffect, useCallback } from 'react'; 
import { webSocketService, WebSocketMessage } from '../services/websocket';

type MessageCallback = (message: any) => void;

export function useWebSocket() {
  const [connected, setConnected] = useState(true); // Default to connected for UI development

  useEffect(() => {
    // Connect to WebSocket when the hook is first used
    webSocketService.connect();

    // Set up connection status listener
    const unsubscribe = webSocketService.onConnectionChange((isConnected) => {
      setConnected(isConnected);
    });
    
    // Initial connection state
    setConnected(webSocketService.isConnected());

    // Clean up on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const joinRoom = useCallback((roomId: string, username: string = '') => {
    webSocketService.joinRoom(roomId, username);
  }, []);

  const sendMessage = useCallback((message: string) => {
    webSocketService.sendMessage(message);
  }, []);

  const onMessage = useCallback((callback: MessageCallback) => {
    return webSocketService.onMessage(callback);
  }, []);

  return {
    connected,
    joinRoom,
    sendMessage,
    onMessage
  };
}

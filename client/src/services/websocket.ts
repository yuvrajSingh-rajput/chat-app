
type MessageHandler = (message: any) => void;

export interface WebSocketMessage {
  type: "join" | "chat";
  payload: any;
}

// This is a stub implementation. Replace with your own backend logic.
export class WebSocketService {
  private messageHandlers: MessageHandler[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  constructor() {
    // Empty constructor - backend implementation will be added by user
  }

  connect() {
    // Connection implementation will be provided by user
    console.log("WebSocket connect stub called");
    this.notifyConnectionChange(true);
  }

  disconnect() {
    // Disconnect implementation will be provided by user
    console.log("WebSocket disconnect stub called");
    this.notifyConnectionChange(false);
  }

  send(message: WebSocketMessage) {
    // Message sending implementation will be provided by user
    console.log("Send message stub called:", message);
  }

  joinRoom(roomId: string, username: string = '') {
    // Join room implementation will be provided by user
    console.log("Join room stub called:", roomId, username);
    this.send({
      type: "join",
      payload: { roomId, username }
    });
  }

  sendMessage(message: string) {
    // Send message implementation will be provided by user
    console.log("Send message stub called:", message);
    this.send({
      type: "chat",
      payload: { message }
    });
  }

  onMessage(handler: MessageHandler) {
    // Message handler registration will be provided by user
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }
 
  onConnectionChange(handler: (connected: boolean) => void) {
    // Connection change handler registration will be provided by user
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  isConnected(): boolean {
    // Connection status check will be provided by user
    return true; // Default to connected for UI development
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Message from "./Message";
import {
  ArrowLeft,
  Copy,
  MessageCircle,
  SendHorizontal,
  Users,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageData } from "@/pages/Index";

interface ChatRoomProps {
  messages: MessageData[];
  roomName: string;
  roomId: string;
  username: string;
  socket: WebSocket;
  setCurrentRoom: React.Dispatch<React.SetStateAction<string>>;
  connected: boolean;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  messages,
  roomName,
  roomId,
  username,
  socket,
  setCurrentRoom,
  connected
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLeaveRoom = () => {
    socket.send(
      JSON.stringify({
        type: "leave-room",
        payload: {
          roomId: roomId,
          username: username,
        },
      })
    );

    setCurrentRoom(null);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    socket.send(JSON.stringify({
      type: "chat",
      payload: {
        id: Date.now().toString(),
        content: inputValue,
        timeStamp: new Date(),
        username: username,
      }
    }));

    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyRoomIdToClipboard = () => {
    navigator.clipboard
      .writeText(roomId)
      .then(() => {
        toast({
          title: "Room ID copied!",
          description:
            "You can now share this ID with others to join your chat room.",
        });
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "Failed to copy",
          description: "Please try again or manually select and copy the ID.",
        });
      });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="py-4 px-6 flex items-center justify-between bg-card border-b sticky top-0 z-10">
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-chat-primary flex items-center justify-center mr-3 shadow-sm">
            <MessageCircle className="text-white h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Room: {roomName}</h2>
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              <span>Joined as: {username}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-md px-3 py-1">
            <Input
              value={roomId}
              readOnly
              className="h-8 border-none bg-transparent focus-visible:ring-0 w-[120px] md:w-auto"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 hover:bg-primary/10"
              onClick={copyRoomIdToClipboard}
              title="Copy Room ID"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLeaveRoom}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Leave
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 pb-4 px-2">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground py-20">
              <div className="text-center">
                <div className="h-16 w-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/70" />
                </div>
                <p className="text-lg font-medium mb-2">No messages yet</p>
                <p className="text-sm max-w-sm">
                  Share the room ID with others to start chatting together
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message
                key={message.id}
                content={message.content}
                timestamp={message.timestamp}
                isCurrentUser={message.isCurrentUser}
                username={
                  message.username ||
                  (message.isCurrentUser ? username : "Other")
                }
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-4 bg-card">
        <div
          className={cn(
            "flex gap-2 transition-opacity",
            !connected && "opacity-70"
          )}
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
            disabled={!connected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!connected || !inputValue.trim()}
            className="bg-chat-primary hover:bg-chat-primary/90"
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;

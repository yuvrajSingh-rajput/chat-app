
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, Plus, Link2 } from 'lucide-react';

interface JoinRoomProps {
  isConnected: boolean;
  socket: WebSocket;
}

const JoinRoom: React.FC<JoinRoomProps> = ({ isConnected, socket }) => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [newRoomName, setNewRoomName] = useState('');

    const handleCreateRoom = (e: React.FormEvent) => {
      e.preventDefault();

      if (!newRoomName.trim()) {
        setError('Please enter a room name');
        return;
      }
      
      if (!username.trim()) {
        setError('Please enter a username');
        return;
      }

      setError('');

      const data = {
        type: "create-room",
        payload: {
          username: username,
          roomName: newRoomName,
        }
      };

      socket.send(JSON.stringify(data));
    };

    const handleJoinRoom = (e: React.FormEvent) => {
      e.preventDefault();

      if (!roomId.trim()) {
        setError('Please enter a room ID');
        return;
      }
      
      if (!username.trim()) {
        setError('Please enter a username');
        return;
      }

      setError('');

      const data = {
        type: "join-room",
        payload: {
          username: username,
          roomId: roomId,
        }
      };

      socket.send(JSON.stringify(data));
    };
  
    

  return (
    <Card className="w-full max-w-md mx-auto animate-fade-in">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-chat-primary flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Chat Rooms</CardTitle>
        <CardDescription className="text-center">
          Join an existing chat room or create a new one
        </CardDescription>
      </CardHeader>

      <Tabs defaultValue="join" className="w-full">
        <TabsList className="grid grid-cols-2 mx-6">
          <TabsTrigger value="join" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <span>Join Room</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Create Room</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="join">
          <form onSubmit={handleJoinRoom}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="username-join">Username</Label>
                <Input
                  id="username-join"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomId">Room ID</Label>
                <Input
                  id="roomId"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              {!isConnected && (
                <p className="text-amber-500 text-sm">
                  Not connected to chat server. Will attempt to connect when joining.
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-chat-primary hover:bg-chat-secondary">
                Join Room
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="create">
          <form onSubmit={handleCreateRoom}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="username-create">Username</Label>
                <Input
                  id="username-create"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newRoomName">Room Name</Label>
                <Input
                  id="newRoomName"
                  placeholder="Enter a name for your room"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A unique room ID will be automatically generated that you can share with others
                </p>
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              {!isConnected && (
                <p className="text-amber-500 text-sm">
                  Not connected to chat server. Will attempt to connect when creating.
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-chat-primary hover:bg-chat-secondary">
                Create Room
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default JoinRoom;

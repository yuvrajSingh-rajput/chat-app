
import React from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface MessageProps {
  content: string;
  timestamp: Date;
  isCurrentUser: boolean;
  username?: string;
}

const Message: React.FC<MessageProps> = ({ 
  content, 
  timestamp, 
  isCurrentUser,
  username = isCurrentUser ? 'You' : 'User'
}) => {
  // Create initials for the avatar
  const initials = username
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn(
      "flex gap-3 group animate-fade-in",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm select-none mt-auto shadow-sm"
        style={{ 
          backgroundColor: isCurrentUser ? '#9b87f5' : '#7E69AB',
          opacity: isCurrentUser ? 0.9 : 1
        }}>
        {initials}
      </div>
      
      {/* Message content */}
      <div className="flex flex-col max-w-[75%]">
        {/* Username and time */}
        <div className={cn(
          "flex items-center gap-2 text-xs mb-1",
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="font-medium text-muted-foreground">
            {isCurrentUser ? 'You' : username}
          </span>
          <span className="text-muted-foreground/60">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </span>
        </div>
        
        {/* Message bubble */}
        <div className={cn(
          "rounded-2xl p-3.5 break-words inline-block shadow-sm",
          isCurrentUser 
            ? "bg-chat-primary text-white rounded-tr-none" 
            : "bg-muted rounded-tl-none"
        )}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
};

export default Message;

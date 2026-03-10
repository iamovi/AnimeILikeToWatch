import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/anime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onSendMessage: (message: string) => void;
}

export function ChatPanel({ messages, isTyping, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const quickActions = [
    "Recommend action anime",
    "Show my stats",
    "How to backup?",
  ];

  return (
    <div className="flex flex-col h-full bg-chat-bg rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-border bg-card">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-foreground flex items-center gap-1.5">
            AniBuddy
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-anime-plan" />
          </h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Your anime companion</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 slide-up ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-foreground" />
                )}
              </div>
              <div
                className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'chat-bubble-user'
                    : 'chat-bubble-assistant'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-2 slide-up">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4 text-foreground" />
              </div>
              <div className="chat-bubble-assistant">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-soft" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-soft" style={{ animationDelay: '0.2s' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-soft" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-3 sm:px-4 pb-2 flex flex-wrap gap-1.5 sm:gap-2">
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => onSendMessage(action)}
              className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AniBuddy anything..."
            className="flex-1 bg-background text-sm"
            disabled={isTyping}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

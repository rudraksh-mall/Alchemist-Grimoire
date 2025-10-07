// src/components/ChatBot.jsx

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, MessageCircle } from 'lucide-react';
import { chatApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function ChatBot() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      message: '🔮 Greetings, seeker! I am the Mystic Fortune Teller, here to divine wisdom about your wellness journey. What mysteries shall we uncover today?',
      isUser: false,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      message: inputMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Assuming chatApi.sendMessage returns a message object in the correct format
      const response = await chatApi.sendMessage(inputMessage);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        message: '🌙 The mystical energies are disturbed... Please try again later.',
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col"
    >
      <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm magical-glow">
        <CardHeader className="flex-shrink-0 border-b-0">
          <CardTitle className="flex items-center space-x-2 font-cinzel">
            <div className="w-8 h-8 crystal-gradient rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span>Mystic Fortune Teller</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
          <div 
            className="flex-1 overflow-y-auto pr-4" 
            ref={scrollContainerRef}
          >
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-[80%] rounded-lg p-3 
                        ${message.isUser 
                          ? 'bg-primary text-primary-foreground ml-auto' 
                          : 'bg-muted text-muted-foreground'
                        }
                      `}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      <p className={`text-xs mt-1 opacity-70 ${message.isUser ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted text-muted-foreground rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      <span className="text-sm">Consulting the mystical scrolls...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex space-x-2 pt-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about your potions, schedules, or wellness..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={!inputMessage.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

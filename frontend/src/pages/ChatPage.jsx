// src/ChatPage.jsx

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { ChatBot } from "../components/ChatBot";

export function ChatPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 crystal-gradient rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-cinzel font-semibold text-foreground">
                Mystic Fortune Teller
              </h1>
            </div>
            <p className="text-muted-foreground">
              Consult the mystical oracle about your wellness journey
            </p>
          </motion.div>
        </header>

        {/* The main content area just provides a padded space */}
        <main className="flex-1 overflow-hidden p-6">
          {/* This container sets the max width and height for the chatbot */}
          <div className="h-full w-full max-w-4xl mx-auto">
            <ChatBot />
          </div>
        </main>
      </div>
    </div>
  );
}
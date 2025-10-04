import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";
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
              <div className="w-8 h-8 crystal-gradient rounded-full flex items-center justify-center magical-glow">
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

        <main className="flex-1 overflow-hidden p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-full max-w-4xl mx-auto"
          >
            <div className="h-full bg-card/30 backdrop-blur-sm rounded-xl border border-border/50 p-6 relative overflow-hidden">
              {/* Magical background effects */}
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <motion.div
                  className="absolute top-1/4 right-1/4 w-32 h-32 crystal-gradient rounded-full opacity-10 blur-xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute bottom-1/3 left-1/4 w-24 h-24 magic-gradient rounded-full opacity-10 blur-xl"
                  animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              {/* Floating sparkles */}
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${20 + (i % 4) * 20}%`,
                      top: `${20 + Math.floor(i / 4) * 40}%`,
                    }}
                    animate={{
                      y: [-10, 10, -10],
                      opacity: [0.3, 0.8, 0.3],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.5,
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-primary/30" />
                  </motion.div>
                ))}
              </div>

              {/* Crystal ball decoration */}
              <div className="absolute top-6 right-6">
                <motion.div
                  className="w-16 h-16 crystal-gradient rounded-full flex items-center justify-center magical-glow"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(124, 58, 237, 0.3)",
                      "0 0 40px rgba(124, 58, 237, 0.6)",
                      "0 0 20px rgba(124, 58, 237, 0.3)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <MessageCircle className="w-8 h-8 text-white" />
                </motion.div>
              </div>

              {/* Welcome message overlay */}
              <div className="absolute top-6 left-6 z-10">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="bg-card/80 backdrop-blur-sm rounded-lg p-4 border border-border/50 max-w-md"
                >
                  <h3 className="font-cinzel font-medium text-foreground mb-2">
                    Welcome, Seeker of Wellness
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I am the mystical oracle of your wellness realm. Ask me
                    about your potions, schedules, adherence, or seek guidance
                    on your healing journey. The crystal ball reveals all
                    mysteries of your medicinal path.
                  </p>
                </motion.div>
              </div>

              {/* Chat interface */}
              <div className="h-full relative z-20">
                <ChatBot />
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

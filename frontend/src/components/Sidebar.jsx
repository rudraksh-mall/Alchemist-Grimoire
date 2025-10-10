import { motion } from "framer-motion";
import {
  BookOpen,
  MessageCircle,
  Activity,
  Bell,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../hooks/useAuthStore";
import { Button } from "./ui/button";

const navigationItems = [
  { name: "Grimoire", path: "/dashboard", icon: BookOpen },
  { name: "Mystic Fortune Teller", path: "/chat", icon: MessageCircle },
  { name: "Settings", path: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <motion.div
      className="w-64 bg-sidebar border-r border-sidebar-border h-full flex flex-col"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header */}
      <div
        className="p-6 border-b border-sidebar-border cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        <motion.div
          className="flex items-center space-x-3"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="w-10 h-10 crystal-gradient rounded-lg flex items-center justify-center magical-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-cinzel text-lg font-semibold text-sidebar-foreground">
              Alchemist's
            </h1>
            <p className="text-sm text-sidebar-foreground/60 font-cinzel">
              Grand Grimoire
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.name}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
            >
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`
                  w-full justify-start space-x-3 h-12 relative overflow-hidden
                  ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground magical-glow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                  transition-all duration-300
                `}
                onClick={() => navigate(item.path)}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                )}
              </Button>
            </motion.div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
            <span className="text-sidebar-primary-foreground text-sm font-medium">
              {user?.name?.charAt(0) || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || "Mystical Alchemist"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email || "user@alchemist.com"}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start space-x-2 border-sidebar-border hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </motion.div>
  );
}

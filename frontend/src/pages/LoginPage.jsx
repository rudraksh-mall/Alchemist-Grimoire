import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react";
import useAuthStore from "../hooks/useAuthStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { toast } from "sonner";

export function LoginPage() {
  const [email, setEmail] = useState("demo@alchemist.com");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  // Add this hook inside the LoginPage function:

  // Access the user object from the store
  const { user, login, googleAuth, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // 🎯 FIX: Navigation Watcher Hook 🎯
  useEffect(() => {
    // If the user object is now defined (login was successful), navigate away.
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]); // Reruns whenever the user state changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser) {
        toast.success("Welcome back, mystical alchemist!"); // ❌ DELETE THIS LINE: navigate('/dashboard');
      }
    } catch (error) {
      toast.error("Invalid credentials. Please try again.");
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await googleAuth();
    } catch (error) {
      toast.error("Google authentication failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 crystal-gradient rounded-full opacity-20 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-24 h-24 magic-gradient rounded-full opacity-20 blur-xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="magical-glow border-border/50 bg-card/90 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
              className="mx-auto w-16 h-16 crystal-gradient rounded-full flex items-center justify-center magical-glow"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>

            <div>
              <CardTitle className="text-2xl font-cinzel text-card-foreground">
                Alchemist's Grand Grimoire
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Enter the mystical realm of wellness
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Mystical Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-card-foreground">
                  Secret Incantation
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full magical-glow"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                ) : (
                  "Enter the Grimoire"
                )}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or continue with
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
              disabled={isLoading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google Portal
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                New to the mystical arts?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Create your grimoire
                </Link>
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Demo credentials: demo@alchemist.com / demo123
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

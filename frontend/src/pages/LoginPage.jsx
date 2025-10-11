import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import useAuthStore from "../hooks/useAuthStore.js";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card.jsx";
import { Separator } from "../components/ui/separator.jsx";
import { toast } from "sonner";
import { authApi } from "../services/api.js";

export function LoginPage() {
  const user = useAuthStore((state) => state.user);
  const storeLoading = useAuthStore((state) => state.isLoading);
  const finalizeLogin = useAuthStore((state) => state.finalizeLogin);
  const googleAuth = useAuthStore((state) => state.googleAuth);

  const navigate = useNavigate();

  // --- NEW STATE FOR OTP FLOW ---
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  // --- END NEW STATE ---

  const isLoading = storeLoading || localLoading;

  // Navigation Watcher Hook
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // --- Step 1: Handle Initial Login (Send OTP) ---
  const handleSendOtp = async (e) => {
    // Check if event object exists before calling preventDefault
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    // CRITICAL: Prevent resend if the main fields are empty.
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLocalLoading(true);
    try {
      // 🎯 FIX 1: Use authApi.login (which calls /users/login)
      const sentEmail = await authApi.login(email, password);

      // 2. Success: Move to the verification step
      toast.info(`The Circus Crier has dispatched a code to ${sentEmail}!`);
      setStep(2);
    } catch (error) {
      // Use general error handling since backend is now responsible for precise status codes
      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Invalid credentials or server error.";
      toast.error(errorMessage);
      setStep(1);
    } finally {
      setLocalLoading(false);
    }
  };

  // --- Step 2: Handle OTP Verification and Final Login ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!email || !otp) return;

    setLocalLoading(true);
    try {
      // 🎯 FIX 2: Use authApi.verifyOtp (which calls /users/verify-otp)
      const { user: loggedInUser, accessToken } = await authApi.verifyOtp(
        email,
        otp
      );

      // 2. Success: Manually update the global auth store state using the action we aliased
      finalizeLogin(loggedInUser, accessToken);

      toast.success("OTP verified! Welcome back, mystical alchemist!");
      // Navigation is handled by the useEffect hook
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "OTP verification failed. Check your code or request a new one.";
      toast.error(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLocalLoading(true);
    try {
      await googleAuth();
    } catch (error) {
      toast.error("Google authentication failed.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleBack = () => {
    setOtp("");
    setStep(1);
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
                {step === 1
                  ? "Alchemist's Grand Grimoire"
                  : "Circus Crier Code"}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {step === 1
                  ? "Enter the mystical realm of wellness"
                  : `Enter the code sent to ${email} to proceed.`}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form
              onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp}
              className="space-y-4"
            >
              {/* --- STEP 1: Email and Password Input --- */}
              {step === 1 && (
                <>
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
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                </>
              )}

              {/* --- STEP 2: OTP Input --- */}
              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-card-foreground">
                      One-Time Password
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="pl-10 text-center text-lg tracking-widest"
                        placeholder="1 2 3 4 5 6"
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      // Call handleSendOtp without event, relying on the check inside the handler
                      onClick={() => handleSendOtp()}
                      disabled={isLoading}
                      className="p-0 h-4 text-xs text-yellow-400 hover:text-yellow-300"
                    >
                      Resend Code
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full magical-glow"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Enter the Grimoire (Verify)"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    Go Back
                  </Button>
                </>
              )}
            </form>

            <div className="relative">
              <Separator />
            </div>

            

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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

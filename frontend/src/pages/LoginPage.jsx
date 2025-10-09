import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Mail, Lock, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
// FIX: Added explicit file extensions to resolve compiler errors
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
import { authApi } from '../services/api.js'; // Added .js extension

export function LoginPage() {
  // FIX: Separate state access to prevent creating a new object on every render.
  // This is the safest way to consume Zustand state and actions without useShallow.
  const user = useAuthStore(state => state.user);
  const storeLoading = useAuthStore(state => state.isLoading);
  const finalizeLogin = useAuthStore(state => state.finalizeLogin);
  const googleAuth = useAuthStore(state => state.googleAuth);

  const navigate = useNavigate();

  // --- NEW STATE FOR OTP FLOW ---
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("demo@alchemist.com");
  const [password, setPassword] = useState("demo123");
  const [otp, setOtp] = useState('');
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
    if (e && typeof e.preventDefault === 'function') {
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
      const errorMessage = error.response?.data?.message || "Login failed. Invalid credentials or server error.";
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
      const { user: loggedInUser, accessToken } = await authApi.verifyOtp(email, otp);
      
      // 2. Success: Manually update the global auth store state using the action we aliased
      finalizeLogin(loggedInUser, accessToken); 

      toast.success("OTP verified! Welcome back, mystical alchemist!");
      // Navigation is handled by the useEffect hook
    } catch (error) {
      const errorMessage = error.response?.data?.message || "OTP verification failed. Check your code or request a new one.";
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
    setOtp(''); 
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
                {step === 1 ? "Alchemist's Grand Grimoire" : "Circus Crier Code"}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {step === 1 
                  ? "Enter the mystical realm of wellness" 
                  : `Enter the code sent to ${email} to proceed.`
                }
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp} className="space-y-4">
              
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

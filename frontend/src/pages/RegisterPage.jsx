import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
// FIX: Adjusting path depth one last time to resolve persistent compiler errors
import useAuthStore from '../hooks/useAuthStore.js'; 
import { Button } from '../components/ui/button.jsx'; 
import { Input } from '../components/ui/input.jsx'; 
import { Label } from '../components/ui/label.jsx'; 
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Separator } from '../components/ui/separator.jsx';
import { toast } from 'sonner';
import { authApi } from '../services/api.js';

export function RegisterPage() {
  // Access store state and actions
  const user = useAuthStore(state => state.user);
  const storeLoading = useAuthStore(state => state.isLoading);
  const finalizeLogin = useAuthStore(state => state.finalizeLogin); // Used for Step 3
  const googleAuth = useAuthStore(state => state.googleAuth);

  const navigate = useNavigate();

  // --- STATE MODIFICATIONS FOR OTP FLOW ---
  const [step, setStep] = useState(1); // 1: Register, 2: OTP
  const [formData, setFormData] = useState({
    fullName: '', 
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  const isLoading = storeLoading || localLoading;

  // Navigation Watcher Hook
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name === 'name' ? 'fullName' : e.target.name]: e.target.value
    }));
  };

  // --- Step 1: Handle Initial Registration (Create User & Send OTP) ---
  const handleRegister = async (e) => {
    e.preventDefault(); 

    if (formData.password !== formData.confirmPassword) {
      toast.error('Incantations (Passwords) do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    // Check required fields based on the step
    if (!formData.fullName || !formData.email || !formData.password) {
        toast.error('Please fill in all mystical fields.');
        return;
    }
    
    setLocalLoading(true);
    try {
      // 1. Call authApi.register. This API call must now trigger the OTP sending on the backend.
      await authApi.register(formData.email, formData.password, formData.fullName);
      
      // 2. Success: Move to the verification step
      toast.info(`Grimoire created! A verification code has been dispatched to ${formData.email}.`);
      setStep(2); // Move to verification step
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. This email may already be in the grimoire.';
      toast.error(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };
  
  // --- Step 2: Handle OTP Verification and Final Login ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!formData.email || !otp) return;
    
    setLocalLoading(true);
    try {
      // 1. Use authApi.verifyOtp to check the code and exchange it for tokens
      const { user: loggedInUser, accessToken } = await authApi.verifyOtp(formData.email, otp);
      
      // 2. Success: Manually update the global auth store state
      finalizeLogin(loggedInUser, accessToken); 

      toast.success("Verification complete! Welcome to the Alchemist's Arena!");
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
      toast.success('Welcome via the magical portal!');
    } catch (error) {
      toast.error('Google authentication failed.');
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
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-24 h-24 magic-gradient rounded-full opacity-20 blur-xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
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
                {step === 1 ? "Create Your Grimoire" : "Circus Crier Code"}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {step === 1 
                  ? "Forge your mystical account" 
                  : `Enter the code sent to ${formData.email} to activate your account.`
                }
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={step === 1 ? handleRegister : handleVerifyOtp} className="space-y-4">
              
              {/* --- STEP 1: Registration Fields --- */}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-card-foreground">
                      Alchemist Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName} 
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="The Great Sebastiano"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-card-foreground">
                      Mystical Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
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
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 pr-10"
                        placeholder="Create your password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-card-foreground">
                      Confirm Incantation
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 pr-10"
                        placeholder="Confirm your password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full magical-glow" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Register & Send Verification Code'
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
                    {/* Resend button calls handleRegister which re-sends the code */}
                    <Button
                        type="button"
                        variant="link"
                        // This calls handleRegister without an event, forcing the resend logic
                        onClick={handleRegister} 
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
                      "Verify & Enter Grimoire"
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
                Already have a grimoire?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Enter the realm
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

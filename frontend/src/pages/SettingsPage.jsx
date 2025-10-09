import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Clock,
  Mail,
  Calendar,
  User,
  Shield,
  Moon,
  Sun,
  Save,
  Trash2,
  Check, 
  Link, 
} from "lucide-react";
import useAuthStore from "../hooks/useAuthStore";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useTheme } from "../components/ThemeProvider";
import { toast } from "sonner";

export function SettingsPage() {
  // 🎯 FIX: Destructure disconnectGoogleAuth (assuming implemented in useAuthStore)
  const { user, logout, updateCurrentUser, disconnectGoogleAuth } = useAuthStore(); 
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // 🎯 CRITICAL FIX 1: Derive connection status from the token presence
  const isGoogleConnected = !!(user?.googleRefreshToken);

  // 🎯 CRITICAL FIX 2: Check URL for OAuth success/error flag and refresh user state
  useEffect(() => {
    if (!user) {
        navigate("/login");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const calendarSyncSuccess = params.get('calendar_sync');
    const calendarSyncError = params.get('error');

    if (calendarSyncSuccess === 'success') {
        toast.success("Calendar connected successfully! Syncing potions.");
        updateCurrentUser(); // Force state update to show 'Connected'
    } else if (calendarSyncError) {
        let errorMessage = "Synchronization failed. Please try again.";
        
        if (calendarSyncError === 'no_refresh_token') {
            errorMessage = "Connection failed: Google did not grant permanent access. Please ensure you grant full access when prompted.";
        } else if (calendarSyncError === 'access_denied') {
            errorMessage = "Connection denied by user.";
        }

        toast.error(errorMessage);
    }
        
    // Clean up the URL query parameter after processing
    if (calendarSyncSuccess || calendarSyncError) {
        navigate('/settings', { replace: true }); 
    }

  }, [user, navigate, updateCurrentUser]); 

  const [settings, setSettings] = useState({
    name: user?.name || "",
    email: user?.email || "",
    timezone: user?.timezone || "America/New_York",
    browserNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
    reminderBefore: "15",
    // Initialize state using the derived status
    googleCalendar: isGoogleConnected, 
    appleHealth: false,
    dataSharing: false,
    analytics: true,
  });

  // Listen to changes in isGoogleConnected to update the local state when the user object updates
  useEffect(() => {
    setSettings(prev => ({ ...prev, googleCalendar: isGoogleConnected }));
  }, [isGoogleConnected]);
  

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleConnectGoogle = () => {
    const userId = user?._id || user?.id;

    if (!userId) {
      toast.error("Please log in again to connect your calendar.");
      return;
    }
    
    // Redirect to backend endpoint for OAuth login flow
    window.location.href = `http://localhost:8000/api/v1/users/google/login?userId=${userId}`;
  };

  // 🎯 FINAL IMPLEMENTATION: Handle disconnection
  const handleDisconnectGoogle = async () => {
    if (!window.confirm("Are you sure you want to disconnect Google Calendar?")) {
        return;
    }

    setIsLoading(true);
    try {
        // Calls the store action to send DELETE request and clear token in DB
        await disconnectGoogleAuth(); 
        toast.success("Google Calendar disconnected successfully.");
        // updateCurrentUser() is called inside disconnectGoogleAuth
    } catch (error) {
        toast.error("Failed to disconnect calendar.");
        console.error("Disconnect error:", error);
    } finally {
        setIsLoading(false);
    }
  }


  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // ⚠️ Add actual API call here to save settings (timezone, notifications, etc.)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully! ✨");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        // ⚠️ Add actual API call here to delete the user account
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success("Account deleted. Farewell, mystical alchemist.");
        logout();
      } catch (error) {
        toast.error("Failed to delete account");
      }
    }
  };

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
  ];

  const reminderOptions = [
    { value: "5", label: "5 minutes" },
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "120", label: "2 hours" },
  ];

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
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-cinzel font-semibold text-foreground">
                Mystical Settings
              </h1>
            </div>
            <p className="text-muted-foreground">
              Configure your wellness grimoire to your preferences
            </p>
          </motion.div>
        </header>

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="magical-glow">
                <CardHeader>
                  <CardTitle className="font-cinzel flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Alchemist Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Mystical Name</Label>
                      <Input
                        id="name"
                        value={settings.name}
                        onChange={(e) =>
                          handleSettingChange("name", e.target.value)
                        }
                        placeholder="Your alchemist name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) =>
                          handleSettingChange("email", e.target.value)
                        }
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Timezone</span>
                      </div>
                    </Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) =>
                        handleSettingChange("timezone", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notification Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="magical-glow">
                <CardHeader>
                  <CardTitle className="font-cinzel flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Mystical Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="browser-notifications">
                          Browser Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive alerts in your browser
                        </p>
                      </div>
                      <Switch
                        id="browser-notifications"
                        checked={settings.browserNotifications}
                        onCheckedChange={(value) =>
                          handleSettingChange("browserNotifications", value)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive reminder emails
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={settings.emailNotifications}
                        onCheckedChange={(value) =>
                          handleSettingChange("emailNotifications", value)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-notifications">
                          SMS Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive text message alerts
                        </p>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={settings.smsNotifications}
                        onCheckedChange={(value) =>
                          handleSettingChange("smsNotifications", value)
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Reminder Timing</Label>
                    <Select
                      value={settings.reminderBefore}
                      onValueChange={(value) =>
                        handleSettingChange("reminderBefore", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reminderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label} before
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Integration Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="magical-glow">
                <CardHeader>
                  <CardTitle className="font-cinzel flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Mystical Integrations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="google-calendar">
                        Google Calendar Sync
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Sync medicine schedules with Google Calendar
                      </p>
                    </div>
                    {/* 🎯 Updated Conditional Rendering */}
                    {isGoogleConnected ? (
                      <div className="flex space-x-2">
                        <Button 
                          variant="success" 
                          disabled 
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Check className="w-4 h-4 mr-2" /> Connected
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDisconnectGoogle}
                          type="button"
                          className="hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Link className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleConnectGoogle}
                        type="button"
                        className="magical-glow"
                      >
                        Connect Calendar
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="apple-health">
                        Apple Health Integration
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Share data with Apple Health app
                      </p>
                    </div>
                    <Switch
                      id="apple-health"
                      checked={settings.appleHealth}
                      onCheckedChange={(value) =>
                        handleSettingChange("appleHealth", value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Appearance Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="magical-glow">
                <CardHeader>
                  <CardTitle className="font-cinzel flex items-center space-x-2">
                    <Moon className="w-5 h-5" />
                    <span>Mystical Appearance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dark-mode">Dark Magic Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle between light and dark mystical themes
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Sun className="w-4 h-4" />
                      <Switch
                        id="dark-mode"
                        checked={theme === "dark"}
                        onCheckedChange={(checked) =>
                          setTheme(checked ? "dark" : "light")
                        }
                      />
                      <Moon className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="flex-1 magical-glow"
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
                    <Save className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
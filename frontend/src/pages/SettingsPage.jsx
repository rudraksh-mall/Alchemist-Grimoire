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
import { toast } from "sonner";

export function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user]);

  const [settings, setSettings] = useState({
    name: user?.name || "",
    email: user?.email || "",
    timezone: "America/New_York",
    browserNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
    reminderBefore: "15",
    googleCalendar: false,
    appleHealth: false,
    dataSharing: false,
    analytics: true,
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };
  // Ensure this URL is correct:
  const handleConnectGoogle = () => {
    // Check if user exists before getting the ID
    const userId = user?._id || user?.id;

    if (!userId) {
      toast.error("Please log in again to connect your calendar.");
      return;
    }
    window.location.href = `http://localhost:8000/api/v1/users/google/login?userId=${userId}`;
  };
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
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
                    {settings.googleCalendar ? (
                      <Button variant="success" disabled>
                        <Calendar className="w-4 h-4 mr-2" /> Connected
                      </Button>
                    ) : (
                      <Button
                        onClick={handleConnectGoogle}
                        // 🎯 CRITICAL FIX: Add type="button" to prevent form submission 🎯
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
                        checked={isDarkMode}
                        onCheckedChange={setIsDarkMode}
                      />
                      <Moon className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Privacy Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Card className="magical-glow">
                <CardHeader>
                  <CardTitle className="font-cinzel flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Privacy & Security</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Shield className="w-4 h-4" />
                    <AlertDescription>
                      Figma Make is not intended for collecting PII or securing
                      sensitive data. Please be mindful of the information you
                      share.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="data-sharing">Data Sharing</Label>
                      <p className="text-sm text-muted-foreground">
                        Share anonymized usage data to improve the app
                      </p>
                    </div>
                    <Switch
                      id="data-sharing"
                      checked={settings.dataSharing}
                      onCheckedChange={(value) =>
                        handleSettingChange("dataSharing", value)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="analytics">Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Help us understand how you use the app
                      </p>
                    </div>
                    <Switch
                      id="analytics"
                      checked={settings.analytics}
                      onCheckedChange={(value) =>
                        handleSettingChange("analytics", value)
                      }
                    />
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

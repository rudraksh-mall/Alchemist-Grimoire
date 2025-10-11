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
  Moon,
  Sun,
  Save,
  Trash2,
  Check,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import useAuthStore from "../hooks/useAuthStore.js";
import { Sidebar } from "../components/Sidebar.jsx";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card.jsx";
import { Switch } from "../components/ui/switch.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.jsx";
import { Separator } from "../components/ui/separator.jsx";
import { Alert, AlertDescription } from "../components/ui/alert.jsx";
import { useTheme } from "../components/ThemeProvider.jsx";
import { toast } from "sonner";

// --- ACTION REQUIRED: VAPID Public Key ---
const VAPID_PUBLIC_KEY =
  "BLLw3ROQRrtJUMgLx2CUWjG3UQ5lH0epP_J491eOFAKGFJqPjDfbGSL6sLJKks3sMTtBVWkIJXNwvC26mR1zmek";
// ------------------------------------------

// Helper function to convert the VAPID key base64 string to a Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Helper function to safely initialize state only once
const getInitialSettings = (user) => ({
  // Profile data is initialized in profileFormData state.
  // This state holds switches/selects not handled by updateNotifications.
  smsNotifications: false,
  appleHealth: false, // This value needs to be tracked locally until its feature is built
  dataSharing: false,
  analytics: true,
});

export function SettingsPage() {
  // --- CRITICAL FIX START: Use separate, stable selectors ---
  const user = useAuthStore((state) => state.user);
  const storeLoading = useAuthStore((state) => state.isLoading); // Action functions (stable references)

  const logout = useAuthStore((state) => state.logout);
  const updateCurrentUser = useAuthStore((state) => state.updateCurrentUser);
  const disconnectGoogleAuth = useAuthStore(
    (state) => state.disconnectGoogleAuth
  );
  const deleteAccountAction = useAuthStore(
    (state) => state.deleteAccountAction
  );
  const saveNotificationPreferences = useAuthStore(
    (state) => state.saveNotificationPreferences
  );
  const saveBrowserSubscription = useAuthStore(
    (state) => state.saveBrowserSubscription
  );
  const updateUserSettingsAction = useAuthStore(
    (state) => state.updateUserSettingsAction
  ); // --- CRITICAL FIX END ---
  const { theme, setTheme } = useTheme();

  const [localLoading, setLocalLoading] = useState(false);
  const isLoading = storeLoading || localLoading;

  const navigate = useNavigate(); // Derived Values (Accessed directly from user)

  const isGoogleConnected = !!user?.googleRefreshToken;
  const currentBrowserPref = user?.notificationPreferences?.browser ?? false;
  const currentEmailPref = user?.notificationPreferences?.email ?? false; // FIX: Separate state for Profile Form (Name, Email, Timezone, Reminder Timing)

  const [profileFormData, setProfileFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    timezone: user?.timezone || "America/New_York",
    reminderBefore: String(user?.reminderTimingMinutes || 15), // String value from dropdown
  }); // Initialize state using the function form, which is safer.

  const [settings, setSettings] = useState(() => getInitialSettings(user)); // --- Update settings only when the central user object changes ---

  useEffect(() => {
    // This runs after login, updateCurrentUser, etc., ensuring local state reflects user data
    if (user) {
      setProfileFormData((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        email: user.email || prev.email,
        timezone: user.timezone || prev.timezone,
        reminderBefore: String(user.reminderTimingMinutes || 15),
      }));
    }
  }, [user]); // Only depend on the entire user object // --- Handle URL OAuth success/error flag and initial navigation ---

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const calendarSyncSuccess = params.get("calendar_sync");
    const calendarSyncError = params.get("error");

    if (calendarSyncSuccess || calendarSyncError) {
      if (calendarSyncSuccess === "success") {
        toast.success("Calendar connected successfully! Syncing potions.");
        updateCurrentUser();
      } else if (calendarSyncError) {
        let errorMessage = "Synchronization failed. Please try again.";
        if (calendarSyncError === "no_refresh_token") {
          errorMessage =
            "Connection failed: Google did not grant permanent access. Please ensure you grant full access when prompted.";
        } else if (calendarSyncError === "access_denied") {
          errorMessage = "Connection denied by user.";
        }
        toast.error(errorMessage);
      }

      navigate("/settings", { replace: true });
    }
  }, [user, navigate, updateCurrentUser]); // Unified handler for all local state changes (profile, timing, unhandled switches)

  const handleSettingChange = (key, value) => {
    if (
      key === "timezone" ||
      key === "name" ||
      key === "email" || // Although disabled below, this logic remains for consistency
      key === "reminderBefore"
    ) {
      setProfileFormData((prev) => ({
        ...prev,
        [key === "name" ? "fullName" : key]: value,
      }));
    } else {
      // General switches: Update the settings state (smsNotifications, appleHealth, etc.)
      setSettings((prev) => ({ ...prev, [key]: value }));
    }
  }; // === PUSH NOTIFICATION LOGIC (Unchanged) ===

  const subscribeUser = async (registration) => {
    // 🎯 CHECK: This is now a runtime check against the key value
    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.length < 50) {
      console.error(
        "VAPID Public Key is missing or too short. Cannot subscribe."
      );
      toast.error("VAPID key error. Check key in settings file.");
      return false;
    }

    try {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY); // Subscribe the service worker to the push service

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      }); // Send the subscription object to the backend for storage

      await saveBrowserSubscription(subscription);

      toast.success("Browser notifications enabled!");
      return true;
    } catch (error) {
      // Log the exact error for debugging
      console.error("Push subscription failed:", error);
      toast.error("Subscription failed. Check console for VAPID key validity.");
      return false;
    }
  };

  const unsubscribeUser = async (registration) => {
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Unsubscribe from the browser's push service
        await subscription.unsubscribe();
      } // Send a null subscription to the backend to clear the record

      await saveBrowserSubscription(null);
      toast.info("Browser notifications disabled.");
      return true;
    } catch (error) {
      console.error("Push unsubscription failed:", error);
      toast.error("Unsubscription failed.");
      return false;
    }
  };

  const handleBrowserNotificationToggle = async (value) => {
    setLocalLoading(true);

    if (!("serviceWorker" in navigator && "PushManager" in window)) {
      toast.error("Your browser does not support push notifications.");
      setLocalLoading(false);
      return false;
    }

    let success = false;

    if (value) {
      // --- Subscription Logic (Turning ON) ---
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.warning("Notification permission denied by user.");
        success = false;
      } else {
        // Register service worker if not already registered
        const registration =
          (await navigator.serviceWorker.getRegistration("/")) ||
          (await navigator.serviceWorker.register("/service-worker.js")); // CRITICAL FIX: Force unsubscribe old key before subscribing new one to avoid 410 errors

        const currentSubscription =
          await registration.pushManager.getSubscription();
        if (currentSubscription) {
          await currentSubscription.unsubscribe();
        }

        success = await subscribeUser(registration);
      } // If subscription succeeds, update DB preference flag

      await saveNotificationPreferences(success, currentEmailPref);
    } else {
      // --- Unsubscription Logic (Turning OFF) ---
      const registration = await navigator.serviceWorker.getRegistration("/");
      if (registration) {
        success = await unsubscribeUser(registration);
      } else {
        // If no registration exists, treat as successful local cleanup
        success = true;
      } // Always update preference flag to false if we attempted to turn it off
      await saveNotificationPreferences(false, currentEmailPref);
    } // If operation failed, we must revert the UI state

    if (!success) {
      setSettings((prev) => ({ ...prev, browserNotifications: !value }));
    }

    setLocalLoading(false);
    return success;
  }; // ===================================
  const handleUpdateNotifications = async (key, value) => {
    // Note: Local loading is handled inside handleBrowserNotificationToggle for accuracy
    if (key === "browserNotifications") {
      await handleBrowserNotificationToggle(value);
    } else if (key === "emailNotifications") {
      setLocalLoading(true);
      try {
        // Pass the new email value and the current browser preference
        await saveNotificationPreferences(currentBrowserPref, value);
        toast.success("Email preference updated.");
      } catch (error) {
        toast.error("Failed to update email preference."); // Revert the toggle on failure
        setSettings((prev) => ({ ...prev, emailNotifications: !value }));
      } finally {
        setLocalLoading(false);
      }
    }
  }; // =======================================================================
  const handleConnectGoogle = () => {
    const userId = user?._id;

    if (!userId) {
      toast.error("Please log in again to connect your calendar.");
      return;
    } // Redirect to backend endpoint for OAuth login flow

    window.location.href = `http://localhost:8000/api/v1/users/google/login?userId=${userId}`;
  }; // 🎯 FINAL IMPLEMENTATION: Handle disconnection

  const handleDisconnectGoogle = async () => {
    if (
      !window.confirm("Are you sure you want to disconnect Google Calendar?")
    ) {
      return;
    }

    setLocalLoading(true);
    try {
      await disconnectGoogleAuth();
      toast.success("Google Calendar disconnected successfully.");
    } catch (error) {
      toast.error("Failed to disconnect calendar.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    // CRITICAL: Gather all profile and timing data from the two state sources
    const dataToSave = {
      fullName: profileFormData.fullName, // The email field is now disabled/readOnly in the JSX, so we rely on the // current value in profileFormData for saving, or just exclude it if not needed.
      email: profileFormData.email,
      timezone: profileFormData.timezone,
      reminderTimingMinutes: profileFormData.reminderBefore, // Use the local variable
    };

    setLocalLoading(true);
    try {
      // 1. Call the new store action to update all general user settings
      // NOTE: This uses the PATCH /update-details route (updateAccountDetails controller)
      await updateUserSettingsAction(dataToSave);

      toast.success("Profile and timing settings saved successfully! ✨");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLocalLoading(false);
    }
  }; // 🎯 DELETE ACCOUNT FUNCTIONALITY

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm(
      "Are you absolutely sure you want to delete your account? All schedules and logs will be permanently removed."
    );

    if (!isConfirmed) {
      return;
    }

    setLocalLoading(true);
    try {
      await deleteAccountAction();
      toast.success("Account deleted. Farewell, mystical alchemist.");
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error("Failed to delete account. Logging out.");
      }
      logout(); // Ensure logout occurs on client side
    } finally {
      setLocalLoading(false);
    }
  };

  const reminderOptions = [
    { value: "5", label: "5 minutes" },
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "120", label: "2 hours" },
  ];

  return (
    <div className="flex h-screen bg-background">
            <Sidebar />     {" "}
      <div className="flex-1 flex flex-col overflow-hidden">
               {" "}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm p-6">
                   {" "}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
                       {" "}
            <div className="flex items-center space-x-3 mb-2">
                           {" "}
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Settings className="w-5 h-5 text-primary" />   
                         {" "}
              </div>
                           {" "}
              <h1 className="2xl font-cinzel font-semibold text-foreground">
                                Mystical Settings              {" "}
              </h1>
                         {" "}
            </div>
                       {" "}
            <p className="text-muted-foreground">
                            Configure your wellness grimoire to your preferences
                         {" "}
            </p>
                     {" "}
          </motion.div>
                 {" "}
        </header>
               {" "}
        <main className="flex-1 overflow-auto p-6 space-y-6">
                   {" "}
          <div className="max-w-4xl mx-auto space-y-6">
                        {/* Profile Settings */}           {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
                           {" "}
              <Card className="magical-glow">
                               {" "}
                <CardHeader>
                                   {" "}
                  <CardTitle className="font-cinzel flex items-center space-x-2">
                                        <User className="w-5 h-5" />           
                            <span>Alchemist Profile</span>                 {" "}
                  </CardTitle>
                                 {" "}
                </CardHeader>
                               {" "}
                <CardContent className="space-y-4">
                                   {" "}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       {" "}
                    <div className="space-y-2">
                                           {" "}
                      <Label htmlFor="name">Mystical Name</Label>               
                           {" "}
                      <Input
                        id="name"
                        name="name" // Display value comes directly from local state
                        value={profileFormData.fullName}
                        onChange={(e) =>
                          handleSettingChange("name", e.target.value)
                        }
                        placeholder="Your alchemist name"
                      />
                                         {" "}
                    </div>
                                       {" "}
                    <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                           {" "}
                      <Input
                        id="email"
                        name="email"
                        type="email" // Display value comes directly from local state
                        value={profileFormData.email} // --- FIX: MAKE NON-EDITABLE ---
                        disabled={true}
                        onChange={(e) =>
                          handleSettingChange("email", e.target.value)
                        }
                        placeholder="your@email.com"
                      />
                                         {" "}
                    </div>
                                     {" "}
                  </div>
                                                   {" "}
                </CardContent>
                             {" "}
              </Card>
                         {" "}
            </motion.div>
                        {/* Notification Settings */}           {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
                           {" "}
              <Card className="magical-glow">
                               {" "}
                <CardHeader>
                                   {" "}
                  <CardTitle className="font-cinzel flex items-center space-x-2">
                                        <Bell className="w-5 h-5" />           
                            <span>Mystical Alerts</span>                 {" "}
                  </CardTitle>
                                 {" "}
                </CardHeader>
                               {" "}
                <CardContent className="space-y-6">
                                   {" "}
                  <div className="space-y-4">
                                       {" "}
                    <div className="flex items-center justify-between">
                                           {" "}
                      <div>
                                               {" "}
                        <Label htmlFor="browser-notifications">
                                                    Browser Notifications      
                                           {" "}
                        </Label>
                                               {" "}
                        <p className="text-sm text-muted-foreground">
                                                    Receive alerts in your
                          browser                        {" "}
                        </p>
                                             {" "}
                      </div>
                                           {" "}
                      <Switch
                        id="browser-notifications" // Display value comes from user object
                        checked={currentBrowserPref}
                        onCheckedChange={
                          (value) =>
                            handleUpdateNotifications(
                              "browserNotifications",
                              value
                            ) // <-- CALLS NEW HANDLER
                        }
                        disabled={isLoading}
                      />
                                         {" "}
                    </div>
                                       {" "}
                    <div className="flex items-center justify-between">
                                           {" "}
                      <div>
                                               {" "}
                        <Label htmlFor="email-notifications">
                                                    Email Notifications        
                                         {" "}
                        </Label>
                                               {" "}
                        <p className="text-sm text-muted-foreground">
                                                    Receive reminder emails    
                                             {" "}
                        </p>
                                             {" "}
                      </div>
                                           {" "}
                      <Switch
                        id="email-notifications" // Display value comes from user object
                        checked={currentEmailPref}
                        onCheckedChange={
                          (value) =>
                            handleUpdateNotifications(
                              "emailNotifications",
                              value
                            ) // <-- CALLS NEW HANDLER
                        }
                        disabled={isLoading}
                      />
                                         {" "}
                    </div>
                  </div>
                                    <Separator />                 {" "}
                  <div className="space-y-2">
                                        <Label>Reminder Timing</Label>         
                             {" "}
                    <Select
                      value={profileFormData.reminderBefore} // Read from local state
                      onValueChange={(value) =>
                        handleSettingChange("reminderBefore", value)
                      }
                      disabled={isLoading}
                    >
                                           {" "}
                      <SelectTrigger>
                                                <SelectValue />                 
                           {" "}
                      </SelectTrigger>
                                           {" "}
                      <SelectContent>
                                               {" "}
                        {reminderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                                                        {option.label} before  
                                                   {" "}
                          </SelectItem>
                        ))}
                                             {" "}
                      </SelectContent>
                                         {" "}
                    </Select>
                                     {" "}
                  </div>
                                 {" "}
                </CardContent>
                             {" "}
              </Card>
                         {" "}
            </motion.div>
                        {/* Integration Settings */}           {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
                           {" "}
              <Card className="magical-glow">
                               {" "}
                <CardHeader>
                                   {" "}
                  <CardTitle className="font-cinzel flex items-center space-x-2">
                                        <Calendar className="w-5 h-5" />       
                                <span>Mystical Integrations</span>             
                       {" "}
                  </CardTitle>
                                 {" "}
                </CardHeader>
                               {" "}
                <CardContent className="space-y-4">
                                   {" "}
                  <div className="flex items-center justify-between">
                                       {" "}
                    <div>
                                           {" "}
                      <Label htmlFor="google-calendar">
                                                Google Calendar Sync            
                                 {" "}
                      </Label>
                                           {" "}
                      <p className="text-sm text-muted-foreground">
                                                Sync medicine schedules with
                        Google Calendar                      {" "}
                      </p>
                                         {" "}
                    </div>
                                       {" "}
                    {/* 🎯 Use the derived stable value directly in JSX */}     
                                 {" "}
                    {isGoogleConnected ? (
                      <div className="flex space-x-2">
                                               {" "}
                        <Button
                          variant="success"
                          disabled
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                                                   {" "}
                          <Check className="w-4 h-4 mr-2" /> Connected          
                                       {" "}
                        </Button>
                                               {" "}
                        <Button
                          variant="outline"
                          onClick={handleDisconnectGoogle}
                          type="button"
                          className="hover:bg-red-500/10 hover:text-red-400"
                          disabled={isLoading}
                        >
                                                   {" "}
                          <LinkIcon className="w-4 h-4" />                     
                           {" "}
                        </Button>
                                             {" "}
                      </div>
                    ) : (
                      <Button
                        onClick={handleConnectGoogle}
                        type="button"
                        className="magical-glow"
                        disabled={isLoading}
                      >
                                                Connect Calendar                
                             {" "}
                      </Button>
                    )}
                                     {" "}
                  </div>
                                                   {" "}
                </CardContent>
                             {" "}
              </Card>
                         {" "}
            </motion.div>
                        {/* Appearance Settings */}           {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
                           {" "}
              <Card className="magical-glow">
                               {" "}
                <CardHeader>
                                   {" "}
                  <CardTitle className="font-cinzel flex items-center space-x-2">
                                        <Moon className="w-5 h-5" />           
                            <span>Mystical Appearance</span>                 {" "}
                  </CardTitle>
                                 {" "}
                </CardHeader>
                               {" "}
                <CardContent className="space-y-4">
                                   {" "}
                  <div className="flex items-center justify-between">
                                       {" "}
                    <div>
                                           {" "}
                      <Label htmlFor="dark-mode">Dark Magic Mode</Label>       
                                   {" "}
                      <p className="text-sm text-muted-foreground">
                                                Toggle between light and dark
                        mystical themes                      {" "}
                      </p>
                                         {" "}
                    </div>
                                       {" "}
                    <div className="flex items-center space-x-2">
                                            <Sun className="w-4 h-4" />         
                                 {" "}
                      <Switch
                        id="dark-mode"
                        checked={theme === "dark"}
                        onCheckedChange={(checked) =>
                          setTheme(checked ? "dark" : "light")
                        }
                        disabled={isLoading}
                      />
                                            <Moon className="w-4 h-4" />       
                                 {" "}
                    </div>
                                     {" "}
                  </div>
                                 {" "}
                </CardContent>
                             {" "}
              </Card>
                         {" "}
            </motion.div>
                        {/* Actions */}           {" "}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
                           {" "}
              <Button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="flex-1 magical-glow"
              >
                               {" "}
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                                        <Loader2 className="w-4 h-4" />         
                           {" "}
                  </motion.div>
                ) : (
                  <>
                                        <Save className="w-4 h-4 mr-2" />       
                                Save Settings                  {" "}
                  </>
                )}
                             {" "}
              </Button>
                           {" "}
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="sm:w-auto"
                disabled={isLoading}
              >
                               {" "}
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                                Delete Account              {" "}
              </Button>
                         {" "}
            </motion.div>
                     {" "}
          </div>
                 {" "}
        </main>
             {" "}
      </div>
         {" "}
    </div>
  );
}

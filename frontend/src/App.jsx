import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";
import useAuthStore from "./hooks/useAuthStore";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ScheduleFormPage } from "./pages/ScheduleFormPage";
import { ChatPage } from "./pages/ChatPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ThemeProvider } from "./components/ThemeProvider";

export default function App() {
  const { initAuth, isLoading } = useAuthStore();

  // Initialize auth state on app mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isLoading) {
    // Global loading screen while auth initializes
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-cinzel text-lg">
          Awakening mystical energies...
        </p>
      </div>
    );
  }
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <div className="min-h-screen bg-background text-foreground scroll-smooth">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/schedule/:id"
              element={
                <ProtectedRoute>
                  <ScheduleFormPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--card-foreground)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

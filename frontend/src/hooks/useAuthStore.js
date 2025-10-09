import { create } from "zustand";
// FIX: Import the default export (the main Axios instance) as 'api',
// and import 'authApi' as a named export.
import api, { authApi } from "../services/api.js"; 


// --- CRITICAL FIX START: Safe Initialization ---

const getInitialUser = () => {
    // 1. Get the raw string from localStorage.
    const rawUser = localStorage.getItem("alchemist_user");

    // 2. CHECK 1: If the item is the literal string "undefined", treat it as empty.
    if (!rawUser || rawUser === 'undefined' || rawUser === 'null') {
        return null;
    }

    try {
        // 3. CHECK 2: Attempt to parse the valid string.
        const parsed = JSON.parse(rawUser);

        // 4. CHECK 3: Ensure the parsed object has the expected 'user' structure, otherwise return null.
        // This prevents crashes if localStorage contains corrupted, but valid, JSON (e.g., '123' or 'true').
        return parsed.user || parsed || null; 
    } catch (e) {
        // 5. If parsing fails (e.g., corrupted JSON), log error and return null.
        console.error("Corrupted JSON in localStorage. User data reset.", e);
        localStorage.removeItem("alchemist_user");
        return null;
    }
};

const initialUser = getInitialUser();
const initialToken = localStorage.getItem("alchemist_token") || null;

// --- CRITICAL FIX END ---

const useAuthStore = create((set, get) => ({
  // Use the safely derived initial values
  user: initialUser,
  accessToken: initialToken,
  isLoading: true,
  
  // NEW: Setter for local loading state in the component
  setIsLoading: (status) => set({ isLoading: status }),

  // Initialize authentication state on app mount
  initAuth: async () => {
    const savedToken = localStorage.getItem("alchemist_token");
    if (!savedToken) {
      set({ isLoading: false });
      return;
    }

    try {
      // Use the default API instance imported as 'api'
      const { data } = await api.get("/users/current-user");
      // 🎯 FIX: Ensure user object is saved correctly
      const currentUser = data.data; 
      localStorage.setItem("alchemist_user", JSON.stringify(currentUser)); 
      
      set({
        user: currentUser,
        accessToken: savedToken,
        isLoading: false,
      });
    } catch (error) {
      console.error("Token invalid or expired:", error);
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  // 🎯 NEW ACTION: Manually fetch and update the current user object
  updateCurrentUser: async () => {
    try {
      // NOTE: Path updated to match the final consolidated route: /v1/users/current-user
      const { data } = await api.get("/users/current-user");
      const updatedUser = data.data;

      // Update local storage and state
      localStorage.setItem("alchemist_user", JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return updatedUser;
    } catch (error) {
      console.error("Failed to update current user state:", error);
      // Optional: if failed, log out user
      // get().logout(); 
    }
  },

  // 🎯 NEW ACTION: Finalizes login after successful OTP verification
  finalizeLogin: (user, accessToken) => {
    // This function is called by the LoginPage after successful /verify-otp
    localStorage.setItem("alchemist_user", JSON.stringify(user));
    localStorage.setItem("alchemist_token", accessToken);

    set({ user, accessToken, isLoading: false });
  },

  // REGISTER (FIXED: Stops setting tokens/user, now waits for verifyOtp)
  register: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      // 1. Call the backend to create the user and send the OTP.
      // NOTE: We assume authApi.register returns { email } and NOT tokens/user object.
      await authApi.register(email, password, fullName);

      // Returning the email confirms success and allows the frontend to track who needs verification.
      return email; 
    } finally {
      set({ isLoading: false });
    }
  },

  // GOOGLE AUTH (Existing, but no changes needed here)
  googleAuth: async () => {
    set({ isLoading: true });
    try {
      // NOTE: This function currently requires manual handling of the redirect 
      // since it's hard to get data back from a direct browser call in a store function.
      // We keep it as-is based on your original file's structure.
      const response = await authApi.googleAuth();
      const { user, accessToken } = response;

      localStorage.setItem("alchemist_user", JSON.stringify(user));
      localStorage.setItem("alchemist_token", accessToken);

      set({ user, accessToken });
    } finally {
      set({ isLoading: false });
    }
  },

  // 🎯 NEW ACTION: Disconnects Google Calendar and refreshes state
  disconnectGoogleAuth: async () => {
    try {
      // NOTE: Path updated to match the final consolidated route: /v1/users/google/disconnect
      await authApi.disconnectGoogle(); 
      get().updateCurrentUser(); // Refresh the user object to clear the token field
      return true;
    } catch (err) {
      console.error("Google disconnect failed:", err);
      throw err;
    }
  },

  // LOGOUT
  logout: async () => {
    try {
      // NOTE: Path updated to match the final consolidated route: /v1/users/logout
      await authApi.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("alchemist_user");
      localStorage.removeItem("alchemist_token");
      set({ user: null, accessToken: null });
    }
  },

  // REFRESH TOKEN
  refreshAccessToken: async () => {
    try {
      // NOTE: Path updated to match the final consolidated route: /v1/users/refresh-token
      const refreshed = await authApi.refreshToken();
      const { accessToken } = refreshed;
      localStorage.setItem("alchemist_token", accessToken);
      set({ accessToken });
      return accessToken;
    } catch (err) {
      console.error("Token refresh failed:", err);
      get().logout();
      throw err;
    }
  },
}));

// Attach interceptor to auto-refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // FIX: Retrieve functions *inside* the async block where the error check occurs.
    const originalRequest = error.config;
    const requestUrl = originalRequest.url || "";

    // 🎯 CRITICAL FIX: The check below causes the infinite loop.
    // The `useAuthStore.getState()` must only be called if the error condition is met.
    
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      // Check for public routes that should not trigger a token retry
      !requestUrl.includes("users/login") &&
      !requestUrl.includes("users/verify-otp") &&
      !requestUrl.includes("users/register") &&
      !requestUrl.includes("auth/google/callback")
    ) {
      // Retrieve the functions ONLY when we know we need to retry
      const { refreshAccessToken, logout } = useAuthStore.getState();

      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export default useAuthStore;
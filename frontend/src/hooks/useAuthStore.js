import { create } from "zustand";
import { api, authApi } from "../services/api.js";


const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem("alchemist_user")) || null,
  accessToken: localStorage.getItem("alchemist_token") || null,
  isLoading: true,
  

  // Initialize authentication state on app mount
  initAuth: async () => {
    const savedToken = localStorage.getItem("alchemist_token");
    if (!savedToken) {
      set({ isLoading: false });
      return;
    }

    try {
      const { data } = await api.get("/v1/users/current-user");
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
      const { data } = await api.get("/v1/users/current-user");
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

  // LOGIN
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(email, password);
      const { user, accessToken } = response;

      localStorage.setItem("alchemist_user", JSON.stringify(user));
      localStorage.setItem("alchemist_token", accessToken);

      set({ user, accessToken });
      return user;
    } finally {
      set({ isLoading: false });
    }
  },

  // REGISTER
  register: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(email, password, fullName);
      const { user, accessToken } = response;

      localStorage.setItem("alchemist_user", JSON.stringify(user));
      localStorage.setItem("alchemist_token", accessToken);

      set({ user, accessToken });
    } finally {
      set({ isLoading: false });
    }
  },

  // GOOGLE AUTH (Existing, but no changes needed here, as the fix is handled by page redirect/updateCurrentUser)
  googleAuth: async () => {
    set({ isLoading: true });
    try {
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
      // NOTE: This relies on authApi.disconnectGoogle() being implemented 
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
    const { refreshAccessToken, logout } = useAuthStore.getState();
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/login") &&
      !originalRequest.url.includes("/register")
    ) {
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

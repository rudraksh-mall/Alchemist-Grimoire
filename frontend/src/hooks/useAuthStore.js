// src/store/useAuthStore.js
import { create } from "zustand";
import { api, authApi } from "../services/api.js";


console.log(JSON.parse(localStorage.getItem("alchemist_user")));
// console.log(localStorage.getItem("alchemist_user"));


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
      console.log("Current user fetched:", data);
      set({
        user: data.data,
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

  // GOOGLE AUTH
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

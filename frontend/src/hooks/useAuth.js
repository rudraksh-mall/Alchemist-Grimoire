import { useState, useEffect, createContext, useContext } from "react";
import { api, authApi } from "/src/services/api.js"; // 

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-refresh tokens on 401 using Axios interceptor
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshed = await authApi.refreshToken();
            setAccessToken(refreshed.accessToken);
            localStorage.setItem("alchemist_token", refreshed.accessToken);
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${refreshed.accessToken}`;
            return api(originalRequest);
          } catch (err) {
            logout(); // token refresh failed → log out
            return Promise.reject(err);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("alchemist_token");
      if (savedToken) {
        try {
          const { data } = await api.get("/auth/me"); // validate token
          setUser(data.data.user);
          setAccessToken(savedToken);
        } catch (err) {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // LOGIN
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      setUser(response.user);
      setAccessToken(response.accessToken);
      localStorage.setItem("alchemist_user", JSON.stringify(response.user));
      localStorage.setItem("alchemist_token", response.accessToken);
    } finally {
      setIsLoading(false);
    }
  };

  // REGISTER
  const register = async (email, password, name) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(email, password, name);
      setUser(response.user);
      setAccessToken(response.accessToken);
      localStorage.setItem("alchemist_user", JSON.stringify(response.user));
      localStorage.setItem("alchemist_token", response.accessToken);
    } finally {
      setIsLoading(false);
    }
  };

  // GOOGLE AUTH
  const googleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.googleAuth();
      setUser(response.user);
      setAccessToken(response.accessToken);
      localStorage.setItem("alchemist_user", JSON.stringify(response.user));
      localStorage.setItem("alchemist_token", response.accessToken);
    } finally {
      setIsLoading(false);
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem("alchemist_user");
      localStorage.removeItem("alchemist_token");
    }
  };

  // MANUAL REFRESH (optional)
  const refreshAccessToken = async () => {
    try {
      const refreshed = await authApi.refreshToken();
      setAccessToken(refreshed.accessToken);
      localStorage.setItem("alchemist_token", refreshed.accessToken);
      return refreshed.accessToken;
    } catch (err) {
      logout();
      throw err;
    }
  };

  return {
    user,
    accessToken,
    login,
    register,
    googleAuth,
    logout,
    refreshAccessToken,
    isLoading,
  };
};

export { AuthContext };

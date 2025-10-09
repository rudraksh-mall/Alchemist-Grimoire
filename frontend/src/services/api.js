import axios from "axios";

// 1. Set baseURL to include /v1 and use 'const' for named export compatibility
const api = axios.create({
  // CRITICAL FIX: Base URL is set to the correct root /api/v1
  baseURL: "http://localhost:8000/api/v1", 
  withCredentials: true,
});

// Request interceptor: attach access token (no change needed here)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("alchemist_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      // FIX: Check against consolidated /users routes
      !originalRequest.url.includes("/users/login") &&
      !originalRequest.url.includes("/users/verify-otp") &&
      !originalRequest.url.includes("/users/register")
    ) {
      originalRequest._retry = true;

      try {
        // FIX: Update refresh token path and token access
        const refreshResponse = await api.post(
          "/users/refresh-token",
          {},
          { withCredentials: true }
        );
        // NOTE: Access token path confirmed from controller logic
        const newAccessToken = refreshResponse.data.data.token; 

        // Update localStorage
        localStorage.setItem("alchemist_token", newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        // Refresh token failed → log out user
        localStorage.removeItem("alchemist_token");
        localStorage.removeItem("alchemist_user");
        window.location.href = "/login"; // redirect to login page
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// Mock data (omitted for brevity)

// API Functions: All prefixes are now correct (e.g., /medications instead of /v1/medications)
export const medicineApi = {
  getAll: async () => {
    const response = await api.get("/medications"); 
    return response.data.data;
  },
  getById: async (id) => {
    const response = await api.get(`/medications/${id}`);
    return response.data.data;
  },
  create: async (medicine) => {
    const response = await api.post("/medications", medicine);
    return response.data.data;
  },
  update: async (id, medicine) => {
    const response = await api.put(`/medications/${id}`, medicine);
    return response.data.data;
  },
  delete: async (id) => {
    await api.delete(`/medications/${id}`);
  },
};

export const doseApi = {
  getAll: async () => {
    try {
      const response = await api.get("/dose-logs/all");
      return response.data.data;
    } catch (error) {
      console.error("[Dose API] /dose-logs/all failed (404 expected):", error.message);
      return []; 
    }
  },
  getUpcoming: async () => {
    const response = await api.get("/dose-logs/today");
    return response.data.data;
  },
  markAsTaken: async (logId, actualTime) => {
    const response = await api.put(`/dose-logs/${logId}`, {
      status: "taken",
      actualTime: actualTime || new Date().toISOString(),
    });
    return response.data.data;
  },
  markAsSkipped: async (logId, notes = "") => {
    const response = await api.put(`/dose-logs/${logId}`, {
      status: "skipped",
      notes: notes,
    });
    return response.data.data;
  },
  snoozeDose: async (logId, durationMinutes = 30) => {
    const response = await api.put(`/dose-logs/${logId}`, {
      status: "snoozed",
      snoozeDurationMinutes: durationMinutes,
    });
    return response.data.data;
  },
};

export const statsApi = {
  getAdherence: async () => {
    const response = await api.get("/dose-logs/stats");
    return response.data.data;
  },
};

export const chatApi = {
  sendMessage: async (message) => {
    const response = await api.post("/chat/ask", { message });
    return response.data.data.response;
  },
};

// --- AUTH API: Implements two-step OTP flow using /users paths ---
export const authApi = {
  // CRITICAL FIX: Registration no longer returns tokens/user object.
  // It returns only the email (or a success indicator) to move to the verification step.
  register: async (email, password, fullName) => {
    const { data } = await api.post(
      "/users/register",
      { fullName, email, password },
      { withCredentials: true }
    );
    // FIX: Return the email for the RegisterPage component to use for Step 2
    return data.data.email; 
  },
  
  // FIX 1: OTP Step 1 (Login/Send Code)
  login: async (email, password) => {
    const { data } = await api.post(
      "/users/login", 
      { email, password },
      { withCredentials: true }
    );
    return data.data.email; // Returns email upon successful OTP dispatch
  },

  // FIX 2: OTP Step 2 (Verify Code/Final Login)
  verifyOtp: async (email, otp) => {
    const { data } = await api.post(
      "/users/verify-otp", 
      { email, otp },
      { withCredentials: true }
    );
    return {
      user: data.data.user,
      accessToken: data.data.accessToken, 
    };
  },

  disconnectGoogle: async () => {
    const response = await api.delete("/users/google/disconnect"); 
    return response.data;
  },
  
  logout: async () => {
    await api.post("/users/logout", {}, { withCredentials: true });
  },
  
  refreshToken: async () => {
    const { data } = await api.post(
      "/users/refresh-token",
      {},
      { withCredentials: true }
    );
    return { accessToken: data.data.token };
  },
};

// Export the main Axios instance as the default export.
export default api;
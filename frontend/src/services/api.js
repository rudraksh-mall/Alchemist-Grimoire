// Mock API service for Alchemist's Grand Grimoire
// In production, replace with actual API endpoints

import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
});

// Request interceptor: attach access token
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
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/register")
    ) {
      originalRequest._retry = true;

      try {
        // Call refresh token endpoint
        const refreshResponse = await api.post(
          "/auth/refresh-token",
          {},
          { withCredentials: true }
        );
        const newAccessToken = refreshResponse.data.data.accessToken;

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

// Mock data
const mockMedicines = [
  {
    id: "1",
    name: "Elixir of Energy",
    dosage: "10ml",
    frequency: "twice daily",
    times: ["08:00", "20:00"],
    startDate: "2024-01-01",
    color: "#7c3aed",
  },
  {
    id: "2",
    name: "Potion of Calm",
    dosage: "5mg",
    frequency: "as needed",
    times: ["12:00"],
    startDate: "2024-01-01",
    color: "#10b981",
  },
  {
    id: "3",
    name: "Crystal Clarity Pills",
    dosage: "25mg",
    frequency: "daily",
    times: ["09:00"],
    startDate: "2024-01-01",
    color: "#f59e0b",
  },
];

const mockDoses = [
  {
    id: "1",
    medicineId: "1",
    medicineName: "Elixir of Energy",
    dosage: "10ml",
    scheduledTime: "2024-01-15T08:00:00Z",
    actualTime: "2024-01-15T08:05:00Z",
    status: "taken",
  },
  {
    id: "2",
    medicineId: "1",
    medicineName: "Elixir of Energy",
    dosage: "10ml",
    scheduledTime: "2024-01-15T20:00:00Z",
    status: "pending",
  },
  {
    id: "3",
    medicineId: "3",
    medicineName: "Crystal Clarity Pills",
    dosage: "25mg",
    scheduledTime: "2024-01-15T09:00:00Z",
    status: "missed",
  },
];

const mockAdherenceStats = {
  totalDoses: 100,
  takenDoses: 85,
  missedDoses: 10,
  skippedDoses: 5,
  adherenceRate: 85,
  weeklyTrend: [
    { week: "Week 1", rate: 82 },
    { week: "Week 2", rate: 88 },
    { week: "Week 3", rate: 85 },
    { week: "Week 4", rate: 90 },
  ],
};

// API Functions

// Replace the entire 'export const medicineApi' block with this real implementation:

export const medicineApi = {
  // GET /api/medications - Fetches all schedules for the logged-in user
  getAll: async () => {
    const response = await api.get("/v1/medications"); // Assuming Express route is /medication
    return response.data.data; // Assuming Express returns { data: [...] }
  },

  // GET /api/medications/:id - Fetches a single schedule
  getById: async (id) => {
    const response = await api.get(`/v1/medications/${id}`);
    return response.data.data;
  },

  // POST /api/medications - Creates a new schedule
  create: async (medicine) => {
    const response = await api.post("/v1/medications", medicine);
    return response.data.data;
  },

  // PUT /api/medications/:id - Updates an existing schedule
  update: async (id, medicine) => {
    const response = await api.put(`/v1/medications/${id}`, medicine);
    return response.data.data;
  },

  // DELETE /api/medications/:id - Deletes a schedule
  delete: async (id) => {
    await api.delete(`/v1/medications/${id}`);
    // No return needed on success
  },
};

// services/api.js (Replace the existing doseApi block)

// services/api.js (Update the doseApi block)

export const doseApi = {
  // GET Upcoming: Matches backend route: router.get("/today", getTodaysDoseLogs)
  getUpcoming: async () => {
    const response = await api.get("/v1/dose-logs/today");
    return response.data.data;
  },

  // NOTE: Your backend uses PUT for updates, which is perfect for marking doses.
  // We will pass the action (taken/skipped) in the body.
  markAsTaken: async (logId, actualTime) => {
    const response = await api.put(`/v1/dose-logs/${logId}`, {
      status: "taken",
      actualTime: actualTime || new Date().toISOString(),
    });
    return response.data.data;
  },

  markAsSkipped: async (logId, notes = "") => {
    const response = await api.put(`/v1/dose-logs/${logId}`, {
      status: "skipped",
      notes: notes,
    });
    return response.data.data;
  },
};

// services/api.js (Replace the existing statsApi block)

export const statsApi = {
  // GET /api/v1/dose-logs/stats - Fetches adherence percentages and trends
  getAdherence: async () => {
    // Assuming your backend has a route like router.get("/stats", ...) mounted on dose-logs
    const response = await api.get("/v1/dose-logs/stats");
    return response.data.data;
  },
};

export const chatApi = {
  // POST /api/chat/ask
  sendMessage: async (message) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Simple mock responses based on keywords
    let response =
      "I sense great wisdom in your question, seeker. Let me consult the mystical scrolls...";

    if (
      message.toLowerCase().includes("today") ||
      message.toLowerCase().includes("pills")
    ) {
      response =
        "🔮 Today's potions include: Elixir of Energy at 8:00 AM and 8:00 PM, and Crystal Clarity Pills at 9:00 AM. The spirits whisper that you've already taken your morning elixir!";
    } else if (
      message.toLowerCase().includes("missed") ||
      message.toLowerCase().includes("yesterday")
    ) {
      response =
        "⚡ The crystal ball reveals you missed Crystal Clarity Pills yesterday at 9:00 AM. But fear not! Your overall adherence remains strong at 85%.";
    } else if (
      message.toLowerCase().includes("schedule") ||
      message.toLowerCase().includes("when")
    ) {
      response =
        "📜 Your mystical schedule shows 3 active potions. Next dose: Elixir of Energy tonight at 8:00 PM. The stars align favorably for your wellness journey!";
    }

    return {
      id: Date.now().toString(),
      message: response,
      isUser: false,
      timestamp: new Date().toISOString(),
    };
  },
};

// api.js
export const authApi = {
  register: async (email, password, fullName) => {
    const { data } = await api.post(
      "/v1/users/register",
      { fullName, email, password },
      { withCredentials: true }
    );
    return {
      user: data.user,
      accessToken: data.accessToken,
    };
  },
  login: async (email, password) => {
    const { data } = await api.post(
      "/v1/users/login",
      { email, password },
      { withCredentials: true }
    );
    return {
      user: data.data.user,
      accessToken: data.data.token, // ✅ corrected
    };
  },

  logout: async () => {
    await api.post("/v1/users/logout", {}, { withCredentials: true });
  },

  refreshToken: async () => {
    const { data } = await api.post(
      "/v1/users/refresh-token",
      {},
      { withCredentials: true }
    );
    return { accessToken: data.data.accessToken };
  },
};

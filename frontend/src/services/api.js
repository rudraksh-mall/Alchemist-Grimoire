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

export const doseApi = {
  // 🎯 FIX: Added try/catch to gracefully handle the missing backend route (404)
  getAll: async () => {
    try {
      const response = await api.get("/v1/dose-logs/all");
      return response.data.data;
    } catch (error) {
      // If the route is not found (404) or any other error occurs, return an empty array
      // This prevents the Promise.all chain from failing and blocking getUpcoming()
      console.error("[Dose API] /v1/dose-logs/all failed (404 expected):", error.message);
      return []; 
    }
  },
  
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

  // 🎯 NEW: Snooze Dose API endpoint (requests a time extension)
  snoozeDose: async (logId, durationMinutes = 30) => {
    // We send the status 'snoozed' and the duration needed
    const response = await api.put(`/v1/dose-logs/${logId}`, {
      status: "snoozed",
      snoozeDurationMinutes: durationMinutes,
    });
    return response.data.data;
  },
};

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
    const response = await api.post("/v1/chat/ask", { message });
    return response.data.data.response; // Return just the AI's text response
  },
};

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

  // 🎯 NEW METHOD: Disconnects Google Calendar
  disconnectGoogle: async () => {
    // Assuming backend route: DELETE /v1/users/google/disconnect
    // This endpoint should clear the token on the server side.
    const response = await api.delete("/v1/users/google/disconnect"); 
    return response.data;
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
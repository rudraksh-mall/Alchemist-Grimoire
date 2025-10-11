import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true, // send cookies
});


let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip auth routes from refresh logic
    const authPaths = [
      "/users/login",
      "/users/register",
      "/users/verify-otp",
      "/users/refresh-token",
      "/users/logout",
    ];
    if (authPaths.some((p) => originalRequest.url.includes(p))) {
      return Promise.reject(error);
    }

    // If 401 Unauthorized and not retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If a refresh is already happening, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Check if we even have a refresh token cookie / access token
        const accessToken = localStorage.getItem("alchemist_token");
        if (!accessToken) {
          throw new Error("No access token; user logged out.");
        }

        const refreshResponse = await api.post(
          "/users/refresh-token",
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data?.data?.token;
        if (!newToken) throw new Error("Refresh failed: no token received.");

        // Save new token
        localStorage.setItem("alchemist_token", newToken);

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);

        // Cleanup and redirect to login
        localStorage.removeItem("alchemist_token");
        localStorage.removeItem("alchemist_user");
        window.location.href = "/login";

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


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
      console.error(
        "[Dose API] /dose-logs/all failed (404 expected):",
        error.message
      );
      return [];
    }
  },
  getUpcoming: async () => {
    const response = await api.get("/dose-logs/today");
    return response.data.data;
  },
  // AI Prediction Retrieval
  getPrediction: async () => {
    const response = await api.get("/dose-logs/predict");
    // Returns the AI's structured JSON output: { summary, riskLevel, proactiveNudge }
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

// AUTH API
export const authApi = {
  register: async (email, password, fullName) => {
    const { data } = await api.post(
      "/users/register",
      { fullName, email, password },
      { withCredentials: true }
    );
    return data.data.email;
  },

  login: async (email, password) => {
    const { data } = await api.post(
      "/users/login",
      { email, password },
      { withCredentials: true }
    );
    return data.data.email;
  },

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

  // UPDATE GENERAL USER SETTINGS
  updateUserSettings: async ({
    fullName,
    email,
    timezone,
    reminderTimingMinutes,
  }) => {
    const response = await api.patch("/users/update-details", {
      fullName,
      email,
      timezone,
      reminderTimingMinutes: parseInt(reminderTimingMinutes), // Ensure it's a number
    });
    return response.data.data; // Returns the updated safe user object
  },

  // UPDATE NOTIFICATIONS
  updateNotifications: async (preferences) => {
    const response = await api.patch("/users/notifications", preferences);
    return response.data.data; // Should return the updated user object
  },

  // BROWSER SUBSCRIPTION API
  saveSubscription: async (subscriptionObject) => {
    // POST /v1/users/subscribe
    const response = await api.post("/users/subscribe", {
      subscription: subscriptionObject,
    });
    return response.data.data; // Returns the updated user object
  },

  // DELETE ACCOUNT
  deleteAccount: async () => {
    const response = await api.delete("/users/delete-account");
    console.log(response.data);

    return response.data;
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

export default api;
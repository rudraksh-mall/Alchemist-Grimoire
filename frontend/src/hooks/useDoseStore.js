import { create } from "zustand";
import { doseApi } from "../services/api.js";

const useDoseStore = create((set, get) => ({
  doses: [],
  upcomingDoses: [],
  isLoading: false,
  error: null,

  // Fetch all doses and upcoming doses
  fetchDoses: async () => {
    set({ isLoading: true, error: null });

    let allDoses = [];
    let upcoming = [];
    let fetchError = null;

    try {
      // 1. Fetch ALL doses first (often the first point of failure)
      allDoses = await doseApi.getAll();
      
      // 2. Fetch UPCOMING doses (CRITICAL PATH)
      try {
        // This is the call that should trigger the backend controller log
        upcoming = await doseApi.getUpcoming();
        console.log("[DoseStore] API successful, received upcoming doses:", upcoming);
      } catch (upcomingErr) {
        // This log will capture network errors specific to the upcoming doses endpoint
        console.error("[DoseStore] FAILED to fetch upcoming doses (getUpcoming):", upcomingErr);
        fetchError = upcomingErr;
      }

    } catch (err) {
      // This catches errors from doseApi.getAll() or a preceding error
      fetchError = err;
      console.error("[DoseStore] FAILED to fetch ALL doses (getAll):", err);
    } finally {
      set({
        doses: allDoses,
        upcomingDoses: upcoming,
        error: fetchError instanceof Error ? fetchError.message : (fetchError ? "Failed to fetch data" : null),
        isLoading: false,
      });
    }
  },

  // Mark a dose as taken
  markAsTaken: async (id, actualTime) => {
    try {
      const updatedDose = await doseApi.markAsTaken(id, actualTime);
      set(state => ({
        // Filter is technically redundant if fetchDoses is called immediately after, but kept for robust local state update
        doses: state.doses.map(d => d.id === id ? updatedDose : d),
        upcomingDoses: state.upcomingDoses.filter(d => d.id !== id),
      }));
      return updatedDose;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to mark dose as taken" });
      throw err;
    }
  },

  // Mark a dose as skipped
  markAsSkipped: async (id, notes) => {
    try {
      const updatedDose = await doseApi.markAsSkipped(id, notes);
      set(state => ({
        // Filter is technically redundant if fetchDoses is called immediately after, but kept for robust local state update
        doses: state.doses.map(d => d.id === id ? updatedDose : d),
        upcomingDoses: state.upcomingDoses.filter(d => d.id !== id),
      }));
      return updatedDose;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to mark dose as skipped" });
      throw err;
    }
  },

  // 🎯 NEW: Snooze dose action (calls API and triggers a local state refresh)
  snoozeDose: async (id, durationMinutes = 30) => {
    try {
      // The API call updates the scheduledFor time in the database
      const updatedDose = await doseApi.snoozeDose(id, durationMinutes);
      
      // We don't try to update the local state here; we rely on fetchDoses
      // to pull the updated, re-scheduled dose or see it removed from the upcoming list.
      return updatedDose;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to snooze dose" });
      throw err;
    }
  }
}));

export default useDoseStore;

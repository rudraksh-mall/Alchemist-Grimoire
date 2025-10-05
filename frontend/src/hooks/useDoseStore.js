// src/store/useDoseStore.js
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
    try {
      const [allDoses, upcoming] = await Promise.all([
        doseApi.getAll(),
        doseApi.getUpcoming()
      ]);
      set({
        doses: allDoses,
        upcomingDoses: upcoming,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch doses",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Mark a dose as taken
  markAsTaken: async (id, actualTime) => {
    try {
      const updatedDose = await doseApi.markAsTaken(id, actualTime);
      set(state => ({
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
        doses: state.doses.map(d => d.id === id ? updatedDose : d),
        upcomingDoses: state.upcomingDoses.filter(d => d.id !== id),
      }));
      return updatedDose;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to mark dose as skipped" });
      throw err;
    }
  },
}));

export default useDoseStore;

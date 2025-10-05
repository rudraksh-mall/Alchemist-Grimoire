// src/store/useMedicineStore.js
import { create } from "zustand";
import { medicineApi } from "../services/api";

const useMedicineStore = create((set, get) => ({
  medicines: [],
  isLoading: false,
  error: null,

  // Fetch all medicines
  fetchMedicines: async () => {
    set({ isLoading: true });
    try {
      const data = await medicineApi.getAll();
      set({ medicines: data, error: null });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch medicines",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Create a new medicine
  createMedicine: async (medicine) => {
    try {
      const newMedicine = await medicineApi.create(medicine);
      set((state) => ({ medicines: [...state.medicines, newMedicine] }));
      return newMedicine;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create medicine",
      });
      throw err;
    }
  },

  // Update a medicine
  updateMedicine: async (id, updates) => {
    try {
      const updatedMedicine = await medicineApi.update(id, updates);
      set((state) => ({
        medicines: state.medicines.map((m) => (m.id === id ? updatedMedicine : m)),
      }));
      return updatedMedicine;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update medicine",
      });
      throw err;
    }
  },

  // Delete a medicine
  deleteMedicine: async (id) => {
    try {
      await medicineApi.delete(id);
      set((state) => ({
        medicines: state.medicines.filter((m) => m.id !== id),
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete medicine",
      });
      throw err;
    }
  },
}));

export default useMedicineStore;

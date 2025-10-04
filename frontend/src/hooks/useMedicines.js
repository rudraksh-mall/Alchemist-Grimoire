import { useState, useEffect } from 'react';
import { medicineApi } from '../services/api';

export const useMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMedicines = async () => {
    try {
      setIsLoading(true);
      const data = await medicineApi.getAll();
      setMedicines(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch medicines');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const createMedicine = async (medicine) => {
    try {
      const newMedicine = await medicineApi.create(medicine);
      setMedicines(prev => [...prev, newMedicine]);
      return newMedicine;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create medicine');
      throw err;
    }
  };

  const updateMedicine = async (id, updates) => {
    try {
      const updatedMedicine = await medicineApi.update(id, updates);
      setMedicines(prev => prev.map(m => m.id === id ? updatedMedicine : m));
      return updatedMedicine;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update medicine');
      throw err;
    }
  };

  const deleteMedicine = async (id) => {
    try {
      await medicineApi.delete(id);
      setMedicines(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete medicine');
      throw err;
    }
  };

  return {
    medicines,
    isLoading,
    error,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    refetch: fetchMedicines
  };
};

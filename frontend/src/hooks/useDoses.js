import { useState, useEffect } from 'react';
import { doseApi } from '../services/api';

export const useDoses = () => {
  const [doses, setDoses] = useState([]);
  const [upcomingDoses, setUpcomingDoses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoses = async () => {
    try {
      setIsLoading(true);
      const [allDoses, upcoming] = await Promise.all([
        doseApi.getAll(),
        doseApi.getUpcoming()
      ]);
      setDoses(allDoses);
      setUpcomingDoses(upcoming);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoses();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchDoses, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsTaken = async (id, actualTime) => {
    try {
      const updatedDose = await doseApi.markAsTaken(id, actualTime);
      setDoses(prev => prev.map(d => d.id === id ? updatedDose : d));
      setUpcomingDoses(prev => prev.filter(d => d.id !== id));
      return updatedDose;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark dose as taken');
      throw err;
    }
  };

  const markAsSkipped = async (id, notes) => {
    try {
      const updatedDose = await doseApi.markAsSkipped(id, notes);
      setDoses(prev => prev.map(d => d.id === id ? updatedDose : d));
      setUpcomingDoses(prev => prev.filter(d => d.id !== id));
      return updatedDose;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark dose as skipped');
      throw err;
    }
  };

  return {
    doses,
    upcomingDoses,
    isLoading,
    error,
    markAsTaken,
    markAsSkipped,
    refetch: fetchDoses
  };
};

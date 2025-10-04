import { useState, useEffect, createContext, useContext } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const savedToken = localStorage.getItem('alchemist_token');
    const savedUser = localStorage.getItem('alchemist_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('alchemist_token', response.token);
      localStorage.setItem('alchemist_user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, name) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(email, password, name);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('alchemist_token', response.token);
      localStorage.setItem('alchemist_user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const googleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await authApi.googleAuth();
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('alchemist_token', response.token);
      localStorage.setItem('alchemist_user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('alchemist_token');
    localStorage.removeItem('alchemist_user');
  };

  return {
    user,
    token,
    login,
    register,
    googleAuth,
    logout,
    isLoading
  };
};

export { AuthContext };

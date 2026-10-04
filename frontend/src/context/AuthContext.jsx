import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('savebuddy_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize Auth State: Restore session if valid token exists (EC-2.6, EC-2.7)
  const initializeAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('savebuddy_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setToken(storedToken);
    } catch (err) {
      console.warn('[Auth] Session restoration failed:', err.message);
      localStorage.removeItem('savebuddy_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * User Registration
   */
  const register = async (userData) => {
    setAuthError(null);
    try {
      const response = await api.post('/auth/register', userData);
      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('savebuddy_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      const message = err.message || 'Registration failed. Please check your inputs.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  /**
   * User Login
   */
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('savebuddy_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      const message = err.message || 'Invalid email or password.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Update Financial Context / Profile
   */
  const updateProfile = async (profileData) => {
    setAuthError(null);
    try {
      const response = await api.put('/auth/profile', profileData);
      setUser(response.data);
      return { success: true, user: response.data };
    } catch (err) {
      const message = err.message || 'Failed to update profile settings.';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  /**
   * User Logout
   */
  const logout = () => {
    localStorage.removeItem('savebuddy_token');
    setUser(null);
    setToken(null);
    setAuthError(null);
  };

  const value = {
    user,
    token,
    loading,
    authError,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    updateProfile,
    logout,
    clearError: () => setAuthError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

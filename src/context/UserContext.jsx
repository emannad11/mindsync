import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getCurrentUser, updateCurrentUser } from '../services/api';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    if (!isAuthenticated) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getCurrentUser();
      setUserData(data);
    } catch (error) {
      console.error("Failed to fetch user", error);
      // If unauthorized, logout to prevent redirect loops
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [isAuthenticated]);

  const updateUserData = async (newData) => {
    try {
      const updated = await updateCurrentUser(newData);
      setUserData(prev => ({ ...prev, ...updated }));
      return updated;
    } catch (error) {
      console.error("Failed to update user", error);
      throw error;
    }
  };

  const completeOnboarding = async (onboardingData) => {
    try {
      await updateUserData({
        ...onboardingData,
        hasCompletedOnboarding: true
      });
      // Force refresh from server to be 100% sure
      await fetchUser();
    } catch (error) {
      console.error("Complete onboarding failed", error);
      throw error;
    }
  };

  // Provide fallback empty data if no user yet but we are inside provider
  const defaultUserData = {
    name: 'Guest',
    email: '',
    primaryGoal: 'Productivity',
    workStart: '09:00',
    workEnd: '17:00',
    productivityStyle: 'Morning Owl',
    sleepGoal: 8,
    waterGoal: 2.5,
    stressLevel: 2,
    hasCompletedOnboarding: false
  };

  // Only merge if we actually have data, otherwise keep it null or default
  const safeUserData = userData 
    ? { ...defaultUserData, ...Object.fromEntries(Object.entries(userData).filter(([_, v]) => v != null)) } 
    : (isAuthenticated ? null : defaultUserData);

  return (
    <UserContext.Provider value={{ 
      userData: safeUserData, 
      updateUserData, 
      completeOnboarding,
      refreshUser: fetchUser,
      loading 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

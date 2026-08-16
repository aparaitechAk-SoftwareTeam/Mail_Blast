import React, { createContext, useState, useEffect, useCallback } from 'react';

export const RefreshContext = createContext();

const STORAGE_KEY = 'studentEmailBlast_autoRefresh';
const DEFAULT_INTERVAL = 30000; // 30 seconds

export const RefreshProvider = ({ children }) => {
  const [intervalMs, setIntervalMsState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      return isNaN(parsed) ? DEFAULT_INTERVAL : parsed;
    }
    return DEFAULT_INTERVAL;
  });

  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Network Status Listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsTabVisible(visible);
      if (visible) {
        // Pulse refresh immediately when tab becomes visible again
        triggerManualRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const setIntervalMs = useCallback((newMs) => {
    setIntervalMsState(newMs);
    localStorage.setItem(STORAGE_KEY, newMs.toString());
  }, []);

  const triggerManualRefresh = useCallback(() => {
    setLastRefreshed(new Date());
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Auto-Refresh Pulse Timer
  useEffect(() => {
    if (intervalMs <= 0 || isPaused || !isTabVisible || isOffline) return;

    const timer = setInterval(() => {
      triggerManualRefresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, isPaused, isTabVisible, isOffline, triggerManualRefresh]);

  return (
    <RefreshContext.Provider
      value={{
        intervalMs,
        setIntervalMs,
        lastRefreshed,
        refreshKey,
        triggerManualRefresh,
        isPaused,
        setIsPaused,
        isOffline
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
};

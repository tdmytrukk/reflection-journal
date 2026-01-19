import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Entry, JobDescription } from '@/types';

interface AppState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  userName: string;
  userEmail: string;
  jobDescription: JobDescription | null;
  entries: Entry[];
}

interface AppContextType extends AppState {
  login: (email: string, name: string) => void;
  logout: () => void;
  completeOnboarding: (jobDesc: JobDescription) => void;
  addEntry: (entry: Entry) => void;
  updateEntry: (id: string, entry: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  getEntriesForMonth: (year: number, month: number) => Entry[];
  getEntriesForQuarter: (year: number, quarter: number) => Entry[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useLocalStorage<AppState>('rist-app-state', {
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    userName: '',
    userEmail: '',
    jobDescription: null,
    entries: [],
  });

  const login = (email: string, name: string) => {
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      userEmail: email,
      userName: name,
    }));
  };

  const logout = () => {
    setState({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      userName: '',
      userEmail: '',
      jobDescription: null,
      entries: [],
    });
  };

  const completeOnboarding = (jobDesc: JobDescription) => {
    setState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      jobDescription: jobDesc,
    }));
  };

  const addEntry = (entry: Entry) => {
    setState(prev => ({
      ...prev,
      entries: [entry, ...prev.entries],
    }));
  };

  const updateEntry = (id: string, updates: Partial<Entry>) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(e => 
        e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
      ),
    }));
  };

  const deleteEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.filter(e => e.id !== id),
    }));
  };

  const getEntriesForMonth = (year: number, month: number): Entry[] => {
    return state.entries.filter(e => {
      const date = new Date(e.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  };

  const getEntriesForQuarter = (year: number, quarter: number): Entry[] => {
    const startMonth = (quarter - 1) * 3;
    const endMonth = startMonth + 2;
    return state.entries.filter(e => {
      const date = new Date(e.date);
      const month = date.getMonth();
      return date.getFullYear() === year && month >= startMonth && month <= endMonth;
    });
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        completeOnboarding,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntriesForMonth,
        getEntriesForQuarter,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

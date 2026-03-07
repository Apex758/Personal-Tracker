'use client';

import { createContext, useContext, useState } from 'react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const YEAR_OPTIONS = [2025, 2026, 2027];

type MonthContextType = {
  selectedMonth: string;
  selectedYear: number;
  setSelectedMonth: (m: string) => void;
  setSelectedYear: (y: number) => void;
  MONTHS: string[];
  YEAR_OPTIONS: number[];
};

const MonthContext = createContext<MonthContextType | null>(null);

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  return (
    <MonthContext.Provider value={{ selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, MONTHS, YEAR_OPTIONS }}>
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used inside MonthProvider');
  return ctx;
}

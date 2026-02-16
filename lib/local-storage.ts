import { OvertimeEntry } from '@/lib/db/schema';

const STORAGE_KEY = 'overtime_entries';

export const localStorageHelper = {
  getEntries: (): OvertimeEntry[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  setEntries: (entries: OvertimeEntry[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  addEntry: (entry: OvertimeEntry): void => {
    const entries = localStorageHelper.getEntries();
    entries.push(entry);
    localStorageHelper.setEntries(entries);
  },

  updateEntry: (id: number, updatedEntry: OvertimeEntry): void => {
    const entries = localStorageHelper.getEntries();
    const index = entries.findIndex((e) => e.id === id);
    if (index !== -1) {
      entries[index] = updatedEntry;
      localStorageHelper.setEntries(entries);
    }
  },

  deleteEntry: (id: number): void => {
    const entries = localStorageHelper.getEntries();
    const filtered = entries.filter((e) => e.id !== id);
    localStorageHelper.setEntries(filtered);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

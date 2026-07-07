import { create } from "zustand";

/**
 * Transient console UI state. Filters themselves live in the URL (shareable);
 * this store holds the live search text before it is debounced into the URL,
 * plus the "last change" feedback banner shown after mutations.
 */
interface ConsoleFiltersState {
  searchText: string;
  setSearchText: (value: string) => void;
  lastChange: string | null;
  setLastChange: (message: string) => void;
}

export const useConsoleFilters = create<ConsoleFiltersState>((set) => ({
  searchText: "",
  setSearchText: (value) => set({ searchText: value }),
  lastChange: null,
  setLastChange: (message) => set({ lastChange: message }),
}));

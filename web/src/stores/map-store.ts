import { create } from "zustand";

/** Shared map UI state (selected route, hovered feature). */
interface MapState {
  selectedRouteId: string | null;
  setSelectedRouteId: (routeId: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedRouteId: null,
  setSelectedRouteId: (routeId) => set({ selectedRouteId: routeId }),
}));

"use client";

import { useState } from "react";
import { LayersThree01, NavigationPointer01 } from "@untitledui/icons";
import { useMapStore } from "@/stores/map-store";
import { cx } from "@/utils/cx";

interface FloatingControlsProps {
  onLocate: (coords: { lat: number; lon: number }) => void;
}

/** Visible sheet height per snap, mirrored from BottomSheet's fractions. */
const SHEET_DVH: Record<string, number> = {
  collapsed: 16,
  half: 45,
  full: 88,
};

const BUTTON_CLASS =
  "flex size-11 cursor-pointer items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] active:scale-95";

/**
 * Floating map controls: transit layers at the bottom-left, my-location at
 * the bottom-right. On mobile both ride above the bottom sheet and fade
 * out when the sheet is fully expanded.
 */
export function FloatingControls({ onLocate }: FloatingControlsProps) {
  const { setLayersOpen, layersOpen, sheetSnap } = useMapStore();
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!navigator.geolocation || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onLocate({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Mobile: track the sheet. Desktop (sm+): fixed near the bottom corners,
  // clear of the attribution bar on the right.
  const mobileStyle = {
    bottom: `calc(${SHEET_DVH[sheetSnap]}dvh + 1.25rem)`,
    opacity: sheetSnap === "full" ? 0 : 1,
    pointerEvents: (sheetSnap === "full" ? "none" : "auto") as
      | "none"
      | "auto",
  };
  const wrapperClass =
    "absolute z-20 transition-[bottom,opacity] duration-300 sm:opacity-100! sm:pointer-events-auto!";

  return (
    <>
      <div
        className={cx(wrapperClass, "left-4 sm:bottom-4!")}
        style={mobileStyle}
      >
        <button
          aria-label="Transit layers"
          onClick={() => setLayersOpen(!layersOpen)}
          className={cx(
            BUTTON_CLASS,
            "text-[#5F6368] hover:text-[#202124]",
          )}
        >
          <LayersThree01 className="size-5.5" />
        </button>
      </div>
      <div
        className={cx(wrapperClass, "right-4 sm:bottom-10!")}
        style={mobileStyle}
      >
        <button aria-label="My location" onClick={locate} className={BUTTON_CLASS}>
          {locating ? (
            <span className="size-4.5 animate-spin rounded-full border-2 border-[#DADCE0] border-t-[#1A73E8]" />
          ) : (
            <NavigationPointer01 className="size-5.5 text-[#1A73E8]" />
          )}
        </button>
      </div>
    </>
  );
}

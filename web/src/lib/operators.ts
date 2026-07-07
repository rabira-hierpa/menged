/**
 * Operator display metadata shared by the console, the public map, and the
 * map layers. Colors follow the approved "Addis Transit Dashboard" palette.
 */
export type OperatorCode =
  | "ANBESSA"
  | "SHEGER"
  | "ALLIANCE"
  | "MINIBUS"
  | "LRT";

export interface OperatorMeta {
  code: OperatorCode;
  name: string;
  short: string;
  mode: string;
  /** Route-line + accent color. */
  color: string;
  /** Chip (route-id pill) background/foreground. */
  chipBg: string;
  chipFg: string;
}

export const OPERATOR_META: Record<OperatorCode, OperatorMeta> = {
  ANBESSA: {
    code: "ANBESSA",
    name: "Anbessa City Bus",
    short: "Anbessa",
    mode: "Fixed-route bus",
    color: "#D97706",
    chipBg: "#FEF3C7",
    chipFg: "#92400E",
  },
  SHEGER: {
    code: "SHEGER",
    name: "Sheger Mass Transport",
    short: "Sheger",
    mode: "Fixed-route bus",
    color: "#15803D",
    chipBg: "#DCFCE7",
    chipFg: "#166534",
  },
  ALLIANCE: {
    code: "ALLIANCE",
    name: "Alliance City Bus",
    short: "Alliance",
    mode: "Fixed-route bus",
    color: "#9333EA",
    chipBg: "#F3E8FF",
    chipFg: "#6B21A8",
  },
  MINIBUS: {
    code: "MINIBUS",
    name: "Minibus Associations",
    short: "Minibus Assoc.",
    mode: "Demand-responsive paratransit",
    color: "#1D4ED8",
    chipBg: "#DBEAFE",
    chipFg: "#1E40AF",
  },
  LRT: {
    code: "LRT",
    name: "Addis Ababa Light Rail",
    short: "Addis LRT",
    mode: "Light rail transit",
    color: "#0F766E",
    chipBg: "#CCFBF1",
    chipFg: "#115E59",
  },
};

export const OPERATOR_CODES = Object.keys(OPERATOR_META) as OperatorCode[];

/** Line color for closed routes on both maps. */
export const CLOSED_ROUTE_COLOR = "#9AA69C";

export const CLOSURE_REASONS = [
  "PUBLIC_HOLIDAY",
  "MAINTENANCE",
  "POLITICAL_EVENT",
  "OTHER",
] as const;

export type ClosureReasonValue = (typeof CLOSURE_REASONS)[number];

export const CLOSURE_REASON_LABELS: Record<ClosureReasonValue, string> = {
  PUBLIC_HOLIDAY: "Public holiday",
  MAINTENANCE: "Planned maintenance",
  POLITICAL_EVENT: "Political event",
  OTHER: "Other",
};

/** Reasons a maintainer may use; the rest need route-operator or above. */
export const MAINTAINER_REASONS: ClosureReasonValue[] = [
  "MAINTENANCE",
  "OTHER",
];

import type { ExpressionSpecification } from "maplibre-gl";
import { CLOSED_ROUTE_COLOR, OPERATOR_META } from "@/lib/operators";

/** Free, key-less basemap. */
export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

/** Addis Ababa city center. */
export const ADDIS_CENTER = { longitude: 38.7578, latitude: 9.0107 };

/** Line color by operator; grey when the route is closed. */
export const ROUTE_LINE_COLOR: ExpressionSpecification = [
  "case",
  ["==", ["get", "closed"], true],
  CLOSED_ROUTE_COLOR,
  [
    "match",
    ["get", "operatorCode"],
    "ANBESSA",
    OPERATOR_META.ANBESSA.color,
    "SHEGER",
    OPERATOR_META.SHEGER.color,
    "ALLIANCE",
    OPERATOR_META.ALLIANCE.color,
    "MINIBUS",
    OPERATOR_META.MINIBUS.color,
    "LRT",
    OPERATOR_META.LRT.color,
    "#64748B",
  ],
];

/** LRT lines slightly wider than bus/minibus. */
export const ROUTE_LINE_WIDTH: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  10,
  ["case", ["==", ["get", "routeType"], 0], 2.5, 1.2],
  14,
  ["case", ["==", ["get", "routeType"], 0], 5, 3],
];

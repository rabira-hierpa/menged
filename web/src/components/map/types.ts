import type { OperatorCode } from "@/lib/operators";

export interface RouteSearchResult {
  id: string;
  shortName: string;
  longName: string;
  operatorCode: OperatorCode | null;
}

export interface StopSearchResult {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface RouteDetail {
  id: string;
  shortName: string;
  longName: string;
  routeType: number;
  lengthMeters: number | null;
  geojson: GeoJSON.LineString | null;
  operator: { code: OperatorCode; name: string } | null;
  fare: {
    kind: "FLAT" | "TIERED";
    flatAmountEtb: number | null;
    summary: string | null;
    tiers: {
      label: string;
      fromKm: number;
      toKm: number | null;
      amountEtb: number;
    }[];
  } | null;
  closure: {
    reason: string;
    note: string | null;
    startsAt: string;
    endsAt: string;
  } | null;
  headsign: string | null;
  frequencies: { startTime: string; endTime: string; headwaySecs: number }[];
  stops: { id: string; name: string; lat: number; lon: number }[];
}

export interface OtpLeg {
  mode: string;
  duration: number;
  distance: number;
  startTime: number;
  endTime: number;
  from: { name: string };
  to: { name: string };
  route: { shortName: string | null; longName: string | null } | null;
  legGeometry: { points: string } | null;
}

export interface OtpItinerary {
  duration: number;
  walkDistance: number;
  startTime: number;
  endTime: number;
  legs: OtpLeg[];
}

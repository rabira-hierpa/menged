import { lineString } from "@turf/helpers";
import length from "@turf/length";
import simplify from "@turf/simplify";
import type { GtfsShapePoint } from "./parse-gtfs";

export interface RouteGeometry {
  /** Full-resolution LineString geometry. */
  geojson: GeoJSON.LineString;
  /** Simplified LineString for the all-routes network layer. */
  geojsonSimplified: GeoJSON.LineString;
  lengthMeters: number;
}

/** Groups shape points by shape_id into ordered [lon, lat] coordinate lists. */
export function groupShapes(
  points: GtfsShapePoint[],
): Map<string, [number, number][]> {
  const grouped = new Map<string, { seq: number; coord: [number, number] }[]>();
  for (const p of points) {
    let list = grouped.get(p.shape_id);
    if (!list) {
      list = [];
      grouped.set(p.shape_id, list);
    }
    list.push({
      seq: Number(p.shape_pt_sequence),
      coord: [Number(p.shape_pt_lon), Number(p.shape_pt_lat)],
    });
  }
  const result = new Map<string, [number, number][]>();
  for (const [shapeId, list] of grouped) {
    list.sort((a, b) => a.seq - b.seq);
    result.set(
      shapeId,
      list.map((p) => p.coord),
    );
  }
  return result;
}

const SIMPLIFY_TOLERANCE = 0.0001;

export function buildRouteGeometry(
  coordinates: [number, number][],
): RouteGeometry | null {
  if (coordinates.length < 2) return null;
  const line = lineString(coordinates);
  const simplified = simplify(line, {
    tolerance: SIMPLIFY_TOLERANCE,
    highQuality: false,
    mutate: false,
  });
  return {
    geojson: line.geometry,
    geojsonSimplified: simplified.geometry,
    lengthMeters: Math.round(length(line, { units: "kilometers" }) * 1000),
  };
}

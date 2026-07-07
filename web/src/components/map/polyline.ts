/**
 * Decodes a Google encoded polyline (precision 5) into [lon, lat] pairs —
 * the format OTP returns in `legGeometry.points`.
 */
export function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lon = 0;

  while (index < encoded.length) {
    for (const target of ["lat", "lon"] as const) {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (target === "lat") lat += delta;
      else lon += delta;
    }
    coordinates.push([lon / 1e5, lat / 1e5]);
  }

  return coordinates;
}

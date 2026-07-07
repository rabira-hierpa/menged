"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MapGl, {
  Layer,
  Marker,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { FilterSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { SearchLg } from "@untitledui/icons";
import { RouteChip } from "@/components/console/route-chip";
import { CLOSED_ROUTE_COLOR, OPERATOR_META } from "@/lib/operators";
import { useMapStore } from "@/stores/map-store";
import { cx } from "@/utils/cx";
import { JourneyPlanner } from "./journey-planner";
import {
  ADDIS_CENTER,
  applyRouteHoverTransitions,
  BASEMAP_STYLE,
  ROUTE_HOVER_CASING_WIDTH,
  ROUTE_HOVER_LINE_WIDTH,
  ROUTE_LINE_COLOR,
  ROUTE_LINE_WIDTH,
} from "./map-style";
import { decodePolyline } from "./polyline";
import { RouteSheet } from "./route-sheet";
import { StopMarkersLayer } from "./stop-markers-layer";
import type {
  OtpItinerary,
  RouteDetail,
  RouteHoverPreview,
  RouteSearchResult,
  StopSearchResult,
} from "./types";

function boundsOf(coordinates: [number, number][]) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of coordinates) {
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }
  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ] as [[number, number], [number, number]];
}

function legColor(mode: string) {
  if (mode === "WALK") return CLOSED_ROUTE_COLOR;
  if (mode === "TRAM" || mode === "RAIL") return OPERATOR_META.LRT.color;
  return OPERATOR_META.SHEGER.color;
}

const routeHoverCache = new Map<string, RouteHoverPreview>();

interface PublicMapProps {
  user: { name: string; hasConsoleAccess: boolean } | null;
}

export function PublicMap({ user }: PublicMapProps) {
  const mapRef = useRef<MapRef>(null);
  const { selectedRouteId, setSelectedRouteId } = useMapStore();

  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [hubStops, setHubStops] = useState<StopSearchResult[]>([]);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [fetchedHoverPreview, setFetchedHoverPreview] = useState<{
    routeId: string;
    data: RouteHoverPreview;
  } | null>(null);
  const [tab, setTab] = useState<"explore" | "directions">("explore");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    routes: RouteSearchResult[];
    stops: StopSearchResult[];
  }>({ routes: [], stops: [] });
  const [routeDetail, setRouteDetail] = useState<{
    routeId: string;
    detail: RouteDetail;
  } | null>(null);
  const [itinerary, setItinerary] = useState<OtpItinerary | null>(null);
  const [marker, setMarker] = useState<StopSearchResult | null>(null);

  const effectiveHoverId =
    hoveredRouteId && hoveredRouteId !== selectedRouteId ? hoveredRouteId : null;
  const hoverPreview =
    effectiveHoverId == null
      ? null
      : (routeHoverCache.get(effectiveHoverId) ??
        (fetchedHoverPreview?.routeId === effectiveHoverId
          ? fetchedHoverPreview.data
          : null));
  const results =
    query.trim().length < 2 ? { routes: [], stops: [] } : searchResults;
  const detail =
    selectedRouteId && routeDetail?.routeId === selectedRouteId
      ? routeDetail.detail
      : null;

  useEffect(() => {
    fetch("/api/geo/routes")
      .then((res) => res.json())
      .then(setGeojson);
    fetch("/api/geo/hub-stops")
      .then((res) => res.json())
      .then((data: GeoJSON.FeatureCollection) => {
        setHubStops(
          data.features.map((feature) => ({
            id: feature.properties?.stopId as string,
            name: feature.properties?.name as string,
            lat: (feature.geometry as GeoJSON.Point).coordinates[1],
            lon: (feature.geometry as GeoJSON.Point).coordinates[0],
          })),
        );
      });
  }, []);

  // Fetch stop list + full geometry for the hovered route.
  useEffect(() => {
    if (!effectiveHoverId) return;
    if (routeHoverCache.has(effectiveHoverId)) return;

    const controller = new AbortController();
    let cancelled = false;

    const handle = setTimeout(() => {
      const request = fetch(`/api/routes/${effectiveHoverId}/hover`, {
        signal: controller.signal,
      });
      // Attach immediately so abort during cleanup cannot become an unhandled rejection.
      request.catch(() => {});

      void request
        .then((res) => (res.ok ? res.json() : null))
        .then((data: RouteHoverPreview | null) => {
          if (cancelled || !data) return;
          routeHoverCache.set(effectiveHoverId, data);
          setFetchedHoverPreview({ routeId: effectiveHoverId, data });
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          if (error instanceof DOMException && error.name === "AbortError") return;
        });
    }, 60);

    return () => {
      cancelled = true;
      clearTimeout(handle);
      controller.abort();
    };
  }, [effectiveHoverId]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !hoveredRouteId) return;

    const apply = () => applyRouteHoverTransitions(map);
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [hoveredRouteId, hoverPreview]);

  // Search-as-you-type.
  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      setSearchResults(await res.json());
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  // Load route detail when a route is selected.
  useEffect(() => {
    if (!selectedRouteId) return;
    let cancelled = false;
    fetch(`/api/routes/${selectedRouteId}`)
      .then((res) => res.json())
      .then((data: RouteDetail) => {
        if (cancelled) return;
        setRouteDetail({ routeId: selectedRouteId, detail: data });
        if (data.geojson?.coordinates?.length) {
          mapRef.current?.fitBounds(
            boundsOf(data.geojson.coordinates as [number, number][]),
            { padding: { top: 80, bottom: 80, left: 420, right: 80 }, duration: 800 },
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRouteId]);

  const selectRoute = (routeId: string) => {
    setItinerary(null);
    setMarker(null);
    setHoveredRouteId(null);
    setSelectedRouteId(routeId);
  };

  const selectStop = (stop: StopSearchResult) => {
    setSelectedRouteId(null);
    setMarker(stop);
    mapRef.current?.flyTo({
      center: [stop.lon, stop.lat],
      zoom: 15,
      duration: 800,
    });
  };

  const onItinerary = useCallback(
    (next: OtpItinerary | null) => {
      setSelectedRouteId(null);
      setMarker(null);
      setItinerary(next);
      if (next) {
        const coords = next.legs.flatMap((leg) =>
          leg.legGeometry ? decodePolyline(leg.legGeometry.points) : [],
        );
        if (coords.length > 0) {
          mapRef.current?.fitBounds(boundsOf(coords), {
            padding: { top: 80, bottom: 80, left: 420, right: 80 },
            duration: 800,
          });
        }
      }
    },
    [setSelectedRouteId],
  );

  const onMapClick = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (feature) selectRoute(feature.properties.routeId as string);
  };

  const previewRoute = useCallback((routeId: string | null) => {
    setHoveredRouteId(routeId);
  }, []);

  const onMapMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      if (selectedRouteId || itinerary) return;
      const feature = event.features?.find((f) => f.layer.id === "routes-all");
      const routeId = feature?.properties?.routeId as string | undefined;
      const canvas = mapRef.current?.getCanvas();
      if (canvas) canvas.style.cursor = routeId ? "pointer" : "";
      if (routeId && routeId !== hoveredRouteId) previewRoute(routeId);
      else if (!routeId && hoveredRouteId) previewRoute(null);
    },
    [hoveredRouteId, itinerary, previewRoute, selectedRouteId],
  );

  const onMapMouseLeave = useCallback(() => {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = "";
    if (!selectedRouteId) previewRoute(null);
  }, [previewRoute, selectedRouteId]);

  const hoverFilter: FilterSpecification = hoveredRouteId
    ? ["==", ["get", "routeId"], hoveredRouteId]
    : ["==", ["get", "routeId"], ""];

  const showHubStops =
    tab === "explore" && !selectedRouteId && !itinerary && !hoveredRouteId;
  const showHoverStops = Boolean(
    hoveredRouteId && hoverPreview?.stops.length && !selectedRouteId,
  );
  const showSelectedStops = Boolean(
    selectedRouteId && detail?.stops.length && !itinerary,
  );

  const detailGeojson = useMemo(
    () =>
      detail?.geojson
        ? ({
            type: "Feature",
            geometry: detail.geojson,
            properties: {},
          } as GeoJSON.Feature)
        : null,
    [detail],
  );

  const itineraryGeojson = useMemo(() => {
    if (!itinerary) return null;
    return {
      type: "FeatureCollection",
      features: itinerary.legs
        .filter((leg) => leg.legGeometry)
        .map((leg) => ({
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: decodePolyline(leg.legGeometry!.points),
          },
          properties: { mode: leg.mode, color: legColor(leg.mode) },
        })),
    } as GeoJSON.FeatureCollection;
  }, [itinerary]);

  const hasSearchResults =
    query.trim().length >= 2 &&
    (results.routes.length > 0 || results.stops.length > 0);

  return (
    <div className="relative h-screen w-full">
      <MapGl
        ref={mapRef}
        initialViewState={{ ...ADDIS_CENTER, zoom: 11.5 }}
        mapStyle={BASEMAP_STYLE}
        canvasContextAttributes={{ preserveDrawingBuffer: true }}
        interactiveLayerIds={["routes-all"]}
        onClick={onMapClick}
        onMouseMove={onMapMouseMove}
        onMouseLeave={onMapMouseLeave}
        style={{ width: "100%", height: "100%" }}
      >
        {geojson && (
          <Source id="routes" type="geojson" data={geojson}>
            <Layer
              id="routes-all"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": ROUTE_LINE_COLOR,
                "line-width": ROUTE_LINE_WIDTH,
                "line-opacity":
                  hoveredRouteId || detail || itinerary ? 0.22 : 0.65,
              }}
            />
            {hoveredRouteId ? (
              <Layer
                id="routes-hover-casing"
                type="line"
                filter={hoverFilter}
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{
                  "line-color": "#FFFFFF",
                  "line-width": ROUTE_HOVER_CASING_WIDTH,
                  "line-opacity": 0.95,
                }}
              />
            ) : null}
            {hoveredRouteId ? (
              <Layer
                id="routes-hover-line"
                type="line"
                filter={hoverFilter}
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{
                  "line-color": ROUTE_LINE_COLOR,
                  "line-width": ROUTE_HOVER_LINE_WIDTH,
                  "line-opacity": 1,
                }}
              />
            ) : null}
          </Source>
        )}

        <StopMarkersLayer
          id="hub-stops"
          stops={hubStops}
          variant="hub"
          visible={showHubStops}
        />

        {detailGeojson && (
          <Source id="selected-route" type="geojson" data={detailGeojson}>
            <Layer
              id="selected-route-casing"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{ "line-color": "#FFFFFF", "line-width": 8 }}
            />
            <Layer
              id="selected-route-line"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": detail?.closure
                  ? CLOSED_ROUTE_COLOR
                  : (OPERATOR_META[detail?.operator?.code ?? "SHEGER"].color ??
                    "#15803D"),
                "line-width": 4.5,
                ...(detail?.closure
                  ? { "line-dasharray": [2, 1.5] as [number, number] }
                  : {}),
              }}
            />
          </Source>
        )}

        {/* Stop markers render after route lines so they sit on top. */}
        <StopMarkersLayer
          id="hover-stops"
          stops={hoverPreview?.stops ?? []}
          variant="route"
          visible={showHoverStops}
          onLine
        />
        <StopMarkersLayer
          id="selected-stops"
          stops={detail?.stops ?? []}
          variant="route"
          visible={showSelectedStops}
          onLine
        />

        {itineraryGeojson && (
          <Source id="itinerary" type="geojson" data={itineraryGeojson}>
            <Layer
              id="itinerary-casing"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{ "line-color": "#FFFFFF", "line-width": 9 }}
            />
            <Layer
              id="itinerary-line"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": ["get", "color"],
                "line-width": 5,
              }}
            />
          </Source>
        )}

        {marker && (
          <Marker longitude={marker.lon} latitude={marker.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="rounded-md bg-[#152018] px-2 py-1 text-[11px] font-semibold text-white shadow-md">
                {marker.name}
              </div>
              <div className="size-3 rounded-full border-[3px] border-[#152018] bg-white shadow" />
            </div>
          </Marker>
        )}
      </MapGl>

      {/* Top-right: auth */}
      <div className="absolute top-4 right-4">
        {user ? (
          user.hasConsoleAccess ? (
            <Link
              href="/console"
              className="rounded-full bg-[#152018] px-4 py-2 text-[13px] font-semibold text-white shadow-lg hover:bg-[#24352A]"
            >
              Open console
            </Link>
          ) : (
            <span className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#3D4A3F] shadow-lg">
              {user.name}
            </span>
          )
        ) : (
          <Link
            href="/sign-in"
            className="rounded-full bg-[#152018] px-4 py-2 text-[13px] font-semibold text-white shadow-lg hover:bg-[#24352A]"
          >
            Sign in
          </Link>
        )}
      </div>

      {/* Floating panel */}
      <div className="pointer-events-none absolute top-4 left-4 flex max-h-[calc(100vh-2rem)] w-90 flex-col gap-3 max-sm:right-4 max-sm:w-auto">
        <div className="pointer-events-auto overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="flex items-center gap-2.5 border-b border-[#EEF1EA] px-4 pt-3.5 pb-3">
            <div>
              <div className="font-mono text-[11px] font-semibold tracking-widest text-[#15803D]">
                MENGED
              </div>
              <div className="text-[15px] leading-tight font-bold text-[#1C2321]">
                Addis Ababa Transit
              </div>
            </div>
            <div className="ml-auto flex rounded-lg bg-[#F4F5F2] p-0.5">
              {(["explore", "directions"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cx(
                    "cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold capitalize",
                    tab === t
                      ? "bg-white text-[#1C2321] shadow-sm"
                      : "text-[#5C6B5E]",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[38vh] overflow-y-auto p-4">
            {tab === "explore" ? (
              <div className="flex flex-col gap-2.5">
                <div className="relative">
                  <SearchLg className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9AA69C]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search routes and stops…"
                    className="w-full rounded-lg border border-[#D6DCD0] bg-white py-2 pr-3 pl-9 text-[13.5px] text-[#1C2321] focus:outline-2 focus:outline-[#15803D33]"
                  />
                </div>

                {hasSearchResults && (
                  <div className="flex flex-col gap-1">
                    {results.routes.length > 0 && (
                      <div className="mt-1 text-[10.5px] font-semibold tracking-wide text-[#5C6B5E] uppercase">
                        Routes
                      </div>
                    )}
                    {results.routes.map((route) => (
                      <button
                        key={route.id}
                        onClick={() => selectRoute(route.id)}
                        onMouseEnter={() => previewRoute(route.id)}
                        onMouseLeave={() => previewRoute(null)}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#F4F5F2]"
                      >
                        <RouteChip
                          shortName={route.shortName}
                          operatorCode={route.operatorCode}
                          size="sm"
                        />
                        <span className="min-w-0 truncate text-[12.5px] text-[#1C2321]">
                          {route.longName}
                        </span>
                      </button>
                    ))}
                    {results.stops.length > 0 && (
                      <div className="mt-1 text-[10.5px] font-semibold tracking-wide text-[#5C6B5E] uppercase">
                        Stops
                      </div>
                    )}
                    {results.stops.map((stop) => (
                      <button
                        key={stop.id}
                        onClick={() => selectStop(stop)}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#F4F5F2]"
                      >
                        <span className="size-2 shrink-0 rounded-full border-2 border-[#7E9182] bg-white" />
                        <span className="min-w-0 truncate text-[12.5px] text-[#1C2321]">
                          {stop.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {query.trim().length >= 2 && !hasSearchResults && (
                  <div className="py-2 text-center text-[12.5px] text-[#7E9182]">
                    No routes or stops found.
                  </div>
                )}

                {query.trim().length < 2 && (
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex flex-wrap gap-3">
                      {Object.values(OPERATOR_META).map((meta) => (
                        <span
                          key={meta.code}
                          className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#5C6B5E]"
                        >
                          <span
                            className="h-1 w-4 rounded-sm"
                            style={{ background: meta.color }}
                          />
                          {meta.short}
                        </span>
                      ))}
                    </div>
                    {hubStops.length > 0 && (
                      <p className="text-[11px] leading-snug text-[#7E9182]">
                        Green dots mark major destinations — hover any route
                        line to preview its stops.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <JourneyPlanner onItinerary={onItinerary} />
            )}
          </div>
        </div>

        {detail && (
          <RouteSheet detail={detail} onClose={() => setSelectedRouteId(null)} />
        )}
      </div>
    </div>
  );
}

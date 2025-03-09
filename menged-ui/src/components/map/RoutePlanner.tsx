"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, CornerDownRight, Clock } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Use a free alternative for Mapbox. In production, use your own Mapbox token
mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbDBtcXN3bjUwMWZhM2NvenhseXd2bWE3In0.example";

type LatLng = {
  lat: number;
  lng: number;
};

export function RoutePlanner() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [fromPoint, setFromPoint] = useState<LatLng>({
    lat: 9.0208,
    lng: 38.7462,
  }); // Default to Addis Ababa
  const [toPoint, setToPoint] = useState<LatLng>({ lat: 9.0123, lng: 38.762 });
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current) return; // Initialize map only once
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [fromPoint.lng, fromPoint.lat],
      zoom: 12,
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add from marker
    new mapboxgl.Marker({ color: "#22c55e" })
      .setLngLat([fromPoint.lng, fromPoint.lat])
      .addTo(map.current);

    // Add to marker
    new mapboxgl.Marker({ color: "#ef4444" })
      .setLngLat([toPoint.lng, toPoint.lat])
      .addTo(map.current);

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Function to plan route using OTP GraphQL API
  const planRoute = async () => {
    try {
      const query = `{
        plan(
          from: {lat: ${fromPoint.lat}, lon: ${fromPoint.lng}},
          to: {lat: ${toPoint.lat}, lon: ${toPoint.lng}},
          numItineraries: 1,
          date: "2023-03-10",
          time: "10:00:00"
        ) {
          itineraries {
            duration
            legs {
              mode
              startTime
              endTime
              from {
                name
              }
              to {
                name
              }
              distance
              mode
              transitLeg
            }
          }
        }
      }`;

      const response = await fetch(
        process.env.NEXT_PUBLIC_OTP_API_URL ||
          "http://localhost:8080/otp/routers/default/index/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        }
      );

      const data = await response.json();

      if (data.data?.plan?.itineraries?.[0]) {
        const itinerary = data.data.plan.itineraries[0];
        setRouteInfo(itinerary);

        // In a real app, you would get the geometry from OTP and display it
        // For now, we're just connecting the points with a line
        if (map.current) {
          // Remove previous route layer if exists
          if (map.current.getLayer("route")) {
            map.current.removeLayer("route");
          }
          if (map.current.getSource("route")) {
            map.current.removeSource("route");
          }

          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: [
                  [fromPoint.lng, fromPoint.lat],
                  [toPoint.lng, toPoint.lat],
                ],
              },
            },
          });

          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3b82f6",
              "line-width": 6,
              "line-opacity": 0.8,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error planning route:", error);
    }
  };

  // Format time from timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-4rem)]">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Plan Your Route</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="from"
                  placeholder="Origin"
                  value={`${fromPoint.lat.toFixed(4)}, ${fromPoint.lng.toFixed(
                    4
                  )}`}
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <div className="flex items-center space-x-2">
                <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="to"
                  placeholder="Destination"
                  value={`${toPoint.lat.toFixed(4)}, ${toPoint.lng.toFixed(4)}`}
                  readOnly
                />
              </div>
            </div>
            <Button className="w-full" onClick={planRoute}>
              Plan Route
            </Button>

            {routeInfo && (
              <div className="border rounded-md p-3 mt-4 space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Route Information
                </h3>
                <p className="text-sm">
                  Duration: {Math.round(routeInfo.duration / 60)} minutes
                </p>
                <div className="space-y-2">
                  {routeInfo.legs.map((leg: any, index: number) => (
                    <div
                      key={index}
                      className="text-sm border-l-2 border-primary pl-2"
                    >
                      <div className="font-medium">{leg.mode}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(leg.startTime)} - {formatTime(leg.endTime)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div
        ref={mapContainer}
        className="h-full md:col-span-2 rounded-lg overflow-hidden"
      />
    </div>
  );
}

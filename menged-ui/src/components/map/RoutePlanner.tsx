"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, CornerDownRight, Clock } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import Leaflet default marker icons which are not included in the CSS
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

type LatLng = {
  lat: number;
  lng: number;
};

// Helper component to fix Leaflet icon issues
function LeafletMapSetup() {
  useEffect(() => {
    // Only run this in the browser
    if (typeof window !== "undefined") {
      // @ts-expect-error - Leaflet typings issue
      delete L.Icon.Default.prototype._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: iconRetinaUrl.src,
        iconUrl: iconUrl.src,
        shadowUrl: shadowUrl.src,
      });
    }
  }, []);

  return null;
}

// Helper component to fit map bounds around markers
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map((p) => [p[0], p[1]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);

  return null;
}

type RouteInfoType = {
  duration: number;
  legs: Array<{
    mode: string;
    startTime: number;
    endTime: number;
    from: {
      name: string;
    };
    to: {
      name: string;
    };
    distance: number;
    transitLeg: boolean;
  }>;
};

export function RoutePlanner() {
  const [fromPoint, setFromPoint] = useState<LatLng>({
    lat: 9.0208,
    lng: 38.7462,
  }); // Default to Addis Ababa
  const [toPoint, setToPoint] = useState<LatLng>({ lat: 9.0123, lng: 38.762 });
  const [routeInfo, setRouteInfo] = useState<RouteInfoType | null>(null);
  const [routePositions, setRoutePositions] = useState<[number, number][]>([
    [fromPoint.lat, fromPoint.lng],
    [toPoint.lat, toPoint.lng],
  ]);

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
        setRoutePositions([
          [fromPoint.lat, fromPoint.lng],
          [toPoint.lat, toPoint.lng],
        ]);
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
                  {routeInfo.legs.map((leg, index) => (
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
      <div className="h-full md:col-span-2 rounded-lg overflow-hidden">
        <MapContainer
          center={[fromPoint.lat, fromPoint.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <LeafletMapSetup />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[fromPoint.lat, fromPoint.lng]}>
            <Popup>Starting Point</Popup>
          </Marker>
          <Marker position={[toPoint.lat, toPoint.lng]}>
            <Popup>Destination</Popup>
          </Marker>
          <Polyline
            positions={routePositions}
            pathOptions={{ color: "blue", weight: 4 }}
          />
          <FitBounds positions={routePositions} />
        </MapContainer>
      </div>
    </div>
  );
}

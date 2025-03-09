import { RoutePlanner } from "@/components/map/RoutePlanner";

export const metadata = {
  title: "Route Planner - Menged",
  description:
    "Plan your route through Addis Ababa with public transport and walking directions.",
};

export default function MapPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Route Planner</h1>
        <p className="text-muted-foreground">
          Plan your journey through Addis Ababa using public transport and
          walking
        </p>
      </div>
      <RoutePlanner />
    </div>
  );
}

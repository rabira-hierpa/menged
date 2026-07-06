import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-primary">
      <BadgeWithDot color="success" size="lg" type="pill-color">
        Scaffold verified
      </BadgeWithDot>
      <h1 className="text-display-sm font-semibold text-primary">
        Menged — Addis Ababa Transit
      </h1>
      <p className="max-w-md text-center text-md text-tertiary">
        Public transport route management for Addis Ababa. The public map,
        operations console, and settings will land here.
      </p>
      <Button size="lg">Untitled UI is wired up</Button>
    </main>
  );
}

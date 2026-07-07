import { PublicMap } from "@/components/map/public-map";
import { CONSOLE_ROLES, type AppRole } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const role = (session?.user.role ?? "user") as AppRole;

  return (
    <PublicMap
      user={
        session
          ? {
              name: session.user.name,
              hasConsoleAccess: CONSOLE_ROLES.includes(role),
            }
          : null
      }
    />
  );
}

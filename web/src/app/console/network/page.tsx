import { NetworkMap, type NetworkRoute } from "@/components/console/network-map";
import { ConsolePageHeader } from "@/components/console/page-header";
import type { ClosureReasonValue, OperatorCode } from "@/lib/operators";
import { CONSOLE_ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { activeClosureFilter } from "@/lib/transit";

export const dynamic = "force-dynamic";

export default async function NetworkMapPage() {
  const { role } = await requireRole(CONSOLE_ROLES);

  const routes = await prisma.route.findMany({
    select: {
      id: true,
      shortName: true,
      longName: true,
      assignment: { select: { operator: { select: { code: true } } } },
      closures: {
        where: activeClosureFilter(),
        select: { id: true, reason: true, note: true, endsAt: true },
        orderBy: { endsAt: "desc" },
        take: 1,
      },
    },
    orderBy: { shortName: "asc" },
  });

  const networkRoutes: NetworkRoute[] = routes.map((route) => ({
    id: route.id,
    shortName: route.shortName,
    longName: route.longName,
    operatorCode:
      (route.assignment?.operator.code as OperatorCode | undefined) ?? null,
    closure: route.closures[0]
      ? {
          id: route.closures[0].id,
          reason: route.closures[0].reason as ClosureReasonValue,
          note: route.closures[0].note,
          endsAt: route.closures[0].endsAt.toISOString(),
        }
      : null,
  }));

  return (
    <>
      <ConsolePageHeader
        title="Network Map"
        subtitle="Corridor view of every route · close routes for public holidays or political events"
      />
      <NetworkMap routes={networkRoutes} isMaintainer={role === "maintainer"} />
    </>
  );
}

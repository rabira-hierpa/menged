import { CONSOLE_ROLES } from "@/lib/permissions";
import { requireRole } from "@/lib/session";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(CONSOLE_ROLES);
  return <>{children}</>;
}

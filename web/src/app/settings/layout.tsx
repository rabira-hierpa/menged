import { SETTINGS_ROLES } from "@/lib/permissions";
import { requireRole } from "@/lib/session";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(SETTINGS_ROLES);
  return <>{children}</>;
}

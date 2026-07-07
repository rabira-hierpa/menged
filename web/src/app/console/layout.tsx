import { ConsoleSidebar } from "@/components/console/sidebar";
import { CONSOLE_ROLES, SETTINGS_ROLES } from "@/lib/permissions";
import { requireRole } from "@/lib/session";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, role } = await requireRole(CONSOLE_ROLES);

  return (
    <div className="flex min-h-screen bg-[#F4F5F2]">
      <ConsoleSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role,
        }}
        canManageSettings={SETTINGS_ROLES.includes(role)}
      />
      <main className="min-w-0 flex-1 px-9 pt-7 pb-12">{children}</main>
    </div>
  );
}

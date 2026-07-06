import { getSession } from "@/lib/session";

export default async function ConsoleOverviewPage() {
  const session = await getSession();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2">
      <h1 className="text-display-xs font-semibold text-primary">
        Ops console
      </h1>
      <p className="text-sm text-tertiary">
        Signed in as {session?.user.email} ({session?.user.role})
      </p>
    </main>
  );
}

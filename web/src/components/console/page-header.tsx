export function ConsolePageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-3">
      <div>
        <h1 className="text-[22px] font-bold text-[#1C2321]">{title}</h1>
        <div className="mt-1 text-[13px] text-[#5C6B5E]">{subtitle}</div>
      </div>
      {action}
    </header>
  );
}

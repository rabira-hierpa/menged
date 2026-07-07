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
    <header className="mb-6 flex items-baseline justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#1C2321]">{title}</h1>
        <div className="mt-1 text-[13px] text-[#5C6B5E]">{subtitle}</div>
      </div>
      {action}
    </header>
  );
}

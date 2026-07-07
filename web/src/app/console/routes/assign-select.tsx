"use client";

import { useState, useTransition } from "react";
import { assignRoute } from "@/actions/assignments";
import { useConsoleFilters } from "@/stores/console-filters-store";

interface AssignSelectProps {
  routeId: string;
  shortName: string;
  operatorId: string | null;
  operators: { id: string; name: string }[];
  disabled?: boolean;
}

export function AssignSelect({
  routeId,
  shortName,
  operatorId,
  operators,
  disabled,
}: AssignSelectProps) {
  const [value, setValue] = useState(operatorId ?? "");
  const [isPending, startTransition] = useTransition();
  const setLastChange = useConsoleFilters((s) => s.setLastChange);

  const onChange = (next: string) => {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        const result = await assignRoute({ routeId, operatorId: next });
        if (result.ok) {
          setLastChange(`${shortName} reassigned to ${result.operatorName}`);
        } else {
          setValue(previous);
          setLastChange(`Could not reassign ${shortName}: ${result.error}`);
        }
      } catch {
        setValue(previous);
        setLastChange(`Not allowed to reassign ${shortName}`);
      }
    });
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isPending}
      aria-label={`Operator for ${shortName}`}
      className="w-full cursor-pointer rounded-lg border border-[#D6DCD0] bg-white px-2.5 py-1.5 text-[13px] text-[#1C2321] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {!value && <option value="">Unassigned</option>}
      {operators.map((op) => (
        <option key={op.id} value={op.id}>
          {op.name}
        </option>
      ))}
    </select>
  );
}

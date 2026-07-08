"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ClosureDay,
  HeadwayBucket,
  NetworkAnalytics,
  OperatorStats,
} from "@/lib/analytics";

const AXIS_STYLE = { fontSize: 11, fill: "#5C6B5E" };
const GRID_COLOR = "#EEF1EA";

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid #E2E6DE",
  fontSize: 12.5,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

export function OperatorRoutesChart({ data }: { data: OperatorStats[] }) {
  const rows = data.map((op) => ({
    name: op.name.replace(" Associations", "").replace(" Mass Transport", ""),
    Routes: op.routes,
    "Network km": op.networkKm,
    color: op.color,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="name" tick={AXIS_STYLE} interval={0} />
        <YAxis tick={AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#F4F5F2" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Routes" radius={[4, 4, 0, 0]}>
          {rows.map((row) => (
            <Cell key={row.name} fill={row.color} />
          ))}
        </Bar>
        <Bar dataKey="Network km" fill="#9AA69C" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HeadwayChart({ data }: { data: HeadwayBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} interval={0} />
        <YAxis tick={AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#F4F5F2" }} />
        <Bar
          dataKey="routes"
          name="Routes"
          fill="#15803D"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

const CLOSURE_COLORS: Record<string, string> = {
  PUBLIC_HOLIDAY: "#1D4ED8",
  MAINTENANCE: "#D97706",
  POLITICAL_EVENT: "#B91C1C",
  OTHER: "#6B7280",
};

const CLOSURE_LABELS: Record<string, string> = {
  PUBLIC_HOLIDAY: "Public holiday",
  MAINTENANCE: "Maintenance",
  POLITICAL_EVENT: "Political event",
  OTHER: "Other",
};

export function ClosuresChart({ data }: { data: ClosureDay[] }) {
  const rows = data.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS_STYLE}
          interval={13}
          minTickGap={16}
        />
        <YAxis tick={AXIS_STYLE} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#F4F5F2" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {Object.entries(CLOSURE_COLORS).map(([reason, color]) => (
          <Bar
            key={reason}
            dataKey={reason}
            name={CLOSURE_LABELS[reason]}
            stackId="closures"
            fill={color}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FareChart({
  data,
}: {
  data: NetworkAnalytics["fareByOperator"];
}) {
  const rows = data.map((op) => ({
    name: op.name.replace(" Associations", "").replace(" Mass Transport", ""),
    "Avg fare (ETB)": op.avgFareEtb,
    color: op.color,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="name" tick={AXIS_STYLE} interval={0} />
        <YAxis tick={AXIS_STYLE} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#F4F5F2" }} />
        <Bar dataKey="Avg fare (ETB)" radius={[4, 4, 0, 0]}>
          {rows.map((row) => (
            <Cell key={row.name} fill={row.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

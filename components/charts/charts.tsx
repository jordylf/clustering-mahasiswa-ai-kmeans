"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceDot,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";

const axisProps = {
  stroke: "var(--chart-axis)",
  tick: { fill: "var(--chart-axis)", fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

type TooltipRow = { label: string; value: string; color?: string };

function TooltipBox({ title, rows }: { title?: string; rows: TooltipRow[] }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {title && <p className="mb-1 font-medium">{title}</p>}
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2">
          {r.color && <span className="size-2 rounded-full" style={{ backgroundColor: r.color }} />}
          <span className="text-muted-foreground">{r.label}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export type CategoryDatum = { name: string; value: number; color?: string };

export function DonutChart({ data, height = 260 }: { data: CategoryDatum[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="85%"
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
          cornerRadius={4}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color ?? "var(--series-1)"} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.[0] ? (
              <TooltipBox
                rows={[
                  {
                    label: String(payload[0].name),
                    value: `${payload[0].value} (${formatNumber((Number(payload[0].value) / total) * 100, 1)}%)`,
                    color: (payload[0].payload as CategoryDatum).color,
                  },
                ]}
              />
            ) : null
          }
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span className="text-xs text-foreground">{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  horizontal = false,
  height = 280,
  valueLabel = "Jumlah",
  digits = 0,
}: {
  data: CategoryDatum[];
  /** true = bar mendatar (cocok untuk label kategori panjang) */
  horizontal?: boolean;
  height?: number;
  valueLabel?: string;
  digits?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: 4, right: 16, top: 8 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} allowDecimals={digits > 0} />
            <YAxis type="category" dataKey="name" {...axisProps} width={120} interval={0} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" {...axisProps} interval={0} />
            <YAxis {...axisProps} width={36} allowDecimals={digits > 0} />
          </>
        )}
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={({ active, payload }) =>
            active && payload?.[0] ? (
              <TooltipBox
                title={String((payload[0].payload as CategoryDatum).name)}
                rows={[{ label: valueLabel, value: formatNumber(Number(payload[0].value), digits) }]}
              />
            ) : null
          }
        />
        <Bar dataKey="value" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={32}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color ?? "var(--series-1)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MetricLineChart({
  data,
  metricLabel,
  highlightK,
  color = "var(--series-1)",
  digits = 3,
}: {
  data: { k: number; value: number }[];
  metricLabel: string;
  highlightK?: number;
  color?: string;
  digits?: number;
}) {
  const highlight = data.find((d) => d.k === highlightK);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: 4, right: 16, top: 12, bottom: 12 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="k"
          {...axisProps}
          label={{ value: "Jumlah Cluster (K)", position: "insideBottom", offset: -6, fill: "var(--chart-axis)", fontSize: 12 }}
        />
        <YAxis {...axisProps} width={52} tickFormatter={(v: number) => formatNumber(v, digits > 2 ? 2 : 0)} domain={["auto", "auto"]} />
        <Tooltip
          cursor={{ stroke: "var(--chart-axis)", strokeDasharray: "3 3" }}
          content={({ active, payload }) =>
            active && payload?.[0] ? (
              <TooltipBox
                title={`K = ${(payload[0].payload as { k: number }).k}`}
                rows={[{ label: metricLabel, value: formatNumber(Number(payload[0].value), digits), color }]}
              />
            ) : null
          }
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: "var(--card)" }} activeDot={{ r: 6 }} />
        {highlight && <ReferenceDot x={highlight.k} y={highlight.value} r={8} fill="none" stroke={color} strokeWidth={2} />}
      </LineChart>
    </ResponsiveContainer>
  );
}

export type ScatterPoint = {
  x: number;
  y: number;
  code: string;
  label: string;
  dependencyScore: number;
};

export function PcaScatterChart({
  series,
  explained,
}: {
  series: { label: string; color: string; points: ScatterPoint[] }[];
  explained: [number, number];
}) {
  return (
    <ResponsiveContainer width="100%" height={460}>
      <ScatterChart margin={{ left: 4, right: 16, top: 12, bottom: 16 }}>
        <CartesianGrid stroke="var(--chart-grid)" />
        <XAxis
          type="number"
          dataKey="x"
          name="PC1"
          {...axisProps}
          tickFormatter={(v: number) => formatNumber(v, 1)}
          label={{ value: `PCA Component 1 (${formatNumber(explained[0] * 100, 1)}%)`, position: "insideBottom", offset: -8, fill: "var(--chart-axis)", fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="PC2"
          {...axisProps}
          width={56}
          tickFormatter={(v: number) => formatNumber(v, 1)}
          label={{ value: `PCA Component 2 (${formatNumber(explained[1] * 100, 1)}%)`, angle: -90, position: "insideLeft", fill: "var(--chart-axis)", fontSize: 12, style: { textAnchor: "middle" } }}
        />
        <ZAxis range={[64, 64]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3", stroke: "var(--chart-axis)" }}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as ScatterPoint | undefined;
            return active && p ? (
              <TooltipBox
                title={p.code}
                rows={[
                  { label: "Cluster", value: p.label },
                  { label: "Dependency score", value: formatNumber(p.dependencyScore) },
                  { label: "PC1 / PC2", value: `${formatNumber(p.x)} / ${formatNumber(p.y)}` },
                ]}
              />
            ) : null;
          }}
        />
        <Legend verticalAlign="top" iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
        {series.map((s) => (
          <Scatter key={s.label} name={s.label} data={s.points} fill={s.color} stroke="var(--card)" strokeWidth={1.5} fillOpacity={0.9} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function FeatureRadarChart({
  data,
  primaryLabel,
  compareLabel,
}: {
  data: { feature: string; value: number; compare?: number }[];
  primaryLabel: string;
  compareLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius="62%" margin={{ left: 28, right: 28 }}>
        <PolarGrid stroke="var(--chart-grid)" />
        <PolarAngleAxis dataKey="feature" tick={{ fill: "var(--chart-axis)", fontSize: 11 }} />
        <PolarRadiusAxis domain={[1, 5]} tickCount={5} tick={false} axisLine={false} />
        {compareLabel && (
          <Radar name={compareLabel} dataKey="compare" stroke="var(--series-2)" fill="var(--series-2)" fillOpacity={0.08} strokeWidth={2} strokeDasharray="4 3" />
        )}
        <Radar name={primaryLabel} dataKey="value" stroke="var(--series-1)" fill="var(--series-1)" fillOpacity={0.25} strokeWidth={2} />
        <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipBox
                title={String((payload[0].payload as { feature: string }).feature)}
                rows={payload.map((p) => ({ label: String(p.name), value: formatNumber(Number(p.value)), color: String(p.color) }))}
              />
            ) : null
          }
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

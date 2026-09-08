"use client";

import { memo, useMemo, type ReactNode } from "react";
import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";

const chartText = "#111827";
const mutedText = "#647064";
const border = "#d9e2d8";
const gridLine = "#edf2ed";
const green = "#155f42";
const greenSoft = "#8ec2a3";
const amber = "#b87912";
const red = "#b42318";
const blue = "#356fc1";
const fontFamily = "Roboto, sans-serif";

export type AdsDailyChartPoint = {
  date: string;
  observed?: boolean;
  spend: number | null;
  purchaseValue?: number | null;
  purchases: number | null;
  roas: number | null;
  cpa?: number | null;
};

export type AdsAllocationPoint = {
  key?: string;
  name?: string;
  campaign?: string;
  spend: number;
  purchaseValue?: number | null;
};

export type AdsAdSetPoint = {
  key?: string;
  name?: string;
  campaign?: string;
  adSet?: string;
  spend: number;
  purchaseValue?: number | null;
  purchases?: number | null;
  roas?: number | null;
};

export type AdsCreativePoint = {
  key?: string;
  name?: string;
  campaign?: string;
  adSet?: string;
  ad?: string;
  spend: number;
  purchases?: number | null;
  roas?: number | null;
  /** Fraction (0.017) or percentage (1.7); both formats are accepted. */
  ctr?: number | null;
  cpa?: number | null;
  mismatch?: boolean;
  matchLevel?: string;
  matchedProduct?: string;
};

export type CpaPurchasesTrendProps = {
  data: readonly AdsDailyChartPoint[];
  height?: number;
  ariaLabel?: string;
};

export type DailyRoasProps = {
  data: readonly AdsDailyChartPoint[];
  targetRoas?: number;
  height?: number;
  ariaLabel?: string;
};

export type BudgetAllocationProps = {
  data: readonly AdsAllocationPoint[];
  height?: number;
  ariaLabel?: string;
};

export type AdSetRoasProps = {
  data: readonly AdsAdSetPoint[];
  targetRoas?: number;
  maxItems?: number;
  height?: number;
  ariaLabel?: string;
};

export type WeekdayProps = {
  data: readonly AdsDailyChartPoint[];
  targetRoas?: number;
  height?: number;
  ariaLabel?: string;
};

export type CreativeDiagnosticProps = {
  data: readonly AdsCreativePoint[];
  targetRoas?: number;
  maxItems?: number;
  height?: number;
  ariaLabel?: string;
};

type TooltipItem = {
  dataIndex?: number;
  marker?: string;
  seriesName?: string;
  value?: unknown;
};

function firstTooltipItem(params: unknown): TooltipItem {
  const candidate = Array.isArray(params) ? params[0] : params;
  return candidate && typeof candidate === "object" ? (candidate as TooltipItem) : {};
}

function tooltipItems(params: unknown): TooltipItem[] {
  const candidates = Array.isArray(params) ? params : [params];
  return candidates.filter(
    (candidate): candidate is TooltipItem => Boolean(candidate) && typeof candidate === "object",
  );
}

function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nonNegative(value: number | null | undefined): number {
  const parsed = finite(value);
  return parsed === null ? 0 : Math.max(0, parsed);
}

function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatMoney(value: number, compact = false): string {
  const absolute = Math.abs(value);
  if (compact && absolute >= 1_000_000) return `$${formatNumber(value / 1_000_000, 1)}M`;
  if (compact && absolute >= 1_000) return `$${formatNumber(value / 1_000, 1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: absolute < 100 ? 2 : 0,
    maximumFractionDigits: absolute < 100 ? 2 : 0,
  }).format(value);
}

function formatRoas(value: number): string {
  return `${formatNumber(value, 2)}x`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return replacements[character] ?? character;
  });
}

function shortLabel(value: string, length = 24): string {
  const clean = value.trim() || "Unlabeled";
  return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
}

function pointLabel(point: { key?: string; name?: string; campaign?: string }): string {
  return point.name?.trim() || point.campaign?.trim() || point.key?.trim() || "Unlabeled";
}

function adSetLabel(point: AdsAdSetPoint): string {
  return point.name?.trim() || point.adSet?.trim() || point.key?.trim() || "Unlabeled ad set";
}

function creativeLabel(point: AdsCreativePoint): string {
  return point.name?.trim() || point.ad?.trim() || point.key?.trim() || "Unlabeled creative";
}

function shortDate(value: string): string {
  const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[2]}/${iso[3]}` : shortLabel(value, 10);
}

function utcWeekday(value: string): number | null {
  const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!iso) return null;
  const year = Number(iso[1]);
  const month = Number(iso[2]);
  const day = Number(iso[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return (date.getUTCDay() + 6) % 7;
}

function tooltipShell(title: string, lines: readonly string[]): string {
  return [
    `<strong>${escapeHtml(title)}</strong>`,
    ...lines,
  ].join("<br/>");
}

const ChartEmpty = memo(function ChartEmpty({
  message,
  height,
  ariaLabel,
}: {
  message: string;
  height: number;
  ariaLabel: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${ariaLabel}. ${message}`}
      className="grid min-w-0 place-items-center rounded-xl border border-dashed bg-muted/20 px-5 text-center text-sm text-muted-foreground"
      style={{ height }}
    >
      {message}
    </div>
  );
});

const ChartSurface = memo(function ChartSurface({
  option,
  height,
  ariaLabel,
  fallback,
}: {
  option: EChartsOption;
  height: number;
  ariaLabel: string;
  fallback?: ReactNode;
}) {
  return (
    <div role="img" aria-label={ariaLabel} className="min-w-0" style={{ height }}>
      {fallback ?? (
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
          notMerge
          lazyUpdate
        />
      )}
    </div>
  );
});

export const CpaPurchasesTrend = memo(function CpaPurchasesTrend({
  data,
  height = 300,
  ariaLabel = "Daily cost per acquisition and purchases trend",
}: CpaPurchasesTrendProps) {
  const rows = useMemo(
    () =>
      data
        .filter((point) => point.date.trim())
        .map((point) => {
          const purchases = finite(point.purchases);
          const spend = finite(point.spend);
          const explicitCpa = finite(point.cpa);
          const cpa =
            explicitCpa ??
            (spend !== null && purchases !== null && purchases > 0 ? spend / purchases : null);
          return { ...point, purchases, cpa };
        }),
    [data],
  );
  const hasData = rows.some((row) => row.purchases !== null || row.cpa !== null);

  const option = useMemo<EChartsOption>(
    () => ({
      animation: false,
      color: [greenSoft, blue],
      tooltip: {
        trigger: "axis",
        confine: true,
        borderColor: border,
        backgroundColor: "#ffffff",
        textStyle: { color: chartText, fontFamily },
        formatter: (params) => {
          const items = tooltipItems(params);
          const row = rows[items[0]?.dataIndex ?? -1];
          if (!row) return "";
          const lines = items.map((item) => {
            const marker = item.marker ?? "";
            return item.seriesName === "CPA"
              ? `${marker} CPA: ${row.cpa === null ? "—" : formatMoney(row.cpa)}`
              : `${marker} Purchases: ${row.purchases === null ? "—" : formatNumber(row.purchases)}`;
          });
          return tooltipShell(row.date, lines);
        },
      },
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: mutedText, fontFamily },
      },
      grid: { left: 46, right: 54, top: 38, bottom: 38, containLabel: false },
      xAxis: {
        type: "category",
        data: rows.map((row) => shortDate(row.date)),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: border } },
        axisLabel: { color: mutedText, fontFamily, hideOverlap: true },
      },
      yAxis: [
        {
          type: "value",
          minInterval: 1,
          axisLabel: { color: mutedText, fontFamily, formatter: (value: number) => formatNumber(value) },
          splitLine: { lineStyle: { color: gridLine } },
        },
        {
          type: "value",
          axisLabel: { color: mutedText, fontFamily, formatter: (value: number) => formatMoney(value, true) },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "Purchases",
          type: "bar",
          data: rows.map((row) => row.purchases),
          barMaxWidth: 20,
          itemStyle: { color: greenSoft, borderRadius: [5, 5, 0, 0] },
        },
        {
          name: "CPA",
          type: "line",
          yAxisIndex: 1,
          connectNulls: false,
          smooth: 0.25,
          symbolSize: 7,
          data: rows.map((row) => row.cpa),
          lineStyle: { color: blue, width: 3 },
          itemStyle: { color: blue, borderColor: "#ffffff", borderWidth: 2 },
        },
      ],
      aria: { enabled: false },
    }),
    [rows],
  );

  if (!hasData) {
    return <ChartEmpty message="No purchase or CPA data in this date range." height={height} ariaLabel={ariaLabel} />;
  }
  return <ChartSurface option={option} height={height} ariaLabel={ariaLabel} />;
});

CpaPurchasesTrend.displayName = "CpaPurchasesTrend";

export const DailyRoas = memo(function DailyRoas({
  data,
  targetRoas = 2,
  height = 300,
  ariaLabel = "Daily return on ad spend trend",
}: DailyRoasProps) {
  const rows = useMemo(
    () =>
      data
        .filter((point) => point.date.trim())
        .map((point) => ({ ...point, roas: finite(point.roas) })),
    [data],
  );
  const hasData = rows.some((row) => row.roas !== null);
  const safeTarget = Math.max(0, finite(targetRoas) ?? 2);

  const option = useMemo<EChartsOption>(
    () => ({
      animation: false,
      tooltip: {
        trigger: "axis",
        confine: true,
        valueFormatter: (value) => (value === null || value === undefined ? "—" : formatRoas(Number(value))),
        borderColor: border,
        backgroundColor: "#ffffff",
        textStyle: { color: chartText, fontFamily },
      },
      grid: { left: 46, right: 18, top: 28, bottom: 38 },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: rows.map((row) => shortDate(row.date)),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: border } },
        axisLabel: { color: mutedText, fontFamily, hideOverlap: true },
      },
      yAxis: {
        type: "value",
        min: 0,
        axisLabel: { color: mutedText, fontFamily, formatter: (value: number) => formatRoas(value) },
        splitLine: { lineStyle: { color: gridLine } },
      },
      series: [
        {
          name: "ROAS",
          type: "line",
          connectNulls: false,
          smooth: 0.25,
          symbolSize: 7,
          data: rows.map((row) => row.roas),
          lineStyle: { color: green, width: 3 },
          itemStyle: { color: green, borderColor: "#ffffff", borderWidth: 2 },
          areaStyle: { color: "rgba(21, 95, 66, 0.08)" },
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: amber, type: "dashed", width: 2 },
            label: {
              color: amber,
              fontFamily,
              formatter: `Target ${formatRoas(safeTarget)}`,
              position: "insideEndTop",
            },
            data: [{ yAxis: safeTarget }],
          },
        },
      ],
      aria: { enabled: false },
    }),
    [rows, safeTarget],
  );

  if (!hasData) {
    return <ChartEmpty message="No ROAS data in this date range." height={height} ariaLabel={ariaLabel} />;
  }
  return <ChartSurface option={option} height={height} ariaLabel={ariaLabel} />;
});

DailyRoas.displayName = "DailyRoas";

type AllocationRow = {
  key: string;
  label: string;
  spend: number;
  purchaseValue: number;
  spendShare: number;
  valueShare: number;
};

function allocationRows(data: readonly AdsAllocationPoint[]): AllocationRow[] {
  const aggregated = new Map<string, { key: string; label: string; spend: number; purchaseValue: number }>();
  for (const point of data) {
    const label = pointLabel(point);
    const key = point.key?.trim() || label;
    const current = aggregated.get(key) ?? { key, label, spend: 0, purchaseValue: 0 };
    current.spend += nonNegative(point.spend);
    current.purchaseValue += nonNegative(point.purchaseValue);
    aggregated.set(key, current);
  }

  const sorted = [...aggregated.values()]
    .filter((row) => row.spend > 0 || row.purchaseValue > 0)
    .sort((a, b) => b.spend - a.spend || b.purchaseValue - a.purchaseValue || a.label.localeCompare(b.label));
  const totalSpend = sorted.reduce((sum, row) => sum + row.spend, 0);
  const totalValue = sorted.reduce((sum, row) => sum + row.purchaseValue, 0);
  return sorted.map((row) => ({
    ...row,
    spendShare: totalSpend > 0 ? (row.spend / totalSpend) * 100 : 0,
    valueShare: totalValue > 0 ? (row.purchaseValue / totalValue) * 100 : 0,
  }));
}

export const BudgetAllocation = memo(function BudgetAllocation({
  data,
  height = 320,
  ariaLabel = "Budget allocation for every campaign compared with purchase value contribution",
}: BudgetAllocationProps) {
  const rows = useMemo(() => allocationRows(data), [data]);
  const hasData = rows.length > 0;
  const resolvedHeight = Math.max(height, 88 + rows.length * 32);

  const option = useMemo<EChartsOption>(
    () => ({
      animation: false,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        confine: true,
        borderColor: border,
        backgroundColor: "#ffffff",
        textStyle: { color: chartText, fontFamily },
        formatter: (params) => {
          const item = firstTooltipItem(params);
          const row = rows[item.dataIndex ?? -1];
          if (!row) return "";
          return tooltipShell(row.label, [
            `Spend: ${formatMoney(row.spend)} (${formatNumber(row.spendShare, 1)}%)`,
            `Purchase value: ${formatMoney(row.purchaseValue)} (${formatNumber(row.valueShare, 1)}%)`,
          ]);
        },
      },
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: mutedText, fontFamily },
      },
      grid: { left: 154, right: 18, top: 38, bottom: 28 },
      xAxis: {
        type: "value",
        max: 100,
        axisLabel: { color: mutedText, fontFamily, formatter: (value: number) => `${formatNumber(value)}%` },
        splitLine: { lineStyle: { color: gridLine } },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: rows.map((row) => row.label),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: chartText, fontFamily, fontWeight: 600, width: 142, overflow: "truncate" },
      },
      series: [
        {
          name: "Spend share",
          type: "bar",
          data: rows.map((row) => row.spendShare),
          barMaxWidth: 12,
          itemStyle: { color: green, borderRadius: [0, 5, 5, 0] },
        },
        {
          name: "Value share",
          type: "bar",
          data: rows.map((row) => row.valueShare),
          barMaxWidth: 12,
          itemStyle: { color: greenSoft, borderColor: green, borderWidth: 1, borderRadius: [0, 5, 5, 0] },
        },
      ],
      aria: { enabled: false },
    }),
    [rows],
  );

  if (!hasData) {
    return <ChartEmpty message="No campaign spend is available for allocation." height={height} ariaLabel={ariaLabel} />;
  }
  return <ChartSurface option={option} height={resolvedHeight} ariaLabel={ariaLabel} />;
});

BudgetAllocation.displayName = "BudgetAllocation";

type AdSetChartRow = {
  label: string;
  campaign: string;
  spend: number;
  purchases: number | null;
  roas: number;
};

function adSetRows(data: readonly AdsAdSetPoint[], maxItems: number): AdSetChartRow[] {
  return data
    .map((point) => {
      const spend = nonNegative(point.spend);
      const purchaseValue = finite(point.purchaseValue);
      const explicitRoas = finite(point.roas);
      const roas = explicitRoas ?? (purchaseValue !== null && spend > 0 ? purchaseValue / spend : null);
      return {
        label: adSetLabel(point),
        campaign: point.campaign?.trim() || "Unlabeled campaign",
        spend,
        purchases: finite(point.purchases),
        roas,
      };
    })
    .filter((row): row is AdSetChartRow => row.spend > 0 && row.roas !== null)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, Math.max(1, Math.floor(maxItems)));
}

export const AdSetRoas = memo(function AdSetRoas({
  data,
  targetRoas = 2,
  maxItems = 8,
  height = 340,
  ariaLabel = "Return on ad spend by ad set",
}: AdSetRoasProps) {
  const rows = useMemo(() => adSetRows(data, maxItems), [data, maxItems]);
  const safeTarget = Math.max(0, finite(targetRoas) ?? 2);

  const option = useMemo<EChartsOption>(
    () => ({
      animation: false,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        confine: true,
        borderColor: border,
        backgroundColor: "#ffffff",
        textStyle: { color: chartText, fontFamily },
        formatter: (params) => {
          const item = firstTooltipItem(params);
          const row = rows[item.dataIndex ?? -1];
          if (!row) return "";
          return tooltipShell(row.label, [
            `Campaign: ${escapeHtml(row.campaign)}`,
            `ROAS: ${formatRoas(row.roas)}`,
            `Spend: ${formatMoney(row.spend)}`,
            `Purchases: ${row.purchases === null ? "—" : formatNumber(row.purchases)}`,
          ]);
        },
      },
      grid: { left: 128, right: 30, top: 20, bottom: 28 },
      xAxis: {
        type: "value",
        min: 0,
        axisLabel: { color: mutedText, fontFamily, formatter: (value: number) => formatRoas(value) },
        splitLine: { lineStyle: { color: gridLine } },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: rows.map((row) => shortLabel(row.label, 20)),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: chartText, fontFamily, fontWeight: 600 },
      },
      series: [
        {
          name: "ROAS",
          type: "bar",
          barMaxWidth: 18,
          data: rows.map((row) => ({
            value: row.roas,
            itemStyle: {
              color: row.roas >= safeTarget ? green : row.roas >= safeTarget * 0.75 ? amber : red,
              borderRadius: [0, 6, 6, 0],
            },
          })),
          label: {
            show: true,
            position: "right",
            color: chartText,
            fontFamily,
            fontWeight: 700,
            formatter: (params) => formatRoas(Number(params.value)),
          },
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: amber, type: "dashed", width: 2 },
            label: { color: amber, fontFamily, formatter: `Target ${formatRoas(safeTarget)}`, position: "insideEndTop" },
            data: [{ xAxis: safeTarget }],
          },
        },
      ],
      aria: { enabled: false },
    }),
    [rows, safeTarget],
  );

  if (rows.length === 0) {
    return <ChartEmpty message="No ad-set ROAS data is available." height={height} ariaLabel={ariaLabel} />;
  }
  return <ChartSurface option={option} height={height} ariaLabel={ariaLabel} />;
});

AdSetRoas.displayName = "AdSetRoas";

type WeekdayRow = {
  label: string;
  spend: number;
  purchaseValue: number;
  purchases: number;
  roas: number | null;
  observations: number;
};

function weekdayRows(data: readonly AdsDailyChartPoint[]): WeekdayRow[] {
  const labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const rows = labels.map((label) => ({
    label,
    spend: 0,
    purchaseValue: 0,
    purchases: 0,
    roas: null as number | null,
    observations: 0,
  }));
  for (const point of data) {
    const weekday = utcWeekday(point.date);
    if (weekday === null) continue;
    const spend = finite(point.spend);
    const purchases = finite(point.purchases);
    const explicitValue = finite(point.purchaseValue);
    const roas = finite(point.roas);
    const purchaseValue = explicitValue ?? (spend !== null && roas !== null ? spend * roas : null);
    if (spend === null && purchases === null && purchaseValue === null) continue;
    rows[weekday].spend += Math.max(0, spend ?? 0);
    rows[weekday].purchases += Math.max(0, purchases ?? 0);
    rows[weekday].purchaseValue += Math.max(0, purchaseValue ?? 0);
    rows[weekday].observations += 1;
  }
  for (const row of rows) {
    row.roas = row.spend > 0 ? row.purchaseValue / row.spend : null;
  }
  return rows;
}

export const Weekday = memo(function Weekday({
  data,
  targetRoas = 2,
  height = 300,
  ariaLabel = "Purchases and return on ad spend by weekday",
}: WeekdayProps) {
  const rows = useMemo(() => weekdayRows(data), [data]);
  const hasData = rows.some((row) => row.observations > 0);
  const safeTarget = Math.max(0, finite(targetRoas) ?? 2);

  const option = useMemo<EChartsOption>(
    () => ({
      animation: false,
      tooltip: {
        trigger: "axis",
        confine: true,
        borderColor: border,
        backgroundColor: "#ffffff",
        textStyle: { color: chartText, fontFamily },
        formatter: (params) => {
          const item = firstTooltipItem(params);
          const row = rows[item.dataIndex ?? -1];
          if (!row) return "";
          return tooltipShell(row.label, [
            `Purchases: ${formatNumber(row.purchases)}`,
            `ROAS: ${row.roas === null ? "—" : formatRoas(row.roas)}`,
            `Spend: ${formatMoney(row.spend)}`,
          ]);
        },
      },
      legend: { top: 0, right: 0, textStyle: { color: mutedText, fontFamily } },
      grid: { left: 46, right: 52, top: 38, bottom: 38 },
      xAxis: {
        type: "category",
        data: rows.map((row) => row.label.slice(0, 3)),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: border } },
        axisLabel: { color: mutedText, fontFamily },
      },
      yAxis: [
        {
          type: "value",
          minInterval: 1,
          axisLabel: { color: mutedText, fontFamily, formatter: (value: number) => formatNumber(value) },
          splitLine: { lineStyle: { color: gridLine } },
        },
        {
          type: "value",
          min: 0,
          axisLabel: { color: mutedText, fontFamily, formatter: (value: number) => formatRoas(value) },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "Purchases",
          type: "bar",
          data: rows.map((row) => (row.observations > 0 ? row.purchases : null)),
          barMaxWidth: 24,
          itemStyle: { color: greenSoft, borderRadius: [5, 5, 0, 0] },
        },
        {
          name: "ROAS",
          type: "line",
          yAxisIndex: 1,
          connectNulls: false,
          symbolSize: 7,
          data: rows.map((row) => row.roas),
          lineStyle: { color: green, width: 3 },
          itemStyle: { color: green, borderColor: "#ffffff", borderWidth: 2 },
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: amber, type: "dashed", width: 2 },
            label: { color: amber, fontFamily, formatter: `Target ${formatRoas(safeTarget)}`, position: "insideEndTop" },
            data: [{ yAxis: safeTarget }],
          },
        },
      ],
      aria: { enabled: false },
    }),
    [rows, safeTarget],
  );

  if (!hasData) {
    return <ChartEmpty message="No dated ad performance is available for weekday analysis." height={height} ariaLabel={ariaLabel} />;
  }
  return <ChartSurface option={option} height={height} ariaLabel={ariaLabel} />;
});

Weekday.displayName = "Weekday";

type CreativeChartRow = {
  label: string;
  campaign: string;
  adSet: string;
  spend: number;
  purchases: number | null;
  ctrPercent: number;
  roas: number;
  mismatch: boolean;
  matchLevel: string;
  matchedProduct: string;
};

function creativeRows(data: readonly AdsCreativePoint[], maxItems: number): CreativeChartRow[] {
  return data
    .map((point) => {
      const ctr = finite(point.ctr);
      const roas = finite(point.roas);
      const level = point.matchLevel?.trim() || "Unverified";
      const normalizedLevel = level.toLowerCase();
      return {
        label: creativeLabel(point),
        campaign: point.campaign?.trim() || "Unlabeled campaign",
        adSet: point.adSet?.trim() || "Unlabeled ad set",
        spend: nonNegative(point.spend),
        purchases: finite(point.purchases),
        ctrPercent: ctr === null ? null : Math.abs(ctr) <= 1 ? ctr * 100 : ctr,
        roas,
        mismatch:
          point.mismatch === true ||
          normalizedLevel === "low" ||
          normalizedLevel === "review" ||
          normalizedLevel === "unmapped",
        matchLevel: level,
        matchedProduct: point.matchedProduct?.trim() || "Not mapped",
      };
    })
    .filter(
      (row): row is CreativeChartRow =>
        row.spend > 0 && row.ctrPercent !== null && row.ctrPercent >= 0 && row.roas !== null && row.roas >= 0,
    )
    .sort((a, b) => b.spend - a.spend)
    .slice(0, Math.max(1, Math.floor(maxItems)));
}

export const CreativeDiagnostic = memo(function CreativeDiagnostic({
  data,
  targetRoas = 2,
  maxItems = 30,
  height = 360,
  ariaLabel = "Creative performance diagnostic comparing click-through rate, return on ad spend, and spend",
}: CreativeDiagnosticProps) {
  const rows = useMemo(() => creativeRows(data, maxItems), [data, maxItems]);
  const aligned = useMemo(() => rows.filter((row) => !row.mismatch), [rows]);
  const mismatched = useMemo(() => rows.filter((row) => row.mismatch), [rows]);
  const safeTarget = Math.max(0, finite(targetRoas) ?? 2);

  const option = useMemo<EChartsOption>(
    () => ({
      animation: false,
      tooltip: {
        trigger: "item",
        confine: true,
        borderColor: border,
        backgroundColor: "#ffffff",
        textStyle: { color: chartText, fontFamily },
        formatter: (params) => {
          const item = firstTooltipItem(params);
          const source = item.seriesName === "Needs review" ? mismatched : aligned;
          const row = source[item.dataIndex ?? -1];
          if (!row) return "";
          return tooltipShell(row.label, [
            `Campaign: ${escapeHtml(row.campaign)}`,
            `Ad set: ${escapeHtml(row.adSet)}`,
            `CTR: ${formatNumber(row.ctrPercent, 2)}%`,
            `ROAS: ${formatRoas(row.roas)}`,
            `Spend: ${formatMoney(row.spend)}`,
            `Purchases: ${row.purchases === null ? "—" : formatNumber(row.purchases)}`,
            `Product match: ${escapeHtml(row.matchLevel)} · ${escapeHtml(row.matchedProduct)}`,
          ]);
        },
      },
      legend: { top: 0, right: 0, textStyle: { color: mutedText, fontFamily } },
      grid: { left: 52, right: 24, top: 42, bottom: 48 },
      xAxis: {
        type: "value",
        min: 0,
        name: "CTR",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: { color: mutedText, fontFamily },
        axisLabel: { color: mutedText, fontFamily, formatter: (value: number) => `${formatNumber(value, 1)}%` },
        splitLine: { lineStyle: { color: gridLine } },
      },
      yAxis: {
        type: "value",
        min: 0,
        name: "ROAS",
        nameTextStyle: { color: mutedText, fontFamily },
        axisLabel: { color: mutedText, fontFamily, formatter: (value: number) => formatRoas(value) },
        splitLine: { lineStyle: { color: gridLine } },
      },
      series: [
        {
          name: "Aligned / unverified",
          type: "scatter",
          data: aligned.map((row) => [row.ctrPercent, row.roas, row.spend]),
          symbolSize: (value) => {
            const tuple = Array.isArray(value) ? value : [];
            return Math.min(48, Math.max(12, Math.sqrt(nonNegative(Number(tuple[2]))) * 1.8));
          },
          itemStyle: { color: green, opacity: 0.78, borderColor: "#ffffff", borderWidth: 1 },
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: amber, type: "dashed", width: 2 },
            label: { color: amber, fontFamily, formatter: `Target ${formatRoas(safeTarget)}`, position: "insideEndTop" },
            data: [{ yAxis: safeTarget }],
          },
        },
        {
          name: "Needs review",
          type: "scatter",
          data: mismatched.map((row) => [row.ctrPercent, row.roas, row.spend]),
          symbol: "diamond",
          symbolSize: (value) => {
            const tuple = Array.isArray(value) ? value : [];
            return Math.min(48, Math.max(13, Math.sqrt(nonNegative(Number(tuple[2]))) * 1.8));
          },
          itemStyle: { color: red, opacity: 0.82, borderColor: "#ffffff", borderWidth: 1 },
        },
      ],
      aria: { enabled: false },
    }),
    [aligned, mismatched, safeTarget],
  );

  if (rows.length === 0) {
    return <ChartEmpty message="No creative CTR and ROAS pairs are available." height={height} ariaLabel={ariaLabel} />;
  }
  return <ChartSurface option={option} height={height} ariaLabel={ariaLabel} />;
});

CreativeDiagnostic.displayName = "CreativeDiagnostic";

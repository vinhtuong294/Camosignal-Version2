"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { money, number, rawPercent } from "@/lib/analytics";
import type { AdsDailyStoryPoint } from "@/lib/ads-storyboard";
import type { MetaAdsGroup, MetaAdsRow, MetaAdsSummary } from "@/lib/meta-ads-import";
import type { DailyPoint, ProductPoint } from "@/lib/types";

const chartText = "#111827";
const mutedText = "#647064";
const green = "#155f42";
const greenSoft = "#dceee4";
const amber = "#b87912";
const red = "#b42318";

function commonGrid() {
  return {
    left: 42,
    right: 18,
    top: 28,
    bottom: 36,
  };
}

function chartEmpty(message: string, height = 300) {
  return (
    <div
      className="grid place-items-center rounded-xl border border-dashed bg-muted/20 px-4 text-center text-sm text-muted-foreground"
      style={{ height }}
    >
      {message}
    </div>
  );
}

function adsDateKey(value: string): string {
  const raw = value.trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slash) {
    const first = Number(slash[1]);
    const second = Number(slash[2]);
    const year = Number(slash[3]);
    const dayFirst = first > 12 && second <= 12;
    const month = dayFirst ? second : first;
    const day = dayFirst ? first : second;
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      candidate.getUTCFullYear() === year &&
      candidate.getUTCMonth() === month - 1 &&
      candidate.getUTCDate() === day
    ) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return raw;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}

function compactCurrencyAxis(value: number): string {
  if (Math.abs(value) >= 1000) {
    const scaled = value / 1000;
    return `$${number(scaled, Math.abs(scaled) < 10 ? 1 : 0)}K`;
  }
  return money(value, "USD", true);
}

export function RevenueTrendChart({ data }: { data: DailyPoint[] }) {
  const option: EChartsOption = {
    animationDuration: 650,
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => money(Number(value), "USD", false),
      borderColor: "#d9e2d8",
      backgroundColor: "#ffffff",
      textStyle: { color: chartText, fontFamily: "Roboto, sans-serif" },
    },
    grid: commonGrid(),
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((point) => point.date.slice(5)),
      axisLabel: { color: mutedText, fontFamily: "Roboto, sans-serif" },
      axisLine: { lineStyle: { color: "#d9e2d8" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: mutedText,
        formatter: (value: number) => money(value, "USD", true),
        fontFamily: "Roboto, sans-serif",
      },
      splitLine: { lineStyle: { color: "#edf2ed" } },
    },
    series: [
      {
        name: "Net sales",
        type: "line",
        smooth: true,
        symbolSize: 7,
        lineStyle: { color: green, width: 3 },
        itemStyle: { color: green, borderColor: "#ffffff", borderWidth: 2 },
        areaStyle: { color: "rgba(21, 95, 66, 0.08)" },
        data: data.map((point) => point.netSales),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 280, width: "100%" }} notMerge lazyUpdate />;
}

export function CalendarHeatmap({ data }: { data: DailyPoint[] }) {
  const max = Math.max(...data.map((point) => point.netSales), 1);
  const option: EChartsOption = {
    animationDuration: 500,
    tooltip: {
      formatter: (params) => {
        const item = Array.isArray(params) ? params[0] : params;
        const tuple = Array.isArray(item.value) ? item.value : [];
        const value = Number(tuple[1]) || 0;
        const date = String(tuple[0] || "");
        const row = data.find((point) => point.date === date);
        return `<strong>${date}</strong><br/>Revenue: ${money(value)}<br/>Orders: ${number(row?.orders || 0)}`;
      },
      borderColor: "#d9e2d8",
      backgroundColor: "#ffffff",
      textStyle: { color: chartText, fontFamily: "Roboto, sans-serif" },
    },
    visualMap: {
      min: 0,
      max,
      show: false,
      inRange: {
        color: ["#f6faf7", greenSoft, "#8ec2a3", green],
      },
    },
    calendar: {
      top: 24,
      left: 18,
      right: 18,
      bottom: 8,
      cellSize: ["auto", 48],
      range: [data[0]?.date || "2026-06-03", data[data.length - 1]?.date || "2026-06-16"],
      itemStyle: { borderColor: "#ffffff", borderWidth: 3, borderRadius: 8 },
      dayLabel: { color: mutedText, fontFamily: "Roboto, sans-serif" },
      monthLabel: { color: mutedText, fontFamily: "Roboto, sans-serif" },
      yearLabel: { show: false },
    },
    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: data.map((point) => [point.date, point.netSales]),
        label: {
          show: true,
          formatter: (params) => {
            const item = Array.isArray(params) ? params[0] : params;
            const tuple = Array.isArray(item.value) ? item.value : [];
            const value = Number(tuple[1]) || 0;
            return money(value, "USD", true);
          },
          color: chartText,
          fontWeight: 700,
          fontFamily: "Roboto, sans-serif",
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 220, width: "100%" }} notMerge lazyUpdate />;
}

export function ProductTypeBars({
  data,
}: {
  data: { label: string; revenue: number; orders: number; products: number }[];
}) {
  const option: EChartsOption = {
    animationDuration: 600,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const item = Array.isArray(params) ? params[0] : params;
        const row = data[item?.dataIndex || 0];
        return `<strong>${row.label}</strong><br/>Revenue: ${money(row.revenue)}<br/>Orders: ${number(row.orders)}<br/>Products: ${number(row.products)}`;
      },
      borderColor: "#d9e2d8",
      backgroundColor: "#ffffff",
      textStyle: { color: chartText, fontFamily: "Roboto, sans-serif" },
    },
    grid: { left: 120, right: 20, top: 12, bottom: 20 },
    xAxis: {
      type: "value",
      axisLabel: { color: mutedText, formatter: (value: number) => money(value, "USD", true) },
      splitLine: { lineStyle: { color: "#edf2ed" } },
    },
    yAxis: {
      type: "category",
      data: data.map((row) => row.label),
      axisLabel: { color: chartText, fontFamily: "Roboto, sans-serif", fontWeight: 700 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        name: "Revenue",
        data: data.map((row) => row.revenue),
        barWidth: 18,
        itemStyle: { color: green, borderRadius: [0, 8, 8, 0] },
        label: {
          show: true,
          position: "right",
          formatter: (params) => money(Number(params.value), "USD", true),
          color: chartText,
          fontFamily: "Roboto, sans-serif",
          fontWeight: 700,
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 250, width: "100%" }} notMerge lazyUpdate />;
}

export function ProductMiniTrend({
  product,
  height = 66,
  showSymbols = false,
}: {
  product: ProductPoint;
  height?: number;
  showSymbols?: boolean;
}) {
  const option: EChartsOption = {
    animation: false,
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => money(Number(value)),
      borderColor: "#d9e2d8",
      backgroundColor: "#ffffff",
      textStyle: { color: chartText, fontFamily: "Roboto, sans-serif" },
    },
    grid: { left: showSymbols ? 36 : 4, right: showSymbols ? 18 : 4, top: 12, bottom: showSymbols ? 28 : 6 },
    xAxis: {
      type: "category",
      show: showSymbols,
      data: product.daily.map((row) => row.date.slice(5)),
      axisLabel: { color: mutedText, fontFamily: "Roboto, sans-serif" },
      axisLine: { lineStyle: { color: "#d9e2d8" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      show: showSymbols,
      axisLabel: {
        color: mutedText,
        formatter: (value: number) => money(value, "USD", true),
        fontFamily: "Roboto, sans-serif",
      },
      splitLine: { lineStyle: { color: "#edf2ed" } },
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: showSymbols ? "circle" : "none",
        symbolSize: showSymbols ? 7 : 0,
        lineStyle: { color: product.action === "fix" ? red : product.action === "watch" ? amber : green, width: 2 },
        areaStyle: { color: "rgba(21, 95, 66, 0.06)" },
        data: product.daily.map((row) => row.netSales),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height, width: "100%" }} notMerge lazyUpdate />;
}

export function MetaAdsSpendValueTrendChart({ rows }: { rows: MetaAdsRow[] }) {
  const daily = useMemo(() => {
    const byDate = new Map<string, { date: string; spend: number; purchaseValue: number }>();
    for (const row of rows) {
      const date = adsDateKey(row.date);
      const current = byDate.get(date) || { date, spend: 0, purchaseValue: 0 };
      current.spend += row.spend;
      current.purchaseValue += row.purchaseValue;
      byDate.set(date, current);
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);

  const option = useMemo<EChartsOption>(() => ({
    animationDuration: 650,
    color: [amber, green],
    legend: {
      top: 0,
      right: 8,
      data: ["Spend", "Purchase value"],
      textStyle: { color: mutedText, fontFamily: "Roboto, sans-serif" },
    },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => money(Number(value), "USD", false),
      borderColor: "#d9e2d8",
      backgroundColor: "#ffffff",
      textStyle: { color: chartText, fontFamily: "Roboto, sans-serif" },
    },
    grid: { left: 66, right: 18, top: 42, bottom: 42 },
    xAxis: {
      type: "category",
      data: daily.map((point) => point.date.slice(5)),
      axisLabel: { color: mutedText, fontFamily: "Roboto, sans-serif" },
      axisLine: { lineStyle: { color: "#d9e2d8" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: mutedText,
        formatter: compactCurrencyAxis,
        fontFamily: "Roboto, sans-serif",
      },
      splitLine: { lineStyle: { color: "#edf2ed" } },
    },
    series: [
      {
        name: "Spend",
        type: "bar",
        data: daily.map((point) => point.spend),
        barMaxWidth: 16,
        itemStyle: { color: amber, borderRadius: [5, 5, 0, 0] },
      },
      {
        name: "Purchase value",
        type: "line",
        data: daily.map((point) => point.purchaseValue),
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: green, width: 3 },
        itemStyle: { color: green, borderColor: "#ffffff", borderWidth: 2 },
        areaStyle: { color: "rgba(21, 95, 66, 0.06)" },
      },
    ],
  }), [daily]);

  if (!daily.length) return chartEmpty("No daily Ads data is available in this range.");
  return <ReactECharts option={option} style={{ height: 300, width: "100%" }} notMerge lazyUpdate />;
}

export function MetaAdsPerformanceStoryChart({
  data,
  targetRoas = 2,
}: {
  data: AdsDailyStoryPoint[];
  targetRoas?: number;
}) {
  const observed = useMemo(() => data.filter((point) => point.observed), [data]);
  const maxRoas = useMemo(
    () => Math.max(targetRoas * 1.5, ...observed.map((point) => point.roas || 0)),
    [observed, targetRoas],
  );
  const roasAxisMax = Math.max(1, Math.ceil(maxRoas * 2) / 2);
  const option = useMemo<EChartsOption>(() => ({
    animationDuration: 600,
    color: ["#064a31", "#c9e8d9", green],
    tooltip: {
      trigger: "axis",
      borderColor: "#dce3df",
      backgroundColor: "#ffffff",
      textStyle: { color: chartText, fontFamily: "Roboto, sans-serif", fontSize: 12 },
      formatter: (params) => {
        const items = Array.isArray(params) ? params : [params];
        const index = items[0]?.dataIndex || 0;
        const row = data[index];
        if (!row) return "";
        if (!row.observed) return `<strong>${escapeHtml(row.date)}</strong><br/>No source rows observed`;
        return [
          `<strong>${escapeHtml(row.date)}</strong>`,
          `Spend: ${money(row.spend || 0)}`,
          `Purchase value: ${money(row.purchaseValue || 0)}`,
          `Purchases: ${number(row.purchases || 0)}`,
          `ROAS: ${row.roas === null ? "No data" : number(row.roas, 2)}`,
        ].join("<br/>");
      },
    },
    grid: { left: 58, right: 50, top: 18, bottom: 40 },
    xAxis: {
      type: "category",
      data: data.map((point) => point.date.slice(5)),
      axisLine: { lineStyle: { color: "#dce3df" } },
      axisTick: { show: false },
      axisLabel: {
        color: mutedText,
        fontFamily: "Roboto, sans-serif",
        fontSize: 10,
        hideOverlap: true,
        interval: data.length <= 7 ? 0 : data.length <= 16 ? 1 : 4,
      },
    },
    yAxis: [
      {
        type: "value",
        min: 0,
        axisLabel: { color: mutedText, fontSize: 10, formatter: compactCurrencyAxis },
        splitLine: { lineStyle: { color: "#edf2ef" } },
      },
      {
        type: "value",
        min: 0,
        max: roasAxisMax,
        axisLabel: { color: mutedText, fontSize: 10, formatter: (value: number) => number(value, 1) },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Spend",
        type: "bar",
        data: data.map((point) => point.spend),
        barMaxWidth: 14,
        itemStyle: { color: "#064a31", borderRadius: [3, 3, 0, 0] },
      },
      {
        name: "Purchase value",
        type: "bar",
        data: data.map((point) => point.purchaseValue),
        barMaxWidth: 14,
        itemStyle: { color: "#c9e8d9", borderRadius: [3, 3, 0, 0] },
      },
      {
        name: "ROAS",
        type: "line",
        yAxisIndex: 1,
        data: data.map((point) => point.roas),
        smooth: 0.32,
        connectNulls: false,
        showSymbol: data.length <= 7,
        symbolSize: 6,
        lineStyle: { color: green, width: 2.5 },
        itemStyle: { color: green, borderColor: "#ffffff", borderWidth: 2 },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#5e7f70", type: "dashed", width: 1.5 },
          label: { show: false },
          data: [{ yAxis: targetRoas }],
        },
      },
    ],
  }), [data, roasAxisMax, targetRoas]);

  if (!observed.length) return chartEmpty("No daily Ads data is available in this range.", 270);
  return (
    <div role="img" aria-label={`Daily Meta Ads spend, purchase value, and ROAS with a ${number(targetRoas, 1)} ROAS benchmark`}>
      <ReactECharts option={option} style={{ height: 270, width: "100%" }} notMerge lazyUpdate />
    </div>
  );
}

export function MetaAdsFunnelChart({ summary }: { summary: MetaAdsSummary }) {
  const stages = useMemo(() => {
    const raw = [
      { name: "Impressions", value: summary.impressions },
      { name: "Link clicks", value: summary.linkClicks },
      { name: "Content views", value: summary.landingPageViews },
      { name: "Adds to cart", value: summary.addToCart },
      { name: "Checkouts", value: summary.initiateCheckout },
      { name: "Purchases", value: summary.purchases },
    ];
    return raw.map((stage, index) => ({
      ...stage,
      conversion: index === 0
        ? null
        : raw[index - 1].value > 0
          ? stage.value / raw[index - 1].value
          : null,
    }));
  }, [summary.addToCart, summary.impressions, summary.initiateCheckout, summary.landingPageViews, summary.linkClicks, summary.purchases]);

  const option = useMemo<EChartsOption>(() => ({
    animationDuration: 650,
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const item = Array.isArray(params) ? params[0] : params;
        const stage = stages[item?.dataIndex || 0];
        if (!stage) return "";
        const conversion = stage.conversion === null ? "Top of funnel" : `${rawPercent(stage.conversion)} from prior stage`;
        return `<strong>${escapeHtml(stage.name)}</strong><br/>Events: ${number(stage.value)}<br/>${conversion}`;
      },
      borderColor: "#d9e2d8",
      backgroundColor: "#ffffff",
      textStyle: { color: chartText, fontFamily: "Roboto, sans-serif" },
    },
    series: [
      {
        type: "funnel",
        left: "1%",
        top: 8,
        bottom: 8,
        width: "56%",
        min: 0,
        max: Math.max(stages[0]?.value || 0, 1),
        minSize: "22%",
        maxSize: "100%",
        sort: "none",
        gap: 4,
        label: {
          show: true,
          position: "right",
          color: chartText,
          fontFamily: "Roboto, sans-serif",
          fontWeight: 700,
          formatter: (params) => {
            const stage = stages[params.dataIndex || 0];
            if (!stage) return "";
            const conversion = stage.conversion === null ? "" : ` · ${rawPercent(stage.conversion)}`;
            return `${stage.name}\n${number(stage.value)}${conversion}`;
          },
        },
        labelLine: {
          show: true,
          length: 8,
          lineStyle: { color: "#aeb9ae" },
        },
        itemStyle: { borderColor: "#ffffff", borderWidth: 2, borderRadius: 7 },
        emphasis: { label: { fontSize: 13 } },
        data: stages.map((stage, index) => ({
          name: stage.name,
          value: stage.value,
          itemStyle: {
            color: [green, "#237a55", "#4f9a6e", "#78aa88", "#a99550", amber][index],
          },
        })),
      },
    ],
  }), [stages]);

  if (!summary.impressions && !summary.linkClicks && !summary.purchases) {
    return chartEmpty("No funnel events are available in this range.");
  }
  return <ReactECharts option={option} style={{ height: 320, width: "100%" }} notMerge lazyUpdate />;
}

export function MetaAdsCampaignEfficiencyChart({ data }: { data: MetaAdsGroup[] }) {
  const campaigns = useMemo(
    () => data.filter((row) => row.spend > 0).slice(0, 30),
    [data],
  );
  const maxPurchases = useMemo(
    () => Math.max(...campaigns.map((row) => row.purchases), 1),
    [campaigns],
  );

  const option = useMemo<EChartsOption>(() => ({
    animationDuration: 650,
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const item = Array.isArray(params) ? params[0] : params;
        const row = campaigns[item?.dataIndex || 0];
        if (!row) return "";
        return [
          `<strong>${escapeHtml(row.campaign)}</strong>`,
          `Spend: ${money(row.spend)}`,
          `Purchase value: ${money(row.purchaseValue)}`,
          `Purchases: ${number(row.purchases)}`,
          `ROAS: ${row.roas === null ? "No data" : number(row.roas, 2)}`,
        ].join("<br/>");
      },
      borderColor: "#d9e2d8",
      backgroundColor: "#ffffff",
      textStyle: { color: chartText, fontFamily: "Roboto, sans-serif" },
    },
    grid: { left: 68, right: 22, top: 20, bottom: 48 },
    xAxis: {
      type: "value",
      name: "Spend",
      nameLocation: "middle",
      nameGap: 32,
      nameTextStyle: { color: mutedText, fontFamily: "Roboto, sans-serif" },
      axisLabel: {
        color: mutedText,
        formatter: compactCurrencyAxis,
        fontFamily: "Roboto, sans-serif",
      },
      axisLine: { lineStyle: { color: "#d9e2d8" } },
      splitLine: { lineStyle: { color: "#edf2ed" } },
    },
    yAxis: {
      type: "value",
      name: "ROAS",
      nameLocation: "middle",
      nameGap: 44,
      nameTextStyle: { color: mutedText, fontFamily: "Roboto, sans-serif" },
      min: 0,
      axisLabel: { color: mutedText, fontFamily: "Roboto, sans-serif" },
      splitLine: { lineStyle: { color: "#edf2ed" } },
    },
    series: [
      {
        name: "Campaign",
        type: "scatter",
        data: campaigns.map((row) => ({
          name: row.campaign,
          value: [row.spend, row.roas || 0, row.purchases, row.purchaseValue],
          itemStyle: {
            color: (row.roas || 0) >= 2 ? green : (row.roas || 0) >= 1.5 ? amber : red,
            opacity: 0.82,
          },
        })),
        symbolSize: (value) => {
          const tuple = Array.isArray(value) ? value : [];
          const purchases = Math.max(0, Number(tuple[2]) || 0);
          return 10 + Math.sqrt(purchases / maxPurchases) * 24;
        },
        emphasis: { scale: 1.15 },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: green, type: "dashed", width: 2 },
          label: {
            show: true,
            position: "insideStartTop",
            formatter: "ROAS 2.0",
            color: green,
            fontFamily: "Roboto, sans-serif",
            fontWeight: 700,
          },
          data: [{ yAxis: 2 }],
        },
      },
    ],
  }), [campaigns, maxPurchases]);

  if (!campaigns.length) return chartEmpty("No campaign spend is available in this range.", 320);
  return <ReactECharts option={option} style={{ height: 320, width: "100%" }} notMerge lazyUpdate />;
}

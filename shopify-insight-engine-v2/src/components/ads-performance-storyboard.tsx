"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  FilterX,
  Info,
  RefreshCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { MetaAdsFunnelChart } from "@/components/charts";
import {
  AdSetRoas,
  BudgetAllocation,
  CpaPurchasesTrend,
  CreativeDiagnostic,
  DailyRoas,
  Weekday,
} from "@/components/ads-insight-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money, number, percent, rawPercent } from "@/lib/analytics";
import type { AdsStoryboardModel, AdsStoryAction, AdsStoryKpi } from "@/lib/ads-storyboard";

export type AdsSourceView = {
  state: "loading" | "live" | "manual" | "partial" | "missing" | "error";
  label: string;
  updatedAt: string;
  availableRange: string;
  totalRows: number;
  coverageShare: number;
  coverageLabel: string;
  confidence: "High" | "Medium" | "Low";
  confidenceDetail: string;
  trustedMappedSpendShare: number | null;
  warning: string;
};

export type AdsActionView = AdsStoryAction & {
  mappedProductTitle: string;
  mappingLabel: string;
  canOpenProduct: boolean;
};

type SourceControls = {
  syncing: boolean;
  hasManualRows: boolean;
  hasSheetRows: boolean;
  usingManual: boolean;
  hasManualMappings: boolean;
  onSync: () => void;
  onImport: () => void;
  onToggleSource: () => void;
  onClearFile: () => void;
  onResetMappings: () => void;
};

export type AdsScopeView = {
  allValue: string;
  campaign: string;
  adSet: string;
  ad: string;
  campaigns: string[];
  adSets: string[];
  ads: string[];
  onCampaignChange: (value: string) => void;
  onAdSetChange: (value: string) => void;
  onAdChange: (value: string) => void;
  onClear: () => void;
};

type AdsPerformanceStoryboardProps = {
  model: AdsStoryboardModel;
  source: AdsSourceView;
  actions: AdsActionView[];
  scope: AdsScopeView;
  sourceControls: SourceControls;
  onOpenProduct: (action: AdsActionView) => void;
};

function sourceTone(source: AdsSourceView) {
  if (source.state === "live") return "border-emerald-200 bg-emerald-50/80 text-emerald-950";
  if (source.state === "manual") return "border-sky-200 bg-sky-50/80 text-sky-950";
  if (source.state === "loading") return "border-slate-200 bg-white text-slate-900";
  if (source.state === "partial") return "border-amber-200 bg-amber-50/80 text-amber-950";
  if (source.state === "error") return "border-red-200 bg-red-50/80 text-red-950";
  return "border-slate-200 bg-slate-50 text-slate-900";
}

function SourceIcon({ state }: { state: AdsSourceView["state"] }) {
  if (state === "live" || state === "manual") return <CheckCircle2 className="size-4" />;
  if (state === "loading") return <Clock3 className="size-4 animate-pulse" />;
  return <AlertTriangle className="size-4" />;
}

function formatKpi(kpi: AdsStoryKpi): string {
  if (kpi.current === null) return "No data";
  if (kpi.key === "roas") return number(kpi.current, 2);
  return money(kpi.current);
}

function kpiDeltaTone(kpi: AdsStoryKpi): string {
  if (kpi.delta === null || kpi.delta === 0 || kpi.favorableWhen === "neutral") return "text-muted-foreground";
  const favorable = kpi.favorableWhen === "up" ? kpi.delta > 0 : kpi.delta < 0;
  return favorable ? "text-emerald-700" : "text-red-700";
}

function StoryKpiCard({ kpi, model }: { kpi: AdsStoryKpi; model: AdsStoryboardModel }) {
  const DeltaIcon = (kpi.delta || 0) < 0 ? ArrowDownRight : ArrowUpRight;
  const roasProgress = kpi.key === "roas" && kpi.current !== null
    ? Math.min(100, Math.max(0, (kpi.current / (model.targetRoas * 2)) * 100))
    : 0;

  return (
    <Card className="min-h-[132px] gap-2 py-4 shadow-none">
      <CardContent className="flex h-full flex-col px-4">
        <div className="text-sm font-bold text-foreground">{kpi.label}</div>
        <div className="mt-2 text-[clamp(1.55rem,2.2vw,2rem)] font-black leading-none tracking-[-0.035em] tabular-nums">
          {formatKpi(kpi)}
        </div>
        {kpi.key === "cpa" ? <div className="mt-2 text-[11px] text-muted-foreground">{number(model.currentSummary.purchases)} purchases in scope</div> : null}
        {kpi.key === "roas" ? (
          <div className="mt-auto pt-3">
            <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>vs {number(model.targetRoas, 2)} target</span>
              <span className={kpiDeltaTone(kpi)}>
                {model.comparisonAvailable && kpi.delta !== null ? percent(kpi.delta) : "No complete comparison"}
              </span>
            </div>
            <Progress value={roasProgress} aria-label={`ROAS ${formatKpi(kpi)} versus ${number(model.targetRoas, 2)} target`} />
            <div className="mt-1 text-center text-[9px] text-muted-foreground">Target {number(model.targetRoas, 2)}</div>
          </div>
        ) : (
          <div className={`mt-auto flex items-center gap-1.5 pt-4 text-xs font-bold ${kpiDeltaTone(kpi)}`}>
            {model.comparisonAvailable && kpi.delta !== null ? (
              <>
                <DeltaIcon className="size-4" />
                <span>{percent(kpi.delta)}</span>
                <span className="font-normal text-muted-foreground">vs prior period</span>
              </>
            ) : (
              <span className="font-normal">Prior-period comparison unavailable</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function eventTone(tone: AdsStoryboardModel["events"][number]["tone"]) {
  if (tone === "positive") return "border-emerald-200 text-emerald-800";
  if (tone === "negative") return "border-red-200 text-red-800";
  if (tone === "warning") return "border-amber-200 text-amber-800";
  return "border-slate-200 text-slate-700";
}

function actionTone(tone: AdsStoryAction["tone"]) {
  if (tone === "scale") return "bg-emerald-100 text-emerald-800";
  if (tone === "fix") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function confidenceTone(confidence: AdsActionView["confidence"]) {
  if (confidence === "High") return "text-emerald-700";
  if (confidence === "Medium") return "text-amber-700";
  return "text-muted-foreground";
}

function SourceDetails({ source, controls }: { source: AdsSourceView; controls: SourceControls }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
      {source.warning ? (
        <div className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
          <AlertTriangle className="mt-1 size-4 shrink-0" />
          <span>{source.warning}</span>
        </div>
      ) : null}
      <dl className="divide-y rounded-xl border bg-white px-4">
        <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted-foreground">Status</dt><dd className="font-bold">{source.label}</dd></div>
        <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted-foreground">Updated</dt><dd className="text-right font-bold">{source.updatedAt || "Not available"}</dd></div>
        <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted-foreground">Available range</dt><dd className="text-right font-bold">{source.availableRange}</dd></div>
        <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted-foreground">Usable rows</dt><dd className="font-bold tabular-nums">{number(source.totalRows)}</dd></div>
        <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted-foreground">Selected coverage</dt><dd className="font-bold">{source.coverageLabel}</dd></div>
        <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted-foreground">Data confidence</dt><dd className="font-bold">{source.confidence}</dd></div>
        <div className="flex items-center justify-between gap-4 py-3"><dt className="text-muted-foreground">Trusted mapped spend</dt><dd className="font-bold">{source.trustedMappedSpendShare === null ? "No spend" : rawPercent(source.trustedMappedSpendShare)}</dd></div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{source.confidenceDetail}</p>
      <div className="mt-5 grid gap-2">
        <Button type="button" onClick={controls.onSync} disabled={controls.syncing}>
          <RefreshCcw className={controls.syncing ? "animate-spin" : ""} data-icon="inline-start" />
          {controls.syncing ? "Syncing Google Sheet" : "Sync Google Sheet"}
        </Button>
        <Button type="button" variant="outline" onClick={controls.onImport}>
          <Upload data-icon="inline-start" />Import CSV/JSON
        </Button>
        {controls.hasManualRows && controls.hasSheetRows ? (
          <Button type="button" variant="outline" onClick={controls.onToggleSource}>
            <Database data-icon="inline-start" />{controls.usingManual ? "Use Google Sheet" : "Use uploaded file"}
          </Button>
        ) : null}
        {controls.hasManualRows ? (
          <Button type="button" variant="outline" onClick={controls.onClearFile}>
            <Trash2 data-icon="inline-start" />Clear uploaded file
          </Button>
        ) : null}
        {controls.hasManualMappings ? (
          <Button type="button" variant="outline" onClick={controls.onResetMappings}>Reset product mappings</Button>
        ) : null}
      </div>
    </div>
  );
}

function ScopeSelect({
  label,
  value,
  allValue,
  options,
  onChange,
}: {
  label: string;
  value: string;
  allValue: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
      {label}
      <Select value={value} onValueChange={(next) => { if (next) onChange(next); }}>
        <SelectTrigger className="h-9 w-full min-w-0 bg-white text-xs font-semibold normal-case tracking-normal">
          <SelectValue>{value === allValue ? `All ${label.toLowerCase()}` : value}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={allValue}>All {label.toLowerCase()}</SelectItem>
          {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}

export function AdsPerformanceStoryboard({
  model,
  source,
  actions,
  scope,
  sourceControls,
  onOpenProduct,
}: AdsPerformanceStoryboardProps) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AdsActionView | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);
  const [decisionLens, setDecisionLens] = useState("budget");
  const visibleActions = showAllActions ? actions : actions.slice(0, 3);
  const confidenceCopy = useMemo(() => {
    const coverage = model.currentCoverage;
    return `${number(coverage.observedDays)} of ${number(coverage.totalDays)} selected days observed. ${source.confidenceDetail}`;
  }, [model.currentCoverage, source.confidenceDetail]);
  const observedDaily = useMemo(() => model.daily.filter((point) => point.observed), [model.daily]);
  const latestDaily = observedDaily.at(-1);
  const daysBelowTarget = useMemo(
    () => observedDaily.filter((point) => point.roas !== null && point.roas < model.targetRoas).length,
    [model.targetRoas, observedDaily],
  );
  const creativeChartData = useMemo(() => model.creativeDiagnostics.map((item) => ({
    key: item.key,
    name: item.label,
    campaign: item.campaign,
    adSet: item.adSet,
    spend: item.spend,
    purchases: item.purchases,
    roas: item.roas,
    ctr: item.ctr,
    mismatch: item.diagnosis === "Post-click mismatch" || item.diagnosis === "Weak overall",
    matchLevel: item.diagnosis,
  })), [model.creativeDiagnostics]);
  const creativeAttention = useMemo(
    () => model.creativeDiagnostics
      .filter((item) => item.diagnosis !== "Winner" && item.diagnosis !== "Mixed")
      .slice(0, 5),
    [model.creativeDiagnostics],
  );
  const adSetChartData = useMemo(() => model.currentSummary.byAdSet.map((item) => ({
    ...item,
    name: `${item.campaign} · ${item.adSet}`,
  })), [model.currentSummary.byAdSet]);
  const activeCampaignCount = model.currentSummary.byCampaign.filter(
    (item) => item.spend > 0 || item.purchaseValue > 0,
  ).length;
  const hasCurrentData = model.currentRows.length > 0;
  const hasScopeFilter = scope.campaign !== scope.allValue || scope.adSet !== scope.allValue || scope.ad !== scope.allValue;

  return (
    <>
      <div className={`flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-2.5 text-xs ${sourceTone(source)}`}>
        <div className="flex items-center gap-2 font-black">
          <SourceIcon state={source.state} />
          <span>{source.label}</span>
        </div>
        <span className="hidden text-current/40 sm:inline">•</span>
        <span>{source.updatedAt ? `Synced ${source.updatedAt}` : "Not synced yet"}</span>
        <span className="hidden text-current/40 md:inline">•</span>
        <span className="hidden md:inline">{source.coverageLabel}</span>
        <span className="hidden text-current/40 lg:inline">•</span>
        <span className="hidden lg:inline">{source.confidence} confidence</span>
        <button type="button" onClick={() => setSourceOpen(true)} className="ml-auto font-black text-emerald-900 hover:underline">
          Source details
        </button>
      </div>

      <div className="mt-3 grid gap-2 rounded-xl border bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <ScopeSelect label="Campaign" value={scope.campaign} allValue={scope.allValue} options={scope.campaigns} onChange={scope.onCampaignChange} />
        <ScopeSelect label="Ad set" value={scope.adSet} allValue={scope.allValue} options={scope.adSets} onChange={scope.onAdSetChange} />
        <ScopeSelect label="Ad" value={scope.ad} allValue={scope.allValue} options={scope.ads} onChange={scope.onAdChange} />
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={scope.onClear} disabled={!hasScopeFilter}>
          <FilterX data-icon="inline-start" />Clear filters
        </Button>
      </div>

      {!hasCurrentData ? (
        <Card className="mt-4 border-dashed py-10 shadow-none">
          <CardContent className="mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="grid size-12 place-items-center rounded-full bg-amber-50 text-amber-700"><AlertTriangle className="size-5" /></div>
            <h3 className="mt-4 text-xl font-black">{hasScopeFilter ? "No ads match these filters" : "Paid-media decisions are paused"}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {hasScopeFilter
                ? "Clear one or more Campaign, Ad set, or Ad filters to restore the performance view."
                : "Sync Meta Ads to calculate ROAS and verify Scale candidates. Shopify demand candidates remain unconfirmed until paid-media data covers this date range."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {hasScopeFilter ? (
                <Button type="button" onClick={scope.onClear}><FilterX data-icon="inline-start" />Clear filters</Button>
              ) : (
                <>
                  <Button type="button" onClick={sourceControls.onSync} disabled={sourceControls.syncing}>
                    <RefreshCcw className={sourceControls.syncing ? "animate-spin" : ""} data-icon="inline-start" />Sync Google Sheet
                  </Button>
                  <Button type="button" variant="outline" onClick={sourceControls.onImport}><Upload data-icon="inline-start" />Import CSV/JSON</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="mt-4 grid gap-3 grid-cols-2 xl:grid-cols-4" aria-label="Advertising KPIs">
            {model.kpis.map((kpi) => <StoryKpiCard key={kpi.key} kpi={kpi} model={model} />)}
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
            <Card className="min-w-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg font-black">CPA + purchases trend</CardTitle>
                <p className="text-xs leading-5 text-muted-foreground">See whether additional conversion volume is becoming more or less expensive.</p>
              </CardHeader>
              <CardContent>
                <CpaPurchasesTrend data={model.daily} height={300} />
              </CardContent>
            </Card>

            <Card className="min-w-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg font-black">Daily ROAS</CardTitle>
                <p className="text-xs leading-5 text-muted-foreground">Efficiency against the {number(model.targetRoas, 1)} guardrail.</p>
              </CardHeader>
              <CardContent>
                <DailyRoas data={model.daily} targetRoas={model.targetRoas} height={238} />
                <div className="mt-2 grid grid-cols-3 gap-2 border-t pt-3 text-center">
                  <div><div className="text-[10px] text-muted-foreground">Portfolio</div><div className="mt-1 text-sm font-black">{model.currentSummary.roas === null ? "—" : number(model.currentSummary.roas, 2)}</div></div>
                  <div><div className="text-[10px] text-muted-foreground">Latest</div><div className="mt-1 text-sm font-black">{latestDaily?.roas === null || latestDaily?.roas === undefined ? "—" : number(latestDaily.roas, 2)}</div></div>
                  <div><div className="text-[10px] text-muted-foreground">Days below</div><div className="mt-1 text-sm font-black">{number(daysBelowTarget)}</div></div>
                </div>
              </CardContent>
            </Card>
          </section>
          <ul className="sr-only" aria-label="Daily advertising metrics">
            {observedDaily.map((point) => (
              <li key={point.date}>
                {point.date}: {number(point.purchases || 0)} purchases, CPA {point.cpa === null ? "unavailable" : money(point.cpa)}, ROAS {point.roas === null ? "unavailable" : number(point.roas, 2)}.
              </li>
            ))}
          </ul>

          <section className="mt-3 grid gap-2 md:grid-cols-3" aria-label="Performance evidence">
            {model.events.slice(0, 2).map((event) => (
              <div key={`${event.title}-${event.detail}`} className={`rounded-xl border bg-white p-3 text-[11px] shadow-sm ${eventTone(event.tone)}`}>
                <div className="flex items-center gap-2 font-black">
                  {event.tone === "positive" ? <ArrowUpRight className="size-4" /> : event.tone === "negative" ? <ArrowDownRight className="size-4" /> : <AlertTriangle className="size-4" />}
                  <span>{event.title}</span>
                </div>
                <p className="mt-1.5 leading-5 text-foreground">{event.detail}</p>
              </div>
            ))}
            <div className="rounded-xl border bg-white p-3 text-[11px] shadow-sm">
              <div className="flex items-center justify-between gap-2 font-black"><span>Decision confidence</span><Badge variant="secondary">{source.confidence}</Badge></div>
              <p className="mt-1.5 leading-5 text-muted-foreground">{confidenceCopy}</p>
            </div>
          </section>

          <Card className="mt-4 min-w-0 gap-0 py-0 shadow-none">
            <Tabs value={decisionLens} onValueChange={setDecisionLens}>
              <CardHeader className="gap-3 border-b py-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="text-lg font-black">Decision lenses</CardTitle>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Move from portfolio allocation to delivery quality without losing the active filters.</p>
                  </div>
                  <div className="overflow-x-auto pb-1">
                    <TabsList>
                      <TabsTrigger value="budget">Budget</TabsTrigger>
                      <TabsTrigger value="funnel">Funnel &amp; timing</TabsTrigger>
                      <TabsTrigger value="creative">Creative</TabsTrigger>
                    </TabsList>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-4">
                <TabsContent value="budget">
                  {decisionLens === "budget" ? (
                    <div className={activeCampaignCount > 12 ? "grid gap-5" : "grid gap-5 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]"}>
                      <section className="min-w-0">
                        <h3 className="text-sm font-black">Budget allocation</h3>
                        <p className="mt-1 text-xs text-muted-foreground">All {number(activeCampaignCount)} active campaigns, ranked by spend. Spend share versus purchase-value share.</p>
                        <BudgetAllocation data={model.currentSummary.byCampaign} height={330} />
                        <ul className="sr-only">{model.currentSummary.byCampaign.map((item) => <li key={item.key}>{item.campaign}: {money(item.spend)} spend and {money(item.purchaseValue)} purchase value.</li>)}</ul>
                      </section>
                      <section className={activeCampaignCount > 12 ? "min-w-0 border-t pt-4" : "min-w-0 border-t pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0"}>
                        <h3 className="text-sm font-black">Ad set ROAS</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Highest-spend ad sets ranked against the {number(model.targetRoas, 1)} target.</p>
                        <AdSetRoas data={adSetChartData} targetRoas={model.targetRoas} height={330} />
                        <ul className="sr-only">{model.currentSummary.byAdSet.map((item) => <li key={item.key}>{item.campaign}, {item.adSet}: ROAS {item.roas === null ? "unavailable" : number(item.roas, 2)} on {money(item.spend)} spend.</li>)}</ul>
                      </section>
                    </div>
                  ) : null}
                </TabsContent>
                <TabsContent value="funnel">
                  {decisionLens === "funnel" ? (
                    <div className="grid gap-5 xl:grid-cols-2">
                      <section className="min-w-0">
                        <h3 className="text-sm font-black">Conversion stage volumes</h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">Content views are a source proxy, so this is not a strict person-level funnel.</p>
                        <MetaAdsFunnelChart summary={model.currentSummary} />
                      </section>
                      <section className="min-w-0 border-t pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0">
                        <h3 className="text-sm font-black">Day-of-week performance</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Weighted purchases and ROAS, Monday through Sunday.</p>
                        <Weekday data={model.daily} targetRoas={model.targetRoas} height={300} />
                      </section>
                    </div>
                  ) : null}
                </TabsContent>
                <TabsContent value="creative">
                  {decisionLens === "creative" ? (
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                      <section className="min-w-0">
                        <h3 className="text-sm font-black">Creative performance map</h3>
                        <p className="mt-1 text-xs text-muted-foreground">CTR × ROAS; bubble size represents spend. Low-evidence ads remain review-only.</p>
                        <CreativeDiagnostic
                          data={creativeChartData}
                          targetRoas={model.targetRoas}
                          height={340}
                        />
                      </section>
                      <section className="min-w-0 border-t pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0">
                        <h3 className="text-sm font-black">Needs attention</h3>
                        <div className="mt-3 divide-y rounded-xl border">
                          {creativeAttention.map((item) => (
                            <div key={item.key} className="p-3">
                              <div className="line-clamp-2 text-xs font-black">{item.label}</div>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground"><span>{item.diagnosis}</span><span>{money(item.spend)} spend</span><span>{item.roas === null ? "ROAS —" : `ROAS ${number(item.roas, 2)}`}</span></div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-950">
                          <Info className="mt-0.5 size-4 shrink-0" />
                          <span>Age, gender, and Publisher Platform breakdowns are not included in this 28-column source, so those Looker charts are intentionally not fabricated here.</span>
                        </div>
                      </section>
                    </div>
                  ) : null}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          <Card className="mt-4 gap-0 py-0 shadow-none">
            <CardHeader className="py-3"><CardTitle className="text-lg font-black">Action queue</CardTitle></CardHeader>
            {visibleActions.length ? (
              <div>
                <div className="hidden grid-cols-[88px_minmax(190px,1.15fr)_minmax(280px,1.65fr)_105px_105px_138px] gap-3 border-t px-4 py-2 text-[10px] font-bold text-muted-foreground xl:grid">
                  <span>Priority</span><span>Action</span><span>Reason</span><span>Confidence</span><span>Spend in scope</span><span />
                </div>
                {visibleActions.map((action) => (
                  <div key={action.key} className="grid gap-2 border-t px-4 py-3 xl:grid-cols-[88px_minmax(190px,1.15fr)_minmax(280px,1.65fr)_105px_105px_138px] xl:items-center xl:gap-3 xl:py-2">
                    <div><span className={`inline-flex min-h-6 items-center rounded-md px-3 text-[11px] font-black ${actionTone(action.tone)}`}>{action.label}</span></div>
                    <div className="min-w-0"><div className="line-clamp-2 text-xs font-black">{action.title}</div><div className="mt-1 text-[10px] text-muted-foreground">Campaign{action.mappedProductTitle ? ` · ${action.mappingLabel} map` : " · Unmapped"}</div></div>
                    <p className="m-0 text-[11px] leading-5 text-muted-foreground xl:line-clamp-2">{action.reason}</p>
                    <div className={`text-[11px] font-black ${confidenceTone(action.confidence)}`}>{action.confidence} <span className="ml-1 font-normal text-muted-foreground">{action.confidenceScore}%</span></div>
                    <div><div className="text-xs font-black tabular-nums">{money(action.spend)}</div><div className="mt-0.5 text-[9px] text-muted-foreground">selected period</div></div>
                    <Button type="button" size="sm" className="min-h-10 xl:min-h-8" onClick={() => setSelectedAction(action)}>Review action</Button>
                  </div>
                ))}
                {actions.length > 3 ? (
                  <button type="button" className="flex min-h-10 w-full items-center justify-center gap-2 border-t bg-muted/20 text-xs font-black text-emerald-900 hover:bg-emerald-50" onClick={() => setShowAllActions((current) => !current)}>
                    {showAllActions ? "Show top actions" : `View all actions (${number(actions.length)})`}
                    <ChevronDown className={`size-4 transition-transform ${showAllActions ? "rotate-180" : ""}`} />
                  </button>
                ) : null}
              </div>
            ) : (
              <CardContent className="border-t py-5 text-sm text-muted-foreground">No campaign has enough spend in this range to generate an action.</CardContent>
            )}
          </Card>
        </>
      )}

      <Sheet open={sourceOpen} onOpenChange={setSourceOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="border-b px-4 py-4">
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">Data source</div>
            <SheetTitle className="text-xl font-black">Meta Ads connection</SheetTitle>
            <SheetDescription>Inspect source health, coverage, and product-mapping confidence.</SheetDescription>
          </SheetHeader>
          <SourceDetails source={source} controls={sourceControls} />
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedAction)} onOpenChange={(open) => { if (!open) setSelectedAction(null); }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="border-b px-4 py-4">
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">Recommended action</div>
            <SheetTitle className="pr-8 text-xl font-black">{selectedAction?.title}</SheetTitle>
            <SheetDescription>Campaign-level guidance from the selected Meta Ads period.</SheetDescription>
          </SheetHeader>
          {selectedAction ? (
            <div className="flex-1 overflow-y-auto px-4">
              <span className={`inline-flex min-h-7 items-center rounded-md px-3 text-xs font-black ${actionTone(selectedAction.tone)}`}>{selectedAction.label}</span>
              <div className="mt-5 border-t py-5"><h3 className="font-black">Why this is recommended</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedAction.reason}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-muted/20 p-3"><div className="text-[10px] text-muted-foreground">Confidence</div><div className="mt-1 font-black">{selectedAction.confidence} · {selectedAction.confidenceScore}%</div></div>
                <div className="rounded-xl border bg-muted/20 p-3"><div className="text-[10px] text-muted-foreground">Spend in scope</div><div className="mt-1 font-black">{money(selectedAction.spend)}</div></div>
                <div className="rounded-xl border bg-muted/20 p-3"><div className="text-[10px] text-muted-foreground">ROAS</div><div className="mt-1 font-black">{selectedAction.roas === null ? "No data" : number(selectedAction.roas, 2)}</div></div>
                <div className="rounded-xl border bg-muted/20 p-3"><div className="text-[10px] text-muted-foreground">Purchases</div><div className="mt-1 font-black">{number(selectedAction.purchases)}</div></div>
              </div>
              <div className="mt-5 border-t py-5"><h3 className="font-black">Product mapping</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedAction.mappedProductTitle || "No trusted Shopify product mapping is available for this campaign."}</p></div>
            </div>
          ) : null}
          <SheetFooter className="border-t">
            {selectedAction?.canOpenProduct ? <Button type="button" onClick={() => { onOpenProduct(selectedAction); setSelectedAction(null); }}>Open mapped product <ArrowRight data-icon="inline-end" /></Button> : null}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

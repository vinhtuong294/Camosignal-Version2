import {
  AlertTriangle,
  ArrowRight,
  BotOff,
  Info,
  MailCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { money, number, rawPercent } from "@/lib/analytics";
import type {
  GrowthCoverageDetail,
  GrowthCoverageState,
  GrowthSummary,
  PopupSegmentKey,
  PopupSegmentRow,
  PopupSelectionDepthKey,
  PopupSelectionDepthRow,
} from "@/lib/types";

type CountValue = number | null | undefined;

const segmentOrder: { key: PopupSegmentKey; label: string }[] = [
  { key: "deer", label: "Deer" },
  { key: "turkey", label: "Turkey" },
  { key: "freshwater", label: "Freshwater" },
  { key: "saltwater", label: "Saltwater" },
  { key: "seasonal", label: "Seasonal" },
];

const selectionDepthOrder: { key: PopupSelectionDepthKey; label: string }[] = [
  { key: "one", label: "Exactly 1 option" },
  { key: "two", label: "Exactly 2 options" },
  { key: "three_plus", label: "3+ options" },
];

function hasValue(value: CountValue): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function coverageLabel(state: GrowthCoverageState | undefined) {
  if (state === "live") return "Live";
  if (state === "estimated") return "Estimated";
  if (state === "partial") return "Partial";
  return "Not connected";
}

function coverageTone(state: GrowthCoverageState | undefined) {
  if (state === "live") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (state === "estimated" || state === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function weakestCoverage(...details: (GrowthCoverageDetail | undefined)[]) {
  const weight: Record<GrowthCoverageState, number> = {
    live: 0,
    estimated: 1,
    partial: 2,
    missing: 3,
  };
  return details
    .filter((detail): detail is GrowthCoverageDetail => Boolean(detail))
    .reduce<GrowthCoverageDetail | undefined>((weakest, detail) => {
      if (!weakest || weight[detail.state] > weight[weakest.state]) return detail;
      return weakest;
    }, undefined);
}

function comparisonText(current: CountValue, previous: CountValue, includesCurrentDay = false) {
  if (!hasValue(current) || !hasValue(previous)) return "Prior period unavailable";
  const partialSuffix = includesCurrentDay ? " · includes in-progress day" : "";
  if (previous === 0) {
    return `${current === 0 ? "No change vs prior period" : "New in this period"}${partialSuffix}`;
  }

  const delta = (current - previous) / previous;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(delta);
  return `${formatted} vs prior period${partialSuffix}`;
}

function comparisonTone(current: CountValue, previous: CountValue) {
  if (!hasValue(current) || !hasValue(previous) || current === previous) return "text-muted-foreground";
  return current > previous ? "text-emerald-700" : "text-red-700";
}

function percentage(numerator: CountValue, denominator: CountValue) {
  if (!hasValue(numerator) || !hasValue(denominator) || denominator <= 0) return null;
  return numerator / denominator;
}

function FunnelStage({
  step,
  label,
  value,
  previous,
  conversion,
  conversionLabel,
  coverage,
  missingLabel,
  icon,
  includesCurrentDay = false,
  isLast = false,
}: {
  step: number;
  label: string;
  value: CountValue;
  previous: CountValue;
  conversion: number | null | undefined;
  conversionLabel: string;
  coverage: GrowthCoverageDetail | undefined;
  missingLabel: string;
  icon: React.ReactNode;
  includesCurrentDay?: boolean;
  isLast?: boolean;
}) {
  const available = hasValue(value);

  return (
    <li className="relative min-w-0">
      <div
        className={`h-full min-h-[176px] rounded-xl border p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] ${
          available ? "bg-white" : "border-amber-200 bg-amber-50/45"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-800" aria-hidden="true">
              {icon}
            </span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                Step {step}
              </div>
              <h4 className="mt-0.5 text-sm font-black leading-5">{label}</h4>
            </div>
          </div>
          <Badge variant="outline" className={coverageTone(coverage?.state)}>
            {coverageLabel(coverage?.state)}
          </Badge>
        </div>

        {available ? (
          <>
            <data value={value} className="mt-5 block text-[clamp(1.8rem,3vw,2.6rem)] font-black leading-none tracking-[-0.045em] tabular-nums">
              {number(value)}
            </data>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              {conversion === undefined ? (
                <strong className="text-emerald-800">{conversionLabel}</strong>
              ) : hasValue(conversion) ? (
                <strong className="text-emerald-800">{rawPercent(conversion)}</strong>
              ) : (
                <span className="font-bold text-muted-foreground">No rate yet</span>
              )}
              {conversion !== undefined ? <span className="text-muted-foreground">{conversionLabel}</span> : null}
            </div>
            <p className={`mt-1 text-[11px] font-medium ${comparisonTone(value, previous)}`}>
              {comparisonText(value, previous, includesCurrentDay)}
            </p>
          </>
        ) : (
          <div className="mt-5 rounded-lg border border-amber-200 bg-white/80 p-3">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              <span>{missingLabel}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-amber-900">
              {coverage?.reason || "This source is not available for the selected period."}
            </p>
          </div>
        )}
      </div>

      {!isLast ? (
        <span className="absolute -right-3.5 top-1/2 z-10 hidden size-7 -translate-y-1/2 place-items-center rounded-full border bg-white text-emerald-800 shadow-sm md:grid" aria-hidden="true">
          <ArrowRight className="size-3.5" />
        </span>
      ) : null}
    </li>
  );
}

function BuyerKpi({
  label,
  value,
  helper,
  format = "count",
}: {
  label: string;
  value: CountValue;
  helper: string;
  format?: "count" | "percent";
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-white p-3.5 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <dt className="text-xs font-bold leading-5 text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-2xl font-black leading-none tracking-[-0.035em] tabular-nums">
        {hasValue(value) ? (format === "percent" ? rawPercent(value) : number(value)) : "—"}
      </dd>
      <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{helper}</p>
    </div>
  );
}

type SegmentDisplayRow = Omit<
  PopupSegmentRow,
  "customers" | "share" | "periodBuyers" | "buyerRate" | "periodOrders" | "periodRevenue" | "aov"
> & {
  customers: CountValue;
  share: CountValue;
  periodBuyers: CountValue;
  buyerRate: CountValue;
  periodOrders: CountValue;
  periodRevenue: CountValue;
  aov: CountValue;
};

function SegmentBar({ row }: { row: SegmentDisplayRow }) {
  if (!hasValue(row.share)) return null;
  const width = hasValue(row.share) ? Math.min(100, Math.max(0, row.share * 100)) : 0;
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-50" aria-hidden="true">
      <div className="h-full rounded-full bg-emerald-700" style={{ width: `${width}%` }} />
    </div>
  );
}

function SegmentMobileRow({ row }: { row: SegmentDisplayRow }) {
  return (
    <li className="rounded-xl border bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-black">{row.label}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {hasValue(row.customers) ? `${number(row.customers)} estimated signups` : "Signup data unavailable"}
          </div>
        </div>
        <div className="shrink-0 text-right text-sm font-black tabular-nums">
          {hasValue(row.share) ? rawPercent(row.share) : "—"}
          <div className="mt-0.5 text-[10px] font-medium text-muted-foreground">of period signups</div>
        </div>
      </div>
      <SegmentBar row={row} />
      <dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-4">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Buyers</dt>
          <dd className="mt-1 font-black tabular-nums">{hasValue(row.periodBuyers) ? number(row.periodBuyers) : "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Purchase rate</dt>
          <dd className="mt-1 font-black tabular-nums">{hasValue(row.buyerRate) ? rawPercent(row.buyerRate) : "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Orders</dt>
          <dd className="mt-1 font-black tabular-nums">{hasValue(row.periodOrders) ? number(row.periodOrders) : "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">AOV</dt>
          <dd className="mt-1 font-black tabular-nums">{hasValue(row.aov) ? money(row.aov) : "—"}</dd>
        </div>
      </dl>
    </li>
  );
}

type SelectionDepthDisplayRow = Omit<
  PopupSelectionDepthRow,
  "customers" | "share" | "periodBuyers" | "buyerRate" | "periodOrders" | "periodRevenue" | "aov"
> & {
  customers: CountValue;
  share: CountValue;
  periodBuyers: CountValue;
  buyerRate: CountValue;
  periodOrders: CountValue;
  periodRevenue: CountValue;
  aov: CountValue;
};

function SelectionDepthCard({ row }: { row: SelectionDepthDisplayRow }) {
  return (
    <li className="min-w-0 rounded-xl border bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Selection depth
          </p>
          <h5 className="mt-1 font-black">{row.label}</h5>
        </div>
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
          {hasValue(row.share) ? rawPercent(row.share) : "—"}
        </Badge>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <data
            value={hasValue(row.customers) ? row.customers : undefined}
            className="block text-3xl font-black leading-none tracking-[-0.04em] tabular-nums"
          >
            {hasValue(row.customers) ? number(row.customers) : "—"}
          </data>
          <p className="mt-1 text-[11px] text-muted-foreground">estimated signups in selected period</p>
        </div>
        <span className="text-right text-[10px] font-medium leading-4 text-muted-foreground">
          {hasValue(row.share) ? `${rawPercent(row.share)} of recognized choices` : "Share unavailable"}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-3">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Purchase rate</dt>
          <dd className="mt-1 font-black tabular-nums">{hasValue(row.buyerRate) ? rawPercent(row.buyerRate) : "—"}</dd>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {hasValue(row.periodBuyers) ? `${number(row.periodBuyers)} buyers` : "Buyer data unavailable"}
          </p>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Orders</dt>
          <dd className="mt-1 font-black tabular-nums">{hasValue(row.periodOrders) ? number(row.periodOrders) : "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">AOV</dt>
          <dd className="mt-1 font-black tabular-nums">{hasValue(row.aov) ? money(row.aov) : "—"}</dd>
        </div>
      </dl>
    </li>
  );
}

function sourceBadge(growth: GrowthSummary | undefined) {
  if (!growth || growth.sample) {
    return { label: "Growth data unavailable", tone: "border-slate-200 bg-slate-50 text-slate-700" };
  }

  const states = Object.values(growth.coverage).map((item) => item.state);
  if (states.every((state) => state === "live")) {
    return { label: "Live Shopify data", tone: "border-emerald-200 bg-emerald-50 text-emerald-800" };
  }
  if (states.some((state) => state === "missing")) {
    return { label: "Setup needed", tone: "border-amber-200 bg-amber-50 text-amber-900" };
  }
  return { label: "Estimated coverage", tone: "border-amber-200 bg-amber-50 text-amber-900" };
}

export function GrowthOverview({
  growth,
  periodLabel = "Selected period",
  includesCurrentDay = false,
  onReconnect,
}: {
  growth?: GrowthSummary;
  periodLabel?: string;
  includesCurrentDay?: boolean;
  onReconnect?: () => void;
}) {
  const usable = growth && !growth.sample ? growth : undefined;
  const current = usable?.current;
  const previous = usable?.previous;
  const badge = sourceBadge(growth);
  const buyerScopeLabel = growth?.buyerScope === "all" ? "All-channel buyers" : "Online Store buyers";
  const popupBuyerShare = percentage(current?.popupAudienceBuyers, current?.uniqueBuyers);
  const effectiveCoverage = growth?.sample
    ? {
        sessions: { ...growth.coverage.sessions, state: "missing" as const },
        buyers: { ...growth.coverage.buyers, state: "missing" as const },
        popupAudience: { ...growth.coverage.popupAudience, state: "missing" as const },
      }
    : growth?.coverage;
  const needsShopifyAccess = Boolean(
    usable && Object.values(usable.coverage).some((detail) => detail.state === "missing"),
  );
  const signupBuyerCoverage = weakestCoverage(effectiveCoverage?.popupAudience, effectiveCoverage?.buyers);
  const segmentMap = new Map(usable?.popupAudience.segments.map((row) => [row.key, row]) || []);
  const segments: SegmentDisplayRow[] = segmentOrder.map((segment) => {
    const row = segmentMap.get(segment.key);
    return row || {
      ...segment,
      customers: null,
      share: null,
      periodBuyers: null,
      buyerRate: null,
      periodOrders: null,
      periodRevenue: null,
      aov: null,
    };
  });
  const selectionDepthMap = new Map(
    usable?.popupAudience.selectionDepth.map((row) => [row.key, row]) || [],
  );
  const selectionDepth: SelectionDepthDisplayRow[] = selectionDepthOrder.map((depth) => {
    const row = selectionDepthMap.get(depth.key);
    return row
      ? { ...row, label: depth.label }
      : {
          ...depth,
          customers: null,
          share: null,
          periodBuyers: null,
          buyerRate: null,
          periodOrders: null,
          periodRevenue: null,
          aov: null,
        };
  });
  const periodPopupSignups = usable?.popupAudience.periodSignups ?? current?.estimatedPopupSignups;
  const popupCoverage = effectiveCoverage?.popupAudience;

  return (
    <Card className="shadow-sm" aria-labelledby="growth-overview-title">
      <CardHeader className="border-b">
        <CardTitle id="growth-overview-title" className="text-lg font-black tracking-[-0.02em]">
          Website &amp; popup funnel
        </CardTitle>
        <CardDescription>
          From an Online Store human session to an estimated popup signup and estimated signup buyer.
        </CardDescription>
        <CardAction>
          <Badge variant="outline" className={badge.tone}>{badge.label}</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-6">
        {needsShopifyAccess && onReconnect ? (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <strong>Shopify access needs an update.</strong>
              <p className="mt-1 text-xs leading-5 text-amber-900">
                Grant the requested reporting/customer scopes to replace unavailable funnel steps with live data.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" className="shrink-0 border-amber-300 bg-white" onClick={onReconnect}>
              Grant Shopify access
            </Button>
          </div>
        ) : null}

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <section aria-labelledby="growth-path-title">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 id="growth-path-title" className="font-black">Growth funnel</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Each rate uses the previous step as its denominator.
                  {includesCurrentDay ? " Today is still accumulating, so comparisons are partial." : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {includesCurrentDay ? (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
                    In-progress day
                  </Badge>
                ) : null}
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                  {periodLabel}
                </Badge>
              </div>
            </div>

            <ol className="grid gap-4 md:grid-cols-3" aria-label="Estimated website and popup conversion funnel">
              <FunnelStage
                step={1}
                label="Online Store human sessions"
                value={current?.humanSessions}
                previous={previous?.humanSessions}
                conversion={undefined}
                conversionLabel="Bots excluded"
                coverage={effectiveCoverage?.sessions}
                missingLabel="Needs read_reports"
                icon={<BotOff className="size-4" />}
                includesCurrentDay={includesCurrentDay}
              />
              <FunnelStage
                step={2}
                label="Estimated popup signups"
                value={current?.estimatedPopupSignups}
                previous={previous?.estimatedPopupSignups}
                conversion={usable?.rates.sessionToSignup}
                conversionLabel="of human sessions"
                coverage={effectiveCoverage?.popupAudience}
                missingLabel="Needs customer data"
                icon={<MailCheck className="size-4" />}
                includesCurrentDay={includesCurrentDay}
              />
              <FunnelStage
                step={3}
                label="Estimated signup buyers"
                value={current?.estimatedPopupSignupBuyers}
                previous={previous?.estimatedPopupSignupBuyers}
                conversion={usable?.rates.signupToBuyer}
                conversionLabel="of estimated popup signups"
                coverage={signupBuyerCoverage}
                missingLabel="Purchase match unavailable"
                icon={<ShoppingBag className="size-4" />}
                includesCurrentDay={includesCurrentDay}
                isLast
              />
            </ol>
          </section>

          <section className="rounded-xl border bg-muted/20 p-3.5" aria-labelledby="buyer-snapshot-title">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-800" aria-hidden="true">
                  <Users className="size-4" />
                </span>
                <div>
                  <h3 id="buyer-snapshot-title" className="font-black">Buyer snapshot</h3>
                  <p className="text-xs text-muted-foreground">Unique people, not order count.</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                {buyerScopeLabel}
              </Badge>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              <BuyerKpi
                label="All unique period buyers"
                value={current?.uniqueBuyers}
                helper={comparisonText(current?.uniqueBuyers, previous?.uniqueBuyers, includesCurrentDay)}
              />
              <BuyerKpi
                label="Popup-audience buyers"
                value={current?.popupAudienceBuyers}
                helper="Any popup-tagged customer who bought in this period."
              />
              <BuyerKpi
                label="Popup share of buyers"
                value={popupBuyerShare}
                format="percent"
                helper="Popup-audience buyers / all matched period buyers."
              />
              <BuyerKpi
                label="Guest / unmatched orders"
                value={current?.guestOrders}
                helper="Orders that cannot be tied to a customer profile."
              />
            </dl>
          </section>
        </div>

        <section className="border-t pt-5" aria-labelledby="popup-segments-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id="popup-segments-title" className="font-black">Popup choices — selected period</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Estimated signup cohorts and their Online Store purchase behavior. The top date filter recalculates every value below.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                {periodLabel}
              </Badge>
              <Badge variant="outline" className={coverageTone(popupCoverage?.state)}>
                {coverageLabel(popupCoverage?.state)} signup timing
              </Badge>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                {hasValue(periodPopupSignups) ? `${number(periodPopupSignups)} estimated signups` : "Signup total unavailable"}
              </Badge>
              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-800">
                Online Store conversion
              </Badge>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h4 className="font-black">Interest performance</h4>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Compare the five recognized popup interests within {periodLabel.toLowerCase()}.
                </p>
              </div>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">Multi-select</Badge>
            </div>

            <ul className="mt-4 grid gap-3 md:hidden" aria-label="Selected-period popup interest performance">
              {segments.map((row) => <SegmentMobileRow key={row.key} row={row} />)}
            </ul>

            <div className="mt-4 hidden overflow-hidden rounded-xl border md:block">
              <table className="w-full table-fixed border-collapse text-sm">
                <caption className="sr-only">
                  Selected-period popup signups, shares, buyers, purchase rates, orders, and average order value by interest.
                </caption>
                <thead className="bg-muted/45 text-left text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                  <tr>
                    <th scope="col" className="w-[16%] px-4 py-3">Interest</th>
                    <th scope="col" className="w-[25%] px-4 py-3">Period signups</th>
                    <th scope="col" className="px-3 py-3 text-right">Share</th>
                    <th scope="col" className="px-3 py-3 text-right">Buyers</th>
                    <th scope="col" className="px-3 py-3 text-right">Purchase rate</th>
                    <th scope="col" className="px-3 py-3 text-right">Orders</th>
                    <th scope="col" className="px-4 py-3 text-right">AOV</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {segments.map((row) => (
                    <tr key={row.key}>
                      <th scope="row" className="px-4 py-3 text-left font-black">{row.label}</th>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground">Estimated signups</span>
                          <span className="font-black tabular-nums">{hasValue(row.customers) ? number(row.customers) : "—"}</span>
                        </div>
                        <SegmentBar row={row} />
                      </td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums">{hasValue(row.share) ? rawPercent(row.share) : "—"}</td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums">{hasValue(row.periodBuyers) ? number(row.periodBuyers) : "—"}</td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums">{hasValue(row.buyerRate) ? rawPercent(row.buyerRate) : "—"}</td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums">{hasValue(row.periodOrders) ? number(row.periodOrders) : "—"}</td>
                      <td className="px-4 py-3 text-right font-black tabular-nums">{hasValue(row.aov) ? money(row.aov) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Interest share = estimated signups carrying that interest / all estimated popup signups in the period. One customer can carry multiple interests, so these five shares may total more than 100%.
            </p>
          </div>

          <div className="mt-6 border-t pt-5" aria-labelledby="selection-depth-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 id="selection-depth-title" className="font-black">How many options customers selected</h4>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Split estimated signups into exactly 1, exactly 2, or 3+ recognized popup interests.
                </p>
              </div>
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
                {hasValue(usable?.popupAudience.unclassifiedSignups)
                  ? `${number(usable.popupAudience.unclassifiedSignups)} with no recognized option`
                  : "Unclassified count unavailable"}
              </Badge>
            </div>

            <ul className="mt-4 grid gap-3 lg:grid-cols-3" aria-label="Selected-period popup option depth">
              {selectionDepth.map((row) => <SelectionDepthCard key={row.key} row={row} />)}
            </ul>

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Selection-depth share uses only period signups with at least one recognized option, so the three groups total 100%. Signups with no recognized option are shown separately above.
            </p>
          </div>
        </section>

        <aside className="flex gap-2.5 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs leading-5 text-sky-950" aria-label="Growth data sources and measurement basis">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            <strong>Measurement basis:</strong> sessions come from Shopify Analytics / ShopifyQL and include Online Store humans only; buyer KPIs use {buyerScopeLabel.toLowerCase()}. Signup timing is estimated from the email marketing-consent update, then customer creation time. Interest and selection-depth cohorts use each customer&apos;s current recognized popup tags because Shopify does not expose the option snapshot they selected historically. Purchase rate = unique customers with a qualifying post-signup Online Store order / estimated signups in the cohort; AOV = qualifying post-signup Online Store subtotal / qualifying orders. Zero-order AOV is shown as —.
          </p>
        </aside>
      </CardContent>
    </Card>
  );
}

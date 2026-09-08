import { money, number, rawPercent } from "@/lib/analytics";
import {
  summarizeMetaAdsRows,
  type MetaAdsGroup,
  type MetaAdsRow,
  type MetaAdsSummary,
} from "@/lib/meta-ads-import";

const DAY_MS = 86_400_000;

export type AdsDateWindow = {
  start: string;
  end: string;
};

export type AdsDailyStoryPoint = {
  date: string;
  observed: boolean;
  spend: number | null;
  purchaseValue: number | null;
  purchases: number | null;
  roas: number | null;
  cpa: number | null;
};

export type AdsCreativeDiagnosticPoint = {
  key: string;
  label: string;
  campaign: string;
  adSet: string;
  spend: number;
  purchases: number;
  roas: number | null;
  ctr: number | null;
  purchaseRate: number | null;
  ctrIndex: number | null;
  conversionIndex: number | null;
  eligible: boolean;
  diagnosis: "Winner" | "Post-click mismatch" | "Creative opportunity" | "Weak overall" | "Mixed" | "Low evidence";
};

export type AdsPeriodCoverage = {
  observedDays: number;
  totalDays: number;
  share: number;
  latestObservedDate: string;
  lagDays: number;
};

export type AdsStoryKpi = {
  key: "spend" | "purchaseValue" | "roas" | "cpa";
  label: string;
  current: number | null;
  previous: number | null;
  delta: number | null;
  favorableWhen: "up" | "down" | "neutral";
};

export type AdsStoryEvent = {
  tone: "positive" | "warning" | "negative" | "neutral";
  title: string;
  detail: string;
};

export type AdsStoryEvidence = {
  tone: "positive" | "negative" | "neutral";
  label: string;
  title: string;
  body: string;
  campaignKey: string;
};

export type AdsDecisionEvidence = {
  label: string;
  value: number | null;
  format: "percent" | "ratio" | "count" | "currency";
  benchmark?: {
    operator: "gte" | "lte";
    value: number;
  };
  context?: {
    label: string;
    value: number;
    format: "percent" | "ratio" | "count" | "currency";
  };
  note?: string;
};

export type AdsCampaignDecision = {
  label: string;
  tone: "scale" | "watch" | "fix";
  reason: string;
  evidence: AdsDecisionEvidence;
};

export type AdsStoryAction = AdsCampaignDecision & {
  key: string;
  title: string;
  confidence: "High" | "Medium" | "Low";
  confidenceScore: number;
  spend: number;
  purchases: number;
  roas: number | null;
};

export type AdsStoryboardModel = {
  currentWindow: AdsDateWindow;
  previousWindow: AdsDateWindow;
  currentRows: MetaAdsRow[];
  previousRows: MetaAdsRow[];
  currentSummary: MetaAdsSummary;
  previousSummary: MetaAdsSummary;
  currentCoverage: AdsPeriodCoverage;
  previousCoverage: AdsPeriodCoverage;
  comparisonAvailable: boolean;
  kpis: AdsStoryKpi[];
  daily: AdsDailyStoryPoint[];
  creativeDiagnostics: AdsCreativeDiagnosticPoint[];
  events: AdsStoryEvent[];
  evidence: AdsStoryEvidence[];
  actions: AdsStoryAction[];
  targetRoas: number;
};

function utcDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDate(value: string, days: number): string {
  const date = utcDate(value);
  if (!date) return value;
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

function daysInclusive(window: AdsDateWindow): number {
  const start = utcDate(window.start);
  const end = utcDate(window.end);
  if (!start || !end || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
}

function dateSequence(window: AdsDateWindow): string[] {
  const total = daysInclusive(window);
  if (!total) return [];
  return Array.from({ length: total }, (_, index) => shiftDate(window.start, index));
}

export function metaAdsDateKey(value: string): string {
  const raw = value.trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const candidate = `${iso[1]}-${iso[2]}-${iso[3]}`;
    return utcDate(candidate) ? candidate : "";
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slash) {
    const first = Number(slash[1]);
    const second = Number(slash[2]);
    const year = Number(slash[3]);
    const dayFirst = first > 12 && second <= 12;
    const month = dayFirst ? second : first;
    const day = dayFirst ? first : second;
    const candidate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return utcDate(candidate) ? candidate : "";
  }

  return "";
}

export function previousAdsWindow(window: AdsDateWindow): AdsDateWindow {
  const totalDays = Math.max(1, daysInclusive(window));
  const end = shiftDate(window.start, -1);
  return {
    start: shiftDate(end, -(totalDays - 1)),
    end,
  };
}

export function metaAdsRowsInWindow(rows: MetaAdsRow[], window: AdsDateWindow): MetaAdsRow[] {
  return rows.filter((row) => {
    const day = metaAdsDateKey(row.date);
    return Boolean(day && day >= window.start && day <= window.end);
  });
}

function coverageForRows(rows: MetaAdsRow[], window: AdsDateWindow): AdsPeriodCoverage {
  const observedDates = new Set(
    rows
      .map((row) => metaAdsDateKey(row.date))
      .filter((day) => day && day >= window.start && day <= window.end),
  );
  const totalDays = daysInclusive(window);
  const sortedDates = Array.from(observedDates).sort();
  const latestObservedDate = sortedDates.at(-1) || "";
  const latest = latestObservedDate ? utcDate(latestObservedDate) : null;
  const end = utcDate(window.end);
  const lagDays = latest && end && latest < end
    ? Math.floor((end.getTime() - latest.getTime()) / DAY_MS)
    : 0;

  return {
    observedDays: observedDates.size,
    totalDays,
    share: totalDays ? observedDates.size / totalDays : 0,
    latestObservedDate,
    lagDays,
  };
}

function dailyStory(rows: MetaAdsRow[], window: AdsDateWindow): AdsDailyStoryPoint[] {
  const byDate = new Map<string, { spend: number; purchaseValue: number; purchases: number }>();
  for (const row of rows) {
    const date = metaAdsDateKey(row.date);
    if (!date || date < window.start || date > window.end) continue;
    const current = byDate.get(date) || { spend: 0, purchaseValue: 0, purchases: 0 };
    current.spend += row.spend;
    current.purchaseValue += row.purchaseValue;
    current.purchases += row.purchases;
    byDate.set(date, current);
  }

  return dateSequence(window).map((date) => {
    const row = byDate.get(date);
    if (!row) {
      return { date, observed: false, spend: null, purchaseValue: null, purchases: null, roas: null, cpa: null };
    }
    return {
      date,
      observed: true,
      spend: row.spend,
      purchaseValue: row.purchaseValue,
      purchases: row.purchases,
      roas: row.spend ? row.purchaseValue / row.spend : null,
      cpa: row.purchases ? row.spend / row.purchases : null,
    };
  });
}

function creativeDiagnostics(summary: MetaAdsSummary): AdsCreativeDiagnosticPoint[] {
  const accountCtr = summary.ctr;
  const accountPurchaseRate = summary.purchaseRate;

  return summary.byAd
    .map((row) => {
      const eligible = row.impressions >= 1_000 && row.landingPageViews >= 50 && row.spend >= 20;
      const ctrIndex = accountCtr && row.ctr !== null ? row.ctr / accountCtr : null;
      const conversionIndex = accountPurchaseRate && row.purchaseRate !== null
        ? row.purchaseRate / accountPurchaseRate
        : null;
      let diagnosis: AdsCreativeDiagnosticPoint["diagnosis"] = "Low evidence";
      if (eligible && ctrIndex !== null && conversionIndex !== null) {
        if (ctrIndex >= 1.2 && conversionIndex >= 1.2) diagnosis = "Winner";
        else if (ctrIndex >= 1.2 && conversionIndex <= 0.8) diagnosis = "Post-click mismatch";
        else if (ctrIndex <= 0.8 && conversionIndex >= 1.2) diagnosis = "Creative opportunity";
        else if (ctrIndex <= 0.8 && conversionIndex <= 0.8) diagnosis = "Weak overall";
        else diagnosis = "Mixed";
      }
      return {
        key: row.key,
        label: row.ad,
        campaign: row.campaign,
        adSet: row.adSet,
        spend: row.spend,
        purchases: row.purchases,
        roas: row.roas,
        ctr: row.ctr,
        purchaseRate: row.purchaseRate,
        ctrIndex,
        conversionIndex,
        eligible,
        diagnosis,
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

function metricDelta(current: number | null, previous: number | null, enabled: boolean): number | null {
  if (!enabled || current === null || previous === null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
}

function comparisonReady(current: AdsPeriodCoverage, previous: AdsPeriodCoverage): boolean {
  return current.totalDays > 0 && current.share >= 0.8 && previous.share >= 0.8;
}

function kpis(
  current: MetaAdsSummary,
  previous: MetaAdsSummary,
  enabled: boolean,
): AdsStoryKpi[] {
  return [
    {
      key: "spend",
      label: "Spend",
      current: current.spend,
      previous: previous.spend,
      delta: metricDelta(current.spend, previous.spend, enabled),
      favorableWhen: "neutral",
    },
    {
      key: "purchaseValue",
      label: "Purchase value",
      current: current.purchaseValue,
      previous: previous.purchaseValue,
      delta: metricDelta(current.purchaseValue, previous.purchaseValue, enabled),
      favorableWhen: "up",
    },
    {
      key: "roas",
      label: "ROAS",
      current: current.roas,
      previous: previous.roas,
      delta: metricDelta(current.roas, previous.roas, enabled),
      favorableWhen: "up",
    },
    {
      key: "cpa",
      label: "CPA",
      current: current.cpa,
      previous: previous.cpa,
      delta: metricDelta(current.cpa, previous.cpa, enabled),
      favorableWhen: "down",
    },
  ];
}

function eventStory(daily: AdsDailyStoryPoint[], targetRoas: number): AdsStoryEvent[] {
  const observed = daily.filter((point) => point.observed);
  if (!observed.length) return [];

  const spendPeak = observed.reduce((best, point) => (
    (point.spend || 0) > (best.spend || 0) ? point : best
  ), observed[0]);
  const belowTarget = observed.filter((point) => point.roas !== null && point.roas < targetRoas);
  let recovery: AdsDailyStoryPoint | null = null;
  for (let index = 1; index < observed.length; index += 1) {
    const previous = observed[index - 1];
    const current = observed[index];
    if (
      previous.roas !== null &&
      current.roas !== null &&
      previous.roas < targetRoas &&
      current.roas >= targetRoas
    ) {
      recovery = current;
    }
  }
  const latest = observed.at(-1) || observed[0];
  const peakRoas = spendPeak.roas;

  return [
    {
      tone: peakRoas !== null && peakRoas < targetRoas ? "negative" : "neutral",
      title: `Highest spend · ${spendPeak.date.slice(5)}`,
      detail: peakRoas === null
        ? `${money(spendPeak.spend || 0)} with no ROAS signal`
        : `${money(spendPeak.spend || 0)} at ${number(peakRoas, 2)} ROAS`,
    },
    {
      tone: belowTarget.length ? "warning" : "positive",
      title: belowTarget.length ? `${belowTarget.length} days below ${number(targetRoas, 1)}` : "Benchmark held",
      detail: belowTarget.length
        ? `${belowTarget.length} of ${observed.length} observed days missed the ROAS guardrail`
        : `All ${observed.length} observed days met the ROAS guardrail`,
    },
    recovery
      ? {
          tone: "positive",
          title: `ROAS recovered · ${recovery.date.slice(5)}`,
          detail: `${number(recovery.roas || 0, 2)} ROAS after a below-target day`,
        }
      : {
          tone: latest.roas !== null && latest.roas >= targetRoas ? "positive" : "warning",
          title: `Latest signal · ${latest.date.slice(5)}`,
          detail: latest.roas === null ? "ROAS is unavailable" : `${number(latest.roas, 2)} ROAS on the latest observed day`,
        },
  ];
}

function relativeMovement(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

function movementCopy(label: string, current: number | null, previous: number | null): string {
  const delta = relativeMovement(current, previous);
  if (delta === null) return "";
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return direction === "flat" ? `${label} was flat` : `${label} ${direction} ${rawPercent(Math.abs(delta))}`;
}

function evidenceBody(
  row: MetaAdsGroup,
  previous: MetaAdsGroup | undefined,
  targetRoas: number,
  comparisonAvailable: boolean,
): string {
  const facts = [
    `ROAS ${row.roas === null ? "unavailable" : number(row.roas, 2)} vs ${number(targetRoas, 1)} target`,
    `CPA ${row.cpa === null ? "unavailable" : money(row.cpa)}`,
    `CTR ${row.ctr === null ? "unavailable" : rawPercent(row.ctr)}`,
  ];
  if (comparisonAvailable && previous) {
    const movements = [
      movementCopy("CTR", row.ctr, previous.ctr),
      movementCopy("CPM", row.cpm, previous.cpm),
      movementCopy("CPA", row.cpa, previous.cpa),
    ].filter(Boolean);
    if (movements.length) facts.push(`${movements.join(" and ")} vs prior period`);
  }
  return `${facts.join(". ")}.`;
}

function storyEvidence(
  current: MetaAdsSummary,
  previous: MetaAdsSummary,
  targetRoas: number,
  comparisonAvailable: boolean,
): AdsStoryEvidence[] {
  const threshold = Math.max(20, current.spend * 0.01);
  const meaningful = current.byCampaign.filter((row) => row.spend >= threshold && row.roas !== null);
  if (!meaningful.length) return [];
  const priorByKey = new Map(previous.byCampaign.map((row) => [row.key, row]));
  const weakest = [...meaningful].sort((a, b) => (a.roas || 0) - (b.roas || 0))[0];
  const positivePool = meaningful.filter((row) => row.purchases >= 3 && (row.roas || 0) >= targetRoas);
  const strongest = [...(positivePool.length ? positivePool : meaningful)]
    .sort((a, b) => (b.roas || 0) - (a.roas || 0))[0];
  const evidence: AdsStoryEvidence[] = [];

  if (weakest) {
    evidence.push({
      tone: (weakest.roas || 0) < targetRoas ? "negative" : "neutral",
      label: (weakest.roas || 0) < targetRoas ? "Weak segment" : "Lowest ROAS segment",
      title: weakest.campaign,
      body: evidenceBody(weakest, priorByKey.get(weakest.key), targetRoas, comparisonAvailable),
      campaignKey: weakest.key,
    });
  }
  if (strongest && strongest.key !== weakest?.key) {
    evidence.push({
      tone: (strongest.roas || 0) >= targetRoas ? "positive" : "neutral",
      label: (strongest.roas || 0) >= targetRoas ? "Positive segment" : "Best available segment",
      title: strongest.campaign,
      body: evidenceBody(strongest, priorByKey.get(strongest.key), targetRoas, comparisonAvailable),
      campaignKey: strongest.key,
    });
  }
  return evidence;
}

export function adsCampaignDecision(
  row: MetaAdsGroup,
  options: { targetRoas?: number; decisionReady?: boolean; previous?: MetaAdsGroup } = {},
): AdsCampaignDecision {
  const targetRoas = options.targetRoas ?? 2;
  const decisionReady = options.decisionReady ?? true;
  const roas = row.roas ?? 0;
  const ctr = row.ctr ?? 0;
  const landingRate = row.landingPageRate;
  const cartRate = row.landingPageViews ? row.addToCart / row.landingPageViews : null;
  const checkoutRate = row.addToCart ? row.initiateCheckout / row.addToCart : null;
  const checkoutPurchaseRate = row.initiateCheckout ? row.purchases / row.initiateCheckout : null;

  if (row.spend >= 20 && row.impressions >= 1_000 && ctr < 0.006) {
    return {
      label: "Fix creative",
      tone: "fix",
      reason: "CTR is below 0.6%, so the hook or creative needs attention before more spend.",
      evidence: {
        label: "Link CTR",
        value: row.ctr,
        format: "percent",
        benchmark: { operator: "gte", value: 0.006 },
        context: { label: "Impressions", value: row.impressions, format: "count" },
      },
    };
  }
  if (row.linkClicks >= 25 && landingRate !== null && landingRate < 0.65) {
    return {
      label: "Fix landing",
      tone: "fix",
      reason: "Too few link clicks become content views; verify the destination and page speed.",
      evidence: {
        label: "Click → content",
        value: landingRate,
        format: "percent",
        benchmark: { operator: "gte", value: 0.65 },
        context: { label: "Link clicks", value: row.linkClicks, format: "count" },
        note: "Content views are a Meta-reported proxy, not a strict landing-page count.",
      },
    };
  }
  if (row.landingPageViews >= 50 && cartRate !== null && cartRate < 0.04) {
    return {
      label: "Fix offer",
      tone: "fix",
      reason: "Content views are not becoming carts; review the product page, offer, and intent match.",
      evidence: {
        label: "Content → cart",
        value: cartRate,
        format: "percent",
        benchmark: { operator: "gte", value: 0.04 },
        context: { label: "Content views", value: row.landingPageViews, format: "count" },
      },
    };
  }
  if (row.addToCart >= 20 && checkoutRate !== null && checkoutRate < 0.35) {
    return {
      label: "Fix cart",
      tone: "fix",
      reason: "Cart intent is not progressing to checkout; review shipping and cart friction.",
      evidence: {
        label: "Cart → checkout",
        value: checkoutRate,
        format: "percent",
        benchmark: { operator: "gte", value: 0.35 },
        context: { label: "Adds to cart", value: row.addToCart, format: "count" },
      },
    };
  }
  if (row.initiateCheckout >= 10 && checkoutPurchaseRate !== null && checkoutPurchaseRate < 0.35) {
    return {
      label: "Fix checkout",
      tone: "fix",
      reason: "Checkout starts are not completing; inspect payment, trust, and checkout friction.",
      evidence: {
        label: "Checkout → purchase",
        value: checkoutPurchaseRate,
        format: "percent",
        benchmark: { operator: "gte", value: 0.35 },
        context: { label: "Checkouts", value: row.initiateCheckout, format: "count" },
      },
    };
  }
  if (row.spend >= 50 && row.purchases === 0) {
    return {
      label: "Fix funnel",
      tone: "fix",
      reason: "Meaningful spend produced no purchases in the selected period.",
      evidence: {
        label: "Purchases",
        value: row.purchases,
        format: "count",
        benchmark: { operator: "gte", value: 1 },
        context: { label: "Spend", value: row.spend, format: "currency" },
      },
    };
  }
  if (row.purchases > 0 && roas > 0 && roas < 1.5) {
    return {
      label: "Watch margin",
      tone: "watch",
      reason: "Purchases exist, but ROAS is below the scale guardrail.",
      evidence: {
        label: "ROAS",
        value: row.roas,
        format: "ratio",
        benchmark: { operator: "gte", value: targetRoas },
        context: { label: "Purchases", value: row.purchases, format: "count" },
      },
    };
  }
  const priorRoas = options.previous?.roas;
  const materiallyDeclining = priorRoas !== null && priorRoas !== undefined && priorRoas > 0 && roas < priorRoas * 0.8;
  if (row.purchases >= 3 && roas >= targetRoas && decisionReady && !materiallyDeclining) {
    return {
      label: "Scale",
      tone: "scale",
      reason: "ROAS and purchase volume clear the scale guardrail with adequate period coverage.",
      evidence: {
        label: "ROAS",
        value: row.roas,
        format: "ratio",
        benchmark: { operator: "gte", value: targetRoas },
        context: { label: "Purchases", value: row.purchases, format: "count" },
      },
    };
  }
  if (!decisionReady && row.purchases >= 3 && roas >= targetRoas) {
    return {
      label: "Needs confirmation",
      tone: "watch",
      reason: "Performance is promising, but the selected period is only partially covered.",
      evidence: {
        label: "ROAS",
        value: row.roas,
        format: "ratio",
        benchmark: { operator: "gte", value: targetRoas },
        context: { label: "Purchases", value: row.purchases, format: "count" },
        note: "Selected-period coverage is incomplete.",
      },
    };
  }
  if (materiallyDeclining && roas >= targetRoas) {
    return {
      label: "Watch trend",
      tone: "watch",
      reason: "ROAS remains above target but fell more than 20% from the prior period.",
      evidence: {
        label: "ROAS vs prior",
        value: priorRoas ? roas / priorRoas - 1 : null,
        format: "percent",
        benchmark: { operator: "gte", value: -0.2 },
        context: { label: "Current ROAS", value: roas, format: "ratio" },
      },
    };
  }
  return {
    label: "Watch",
    tone: "watch",
    reason: "More complete spend, purchase, or funnel evidence is needed before a hard decision.",
    evidence: row.roas !== null
      ? {
          label: "ROAS",
          value: row.roas,
          format: "ratio",
          benchmark: { operator: "gte", value: targetRoas },
          context: { label: "Purchases", value: row.purchases, format: "count" },
        }
      : {
          label: "Purchases",
          value: row.purchases,
          format: "count",
          benchmark: { operator: "gte", value: 3 },
          context: { label: "Spend", value: row.spend, format: "currency" },
          note: "ROAS is not available for this campaign.",
        },
  };
}

function actionConfidence(row: MetaAdsGroup, coverageShare: number): { label: "High" | "Medium" | "Low"; score: number } {
  const volume = Math.min(1, row.purchases / 10);
  const spendSignal = Math.min(1, row.spend / 200);
  const score = Math.round((coverageShare * 0.5 + volume * 0.3 + spendSignal * 0.2) * 100);
  return { label: score >= 75 ? "High" : score >= 50 ? "Medium" : "Low", score };
}

function storyActions(
  current: MetaAdsSummary,
  previous: MetaAdsSummary,
  currentCoverage: AdsPeriodCoverage,
  comparisonAvailable: boolean,
  targetRoas: number,
): AdsStoryAction[] {
  const priorByKey = new Map(previous.byCampaign.map((row) => [row.key, row]));
  const decisionReady = currentCoverage.share >= 0.8;
  const toneRank = { fix: 0, scale: 1, watch: 2 } as const;

  return current.byCampaign
    .filter((row) => row.spend > 0)
    .map((row) => {
      const previousRow = comparisonAvailable ? priorByKey.get(row.key) : undefined;
      const decision = adsCampaignDecision(row, { targetRoas, decisionReady, previous: previousRow });
      const confidence = actionConfidence(row, currentCoverage.share);
      return {
        ...decision,
        key: row.key,
        title: row.campaign,
        confidence: confidence.label,
        confidenceScore: confidence.score,
        spend: row.spend,
        purchases: row.purchases,
        roas: row.roas,
      };
    })
    .sort((a, b) => toneRank[a.tone] - toneRank[b.tone] || b.spend - a.spend);
}

export function buildAdsStoryboard(
  rows: MetaAdsRow[],
  currentWindow: AdsDateWindow,
  targetRoas = 2,
  coverageRows: MetaAdsRow[] = rows,
): AdsStoryboardModel {
  const previousWindow = previousAdsWindow(currentWindow);
  const currentRows = metaAdsRowsInWindow(rows, currentWindow);
  const previousRows = metaAdsRowsInWindow(rows, previousWindow);
  const currentSummary = summarizeMetaAdsRows(currentRows);
  const previousSummary = summarizeMetaAdsRows(previousRows);
  const currentCoverage = coverageForRows(coverageRows, currentWindow);
  const previousCoverage = coverageForRows(coverageRows, previousWindow);
  const comparisonAvailable = comparisonReady(currentCoverage, previousCoverage);
  const daily = dailyStory(currentRows, currentWindow);

  return {
    currentWindow,
    previousWindow,
    currentRows,
    previousRows,
    currentSummary,
    previousSummary,
    currentCoverage,
    previousCoverage,
    comparisonAvailable,
    kpis: kpis(currentSummary, previousSummary, comparisonAvailable),
    daily,
    creativeDiagnostics: creativeDiagnostics(currentSummary),
    events: eventStory(daily, targetRoas),
    evidence: storyEvidence(currentSummary, previousSummary, targetRoas, comparisonAvailable),
    actions: storyActions(currentSummary, previousSummary, currentCoverage, comparisonAvailable, targetRoas),
    targetRoas,
  };
}

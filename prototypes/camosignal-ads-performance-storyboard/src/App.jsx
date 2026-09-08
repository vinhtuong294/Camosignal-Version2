import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowsClockwise,
  BookOpen,
  CalendarDots,
  CaretDown,
  ChartBar,
  CheckCircle,
  CirclesFour,
  ClipboardText,
  Gear,
  House,
  Info,
  List,
  Megaphone,
  ShieldCheck,
  Storefront,
  Tag,
  TShirt,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

const navItems = [
  { label: "Overview", icon: House },
  { label: "Revenue", icon: ChartBar },
  { label: "Products", icon: TShirt },
  { label: "Collections", icon: Tag },
  { label: "Seasonality", icon: CalendarDots },
  { label: "Ads", icon: Megaphone },
  { label: "Blanks & Variants", icon: CirclesFour },
  { label: "Reports", icon: ClipboardText },
  { label: "Methodology", icon: BookOpen },
  { label: "Settings", icon: Gear },
];

const trendPattern = [
  { spend: 620, purchaseValue: 880, roas: 2.05 },
  { spend: 700, purchaseValue: 1020, roas: 2.18 },
  { spend: 710, purchaseValue: 1120, roas: 2.42 },
  { spend: 610, purchaseValue: 920, roas: 2.08 },
  { spend: 560, purchaseValue: 850, roas: 2.04 },
  { spend: 500, purchaseValue: 760, roas: 1.68 },
  { spend: 430, purchaseValue: 600, roas: 1.53 },
  { spend: 390, purchaseValue: 590, roas: 1.43 },
  { spend: 360, purchaseValue: 600, roas: 1.5 },
  { spend: 390, purchaseValue: 620, roas: 1.61 },
  { spend: 400, purchaseValue: 650, roas: 1.68 },
  { spend: 450, purchaseValue: 760, roas: 2.08 },
  { spend: 540, purchaseValue: 870, roas: 2.38 },
  { spend: 580, purchaseValue: 1080, roas: 2.57 },
];

const visibleActions = [
  {
    priority: "Fix first",
    tone: "fix",
    title: "Pause Wild Turkey Run T- (low ROAS)",
    type: "Campaign",
    reason: "ROAS 1.12 vs 2.0 target. High CPA from lower CTR and higher CPM.",
    confidence: "High",
    score: "80%",
    impact: "+$1,240",
  },
  {
    priority: "Watch",
    tone: "watch",
    title: "Optimize Grand Teton National",
    type: "Campaign",
    reason: "ROAS 1.62, close to target. Improve product mix and placements.",
    confidence: "Medium",
    score: "65%",
    impact: "+$320",
  },
  {
    priority: "Scale",
    tone: "scale",
    title: "Scale Mahi Strike Offshore",
    type: "Campaign",
    reason: "ROAS 2.54, strong efficiency and volume. Room to scale profitably.",
    confidence: "High",
    score: "85%",
    impact: "+$1,890",
  },
];

const moreActions = [
  {
    priority: "Watch",
    tone: "watch",
    title: "Refresh Grand Teton creative mix",
    type: "Ad set",
    reason: "Frequency reached 2.7. Rotate one new visual before reach plateaus.",
    confidence: "Medium",
    score: "62%",
    impact: "+$260",
  },
  {
    priority: "Fix first",
    tone: "fix",
    title: "Reduce Wild Turkey retargeting bid",
    type: "Ad set",
    reason: "CPA is 2.1x the account median while conversion volume is falling.",
    confidence: "High",
    score: "78%",
    impact: "+$540",
  },
  {
    priority: "Scale",
    tone: "scale",
    title: "Expand Mahi Strike lookalike",
    type: "Campaign",
    reason: "Strong purchase rate and stable CPA across the last seven days.",
    confidence: "High",
    score: "83%",
    impact: "+$820",
  },
  {
    priority: "Watch",
    tone: "watch",
    title: "Hold It's Lake Time launch test",
    type: "Campaign",
    reason: "Promising CTR, but purchase volume is not yet decision-ready.",
    confidence: "Low",
    score: "48%",
    impact: "+$140",
  },
];

const numberMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function makeTrend(days) {
  const anchor = new Date(Date.UTC(2026, 7, 20));
  return Array.from({ length: days }, (_, index) => {
    const current = new Date(anchor);
    current.setUTCDate(anchor.getUTCDate() - (days - 1 - index));
    const pattern = trendPattern[(index + (14 - (days % 14))) % trendPattern.length];
    const month = current.toLocaleDateString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    return {
      ...pattern,
      date: String(current.getUTCDate()).padStart(2, "0") + " " + month,
    };
  });
}

function IconButton({ label, onClick, children, className = "" }) {
  return (
    <button
      className={"icon-button " + className}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Sidebar({ open, onClose, onNavigate }) {
  return (
    <>
      <aside className={"sidebar " + (open ? "sidebar-open" : "")} aria-label="Main navigation">
        <div className="brand-lockup">
          <img className="brand-logo" src="/assets/camosignal-logo.png" alt="CamoSignal" />
          <div>
            <strong>CamoSignal</strong>
            <span>Insight Engine V2</span>
          </div>
          <IconButton label="Close menu" onClick={onClose} className="sidebar-close">
            <X size={20} weight="bold" />
          </IconButton>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.label === "Ads";
            return (
              <button
                className={"nav-item " + (active ? "active" : "")}
                key={item.label}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate(item.label)}
              >
                <Icon size={19} weight={active ? "fill" : "regular"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <button className="store-card" type="button" onClick={() => onNavigate("Store")}>
          <span className="store-icon"><Storefront size={22} weight="fill" /></span>
          <span><strong>Store</strong><small>online_store</small></span>
        </button>

        <button className="account-card" type="button" onClick={() => onNavigate("Account")}>
          <span className="avatar">N</span>
          <span><strong>CamoSignal Team</strong><small>camosignal.com</small></span>
          <CaretDown size={16} />
        </button>
      </aside>
      {open ? <button className="menu-backdrop" type="button" onClick={onClose} aria-label="Close menu" /> : null}
    </>
  );
}

function KpiCard({ label, value, delta, direction }) {
  const Direction = direction === "down" ? ArrowDown : ArrowUp;

  if (label === "ROAS") {
    return (
      <article className="kpi-card roas-card">
        <span className="kpi-label">{label}</span>
        <div className="roas-main">
          <div>
            <strong className="kpi-value">{value}</strong>
            <small>vs 2.00 target</small>
          </div>
          <div className="roas-change">
            <span><ArrowDown size={15} weight="bold" /><strong>{delta}</strong></span>
            <small>vs 24 Jul–06 Aug</small>
          </div>
        </div>
        <div className="roas-meter" aria-label="ROAS 1.78 versus target 2.00">
          <i />
          <em />
          <small>2.00</small>
        </div>
      </article>
    );
  }

  return (
    <article className="kpi-card">
      <span className="kpi-label">{label}</span>
      <div className="kpi-value-row"><strong className="kpi-value">{value}</strong></div>
      <div className={"kpi-delta " + (direction === "down" ? "negative" : "positive")}>
        <Direction size={15} weight="bold" />
        <strong>{delta}</strong>
        <span>vs 24 Jul–06 Aug</span>
      </div>
    </article>
  );
}

function StoryChart({ days }) {
  const data = useMemo(() => makeTrend(days), [days]);
  const chartOption = useMemo(
    () => ({
      animationDuration: 500,
      color: ["#064a31", "#c9e8d9", "#165f43"],
      grid: { left: 52, right: 46, top: 16, bottom: 38 },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#ffffff",
        borderColor: "#dce3df",
        textStyle: { color: "#111827", fontFamily: "Roboto, Arial, sans-serif", fontSize: 12 },
        formatter: (params) => {
          const row = data[params[0]?.dataIndex || 0];
          return [
            "<strong>" + row.date + "</strong>",
            "Spend: " + numberMoney(row.spend),
            "Purchase value: " + numberMoney(row.purchaseValue),
            "ROAS: " + row.roas.toFixed(2),
          ].join("<br/>");
        },
      },
      xAxis: {
        type: "category",
        data: data.map((point) => point.date),
        axisLine: { lineStyle: { color: "#dce3df" } },
        axisTick: { show: false },
        axisLabel: {
          color: "#647064",
          fontFamily: "Roboto, Arial, sans-serif",
          fontSize: 11,
          interval: days <= 7 ? 0 : days <= 14 ? 1 : 4,
          hideOverlap: true,
        },
      },
      yAxis: [
        {
          type: "value",
          min: 0,
          max: 2000,
          interval: 500,
          axisLabel: {
            color: "#647064",
            fontSize: 11,
            formatter: (value) => (value === 0 ? "$0" : value >= 1000 ? "$" + value / 1000 + "K" : "$" + value),
          },
          splitLine: { lineStyle: { color: "#edf2ef" } },
        },
        {
          type: "value",
          min: 0,
          max: 3,
          interval: 0.5,
          axisLabel: { color: "#647064", fontSize: 11, formatter: (value) => Number(value).toFixed(1) },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "Spend",
          type: "bar",
          data: data.map((point) => point.spend),
          barMaxWidth: 13,
          itemStyle: { color: "#064a31", borderRadius: [2, 2, 0, 0] },
        },
        {
          name: "Purchase value",
          type: "bar",
          data: data.map((point) => point.purchaseValue),
          barMaxWidth: 13,
          itemStyle: { color: "#c9e8d9", borderRadius: [2, 2, 0, 0] },
        },
        {
          name: "ROAS",
          type: "line",
          yAxisIndex: 1,
          data: data.map((point) => point.roas),
          smooth: 0.35,
          showSymbol: false,
          lineStyle: { color: "#165f43", width: 2 },
          markLine: {
            symbol: "none",
            silent: true,
            lineStyle: { color: "#5e7f70", type: "dashed", width: 1 },
            label: { show: false },
            data: [{ yAxis: 2 }],
          },
        },
      ],
      media: [
        {
          query: { maxWidth: 500 },
          option: {
            xAxis: {
              axisLabel: {
                interval: days <= 7 ? 1 : 3,
                hideOverlap: true,
              },
            },
          },
        },
      ],
    }),
    [data, days],
  );

  return (
    <div className="chart-wrap" aria-label="Spend, purchase value, and ROAS trend chart">
      <ReactECharts option={chartOption} style={{ width: "100%", height: "100%" }} notMerge lazyUpdate />
    </div>
  );
}

function PerformanceStory({ days }) {
  return (
    <section className="card story-card">
      <div className="section-heading">
        <h2>Performance story</h2>
        <div className="legend" aria-label="Chart legend">
          <span><i className="legend-spend" />Spend</span>
          <span><i className="legend-value" />Purchase value</span>
          <span><i className="legend-benchmark" />ROAS 2.0 benchmark</span>
        </div>
      </div>

      <div className="story-events">
        <div className="event-note negative">
          <span><ArrowDown size={16} weight="bold" /></span>
          <p>Spend spike on 08 Aug<br />didn't convert</p>
        </div>
        <div className="event-note warning">
          <span><WarningCircle size={16} weight="bold" /></span>
          <p>ROAS below 2.0<br />12–15 Aug</p>
        </div>
        <div className="event-note positive">
          <span><ArrowUp size={16} weight="bold" /></span>
          <p>ROAS recovered<br />from 17 Aug</p>
        </div>
      </div>

      <StoryChart days={days} />

      <div className="comparison">
        <div className="comparison-metrics">
          <strong>vs 24 Jul – 06 Aug</strong>
          <div className="metric-grid">
            <span>Spend <b className="positive">+12.4%</b></span>
            <span>Purchase value <b className="positive">+18.2%</b></span>
            <span>ROAS <b className="negative">-11.0%</b></span>
            <span>CPA <b className="positive">-4.8%</b></span>
          </div>
        </div>
        <div className="benchmark-note">
          <strong>ROAS 2.0 benchmark</strong>
          <p>ROAS of 2.0 is our profitability threshold for paid acquisition.</p>
          <Info size={16} aria-label="Benchmark information" />
        </div>
      </div>
    </section>
  );
}

function WhyPanel({ onSourceDetails }) {
  return (
    <aside className="card why-panel">
      <h2>Why it changed</h2>
      <div className="evidence-block">
        <span className="evidence-icon negative"><WarningCircle size={18} weight="fill" /></span>
        <div>
          <small>Weak segment</small>
          <strong>Wild Turkey Run T-</strong>
          <p>ROAS 1.12 vs 2.0 target. CPM up 22% and CTR down 18% vs prior period, driving higher CPA.</p>
        </div>
      </div>
      <div className="evidence-block">
        <span className="evidence-icon positive"><ArrowUp size={17} weight="bold" /></span>
        <div>
          <small>Positive segment</small>
          <strong>Mahi Strike Offshore</strong>
          <p>ROAS 2.54 vs 2.0 target. CTR up 23% and CVR up 16% vs prior period, driving stronger efficiency.</p>
        </div>
      </div>
      <div className="evidence-block confidence">
        <span className="evidence-icon confidence"><ShieldCheck size={18} weight="fill" /></span>
        <div>
          <small>Data confidence <em>High</em></small>
          <p>All campaigns reporting. 100% of spend covered with no failed syncs.</p>
          <button className="text-button" type="button" onClick={onSourceDetails}>View source details</button>
        </div>
      </div>
      <p className="data-stamp">Data as of 20 Aug 2026, 09:42</p>
    </aside>
  );
}

function ActionRow({ action, onReview }) {
  return (
    <div className="action-row">
      <div className="action-priority"><span className={"priority-pill " + action.tone}>{action.priority}</span></div>
      <div className="action-title"><strong>{action.title}</strong><small>{action.type}</small></div>
      <p className="action-reason">{action.reason}</p>
      <div className="action-confidence"><strong>{action.confidence}</strong><span>{action.score}</span></div>
      <div className="action-impact"><strong>{action.impact}</strong><small>/14 days</small></div>
      <button className="primary-button compact" type="button" onClick={() => onReview(action)}>Review actions</button>
    </div>
  );
}

function ActionsTable({ onReview }) {
  const [showAll, setShowAll] = useState(false);
  const actions = showAll ? [...visibleActions, ...moreActions] : visibleActions;
  return (
    <section className="card actions-card" id="recommended-actions">
      <h2>Recommended next actions</h2>
      <div className="actions-head" aria-hidden="true">
        <span>Priority</span><span>Action</span><span>Reason</span><span>Confidence</span><span>Est. impact</span><span />
      </div>
      <div className="actions-list">
        {actions.map((action) => <ActionRow key={action.title} action={action} onReview={onReview} />)}
      </div>
      <button className="view-all" type="button" onClick={() => setShowAll((current) => !current)}>
        {showAll ? "Show top actions" : "View all actions (7)"}
        <CaretDown className={showAll ? "rotate" : ""} size={16} weight="bold" />
      </button>
    </section>
  );
}

function SidePanel({ type, action, onClose, onSync }) {
  if (!type) return null;
  return (
    <div className="panel-layer" role="presentation">
      <button className="panel-backdrop" type="button" onClick={onClose} aria-label="Close panel" />
      <aside className="detail-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{type === "source" ? "Data source" : "Recommended action"}</span>
            <h2 id="panel-title">{type === "source" ? "Google Sheets connection" : action?.title}</h2>
          </div>
          <IconButton label="Close panel" onClick={onClose}><X size={20} weight="bold" /></IconButton>
        </div>

        {type === "source" ? (
          <div className="panel-content">
            <div className="demo-notice">
              <Info size={19} weight="fill" />
              <p><strong>Demo data</strong>This prototype does not access a live Google Sheet or Ads account.</p>
            </div>
            <dl className="source-list">
              <div><dt>Status</dt><dd><CheckCircle size={17} weight="fill" />Healthy</dd></div>
              <div><dt>Last demo sync</dt><dd>20 Aug 2026, 09:42</dd></div>
              <div><dt>Coverage</dt><dd>100%</dd></div>
              <div><dt>Campaign rows</dt><dd>9,917</dd></div>
              <div><dt>Mapping confidence</dt><dd>High</dd></div>
            </dl>
            <button className="primary-button panel-action" type="button" onClick={onSync}>
              <ArrowsClockwise size={17} weight="bold" />Refresh demo sync
            </button>
          </div>
        ) : (
          <div className="panel-content">
            <span className={"priority-pill " + action?.tone}>{action?.priority}</span>
            <div className="action-detail"><h3>Why this is recommended</h3><p>{action?.reason}</p></div>
            <div className="decision-stats">
              <div><small>Confidence</small><strong>{action?.confidence} · {action?.score}</strong></div>
              <div><small>Estimated impact</small><strong>{action?.impact} /14 days</strong></div>
            </div>
            <div className="action-detail">
              <h3>Suggested next step</h3>
              <p>
                {action?.tone === "scale"
                  ? "Increase budget by 15–20%, then watch CPA and margin for 48 hours."
                  : action?.tone === "fix"
                    ? "Pause the weakest creative and replace the hook before restoring spend."
                    : "Hold budget steady while gathering enough purchases for a confident decision."}
              </p>
            </div>
            <button className="primary-button panel-action" type="button" onClick={onClose}>
              Mark as reviewed<ArrowRight size={17} weight="bold" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [period, setPeriod] = useState("14");
  const [channel, setChannel] = useState("online_store");
  const [panel, setPanel] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [toast, setToast] = useState("");

  const factor = Number(period) / 14;
  const spend = Math.round(8420 * factor);
  const purchaseValue = Math.round(14980 * factor);
  const rangeLabel =
    period === "7"
      ? "14 Aug 2026 – 20 Aug 2026"
      : period === "30"
        ? "22 Jul 2026 – 20 Aug 2026"
        : "07 Aug 2026 – 20 Aug 2026";

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => setToast(""), 2600);
  }

  function handleNavigation(label) {
    setMenuOpen(false);
    if (label !== "Ads") showToast(label + " is outside this Ads prototype.");
  }

  function reviewAction(action) {
    setSelectedAction(action);
    setPanel("action");
  }

  function syncDemo() {
    showToast("Demo source refreshed successfully.");
    setPanel(null);
  }

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={handleNavigation} />

      <main className="dashboard-main">
        <header className="mobile-header">
          <IconButton label="Open menu" onClick={() => setMenuOpen(true)}><List size={23} weight="bold" /></IconButton>
          <div className="mobile-brand"><img src="/assets/camosignal-logo.png" alt="" /><strong>CamoSignal</strong></div>
          <IconButton label="Open source details" onClick={() => setPanel("source")}><ShieldCheck size={22} weight="fill" /></IconButton>
        </header>

        <div className="top-controls">
          <label className="filter-control">
            <CalendarDots size={19} />
            <span className="sr-only">Date preset</span>
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
            <CaretDown size={15} weight="bold" aria-hidden="true" />
          </label>

          <button className="filter-control filter-date" type="button" onClick={() => showToast("Use the date preset to change this prototype range.")}>
            <CalendarDots size={19} /><strong>{rangeLabel}</strong><CalendarDots size={18} />
          </button>

          <label className="filter-control">
            <span className="sr-only">Sales channel</span>
            <select value={channel} onChange={(event) => setChannel(event.target.value)}>
              <option value="online_store">online_store</option>
              <option value="all_channels">All channels</option>
            </select>
            <CaretDown size={15} weight="bold" aria-hidden="true" />
          </label>
        </div>

        <section className="source-strip" aria-label="Data source status">
          <div className="source-primary">
            <CheckCircle size={18} weight="fill" /><strong>Google Sheets live</strong><span className="demo-pill">Demo data</span>
          </div>
          <span className="source-divider">•</span>
          <span className="source-meta">Synced 09:42, 20 Aug 2026</span>
          <span className="source-divider source-meta-extra">•</span>
          <span className="source-meta source-meta-extra">100% coverage</span>
          <span className="source-divider source-meta-extra">•</span>
          <span className="source-meta source-meta-extra">High confidence</span>
          <button className="text-button source-details" type="button" onClick={() => setPanel("source")}>Source details</button>
        </section>

        <section className="kpi-grid" aria-label="Advertising KPIs">
          <KpiCard label="Spend" value={numberMoney(spend)} delta="12.4%" />
          <KpiCard label="Purchase value" value={numberMoney(purchaseValue)} delta="18.2%" />
          <KpiCard label="ROAS" value="1.78" delta="11.0%" direction="down" />
          <KpiCard label="CPA" value="$28.55" delta="-4.8%" />
        </section>

        <div className="story-layout">
          <PerformanceStory days={Number(period)} />
          <WhyPanel onSourceDetails={() => setPanel("source")} />
        </div>

        <ActionsTable onReview={reviewAction} />
        <p className="page-note">Figures exclude refunds and taxes.</p>
      </main>

      <SidePanel type={panel} action={selectedAction} onClose={() => setPanel(null)} onSync={syncDemo} />

      {toast ? <div className="toast" role="status"><CheckCircle size={18} weight="fill" />{toast}</div> : null}
    </div>
  );
}

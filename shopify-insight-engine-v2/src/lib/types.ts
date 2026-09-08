export type ProductAction = "scale" | "watch" | "fix";

export type CoverageState = "live" | "missing" | "manual";

export type DailyPoint = {
  date: string;
  netSales: number;
  orders: number;
  sessions?: number;
};

export type ProductPoint = {
  id: string;
  title: string;
  handle: string;
  imageUrl: string;
  productType: string;
  apparelType: string;
  theme: string;
  designFamily: string;
  collections: string[];
  tags: string[];
  descriptionText: string;
  listingDate: string;
  currentSales: number;
  previousSales: number;
  currentOrders: number;
  previousOrders: number;
  unitsSold: number;
  inventory: number;
  daysOfCover: number | null;
  confidence: number;
  roas: number | null;
  action: ProductAction;
  actionReason: string;
  source: "Shopify collection" | "Product title" | "Product type" | "Description";
  daily: DailyPoint[];
};

export type MetricCard = {
  label: string;
  value: string;
  delta: number | null;
  helper: string;
};

export type ThemeRow = {
  theme: string;
  status: "In season" | "Pre-season" | "Off-season" | "Event";
  revenue: number;
  share: number;
  products: number;
};

export type BlankPerformanceRow = {
  label: string;
  revenue: number;
  orders: number;
  products: number;
};

export type CustomerLifecycleSegment = "new" | "returning" | "unknown";

export type CustomerLifecycleRow = {
  segment: CustomerLifecycleSegment;
  label: string;
  revenue: number;
  orders: number;
  discounts: number;
  grossSales: number;
  share: number;
  aov: number;
  discountRate: number;
};

export type CustomerLifecycleSummary = {
  available: boolean;
  rows: CustomerLifecycleRow[];
  newCustomerRevenueShare: number;
  returningRevenueShare: number;
  unknownRevenueShare: number;
  newCustomerDiscountRate: number;
  returningDiscountRate: number;
  diagnosis: string;
};

export type GrowthCoverageState = "live" | "estimated" | "partial" | "missing";

export type GrowthCoverageDetail = {
  state: GrowthCoverageState;
  source: string;
  reason: string;
};

export type GrowthPeriodSnapshot = {
  humanSessions: number | null;
  uniqueBuyers: number | null;
  guestOrders: number | null;
  estimatedPopupSignups: number | null;
  estimatedPopupSignupBuyers: number | null;
  popupAudienceBuyers: number | null;
  popupAudienceRevenue: number | null;
};

export type PopupSegmentKey = "deer" | "turkey" | "freshwater" | "saltwater" | "seasonal";

export type PopupSegmentRow = {
  key: PopupSegmentKey;
  label: string;
  customers: number;
  share: number | null;
  periodBuyers: number | null;
  buyerRate: number | null;
  periodOrders: number | null;
  periodRevenue: number | null;
  aov: number | null;
};

export type PopupSelectionDepthKey = "one" | "two" | "three_plus";

export type PopupSelectionDepthRow = {
  key: PopupSelectionDepthKey;
  label: string;
  customers: number;
  share: number | null;
  periodBuyers: number | null;
  buyerRate: number | null;
  periodOrders: number | null;
  periodRevenue: number | null;
  aov: number | null;
};

export type GrowthSummary = {
  current: GrowthPeriodSnapshot;
  previous: GrowthPeriodSnapshot;
  popupAudience: {
    customers: number | null;
    activeEmailSubscribers: number | null;
    periodSignups: number | null;
    unclassifiedSignups: number | null;
    segments: PopupSegmentRow[];
    selectionDepth: PopupSelectionDepthRow[];
    multiSelect: true;
    tagStateBasis: "current_customer_tags";
  };
  rates: {
    sessionToSignup: number | null;
    signupToBuyer: number | null;
    sessionToSignupBuyer: number | null;
    popupAudienceBuyerRate: number | null;
  };
  buyerScope: "online_store" | "all";
  funnelBuyerScope: "online_store";
  signupDateBasis: "marketing_updated_at_then_customer_created_at_estimate";
  sample: boolean;
  coverage: {
    sessions: GrowthCoverageDetail;
    buyers: GrowthCoverageDetail;
    popupAudience: GrowthCoverageDetail;
  };
};

export type AppAnalysis = {
  generatedAt: string;
  periodLabel: string;
  comparisonLabel: string;
  currency: "USD";
  coverage: {
    shopify: CoverageState;
    metaAds: CoverageState;
  };
  metrics: MetricCard[];
  daily: DailyPoint[];
  products: ProductPoint[];
  blankPerformance: BlankPerformanceRow[];
  themes: ThemeRow[];
  customerLifecycle: CustomerLifecycleSummary;
  growth?: GrowthSummary;
};

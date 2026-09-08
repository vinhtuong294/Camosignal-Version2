"use client";

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Download,
  Gauge,
  ImageIcon,
  Layers3,
  Menu,
  Megaphone,
  PackageSearch,
  RefreshCcw,
  Settings,
  Shirt,
  Sparkles,
  Tags,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AdsPerformanceStoryboard,
  type AdsActionView,
  type AdsSourceView,
} from "@/components/ads-performance-storyboard";
import { GrowthOverview } from "@/components/growth-overview";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarHeatmap,
  ProductMiniTrend,
  ProductTypeBars,
  RevenueTrendChart,
} from "@/components/charts";
import {
  actionGroups,
  actionLabel,
  actionTone,
  analysisTotals,
  deltaTone,
  listingAgeDays,
  money,
  number,
  percent,
  productAov,
  productDelta,
  rawPercent,
} from "@/lib/analytics";
import {
  adsCampaignDecision,
  buildAdsStoryboard,
  type AdsDecisionEvidence,
  type AdsStoryAction,
} from "@/lib/ads-storyboard";
import {
  parseMetaAdsImport,
  summarizeMetaAdsRows,
  type MetaAdsGroup,
  type MetaAdsRow,
} from "@/lib/meta-ads-import";
import type { AppAnalysis, ProductAction, ProductPoint } from "@/lib/types";

const SHOPIFY_SESSION_STORAGE_KEY = "csi_shopify_session";
const META_ADS_STORAGE_KEY = "csi_meta_ads_import";
const META_ADS_MAPPING_STORAGE_KEY = "csi_meta_ads_product_mapping";
const META_ALL_SCOPE = "__all__";
const DEFAULT_SHOPIFY_STORE_DOMAIN = "apepsd-ha.myshopify.com";
const INSIGHTS_REQUEST_TIMEOUT_MS = 25_000;
let inMemoryShopifySession = "";
let inFlightShopifySession: Promise<boolean> | null = null;

declare global {
  interface Window {
    shopify?: {
      config?: {
        shop?: string;
      };
      idToken?: () => Promise<string>;
    };
  }
}

type ViewKey =
  | "overview"
  | "customers"
  | "revenue"
  | "products"
  | "collections"
  | "seasonality"
  | "ads"
  | "blanks"
  | "reports"
  | "methodology"
  | "settings";

type DatePreset = "Today" | "Yesterday" | "7 days" | "14 days" | "30 days" | "Custom";
type SalesChannelFilter = "online_store" | "all";
type DateWindow = {
  start: string;
  end: string;
};
type MetaAdsCoverageDisplay = {
  state: "Loading" | "Live" | "Manual" | "Missing";
  value: string;
};

type NavigationItem = { id: ViewKey; label: string; icon: typeof Gauge };

const navGroups = [
  {
    label: "Performance",
    items: [
      { id: "overview", label: "Overview", icon: Gauge },
      { id: "revenue", label: "Revenue", icon: BarChart3 },
      { id: "seasonality", label: "Seasonality", icon: CalendarDays },
    ],
  },
  {
    label: "Customer",
    items: [{ id: "customers", label: "Customers", icon: Users }],
  },
  {
    label: "Marketing",
    items: [{ id: "ads", label: "Ads", icon: Megaphone }],
  },
  {
    label: "Catalog",
    items: [
      { id: "products", label: "Products", icon: Shirt },
      { id: "collections", label: "Collections", icon: Tags },
      { id: "blanks", label: "Blanks & Variants", icon: Boxes },
    ],
  },
  {
    label: "System",
    items: [
      { id: "reports", label: "Reports", icon: ClipboardList },
      { id: "methodology", label: "Methodology", icon: BookOpen },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
] satisfies { label: string; items: NavigationItem[] }[];

function NavigationMenu({
  activeView,
  onSelect,
  mobile = false,
}: {
  activeView: ViewKey;
  onSelect: (view: ViewKey) => void;
  mobile?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {navGroups.map((group) => {
        const groupActive = group.items.some((item) => item.id === activeView);

        return (
          <section key={group.label} aria-label={`${group.label} navigation`}>
            <div className={`mb-1 px-3 text-[10px] font-black uppercase tracking-[0.16em] ${
              groupActive ? "text-emerald-800" : "text-slate-400"
            }`}>
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={activeView === item.id ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg border-l-2 px-3 text-left text-sm font-bold transition ${
                    mobile ? "min-h-11" : "min-h-9"
                  } ${
                    activeView === item.id
                      ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const actionCopy: Record<ProductAction, { title: string; subtitle: string }> = {
  scale: { title: "Scale", subtitle: "Increase only with stock and ROAS guardrails" },
  watch: { title: "Watch", subtitle: "Needs more signal before a hard action" },
  fix: { title: "Fix first", subtitle: "Do not scale until the drag is explained" },
};

function browserStorage(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function safeStorageGet(kind: "local" | "session", key: string): string {
  try {
    return browserStorage(kind)?.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeStorageSet(kind: "local" | "session", key: string, value: string) {
  try {
    browserStorage(kind)?.setItem(key, value);
  } catch {
    // Storage can be blocked in embedded Shopify contexts; auth must continue without it.
  }
}

function safeStorageRemove(kind: "local" | "session", key: string) {
  try {
    browserStorage(kind)?.removeItem(key);
  } catch {
    // Storage can be blocked in embedded Shopify contexts; auth must continue without it.
  }
}

type MethodologyRow = {
  term: string;
  meaning: string;
  formula: string;
  usage: string;
};

const englishMethodology: MethodologyRow[] = [
  {
    term: "Net sales",
    meaning: "Revenue recognized from Shopify orders after order-level discounts and refunds in the selected period.",
    formula: "Sum(order.currentTotalPriceSet.shopMoney.amount)",
    usage: "Primary revenue KPI. Used in trend charts, product ranking, period comparison, and customer lifecycle revenue share.",
  },
  {
    term: "Orders",
    meaning: "Unique Shopify orders processed inside the selected date window.",
    formula: "Count(unique order.id)",
    usage: "Used to calculate AOV, sample size, product signal strength, and daily sales velocity.",
  },
  {
    term: "Gross sales",
    meaning: "Order subtotal before discounts and refunds. This is the base for discount and refund pressure.",
    formula: "Sum(order.currentSubtotalPriceSet.shopMoney.amount)",
    usage: "Denominator for Discount rate and Refund rate, so margin pressure is not hidden by net sales.",
  },
  {
    term: "AOV",
    meaning: "Average order value. It shows how much revenue each order produces on average.",
    formula: "Net sales / Orders",
    usage: "If AOV falls while discount rate rises, the dashboard checks whether the issue is acquisition, retention, or product mix.",
  },
  {
    term: "Discount rate",
    meaning: "The share of gross sales given away as discounts.",
    formula: "Discounts / Gross sales",
    usage: "Used to detect whether revenue is being protected by margin-heavy offers. Interpreted with customer lifecycle when available.",
  },
  {
    term: "Refund rate",
    meaning: "The share of gross sales returned or refunded.",
    formula: "Refunds / Gross sales",
    usage: "Used as a quality signal for product, fulfillment, expectation setting, and post-purchase experience.",
  },
  {
    term: "Revenue change",
    meaning: "Relative movement between the selected period and the comparison period.",
    formula: "(Current revenue - Comparison revenue) / abs(Comparison revenue)",
    usage: "Used to decide whether a product is growing, weakening, or materially dragging revenue.",
  },
  {
    term: "Product revenue",
    meaning: "Net revenue attributed to a product from its Shopify line items.",
    formula: "Sum(lineItem.discountedTotalSet.shopMoney.amount)",
    usage: "Used to rank products and separate product-level winners from products that only look good at store level.",
  },
  {
    term: "Scale",
    meaning: "A product has enough positive signal to consider increasing traffic or budget.",
    formula: "Current orders >= 10 AND revenue change >= +8%",
    usage: "A scale label is still guarded by stock cover and Meta ROAS. Revenue alone is not enough for aggressive scaling.",
  },
  {
    term: "Watch",
    meaning: "A product does not have enough clean evidence for a hard scale or fix decision.",
    formula: "Default state when Scale and Fix first rules are not met",
    usage: "Used for new listings, low sample sizes, missing spend data, or mixed signals.",
  },
  {
    term: "Fix first",
    meaning: "A product is weak enough that traffic should not be increased until the cause is checked.",
    formula: "Current orders >= 10 AND previous sales > 0 AND revenue change <= -25% AND listing age >= 14 days",
    usage: "Used to flag products that need product page, creative, price, season timing, or collection placement review.",
  },
  {
    term: "Signal strength",
    meaning: "A signal-quality score for the product insight, not a guarantee that the product will win.",
    formula: "35 base + order volume + collections + listing date + image + description, capped at 96",
    usage: "High score means the recommendation is based on more complete evidence. Low score means more data is needed.",
  },
  {
    term: "Days of cover",
    meaning: "Estimated days before current inventory runs out at recent sales velocity.",
    formula: "Inventory / Average daily units sold",
    usage: "Used as a scale guardrail. Strong products with low cover should be replenished before traffic is increased.",
  },
  {
    term: "Customer lifecycle",
    meaning: "Revenue split between first-time customers, returning customers, and guest/unmatched orders.",
    formula: "Returning if customer.numberOfOrders > 1; first-time if customer.numberOfOrders <= 1; unknown if no customer access",
    usage: "Used to understand whether discount pressure is healthy retention or expensive new-customer acquisition.",
  },
  {
    term: "Theme classification",
    meaning: "Product grouping based on Shopify collections, tags, title, product type, and description.",
    formula: "Collection/tag/title/description keyword matching with source evidence",
    usage: "Used for hunting, fishing, patriotic, national park, and event-season analysis without assigning products randomly.",
  },
  {
    term: "ROAS",
    meaning: "Return on ad spend. It measures how much revenue is generated for each dollar of ad spend.",
    formula: "Attributed revenue / Meta Ads spend",
    usage: "Used as a traffic guardrail when Meta Ads data is connected or imported. It is shown as missing until spend data exists.",
  },
];

const vietnameseMethodology: MethodologyRow[] = [
  {
    term: "Doanh thu thuần",
    meaning: "Doanh thu từ đơn Shopify sau giảm giá và hoàn tiền trong kỳ đang chọn.",
    formula: "Tổng order.currentTotalPriceSet.shopMoney.amount",
    usage: "Chỉ số doanh thu chính. Dùng cho biểu đồ xu hướng, xếp hạng sản phẩm, so sánh kỳ và tỷ trọng doanh thu theo nhóm khách hàng.",
  },
  {
    term: "Đơn hàng",
    meaning: "Số đơn Shopify duy nhất được xử lý trong khoảng ngày đang chọn.",
    formula: "Đếm order.id duy nhất",
    usage: "Dùng để tính AOV, kiểm tra cỡ mẫu, độ mạnh tín hiệu sản phẩm và tốc độ bán theo ngày.",
  },
  {
    term: "Doanh thu gộp",
    meaning: "Subtotal đơn hàng trước giảm giá và hoàn tiền. Đây là nền để đo áp lực giảm giá/hoàn tiền.",
    formula: "Tổng order.currentSubtotalPriceSet.shopMoney.amount",
    usage: "Làm mẫu số cho tỷ lệ giảm giá và tỷ lệ hoàn tiền để không che mất áp lực biên lợi nhuận.",
  },
  {
    term: "AOV",
    meaning: "Giá trị đơn trung bình. Cho biết mỗi đơn tạo ra bao nhiêu doanh thu trung bình.",
    formula: "Doanh thu thuần / Đơn hàng",
    usage: "Nếu AOV giảm trong khi discount tăng, app sẽ kiểm tra vấn đề nằm ở khách mới, khách cũ hay cơ cấu sản phẩm.",
  },
  {
    term: "Tỷ lệ giảm giá",
    meaning: "Phần doanh thu gộp đã dùng để giảm giá.",
    formula: "Giảm giá / Doanh thu gộp",
    usage: "Dùng để phát hiện doanh thu đang được giữ bằng ưu đãi nặng biên lợi nhuận. Khi có dữ liệu khách hàng, sẽ đọc cùng lifecycle.",
  },
  {
    term: "Tỷ lệ hoàn tiền",
    meaning: "Phần doanh thu gộp bị hoàn hoặc refund.",
    formula: "Hoàn tiền / Doanh thu gộp",
    usage: "Là tín hiệu chất lượng về sản phẩm, fulfillment, kỳ vọng khách hàng và trải nghiệm sau mua.",
  },
  {
    term: "Mức thay đổi doanh thu",
    meaning: "Mức tăng/giảm tương đối giữa kỳ đang chọn và kỳ so sánh.",
    formula: "(Doanh thu kỳ hiện tại - Doanh thu kỳ so sánh) / abs(Doanh thu kỳ so sánh)",
    usage: "Dùng để nhận biết sản phẩm đang tăng, yếu đi, hoặc đang kéo doanh thu xuống đáng kể.",
  },
  {
    term: "Doanh thu sản phẩm",
    meaning: "Doanh thu thuần gán cho từng sản phẩm từ line item Shopify.",
    formula: "Tổng lineItem.discountedTotalSet.shopMoney.amount",
    usage: "Dùng để xếp hạng sản phẩm và tách winner/loser ở cấp sản phẩm, không chỉ nhìn tổng store.",
  },
  {
    term: "Scale",
    meaning: "Sản phẩm có tín hiệu tăng đủ tốt để cân nhắc tăng traffic hoặc ngân sách.",
    formula: "Đơn hiện tại >= 10 VÀ doanh thu tăng >= +8%",
    usage: "Vẫn cần kiểm tra tồn kho và ROAS Meta trước khi scale mạnh. Doanh thu đơn thuần chưa đủ.",
  },
  {
    term: "Watch",
    meaning: "Sản phẩm chưa có đủ bằng chứng sạch để scale hoặc fix mạnh.",
    formula: "Trạng thái mặc định khi chưa đạt điều kiện Scale hoặc Fix first",
    usage: "Dùng cho sản phẩm mới, cỡ mẫu thấp, thiếu dữ liệu ads, hoặc tín hiệu lẫn lộn.",
  },
  {
    term: "Fix first",
    meaning: "Sản phẩm yếu tới mức không nên tăng traffic trước khi kiểm tra nguyên nhân.",
    formula: "Đơn hiện tại >= 10 VÀ có doanh thu kỳ trước VÀ doanh thu giảm <= -25% VÀ listing age >= 14 ngày",
    usage: "Dùng để nhắc kiểm tra product page, creative, giá, mùa vụ, và vị trí collection trước khi đẩy traffic.",
  },
  {
    term: "Độ mạnh tín hiệu",
    meaning: "Điểm tin cậy của insight sản phẩm, không phải cam kết sản phẩm chắc chắn thắng.",
    formula: "35 điểm nền + số đơn + collection + ngày listing + ảnh + mô tả, tối đa 96",
    usage: "Điểm cao nghĩa là khuyến nghị dựa trên nhiều bằng chứng hơn. Điểm thấp nghĩa là cần thêm dữ liệu.",
  },
  {
    term: "Số ngày đủ hàng",
    meaning: "Ước tính số ngày tồn kho còn đủ bán theo tốc độ bán gần đây.",
    formula: "Tồn kho / Số unit bán trung bình mỗi ngày",
    usage: "Là rào chắn trước khi scale. Sản phẩm mạnh nhưng cover thấp nên bổ sung hàng trước khi tăng traffic.",
  },
  {
    term: "Vòng đời khách hàng",
    meaning: "Tách doanh thu theo khách mới, khách quay lại, và đơn guest/không khớp khách hàng.",
    formula: "Returning nếu customer.numberOfOrders > 1; first-time nếu <= 1; unknown nếu chưa có quyền customer",
    usage: "Dùng để biết discount đang hỗ trợ khách cũ quay lại hay đang đốt biên lợi nhuận để mua khách mới.",
  },
  {
    term: "Phân loại theme",
    meaning: "Nhóm sản phẩm theo Shopify collections, tags, title, product type và description.",
    formula: "Khớp từ khóa từ collection/tag/title/description kèm nguồn bằng chứng",
    usage: "Dùng cho phân tích hunting, fishing, patriotic, national park và mùa vụ/event mà không gán sản phẩm bừa.",
  },
  {
    term: "ROAS",
    meaning: "Doanh thu trên chi phí quảng cáo. Cho biết mỗi 1 đô ads tạo ra bao nhiêu doanh thu.",
    formula: "Doanh thu attributed / Chi phí Meta Ads",
    usage: "Làm rào chắn traffic khi dữ liệu Meta Ads được kết nối hoặc import. Nếu chưa có spend, app sẽ báo missing.",
  },
];

const additionalEnglishMethodology: MethodologyRow[] = [
  {
    term: "Confidence",
    meaning: "Legacy name for Signal strength. It means insight confidence, not product success probability.",
    formula: "Same formula as Signal strength",
    usage: "Kept here as an alias because older screens and conversations may still call it Confidence.",
  },
  {
    term: "Current period",
    meaning: "The date range currently selected in the toolbar.",
    formula: "Today, Yesterday, Last 7/14/30 days, or custom start/end dates in Shopify time",
    usage: "All KPI cards, charts, and product actions are calculated from this period.",
  },
  {
    term: "Comparison period",
    meaning: "The previous date window with the same length as the current period.",
    formula: "Previous start = current start - days; previous end = current start - 1 day",
    usage: "Used to calculate growth, decline, badges, and product action labels.",
  },
  {
    term: "Listing age",
    meaning: "How long a product has been live based on Shopify listing/published date.",
    formula: "Today - product.publishedAt or product.createdAt",
    usage: "Prevents new products from being judged too harshly before enough data exists.",
  },
  {
    term: "Units sold",
    meaning: "Total units sold from Shopify line item quantities.",
    formula: "Sum(lineItem.quantity)",
    usage: "Used for inventory velocity and product detail context.",
  },
  {
    term: "Inventory",
    meaning: "Current variant inventory quantity reported by Shopify.",
    formula: "variant.inventoryQuantity",
    usage: "Used with units sold to estimate days of cover and avoid scaling low-stock products.",
  },
  {
    term: "Product type",
    meaning: "The raw product type from Shopify.",
    formula: "product.productType",
    usage: "Used as a fallback classification source when collection/tag evidence is weak.",
  },
  {
    term: "Apparel type",
    meaning: "Normalized blank/product category such as Hoodie, T-shirt, Sweatshirt, Tank top, or Hat.",
    formula: "Keyword rules from product type + title",
    usage: "Used in product filtering and blank/product type performance charts.",
  },
  {
    term: "Collection",
    meaning: "Shopify collection membership for a product.",
    formula: "product.collections.nodes[].title",
    usage: "The strongest source for theme classification because it reflects how the store groups products.",
  },
  {
    term: "Tag",
    meaning: "Shopify product tags.",
    formula: "product.tags[]",
    usage: "Used as secondary classification evidence after collections.",
  },
  {
    term: "Design family",
    meaning: "A more specific creative grouping inside a theme, such as map graphic, species chart, or turkey wildlife graphic.",
    formula: "Keyword rules from collection, tag, title, and description",
    usage: "Helps separate what kind of creative concept is working, not only what niche is working.",
  },
  {
    term: "Theme status",
    meaning: "Seasonal timing label for a theme: In season, Pre-season, Off-season, or Event.",
    formula: "Theme + current month + known US retail/outdoor season windows",
    usage: "Prevents a product from being judged without hunting, fishing, or gifting season context.",
  },
  {
    term: "Revenue trend",
    meaning: "Daily net sales over the selected period.",
    formula: "Group net sales by Shopify date",
    usage: "Used to spot drops, recovery days, abnormal spikes, and timing patterns.",
  },
  {
    term: "Revenue calendar",
    meaning: "A heatmap view of daily revenue.",
    formula: "Color intensity = daily net sales / highest daily net sales in the range",
    usage: "Used to quickly identify strong and weak days without reading every row.",
  },
  {
    term: "Product type performance",
    meaning: "Revenue and orders grouped by normalized apparel type.",
    formula: "Group product revenue by apparelType",
    usage: "Used to see whether T-shirts, hoodies, long sleeves, hats, or other blanks are carrying revenue.",
  },
  {
    term: "Data source coverage",
    meaning: "Status of connected data sources such as Shopify orders, product metadata, inventory, and Meta Ads.",
    formula: "Live, Manual, or Missing depending on source availability",
    usage: "Explains which recommendations are fully supported and which ones should stay conservative.",
  },
  {
    term: "Shopify live",
    meaning: "The dashboard is using live Shopify Admin API data.",
    formula: "Valid Shopify session or Admin token + successful /api/insights source=shopify response",
    usage: "Confirms that metrics are from the store rather than the sample fallback.",
  },
  {
    term: "Sample fallback",
    meaning: "Demo data shown when Shopify live data cannot be loaded.",
    formula: "Fallback to sampleAnalysis when live data fails or source=sample",
    usage: "Protects the app from blank screens, but should not be used for real decisions.",
  },
  {
    term: "Missing data",
    meaning: "A required source is not connected or not available for the selected metric.",
    formula: "No source value, missing scope, or no matching records",
    usage: "Prevents the app from showing fake certainty when traffic, customer, or spend data is incomplete.",
  },
  {
    term: "Meta Ads manual",
    meaning: "Meta Ads spend/ROAS is not fully automated and may require import or manual data.",
    formula: "coverage.metaAds = manual",
    usage: "Keeps scale/cut decisions conservative until ad spend and ROAS are connected.",
  },
  {
    term: "First-time customer",
    meaning: "A customer whose Shopify lifetime order count is one or lower at the time of analysis.",
    formula: "customer.numberOfOrders <= 1",
    usage: "Used to see whether discounts are being used to acquire new customers.",
  },
  {
    term: "Returning customer",
    meaning: "A customer who has bought more than once.",
    formula: "customer.numberOfOrders > 1",
    usage: "Used to measure repeat-purchase revenue and discount pressure from loyal buyers.",
  },
  {
    term: "Guest / unmatched",
    meaning: "Orders that cannot be matched to a customer profile or cannot be classified because customer access is missing.",
    formula: "No customer.id OR missing read_customers scope",
    usage: "Shown separately so new/returning customer conclusions are not overstated.",
  },
  {
    term: "Action reason",
    meaning: "Plain-English explanation of why a product was labeled Scale, Watch, or Fix first.",
    formula: "Action label + revenue change + orders + listing age + season/product context",
    usage: "Gives the operator a checklist before changing budget, creative, price, or placement.",
  },
];

const additionalVietnameseMethodology: MethodologyRow[] = [
  {
    term: "Confidence",
    meaning: "Tên cũ của Signal strength. Nghĩa là độ tin cậy của insight, không phải xác suất sản phẩm chắc chắn thắng.",
    formula: "Cùng công thức với Signal strength",
    usage: "Giữ lại như tên alias vì một số màn hình cũ hoặc trao đổi trước đây còn gọi là Confidence.",
  },
  {
    term: "Kỳ hiện tại",
    meaning: "Khoảng ngày đang được chọn ở thanh điều khiển.",
    formula: "Hôm nay, hôm qua, 7/14/30 ngày, hoặc khoảng ngày tự chọn theo giờ Shopify",
    usage: "Toàn bộ KPI, biểu đồ và nhãn hành động sản phẩm đều tính từ kỳ này.",
  },
  {
    term: "Kỳ so sánh",
    meaning: "Khoảng ngày liền trước có cùng độ dài với kỳ hiện tại.",
    formula: "Ngày bắt đầu so sánh = ngày bắt đầu hiện tại - số ngày; ngày kết thúc = trước kỳ hiện tại 1 ngày",
    usage: "Dùng để tính tăng/giảm, badge, và nhãn hành động sản phẩm.",
  },
  {
    term: "Tuổi listing",
    meaning: "Số ngày sản phẩm đã live dựa trên ngày listing/published trong Shopify.",
    formula: "Hôm nay - product.publishedAt hoặc product.createdAt",
    usage: "Giúp tránh đánh giá quá nặng các sản phẩm mới chưa đủ dữ liệu.",
  },
  {
    term: "Số unit bán",
    meaning: "Tổng số unit bán từ quantity của line item Shopify.",
    formula: "Tổng lineItem.quantity",
    usage: "Dùng để tính tốc độ bán và bối cảnh chi tiết sản phẩm.",
  },
  {
    term: "Tồn kho",
    meaning: "Số lượng tồn kho hiện tại của variant trong Shopify.",
    formula: "variant.inventoryQuantity",
    usage: "Dùng cùng số unit bán để tính số ngày đủ hàng và tránh scale sản phẩm sắp hết hàng.",
  },
  {
    term: "Product type",
    meaning: "Loại sản phẩm gốc lấy từ Shopify.",
    formula: "product.productType",
    usage: "Dùng làm nguồn phân loại dự phòng khi collection/tag chưa đủ rõ.",
  },
  {
    term: "Apparel type",
    meaning: "Nhóm blank/loại áo đã chuẩn hóa như Hoodie, T-shirt, Sweatshirt, Tank top hoặc Hat.",
    formula: "Luật từ khóa từ product type + tên sản phẩm",
    usage: "Dùng để lọc sản phẩm và vẽ biểu đồ hiệu suất theo blank/product type.",
  },
  {
    term: "Collection",
    meaning: "Bộ sưu tập Shopify mà sản phẩm thuộc về.",
    formula: "product.collections.nodes[].title",
    usage: "Là nguồn mạnh nhất để phân loại theme vì phản ánh cách store đang nhóm sản phẩm.",
  },
  {
    term: "Tag",
    meaning: "Tag sản phẩm trong Shopify.",
    formula: "product.tags[]",
    usage: "Dùng làm bằng chứng phân loại thứ hai sau collection.",
  },
  {
    term: "Design family",
    meaning: "Nhóm creative cụ thể hơn trong một theme, ví dụ map graphic, species chart, turkey wildlife graphic.",
    formula: "Luật từ khóa từ collection, tag, tên và mô tả",
    usage: "Giúp biết concept thiết kế nào đang chạy, không chỉ biết niche nào đang chạy.",
  },
  {
    term: "Theme status",
    meaning: "Trạng thái mùa vụ của theme: In season, Pre-season, Off-season hoặc Event.",
    formula: "Theme + tháng hiện tại + lịch mùa retail/outdoor tại Mỹ",
    usage: "Giúp đọc sản phẩm theo bối cảnh mùa săn, mùa câu và dịp quà tặng.",
  },
  {
    term: "Revenue trend",
    meaning: "Doanh thu thuần theo từng ngày trong kỳ đang chọn.",
    formula: "Nhóm net sales theo ngày Shopify",
    usage: "Dùng để nhận ra ngày tụt, ngày hồi phục, spike bất thường và pattern theo thời gian.",
  },
  {
    term: "Revenue calendar",
    meaning: "Heatmap doanh thu theo ngày.",
    formula: "Độ đậm màu = doanh thu ngày / doanh thu ngày cao nhất trong kỳ",
    usage: "Giúp nhìn nhanh ngày mạnh/yếu mà không cần đọc từng dòng số.",
  },
  {
    term: "Product type performance",
    meaning: "Doanh thu và đơn hàng được nhóm theo apparel type đã chuẩn hóa.",
    formula: "Nhóm doanh thu sản phẩm theo apparelType",
    usage: "Dùng để biết T-shirt, hoodie, long sleeve, mũ hoặc blank nào đang kéo doanh thu.",
  },
  {
    term: "Data source coverage",
    meaning: "Trạng thái nguồn dữ liệu như Shopify orders, metadata sản phẩm, inventory và Meta Ads.",
    formula: "Live, Manual hoặc Missing tùy nguồn có sẵn hay chưa",
    usage: "Cho biết khuyến nghị nào đã đủ dữ liệu và khuyến nghị nào cần đọc thận trọng.",
  },
  {
    term: "Shopify live",
    meaning: "Dashboard đang dùng dữ liệu live từ Shopify Admin API.",
    formula: "Có session/token hợp lệ + /api/insights source=shopify trả về thành công",
    usage: "Xác nhận số liệu đến từ store thật, không phải sample fallback.",
  },
  {
    term: "Sample fallback",
    meaning: "Dữ liệu demo hiển thị khi không tải được Shopify live data.",
    formula: "Dùng sampleAnalysis khi live data lỗi hoặc source=sample",
    usage: "Giúp app không trắng trang, nhưng không nên dùng để ra quyết định thật.",
  },
  {
    term: "Missing data",
    meaning: "Nguồn dữ liệu cần thiết chưa kết nối hoặc không có dữ liệu cho chỉ số đó.",
    formula: "Không có giá trị nguồn, thiếu scope, hoặc không có bản ghi khớp",
    usage: "Ngăn app tạo cảm giác chắc chắn giả khi thiếu dữ liệu traffic, customer hoặc spend.",
  },
  {
    term: "Meta Ads manual",
    meaning: "Dữ liệu spend/ROAS từ Meta Ads chưa tự động hoàn toàn và có thể cần import hoặc nhập tay.",
    formula: "coverage.metaAds = manual",
    usage: "Giữ khuyến nghị scale/cut thận trọng cho tới khi có spend và ROAS.",
  },
  {
    term: "Khách mới",
    meaning: "Khách có số đơn lifetime trong Shopify bằng một hoặc thấp hơn tại thời điểm phân tích.",
    formula: "customer.numberOfOrders <= 1",
    usage: "Dùng để biết discount có đang dùng để mua khách mới hay không.",
  },
  {
    term: "Khách quay lại",
    meaning: "Khách đã mua hơn một lần.",
    formula: "customer.numberOfOrders > 1",
    usage: "Dùng để đo doanh thu repeat purchase và áp lực giảm giá từ nhóm khách trung thành.",
  },
  {
    term: "Guest / unmatched",
    meaning: "Đơn không khớp được hồ sơ khách hàng hoặc chưa phân loại được vì thiếu quyền customer.",
    formula: "Không có customer.id HOẶC thiếu scope read_customers",
    usage: "Tách riêng để không kết luận quá mức về khách mới/khách cũ.",
  },
  {
    term: "Action reason",
    meaning: "Giải thích bằng ngôn ngữ thường vì sao sản phẩm được gắn Scale, Watch hoặc Fix first.",
    formula: "Nhãn hành động + thay đổi doanh thu + số đơn + tuổi listing + bối cảnh mùa/sản phẩm",
    usage: "Cho operator checklist trước khi đổi budget, creative, giá hoặc vị trí collection.",
  },
];

function ProductImage({ product, className = "" }: { product: ProductPoint; className?: string }) {
  const [failedUrl, setFailedUrl] = useState("");
  const imageUrl = product.imageUrl?.trim() || "";
  const showImage = Boolean(imageUrl && failedUrl !== imageUrl);

  return (
    <div
      data-product-image-frame
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-lg border bg-white p-1.5 ${className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          data-product-image
          src={imageUrl}
          alt=""
          className="block h-full max-h-full w-full max-w-full object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <div className="grid h-full w-full place-items-center rounded-md bg-emerald-50 text-emerald-800">
          <ImageIcon className="size-5" aria-hidden="true" />
          <span className="sr-only">{product.title}</span>
        </div>
      )}
    </div>
  );
}

function MetricTile({ label, value, delta, helper }: { label: string; value: string; delta: number | null; helper: string }) {
  const Icon = delta === null ? Sparkles : delta >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <Card size="sm" aria-label={`${label} metric`} className="min-h-[118px] shadow-sm">
      <CardContent className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-800">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-black leading-none text-foreground">{value}</div>
          <div className={`mt-2 text-xs font-bold ${deltaTone(delta)}`}>{percent(delta)}</div>
          <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{helper}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductRow({
  product,
  onOpen,
}: {
  product: ProductPoint;
  onOpen: (product: ProductPoint) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="grid w-full grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg p-2 text-left transition hover:bg-muted"
    >
      <ProductImage product={product} className="h-16 w-[52px]" />
      <div className="min-w-0">
        <div className="line-clamp-2 text-sm font-extrabold leading-5 text-foreground">{product.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>{money(product.currentSales, "USD", true)}</span>
          <span>|</span>
          <span>{number(product.currentOrders)} orders</span>
          <span>|</span>
          <span>{product.roas !== null ? `ROAS ${number(product.roas, 1)}` : "ROAS missing"}</span>
        </div>
      </div>
      <Badge variant="outline" className={actionTone(product.action)}>
        {actionLabel(product.action)}
      </Badge>
    </button>
  );
}

function DecisionLane({
  action,
  products,
  onOpen,
}: {
  action: ProductAction;
  products: ProductPoint[];
  onOpen: (product: ProductPoint) => void;
}) {
  const copy = actionCopy[action];
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{copy.title}</span>
          <Badge variant="secondary">{products.length} signals</Badge>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {products.slice(0, 4).map((product) => (
          <ProductRow key={product.id} product={product} onOpen={onOpen} />
        ))}
      </CardContent>
    </Card>
  );
}

function OverallPerformance({ analysis }: { analysis: AppAnalysis }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Overall performance</CardTitle>
        <CardDescription>{analysis.periodLabel} vs {analysis.comparisonLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {analysis.metrics.map((metric) => (
          <div key={metric.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b pb-3 last:border-b-0 last:pb-0">
            <div className="text-sm font-bold">{metric.label}</div>
            <div className="font-black">{metric.value}</div>
            <div className={`text-xs font-bold ${deltaTone(metric.delta)}`}>{percent(metric.delta)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CustomerLifecyclePanel({ analysis }: { analysis: AppAnalysis }) {
  const lifecycle = analysis.customerLifecycle;
  const rows = lifecycle.rows;
  const maxShare = Math.max(...rows.map((row) => row.share), 0.01);
  const returning = rows.find((row) => row.segment === "returning");
  const firstTime = rows.find((row) => row.segment === "new");

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Customer lifecycle</CardTitle>
        <CardDescription>New vs returning revenue, AOV, and discount pressure.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!lifecycle.available ? (
          <div className="grid gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              Needs Shopify <strong>read_customers</strong> scope to classify first-time vs returning buyers. Revenue still loads, but lifecycle diagnosis is locked until that permission is granted.
              <div className="mt-1 text-xs text-amber-900">
                If Shopify does not show an approval screen, release a new app version in Shopify Dev Dashboard with <strong>read_customers</strong>, then reauthorize.
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
              onClick={reauthorizeShopify}
            >
              Reauthorize Shopify
            </Button>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <MetricMicro
            label="Returning revenue"
            value={rawPercent(lifecycle.returningRevenueShare)}
            helper={returning ? `${money(returning.revenue)} | ${number(returning.orders)} orders` : "No returning signal"}
          />
          <MetricMicro
            label="First-time revenue"
            value={rawPercent(lifecycle.newCustomerRevenueShare)}
            helper={firstTime ? `${money(firstTime.revenue)} | ${number(firstTime.orders)} orders` : "No first-time signal"}
          />
          <MetricMicro
            label="Discount pressure"
            value={`${rawPercent(lifecycle.newCustomerDiscountRate)} / ${rawPercent(lifecycle.returningDiscountRate)}`}
            helper="First-time / returning"
          />
        </div>

        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.segment} className="rounded-xl border bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-black">{row.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {number(row.orders)} orders | AOV {money(row.aov)} | Discount {rawPercent(row.discountRate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black">{money(row.revenue)}</div>
                  <div className="text-xs font-bold text-muted-foreground">{rawPercent(row.share)} of revenue</div>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-50">
                <div
                  className={`h-full rounded-full ${
                    row.segment === "returning"
                      ? "bg-emerald-700"
                      : row.segment === "new"
                        ? "bg-amber-500"
                        : "bg-slate-300"
                  }`}
                  style={{ width: `${Math.max(4, (row.share / maxShare) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">
          <strong>Read:</strong> {lifecycle.diagnosis}
        </div>
      </CardContent>
    </Card>
  );
}

function ProductDetailSheet({
  product,
  open,
  onOpenChange,
}: {
  product: ProductPoint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!product) return null;
  const age = listingAgeDays(product);
  const delta = productDelta(product);
  const aov = productAov(product);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="overflow-y-auto"
        side="right"
        style={{
          width: "min(calc(100vw - 16px), 760px)",
          maxWidth: "min(calc(100vw - 16px), 760px)",
        }}
      >
        <SheetHeader>
          <SheetTitle>{product.title}</SheetTitle>
          <SheetDescription>
            {product.apparelType} | {product.theme} | {product.designFamily}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-4 pb-5">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <ProductImage product={product} className="mx-auto aspect-[4/5] w-full max-w-[220px] lg:mx-0" />
            <div className="flex min-w-0 flex-col gap-3">
              <Badge variant="outline" className={actionTone(product.action)}>
                {actionLabel(product.action)}
              </Badge>
              <p className="text-sm leading-6 text-muted-foreground">{product.actionReason}</p>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(138px,1fr))] gap-2">
                <MetricMicro label="Revenue" value={money(product.currentSales)} helper={percent(delta)} />
                <MetricMicro label="Orders" value={number(product.currentOrders)} helper={`${number(product.unitsSold)} units`} />
                <MetricMicro label="AOV" value={money(aov)} helper="Net sales / orders" />
                <MetricMicro label="Cover" value={product.daysOfCover ? `${number(product.daysOfCover, 1)} days` : "Missing"} helper={`${number(product.inventory)} units`} />
              </div>
            </div>
          </div>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Product trend</CardTitle>
              <CardDescription>Daily net sales, hover to inspect values</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[160px]">
              <ProductMiniTrend key={`${product.id}-detail`} product={product} height={148} showSymbols />
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Classification sources</CardTitle>
              <CardDescription>Collection wins first, then tags, title, product type, and description</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <SourceLine label="Source" value={product.source} />
              <SourceLine label="Collections" value={product.collections.join(", ") || "None"} />
              <SourceLine label="Tags" value={product.tags.join(", ") || "None"} />
              <SourceLine label="Listing age" value={age === null ? "Unknown" : `${age} days`} />
              <SourceLine label="Description" value={product.descriptionText} />
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Signal strength</CardTitle>
              <CardDescription>Signal strength rises with order volume, daily coverage, listing age, and source quality</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm font-bold">
                <span>{number(product.confidence)}/100</span>
                <span>{product.confidence >= 75 ? "High" : product.confidence >= 50 ? "Medium" : "Low"}</span>
              </div>
              <Progress value={product.confidence} />
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MetricMicro({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-lg font-black leading-tight">{value}</div>
      <div className="mt-1 break-words text-xs leading-5 text-muted-foreground">{helper}</div>
    </div>
  );
}

function SourceLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 leading-6 text-foreground">{value}</div>
    </div>
  );
}

function ViewHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-black tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function WorkspaceView({
  view,
  analysis,
  periodLabel,
  onOpenProduct,
  dateWindow,
  onMetaDateWindow,
  metaAdsCoverage,
  metaAds,
  dataSource,
}: {
  view: ViewKey;
  analysis: AppAnalysis;
  periodLabel: string;
  onOpenProduct: (product: ProductPoint) => void;
  dateWindow: DateWindow;
  onMetaDateWindow: (window: DateWindow) => void;
  metaAdsCoverage: MetaAdsCoverageDisplay;
  metaAds: MetaAdsController;
  dataSource: "sample" | "shopify";
}) {
  if (view === "customers") {
    return (
      <CustomersWorkspace
        analysis={analysis}
        periodLabel={periodLabel}
        includesCurrentDay={dateWindow.end === dateKeyInClientZone(new Date())}
      />
    );
  }
  if (view === "revenue") return <RevenueWorkspace analysis={analysis} />;
  if (view === "products") return <ProductWorkspace analysis={analysis} onOpenProduct={onOpenProduct} />;
  if (view === "collections") return <CollectionsWorkspace analysis={analysis} onOpenProduct={onOpenProduct} />;
  if (view === "seasonality") return <SeasonalityWorkspace analysis={analysis} dateWindow={dateWindow} />;
  if (view === "ads") {
    return (
      <AdsWorkspace
        analysis={analysis}
        dataSource={dataSource}
        onOpenProduct={onOpenProduct}
        dateWindow={dateWindow}
        onMetaDateWindow={onMetaDateWindow}
        metaAds={metaAds}
      />
    );
  }
  if (view === "blanks") return <BlanksWorkspace analysis={analysis} onOpenProduct={onOpenProduct} />;
  if (view === "reports") return <ReportsWorkspace analysis={analysis} dataSource={dataSource} onOpenProduct={onOpenProduct} />;
  if (view === "methodology") return <MethodologyWorkspace />;
  return <SettingsWorkspace metaAdsCoverage={metaAdsCoverage} />;
}

function CustomersWorkspace({
  analysis,
  periodLabel,
  includesCurrentDay,
}: {
  analysis: AppAnalysis;
  periodLabel: string;
  includesCurrentDay: boolean;
}) {
  return (
    <section className="mt-4">
      <ViewHeading
        title="Customers"
        description="Follow the path from human sessions and popup interests to buyers, conversion, and customer lifecycle."
      />
      <GrowthOverview
        growth={analysis.growth}
        periodLabel={periodLabel}
        includesCurrentDay={includesCurrentDay}
        onReconnect={reauthorizeShopify}
      />
      <div className="mt-4">
        <CustomerLifecyclePanel analysis={analysis} />
      </div>
    </section>
  );
}

function RevenueWorkspace({ analysis }: { analysis: AppAnalysis }) {
  return (
    <section className="mt-4">
      <ViewHeading
        title="Revenue"
        description="Daily net sales and orders in Shopify time."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {analysis.metrics.map((metric) => (
          <MetricTile key={metric.label} {...metric} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
            <CardDescription>Hover each point to inspect net sales and orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueTrendChart data={analysis.daily} />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Daily detail</CardTitle>
            <CardDescription>Calendar numbers must match the KPI period.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.daily.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-bold">{day.date}</TableCell>
                    <TableCell className="text-right font-black">{money(day.netSales)}</TableCell>
                    <TableCell className="text-right">{number(day.orders)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue calendar</CardTitle>
            <CardDescription>Heatmap view for spotting unusually strong or weak days.</CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarHeatmap data={analysis.daily} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ProductWorkspace({
  analysis,
  onOpenProduct,
}: {
  analysis: AppAnalysis;
  onOpenProduct: (product: ProductPoint) => void;
}) {
  const [typeFilter, setTypeFilter] = useState("All");
  const productTypes = useMemo(
    () => ["All", ...Array.from(new Set(analysis.products.map((product) => product.apparelType)))],
    [analysis.products],
  );
  const filteredProducts = useMemo(
    () =>
      typeFilter === "All"
        ? analysis.products
        : analysis.products.filter((product) => product.apparelType === typeFilter),
    [analysis.products, typeFilter],
  );

  return (
    <section className="mt-4">
      <ViewHeading
        title="Products"
        description="Filter by product type, then open a product for image, listing age, classification source, and action logic."
      />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Product intelligence</CardTitle>
          <CardDescription>{filteredProducts.length} products visible</CardDescription>
          <CardAction>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                if (value) setTypeFilter(value);
              }}
            >
              <SelectTrigger className="w-[190px] bg-white">
                <SelectValue placeholder="Product type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {productTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 2xl:grid-cols-2">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onOpenProduct(product)}
                className="grid gap-4 rounded-xl border bg-white p-3 text-left transition hover:border-emerald-300 hover:shadow-sm sm:grid-cols-[104px_minmax(0,1fr)_150px]"
              >
                <ProductImage product={product} className="h-28 w-[90px] sm:h-24 sm:w-[78px]" />
                <div className="min-w-0">
                  <div className="line-clamp-2 text-base font-black leading-6">{product.title}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{product.apparelType}</Badge>
                    <Badge variant="outline">{product.theme}</Badge>
                    <Badge variant="outline">{product.designFamily}</Badge>
                  </div>
                  <div className="mt-2 text-xs leading-5 text-muted-foreground">
                    {product.source} | Listing {listingAgeDays(product) ?? "-"} days | {product.collections.join(", ")}
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-3">
                  <Badge variant="outline" className={actionTone(product.action)}>
                    {actionLabel(product.action)}
                  </Badge>
                  <div>
                    <div className="text-xl font-black">{money(product.currentSales)}</div>
                    <div className="text-sm text-muted-foreground">{number(product.currentOrders)} orders</div>
                    <div className={`mt-1 text-xs font-bold ${deltaTone(productDelta(product))}`}>
                      {percent(productDelta(product))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function CollectionsWorkspace({
  analysis,
  onOpenProduct,
}: {
  analysis: AppAnalysis;
  onOpenProduct: (product: ProductPoint) => void;
}) {
  const collectionRows = useMemo(() => {
    const rows = new Map<string, { revenue: number; orders: number; products: ProductPoint[] }>();
    for (const product of analysis.products) {
      const collections = product.collections.length ? product.collections : ["Unclassified"];
      for (const collection of collections) {
        const row = rows.get(collection) ?? { revenue: 0, orders: 0, products: [] };
        row.revenue += product.currentSales;
        row.orders += product.currentOrders;
        row.products.push(product);
        rows.set(collection, row);
      }
    }
    return Array.from(rows.entries())
      .map(([collection, row]) => ({ collection, ...row }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [analysis.products]);

  return (
    <section className="mt-4">
      <ViewHeading
        title="Collections"
        description="Collection-led classification so hunting, fishing, and lifestyle products are not assigned randomly."
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Collection performance</CardTitle>
            <CardDescription>Revenue and orders from products in each collection.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collection</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionRows.map((row) => (
                  <TableRow key={row.collection}>
                    <TableCell className="font-black">{row.collection}</TableCell>
                    <TableCell className="text-right">{row.products.length}</TableCell>
                    <TableCell className="text-right">{number(row.orders)}</TableCell>
                    <TableCell className="text-right font-black">{money(row.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Top products by source</CardTitle>
            <CardDescription>Open any item to inspect source evidence.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {analysis.products.slice(0, 6).map((product) => (
              <ProductRow key={product.id} product={product} onOpen={onOpenProduct} />
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

type TrendCategory = "Hunting" | "Fishing" | "Retail" | "Outdoor" | "Apparel";

type TimelineTrend = {
  label: string;
  category: TrendCategory;
  date: string;
  prep: string;
  peak: string;
  action: string;
};

type TimelineMonth = {
  month: string;
  monthIndex: number;
  focus: string;
  trends: TimelineTrend[];
};

const annualTrendTimeline: TimelineMonth[] = [
  {
    month: "Jan",
    monthIndex: 1,
    focus: "Winter and reset",
    trends: [
      { label: "New Year outdoor reset", category: "Outdoor", date: "Jan 1, 2026", prep: "Dec 15-31", peak: "Jan 1-15", action: "Refresh national park, hiking, and outdoor lifestyle hooks." },
      { label: "Winter hunting clearance", category: "Hunting", date: "Jan 1-31, 2026", prep: "Dec", peak: "Jan", action: "Clear older hunting designs and test cold-weather blanks." },
    ],
  },
  {
    month: "Feb",
    monthIndex: 2,
    focus: "Late winter prep",
    trends: [
      { label: "Valentine outdoor gifts", category: "Retail", date: "Feb 14, 2026", prep: "Jan 20-Feb 7", peak: "Feb 7-14", action: "Use only for couples, family, or giftable outdoor products." },
      { label: "Presidents' Day", category: "Retail", date: "Feb 16, 2026", prep: "Feb 1-10", peak: "Feb 13-16", action: "Use light patriotic promos without over-tagging products." },
      { label: "Fishing opener prep", category: "Fishing", date: "Feb 15-Mar 31, 2026", prep: "Feb-Mar", peak: "Mar-Apr", action: "Launch bass, trout, lake, and offshore test designs early." },
    ],
  },
  {
    month: "Mar",
    monthIndex: 3,
    focus: "Spring ramp",
    trends: [
      { label: "St. Patrick's Day", category: "Retail", date: "Mar 17, 2026", prep: "Mar 1-10", peak: "Mar 13-17", action: "Only use when green, luck, fishing, or outdoor humor fits the product." },
      { label: "Spring turkey ramp", category: "Hunting", date: "Mar 15-May 31, 2026", prep: "Mar", peak: "Apr-May", action: "Test turkey, strut, slam, and camo creatives before peak." },
      { label: "Spring fishing", category: "Fishing", date: "Mar 1-May 31, 2026", prep: "Mar-Apr", peak: "Apr-May", action: "Separate bass, trout, lake, and offshore themes by collection evidence." },
    ],
  },
  {
    month: "Apr",
    monthIndex: 4,
    focus: "Turkey and trout",
    trends: [
      { label: "Easter", category: "Retail", date: "Apr 5, 2026", prep: "Mar 15-28", peak: "Mar 29-Apr 5", action: "Use only for family gifting or spring outdoor products." },
      { label: "Spring turkey peak", category: "Hunting", date: "Apr 1-May 31, 2026", prep: "Mar", peak: "Apr-May", action: "Scale winners with stock, AOV, and ROAS guardrails." },
      { label: "Earth Day / parks", category: "Outdoor", date: "Apr 22, 2026", prep: "Apr 1-15", peak: "Apr 16-22", action: "Push national park, map, trail, and conservation designs." },
    ],
  },
  {
    month: "May",
    monthIndex: 5,
    focus: "Gift and patriotic setup",
    trends: [
      { label: "Mother's Day", category: "Retail", date: "May 10, 2026", prep: "Apr 20-May 3", peak: "May 4-10", action: "Use only if copy clearly fits family gifting." },
      { label: "Memorial Day", category: "Retail", date: "May 25, 2026", prep: "May 1-15", peak: "May 18-25", action: "Warm up patriotic, outdoor, lake, and national park collections." },
      { label: "Father's Day prep", category: "Retail", date: "May 25-Jun 14, 2026", prep: "Late May", peak: "Early-mid Jun", action: "Start dad hunting, fishing, and outdoor gift creatives." },
    ],
  },
  {
    month: "Jun",
    monthIndex: 6,
    focus: "Dad gifts and summer",
    trends: [
      { label: "Flag Day", category: "Retail", date: "Jun 14, 2026", prep: "Jun 1-10", peak: "Jun 10-14", action: "Use as an early patriotic signal before July 4." },
      { label: "Father's Day", category: "Retail", date: "Jun 21, 2026", prep: "May 25-Jun 14", peak: "Jun 14-21", action: "Scale dad gift winners; watch discount pressure by customer type." },
      { label: "Summer fishing", category: "Fishing", date: "Jun 1-Aug 31, 2026", prep: "May", peak: "Jun-Aug", action: "Prioritize lake, bass, offshore, tank top, and tee formats." },
    ],
  },
  {
    month: "Jul",
    monthIndex: 7,
    focus: "Patriotic and lake season",
    trends: [
      { label: "Independence Day", category: "Retail", date: "Jul 4, 2026", prep: "Jun 10-25", peak: "Jun 25-Jul 4", action: "Scale proven patriotic designs; avoid late launches after peak." },
      { label: "Camping and lake trips", category: "Outdoor", date: "Jul 1-Aug 15, 2026", prep: "Jun", peak: "Jul-Aug", action: "Use lighter blanks, tanks, tees, and vacation hooks." },
    ],
  },
  {
    month: "Aug",
    monthIndex: 8,
    focus: "Early fall setup",
    trends: [
      { label: "Back to school / fall", category: "Apparel", date: "Aug 1-Sep 15, 2026", prep: "Late Jul-Aug", peak: "Aug-Sep", action: "Move tests toward long sleeve, hoodie, sweatshirt, and Comfort Colors." },
      { label: "Deer season prep", category: "Hunting", date: "Aug 1-Sep 30, 2026", prep: "Aug-Sep", peak: "Sep-Nov", action: "Test deer, camo, bow, and camp designs before the hunting ramp." },
    ],
  },
  {
    month: "Sep",
    monthIndex: 9,
    focus: "Hunting ramp",
    trends: [
      { label: "Labor Day", category: "Retail", date: "Sep 7, 2026", prep: "Aug 20-Sep 1", peak: "Sep 4-7", action: "Run broad outdoor promos and clear weak summer items." },
      { label: "Deer / waterfowl ramp", category: "Hunting", date: "Sep 1-Nov 30, 2026", prep: "Aug-Sep", peak: "Sep-Nov", action: "Scale only collection-backed hunting themes with strong daily velocity." },
    ],
  },
  {
    month: "Oct",
    monthIndex: 10,
    focus: "Fall peak",
    trends: [
      { label: "Deer hunting peak", category: "Hunting", date: "Oct 1-Nov 30, 2026", prep: "Sep", peak: "Oct-Nov", action: "Prioritize hoodies, sweatshirts, long sleeves, and camo designs." },
      { label: "Halloween", category: "Retail", date: "Oct 31, 2026", prep: "Oct 1-20", peak: "Oct 24-31", action: "Use only if the design family truly fits spooky or outdoor humor." },
    ],
  },
  {
    month: "Nov",
    monthIndex: 11,
    focus: "BFCM and gifting",
    trends: [
      { label: "Veterans Day", category: "Retail", date: "Nov 11, 2026", prep: "Oct 25-Nov 5", peak: "Nov 7-11", action: "Use patriotic angles carefully and only on matching designs." },
      { label: "Thanksgiving", category: "Retail", date: "Nov 26, 2026", prep: "Nov 1-18", peak: "Nov 19-26", action: "Position family, gift, fall, and outdoor lifestyle products." },
      { label: "Black Friday / Cyber Monday", category: "Retail", date: "Nov 27-30, 2026", prep: "Nov 1-20", peak: "Nov 27-30", action: "Scale proven winners; do not let discount rate hide weak margin." },
    ],
  },
  {
    month: "Dec",
    monthIndex: 12,
    focus: "Holiday gifts",
    trends: [
      { label: "Christmas gifting", category: "Retail", date: "Dec 25, 2026", prep: "Nov 20-Dec 5", peak: "Dec 1-15", action: "Giftable hunting, fishing, and outdoor designs need earlier shipping cutoffs." },
      { label: "Winter hunting", category: "Hunting", date: "Dec 1-Jan 31, 2026", prep: "Nov", peak: "Dec-Jan", action: "Push cold-weather blanks and late-season hunting lifestyle." },
    ],
  },
];

const usEventWindows = [
  { name: "Spring turkey", window: "Mar 15-May 31, 2026", fit: "Turkey hunting, strut/slam designs, camo, tees and hoodies" },
  { name: "Spring fishing / trout", window: "Mar 1-May 31, 2026", fit: "Trout, bass, lake, offshore, fishing trip designs" },
  { name: "Mother's Day", window: "May 10, 2026", fit: "Use only for family/gift designs that truly match" },
  { name: "Memorial Day", window: "May 25, 2026", fit: "Patriotic, outdoor, camping, lake, national park angles" },
  { name: "Father's Day", window: "Jun 21, 2026", fit: "Dad hunting, fishing, outdoor gifts" },
  { name: "Independence Day", window: "Jul 4, 2026", fit: "Patriotic, America, flag, outdoor summer products" },
  { name: "Back to school / early fall", window: "Aug 1-Sep 15, 2026", fit: "Hoodies, long sleeve, Comfort Colors, outdoor lifestyle" },
  { name: "Deer / waterfowl hunting", window: "Sep 1-Nov 30, 2026", fit: "Deer, duck, waterfowl, camo, hunting lifestyle. Legal dates vary by state." },
  { name: "Veterans Day", window: "Nov 11, 2026", fit: "Patriotic designs with careful messaging" },
  { name: "BFCM / Christmas gifting", window: "Nov 27-Dec 15, 2026", fit: "Winners, giftable products, bundle and discount control" },
];

function SeasonalityWorkspace({ analysis, dateWindow }: { analysis: AppAnalysis; dateWindow: DateWindow }) {
  const activeMonths = selectedMonthsForWindow(dateWindow);

  return (
    <section className="mt-4">
      <ViewHeading
        title="Seasonality"
        description="Season and US event context for POD hunting, fishing, and outdoor apparel."
      />
      <AnnualTrendTimeline activeMonths={activeMonths} />
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Theme readout</CardTitle>
            <CardDescription>Use collection and product metadata first, not guessed labels.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Theme</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.themes.map((theme) => (
                  <TableRow key={theme.theme}>
                    <TableCell className="font-black">{theme.theme}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{theme.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-black">{money(theme.revenue)}</TableCell>
                    <TableCell className="text-right">{rawPercent(theme.share)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>US event windows</CardTitle>
            <CardDescription>Campaign timing context, not automatic product labeling.</CardDescription>
          </CardHeader>
          <CardContent className="grid max-h-[560px] gap-3 overflow-y-auto pr-1">
            {usEventWindows.map((event) => (
              <div key={event.name} className="rounded-xl border bg-white p-3 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                <div className="font-black">{event.name}</div>
                <div className="mt-1 text-sm font-bold text-emerald-800">{event.window}</div>
                <div className="mt-1 text-sm text-muted-foreground">{event.fit}</div>
              </div>
            ))}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              Hunting and fishing legal seasons vary by state. This timeline is for POD commercial planning and should be paired with collection/product evidence before acting.
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function AnnualTrendTimeline({ activeMonths }: { activeMonths: Set<number> }) {
  const quarterGroups = [
    { label: "Q1", months: annualTrendTimeline.slice(0, 3), note: "Seed spring testing before demand spikes." },
    { label: "Q2", months: annualTrendTimeline.slice(3, 6), note: "Turkey, parks, dad gifts, and summer fishing." },
    { label: "Q3", months: annualTrendTimeline.slice(6, 9), note: "Patriotic, lake, back-to-school, and hunting ramp." },
    { label: "Q4", months: annualTrendTimeline.slice(9, 12), note: "Fall hunting, BFCM, and holiday gifting." },
  ];
  const selectedMonthLabels = annualTrendTimeline
    .filter((month) => activeMonths.has(month.monthIndex))
    .map((month) => month.month)
    .join(", ");

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-2">
        <div>
          <CardTitle>Annual US trend timeline</CardTitle>
          <CardDescription>
            2026 commercial calendar for POD apparel. Prep before the peak, then scale only when Shopify and Meta signals agree.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant="outline" className="bg-emerald-50 px-3 py-1 text-emerald-800">
            Selected: {selectedMonthLabels || "None"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-3 rounded-xl border bg-muted/25 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="text-sm leading-6 text-muted-foreground">
            Read left to right by quarter. <span className="font-bold text-foreground">Prep</span> is the launch/test window, <span className="font-bold text-foreground">Peak</span> is the strongest selling window.
          </div>
          <div className="flex flex-wrap gap-2">
            {(["Hunting", "Fishing", "Retail", "Outdoor", "Apparel"] as TrendCategory[]).map((category) => (
              <span key={category} className={`rounded-full border px-2.5 py-1 text-xs font-bold ${trendCategoryClass(category)}`}>
                {category}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {quarterGroups.map((quarter) => (
            <div key={quarter.label} className="rounded-2xl border bg-white p-3 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div>
                  <div className="text-sm font-black uppercase tracking-wide text-emerald-900">{quarter.label}</div>
                  <div className="text-sm text-muted-foreground">{quarter.note}</div>
                </div>
                <div className="text-xs font-bold text-muted-foreground">{"Prep -> Peak -> Decision"}</div>
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                {quarter.months.map((month) => (
                  <TimelineMonthCard key={month.month} month={month} active={activeMonths.has(month.monthIndex)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineMonthCard({ month, active }: { month: TimelineMonth; active: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${active ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-100" : "bg-muted/15"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xl font-black">{month.month}</div>
          <div className="mt-0.5 text-sm font-bold text-muted-foreground">{month.focus}</div>
        </div>
        {active ? (
          <Badge variant="outline" className="bg-white text-emerald-800">
            In selected range
          </Badge>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2">
        {month.trends.map((trend) => (
          <div key={`${month.month}-${trend.label}`} className="rounded-lg border bg-white p-3">
            <div className="flex flex-wrap items-start gap-2">
              <div className="min-w-[180px] flex-1 text-sm font-black leading-5">{trend.label}</div>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${trendCategoryClass(trend.category)}`}>
                {trend.category}
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-xs leading-5">
              <TimelineFact label="Date/window" value={trend.date} />
              <TimelineFact label="Prep" value={trend.prep} />
              <TimelineFact label="Peak" value={trend.peak} />
            </div>
            <div className="mt-2 text-xs leading-5 text-muted-foreground">{trend.action}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <span className="font-bold text-foreground">{label}:</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

function trendCategoryClass(category: TrendCategory) {
  if (category === "Hunting") return "border-orange-200 bg-orange-50 text-orange-900";
  if (category === "Fishing") return "border-sky-200 bg-sky-50 text-sky-900";
  if (category === "Retail") return "border-amber-200 bg-amber-50 text-amber-900";
  if (category === "Outdoor") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  return "border-slate-200 bg-slate-50 text-slate-900";
}

function selectedMonthsForWindow(dateWindow: DateWindow) {
  const safeWindow = normalizeDateWindow(dateWindow);
  const startParts = safeWindow.start.split("-").map(Number);
  const endParts = safeWindow.end.split("-").map(Number);
  const startMonth = startParts[1] || 1;
  const endMonth = endParts[1] || startMonth;
  const active = new Set<number>();

  if (startMonth <= endMonth) {
    for (let month = startMonth; month <= endMonth; month += 1) active.add(month);
    return active;
  }

  for (let month = startMonth; month <= 12; month += 1) active.add(month);
  for (let month = 1; month <= endMonth; month += 1) active.add(month);
  return active;
}

function metaMetric(value: number | null, formatter: (value: number) => string) {
  return value === null || Number.isNaN(value) ? "No data" : formatter(value);
}

function metaDecision(row: MetaAdsGroup) {
  return adsCampaignDecision(row);
}

function metaToneClass(tone: "scale" | "watch" | "fix") {
  if (tone === "scale") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (tone === "fix") return "bg-red-50 text-red-800 ring-red-200";
  return "bg-amber-50 text-amber-800 ring-amber-200";
}

type MetaAdsImportState = {
  rows: MetaAdsRow[];
  importedAt: string;
};

type GoogleMetaAdsState = MetaAdsImportState & {
  label: string;
};

type GoogleMetaAdsPayload = {
  rows?: MetaAdsRow[];
  loadedAt?: string;
  error?: string;
  sheet?: {
    spreadsheetTitle?: string;
    sheetTitle?: string;
    sourceRows?: number;
  };
};

type MetaAdsSyncOptions = {
  force?: boolean;
  select?: boolean;
};

type MetaAdsController = {
  manualImport: MetaAdsImportState;
  sheetImport: GoogleMetaAdsState;
  usingManual: boolean;
  rows: MetaAdsRow[];
  importedAt: string;
  sourceLabel: string;
  loading: boolean;
  warning: string;
  manualMappings: Record<string, string>;
  syncSheet: (options?: MetaAdsSyncOptions) => Promise<void>;
  persistManualRows: (rows: MetaAdsRow[], importedAt: string) => void;
  clearManual: () => void;
  toggleSource: () => void;
  updateMapping: (rowKey: string, productId: string) => void;
  resetMappings: () => void;
};

function storedMetaAdsImport(): MetaAdsImportState {
  if (typeof window === "undefined") return { rows: [], importedAt: "" };

  try {
    const stored = safeStorageGet("local", META_ADS_STORAGE_KEY);
    if (!stored) return { rows: [], importedAt: "" };
    const parsed = JSON.parse(stored) as { rows?: MetaAdsRow[]; importedAt?: string };
    return {
      rows: Array.isArray(parsed.rows) ? parsed.rows : [],
      importedAt: parsed.importedAt || "",
    };
  } catch {
    safeStorageRemove("local", META_ADS_STORAGE_KEY);
    return { rows: [], importedAt: "" };
  }
}

function storedMetaAdsMappings(): Record<string, string> {
  if (typeof window === "undefined") return {};

  try {
    const stored = safeStorageGet("local", META_ADS_MAPPING_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    safeStorageRemove("local", META_ADS_MAPPING_STORAGE_KEY);
    return {};
  }
}

function metaDateKey(value: string): string {
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
    return "";
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return dateKeyInClientZone(parsed);
}

function dateWindowFromMetaRows(rows: MetaAdsRow[]): DateWindow | null {
  const dates = rows.map((row) => metaDateKey(row.date)).filter(Boolean).sort();
  if (!dates.length) return null;
  return { start: dates[0], end: dates[dates.length - 1] };
}

type MetaProductMatch = {
  product: ProductPoint | null;
  score: number;
  level: "High" | "Medium" | "Low" | "Review";
  reason: string;
};

type MappedMetaAdsGroup = MetaAdsGroup & {
  productMatch: MetaProductMatch;
};

type ProductMetaSummary = {
  product: ProductPoint;
  spend: number;
  purchases: number;
  purchaseValue: number;
  rows: number;
  roas: number | null;
};

const META_AUTO_MAP_VALUE = "__auto__";
const META_UNMAPPED_VALUE = "__unmapped__";

const META_MATCH_STOPWORDS = new Set([
  "abo",
  "ad",
  "ads",
  "all",
  "and",
  "auto",
  "broad",
  "bundle",
  "campaign",
  "cbo",
  "collection",
  "conversion",
  "freeship",
  "graphic",
  "img",
  "main",
  "model",
  "offer",
  "purchase",
  "retarget",
  "shirt",
  "tee",
  "the",
  "tof",
  "tshirt",
  "video",
]);

function matchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchTokens(value: string): string[] {
  return matchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !META_MATCH_STOPWORDS.has(token) && !/^\d+$/.test(token));
}

function uniqueMatchTokens(values: string[]): string[] {
  return Array.from(new Set(values.flatMap(matchTokens)));
}

function scoreMetaProductMatch(row: MetaAdsGroup, product: ProductPoint): { score: number; reason: string } {
  const adText = `${row.campaign} ${row.adSet} ${row.ad}`;
  const normalizedAdText = matchText(adText);
  const adTokens = new Set(matchTokens(adText));
  const titleText = matchText(product.title);
  const titleTokens = uniqueMatchTokens([product.title, product.handle]);
  const sourceTokens = uniqueMatchTokens([
    product.theme,
    product.designFamily,
    product.productType,
    product.apparelType,
    product.descriptionText,
    ...product.collections,
    ...product.tags,
  ]);
  const titleMatches = titleTokens.filter((token) => adTokens.has(token));
  const sourceMatches = sourceTokens.filter((token) => adTokens.has(token));
  let score = 0;
  const reasons: string[] = [];

  if (titleText && normalizedAdText.includes(titleText)) {
    score += 80;
    reasons.push("exact product title");
  }

  if (titleTokens.length) {
    const titleCoverage = titleMatches.length / titleTokens.length;
    score += titleCoverage * 58;
    if (titleMatches.length >= 2) score += 18;
    if (titleMatches.length) reasons.push(`title: ${titleMatches.slice(0, 4).join(", ")}`);
  }

  if (sourceMatches.length) {
    score += Math.min(24, sourceMatches.length * 4);
    reasons.push(`source: ${sourceMatches.slice(0, 4).join(", ")}`);
  }

  if (!titleMatches.length && sourceMatches.length <= 1) score = Math.min(score, 38);
  if (titleMatches.length === 1 && sourceMatches.length <= 1) score = Math.min(score, 52);

  return {
    score: Math.min(96, Math.round(score)),
    reason: reasons.join(" | ") || "no clear product token match",
  };
}

function bestMetaProductMatch(row: MetaAdsGroup, products: ProductPoint[]): MetaProductMatch {
  const ranked = products
    .map((product) => ({ product, ...scoreMetaProductMatch(row, product) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];

  if (!best || best.score < 35) {
    return {
      product: null,
      score: best?.score || 0,
      level: "Review",
      reason: "Ad naming is too generic to map safely.",
    };
  }

  return {
    product: best.product,
    score: best.score,
    level: best.score >= 75 ? "High" : best.score >= 55 ? "Medium" : "Low",
    reason: best.reason,
  };
}

function manualMetaProductMatch(row: MetaAdsGroup, products: ProductPoint[], manualMappings: Record<string, string>): MetaProductMatch | null {
  const mappedProductId = manualMappings[row.key];
  if (!mappedProductId) return null;

  if (mappedProductId === META_UNMAPPED_VALUE) {
    return {
      product: null,
      score: 0,
      level: "Review",
      reason: "Manually left unmapped.",
    };
  }

  const product = products.find((entry) => entry.id === mappedProductId);
  if (!product) return null;

  return {
    product,
    score: 100,
    level: "High",
    reason: "Manual mapping override.",
  };
}

function mapMetaGroupsToProducts(
  rows: MetaAdsGroup[],
  products: ProductPoint[],
  manualMappings: Record<string, string>,
): MappedMetaAdsGroup[] {
  return rows.map((row) => ({
    ...row,
    productMatch: manualMetaProductMatch(row, products, manualMappings) || bestMetaProductMatch(row, products),
  }));
}

function metaMappingStats(rows: MappedMetaAdsGroup[]) {
  const mappedRows = rows.filter((row) => row.productMatch.product);
  const mappedSpend = mappedRows.reduce((sum, row) => sum + row.spend, 0);
  const totalSpend = rows.reduce((sum, row) => sum + row.spend, 0);
  return {
    mappedRows: mappedRows.length,
    totalRows: rows.length,
    mappedSpend,
    spendShare: totalSpend ? mappedSpend / totalSpend : null,
  };
}

function trustedMetaMappingStats(rows: MappedMetaAdsGroup[]) {
  const trustedRows = rows.filter((row) => row.productMatch.product && row.productMatch.level === "High");
  const trustedSpend = trustedRows.reduce((sum, row) => sum + row.spend, 0);
  const totalSpend = rows.reduce((sum, row) => sum + row.spend, 0);
  return {
    trustedRows: trustedRows.length,
    trustedSpend,
    spendShare: totalSpend ? trustedSpend / totalSpend : null,
  };
}

function productMetaSummaries(rows: MappedMetaAdsGroup[]): ProductMetaSummary[] {
  const byProduct = new Map<string, ProductMetaSummary>();

  for (const row of rows) {
    const product = row.productMatch.product;
    if (!product) continue;

    const current = byProduct.get(product.id) || {
      product,
      spend: 0,
      purchases: 0,
      purchaseValue: 0,
      rows: 0,
      roas: null,
    };
    current.spend += row.spend;
    current.purchases += row.purchases;
    current.purchaseValue += row.purchaseValue;
    current.rows += row.rows;
    current.roas = current.spend ? current.purchaseValue / current.spend : null;
    byProduct.set(product.id, current);
  }

  return Array.from(byProduct.values()).sort((a, b) => b.spend - a.spend);
}

function productsWithMetaRoas(
  products: ProductPoint[],
  productMeta: ProductMetaSummary[],
  clearExisting = false,
  applyScaleGuardrail = false,
): ProductPoint[] {
  const roasByProduct = new Map(productMeta.map((row) => [row.product.id, row.roas]));
  return products.map((product) => {
    const roas = roasByProduct.has(product.id)
      ? roasByProduct.get(product.id) ?? null
      : clearExisting
        ? null
        : product.roas;
    const missesScaleGuardrail = applyScaleGuardrail && product.action === "scale" && (roas === null || roas < 2);

    return {
      ...product,
      roas,
      action: missesScaleGuardrail ? "watch" : product.action,
      actionReason: missesScaleGuardrail
        ? roas === null
          ? `${product.title} has a strong Shopify sales signal, but trusted Meta product ROAS is unavailable in this period. Keep it on Watch until the ad-to-product match is confirmed.`
          : `${product.title} has a strong Shopify sales signal, but Meta ROAS ${number(roas, 2)}x is below the 2x scale guardrail. Keep it on Watch before adding budget.`
        : product.actionReason,
    };
  });
}

function AdsWorkspace({
  analysis,
  dataSource,
  onOpenProduct,
  dateWindow,
  onMetaDateWindow,
  metaAds,
}: {
  analysis: AppAnalysis;
  dataSource: "sample" | "shopify";
  onOpenProduct: (product: ProductPoint) => void;
  dateWindow: DateWindow;
  onMetaDateWindow: (window: DateWindow) => void;
  metaAds: MetaAdsController;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [metaError, setMetaError] = useState("");
  const [campaignScope, setCampaignScope] = useState(META_ALL_SCOPE);
  const [adSetScope, setAdSetScope] = useState(META_ALL_SCOPE);
  const [adScope, setAdScope] = useState(META_ALL_SCOPE);
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);
  const {
    manualImport: manualMetaImport,
    sheetImport: sheetMetaImport,
    usingManual: usingManualMeta,
    rows: metaRows,
    importedAt: metaImportedAt,
    sourceLabel: metaSourceLabel,
    loading: loadingMetaSheet,
    warning: metaSheetWarning,
    manualMappings,
    syncSheet: syncMetaSheet,
    persistManualRows: persistManualMetaRows,
    clearManual: clearManualMetaImport,
    toggleSource: toggleMetaSource,
    updateMapping: updateManualMapping,
    resetMappings: resetManualMappings,
  } = metaAds;
  const sourceStoryboard = useMemo(() => buildAdsStoryboard(metaRows, dateWindow), [dateWindow, metaRows]);
  const scopeCandidates = sourceStoryboard.currentRows;
  const campaignOptions = useMemo(
    () => Array.from(new Set(scopeCandidates.map((row) => row.campaign))).sort((a, b) => a.localeCompare(b)),
    [scopeCandidates],
  );
  const activeCampaignScope = campaignOptions.includes(campaignScope) ? campaignScope : META_ALL_SCOPE;
  const adSetOptions = useMemo(() => Array.from(new Set(
    scopeCandidates
      .filter((row) => activeCampaignScope === META_ALL_SCOPE || row.campaign === activeCampaignScope)
      .map((row) => row.adSet),
  )).sort((a, b) => a.localeCompare(b)), [activeCampaignScope, scopeCandidates]);
  const activeAdSetScope = adSetOptions.includes(adSetScope) ? adSetScope : META_ALL_SCOPE;
  const adOptions = useMemo(() => Array.from(new Set(
    scopeCandidates
      .filter((row) => activeCampaignScope === META_ALL_SCOPE || row.campaign === activeCampaignScope)
      .filter((row) => activeAdSetScope === META_ALL_SCOPE || row.adSet === activeAdSetScope)
      .map((row) => row.ad),
  )).sort((a, b) => a.localeCompare(b)), [activeAdSetScope, activeCampaignScope, scopeCandidates]);
  const activeAdScope = adOptions.includes(adScope) ? adScope : META_ALL_SCOPE;
  const scopedMetaRows = useMemo(() => metaRows
    .filter((row) => activeCampaignScope === META_ALL_SCOPE || row.campaign === activeCampaignScope)
    .filter((row) => activeAdSetScope === META_ALL_SCOPE || row.adSet === activeAdSetScope)
    .filter((row) => activeAdScope === META_ALL_SCOPE || row.ad === activeAdScope), [activeAdScope, activeAdSetScope, activeCampaignScope, metaRows]);
  const storyboard = useMemo(
    () => activeCampaignScope === META_ALL_SCOPE && activeAdSetScope === META_ALL_SCOPE && activeAdScope === META_ALL_SCOPE
      ? sourceStoryboard
      : buildAdsStoryboard(scopedMetaRows, dateWindow, 2, metaRows),
    [activeAdScope, activeAdSetScope, activeCampaignScope, dateWindow, metaRows, scopedMetaRows, sourceStoryboard],
  );
  const importedMetaSummary = useMemo(() => summarizeMetaAdsRows(metaRows), [metaRows]);
  const metaSummary = storyboard.currentSummary;
  const campaignMetaRows = useMemo(
    () => mapMetaGroupsToProducts(metaSummary.byCampaign, analysis.products, manualMappings),
    [analysis.products, manualMappings, metaSummary.byCampaign],
  );
  const adMetaRows = useMemo(
    () => mapMetaGroupsToProducts(metaSummary.byAd, analysis.products, manualMappings),
    [analysis.products, manualMappings, metaSummary.byAd],
  );
  const adMappingStats = useMemo(() => metaMappingStats(adMetaRows), [adMetaRows]);
  const trustedAdMappingStats = useMemo(() => trustedMetaMappingStats(adMetaRows), [adMetaRows]);
  const productMeta = useMemo(() => productMetaSummaries(adMetaRows), [adMetaRows]);
  const enrichedProducts = useMemo(() => productsWithMetaRoas(analysis.products, productMeta), [analysis.products, productMeta]);
  const enrichedProductById = useMemo(() => new Map(enrichedProducts.map((product) => [product.id, product])), [enrichedProducts]);
  const hasMetaRows = metaRows.length > 0;
  const hasMetaRowsInRange = sourceStoryboard.currentRows.length > 0;
  const selectedCoverageShare = sourceStoryboard.currentCoverage.share;

  const handleMetaImport = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const textValue = await file.text();
      const parsed = parseMetaAdsImport(textValue);
      if (!parsed.length) {
        setMetaError("No usable Meta Ads rows were found. Export a CSV/JSON with spend, campaign, and purchase metrics.");
        return;
      }
      setMetaError("");
      persistManualMetaRows(parsed, new Date().toISOString());
      const importedWindow = dateWindowFromMetaRows(parsed);
      if (importedWindow) onMetaDateWindow(importedWindow);
    } catch (error) {
      setMetaError(error instanceof Error ? error.message : "Could not import Meta Ads file.");
    }
  }, [onMetaDateWindow, persistManualMetaRows]);

  const clearMetaImport = useCallback(() => {
    clearManualMetaImport();
    setMetaError("");
  }, [clearManualMetaImport]);

  const openProductWithMetaRoas = useCallback((product: ProductPoint) => {
    onOpenProduct(enrichedProductById.get(product.id) || product);
  }, [enrichedProductById, onOpenProduct]);

  const campaignMetaByKey = useMemo(
    () => new Map(campaignMetaRows.map((row) => [row.key, row])),
    [campaignMetaRows],
  );
  const storyboardActions = useMemo<AdsActionView[]>(() => storyboard.actions.map((action) => {
    const mappedRow = campaignMetaByKey.get(action.key);
    const match = mappedRow?.productMatch;
    const trustedProduct = dataSource === "shopify" && match?.product && match.level === "High"
      ? match.product
      : null;
    return {
      ...action,
      mappedProductTitle: trustedProduct?.title || "",
      mappingLabel: match?.reason === "Manual mapping override." ? "Manual" : match?.level || "Review",
      canOpenProduct: Boolean(trustedProduct),
    };
  }), [campaignMetaByKey, dataSource, storyboard.actions]);
  const availableMetaWindow = useMemo(() => dateWindowFromMetaRows(metaRows), [metaRows]);
  const metaUpdatedLabel = useMemo(() => {
    if (!metaImportedAt) return "";
    const timestamp = new Date(metaImportedAt);
    if (Number.isNaN(timestamp.getTime())) return "";
    return timestamp.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [metaImportedAt]);
  const sourceConfidence: AdsSourceView["confidence"] = selectedCoverageShare >= 0.9
    ? "High"
    : selectedCoverageShare >= 0.65
      ? "Medium"
      : "Low";
  const trustedMappingCopy = trustedAdMappingStats.spendShare === null
    ? "No selected spend is available for product mapping."
    : `${rawPercent(trustedAdMappingStats.spendShare)} of selected spend has a High or manual product match.`;
  const sourceConfidenceDetail = dataSource === "shopify"
    ? `${trustedMappingCopy} Campaign metrics do not require a product match.`
    : "Shopify is on the sample fallback, so product mapping is not treated as verified and product-specific action links are disabled.";
  const storyboardSource: AdsSourceView = {
    state: loadingMetaSheet && !hasMetaRows
      ? "loading"
      : !hasMetaRowsInRange
        ? metaSheetWarning || metaError
          ? "error"
          : "missing"
        : selectedCoverageShare < 0.8
          ? "partial"
          : usingManualMeta
            ? "manual"
            : "live",
    label: loadingMetaSheet && !hasMetaRows
      ? "Loading Google Sheets"
      : !hasMetaRowsInRange
        ? "No Meta Ads data in this range"
        : selectedCoverageShare < 0.8
          ? `${usingManualMeta ? "Uploaded file" : "Google Sheets"} · partial window`
          : usingManualMeta
            ? "Uploaded Meta Ads file"
            : "Google Sheets live",
    updatedAt: metaUpdatedLabel,
    availableRange: availableMetaWindow ? `${availableMetaWindow.start} – ${availableMetaWindow.end}` : "No usable dates",
    totalRows: metaRows.length,
    coverageShare: selectedCoverageShare,
    coverageLabel: `${number(storyboard.currentCoverage.observedDays)} of ${number(storyboard.currentCoverage.totalDays)} days · ${rawPercent(selectedCoverageShare)}`,
    confidence: sourceConfidence,
    confidenceDetail: sourceConfidenceDetail,
    trustedMappedSpendShare: dataSource === "shopify" ? trustedAdMappingStats.spendShare : null,
    warning: [metaError, metaSheetWarning].filter(Boolean).join(" "),
  };
  const openStoryboardProduct = useCallback((action: AdsActionView) => {
    const row = campaignMetaByKey.get(action.key);
    if (dataSource !== "shopify" || row?.productMatch.level !== "High" || !row.productMatch.product) return;
    openProductWithMetaRoas(row.productMatch.product);
  }, [campaignMetaByKey, dataSource, openProductWithMetaRoas]);

  return (
    <section className="mt-4">
      <div className="sr-only">
        <h2>Ads performance</h2>
        <p>Decide what to scale, watch, or fix using Meta spend, purchase value, and trusted Shopify product mapping.</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,text/csv,application/json"
        className="hidden"
        onChange={handleMetaImport}
      />
      <AdsPerformanceStoryboard
        model={storyboard}
        source={storyboardSource}
        actions={storyboardActions}
        scope={{
          allValue: META_ALL_SCOPE,
          campaign: activeCampaignScope,
          adSet: activeAdSetScope,
          ad: activeAdScope,
          campaigns: campaignOptions,
          adSets: adSetOptions,
          ads: adOptions,
          onCampaignChange: (value) => {
            setCampaignScope(value);
            setAdSetScope(META_ALL_SCOPE);
            setAdScope(META_ALL_SCOPE);
          },
          onAdSetChange: (value) => {
            setAdSetScope(value);
            setAdScope(META_ALL_SCOPE);
          },
          onAdChange: setAdScope,
          onClear: () => {
            setCampaignScope(META_ALL_SCOPE);
            setAdSetScope(META_ALL_SCOPE);
            setAdScope(META_ALL_SCOPE);
          },
        }}
        sourceControls={{
          syncing: loadingMetaSheet,
          hasManualRows: Boolean(manualMetaImport.rows.length),
          hasSheetRows: Boolean(sheetMetaImport.rows.length),
          usingManual: usingManualMeta,
          hasManualMappings: Boolean(Object.keys(manualMappings).length),
          onSync: () => void syncMetaSheet({ force: true, select: true }),
          onImport: () => fileInputRef.current?.click(),
          onToggleSource: toggleMetaSource,
          onClearFile: clearMetaImport,
          onResetMappings: resetManualMappings,
        }}
        onOpenProduct={openStoryboardProduct}
      />
      <details
        open={deepDiveOpen}
        onToggle={(event) => setDeepDiveOpen(event.currentTarget.open)}
        className="group mt-4 rounded-xl border bg-white shadow-sm"
      >
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black marker:hidden">
          <span>Tables &amp; product mapping</span>
          <span className="text-xs font-bold text-emerald-900 group-open:hidden">Open details</span>
          <span className="hidden text-xs font-bold text-emerald-900 group-open:inline">Close details</span>
        </summary>
        {deepDiveOpen ? (
        <div className="border-t p-3">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Meta Ads data</CardTitle>
          <CardDescription>
            Google Sheets loads automatically when the app opens. A file you upload takes priority for the current app session until you switch back to the Sheet.
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loadingMetaSheet}
              onClick={() => void syncMetaSheet({ force: true, select: true })}
            >
              <RefreshCcw className={loadingMetaSheet ? "animate-spin" : ""} data-icon="inline-start" />
              {loadingMetaSheet ? "Syncing Sheet" : "Sync Sheet"}
            </Button>
            <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload data-icon="inline-start" />
              Import CSV/JSON
            </Button>
            {manualMetaImport.rows.length && sheetMetaImport.rows.length ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={toggleMetaSource}
              >
                {usingManualMeta ? "Use Sheet" : "Use uploaded file"}
              </Button>
            ) : null}
            {manualMetaImport.rows.length ? (
              <Button type="button" size="sm" variant="outline" onClick={clearMetaImport}>
                <Trash2 data-icon="inline-start" />
                Clear file
              </Button>
            ) : null}
            {Object.keys(manualMappings).length ? (
              <Button type="button" size="sm" variant="outline" onClick={resetManualMappings}>
                Reset maps
              </Button>
            ) : null}
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4">
          {metaError ? (
            <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-950">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{metaError}</span>
            </div>
          ) : null}
          {metaSheetWarning ? (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{metaSheetWarning} Existing Ads data remains available.</span>
            </div>
          ) : null}
          <div className="rounded-xl border bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">
            {!hasMetaRows
              ? loadingMetaSheet
                ? "Loading Meta Ads from Google Sheets..."
                : "No Meta Ads data is available yet. Sync the Sheet or import a CSV/JSON file."
              : hasMetaRowsInRange
                ? `${number(metaSummary.rows)} rows in selected Shopify range ${dateWindow.start} to ${dateWindow.end} | ${number(metaRows.length)} total rows from ${metaSourceLabel} (${importedMetaSummary.dateRange})${metaImportedAt ? ` | Updated ${new Date(metaImportedAt).toLocaleString("en-US")}` : ""}`
                : `0 Meta rows from ${metaSourceLabel} match selected Shopify range ${dateWindow.start} to ${dateWindow.end}. Available range: ${importedMetaSummary.dateRange}. Change the dashboard date range or import a matching Meta export.`}
          </div>
          {hasMetaRowsInRange ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricMicro label="Spend" value={money(metaSummary.spend)} helper="Amount spent" />
                <MetricMicro label="Purchase value" value={money(metaSummary.purchaseValue)} helper="Meta reported revenue" />
                <MetricMicro label="Purchases" value={number(metaSummary.purchases)} helper={`${number(metaSummary.landingPageViews)} content/landing views`} />
                <MetricMicro label="ROAS" value={metaMetric(metaSummary.roas, (value) => number(value, 2))} helper="Purchase value / spend" />
                <MetricMicro label="CPA" value={metaMetric(metaSummary.cpa, (value) => money(value))} helper="Spend / purchases" />
                <MetricMicro label="CTR" value={metaMetric(metaSummary.ctr, (value) => rawPercent(value))} helper="Link clicks / impressions" />
                <MetricMicro label="CPC" value={metaMetric(metaSummary.cpc, (value) => money(value))} helper="Spend / link clicks" />
                <MetricMicro label="CPM" value={metaMetric(metaSummary.cpm, (value) => money(value))} helper="Spend per 1K impressions" />
                <MetricMicro
                  label="Mapped spend"
                  value={metaMetric(adMappingStats.spendShare, (value) => rawPercent(value))}
                  helper={`${money(adMappingStats.mappedSpend)} matched to Shopify products`}
                />
              </div>

              <Card size="sm">
                  <CardHeader>
                    <CardTitle>Campaign decisions</CardTitle>
                    <CardDescription>Top campaigns by spend, organized around what to do next and why.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CampaignDecisionBoard
                      rows={campaignMetaRows.slice(0, 8)}
                      actions={storyboard.actions}
                      onOpenProduct={openProductWithMetaRoas}
                    />
                  </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>Ad and ad set detail</CardTitle>
                  <CardDescription>Use this table to decide which creative, ad set, or campaign needs scale, watch, or fix work.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MetaAdsTable
                    rows={adMetaRows.slice(0, 25)}
                    products={analysis.products}
                    manualMappings={manualMappings}
                    onManualMap={updateManualMapping}
                    onOpenProduct={openProductWithMetaRoas}
                  />
                </CardContent>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Product ROAS from mapped Meta Ads</CardTitle>
                  <CardDescription>Manual mappings override auto-map. ROAS here is Meta purchase value divided by mapped spend.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductMetaRoasTable rows={productMeta} onOpenProduct={openProductWithMetaRoas} />
                </CardContent>
              </Card>
            </>
          ) : null}
        </CardContent>
      </Card>

        </div>
        ) : null}
      </details>
    </section>
  );
}

function matchToneClass(level: MetaProductMatch["level"]) {
  if (level === "High") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (level === "Medium") return "bg-sky-50 text-sky-800 ring-sky-200";
  if (level === "Low") return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function formatDecisionEvidenceValue(
  value: number | null,
  format: AdsDecisionEvidence["format"],
) {
  if (value === null || Number.isNaN(value)) return "No data";
  if (format === "percent") return rawPercent(value);
  if (format === "ratio") return `${number(value, 2)}×`;
  if (format === "currency") return money(value);
  return number(value);
}

function decisionEvidenceBenchmark(evidence: AdsDecisionEvidence) {
  if (!evidence.benchmark) return "";
  const operator = evidence.benchmark.operator === "gte" ? "≥" : "≤";
  return `target ${operator} ${formatDecisionEvidenceValue(evidence.benchmark.value, evidence.format)}`;
}

function metaMatchLabel(row: MappedMetaAdsGroup) {
  if (row.productMatch.reason === "Manually left unmapped.") return "Kept unlinked";
  if (row.productMatch.reason === "Manual mapping override.") return "Manually linked";
  if (!row.productMatch.product) return "Needs product link";
  if (row.productMatch.level === "High") return `Strong auto-match · ${number(row.productMatch.score)}/100`;
  if (row.productMatch.level === "Medium") return `Review auto-match · ${number(row.productMatch.score)}/100`;
  return `Low-confidence match · ${number(row.productMatch.score)}/100`;
}

function CampaignDecisionBoard({
  rows,
  actions,
  onOpenProduct,
}: {
  rows: MappedMetaAdsGroup[];
  actions: AdsStoryAction[];
  onOpenProduct: (product: ProductPoint) => void;
}) {
  if (!rows.length) {
    return <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">No campaigns to display.</div>;
  }

  const actionByKey = new Map(actions.map((action) => [action.key, action]));
  const decisions = rows.map((row) => ({ row, decision: actionByKey.get(row.key) || metaDecision(row) }));
  const counts = decisions.reduce(
    (current, { decision }) => ({ ...current, [decision.tone]: current[decision.tone] + 1 }),
    { scale: 0, watch: 0, fix: 0 },
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-2 leading-6">
          <Gauge aria-hidden="true" className="mt-1 size-4 shrink-0" />
          <p>
            <span className="font-bold">Read the recommendation first.</span>{" "}
            Labels such as <span className="font-bold">[SCALE]</span> belong to the Meta campaign name; the colored CamoSignal badge is the current recommendation.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2" aria-label="Recommendation summary">
          {counts.scale ? <Badge variant="outline" className={metaToneClass("scale")}>{counts.scale} Scale</Badge> : null}
          {counts.watch ? <Badge variant="outline" className={metaToneClass("watch")}>{counts.watch} Watch</Badge> : null}
          {counts.fix ? <Badge variant="outline" className={metaToneClass("fix")}>{counts.fix} Fix</Badge> : null}
        </div>
      </div>

      <ol className="grid gap-3" aria-label="Campaign recommendations ranked by spend">
        {decisions.map(({ row, decision }) => {
          const matchedProduct = row.productMatch.product;
          const DecisionIcon = decision.tone === "scale" ? ArrowUpRight : decision.tone === "fix" ? AlertTriangle : Gauge;
          const evidence = decision.evidence;
          return (
            <li key={row.key} className="rounded-xl border bg-white p-4 shadow-xs transition-colors hover:border-emerald-200">
              <article className="grid min-w-0 gap-5 xl:grid-cols-[minmax(260px,1.05fr)_minmax(300px,1.3fr)_minmax(270px,1fr)]">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Meta campaign</div>
                  <h3 className="mt-2 break-words text-sm font-black leading-5">{row.campaign}</h3>
                  <div className="mt-2 text-xs text-muted-foreground">Ranked by {money(row.spend)} spend</div>
                  <div className="mt-4 border-t pt-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Product match</div>
                    {matchedProduct ? (
                      <button
                        type="button"
                        onClick={() => onOpenProduct(matchedProduct)}
                        className="mt-2 flex w-full min-w-0 items-center gap-3 rounded-lg p-1 text-left transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <ProductImage product={matchedProduct} className="size-11" />
                        <span className="min-w-0">
                          <span className="line-clamp-2 text-sm font-black leading-5">{matchedProduct.title}</span>
                          <Badge variant="outline" className={`mt-1 max-w-full ${matchToneClass(row.productMatch.level)}`}>
                            <span className="truncate">{metaMatchLabel(row)}</span>
                          </Badge>
                        </span>
                      </button>
                    ) : (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950">
                        <div className="font-bold">Product not confirmed</div>
                        <div className="mt-1 text-xs">Keep this campaign in review until the naming is clear.</div>
                      </div>
                    )}
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">Edit links in the ad-level table below.</p>
                  </div>
                </div>

                <div className="min-w-0 border-t pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Recommended action</div>
                  <Badge variant="outline" className={`mt-2 h-6 gap-1 px-2.5 font-bold ${metaToneClass(decision.tone)}`}>
                    <DecisionIcon aria-hidden="true" className="size-3.5" />
                    {decision.label}
                  </Badge>
                  <p className="mt-2 text-sm leading-5 text-foreground">{decision.reason}</p>
                  <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2 text-xs leading-5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-medium text-muted-foreground">{evidence.label}</span>
                      <span className="font-black text-foreground">{formatDecisionEvidenceValue(evidence.value, evidence.format)}</span>
                      {evidence.benchmark ? (
                        <span className="text-muted-foreground">{decisionEvidenceBenchmark(evidence)}</span>
                      ) : null}
                    </div>
                    {evidence.context ? (
                      <div className="text-muted-foreground">
                        Based on {evidence.context.label.toLowerCase()}: {formatDecisionEvidenceValue(evidence.context.value, evidence.context.format)}
                      </div>
                    ) : null}
                    {evidence.note ? <div className="text-muted-foreground">{evidence.note}</div> : null}
                  </div>
                </div>

                <div className="min-w-0 border-t pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Performance</div>
                  <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-3">
                    <CampaignMetric label="ROAS" value={metaMetric(row.roas, (value) => `${number(value, 2)}×`)} strong />
                    <CampaignMetric label="Spend" value={money(row.spend)} />
                    <CampaignMetric label="Purchases" value={number(row.purchases)} />
                    <CampaignMetric label="CPA" value={metaMetric(row.cpa, (value) => money(value))} />
                    <CampaignMetric label="CTR" value={metaMetric(row.ctr, (value) => rawPercent(value))} />
                    <CampaignMetric label="Meta value" value={money(row.purchaseValue)} />
                  </dl>
                </div>

              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CampaignMetric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] leading-4 text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 truncate text-sm tabular-nums ${strong ? "font-black text-foreground" : "font-bold"}`} title={value}>
        {value}
      </dd>
    </div>
  );
}

function MetaAdsTable({
  rows,
  products,
  manualMappings,
  compact = false,
  onManualMap,
  onOpenProduct,
}: {
  rows: MappedMetaAdsGroup[];
  products: ProductPoint[];
  manualMappings: Record<string, string>;
  compact?: boolean;
  onManualMap: (rowKey: string, productId: string) => void;
  onOpenProduct: (product: ProductPoint) => void;
}) {
  if (!rows.length) {
    return <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">No Meta Ads rows to display.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Campaign</TableHead>
            {!compact ? <TableHead className="min-w-[220px]">Ad set / ad</TableHead> : null}
            <TableHead className="min-w-[260px]">Mapped product</TableHead>
            <TableHead className="text-right">Spend</TableHead>
            <TableHead className="text-right">Purchases</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">ROAS</TableHead>
            <TableHead className="text-right">CPA</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead>Decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const decision = metaDecision(row);
            const matchedProduct = row.productMatch.product;
            return (
              <TableRow key={row.key}>
                <TableCell className="align-top">
                  <div className="font-black">{row.campaign}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{number(row.rows)} rows</div>
                </TableCell>
                {!compact ? (
                  <TableCell className="align-top">
                    <div className="font-bold">{row.adSet}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{row.ad}</div>
                  </TableCell>
                ) : null}
                <TableCell className="align-top">
                  {matchedProduct ? (
                    <div className="max-w-[340px]">
                      <button
                        type="button"
                        onClick={() => onOpenProduct(matchedProduct)}
                        className="flex w-full items-center gap-3 rounded-lg p-1 text-left transition hover:bg-emerald-50"
                      >
                        <ProductImage product={matchedProduct} className="size-12" />
                        <span className="min-w-0">
                          <span className="line-clamp-2 text-sm font-black">{matchedProduct.title}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={matchToneClass(row.productMatch.level)}>
                              {row.productMatch.level} {number(row.productMatch.score)}
                            </Badge>
                            {!compact ? (
                              <span className="line-clamp-1 text-xs text-muted-foreground">{row.productMatch.reason}</span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                      <div className="mt-2">
                        <MetaProductSelect
                          row={row}
                          products={products}
                          manualMappings={manualMappings}
                          onManualMap={onManualMap}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[260px]">
                      <Badge variant="outline" className={matchToneClass("Review")}>
                        Review
                      </Badge>
                      {!compact ? <div className="mt-2 text-xs leading-5 text-muted-foreground">{row.productMatch.reason}</div> : null}
                      <div className="mt-2">
                        <MetaProductSelect
                          row={row}
                          products={products}
                          manualMappings={manualMappings}
                          onManualMap={onManualMap}
                        />
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right align-top font-bold">{money(row.spend)}</TableCell>
                <TableCell className="text-right align-top">{number(row.purchases)}</TableCell>
                <TableCell className="text-right align-top font-bold">{money(row.purchaseValue)}</TableCell>
                <TableCell className="text-right align-top font-black">
                  {metaMetric(row.roas, (value) => number(value, 2))}
                </TableCell>
                <TableCell className="text-right align-top">
                  {metaMetric(row.cpa, (value) => money(value))}
                </TableCell>
                <TableCell className="text-right align-top">
                  {metaMetric(row.ctr, (value) => rawPercent(value))}
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant="outline" className={metaToneClass(decision.tone)}>
                    {decision.label}
                  </Badge>
                  {!compact ? <div className="mt-2 max-w-[260px] text-xs leading-5 text-muted-foreground">{decision.reason}</div> : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function MetaProductSelect({
  row,
  products,
  manualMappings,
  onManualMap,
}: {
  row: MappedMetaAdsGroup;
  products: ProductPoint[];
  manualMappings: Record<string, string>;
  onManualMap: (rowKey: string, productId: string) => void;
}) {
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => b.currentSales - a.currentSales),
    [products],
  );
  const manualValue = manualMappings[row.key] || META_AUTO_MAP_VALUE;
  const autoProduct = row.productMatch.product;
  const manualProduct = products.find((product) => product.id === manualValue);
  const visibleValue = manualValue === META_AUTO_MAP_VALUE
    ? autoProduct
      ? `Auto-match: ${autoProduct.title}`
      : "Try auto-match"
    : manualValue === META_UNMAPPED_VALUE
      ? "Keep unlinked for review"
      : manualProduct
        ? `Manually linked: ${manualProduct.title}`
        : "Choose a Shopify product";

  return (
    <Select
      value={manualValue}
      onValueChange={(value) => {
        if (value) onManualMap(row.key, value);
      }}
    >
      <SelectTrigger
        aria-label={`Link ${row.campaign} to a Shopify product`}
        className="h-11 w-full bg-white text-xs sm:h-9"
      >
        <SelectValue>{visibleValue}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-80">
        <SelectItem value={META_AUTO_MAP_VALUE}>
          Use auto-match{autoProduct ? `: ${autoProduct.title}` : ""}
        </SelectItem>
        <SelectItem value={META_UNMAPPED_VALUE}>Keep unlinked for review</SelectItem>
        {sortedProducts.map((product) => (
          <SelectItem key={product.id} value={product.id}>
            {product.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProductMetaRoasTable({
  rows,
  onOpenProduct,
}: {
  rows: ProductMetaSummary[];
  onOpenProduct: (product: ProductPoint) => void;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm leading-6 text-muted-foreground">
        No product-level ROAS yet. Map Meta Ads rows to Shopify products first.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[280px]">Product</TableHead>
            <TableHead className="text-right">Spend</TableHead>
            <TableHead className="text-right">Purchases</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">ROAS</TableHead>
            <TableHead className="text-right">Mapped rows</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.product.id}>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onOpenProduct(row.product)}
                  className="flex max-w-[360px] items-center gap-3 rounded-lg p-1 text-left transition hover:bg-emerald-50"
                >
                  <ProductImage product={row.product} className="size-12" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-black">{row.product.title}</span>
                    <span className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {row.product.apparelType} | {row.product.theme}
                    </span>
                  </span>
                </button>
              </TableCell>
              <TableCell className="text-right font-bold">{money(row.spend)}</TableCell>
              <TableCell className="text-right">{number(row.purchases)}</TableCell>
              <TableCell className="text-right font-bold">{money(row.purchaseValue)}</TableCell>
              <TableCell className="text-right font-black">{metaMetric(row.roas, (value) => number(value, 2))}</TableCell>
              <TableCell className="text-right">{number(row.rows)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BlanksWorkspace({
  analysis,
  onOpenProduct,
}: {
  analysis: AppAnalysis;
  onOpenProduct: (product: ProductPoint) => void;
}) {
  return (
    <section className="mt-4">
      <ViewHeading
        title="Blanks & Variants"
        description="Understand which printed apparel blanks carry revenue and which need deeper variant analysis."
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Blank performance</CardTitle>
            <CardDescription>Revenue, orders, and active products by apparel type.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductTypeBars data={analysis.blankPerformance} />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Products by blank</CardTitle>
            <CardDescription>Open a product to inspect image and listing age.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {analysis.products.map((product) => (
              <ProductRow key={product.id} product={product} onOpen={onOpenProduct} />
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

type ReportDocxPayload = {
  analysis: AppAnalysis;
  totals: ReturnType<typeof analysisTotals>;
  groups: ReturnType<typeof actionGroups>;
  actionQueue: ProductPoint[];
  revenueDelta: number;
  actionRevenue: Record<ProductAction, number>;
  verdict: string;
  topTheme: AppAnalysis["themes"][number] | undefined;
  topBlank: AppAnalysis["blankPerformance"][number] | undefined;
  shopifyStatusLabel: string;
};

function sumProductSales(products: ProductPoint[]) {
  return products.reduce((sum, product) => sum + product.currentSales, 0);
}

function coverageWord(state: AppAnalysis["coverage"]["shopify"]) {
  if (state === "live") return "Live";
  if (state === "manual") return "Manual";
  return "Missing";
}

function buildReportVerdict(payload: {
  totals: ReturnType<typeof analysisTotals>;
  groups: ReturnType<typeof actionGroups>;
  actionRevenue: Record<ProductAction, number>;
  metaAds: AppAnalysis["coverage"]["metaAds"];
}) {
  const { actionRevenue, groups, metaAds, totals } = payload;
  const fixShare = totals.revenue ? actionRevenue.fix / totals.revenue : 0;
  const scaleShare = totals.revenue ? actionRevenue.scale / totals.revenue : 0;

  if (groups.fix.length && fixShare >= 0.25) {
    return "Fix leakage before broad scaling: too much revenue sits in products that need explanation before adding traffic.";
  }

  if (groups.scale.length && scaleShare >= 0.25 && metaAds === "live") {
    return "Scale selectively: there are enough product-level winners, and paid-spend context is available for ROAS guardrails.";
  }

  if (groups.scale.length) {
    return "Scale cautiously: product demand exists, but Meta ROAS is not fully trusted yet, so budget increases should stay controlled.";
  }

  return "Monitor before scaling: current data supports cleanup and watchlist work more than aggressive budget expansion.";
}

function reportFileDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function exportReportDocx({
  actionQueue,
  actionRevenue,
  analysis,
  groups,
  revenueDelta,
  shopifyStatusLabel,
  topBlank,
  topTheme,
  totals,
  verdict,
}: ReportDocxPayload) {
  const {
    AlignmentType,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import("docx");

  const paragraph = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, size: 22 })],
      spacing: { after: 140 },
    });

  const heading = (text: string) =>
    new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 140 },
    });

  const bullet = (title: string, body: string) =>
    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun({ text: title, bold: true, size: 22 }),
        new TextRun({ text: ` ${body}`, size: 22 }),
      ],
      spacing: { after: 100 },
    });

  const cell = (value: string, header = false) =>
    new TableCell({
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
      children: [
        new Paragraph({
          children: [new TextRun({ text: value || "-", bold: header, size: 20 })],
        }),
      ],
    });

  const table = (headers: string[], rows: string[][]) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: headers.map((header) => cell(header, true)) }),
        ...rows.map((row) => new TableRow({ children: row.map((value) => cell(value)) })),
      ],
    });

  const topScale = groups.scale[0];
  const topFix = groups.fix[0];
  const topWatch = groups.watch[0];
  const lifecycle = analysis.customerLifecycle;
  const recommendations = [
    topScale
      ? `Scale ${topScale.title} only with inventory cover and Meta ROAS guardrails. Current sales: ${money(topScale.currentSales)}.`
      : "No product has enough signal for aggressive scale in this report window.",
    topFix
      ? `Fix ${topFix.title} before adding traffic. Check product page, price, creative, collection placement, and season timing.`
      : "No fix-first product is currently above the action threshold.",
    topWatch
      ? `Keep ${topWatch.title} on the watchlist until it has more orders or paid-spend evidence.`
      : "No watchlist priority was identified beyond the scale/fix groups.",
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "CamoSignal Daily POD Operating Report",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.LEFT,
          }),
          paragraph(`${analysis.periodLabel} vs ${analysis.comparisonLabel}. Generated ${reportFileDate()} in US / Shopify time.`),
          heading("Executive Summary"),
          bullet("Decision verdict:", verdict),
          bullet(
            "Revenue and orders:",
            `${money(totals.revenue)} in displayed product revenue across ${number(totals.orders)} orders, ${percent(revenueDelta)} vs comparison.`,
          ),
          bullet(
            "Product triage:",
            `${groups.scale.length} scale, ${groups.watch.length} watch, and ${groups.fix.length} fix-first products. Scale revenue is ${money(actionRevenue.scale)}; fix-first revenue is ${money(actionRevenue.fix)}.`,
          ),
          bullet(
            "Data confidence:",
            `Shopify data is ${shopifyStatusLabel} and Meta Ads is ${coverageWord(analysis.coverage.metaAds)}. ROAS recommendations should stay conservative when Meta is not live or fully mapped.`,
          ),
          heading("KPI Snapshot"),
          table(
            ["Metric", "Current", "Interpretation"],
            [
              ["Revenue", money(totals.revenue), `${percent(revenueDelta)} vs comparison`],
              ["Orders", number(totals.orders), "Displayed product set"],
              ["Scale / Watch / Fix", `${groups.scale.length}/${groups.watch.length}/${groups.fix.length}`, "Decision split"],
              ["Top theme", topTheme ? topTheme.theme : "No data", topTheme ? `${money(topTheme.revenue)} / ${rawPercent(topTheme.share)} share` : "No theme evidence"],
              ["Top blank", topBlank ? topBlank.label : "No data", topBlank ? `${money(topBlank.revenue)} / ${number(topBlank.orders)} orders` : "No blank evidence"],
            ],
          ),
          heading("Recommended Next Steps"),
          ...recommendations.map((item, index) => bullet(`${index + 1}.`, item)),
          heading("Product Action Queue"),
          table(
            ["Product", "Decision", "Revenue", "Orders", "Change", "AOV", "Reason"],
            actionQueue.slice(0, 12).map((product) => [
              product.title,
              actionLabel(product.action),
              money(product.currentSales),
              number(product.currentOrders),
              percent(productDelta(product)),
              money(productAov(product)),
              product.actionReason,
            ]),
          ),
          heading("Season And Theme Evidence"),
          table(
            ["Theme", "Status", "Revenue", "Share", "Products"],
            analysis.themes.slice(0, 12).map((theme) => [
              theme.theme,
              theme.status,
              money(theme.revenue),
              rawPercent(theme.share),
              number(theme.products),
            ]),
          ),
          heading("Customer And Discount Caveat"),
          paragraph(
            lifecycle.available
              ? `Returning revenue share is ${rawPercent(lifecycle.returningRevenueShare)} and first-time revenue share is ${rawPercent(lifecycle.newCustomerRevenueShare)}. First-time discount rate is ${rawPercent(lifecycle.newCustomerDiscountRate)}; returning discount rate is ${rawPercent(lifecycle.returningDiscountRate)}.`
              : "Customer lifecycle diagnosis is locked until read_customers scope is granted. Revenue still loads, but new-vs-returning discount pressure cannot be trusted yet.",
          ),
          heading("Caveats And Assumptions"),
          bullet("Meta data:", "ROAS and paid-spend decisions require Meta Ads import/API data mapped to products or campaigns."),
          bullet("Season classification:", "Theme labels should use Shopify collection/tag evidence first, with title and description as fallback only."),
          bullet("New listings:", "Fresh products need a softer threshold; low sample size should land in watch, not immediate cut."),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `camosignal-pod-report-${reportFileDate()}.docx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function ReportsWorkspace({
  analysis,
  dataSource,
  onOpenProduct,
}: {
  analysis: AppAnalysis;
  dataSource: "sample" | "shopify";
  onOpenProduct: (product: ProductPoint) => void;
}) {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const groups = actionGroups(analysis.products);
  const totals = analysisTotals(analysis);
  const revenueDelta = (totals.revenue - totals.previousRevenue) / Math.max(totals.previousRevenue, 1);
  const actionRevenue: Record<ProductAction, number> = {
    scale: sumProductSales(groups.scale),
    watch: sumProductSales(groups.watch),
    fix: sumProductSales(groups.fix),
  };
  const topScale = groups.scale[0];
  const topFix = groups.fix[0];
  const topWatch = groups.watch[0];
  const topTheme = [...analysis.themes].sort((a, b) => b.revenue - a.revenue)[0];
  const topBlank = [...analysis.blankPerformance].sort((a, b) => b.revenue - a.revenue)[0];
  const lifecycle = analysis.customerLifecycle;
  const actionQueue = [...groups.fix, ...groups.scale, ...groups.watch].sort(
    (a, b) => Math.abs(productDelta(b)) - Math.abs(productDelta(a)),
  );
  const verdict = buildReportVerdict({ totals, groups, actionRevenue, metaAds: analysis.coverage.metaAds });
  const matureFixCount = groups.fix.filter((product) => (listingAgeDays(product) ?? 0) >= 21).length;
  const newWatchCount = groups.watch.filter((product) => (listingAgeDays(product) ?? 999) < 21).length;
  const roasCoverageCount = analysis.products.filter((product) => product.roas !== null).length;
  const roasCoverage = analysis.products.length ? roasCoverageCount / analysis.products.length : 0;
  const shopifyStatusLabel = dataSource === "shopify" ? `${coverageWord(analysis.coverage.shopify)} Shopify` : "Sample fallback";

  async function handleExportDocx() {
    setIsExportingDocx(true);
    try {
      await exportReportDocx({
        actionQueue,
        actionRevenue,
        analysis,
        groups,
        revenueDelta,
        shopifyStatusLabel,
        topBlank,
        topTheme,
        totals,
        verdict,
      });
    } finally {
      setIsExportingDocx(false);
    }
  }

  return (
    <section className="mt-4 max-w-[1320px] space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="items-start gap-4 lg:flex-row lg:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Operating memo</div>
            <CardTitle className="mt-1 text-3xl">Daily POD Operating Report</CardTitle>
            <CardDescription className="mt-2">
              {analysis.periodLabel} vs {analysis.comparisonLabel}. Built from Shopify sales, product metadata, listing age, season context, and Meta Ads readiness.
            </CardDescription>
          </div>
          <CardAction className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={dataSource === "shopify" ? "bg-emerald-50 px-3 py-1 text-emerald-800" : "bg-amber-50 px-3 py-1 text-amber-800"}
            >
              {shopifyStatusLabel}
            </Badge>
            <Button type="button" onClick={handleExportDocx} disabled={isExportingDocx} className="gap-2">
              <Download className="size-4" />
              {isExportingDocx ? "Exporting..." : "Export DOCX"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-5">
          <section className="rounded-xl border bg-emerald-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">Executive Summary</h3>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {verdict}
                </p>
              </div>
              <Badge variant="outline" className={revenueDelta >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                {percent(revenueDelta)} revenue
              </Badge>
            </div>
            <div className="mt-4 grid gap-3 text-sm leading-6 lg:grid-cols-4">
            <ReportBullet
              title="Growth quality"
              body={`${money(totals.revenue)} in displayed product revenue is ${percent(revenueDelta)} versus the comparison set. The report separates scale candidates from products that need a fix first.`}
            />
            <ReportBullet
              title="Product triage"
              body={`${groups.scale.length} products are ready to scale, ${groups.watch.length} need more evidence, and ${groups.fix.length} should be fixed before adding traffic.`}
            />
            <ReportBullet
              title="Season context"
              body={topTheme ? `${topTheme.theme} leads theme revenue at ${money(topTheme.revenue)} (${rawPercent(topTheme.share)} share). Interpret winners and losers against US retail and outdoor season timing.` : "Theme data is missing, so season interpretation should stay conservative."}
            />
            <ReportBullet
              title="Discount context"
              body={lifecycle.available
                ? `${rawPercent(lifecycle.returningRevenueShare)} of revenue is from returning customers, while first-time customer discount rate is ${rawPercent(lifecycle.newCustomerDiscountRate)}. Use this to separate retention from acquisition markdowns.`
                : "Add read_customers scope to split discount pressure between first-time and returning buyers."}
            />
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <MetricMicro label="Revenue" value={money(totals.revenue)} helper={`${percent(revenueDelta)} vs comparison`} />
        <MetricMicro label="Orders" value={number(totals.orders)} helper="Displayed product set" />
        <MetricMicro label="Scale / Watch / Fix" value={`${groups.scale.length}/${groups.watch.length}/${groups.fix.length}`} helper={`${money(actionRevenue.scale)} scale revenue`} />
        <MetricMicro label="ROAS coverage" value={rawPercent(roasCoverage)} helper={`${coverageWord(analysis.coverage.metaAds)} Meta Ads`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Revenue evidence and timing</CardTitle>
            <CardDescription>Daily net sales, Shopify time. Use the shape to spot recovery, drop-offs, and abnormal days.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">How to read this:</strong> this trend is the timing evidence behind the recommendation. A product can look strong on aggregate while still hiding weak days; use this chart before making budget moves, then validate with the product queue below.
            </p>
            <RevenueTrendChart data={analysis.daily} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recommended action path</CardTitle>
            <CardDescription>Do this before broad budget changes.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {topScale && (
              <ReportRecommendation
                label="1"
                tone="scale"
                title={`Scale: ${topScale.title}`}
                body="Increase budget only with stock cover and Meta ROAS guardrails in place."
              />
            )}
            {topFix && (
              <ReportRecommendation
                label="2"
                tone="fix"
                title={`Fix first: ${topFix.title}`}
                body="Check product page, creative, price, collection placement, and whether the core season window has passed."
              />
            )}
            {topWatch && (
              <ReportRecommendation
                label="3"
                tone="watch"
                title={`Watch: ${topWatch.title}`}
                body="Do not cut early. Wait for more orders or Meta spend evidence before making a hard call."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Product-level decision queue</CardTitle>
          <CardDescription>Evidence table for scale, watch, and fix-first calls.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[1180px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">AOV</TableHead>
                  <TableHead className="text-right">Cover</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Why it matters</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionQueue.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => onOpenProduct(product)}
                        className="grid max-w-[320px] grid-cols-[46px_minmax(0,1fr)] items-center gap-3 text-left"
                      >
                        <ProductImage product={product} className="h-14 w-11" />
                        <span className="min-w-0">
                          <span className="line-clamp-2 font-black">{product.title}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Listing {listingAgeDays(product) ?? "-"} days | Signal strength {product.confidence}
                          </span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">{product.apparelType}</div>
                      <div className="text-xs text-muted-foreground">{product.theme}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-black">{money(product.currentSales)}</div>
                      <div className="text-xs text-muted-foreground">{number(product.currentOrders)} orders</div>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${deltaTone(productDelta(product))}`}>
                      {percent(productDelta(product))}
                    </TableCell>
                    <TableCell className="text-right font-bold">{money(productAov(product))}</TableCell>
                    <TableCell className="text-right">
                      {product.daysOfCover === null ? "Missing" : `${number(product.daysOfCover, 1)} days`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={actionTone(product.action)}>
                        {actionLabel(product.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[420px] whitespace-normal text-sm leading-6 text-muted-foreground">
                      {product.actionReason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Decision guardrails</CardTitle>
            <CardDescription>Rules that keep recommendations from becoming blind automation.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6">
            <ReportBullet
              title="Scale only with confirmation."
              body="Scale candidates need enough orders, inventory cover, and ideally Meta ROAS. If Meta is not mapped, increase traffic in smaller steps."
            />
            <ReportBullet
              title="Fix first means diagnose, not delete."
              body={`${matureFixCount} mature products are in fix-first. Check page quality, price, creative, collection placement, season timing, and discount pressure before cutting traffic.`}
            />
            <ReportBullet
              title="Watch protects new designs."
              body={`${newWatchCount} watchlist products are still young. Low sample size should not be treated the same as a mature listing with declining demand.`}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Portfolio mix evidence</CardTitle>
            <CardDescription>Blank and theme mix that shapes the next decision.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6">
            <ReportBullet
              title="Top blank"
              body={topBlank ? `${topBlank.label} generated ${money(topBlank.revenue)} from ${number(topBlank.orders)} orders across ${number(topBlank.products)} products.` : "Blank performance is not available in this report window."}
            />
            <ReportBullet
              title="Top theme"
              body={topTheme ? `${topTheme.theme} is ${topTheme.status.toLowerCase()} and contributes ${rawPercent(topTheme.share)} of theme revenue.` : "Theme performance is not available in this report window."}
            />
            <ReportBullet
              title="Revenue at risk"
              body={`${money(actionRevenue.fix)} is currently sitting in fix-first products. Do not push more traffic into this bucket until the cause is clearer.`}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Data confidence</CardTitle>
            <CardDescription>What the report can and cannot prove today.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6">
            <ReportBullet
              title="Shopify sales"
              body={`${shopifyStatusLabel}. Revenue, orders, product metadata, images, product type, collections, tags, and listing age are the strongest signals.`}
            />
            <ReportBullet
              title="Meta Ads"
              body={`${coverageWord(analysis.coverage.metaAds)}. ROAS is available for ${number(roasCoverageCount)} of ${number(analysis.products.length)} products, so paid-media conclusions should remain gated.`}
            />
            <ReportBullet
              title="Customer lifecycle"
              body={lifecycle.available ? lifecycle.diagnosis : "Locked until read_customers scope is granted. Discount pressure cannot be split cleanly by new vs returning customers yet."}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Season and theme checks</CardTitle>
            <CardDescription>Interpret performance through collection and event context.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">Takeaway:</strong> not every low performer is a bad design. Some themes should be watched against season timing, especially hunting windows, fishing season, and gifting moments.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Theme</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.themes.map((theme) => (
                  <TableRow key={theme.theme}>
                    <TableCell className="font-black">{theme.theme}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{theme.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-black">{money(theme.revenue)}</TableCell>
                    <TableCell className="text-right">{rawPercent(theme.share)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Open questions and caveats</CardTitle>
            <CardDescription>What could change the recommendation.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6">
            <ReportBullet
              title="Meta spend is not fully automated yet."
              body="ROAS-based recommendations should stay conservative until the Meta Ads import/API is connected."
            />
            <ReportBullet
              title="Collection source should override guessed labels."
              body="Season and theme assignment should come from Shopify collection/tag evidence before product title inference."
            />
            <ReportBullet
              title="New listings need a different threshold."
              body="Products with low listing age should be watched longer before calling them winners or losers."
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ReportBullet({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="font-black">{title}</div>
      <div className="mt-1 text-muted-foreground">{body}</div>
    </div>
  );
}

function ReportRecommendation({
  label,
  title,
  body,
  tone,
}: {
  label: string;
  title: string;
  body: string;
  tone: "scale" | "watch" | "fix";
}) {
  const toneClass =
    tone === "scale"
      ? "bg-emerald-50 text-emerald-900"
      : tone === "watch"
        ? "bg-amber-50 text-amber-900"
        : "bg-red-50 text-red-900";
  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 rounded-xl border bg-white p-3">
      <div className={`grid size-8 place-items-center rounded-full text-sm font-black ${toneClass}`}>{label}</div>
      <div>
        <div className="line-clamp-2 font-black">{title}</div>
        <div className="mt-1 text-sm leading-6 text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}

function MethodologyWorkspace() {
  return (
    <section className="mt-4">
      <ViewHeading
        title="Methodology"
        description="A transparent glossary of dashboard terms, formulas, decision rules, and data limitations."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Decision model</CardTitle>
            <CardDescription>How the app turns Shopify data into action labels.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6">
            <MethodCard
              title="Scale"
              body="A product needs at least 10 current-period orders and revenue growth of 8% or more. This is only a candidate label; stock and Meta ROAS still decide how aggressively to scale."
            />
            <MethodCard
              title="Watch"
              body="The default state when evidence is incomplete, mixed, too new, or missing Meta spend. Watch protects you from cutting or scaling too early."
            />
            <MethodCard
              title="Fix first"
              body="A product has at least 10 current-period orders, previous sales, a revenue drop of 25% or more, and is mature enough to evaluate. Check offer, creative, page, price, season, and collection placement before adding traffic."
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Signal strength</CardTitle>
            <CardDescription>Why a product card shows a score such as 96.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6">
            <MethodCard
              title="Formula"
              body="35 base points + order-volume evidence + collection evidence + listing date + product image + description, capped at 96."
            />
            <MethodCard
              title="Meaning"
              body="It measures how complete the evidence is for the recommendation. It is not a probability that the product will win or lose."
            />
            <MethodCard
              title="How to read it"
              body="High score: trust the action label more. Low score: gather more orders, traffic, spend, or product metadata before taking a strong action."
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Data guardrails</CardTitle>
            <CardDescription>What the dashboard can and cannot know yet.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6">
            <MethodCard
              title="Shopify"
              body="Orders, revenue, products, images, inventory, listing date, collections, tags, and descriptions are read from Shopify."
            />
            <MethodCard
              title="Customer lifecycle"
              body="New vs returning customers requires read_customers. Without it, orders appear as guest/unmatched."
            />
            <MethodCard
              title="Meta Ads"
              body="ROAS requires Meta spend or imported ad data. Until then, traffic recommendations stay conservative."
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-2">
        <MethodologyTable
          title="English glossary and formulas"
          description="Terms, definitions, formulas, and how each signal is used."
          rows={[...englishMethodology, ...additionalEnglishMethodology]}
        />
        <MethodologyTable
          title="Bảng thuật ngữ và công thức tiếng Việt"
          description="Ý nghĩa, công thức, và cách app dùng từng tín hiệu để hỗ trợ quyết định."
          rows={[...vietnameseMethodology, ...additionalVietnameseMethodology]}
        />
      </div>
    </section>
  );
}

function MethodCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="font-black">{title}</div>
      <div className="mt-1 text-muted-foreground">{body}</div>
    </div>
  );
}

function MethodologyTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: MethodologyRow[];
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Term</TableHead>
                <TableHead className="min-w-[280px]">Meaning</TableHead>
                <TableHead className="min-w-[260px]">Formula / rule</TableHead>
                <TableHead className="min-w-[320px]">How the app uses it</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${title}-${row.term}`}>
                  <TableCell className="align-top font-black">{row.term}</TableCell>
                  <TableCell className="align-top text-sm leading-6 text-muted-foreground">{row.meaning}</TableCell>
                  <TableCell className="align-top font-mono text-xs leading-6 text-emerald-900">{row.formula}</TableCell>
                  <TableCell className="align-top text-sm leading-6 text-muted-foreground">{row.usage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsWorkspace({ metaAdsCoverage }: { metaAdsCoverage: MetaAdsCoverageDisplay }) {
  return (
    <section className="mt-4">
      <ViewHeading
        title="Settings"
        description="Connection status and V2 rollout notes."
      />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Data connections</CardTitle>
          <CardDescription>V2 supports Shopify live data, private Google Sheets sync, and manual Meta Ads import.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <CoverageLine icon={PackageSearch} label="Revenue and orders" value="Shopify Admin API" state="Live" />
          <CoverageLine icon={Layers3} label="Products and inventory" value="Line items + variants" state="Live" />
          <CoverageLine icon={Megaphone} label="Spend and ROAS" value={metaAdsCoverage.value} state={metaAdsCoverage.state} />
          <div className="rounded-xl border bg-white p-4 text-sm leading-6 md:col-span-2">
            Google Sheets credentials stay on the server, while CSV/JSON upload remains available as a browser-local fallback.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function daysFromRange(value: string): number {
  if (value === "Today" || value === "Yesterday") return 1;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 14;
}

const SHOPIFY_ADMIN_TIME_ZONE = "America/New_York";

function dateKeyInClientZone(date: Date, timeZone = SHOPIFY_ADMIN_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = new Map(parts.map((part) => [part.type, part.value]));
  return `${map.get("year")}-${map.get("month")}-${map.get("day")}`;
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 0, 0, 0)).toISOString().slice(0, 10);
}

function daysInDateWindow(window: DateWindow): number {
  const start = Date.parse(`${window.start}T00:00:00Z`);
  const end = Date.parse(`${window.end}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 1;
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

function presetDateWindow(preset: DatePreset): DateWindow {
  const today = dateKeyInClientZone(new Date());
  if (preset === "Today") return { start: today, end: today };
  if (preset === "Yesterday") {
    const yesterday = addDaysToDateKey(today, -1);
    return { start: yesterday, end: yesterday };
  }

  const days = daysFromRange(preset);
  return {
    start: addDaysToDateKey(today, -(days - 1)),
    end: today,
  };
}

function selectedPeriodLabel(preset: DatePreset, window: DateWindow): string {
  if (preset === "Custom") return `${window.start} - ${window.end}`;
  if (preset === "Today" || preset === "Yesterday") return preset;
  return `Last ${daysFromRange(preset)} days`;
}

function normalizeDateWindow(window: DateWindow): DateWindow {
  if (!window.start || !window.end) return presetDateWindow("14 days");
  if (window.end < window.start) return { start: window.end, end: window.start };
  return window;
}

function sessionTokenFromUrl(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const idToken = params.get("id_token") || "";
  const session = params.get("session") || "";
  return idToken || (session.split(".").length === 3 ? session : "");
}

function storedShopifySession(): string {
  if (typeof window === "undefined") return "";
  return inMemoryShopifySession || safeStorageGet("local", SHOPIFY_SESSION_STORAGE_KEY);
}

function setStoredShopifySession(value: string) {
  if (typeof window === "undefined" || !value) return;
  inMemoryShopifySession = value;
  safeStorageSet("local", SHOPIFY_SESSION_STORAGE_KEY, value);
}

function storeSessionFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const encryptedSession = params.get("csi_session") || "";
  if (!encryptedSession) return;

  setStoredShopifySession(encryptedSession);
  params.delete("csi_session");
  const query = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

function normalizeShopDomain(value: string): string {
  const raw = value
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  if (raw.endsWith(".myshopify.com")) return raw;
  if (/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(raw)) return `${raw}.myshopify.com`;
  return "";
}

function shopFromHostParam(host: string | null): string {
  if (!host || typeof window === "undefined") return "";

  try {
    const decoded = window.atob(host.replace(/-/g, "+").replace(/_/g, "/"));
    const storeMatch = decoded.match(/\/store\/([^/?#]+)/i);
    return normalizeShopDomain(storeMatch?.[1] || "");
  } catch {
    return "";
  }
}

function shopFromUrl(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return (
    normalizeShopDomain(params.get("shop") || "") ||
    normalizeShopDomain(window.shopify?.config?.shop || "") ||
    shopFromHostParam(params.get("host"))
  );
}

function activeShopDomain(): string {
  return shopFromUrl() || DEFAULT_SHOPIFY_STORE_DOMAIN;
}

function cleanConnectedParam() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("connected") && !params.has("csi_session")) return;

  params.delete("connected");
  params.delete("csi_session");
  const query = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isShopifyContext(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has("host") || params.has("hmac") || params.has("embedded")) return true;

  try {
    return window.top !== window.self;
  } catch {
    return true;
  }
}

async function waitForAppBridge(timeoutMs: number): Promise<NonNullable<Window["shopify"]> | null> {
  if (typeof window === "undefined") return null;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (window.shopify?.idToken) return window.shopify;
    await wait(120);
  }

  return window.shopify?.idToken ? window.shopify : null;
}

async function appBridgeToken(timeoutMs = 1600): Promise<string> {
  const shopify = await waitForAppBridge(timeoutMs);
  if (!shopify?.idToken) return "";

  const token = await Promise.race([
    shopify.idToken(),
    new Promise<string>((resolve) => window.setTimeout(() => resolve(""), 1000)),
  ]).catch(() => "");
  return token || "";
}

async function fetchJsonWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<{ response: Response; payload: Record<string, unknown> }> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    return { response, payload: payload as Record<string, unknown> };
  } finally {
    window.clearTimeout(timer);
  }
}

async function shopifyAuthHeaders(options: { includeAppBridge?: boolean; appBridgeTimeoutMs?: number } = {}): Promise<HeadersInit> {
  const storedSession = storedShopifySession();
  const urlToken = sessionTokenFromUrl();
  if (urlToken) {
    return storedSession
      ? { Authorization: `Bearer ${urlToken}`, "x-csi-shopify-session": storedSession }
      : { Authorization: `Bearer ${urlToken}` };
  }

  if (options.includeAppBridge !== false) {
    const token = await appBridgeToken(options.appBridgeTimeoutMs ?? (isShopifyContext() ? 1600 : 250));
    if (token) {
      return storedSession
        ? { Authorization: `Bearer ${token}`, "x-csi-shopify-session": storedSession }
        : { Authorization: `Bearer ${token}` };
    }
  }

  return storedSession ? { "x-csi-shopify-session": storedSession } : {};
}

async function establishShopifySession(options: { includeAppBridge?: boolean; appBridgeTimeoutMs?: number } = {}): Promise<boolean> {
  if (storedShopifySession()) return true;
  if (inFlightShopifySession) return inFlightShopifySession;

  inFlightShopifySession = (async () => {
    const token =
      sessionTokenFromUrl() ||
      (options.includeAppBridge ? await appBridgeToken(options.appBridgeTimeoutMs ?? (isShopifyContext() ? 1600 : 250)) : "");
    if (!token) return false;

    const shop = activeShopDomain();
    const { response, payload } = await fetchJsonWithTimeout("/api/auth/exchange", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({ idToken: token, shop }),
    }, 8000);
    if (typeof payload.clientSession === "string") {
      setStoredShopifySession(payload.clientSession);
    }

    return Boolean(response.ok && payload.connected);
  })();

  try {
    return await inFlightShopifySession;
  } finally {
    inFlightShopifySession = null;
  }
}

function shopifyConnectUrl(): string {
  const shop = activeShopDomain();
  const base = `${window.location.origin}/api/auth/start`;
  return shop ? `${base}?shop=${encodeURIComponent(shop)}` : base;
}

function navigateTop(url: string) {
  try {
    window.top?.location.assign(url);
  } catch {
    window.location.assign(url);
  }
}

function reauthorizeShopify() {
  if (typeof window !== "undefined") {
    inMemoryShopifySession = "";
    safeStorageRemove("local", SHOPIFY_SESSION_STORAGE_KEY);
    safeStorageRemove("session", `csi_oauth_attempted:${activeShopDomain()}`);
  }
  navigateTop(shopifyConnectUrl());
}

function shouldStartShopifyOAuth(warning: string): boolean {
  return /session token is missing|shopify is not connected|oauth|exchange|access token|unable to exchange|invalid token|unauthorized|returned 401|returned 403|scope|not granted/i.test(warning);
}

async function maybeStartShopifyOAuth(warning: string, options: { force?: boolean } = {}): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const knownShop = shopFromUrl() || DEFAULT_SHOPIFY_STORE_DOMAIN;
  if (!options.force && !isShopifyContext()) return false;
  if (!shouldStartShopifyOAuth(warning)) return false;

  const shop = shopFromUrl();
  const targetShop = shop || knownShop;
  if (!targetShop) return false;

  const attemptKey = `csi_oauth_attempted:${targetShop}`;
  if (options.force) {
    safeStorageRemove("session", attemptKey);
    safeStorageRemove("local", SHOPIFY_SESSION_STORAGE_KEY);
  } else if (safeStorageGet("session", attemptKey) === "1") {
    return false;
  }

  const sessionReady = await establishShopifySession({
    includeAppBridge: isShopifyContext(),
    appBridgeTimeoutMs: 1200,
  }).catch(() => false);
  if (sessionReady) return false;

  const statusParams = new URLSearchParams({ shop: targetShop });
  let connected = false;
  try {
    const { payload: status } = await fetchJsonWithTimeout(`/api/auth/status?${statusParams.toString()}`, {
      headers: await shopifyAuthHeaders({
        includeAppBridge: isShopifyContext(),
        appBridgeTimeoutMs: 900,
      }),
      credentials: "include",
      cache: "no-store",
    }, 5000);
    connected = Boolean(status.connected);
  } catch {
    connected = false;
  }
  if (connected) return false;

  safeStorageSet("session", attemptKey, "1");
  navigateTop(shopifyConnectUrl());
  return true;
}

type LoadShopifyOptions = {
  forceOAuth?: boolean;
};

function useMetaAdsController(): MetaAdsController {
  const [manualImport, setManualImport] = useState<MetaAdsImportState>({ rows: [], importedAt: "" });
  const [sheetImport, setSheetImport] = useState<GoogleMetaAdsState>({
    rows: [],
    importedAt: "",
    label: "",
  });
  const [preferManual, setPreferManual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState("");
  const [manualMappings, setManualMappings] = useState<Record<string, string>>({});
  const syncRequestIdRef = useRef(0);
  const sourceIntentRevisionRef = useRef(0);
  const autoSyncStartedRef = useRef(false);

  const usingManual = preferManual || !sheetImport.rows.length;
  const activeImport = usingManual ? manualImport : sheetImport;
  const sourceLabel = usingManual
    ? manualImport.rows.length
      ? "uploaded CSV/JSON"
      : "no source"
    : sheetImport.label || "Google Sheets";

  const syncSheet = useCallback(async (options: MetaAdsSyncOptions = {}) => {
    const requestId = syncRequestIdRef.current + 1;
    syncRequestIdRef.current = requestId;
    const sourceIntentRevision = options.select
      ? sourceIntentRevisionRef.current + 1
      : sourceIntentRevisionRef.current;
    if (options.select) sourceIntentRevisionRef.current = sourceIntentRevision;
    setLoading(true);
    setWarning("");

    try {
      await establishShopifySession({
        includeAppBridge: isShopifyContext() && !storedShopifySession(),
        appBridgeTimeoutMs: 1200,
      }).catch(() => false);
      const endpoint = options.force ? "/api/meta-ads?refresh=1" : "/api/meta-ads";
      const { response, payload } = await fetchJsonWithTimeout(endpoint, {
        headers: await shopifyAuthHeaders({
          includeAppBridge: isShopifyContext() && !storedShopifySession(),
          appBridgeTimeoutMs: 900,
        }),
        credentials: "include",
        cache: "no-store",
      }, 15_000) as {
        response: Response;
        payload: GoogleMetaAdsPayload;
      };

      if (!response.ok) {
        throw new Error(payload.error || `Google Sheets sync returned ${response.status}.`);
      }

      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      if (!rows.length) {
        throw new Error("Google Sheets returned no usable Meta Ads rows.");
      }
      if (requestId !== syncRequestIdRef.current) return;

      const sheetLabel = [payload.sheet?.spreadsheetTitle, payload.sheet?.sheetTitle]
        .filter(Boolean)
        .join(" / ");
      setSheetImport({
        rows,
        importedAt: payload.loadedAt || new Date().toISOString(),
        label: sheetLabel || "Google Sheets",
      });
      if (options.select && sourceIntentRevision === sourceIntentRevisionRef.current) {
        setPreferManual(false);
      }
    } catch (error) {
      if (requestId === syncRequestIdRef.current) {
        setWarning(error instanceof Error ? error.message : "Could not sync Google Sheets.");
      }
    } finally {
      if (requestId === syncRequestIdRef.current) setLoading(false);
    }
  }, []);

  const persistManualRows = useCallback((rows: MetaAdsRow[], importedAt: string) => {
    sourceIntentRevisionRef.current += 1;
    setManualImport({ rows, importedAt });
    setPreferManual(true);
    safeStorageSet("local", META_ADS_STORAGE_KEY, JSON.stringify({ rows, importedAt }));
  }, []);

  const clearManual = useCallback(() => {
    sourceIntentRevisionRef.current += 1;
    setManualImport({ rows: [], importedAt: "" });
    setPreferManual(false);
    safeStorageRemove("local", META_ADS_STORAGE_KEY);
  }, []);

  const toggleSource = useCallback(() => {
    sourceIntentRevisionRef.current += 1;
    setPreferManual((current) => !current);
  }, []);

  const updateMapping = useCallback((rowKey: string, productId: string) => {
    setManualMappings((current) => {
      const next = { ...current };
      if (productId === META_AUTO_MAP_VALUE) {
        delete next[rowKey];
      } else {
        next[rowKey] = productId;
      }
      safeStorageSet("local", META_ADS_MAPPING_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetMappings = useCallback(() => {
    setManualMappings({});
    safeStorageRemove("local", META_ADS_MAPPING_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedImport = storedMetaAdsImport();
      setManualImport(storedImport);
      setPreferManual(false);
      setManualMappings(storedMetaAdsMappings());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (autoSyncStartedRef.current) return;
      autoSyncStartedRef.current = true;
      void syncSheet();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [syncSheet]);

  return useMemo(() => ({
    manualImport,
    sheetImport,
    usingManual,
    rows: activeImport.rows,
    importedAt: activeImport.importedAt,
    sourceLabel,
    loading,
    warning,
    manualMappings,
    syncSheet,
    persistManualRows,
    clearManual,
    toggleSource,
    updateMapping,
    resetMappings,
  }), [
    activeImport.importedAt,
    activeImport.rows,
    clearManual,
    loading,
    manualImport,
    manualMappings,
    persistManualRows,
    resetMappings,
    sheetImport,
    sourceLabel,
    syncSheet,
    toggleSource,
    updateMapping,
    usingManual,
    warning,
  ]);
}

export function DashboardV2({ analysis: initialAnalysis }: { analysis: AppAnalysis }) {
  const [analysis, setAnalysis] = useState<AppAnalysis>(initialAnalysis);
  const [selectedProduct, setSelectedProduct] = useState<ProductPoint | null>(null);
  const [range, setRange] = useState<DatePreset>("14 days");
  const [dateWindow, setDateWindow] = useState<DateWindow>(() => presetDateWindow("14 days"));
  const [salesChannel, setSalesChannel] = useState<SalesChannelFilter>("online_store");
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [decisionTab, setDecisionTab] = useState("actions");
  const [loadingLiveData, setLoadingLiveData] = useState(false);
  const [dataSource, setDataSource] = useState<"sample" | "shopify">("sample");
  const [dataWarning, setDataWarning] = useState("");
  const metaAds = useMetaAdsController();
  const metaStoryboard = useMemo(
    () => buildAdsStoryboard(metaAds.rows, dateWindow),
    [dateWindow, metaAds.rows],
  );
  const metaAdsCoverage = useMemo<MetaAdsCoverageDisplay>(() => {
    const hasRows = metaAds.rows.length > 0;
    const hasRowsInRange = metaStoryboard.currentRows.length > 0;
    if (metaAds.loading && !hasRows) {
      return { state: "Loading", value: "Connecting Google Sheets" };
    }
    if (!hasRows) {
      return {
        state: "Missing",
        value: metaAds.warning || "Waiting for Google Sheets or file import",
      };
    }
    if (!hasRowsInRange) {
      return {
        state: "Missing",
        value: `${metaAds.sourceLabel} · no rows in selected range`,
      };
    }
    if (metaAds.usingManual) {
      return { state: "Manual", value: "Uploaded CSV/JSON" };
    }
    if (metaStoryboard.currentCoverage.share < 0.8) {
      return {
        state: "Manual",
        value: `${metaAds.sheetImport.label || "Google Sheets"} · partial selected range`,
      };
    }
    return { state: "Live", value: metaAds.sheetImport.label || "Google Sheets" };
  }, [metaAds, metaStoryboard.currentCoverage.share, metaStoryboard.currentRows.length]);
  const currentMetaProductRows = useMemo(
    () => mapMetaGroupsToProducts(
      metaStoryboard.currentSummary.byAd,
      analysis.products,
      metaAds.manualMappings,
    ),
    [analysis.products, metaAds.manualMappings, metaStoryboard.currentSummary.byAd],
  );
  const trustedCurrentMetaProductRows = useMemo(
    () => dataSource === "shopify"
      ? currentMetaProductRows.filter((row) => row.productMatch.product && row.productMatch.level === "High")
      : [],
    [currentMetaProductRows, dataSource],
  );
  const currentProductMeta = useMemo(
    () => productMetaSummaries(trustedCurrentMetaProductRows),
    [trustedCurrentMetaProductRows],
  );
  const analysisWithMeta = useMemo<AppAnalysis>(() => {
    const roasKpi = metaStoryboard.kpis.find((item) => item.key === "roas");
    const roas = metaStoryboard.currentSummary.roas;
    const hasRowsInRange = metaStoryboard.currentRows.length > 0;
    const coverageState: AppAnalysis["coverage"]["metaAds"] = metaAdsCoverage.state === "Live"
      ? "live"
      : metaAdsCoverage.state === "Manual"
        ? "manual"
        : "missing";

    return {
      ...analysis,
      coverage: {
        ...analysis.coverage,
        metaAds: coverageState,
      },
      metrics: analysis.metrics.map((metric) => metric.label.toLowerCase() === "roas"
        ? {
          ...metric,
          value: hasRowsInRange && roas !== null ? `${number(roas, 2)}x` : "No data",
          delta: hasRowsInRange ? roasKpi?.delta ?? null : null,
          helper: hasRowsInRange
            ? "Meta purchase value / spend"
            : "No Meta Ads rows in selected range",
        }
        : metric),
      products: productsWithMetaRoas(
        analysis.products,
        currentProductMeta,
        true,
        dataSource === "shopify" && metaStoryboard.currentRows.length > 0,
      ),
    };
  }, [analysis, currentProductMeta, dataSource, metaAdsCoverage.state, metaStoryboard]);
  const groups = useMemo(() => actionGroups(analysisWithMeta.products), [analysisWithMeta.products]);
  const totals = useMemo(() => analysisTotals(analysisWithMeta), [analysisWithMeta]);
  const liveBadgeLabel = loadingLiveData
    ? "Loading Shopify"
    : dataSource === "shopify"
      ? "Shopify live"
      : "Sample fallback";
  const shopifyCoverageState = dataSource === "shopify" ? "Live" : "Missing";
  const shopifyCoverageValue = dataSource === "shopify" ? "Shopify orders" : "Waiting for Shopify env/session";
  const growthPeriodLabel = selectedPeriodLabel(range, dateWindow);

  const loadShopifyData = useCallback(async (
    nextRange: DatePreset,
    nextDateWindow: DateWindow,
    nextSalesChannel: SalesChannelFilter,
    options: LoadShopifyOptions = {},
  ) => {
    setLoadingLiveData(true);
    setDataWarning("");

    try {
      if (options.forceOAuth && typeof window !== "undefined") {
        safeStorageRemove("local", SHOPIFY_SESSION_STORAGE_KEY);
        safeStorageRemove("session", `csi_oauth_attempted:${activeShopDomain()}`);
      }
      const shouldUseAppBridge = isShopifyContext() && !storedShopifySession();
      await establishShopifySession({
        includeAppBridge: shouldUseAppBridge,
        appBridgeTimeoutMs: 1200,
      }).catch(() => false);
      const safeDateWindow = normalizeDateWindow(nextDateWindow);
      const params = new URLSearchParams({
        source: "shopify",
        days: String(daysInDateWindow(safeDateWindow) || daysFromRange(nextRange)),
        start: safeDateWindow.start,
        end: safeDateWindow.end,
        channel: nextSalesChannel,
      });

      if (typeof window !== "undefined") {
        const currentParams = new URLSearchParams(window.location.search);
        const shop = activeShopDomain() || currentParams.get("shop");
        const key = currentParams.get("key");
        if (shop) params.set("shop", shop);
        if (key) params.set("key", key);
      }

      const { payload } = await fetchJsonWithTimeout(`/api/insights?${params.toString()}`, {
        headers: await shopifyAuthHeaders({
          includeAppBridge: shouldUseAppBridge && !storedShopifySession(),
          appBridgeTimeoutMs: 900,
        }),
        credentials: "include",
        cache: "no-store",
      }, INSIGHTS_REQUEST_TIMEOUT_MS) as {
        response: Response;
        payload: {
          analysis?: AppAnalysis;
          source?: string;
          warning?: string;
          error?: string;
        };
      };

      if (payload?.analysis) {
        setAnalysis(payload.analysis);
      }
      setDataSource(payload?.source === "shopify" ? "shopify" : "sample");
      setDataWarning(payload?.warning || payload?.error || "");
      if (payload?.source !== "shopify" && payload?.warning) {
        const startedOAuth = await maybeStartShopifyOAuth(payload.warning, { force: options.forceOAuth });
        if (startedOAuth) {
          setDataWarning("Opening Shopify authorization to connect live data...");
        }
      }
    } catch (error) {
      setDataSource("sample");
      setDataWarning(error instanceof Error ? error.message : "Could not load Shopify data");
    } finally {
      setLoadingLiveData(false);
    }
  }, []);

  const handleMetaDateWindow = useCallback((nextDateWindow: DateWindow) => {
    setRange("Custom");
    setDateWindow(normalizeDateWindow(nextDateWindow));
  }, []);

  useEffect(() => {
    storeSessionFromUrl();
    cleanConnectedParam();
    const timer = window.setTimeout(() => {
      void loadShopifyData(range, dateWindow, salesChannel);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [dateWindow, loadShopifyData, range, salesChannel]);

  const handleShopifyDataButton = useCallback(() => {
    if (dataSource !== "shopify") {
      reauthorizeShopify();
      return;
    }

    void loadShopifyData(range, dateWindow, salesChannel, { forceOAuth: true });
  }, [dataSource, dateWindow, loadShopifyData, range, salesChannel]);

  return (
    <div className="min-h-screen bg-[#f7faf7] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="hidden border-r bg-white px-4 py-5 lg:block">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-[#0b2b1e] text-sm font-black text-white">CS</div>
            <div>
              <h1 className="text-xl font-black leading-tight">CamoSignal</h1>
              <p className="text-sm text-muted-foreground">Insight Engine V2</p>
            </div>
          </div>
          <nav className="mt-7">
            <NavigationMenu activeView={activeView} onSelect={setActiveView} />
          </nav>
          <div className="mt-8 rounded-xl border bg-card p-3 text-sm">
            <div className="font-bold">Store</div>
            <div className="mt-1 text-muted-foreground">camosignal.com</div>
          </div>
        </aside>

        <main className="min-w-0 px-3 pb-4 lg:px-6 lg:py-4">
          <div className="sticky top-0 z-40 -mx-3 mb-3 flex min-h-15 items-center justify-between border-b bg-white/95 px-3 py-2 backdrop-blur lg:hidden">
            <Button type="button" size="icon" variant="outline" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}>
              <Menu />
            </Button>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-lg bg-[#0b2b1e] text-xs font-black text-white">CS</div>
              <div><div className="font-black leading-tight">CamoSignal</div><div className="text-[10px] text-muted-foreground">Insight Engine V2</div></div>
            </div>
            <Badge
              variant="outline"
              aria-label="Meta Ads status"
              className={metaAdsCoverage.state === "Live"
                ? "bg-emerald-50 text-emerald-800"
                : metaAdsCoverage.state === "Loading"
                  ? "bg-blue-50 text-blue-800"
                  : "bg-amber-50 text-amber-800"}
            >
              Ads {metaAdsCoverage.state.toLowerCase()}
            </Badge>
          </div>
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="w-[280px] max-w-[86vw] p-0">
              <SheetHeader className="border-b px-4 py-5">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-[#0b2b1e] text-sm font-black text-white">CS</div>
                  <div><SheetTitle className="text-xl font-black">CamoSignal</SheetTitle><SheetDescription>Insight Engine V2</SheetDescription></div>
                </div>
              </SheetHeader>
              <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
                <NavigationMenu
                  activeView={activeView}
                  mobile
                  onSelect={(nextView) => {
                    setActiveView(nextView);
                    setMobileNavOpen(false);
                  }}
                />
              </nav>
              <div className="m-3 rounded-xl border bg-card p-3 text-sm"><div className="font-bold">Store</div><div className="mt-1 text-muted-foreground">camosignal.com</div></div>
            </SheetContent>
          </Sheet>
          <section className="grid gap-3 rounded-xl border bg-white p-3 shadow-sm xl:grid-cols-[1fr_auto]">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={range}
                onValueChange={(value) => {
                  if (!value) return;
                  const nextRange = value as DatePreset;
                  setRange(nextRange);
                  if (nextRange !== "Custom") {
                    setDateWindow(presetDateWindow(nextRange));
                  }
                }}
              >
                <SelectTrigger className="h-10 w-[150px] bg-white">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Today">Today</SelectItem>
                    <SelectItem value="Yesterday">Yesterday</SelectItem>
                    <SelectItem value="7 days">7 days</SelectItem>
                    <SelectItem value="14 days">14 days</SelectItem>
                    <SelectItem value="30 days">30 days</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select value={salesChannel} onValueChange={(value) => setSalesChannel((value || "online_store") as SalesChannelFilter)}>
                <SelectTrigger className="h-10 w-[160px] bg-white">
                  <SelectValue placeholder="Sales channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="online_store">Online Store</SelectItem>
                    <SelectItem value="all">All channels</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="date-start">Start date</label>
                <input
                  id="date-start"
                  type="date"
                  value={dateWindow.start}
                  onChange={(event) => {
                    setRange("Custom");
                    setDateWindow((current) => normalizeDateWindow({ ...current, start: event.target.value }));
                  }}
                  className="h-10 rounded-lg border bg-white px-3 text-sm font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <label className="sr-only" htmlFor="date-end">End date</label>
                <input
                  id="date-end"
                  type="date"
                  value={dateWindow.end}
                  onChange={(event) => {
                    setRange("Custom");
                    setDateWindow((current) => normalizeDateWindow({ ...current, end: event.target.value }));
                  }}
                  className="h-10 rounded-lg border bg-white px-3 text-sm font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20"
                />
              </div>
              {activeView !== "ads" ? (
                <>
                  <div className="rounded-lg border bg-white px-3 py-2 text-sm font-bold">{analysisWithMeta.periodLabel}</div>
                  <div className="text-sm text-muted-foreground">US / Shopify day. Compared with {analysisWithMeta.comparisonLabel}</div>
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={dataSource === "shopify" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}
              >
                {liveBadgeLabel}
              </Badge>
              <Badge
                variant="outline"
                aria-label="Meta Ads status"
                title={metaAdsCoverage.value}
                className={metaAdsCoverage.state === "Live"
                  ? "bg-emerald-50 text-emerald-800"
                  : metaAdsCoverage.state === "Loading"
                    ? "bg-blue-50 text-blue-800"
                  : metaAdsCoverage.state === "Manual"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-slate-50 text-slate-700"}
              >
                Meta Ads {metaAdsCoverage.state.toLowerCase()}
              </Badge>
              <Button
                size="sm"
                onClick={handleShopifyDataButton}
                disabled={loadingLiveData}
              >
                <RefreshCcw data-icon="inline-start" />
                {loadingLiveData ? "Loading" : dataSource === "shopify" ? "Load data" : "Reconnect Shopify"}
              </Button>
            </div>
          </section>

          {dataWarning && activeView === "ads" ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
              <span>Shopify product mapping is unverified while the dashboard is using the sample fallback.</span>
              {/session token is missing|shopify is not connected/i.test(dataWarning) ? (
                <Button size="sm" variant="outline" className="border-amber-300 bg-white text-amber-950 hover:bg-amber-100" onClick={reauthorizeShopify}>
                  Connect Shopify
                </Button>
              ) : null}
            </div>
          ) : dataWarning ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              <span>
                Shopify live data could not be loaded, so the dashboard is showing the sample fallback. Detail: {dataWarning}
              </span>
              {/session token is missing|shopify is not connected/i.test(dataWarning) ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
                  onClick={reauthorizeShopify}
                >
                  Connect Shopify
                </Button>
              ) : null}
            </div>
          ) : null}

          {activeView === "overview" ? (
            <>
          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>POD Decision Center</CardTitle>
                <CardDescription>Printed apparel, blanks, and hunting/fishing themes</CardDescription>
                <CardAction>
                  <Tabs value={decisionTab} onValueChange={setDecisionTab}>
                    <TabsList>
                      <TabsTrigger value="actions">Actions</TabsTrigger>
                      <TabsTrigger value="products">Products</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardAction>
              </CardHeader>
              <CardContent>
                {decisionTab === "actions" ? (
                  <div className="grid gap-3 xl:grid-cols-3">
                    <DecisionLane action="scale" products={groups.scale} onOpen={setSelectedProduct} />
                    <DecisionLane action="watch" products={groups.watch} onOpen={setSelectedProduct} />
                    <DecisionLane action="fix" products={groups.fix} onOpen={setSelectedProduct} />
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {analysisWithMeta.products.map((product) => (
                      <ProductRow key={product.id} product={product} onOpen={setSelectedProduct} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <OverallPerformance analysis={analysisWithMeta} />
          </section>

          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {analysisWithMeta.metrics.map((metric) => (
              <MetricTile key={metric.label} {...metric} />
            ))}
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Revenue trend</CardTitle>
                <CardDescription>Daily net sales, ET / Shopify time</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueTrendChart data={analysisWithMeta.daily} />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Product type performance</CardTitle>
                <CardDescription>Revenue by blank/product type</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductTypeBars data={analysisWithMeta.blankPerformance} />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Revenue calendar</CardTitle>
                <CardDescription>Click-through view will connect to day drilldown in the next pass</CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarHeatmap data={analysisWithMeta.daily} />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Season and theme readout</CardTitle>
                <CardDescription>Source-led classification, not random assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Theme</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisWithMeta.themes.map((theme) => (
                      <TableRow key={theme.theme}>
                        <TableCell className="font-bold">{theme.theme}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{theme.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">{money(theme.revenue, "USD", true)}</TableCell>
                        <TableCell className="text-right">{rawPercent(theme.share)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Product intelligence</CardTitle>
                <CardDescription>Images, product type, source classification, listing age, and action logic</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[460px] pr-3">
                  <div className="grid gap-3">
                    {analysisWithMeta.products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="grid gap-3 rounded-xl border bg-white p-3 text-left transition hover:border-emerald-300 hover:shadow-sm md:grid-cols-[84px_minmax(0,1.2fr)_minmax(140px,0.8fr)_120px]"
                      >
                        <ProductImage product={product} className="aspect-[4/5] w-full max-w-[84px]" />
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm font-black">{product.title}</div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Badge variant="secondary">{product.apparelType}</Badge>
                            <Badge variant="outline">{product.theme}</Badge>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {product.source} | Listing {listingAgeDays(product) ?? "-"} days
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Signal</div>
                          <div className="mt-1 text-sm font-bold">{money(product.currentSales)} | {number(product.currentOrders)} orders</div>
                          <div className="mt-2">
                            <ProductMiniTrend product={product} />
                          </div>
                        </div>
                        <div className="flex flex-col justify-between gap-3">
                          <Badge variant="outline" className={actionTone(product.action)}>
                            {actionLabel(product.action)}
                          </Badge>
                          <div>
                            <div className="text-xs font-bold text-muted-foreground">Signal strength</div>
                            <div className="mt-1 flex items-center gap-2">
                              <Progress value={product.confidence} className="h-2" />
                              <span className="text-xs font-black">{product.confidence}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Data source coverage</CardTitle>
                <CardDescription>Shopify is primary. Meta Ads is the only ad source tracked here.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <CoverageLine icon={PackageSearch} label="Revenue and orders" value={shopifyCoverageValue} state={shopifyCoverageState} />
                <CoverageLine icon={Layers3} label="Products and inventory" value={shopifyCoverageValue === "Shopify orders" ? "Line items + variants" : "Waiting for product access"} state={shopifyCoverageState} />
                <CoverageLine icon={Megaphone} label="Spend and ROAS" value={metaAdsCoverage.value} state={metaAdsCoverage.state} />
                <Separator />
                <div className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                  Current product recommendations are conservative until Meta spend and ROAS data are connected.
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
                  Product images, collection source, listing age, and description are already part of the V2 data model.
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="mt-4 rounded-xl border bg-white p-3 text-sm text-muted-foreground">
            Net sales from displayed products: <strong className="text-foreground">{money(totals.revenue)}</strong> |
            Orders: <strong className="text-foreground">{number(totals.orders)}</strong> |
            Comparison revenue: <strong className="text-foreground">{money(totals.previousRevenue)}</strong>
          </div>
            </>
          ) : (
            <WorkspaceView
              view={activeView}
              analysis={analysisWithMeta}
              periodLabel={growthPeriodLabel}
              onOpenProduct={setSelectedProduct}
              dateWindow={dateWindow}
              onMetaDateWindow={handleMetaDateWindow}
              metaAdsCoverage={metaAdsCoverage}
              metaAds={metaAds}
              dataSource={dataSource}
            />
          )}
        </main>
      </div>
      <ProductDetailSheet
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedProduct(null);
        }}
      />
    </div>
  );
}

function CoverageLine({
  icon: Icon,
  label,
  value,
  state,
}: {
  icon: typeof PackageSearch;
  label: string;
  value: string;
  state: MetaAdsCoverageDisplay["state"];
}) {
  const tone =
    state === "Live"
      ? "bg-emerald-50 text-emerald-800"
      : state === "Loading"
        ? "bg-blue-50 text-blue-800"
      : state === "Manual"
        ? "bg-amber-50 text-amber-800"
        : "bg-red-50 text-red-800";
  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3">
      <div className="grid size-9 place-items-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-black">{value}</div>
      </div>
      <Badge variant="outline" className={tone}>{state}</Badge>
    </div>
  );
}

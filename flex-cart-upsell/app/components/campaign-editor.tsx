import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  Check,
  FloppyDisk,
  Package,
  Plus,
  SlidersHorizontal,
  Sparkle,
  Storefront,
  X,
} from "@phosphor-icons/react";

import { STRATEGY_OPTIONS } from "../lib/campaign-defaults";
import type {
  CampaignCondition,
  CampaignDraft,
  ConditionField,
  ConditionOperator,
  RecommendationFilters,
  UpsellDiscountType,
} from "../lib/recommendation-types";
import type { StorefrontPreviewProfile } from "../lib/storefront-preview-profile";
import { StorefrontLivePreview } from "./storefront-live-preview";

interface CampaignEditorProps {
  initialCampaign: CampaignDraft;
  catalogueCount: number;
  productChoices: Array<{ id: string; title: string }>;
  syncedAt: string | null;
  saving: boolean;
  syncing: boolean;
  storefrontProfile: StorefrontPreviewProfile;
  testInStoreUrl: string;
  onSave: (campaign: CampaignDraft) => void;
  onSync: () => void;
}

const CONDITION_FIELDS: Array<{ value: ConditionField; label: string }> = [
  { value: "CART_SUBTOTAL", label: "Cart subtotal" },
  { value: "CART_ITEM_COUNT", label: "Cart item count" },
  { value: "CART_PRODUCT", label: "Cart contains product" },
  { value: "CART_COLLECTION", label: "Cart contains collection" },
  { value: "CART_TAG", label: "Cart contains tag" },
  { value: "CART_VENDOR", label: "Cart contains vendor" },
  { value: "CART_PRODUCT_TYPE", label: "Cart contains product type" },
];

const CONDITION_OPERATORS: Array<{
  value: ConditionOperator;
  label: string;
}> = [
  { value: "CONTAINS", label: "contains" },
  { value: "NOT_CONTAINS", label: "does not contain" },
  { value: "EQUALS", label: "equals" },
  { value: "NOT_EQUALS", label: "does not equal" },
  { value: "GREATER_OR_EQUAL", label: "is greater than or equal to" },
  { value: "LESS_OR_EQUAL", label: "is less than or equal to" },
];

function placementTitle(placement: CampaignDraft["placement"]) {
  if (placement === "PRODUCT_PAGE") return "Product page upsell";
  return placement === "CART_DRAWER" ? "Cart drawer upsell" : "Cart page upsell";
}

const FILTER_TEXT_FIELDS: Array<{
  key: keyof RecommendationFilters;
  label: string;
  placeholder: string;
}> = [
  {
    key: "includeCollections",
    label: "Include collections",
    placeholder: "accessories, summer",
  },
  {
    key: "excludeCollections",
    label: "Exclude collections",
    placeholder: "sale, clearance",
  },
  {
    key: "includeTags",
    label: "Include tags",
    placeholder: "gift, premium",
  },
  {
    key: "excludeTags",
    label: "Exclude tags",
    placeholder: "no-upsell",
  },
  {
    key: "includeVendors",
    label: "Include vendors",
    placeholder: "Camo Signal",
  },
  {
    key: "excludeVendors",
    label: "Exclude vendors",
    placeholder: "Third-party",
  },
  {
    key: "includeProductTypes",
    label: "Include product types",
    placeholder: "Accessory",
  },
  {
    key: "excludeProductTypes",
    label: "Exclude product types",
    placeholder: "Gift Card",
  },
];

const WEIGHT_LABELS: Record<string, string> = {
  collection: "Same collection",
  popularity: "Popularity",
  priceAffinity: "Price affinity",
  productType: "Same product type",
  recency: "Recency",
  tag: "Same tags",
  vendor: "Same vendor",
};

const COLOR_CONTROLS: Array<{
  key: keyof CampaignDraft["appearance"];
  label: string;
}> = [
  { key: "cardBackground", label: "Card background" },
  { key: "cardBorder", label: "Card border" },
  { key: "textColor", label: "Text" },
  { key: "mutedTextColor", label: "Muted text" },
  { key: "buttonBackground", label: "Button background" },
  { key: "buttonTextColor", label: "Button text" },
  { key: "accentColor", label: "Accent" },
];

function splitValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatSyncTime(syncedAt: string | null) {
  if (!syncedAt) return "Never synced";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(syncedAt));
}

function FormCard({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="fc-form-card">
      <div className="fc-form-card-heading">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function CampaignEditor({
  initialCampaign,
  catalogueCount,
  productChoices,
  syncedAt,
  saving,
  syncing,
  storefrontProfile,
  testInStoreUrl,
  onSave,
  onSync,
}: CampaignEditorProps) {
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [appearancePanel, setAppearancePanel] = useState<
    "content" | "style" | "advanced"
  >("content");
  const [productSearch, setProductSearch] = useState("");
  const [pairTriggerId, setPairTriggerId] = useState("");
  const [pairOfferId, setPairOfferId] = useState("");

  const selectedStrategy = useMemo(
    () =>
      STRATEGY_OPTIONS.find((option) => option.value === campaign.strategy) ??
      STRATEGY_OPTIONS[0],
    [campaign.strategy],
  );
  const filteredProductChoices = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return productChoices.slice(0, 12);
    return productChoices
      .filter((product) => product.title.toLowerCase().includes(query))
      .slice(0, 12);
  }, [productChoices, productSearch]);
  const productTitleById = useMemo(
    () => new Map(productChoices.map((product) => [product.id, product.title])),
    [productChoices],
  );

  const updateAppearance = <K extends keyof CampaignDraft["appearance"]>(
    key: K,
    value: CampaignDraft["appearance"][K],
  ) => {
    setCampaign((current) => ({
      ...current,
      appearance: { ...current.appearance, [key]: value },
    }));
  };

  const applyAppearancePreset = (
    stylePreset: CampaignDraft["appearance"]["stylePreset"],
  ) => {
    setCampaign((current) => ({
      ...current,
      appearance:
        stylePreset === "CAMOSIGNAL"
          ? {
              ...current.appearance,
              stylePreset,
              heading:
                current.placement === "CART_DRAWER"
                  ? "You might also like these"
                  : current.placement === "PRODUCT_PAGE"
                    ? "People also bought"
                    : "Complete your order",
              subheading: "",
              layout:
                current.placement === "CART_DRAWER" ? "CAROUSEL" : "STACKED",
              imageRatio: "PORTRAIT",
              showVendor: false,
              showComparePrice: true,
              showVariantPicker: true,
              showQuickAdd: true,
              cardBackground: "#ffffff",
              cardBorder: "#dce2dd",
              textColor: "#18251f",
              mutedTextColor: "#6d766f",
              buttonBackground: "#294237",
              buttonTextColor: "#ffffff",
              accentColor: "#c84436",
              borderRadius: 12,
              imageRadius: 8,
              spacing: 10,
              buttonLabel: "Add",
            }
          : stylePreset === "COMPLETE_THE_LOOK"
          ? {
              ...current.appearance,
              stylePreset,
              heading: "COMPLETE THE LOOK",
              subheading: "",
              layout: "STACKED",
              imageRatio: "PORTRAIT",
              showVendor: false,
              showComparePrice: false,
              showVariantPicker: true,
              showQuickAdd: true,
              cardBackground: "#fbfbfb",
              cardBorder: "#eeeeee",
              textColor: "#111111",
              mutedTextColor: "#606060",
              buttonBackground: "#000000",
              buttonTextColor: "#ffffff",
              accentColor: "#3aa8d8",
              borderRadius: 0,
              imageRadius: 0,
              spacing: 4,
              buttonLabel: "ADD",
            }
          : {
              ...current.appearance,
              stylePreset,
              heading:
                current.placement === "CART_DRAWER"
                  ? "You may also like"
                  : "Complete your order",
              subheading: "Picked to match what is already in your cart.",
              cardBackground: "#ffffff",
              cardBorder: "#e3e3e3",
              textColor: "#1f2124",
              mutedTextColor: "#6d7175",
              buttonBackground: "#1f2124",
              buttonTextColor: "#ffffff",
              accentColor: "#008060",
              borderRadius: 12,
              imageRadius: 9,
              spacing: 12,
              buttonLabel: "Add",
            },
    }));
  };

  const updateFilters = <K extends keyof RecommendationFilters>(
    key: K,
    value: RecommendationFilters[K],
  ) => {
    setCampaign((current) => ({
      ...current,
      filters: { ...current.filters, [key]: value },
    }));
  };

  const updateDiscount = <K extends keyof CampaignDraft["discount"]>(
    key: K,
    value: CampaignDraft["discount"][K],
  ) => {
    setCampaign((current) => ({
      ...current,
      discount: { ...current.discount, [key]: value },
    }));
  };

  const updateDiscountType = (type: UpsellDiscountType) => {
    setCampaign((current) => ({
      ...current,
      discount: {
        ...current.discount,
        type,
        value:
          type === "PERCENTAGE"
            ? current.discount.value > 0 && current.discount.value <= 100
              ? current.discount.value
              : 10
            : type === "FIXED_AMOUNT"
              ? current.discount.value > 0
                ? current.discount.value
                : 5
              : 0,
      },
    }));
  };

  const addCondition = () => {
    setCampaign((current) => ({
      ...current,
      conditions: [
        ...current.conditions,
        {
          id: crypto.randomUUID(),
          field: "CART_SUBTOTAL",
          operator: "GREATER_OR_EQUAL",
          value: 50,
        },
      ],
    }));
  };

  const updateCondition = (id: string, patch: Partial<CampaignCondition>) => {
    setCampaign((current) => ({
      ...current,
      conditions: current.conditions.map((condition) =>
        condition.id === id ? { ...condition, ...patch } : condition,
      ),
    }));
  };

  const removeCondition = (id: string) => {
    setCampaign((current) => ({
      ...current,
      conditions: current.conditions.filter((condition) => condition.id !== id),
    }));
  };

  const toggleManualProduct = (productId: string) => {
    setCampaign((current) => {
      const selected = new Set(current.strategyConfig.manualProductIds);
      if (selected.has(productId)) selected.delete(productId);
      else selected.add(productId);
      return {
        ...current,
        strategyConfig: {
          ...current.strategyConfig,
          manualProductIds: [...selected],
        },
      };
    });
  };

  const addComplementaryPair = () => {
    if (!pairTriggerId || !pairOfferId || pairTriggerId === pairOfferId) return;
    setCampaign((current) => {
      const currentOffers =
        current.strategyConfig.complementaryByProductId[pairTriggerId] ?? [];
      return {
        ...current,
        strategyConfig: {
          ...current.strategyConfig,
          complementaryByProductId: {
            ...current.strategyConfig.complementaryByProductId,
            [pairTriggerId]: [...new Set([...currentOffers, pairOfferId])],
          },
        },
      };
    });
    setPairOfferId("");
  };

  const removeComplementaryPair = (triggerId: string, offerId: string) => {
    setCampaign((current) => {
      const nextMappings = {
        ...current.strategyConfig.complementaryByProductId,
      };
      const nextOffers = (nextMappings[triggerId] ?? []).filter(
        (id) => id !== offerId,
      );
      if (nextOffers.length > 0) nextMappings[triggerId] = nextOffers;
      else delete nextMappings[triggerId];
      return {
        ...current,
        strategyConfig: {
          ...current.strategyConfig,
          complementaryByProductId: nextMappings,
        },
      };
    });
  };

  return (
    <main className="fc-editor-shell">
      <header className="fc-editor-topbar">
        <div className="fc-editor-title">
          <Link
            aria-label="Back to campaign types"
            to="/app/create"
          >
            <ArrowLeft aria-hidden size={18} weight="bold" />
          </Link>
          <div>
            <p className="fc-eyebrow">Campaign editor</p>
            <div>
              <h1>
                {placementTitle(campaign.placement)}
              </h1>
              <span
                className={
                  campaign.enabled
                    ? "fc-badge fc-badge--success"
                    : "fc-badge fc-badge--neutral"
                }
              >
                {campaign.enabled ? "Active" : "Draft"}
              </span>
            </div>
          </div>
        </div>
        <div className="fc-editor-actions">
          <a
            className="fc-button fc-button--secondary"
            href={testInStoreUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Storefront aria-hidden size={15} />
            Test in store
          </a>
          <label className="fc-switch">
            <input
              checked={campaign.enabled}
              onChange={(event) =>
                setCampaign((current) => ({
                  ...current,
                  enabled: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span aria-hidden />
            Active
          </label>
          <button
            className="fc-button fc-button--primary"
            disabled={saving}
            onClick={() => onSave(campaign)}
            type="button"
          >
            <FloppyDisk aria-hidden size={15} weight="bold" />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </header>

      <div className="fc-editor-layout">
        <div className="fc-editor-main">
          <FormCard
            title="Campaign name"
            description="Used for internal reference only."
          >
            <label className="fc-field">
              <span>Campaign name</span>
              <input
                onChange={(event) =>
                  setCampaign((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="For example: Cart drawer best sellers"
                value={campaign.name}
              />
            </label>
          </FormCard>

          <FormCard
            title="Placement"
            description="Choose where this campaign appears."
          >
            <label className="fc-field">
              <span>Placement</span>
              <select
                onChange={(event) =>
                  navigate(`/app/editor?placement=${event.target.value}`)
                }
                value={campaign.placement}
              >
                <option value="PRODUCT_PAGE">Product page</option>
                <option value="CART_DRAWER">Cart drawer</option>
                <option value="CART_PAGE">Cart page</option>
              </select>
            </label>
          </FormCard>

          <FormCard
            title="Trigger"
            description={
              campaign.placement === "PRODUCT_PAGE"
                ? "The campaign uses the product currently being viewed."
                : "Choose which carts will trigger this campaign."
            }
          >
            <div className="fc-inline-fields">
              <label className="fc-field">
                <span>
                  {campaign.placement === "PRODUCT_PAGE"
                    ? "Trigger product"
                    : "Trigger products"}
                </span>
                <select defaultValue="ANY">
                  <option value="ANY">
                    {campaign.placement === "PRODUCT_PAGE"
                      ? "Current product page"
                      : "Any product in the cart"}
                  </option>
                  <option value="CONDITIONAL">
                    Products matched by conditions
                  </option>
                </select>
              </label>
              <a className="fc-text-link" href="#conditions-and-filters">
                Add condition
              </a>
            </div>
          </FormCard>

          <FormCard
            title="Offers"
            description="Control which products are recommended."
          >
            <div className="fc-strategy-header">
              <label className="fc-field">
                <span>Recommendation logic</span>
                <select
                  onChange={(event) =>
                    setCampaign((current) => ({
                      ...current,
                      strategy: event.target.value as CampaignDraft["strategy"],
                    }))
                  }
                  value={campaign.strategy}
                >
                  {STRATEGY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <span className="fc-strategy-icon">
                <Sparkle aria-hidden size={18} weight="fill" />
              </span>
            </div>
            <div className="fc-selection-summary">
              <div>
                <strong>{selectedStrategy.label}</strong>
                {selectedStrategy.badge ? (
                  <span className="fc-badge fc-badge--success">
                    {selectedStrategy.badge}
                  </span>
                ) : null}
              </div>
              <p>{selectedStrategy.description}</p>
            </div>

            {(campaign.strategy === "SMART_WEIGHTED" ||
              campaign.strategy === "RULE_BASED_MIX") && (
              <details className="fc-details">
                <summary>
                  <SlidersHorizontal aria-hidden size={16} />
                  Scoring weights
                </summary>
                <div className="fc-weight-grid">
                  {Object.entries(campaign.strategyConfig.weights).map(
                    ([key, value]) => (
                      <label key={key}>
                        <span>{WEIGHT_LABELS[key]}</span>
                        <input
                          max="100"
                          min="0"
                          onChange={(event) =>
                            setCampaign((current) => ({
                              ...current,
                              strategyConfig: {
                                ...current.strategyConfig,
                                weights: {
                                  ...current.strategyConfig.weights,
                                  [key]: Number(event.target.value),
                                },
                              },
                            }))
                          }
                          type="range"
                          value={value}
                        />
                        <output>{value}</output>
                      </label>
                    ),
                  )}
                </div>
              </details>
            )}

            {campaign.strategy === "MANUAL" ? (
              <div className="fc-subsection">
                <div className="fc-subsection-heading">
                  <div>
                    <h3>Offer products</h3>
                    <p>Select products in priority order.</p>
                  </div>
                  <span>
                    {campaign.strategyConfig.manualProductIds.length} selected
                  </span>
                </div>
                {productChoices.length === 0 ? (
                  <div className="fc-empty-state">
                    Sync your product catalogue before selecting products.
                  </div>
                ) : (
                  <>
                    <input
                      className="fc-search-input"
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search products..."
                      type="search"
                      value={productSearch}
                    />
                    <div className="fc-product-choice-list">
                      {filteredProductChoices.map((product) => (
                        <label className="fc-product-choice" key={product.id}>
                          <input
                            checked={campaign.strategyConfig.manualProductIds.includes(
                              product.id,
                            )}
                            onChange={() => toggleManualProduct(product.id)}
                            type="checkbox"
                          />
                          <span>{product.title}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {campaign.strategy === "COMPLEMENTARY" ? (
              <div className="fc-subsection">
                <div className="fc-subsection-heading">
                  <div>
                    <h3>Complementary product pairs</h3>
                    <p>Map a trigger product to one or more offer products.</p>
                  </div>
                </div>
                {productChoices.length === 0 ? (
                  <div className="fc-empty-state">
                    Sync your product catalogue before creating product pairs.
                  </div>
                ) : (
                  <>
                    <div className="fc-pair-builder">
                      <label className="fc-field">
                        <span>Trigger product</span>
                        <select
                          onChange={(event) =>
                            setPairTriggerId(event.target.value)
                          }
                          value={pairTriggerId}
                        >
                          <option value="">Select a product</option>
                          {productChoices.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <ArrowRight
                        aria-hidden
                        className="fc-pair-arrow"
                        size={18}
                      />
                      <label className="fc-field">
                        <span>Offer product</span>
                        <select
                          onChange={(event) =>
                            setPairOfferId(event.target.value)
                          }
                          value={pairOfferId}
                        >
                          <option value="">Select a product</option>
                          {productChoices.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="fc-button fc-button--secondary"
                        disabled={
                          !pairTriggerId ||
                          !pairOfferId ||
                          pairTriggerId === pairOfferId
                        }
                        onClick={addComplementaryPair}
                        type="button"
                      >
                        <Plus aria-hidden size={14} weight="bold" />
                        Add pair
                      </button>
                    </div>
                    <div className="fc-pair-list">
                      {Object.entries(
                        campaign.strategyConfig.complementaryByProductId,
                      ).flatMap(([triggerId, offerIds]) =>
                        offerIds.map((offerId) => (
                          <div
                            className="fc-pair-row"
                            key={`${triggerId}-${offerId}`}
                          >
                            <span>
                              {productTitleById.get(triggerId) ?? triggerId}
                            </span>
                            <ArrowRight aria-hidden size={15} />
                            <span>
                              {productTitleById.get(offerId) ?? offerId}
                            </span>
                            <button
                              aria-label="Remove product pair"
                              onClick={() =>
                                removeComplementaryPair(triggerId, offerId)
                              }
                              type="button"
                            >
                              <X aria-hidden size={15} weight="bold" />
                            </button>
                          </div>
                        )),
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </FormCard>

          <div id="conditions-and-filters">
            <FormCard
              title="Conditions and filters"
              description="Refine when the campaign appears and which products are eligible."
            >
              <div className="fc-condition-toolbar">
                <div className="fc-match-mode">
                  <span>Match</span>
                  <button
                    className={
                      campaign.conditionMode === "ALL" ? "is-active" : ""
                    }
                    onClick={() =>
                      setCampaign((current) => ({
                        ...current,
                        conditionMode: "ALL",
                      }))
                    }
                    type="button"
                  >
                    All
                  </button>
                  <button
                    className={
                      campaign.conditionMode === "ANY" ? "is-active" : ""
                    }
                    onClick={() =>
                      setCampaign((current) => ({
                        ...current,
                        conditionMode: "ANY",
                      }))
                    }
                    type="button"
                  >
                    Any
                  </button>
                  <span>conditions</span>
                </div>
                <button
                  className="fc-button fc-button--secondary"
                  onClick={addCondition}
                  type="button"
                >
                  <Plus aria-hidden size={14} weight="bold" />
                  Add condition
                </button>
              </div>

              {campaign.conditions.length === 0 ? (
                <div className="fc-empty-state">
                  No conditions. This campaign can display for every cart.
                </div>
              ) : (
                <div className="fc-condition-list">
                  {campaign.conditions.map((condition) => (
                    <div className="fc-condition-row" key={condition.id}>
                      <select
                        aria-label="Condition field"
                        onChange={(event) =>
                          updateCondition(condition.id, {
                            field: event.target.value as ConditionField,
                          })
                        }
                        value={condition.field}
                      >
                        {CONDITION_FIELDS.map((field) => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Condition operator"
                        onChange={(event) =>
                          updateCondition(condition.id, {
                            operator: event.target.value as ConditionOperator,
                          })
                        }
                        value={condition.operator}
                      >
                        {CONDITION_OPERATORS.map((operator) => (
                          <option key={operator.value} value={operator.value}>
                            {operator.label}
                          </option>
                        ))}
                      </select>
                      {condition.field === "CART_PRODUCT" &&
                      productChoices.length > 0 ? (
                        <select
                          aria-label="Condition product"
                          onChange={(event) =>
                            updateCondition(condition.id, {
                              value: event.target.value,
                            })
                          }
                          value={condition.value}
                        >
                          <option value="">Select a product</option>
                          {productChoices.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          aria-label="Condition value"
                          onChange={(event) =>
                            updateCondition(condition.id, {
                              value: event.target.value,
                            })
                          }
                          value={condition.value}
                        />
                      )}
                      <button
                        aria-label="Remove condition"
                        onClick={() => removeCondition(condition.id)}
                        type="button"
                      >
                        <X aria-hidden size={15} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="fc-toggle-grid">
                {[
                  ["onlyAvailable", "Exclude out-of-stock products"],
                  [
                    "excludeCartProducts",
                    "Exclude products already in the cart",
                  ],
                  ["excludeTriggerProducts", "Exclude trigger products"],
                  ["excludeGiftCards", "Exclude gift cards"],
                ].map(([key, label]) => (
                  <label className="fc-check-row" key={key}>
                    <input
                      checked={Boolean(
                        campaign.filters[key as keyof RecommendationFilters],
                      )}
                      onChange={(event) =>
                        updateFilters(
                          key as keyof RecommendationFilters,
                          event.target.checked as never,
                        )
                      }
                      type="checkbox"
                    />
                    <span>
                      <Check aria-hidden size={12} weight="bold" />
                    </span>
                    {label}
                  </label>
                ))}
              </div>

              <details className="fc-details">
                <summary>
                  <SlidersHorizontal aria-hidden size={16} />
                  Advanced product filters
                </summary>
                <div className="fc-field-grid">
                  {FILTER_TEXT_FIELDS.map((field) => (
                    <label className="fc-field" key={field.key}>
                      <span>{field.label}</span>
                      <input
                        onChange={(event) =>
                          updateFilters(
                            field.key,
                            splitValues(event.target.value) as never,
                          )
                        }
                        placeholder={field.placeholder}
                        value={(campaign.filters[field.key] as string[]).join(
                          ", ",
                        )}
                      />
                    </label>
                  ))}
                  <label className="fc-field">
                    <span>Minimum price</span>
                    <input
                      min="0"
                      onChange={(event) =>
                        updateFilters(
                          "minPrice",
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                      type="number"
                      value={campaign.filters.minPrice ?? ""}
                    />
                  </label>
                  <label className="fc-field">
                    <span>Maximum price</span>
                    <input
                      min="0"
                      onChange={(event) =>
                        updateFilters(
                          "maxPrice",
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                      type="number"
                      value={campaign.filters.maxPrice ?? ""}
                    />
                  </label>
                </div>
              </details>
            </FormCard>
          </div>

          <FormCard
            title="Campaign settings"
            description="Control the number and variety of products shown."
          >
            <div className="fc-field-grid">
              <label className="fc-field">
                <span>Maximum products shown</span>
                <input
                  max="8"
                  min="1"
                  onChange={(event) =>
                    updateFilters("maxProducts", Number(event.target.value))
                  }
                  type="number"
                  value={campaign.filters.maxProducts}
                />
              </label>
              <label className="fc-field">
                <span>Maximum per vendor</span>
                <input
                  max="8"
                  min="0"
                  onChange={(event) =>
                    updateFilters("maxPerVendor", Number(event.target.value))
                  }
                  type="number"
                  value={campaign.filters.maxPerVendor}
                />
              </label>
            </div>
          </FormCard>

          <FormCard
            title="Discounts"
            description="Apply an automatic discount only when a shopper adds a product through this upsell campaign."
          >
            <div className="fc-field-grid">
              <label className="fc-field">
                <span>Discount type</span>
                <select
                  onChange={(event) =>
                    updateDiscountType(
                      event.target.value as UpsellDiscountType,
                    )
                  }
                  value={campaign.discount.type}
                >
                  <option value="NONE">No discount</option>
                  <option value="PERCENTAGE">Percentage off</option>
                  <option value="FIXED_AMOUNT">Fixed amount off</option>
                </select>
              </label>

              {campaign.discount.type !== "NONE" ? (
                <>
                  <label className="fc-field">
                    <span>
                      {campaign.discount.type === "PERCENTAGE"
                        ? "Percentage off"
                        : "Amount off each item"}
                    </span>
                    <input
                      max={
                        campaign.discount.type === "PERCENTAGE"
                          ? "100"
                          : undefined
                      }
                      min="0.01"
                      onChange={(event) =>
                        updateDiscount(
                          "value",
                          Number(event.target.value) || 0,
                        )
                      }
                      step="0.01"
                      type="number"
                      value={campaign.discount.value}
                    />
                  </label>
                  <label className="fc-field fc-field--wide">
                    <span>Discount message</span>
                    <input
                      onChange={(event) =>
                        updateDiscount("message", event.target.value)
                      }
                      placeholder="Upsell offer"
                      value={campaign.discount.message}
                    />
                    <small>
                      This discount is limited to products added from this
                      campaign. Products added normally are not discounted.
                    </small>
                  </label>
                </>
              ) : null}
            </div>
          </FormCard>

          <FormCard
            title="Schedule campaign"
            description="Campaign visibility follows the Active switch."
          >
            <div className="fc-schedule-row">
              <span
                className={
                  campaign.enabled
                    ? "fc-badge fc-badge--success"
                    : "fc-badge fc-badge--neutral"
                }
              >
                {campaign.enabled ? "Active" : "Not active"}
              </span>
              <p>
                Date-based scheduling can be added later without changing your
                recommendation rules.
              </p>
            </div>
          </FormCard>

          <FormCard
            title="Other settings"
            description="This copy appears above the offer products."
          >
            <div className="fc-field-grid">
              <label className="fc-field">
                <span>Campaign title</span>
                <input
                  onChange={(event) =>
                    updateAppearance("heading", event.target.value)
                  }
                  value={campaign.appearance.heading}
                />
              </label>
              <label className="fc-field">
                <span>Campaign subtitle</span>
                <input
                  onChange={(event) =>
                    updateAppearance("subheading", event.target.value)
                  }
                  value={campaign.appearance.subheading}
                />
              </label>
            </div>
          </FormCard>

          <section className="fc-catalogue-strip">
            <div>
              <span className="fc-catalogue-icon">
                <Package aria-hidden size={17} weight="bold" />
              </span>
              <div>
                <strong>{catalogueCount} products synced</strong>
                <span>Last sync: {formatSyncTime(syncedAt)}</span>
              </div>
            </div>
            <button
              className="fc-button fc-button--secondary"
              disabled={syncing}
              onClick={onSync}
              type="button"
            >
              <ArrowsClockwise aria-hidden size={15} weight="bold" />
              {syncing ? "Syncing..." : "Sync products"}
            </button>
          </section>
        </div>

        <aside className="fc-editor-aside">
          <FormCard
            title="Theme visibility"
            description="Choose which theme can display this campaign."
          >
            <label className="fc-field">
              <span>Theme</span>
              <select defaultValue="ANY">
                <option value="ANY">Any theme</option>
              </select>
            </label>
          </FormCard>

          <section className="fc-customize-card">
            <div className="fc-form-card-heading">
              <h2>Customize appearance</h2>
              <p>Changes are reflected in the live preview below.</p>
            </div>
            <div className="fc-appearance-tabs" role="tablist">
              {[
                ["content", "Content"],
                ["style", "Style"],
                ["advanced", "Advanced"],
              ].map(([value, label]) => (
                <button
                  aria-selected={appearancePanel === value}
                  className={appearancePanel === value ? "is-active" : ""}
                  key={value}
                  onClick={() =>
                    setAppearancePanel(
                      value as "content" | "style" | "advanced",
                    )
                  }
                  role="tab"
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {appearancePanel === "content" ? (
              <>
                <div className="fc-field-grid">
                  <label className="fc-field fc-field--wide">
                    <span>Widget style</span>
                    <select
                      onChange={(event) =>
                        applyAppearancePreset(
                          event.target
                            .value as CampaignDraft["appearance"]["stylePreset"],
                        )
                      }
                      value={campaign.appearance.stylePreset}
                    >
                      <option value="CAMOSIGNAL">
                        CamoSignal cards
                      </option>
                      <option value="COMPLETE_THE_LOOK">
                        Complete the look
                      </option>
                      <option value="CLASSIC">Classic cards</option>
                    </select>
                    <small>
                      CamoSignal keeps the same recommendation and Color → Size
                      flow with a store-specific visual style.
                    </small>
                  </label>
                  <label className="fc-field">
                    <span>Layout</span>
                    <select
                      onChange={(event) =>
                        updateAppearance(
                          "layout",
                          event.target
                            .value as CampaignDraft["appearance"]["layout"],
                        )
                      }
                      value={campaign.appearance.layout}
                    >
                      <option value="STACKED">List</option>
                      <option value="GRID">Grid</option>
                      <option value="CAROUSEL">Carousel</option>
                    </select>
                  </label>
                  <label className="fc-field">
                    <span>Image ratio</span>
                    <select
                      onChange={(event) =>
                        updateAppearance(
                          "imageRatio",
                          event.target
                            .value as CampaignDraft["appearance"]["imageRatio"],
                        )
                      }
                      value={campaign.appearance.imageRatio}
                    >
                      <option value="SQUARE">Square</option>
                      <option value="PORTRAIT">Portrait</option>
                      <option value="LANDSCAPE">Landscape</option>
                    </select>
                  </label>
                  <label className="fc-field fc-field--wide">
                    <span>Add button label</span>
                    <input
                      onChange={(event) =>
                        updateAppearance("buttonLabel", event.target.value)
                      }
                      value={campaign.appearance.buttonLabel}
                    />
                  </label>
                </div>
                <div className="fc-toggle-grid fc-toggle-grid--single">
                  {[
                    ["showVendor", "Show vendor"],
                    ["showComparePrice", "Show compare-at price"],
                    ["showVariantPicker", "Show variant picker"],
                    ["showQuickAdd", "Show quick add button"],
                  ].map(([key, label]) => (
                    <label className="fc-check-row" key={key}>
                      <input
                        checked={Boolean(
                          campaign.appearance[
                            key as keyof CampaignDraft["appearance"]
                          ],
                        )}
                        onChange={(event) =>
                          updateAppearance(
                            key as keyof CampaignDraft["appearance"],
                            event.target.checked as never,
                          )
                        }
                        type="checkbox"
                      />
                      <span>
                        <Check aria-hidden size={12} weight="bold" />
                      </span>
                      {label}
                    </label>
                  ))}
                </div>
              </>
            ) : null}

            {appearancePanel === "style" ? (
              <>
                <div className="fc-color-grid">
                  {COLOR_CONTROLS.map((control) => (
                    <label key={control.key}>
                      <span>{control.label}</span>
                      <div>
                        <input
                          onChange={(event) =>
                            updateAppearance(
                              control.key,
                              event.target.value as never,
                            )
                          }
                          type="color"
                          value={campaign.appearance[control.key] as string}
                        />
                        <code>
                          {campaign.appearance[control.key] as string}
                        </code>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="fc-weight-grid">
                  {[
                    ["borderRadius", "Card radius", 0, 28],
                    ["imageRadius", "Image radius", 0, 28],
                    ["spacing", "Spacing", 6, 28],
                  ].map(([key, label, min, max]) => (
                    <label key={key}>
                      <span>{label}</span>
                      <input
                        max={max}
                        min={min}
                        onChange={(event) =>
                          updateAppearance(
                            key as keyof CampaignDraft["appearance"],
                            Number(event.target.value) as never,
                          )
                        }
                        type="range"
                        value={
                          campaign.appearance[
                            key as keyof CampaignDraft["appearance"]
                          ] as number
                        }
                      />
                      <output>
                        {
                          campaign.appearance[
                            key as keyof CampaignDraft["appearance"]
                          ]
                        }
                        px
                      </output>
                    </label>
                  ))}
                </div>
              </>
            ) : null}

            {appearancePanel === "advanced" ? (
              <label className="fc-field">
                <span>Custom CSS</span>
                <textarea
                  onChange={(event) =>
                    updateAppearance("customCss", event.target.value)
                  }
                  placeholder=".flex-upsell-card { ... }"
                  rows={8}
                  value={campaign.appearance.customCss}
                />
              </label>
            ) : null}
          </section>

          <StorefrontLivePreview
            campaign={campaign}
            profile={storefrontProfile}
          />
        </aside>
      </div>
    </main>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  ChartLineUp,
  Check,
  Circle,
  Coins,
  Funnel,
  MagnifyingGlass,
  Plus,
  ShoppingCartSimple,
  Sparkle,
  Storefront,
} from "@phosphor-icons/react";

import type { CampaignDraft, Placement } from "../lib/recommendation-types";

export interface PlacementMetrics {
  views: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
}

interface CampaignDashboardProps {
  campaigns: CampaignDraft[];
  catalogueCount: number;
  metrics: Record<Placement, PlacementMetrics>;
  syncedAt: string | null;
  themeEditorUrl: string;
}

type CampaignFilter = "ALL" | Placement;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}

function formatSyncTime(value: string | null) {
  if (!value) return "Catalogue not synced";
  return `Last synced ${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value))}`;
}

function placementLabel(placement: Placement) {
  if (placement === "PRODUCT_PAGE") return "Product page";
  return placement === "CART_DRAWER" ? "Cart drawer" : "Cart page";
}

export function CampaignDashboard({
  campaigns,
  catalogueCount,
  metrics,
  syncedAt,
  themeEditorUrl,
}: CampaignDashboardProps) {
  const [filter, setFilter] = useState<CampaignFilter>("ALL");
  const filteredCampaigns = useMemo(
    () =>
      filter === "ALL"
        ? campaigns
        : campaigns.filter((campaign) => campaign.placement === filter),
    [campaigns, filter],
  );
  const totals = campaigns.reduce(
    (result, campaign) => {
      const campaignMetrics = metrics[campaign.placement];
      result.views += campaignMetrics.views;
      result.clicks += campaignMetrics.clicks;
      result.conversions += campaignMetrics.conversions;
      result.conversionValue += campaignMetrics.conversionValue;
      return result;
    },
    { views: 0, clicks: 0, conversions: 0, conversionValue: 0 },
  );
  const createdCampaigns = campaigns.filter(
    (campaign) => campaign.enabled || catalogueCount > 0,
  ).length;
  const completedSteps = Math.min(
    3,
    Number(catalogueCount > 0) + Number(createdCampaigns > 0),
  );

  return (
    <main className="fc-admin-shell">
      <header className="fc-page-heading">
        <div>
          <p className="fc-eyebrow">Flex Cart Upsell</p>
          <h1>Dashboard</h1>
        </div>
        <div className="fc-page-actions">
          <button className="fc-button fc-button--secondary" type="button">
            English
          </button>
          <Link
            className="fc-button fc-button--primary"
            to="/app/create"
          >
            <Plus aria-hidden size={15} weight="bold" />
            Create campaign
          </Link>
        </div>
      </header>

      <section className="fc-status-bar">
        <div className="fc-status-copy">
          <span className="fc-status-icon">
            <Storefront aria-hidden size={17} weight="bold" />
          </span>
          <div>
            <strong>Theme integration</strong>
            <span className="fc-badge fc-badge--neutral">Ready to add</span>
            <p>Add Product page and Cart page in their templates, then activate Cart drawer in App embeds.</p>
          </div>
        </div>
        <a
          className="fc-button fc-button--secondary"
          href={themeEditorUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open theme editor
        </a>
      </section>

      <section className="fc-checklist-card">
        <div className="fc-card-heading">
          <div>
            <h2>Getting started checklist</h2>
            <p>{completedSteps} of 3 steps completed</p>
          </div>
          <span className="fc-progress-ring" aria-label={`${completedSteps} of 3`}>
            {completedSteps}/3
          </span>
        </div>
        <div className="fc-checklist">
          {[
            {
              complete: false,
              label: "Add the theme integration",
              description: "Add Product page and Cart page blocks in their templates, then activate Cart drawer in App embeds.",
            },
            {
              complete: catalogueCount > 0,
              label: "Sync your product catalogue",
              description: `${catalogueCount} products available to recommend.`,
            },
            {
              complete: createdCampaigns > 0,
              label: "Create your first campaign",
              description: "Choose a placement, logic, filters, and appearance.",
            },
          ].map((step) => (
            <div className="fc-checklist-item" key={step.label}>
              <span
                className={
                  step.complete
                    ? "fc-check-icon fc-check-icon--complete"
                    : "fc-check-icon"
                }
              >
                {step.complete ? (
                  <Check aria-hidden size={12} weight="bold" />
                ) : (
                  <Circle aria-hidden size={12} weight="bold" />
                )}
              </span>
              <div>
                <strong>{step.label}</strong>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="fc-section">
        <div className="fc-section-title">
          <h2>Insights</h2>
          <span>All time</span>
        </div>
        <div className="fc-insight-grid">
          <article className="fc-insight-card">
            <div className="fc-insight-heading">
              <span>Engagement overview</span>
              <ChartLineUp aria-hidden size={18} />
            </div>
            <dl>
              <div>
                <dt>Views</dt>
                <dd>{totals.views.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt>Clicks</dt>
                <dd>{totals.clicks.toLocaleString("en-US")}</dd>
              </div>
            </dl>
          </article>
          <article className="fc-insight-card">
            <div className="fc-insight-heading">
              <span>Conversion metrics</span>
              <Coins aria-hidden size={18} />
            </div>
            <dl>
              <div>
                <dt>Conversions</dt>
                <dd>{totals.conversions.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt>Conversion value</dt>
                <dd>{formatCurrency(totals.conversionValue)}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section className="fc-engine-card">
        <div>
          <span className="fc-engine-icon">
            <Sparkle aria-hidden size={18} weight="fill" />
          </span>
          <div>
            <div className="fc-inline-title">
              <strong>Smart recommendation engine</strong>
              <span className="fc-badge fc-badge--success">Active</span>
            </div>
            <p>
              Choose from 11 reusable recommendation strategies for any store.
            </p>
          </div>
        </div>
        <span>{formatSyncTime(syncedAt)}</span>
      </section>

      <section className="fc-section">
        <div className="fc-section-title">
          <h2>Campaigns</h2>
          <div className="fc-table-tools">
            <button aria-label="Search campaigns" type="button">
              <MagnifyingGlass aria-hidden size={16} />
            </button>
            <button aria-label="Filter campaigns" type="button">
              <Funnel aria-hidden size={16} />
            </button>
          </div>
        </div>
        <div className="fc-campaign-table-card">
          <div className="fc-table-tabs" role="tablist" aria-label="Campaign placement">
            {[
              ["ALL", "All"],
              ["PRODUCT_PAGE", "Product page"],
              ["CART_DRAWER", "Cart drawer"],
              ["CART_PAGE", "Cart page"],
            ].map(([value, label]) => (
              <button
                aria-selected={filter === value}
                className={filter === value ? "is-active" : ""}
                key={value}
                onClick={() => setFilter(value as CampaignFilter)}
                role="tab"
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="fc-table-scroll">
            <table className="fc-campaign-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Views</th>
                  <th>Clicks</th>
                  <th>Conversions</th>
                  <th aria-label="Open campaign" />
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => {
                  const campaignMetrics = metrics[campaign.placement];
                  return (
                    <tr key={campaign.placement}>
                      <td>
                        <Link
                          to={`/app/editor?placement=${campaign.placement}`}
                        >
                          <strong>{campaign.name}</strong>
                          <span>{placementLabel(campaign.placement)}</span>
                        </Link>
                      </td>
                      <td>
                        <span
                          className={
                            campaign.enabled
                              ? "fc-badge fc-badge--success"
                              : "fc-badge fc-badge--neutral"
                          }
                        >
                          {campaign.enabled ? "Active" : "Draft"}
                        </span>
                      </td>
                      <td>0</td>
                      <td>{campaignMetrics.views.toLocaleString("en-US")}</td>
                      <td>{campaignMetrics.clicks.toLocaleString("en-US")}</td>
                      <td>
                        {campaignMetrics.conversions.toLocaleString("en-US")}
                      </td>
                      <td>
                        <Link
                          aria-label={`Open ${campaign.name}`}
                          className="fc-row-action"
                          to={`/app/editor?placement=${campaign.placement}`}
                        >
                          <ArrowRight aria-hidden size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <footer>
            Showing {filteredCampaigns.length} of {campaigns.length} campaigns
          </footer>
        </div>
      </section>
    </main>
  );
}

const CAMPAIGN_TEMPLATES: Array<{
  placement: Placement;
  title: string;
  description: string;
  image: string;
}> = [
  {
    placement: "PRODUCT_PAGE",
    title: "Product page upsell",
    description:
      "Show a Complete the look offer directly below the product purchase controls.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
  },
  {
    placement: "CART_DRAWER",
    title: "Cart drawer upsell",
    description:
      "Recommend products inside the cart drawer to increase average order value.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
  },
  {
    placement: "CART_PAGE",
    title: "Cart page upsell",
    description:
      "Display product recommendations on the full cart page before checkout.",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
  },
];

export function CampaignTemplatePicker() {
  return (
    <main className="fc-admin-shell fc-create-shell">
      <header className="fc-page-heading fc-page-heading--back">
        <Link
          aria-label="Back to dashboard"
          to="/app"
        >
          <ArrowLeft aria-hidden size={18} weight="bold" />
        </Link>
        <div>
          <p className="fc-eyebrow">Campaigns</p>
          <h1>Create campaign</h1>
        </div>
      </header>

      <div className="fc-filter-row">
        <button className="fc-filter-chip" type="button">
          Placement: All
        </button>
        <button className="fc-filter-chip" type="button">
          More filters: All
        </button>
      </div>

      <section className="fc-helper-card">
        <div>
          <span className="fc-engine-icon">
            <Sparkle aria-hidden size={18} weight="fill" />
          </span>
          <div>
            <h2>Help me choose a campaign type</h2>
            <p>
              Pick where customers review their cart. You can customize the
              recommendation logic and appearance in the next step.
            </p>
          </div>
        </div>
        <a className="fc-button fc-button--secondary" href="#campaign-types">
          Get started
        </a>
      </section>

      <section className="fc-section" id="campaign-types">
        <div className="fc-section-title">
          <h2>Upsell campaigns</h2>
          <span>3 campaign types</span>
        </div>
        <div className="fc-template-grid">
          {CAMPAIGN_TEMPLATES.map((template) => (
            <article className="fc-template-card" key={template.placement}>
              <div className="fc-template-preview">
                <div className="fc-template-browser-bar">
                  <span />
                  <span />
                  <span />
                  <strong>Your Store</strong>
                  <ShoppingCartSimple aria-hidden size={15} />
                </div>
                <div className="fc-template-preview-body">
                  <img alt="" src={template.image} />
                  <div
                    className={
                      template.placement === "CART_DRAWER"
                        ? "fc-mini-cart fc-mini-cart--drawer"
                        : "fc-mini-cart fc-mini-cart--page"
                    }
                  >
                    <strong>
                      {template.placement === "CART_DRAWER"
                        ? "Your cart (1)"
                        : "Cart"}
                    </strong>
                    <div className="fc-mini-line">
                      <span />
                      <div>
                        <b>Classic Tee</b>
                        <small>$38.00</small>
                      </div>
                    </div>
                    <p>You might also like</p>
                    <div className="fc-mini-offers">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
              <div className="fc-template-copy">
                <span>{placementLabel(template.placement)}</span>
                <h3>{template.title}</h3>
                <p>{template.description}</p>
                <div>
                  <Link
                    className="fc-text-link"
                    to={`/app/editor?placement=${template.placement}`}
                  >
                    Preview
                  </Link>
                  <Link
                    className="fc-button fc-button--primary"
                    to={`/app/editor?placement=${template.placement}`}
                  >
                    Create
                    <ArrowRight aria-hidden size={14} weight="bold" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

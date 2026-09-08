import { memo, useMemo, useState } from "react";
import {
  ArrowCounterClockwise,
  Check,
  Desktop,
  DeviceMobile,
  Handbag,
  List,
  LockKey,
  MagnifyingGlass,
  Minus,
  Package,
  Plus,
  Star,
  Truck,
  User,
  X,
} from "@phosphor-icons/react";

import type { CampaignDraft } from "../lib/recommendation-types";
import type {
  StorefrontPreviewProduct,
  StorefrontPreviewProfile,
} from "../lib/storefront-preview-profile";
import "../styles/storefront-preview.css";
import "../styles/store-aware-preview.css";
import "../styles/complete-look-preview.css";

interface StorefrontLivePreviewProps {
  campaign: CampaignDraft;
  profile: StorefrontPreviewProfile;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}

function percentageDiscountLabel(campaign: CampaignDraft) {
  if (campaign.discount.type !== "PERCENTAGE" || campaign.discount.value <= 0) {
    return null;
  }

  return "-" + Number(campaign.discount.value.toFixed(2)) + "%";
}

function discountedPrice(value: number, campaign: CampaignDraft) {
  const discountValue = Number(campaign.discount.value);
  if (!Number.isFinite(discountValue) || discountValue <= 0) return value;
  if (campaign.discount.type === "PERCENTAGE") {
    return Math.max(0, value * (1 - Math.min(discountValue, 100) / 100));
  }
  if (campaign.discount.type === "FIXED_AMOUNT") {
    return Math.max(0, value - discountValue);
  }
  return value;
}

function ProductImage({ alt, imageUrl }: { alt: string; imageUrl?: string }) {
  if (!imageUrl) {
    return (
      <div className="store-preview-image-empty" role="img" aria-label={alt}>
        <Package aria-hidden size={22} />
      </div>
    );
  }

  return <img alt={alt} loading="lazy" src={imageUrl} />;
}

function variantLabel(title: string) {
  return title.split("/").at(-1)?.trim() || title;
}

function UpsellProducts({
  addedProduct,
  campaign,
  onAdd,
  products,
}: {
  addedProduct: string | null;
  campaign: CampaignDraft;
  onAdd: (productName: string) => void;
  products: StorefrontPreviewProduct[];
}) {
  const [openProduct, setOpenProduct] = useState<string | null>(null);
  const isCompleteLook =
    campaign.appearance.stylePreset === "COMPLETE_THE_LOOK";
  const visibleProducts = products.slice(
    0,
    Math.min(campaign.filters.maxProducts, products.length),
  );

  if (visibleProducts.length === 0) {
    return (
      <div className="preview-catalogue-empty">
        <Package aria-hidden size={18} />
        <strong>Sync products to preview recommendations</strong>
        <span>The live widget will use products from this store.</span>
      </div>
    );
  }

  return (
    <section
      className={`upsell-preview flex-upsell-card upsell-preview--preset-${campaign.appearance.stylePreset.toLowerCase().replaceAll("_", "-")} upsell-preview--${campaign.placement.toLowerCase().replaceAll("_", "-")} ${
        isCompleteLook ? "upsell-preview--complete-look" : ""
      }`}
    >
      {!isCompleteLook ? (
        <span className="preview-kicker">RECOMMENDED FOR YOU</span>
      ) : null}
      <h3>{campaign.appearance.heading}</h3>
      {campaign.appearance.subheading ? (
        <p>{campaign.appearance.subheading}</p>
      ) : null}
      <div
        className={`preview-product-list preview-product-list--${campaign.appearance.layout.toLowerCase()}`}
      >
        {visibleProducts.map((product) => {
          const wasAdded = addedProduct === product.title;
          const isVariantOpen = openProduct === product.handle;
          const variants =
            product.variants.length > 0
              ? product.variants
              : [
                  {
                    id: product.handle,
                    price: product.price,
                    title: "Default",
                  },
                ];
          const hasVariantTray =
            isCompleteLook &&
            campaign.appearance.showVariantPicker &&
            variants.length > 1;
          const trayId = `preview-variants-${product.handle}`;
          const previewPrice = discountedPrice(product.price, campaign);
          const hasCampaignDiscount = previewPrice < product.price - 0.004;
          const previewComparePrice = hasCampaignDiscount
            ? product.price
            : product.compareAtPrice;

          const handleAdd = () => {
            if (hasVariantTray) {
              setOpenProduct((current) =>
                current === product.handle ? null : product.handle,
              );
              return;
            }
            onAdd(product.title);
          };

          return (
            <article
              className={`preview-product ${isVariantOpen ? "is-variant-open" : ""}`}
              key={product.handle}
            >
              <div className="preview-product-image">
                <ProductImage alt={product.title} imageUrl={product.imageUrl} />
              </div>
              <div className="preview-product-copy">
                {campaign.appearance.showVendor ? (
                  <span className="preview-vendor">{product.vendor}</span>
                ) : null}
                <strong>{product.title}</strong>
                <div className="preview-price">
                  <span>{formatMoney(previewPrice)}</span>
                  {percentageDiscountLabel(campaign) ? (
                    <span className="preview-discount-badge">
                      {percentageDiscountLabel(campaign)}
                    </span>
                  ) : null}
                  {(hasCampaignDiscount ||
                    campaign.appearance.showComparePrice) &&
                  previewComparePrice &&
                  previewComparePrice > previewPrice ? (
                    <s>{formatMoney(previewComparePrice)}</s>
                  ) : null}
                </div>
                {!isCompleteLook &&
                campaign.appearance.showVariantPicker &&
                variants.length > 1 ? (
                  <select
                    aria-label={`Variant for ${product.title}`}
                    defaultValue={variants[0].id}
                  >
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.title}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
              {campaign.appearance.showQuickAdd ? (
                <button
                  aria-controls={hasVariantTray ? trayId : undefined}
                  aria-expanded={hasVariantTray ? isVariantOpen : undefined}
                  aria-label={`${
                    wasAdded
                      ? "Added"
                      : campaign.appearance.buttonLabel || "Add"
                  } ${product.title}`}
                  className={wasAdded ? "is-added" : ""}
                  onClick={handleAdd}
                  type="button"
                >
                  {wasAdded ? (
                    <>
                      <Check aria-hidden size={11} weight="bold" />
                      Added
                    </>
                  ) : (
                    campaign.appearance.buttonLabel || "Add"
                  )}
                </button>
              ) : null}
              {hasVariantTray && isVariantOpen ? (
                <div
                  aria-label={`Choose a size for ${product.title}`}
                  className="preview-variant-tray"
                  id={trayId}
                  role="group"
                >
                  <div className="preview-variant-tray__header">
                    <strong>SIZE</strong>
                    <button
                      aria-label="Close size selector"
                      className="preview-variant-tray__close"
                      onClick={() => setOpenProduct(null)}
                      type="button"
                    >
                      <X aria-hidden size={13} weight="bold" />
                    </button>
                  </div>
                  <div className="preview-variant-tray__options">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          onAdd(product.title);
                          setOpenProduct(null);
                        }}
                        type="button"
                      >
                        {variantLabel(variant.title)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DrawerUpsellProducts({
  addedProduct,
  campaign,
  onAdd,
  products,
}: {
  addedProduct: string | null;
  campaign: CampaignDraft;
  onAdd: (productName: string) => void;
  products: StorefrontPreviewProduct[];
}) {
  const visibleProducts = products.slice(
    0,
    Math.min(Math.max(campaign.filters.maxProducts, 4), products.length),
  );

  if (visibleProducts.length === 0) return null;

  return (
    <section className="drawer-upsell-preview" aria-label="You may also like">
      <h3>YOU MAY ALSO LIKE</h3>
      <div className="drawer-upsell-preview__track">
        {visibleProducts.map((product) => {
          const wasAdded = addedProduct === product.title;
          return (
            <article className="drawer-upsell-preview__card" key={product.handle}>
              <div className="drawer-upsell-preview__image">
                <ProductImage alt={product.title} imageUrl={product.imageUrl} />
              </div>
              <strong>{product.title}</strong>
              <div className="drawer-upsell-preview__price">
                <span>{formatMoney(product.price)}</span>
                {product.compareAtPrice && product.compareAtPrice > product.price ? (
                  <s>{formatMoney(product.compareAtPrice)}</s>
                ) : null}
              </div>
              <button onClick={() => onAdd(product.title)} type="button">
                {wasAdded ? "ADDED" : campaign.appearance.buttonLabel || "ADD"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export const StorefrontLivePreview = memo(function StorefrontLivePreview({
  campaign,
  profile,
}: StorefrontLivePreviewProps) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [cartVisible, setCartVisible] = useState(true);
  const [addedProduct, setAddedProduct] = useState<string | null>(null);
  const primaryProduct = profile.primaryProduct;
  const primaryTitle = primaryProduct?.title ?? "Store product";
  const primaryVendor = primaryProduct?.vendor ?? profile.shopName;
  const primaryPrice = primaryProduct?.price ?? 0;
  const addedPrice =
    profile.recommendedProducts.find(
      (product) => product.title === addedProduct,
    )?.price ?? 0;
  const subtotal = primaryPrice + addedPrice;
  const drawerRecommendations = useMemo(
    () =>
      profile.recommendedProducts.filter(
        (product) => !product.requiresCustomization,
      ),
    [profile.recommendedProducts],
  );
  const cartDestination =
    campaign.placement === "CART_DRAWER" ? "Cart drawer" : "Cart page";
  const variants = primaryProduct?.variants.slice(0, 4) ?? [];

  const style = useMemo(
    () =>
      ({
        "--preview-card-bg": campaign.appearance.cardBackground,
        "--preview-card-border": campaign.appearance.cardBorder,
        "--preview-text": campaign.appearance.textColor,
        "--preview-muted": campaign.appearance.mutedTextColor,
        "--preview-button": campaign.appearance.buttonBackground,
        "--preview-button-text": campaign.appearance.buttonTextColor,
        "--preview-accent": campaign.appearance.accentColor,
        "--preview-radius": `${campaign.appearance.borderRadius}px`,
        "--preview-image-radius": `${campaign.appearance.imageRadius}px`,
        "--preview-image-ratio":
          campaign.appearance.imageRatio === "PORTRAIT"
            ? "4 / 5"
            : campaign.appearance.imageRatio === "LANDSCAPE"
              ? "4 / 3"
              : "1 / 1",
        "--preview-spacing": `${campaign.appearance.spacing}px`,
        "--store-body-size": `${profile.theme.bodyFontSize}px`,
        "--store-button": profile.theme.buttonBackground,
        "--store-button-height": `${profile.theme.buttonHeight}px`,
        "--store-button-radius": `${profile.theme.buttonRadius}px`,
        "--store-button-text": profile.theme.buttonTextColor,
        "--store-font-family": profile.theme.fontFamily,
        "--store-sale-accent": profile.theme.saleAccent,
      }) as React.CSSProperties,
    [campaign.appearance, profile.theme],
  );

  const addPrimaryProduct = () => {
    setCartVisible(true);
    setAddedProduct(null);
  };

  return (
    <section className="editor-preview" aria-label="Live storefront preview">
      <div className="preview-toolbar">
        <div className="preview-toolbar-title">
          <span className="eyebrow">STORE-AWARE PREVIEW</span>
          <strong>
            {profile.shopName} · Product page + {cartDestination}
          </strong>
          <small>{profile.theme.profileLabel}</small>
        </div>

        <div className="preview-toolbar-controls">
          <div
            aria-label="Preview state"
            className="preview-segmented"
            role="group"
          >
            <button
              aria-pressed={!cartVisible}
              onClick={() => setCartVisible(false)}
              type="button"
            >
              Product page
            </button>
            <button
              aria-pressed={cartVisible}
              onClick={() => setCartVisible(true)}
              type="button"
            >
              {cartDestination}
            </button>
          </div>
          <div
            aria-label="Preview viewport"
            className="preview-icon-group"
            role="group"
          >
            <button
              aria-label="Desktop preview"
              aria-pressed={viewport === "desktop"}
              onClick={() => setViewport("desktop")}
              type="button"
            >
              <Desktop aria-hidden size={16} />
            </button>
            <button
              aria-label="Mobile preview"
              aria-pressed={viewport === "mobile"}
              onClick={() => setViewport("mobile")}
              type="button"
            >
              <DeviceMobile aria-hidden size={16} />
            </button>
          </div>
          <span className="live-dot">Live</span>
        </div>
      </div>

      <div className="storefront-preview-stage">
        <div
          className={`storefront-preview-canvas storefront-preview-canvas--${viewport}`}
          style={style}
        >
          <div className="storefront-announcement">
            Free shipping on eligible orders
          </div>
          <header className="storefront-header">
            <button
              aria-label="Open menu"
              className="storefront-menu"
              type="button"
            >
              <List aria-hidden size={17} />
            </button>
            <strong className="storefront-logo">{profile.shopName}</strong>
            <nav aria-label="Preview store navigation">
              <span>Best sellers</span>
              <span>Apparel</span>
              <span>Gifts</span>
            </nav>
            <div className="storefront-header-actions">
              <MagnifyingGlass aria-hidden size={15} />
              <User aria-hidden size={15} />
              <button
                aria-label="Open cart"
                className="storefront-cart"
                onClick={() => setCartVisible(true)}
                type="button"
              >
                <Handbag aria-hidden size={16} />
                <span>1</span>
              </button>
            </div>
          </header>

          {campaign.placement === "CART_PAGE" && cartVisible ? (
            <main className="storefront-cart-page">
              <div className="storefront-cart-page-heading">
                <p>YOUR CART</p>
                <h2>Cart</h2>
              </div>
              <div className="storefront-cart-page-grid">
                <div className="cart-page-items">
                  <div className="cart-drawer-line">
                    <div className="cart-line-image">
                      <ProductImage
                        alt={primaryTitle}
                        imageUrl={primaryProduct?.imageUrl}
                      />
                    </div>
                    <div>
                      <strong>{primaryTitle}</strong>
                      <span>{variants[0]?.title ?? "Default"}</span>
                      <span>Qty 1</span>
                    </div>
                    <strong>{formatMoney(primaryPrice)}</strong>
                  </div>
                  <UpsellProducts
                    addedProduct={addedProduct}
                    campaign={campaign}
                    onAdd={setAddedProduct}
                    products={profile.recommendedProducts}
                  />
                </div>
                <div className="cart-page-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatMoney(subtotal)}</strong>
                  </div>
                  <p>Taxes and shipping calculated at checkout.</p>
                  <button type="button">
                    <LockKey aria-hidden size={12} />
                    Checkout
                  </button>
                </div>
              </div>
            </main>
          ) : (
            <main className="storefront-product-page">
              <div className="storefront-breadcrumb">
                Home / Products / {primaryTitle}
              </div>
              <div className="storefront-product-layout">
                <div className="storefront-gallery">
                  <div className="storefront-main-photo">
                    <ProductImage
                      alt={primaryTitle}
                      imageUrl={primaryProduct?.imageUrl}
                    />
                    <span>BEST SELLER</span>
                  </div>
                  {primaryProduct?.imageUrl ? (
                    <div className="storefront-thumbnails">
                      {[0, 1, 2].map((index) => (
                        <button
                          aria-label={`Product image ${index + 1}`}
                          className={index === 0 ? "is-selected" : ""}
                          key={index}
                          type="button"
                        >
                          <img alt="" src={primaryProduct.imageUrl} />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <section className="storefront-product-details">
                  <span className="storefront-product-vendor">
                    {primaryVendor}
                  </span>
                  <div className="storefront-flash-sale">
                    <strong>FLASH SALE</strong>
                    <span>45 : 00</span>
                  </div>
                  <h1>{primaryTitle}</h1>
                  <div className="storefront-rating">
                    <span aria-label="5 out of 5 stars">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star aria-hidden key={index} size={10} weight="fill" />
                      ))}
                    </span>
                    <small>4.9 · Customer reviews</small>
                  </div>
                  <strong className="storefront-product-price">
                    {formatMoney(primaryPrice)}
                  </strong>
                  <p>
                    Product content and options are loaded from the installed
                    store catalogue.
                  </p>
                  {variants.length > 0 ? (
                    <fieldset>
                      <legend>Variant</legend>
                      <div className="storefront-sizes">
                        {variants.map((variant, index) => (
                          <button
                            className={index === 0 ? "is-selected" : ""}
                            key={variant.id}
                            type="button"
                          >
                            {variant.title}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}
                  <button
                    className="storefront-add-button"
                    onClick={addPrimaryProduct}
                    type="button"
                  >
                    Add to cart <span>· {formatMoney(primaryPrice)}</span>
                  </button>
                  <UpsellProducts
                    addedProduct={addedProduct}
                    campaign={campaign}
                    onAdd={setAddedProduct}
                    products={profile.recommendedProducts}
                  />
                  <div className="storefront-product-notes">
                    <span>
                      <Truck aria-hidden size={11} />
                      Free shipping available
                    </span>
                    <span>
                      <ArrowCounterClockwise aria-hidden size={11} />
                      Easy returns
                    </span>
                  </div>
                </section>
              </div>
            </main>
          )}

          {campaign.placement === "CART_DRAWER" && cartVisible ? (
            <>
              <button
                aria-label="Close cart drawer"
                className="cart-drawer-backdrop"
                onClick={() => setCartVisible(false)}
                type="button"
              />
              <section
                aria-label="Cart drawer preview"
                aria-modal="true"
                className="cart-drawer-preview"
                role="dialog"
              >
                <header className="cart-drawer-header">
                  <div>
                    <span>YOUR CART</span>
                    <strong>Cart (1)</strong>
                  </div>
                  <button
                    aria-label="Close cart drawer"
                    onClick={() => setCartVisible(false)}
                    type="button"
                  >
                    <X aria-hidden size={15} />
                  </button>
                </header>
                <div className="cart-drawer-progress">
                  <span>You&apos;re close to free shipping</span>
                  <div>
                    <i />
                  </div>
                </div>
                <div className="cart-drawer-content">
                  <div className="cart-drawer-line">
                    <div className="cart-line-image">
                      <ProductImage
                        alt={primaryTitle}
                        imageUrl={primaryProduct?.imageUrl}
                      />
                    </div>
                    <div>
                      <strong>{primaryTitle}</strong>
                      <span>{variants[0]?.title ?? "Default"}</span>
                      <div className="cart-quantity">
                        <button aria-label="Decrease quantity" type="button">
                          <Minus aria-hidden size={10} />
                        </button>
                        <span>1</span>
                        <button aria-label="Increase quantity" type="button">
                          <Plus aria-hidden size={10} />
                        </button>
                      </div>
                    </div>
                    <strong>{formatMoney(primaryPrice)}</strong>
                  </div>
                  <DrawerUpsellProducts
                    addedProduct={addedProduct}
                    campaign={campaign}
                    onAdd={setAddedProduct}
                    products={drawerRecommendations}
                  />
                </div>
                <footer className="cart-drawer-footer">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatMoney(subtotal)}</strong>
                  </div>
                  <p>Taxes and shipping calculated at checkout.</p>
                  <button type="button">
                    <LockKey aria-hidden size={12} />
                    Checkout securely
                  </button>
                </footer>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
});

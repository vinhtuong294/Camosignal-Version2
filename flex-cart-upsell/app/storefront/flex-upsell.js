import {
  carouselSnapPositions,
  nextCarouselPosition,
} from "../lib/carousel-navigation.ts";
import { createCarouselMotion } from "../lib/carousel-motion.ts";
import { enableHorizontalDrag } from "../lib/carousel-drag.ts";
import { cartRecentlyProducts } from "../lib/cart-recently.ts";
import { readShopifyUpsellConfig, shopifyRecommendations } from "../lib/shopify-recommendations.ts";
import { createAsyncTtlCache } from "../lib/async-ttl-cache.ts";

(() => {
  window.__flexUpsellCoreRequested = true;
  if (customElements.get("flex-cart-upsell")) return;

  const instances = new Set();
  const boundThemeEventBuses = new WeakSet();
  const addErrorTimers = new WeakMap();
  const trackedViews = new Set();
  let globalListenersBound = false;
  let refreshTimer;

  const drawerTargetSelectors = [
    "cart-drawer cart-drawer-items",
    "#CartDrawer cart-drawer-items",
    "[data-cart-drawer] cart-drawer-items",
    "cart-drawer .cart-drawer__content",
    "#CartDrawer .cart-drawer__content",
    "[data-cart-drawer] .cart-drawer__content",
    "#cart .side-cart-wrapper .cart-items",
    "cart-drawer .drawer__contents",
    "#CartDrawer .drawer__contents",
    "[data-cart-drawer] .drawer__contents",
    "#cart .side-cart-wrapper",
    "cart-drawer .drawer__inner",
    "#CartDrawer .drawer__inner",
    "[data-cart-drawer] .drawer__inner",
    ".cart-drawer__inner",
    ".cart-drawer",
  ];

  const drawerTarget = () =>
    drawerTargetSelectors
      .map((selector) => document.querySelector(selector))
      .find(Boolean);
  const refreshAll = (event) => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      instances.forEach((instance) => {
        if (
          event?.type === "flex-upsell:cart-changed" &&
          instance.dataset.placement === "PRODUCT_PAGE"
        ) {
          return;
        }
        instance.refresh();
      });
    }, 80);
  };

  const bindGlobalListeners = () => {
    if (globalListenersBound) return;
    globalListenersBound = true;
    document.addEventListener("cart:updated", refreshAll);
    document.addEventListener("cart:refresh", refreshAll);
    document.addEventListener("shopify:section:load", refreshAll);
    document.addEventListener("flex-upsell:cart-changed", refreshAll);
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        !target.closest(
          "cart-drawer .drawer__close, cart-drawer .cart-drawer__overlay, [data-cart-drawer] [data-cart-drawer-close]",
        )
      ) {
        return;
      }
      instances.forEach((instance) => instance.closeDrawerOptionTray());
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      instances.forEach((instance) => instance.closeDrawerOptionTray());
    });

    const bindThemeCore = () => {
      const eventBus = window.themeCore?.EventBus;
      if (
        !eventBus ||
        (typeof eventBus !== "object" && typeof eventBus !== "function") ||
        typeof eventBus.listen !== "function" ||
        boundThemeEventBuses.has(eventBus)
      ) {
        return;
      }
      boundThemeEventBuses.add(eventBus);
      eventBus.listen(["cart:updated", "cart:refresh"], refreshAll);
    };

    bindThemeCore();
    document.addEventListener("theme:all:loaded", bindThemeCore, {
      once: true,
    });
  };

  const money = (amount) => {
    if (
      window.Shopify?.formatMoney &&
      window.themeCore?.objects?.shop?.money_format
    ) {
      return window.Shopify.formatMoney(
        Math.round(amount * 100),
        window.themeCore.objects.shop.money_format,
      );
    }

    const currency = window.Shopify?.currency?.active || "USD";
    return new Intl.NumberFormat(document.documentElement.lang || "en", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const percentageDiscountLabel = (discount) => {
    const value = Number(discount?.value);
    if (
      discount?.type !== "PERCENTAGE" ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return "";
    }

    return "-" + Number(value.toFixed(2)) + "%";
  };

  const discountedPrice = (price, discount) => {
    const amount = Number(price);
    const value = Number(discount?.value);
    if (!Number.isFinite(amount) || amount < 0) return 0;
    if (!Number.isFinite(value) || value <= 0) return amount;

    if (discount?.type === "PERCENTAGE") {
      return Math.max(0, amount * (1 - Math.min(value, 100) / 100));
    }
    if (discount?.type === "FIXED_AMOUNT") {
      return Math.max(0, amount - value);
    }
    return amount;
  };

  const discountLabel = (discount) => {
    const percentage = percentageDiscountLabel(discount);
    if (percentage) return percentage;
    const value = Number(discount?.value);
    if (
      discount?.type !== "FIXED_AMOUNT" ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return "";
    }
    return `-${money(value)}`;
  };

  const storefrontRoot = () => {
    const root = String(
      window.Shopify?.routes?.root || window.routes?.root_url || "/",
    ).trim();
    const normalizedRoot = root || "/";
    return normalizedRoot.endsWith("/") ? normalizedRoot : `${normalizedRoot}/`;
  };

  const cartAddUrl = () =>
    window.routes?.cart_add_url || `${storefrontRoot()}cart/add.js`;

  const productUrl = (handle) =>
    `${storefrontRoot()}products/${encodeURIComponent(String(handle || ""))}`;

  const upsellMainImageProperty = "_flex_upsell_main_image";

  const cartUrl = () => `${storefrontRoot()}cart.js`;

  const normalizeImageUrl = (value) => {
    const imageUrl = String(value || "").trim();
    if (!imageUrl) return "";

    try {
      return new URL(imageUrl, window.location.origin).href;
    } catch {
      return "";
    }
  };

  const cartDrawerState = () => {
    const drawer =
      document.querySelector("cart-notification") ||
      document.querySelector("cart-drawer");
    if (typeof drawer?.getSectionsToRender !== "function") {
      return { drawer, sectionIds: [] };
    }

    try {
      const sectionIds = drawer
        .getSectionsToRender()
        .map((section) => section?.id)
        .filter(Boolean);
      return { drawer, sectionIds };
    } catch (error) {
      console.warn(
        "[Flex Cart Upsell] Unable to read cart drawer sections.",
        error,
      );
      return { drawer, sectionIds: [] };
    }
  };

  const storefrontProductCache = new Map();
  const recentlyMetadataCache = new Map();
  const shopifyJsonCache = createAsyncTtlCache(60_000, 64);
  const recentJson = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error("Recently products unavailable");
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };
  const loadRecentlyProduct = async (candidate) => {
    let metadata = candidate;
    if (typeof metadata.requiresCustomization !== "boolean") {
      let request = recentlyMetadataCache.get(candidate.handle);
      if (!request) {
        request = recentJson(`${productUrl(candidate.handle)}?view=cart-recently`);
        recentlyMetadataCache.set(candidate.handle, request);
        request.catch(() => recentlyMetadataCache.delete(candidate.handle));
      }
      metadata = await request;
    }
    if (!metadata?.id || metadata.requiresCustomization || metadata.excludedFromUpsell) return null;
    const product = await storefrontProduct(metadata);
    return product ? { ...product, ...metadata } : null;
  };
  const shopifyJson = (url) => shopifyJsonCache.get(url, () => recentJson(url));
  const loadUpsellProduct = async (candidate) => {
    const metadata = candidate.metadataVersion === 1 ? candidate
      : await shopifyJson(`${productUrl(candidate.handle)}?view=cart-recently`);
    // A missing template or malformed metadata must never expose a customize
    // product as a standard quick-add item.
    if (metadata?.metadataVersion !== 1 || !metadata.id
      || typeof metadata.requiresCustomization !== "boolean" || metadata.excludedFromUpsell) return null;
    const product = await storefrontProduct(metadata);
    return product ? { ...product, ...metadata } : null;
  };

  const normalizeOptionName = (value) =>
    String(value || "")
      .trim()
      .toLocaleLowerCase();

  const fallbackSelectedOptions = (variant) => {
    const values = String(variant?.title || "")
      .split("/")
      .map((value) => value.trim())
      .filter(Boolean);
    if (
      values.length === 0 ||
      (values.length === 1 && values[0].toLowerCase() === "default title")
    ) {
      return [];
    }
    return values.map((value, index) => ({
      name:
        index === 0 ? "Color" : index === 1 ? "Size" : `Option ${index + 1}`,
      value,
    }));
  };

  const selectedOptionsFor = (variant) => {
    const options = Array.isArray(variant?.selectedOptions)
      ? variant.selectedOptions
          .filter((option) => option?.name && option?.value)
          .map((option) => ({
            name: String(option.name).trim(),
            value: String(option.value).trim(),
          }))
      : [];
    return options.length ? options : fallbackSelectedOptions(variant);
  };

  const optionPriority = (name) => {
    const normalized = normalizeOptionName(name);
    if (/colou?r|shade|tone/.test(normalized)) return 0;
    if (/size|fit|length/.test(normalized)) return 1;
    return 2;
  };

  const optionNamesFor = (variantItems) => {
    const names = new Map();
    variantItems.forEach((item) => {
      item.options.forEach((option) => {
        const key = normalizeOptionName(option.name);
        if (key && !names.has(key)) names.set(key, option.name);
      });
    });
    return [...names.values()].sort((left, right) => {
      const priority = optionPriority(left) - optionPriority(right);
      return priority || left.localeCompare(right);
    });
  };

  const optionValueFor = (item, name) =>
    item.options.find(
      (option) =>
        normalizeOptionName(option.name) === normalizeOptionName(name),
    )?.value || "";

  const variantLabel = (variant) => {
    const options = selectedOptionsFor(variant);
    return options.length
      ? options.map((option) => option.value).join(" / ")
      : variant.title || "Variant";
  };

  const uniqueVariantChoices = (items, labelFor) => {
    const choices = new Map();

    items.forEach((item) => {
      const label = labelFor(item);
      const normalizedLabel = normalizeOptionName(label);
      if (label && !choices.has(normalizedLabel)) {
        choices.set(normalizedLabel, { label, variant: item.variant });
      }
    });

    return [...choices.values()];
  };

  const moneyValue = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed / 100 : fallback;
  };

  const storefrontProduct = (product) => {
    const handle = String(product?.handle || "").trim();
    if (!handle) return Promise.resolve(null);
    const cached = storefrontProductCache.get(handle);
    if (cached && cached.expires > Date.now()) {
      return cached.request.then(live => live ? { ...product, ...live } : null);
    }

    const request = (async () => {
      try {
        const root = window.Shopify?.routes?.root || "/";
        const base = root.endsWith("/") ? root : `${root}/`;
        const response = await fetch(
          `${base}products/${encodeURIComponent(handle)}.js`,
          { headers: { Accept: "application/json" } },
        );
        if (!response.ok) return null;

        const liveProduct = await response.json();
        if (
          liveProduct?.available === false ||
          liveProduct?.requires_selling_plan
        ) {
          return null;
        }

        const optionNames = Array.isArray(liveProduct?.options)
          ? liveProduct.options.map((option) =>
              typeof option === "string" ? option : option?.name,
            )
          : [];
        const variants = Array.isArray(liveProduct?.variants)
          ? liveProduct.variants
              .filter(
                (variant) =>
                  variant?.available && !variant?.requires_selling_plan,
              )
              .map((variant) => ({
                id: String(variant.id),
                title: String(variant.title || ""),
                price: moneyValue(variant.price, product.price),
                compareAtPrice: moneyValue(variant.compare_at_price, undefined),
                available: true,
                selectedOptions: Array.isArray(variant.options)
                  ? variant.options
                      .map((value, index) => ({
                        name: String(
                          optionNames[index] || `Option ${index + 1}`,
                        ),
                        value: String(value || "").trim(),
                      }))
                      .filter((option) => option.value)
                  : fallbackSelectedOptions(variant),
              }))
          : [];

        if (!variants.length) return null;
        const liveImage =
          typeof liveProduct.featured_image === "string"
            ? liveProduct.featured_image
            : liveProduct.featured_image?.src;
        return {
          id: liveProduct.id,
          handle: liveProduct.handle || handle,
          title: liveProduct.title,
          imageUrl: liveImage || product.imageUrl,
          price: moneyValue(liveProduct.price, product.price),
          compareAtPrice: moneyValue(
            liveProduct.compare_at_price,
            product.compareAtPrice,
          ),
          variants,
        };
      } catch {
        return null;
      }
    })();

    const entry = { request, expires: Date.now() + 60_000 };
    storefrontProductCache.set(handle, entry);
    if (storefrontProductCache.size > 64) storefrontProductCache.delete(storefrontProductCache.keys().next().value);
    return request.then(live => {
      if (!live && storefrontProductCache.get(handle) === entry) storefrontProductCache.delete(handle);
      return live ? { ...product, ...live } : null;
    });
  };

  const sessionKey = () => {
    const key = "flex-upsell-session";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const next = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, next);
    return next;
  };

  class FlexCartUpsell extends HTMLElement {
    connectedCallback() {
      instances.add(this);
      bindGlobalListeners();
      if (this.dataset.recentlyViewed === "true") return;
      if (this.dataset.embedPlacement === "CART_DRAWER") {
        this.replaceChildren();
        if (this.mountDrawerEmbed()) this.refresh();
        return;
      }
      this.refresh();
    }

    disconnectedCallback() {
      this.carouselCleanup?.();
      this.carouselCleanup = undefined;
      const drawerMount = this.drawerMount;
      instances.delete(this);
      this.drawerObserver?.disconnect();
      this.drawerObserver = undefined;
      this.drawerObserverRoot = undefined;
      const drawerMountStillUsed = [...instances].some(
        (instance) =>
          instance.isConnected &&
          instance.dataset.embedPlacement === "CART_DRAWER" &&
          instance.drawerMount === drawerMount,
      );
      if (!drawerMountStillUsed) drawerMount?.remove();
      this.drawerMount = undefined;
      this.drawerOptionTray?.remove();
      this.drawerOptionTray = undefined;
    }

    ensureDrawerMount() {
      const target = drawerTarget();
      if (!target) return false;
      if (this.drawerMount?.isConnected && target.contains(this.drawerMount)) {
        return true;
      }

      const existingMounts = [
        ...target.querySelectorAll("[data-flex-upsell-drawer-mount]"),
      ];
      if (existingMounts.length) {
        const [mount, ...duplicates] = existingMounts;
        duplicates.forEach((duplicate) => duplicate.remove());
        this.drawerMount = mount;
        return true;
      }

      const mount = document.createElement("div");
      mount.className = "flex-upsell-drawer-mount";
      mount.setAttribute("data-flex-upsell-drawer-mount", "");
      const insertionPoint = target.querySelector(
        "footer, .drawer__footer, .cart-drawer__footer, [data-cart-footer]",
      );
      const insertionParent = insertionPoint?.parentElement;
      if (
        insertionPoint &&
        insertionParent &&
        target.contains(insertionParent)
      ) {
        insertionParent.insertBefore(mount, insertionPoint);
      } else {
        target.appendChild(mount);
      }
      this.drawerMount = mount;
      return true;
    }

    watchDrawerMount() {
      const observerRoot =
        document.querySelector("cart-drawer") ||
        document.querySelector("[data-cart-drawer], #cart, .cart-drawer") ||
        document.body;
      if (this.drawerObserver && this.drawerObserverRoot === observerRoot) {
        return;
      }

      this.drawerObserver?.disconnect();
      this.drawerObserverRoot = observerRoot;
      this.drawerObserver = new MutationObserver(() => {
        if (
          observerRoot.matches?.("cart-drawer") &&
          !observerRoot.classList.contains("active")
        ) {
          this.closeDrawerOptionTray();
        }
        const previousMount = this.drawerMount;
        const preservedUpsellNodes = previousMount
          ? [...previousMount.childNodes]
          : [];
        const mounted = this.ensureDrawerMount();
        this.watchDrawerMount();
        if (mounted && this.drawerMount !== previousMount) {
          if (preservedUpsellNodes.length && this.drawerMount) {
            this.drawerMount.replaceChildren(...preservedUpsellNodes);
          }
          this.refresh();
        }
      });
      this.drawerObserver.observe(observerRoot, {
        attributes: true,
        attributeFilter: ["class", "aria-hidden", "open"],
        childList: true,
        subtree: true,
      });
    }

    mountDrawerEmbed() {
      if (this.dataset.embedPlacement !== "CART_DRAWER") return false;
      const mounted = this.ensureDrawerMount();
      this.watchDrawerMount();
      return mounted;
    }

    renderHost() {
      if (this.dataset.embedPlacement !== "CART_DRAWER") return this;
      return this.drawerMount?.isConnected ? this.drawerMount : null;
    }

    closeDrawerOptionTray() {
      const tray = this.drawerOptionTray;
      if (!tray) return;

      const trayId = tray.id;
      this.renderHost()
        ?.querySelectorAll(".flex-upsell__add")
        .forEach((button) => {
          if (button.getAttribute("aria-controls") !== trayId) return;
          button.setAttribute("aria-expanded", "false");
          button
            .closest(".flex-upsell__card")
            ?.classList.remove("is-variant-open");
        });
      tray.hidden = true;
      tray.remove();
      this.drawerOptionTray = undefined;
    }

    async refresh() {
      if (this.dataset.recentlyViewed === "true") return;
      if (this.loading) return;
      this.loading = true;

      try {
        const placement = this.dataset.placement || "CART_DRAWER";
        const previewThemeId = this.dataset.themeId || document.querySelector('meta[name="camosignal-upsell-preview-theme"]')?.content;
        const shopifyConfig = readShopifyUpsellConfig(this.dataset.shopifyConfig, placement, previewThemeId);
        this.trackingDisabled = Boolean(shopifyConfig);
        if (shopifyConfig && !shopifyConfig.enabled) {
          this.renderHost()?.replaceChildren();
          return;
        }
        let productIds;
        let subtotal = 0;
        let itemCount = 0;

        if (placement === "PRODUCT_PAGE") {
          if (!this.dataset.productId) {
            this.replaceChildren();
            return;
          }
          productIds = [this.dataset.productId];
        } else {
          const cartResponse = await fetch(cartUrl(), {
            headers: { Accept: "application/json" },
          });
          if (!cartResponse.ok) throw new Error("Unable to load cart");
          const cart = await cartResponse.json();

          this.applyCartMainImages(cart.items);

          if (!cart.item_count) {
            this.renderHost()?.replaceChildren();
            return;
          }

          productIds = [...new Set(cart.items.map((item) => item.product_id))];
          subtotal = (cart.total_price || 0) / 100;
          itemCount = cart.item_count || 0;
        }

        let recentRequest = Promise.resolve([]);
        if (placement === "CART_DRAWER") {
          let history = [];
          try {
            history = JSON.parse(localStorage.getItem("theme_recently_viewed") || "[]");
          } catch {
            // Storage can be unavailable in privacy-restricted browsers.
          }
          const currentHandle = document.querySelector(
            '[data-section-type="product"][data-product-handle]',
          )?.dataset.productHandle;
          if (currentHandle) {
            history = (Array.isArray(history) ? history : [])
              .filter((handle) => handle !== currentHandle)
              .concat(currentHandle);
          }
          recentRequest = cartRecentlyProducts({
            history,
            cartIds: productIds,
            loadProduct: loadRecentlyProduct,
            loadBestSellers: async () => {
              const products = await recentJson(`${storefrontRoot()}collections/best-sellers?view=cart-recently&sort_by=best-selling`);
              return Array.isArray(products) ? products : [];
            },
          }).catch(() => []);
        }

        const params = new URLSearchParams({
          placement,
          product_ids: productIds.join(","),
          subtotal: String(subtotal),
          item_count: String(itemCount),
        });
        let payload;
        if (shopifyConfig) {
          payload = {
            appearance: shopifyConfig.appearance,
            discount: shopifyConfig.discount,
            recommendations: await shopifyRecommendations({
              productIds,
              limit: shopifyConfig.maxProducts,
              allowCustomization: placement === "PRODUCT_PAGE",
              loadRelated: async (id) => {
                const result = await shopifyJson(`${storefrontRoot()}recommendations/products.json?product_id=${encodeURIComponent(id)}&limit=10&intent=related`);
                return Array.isArray(result?.products) ? result.products : [];
              },
              loadFallback: () => shopifyJson(`${storefrontRoot()}collections/best-sellers?view=cart-recently&sort_by=best-selling`),
              loadProduct: loadUpsellProduct,
            }),
          };
        } else try {
          const response = await fetch(`${this.dataset.endpoint}?${params}`, {
            headers: { Accept: "application/json" },
          });
          if (!response.ok) throw new Error("Unable to load recommendations");
          payload = await response.json();
        } catch (error) {
          if (placement !== "CART_DRAWER") throw error;
          payload = { recommendations: [], appearance: this.lastAppearance || { stylePreset: "CAMOSIGNAL" } };
        }
        this.lastAppearance = payload.appearance;
        this.recentProducts = await recentRequest;
        await this.render(payload);
      } catch (error) {
        this.renderState(
          "flex-upsell__error",
          "Recommendations are unavailable.",
        );
        console.warn("[Flex Cart Upsell]", error);
      } finally {
        this.loading = false;
      }
    }

    async render(payload) {
      const isDrawer = this.dataset.placement === "CART_DRAWER";
      const isRecently = this.dataset.recentlyViewed === "true";
      // Keep custom products on product pages, but exclude them from the drawer.
      const eligibleRecommendations = (payload.recommendations || []).filter(
        (product) => !isDrawer || product?.requiresCustomization !== true,
      );
      const loadedRecommendations = await Promise.all(
        eligibleRecommendations.map((product) => isRecently ? product : storefrontProduct(product)),
      );
      const recommendations = loadedRecommendations.filter(Boolean);
      this.carouselCleanup?.();
      this.carouselCleanup = undefined;
      if (!recommendations.length) {
        this.renderHost()?.replaceChildren();
        await this.renderRecently(payload.appearance || {});
        return;
      }

      const appearance = payload.appearance || {};
      const discount = payload.discount || { type: "NONE" };
      const root = document.createElement("section");
      const layout = String(appearance.layout || "STACKED").toLowerCase();
      const preset = String(appearance.stylePreset || "COMPLETE_THE_LOOK")
        .toLowerCase()
        .replaceAll("_", "-");
      const isCamoDrawer = isDrawer && preset === "camosignal";
      const isProductPage = this.dataset.placement === "PRODUCT_PAGE";
      root.className = `flex-upsell flex-upsell--${layout} flex-upsell--preset-${preset}${
        isDrawer ? " flex-upsell--drawer flex-upsell--drawer-carousel" : ""
      }${isProductPage ? " flex-upsell--product-page" : ""}`;
      root.setAttribute(
        "aria-label",
        appearance.heading || "Recommended products",
      );
      this.applyAppearance(root, appearance);

      const header = document.createElement("header");
      header.className = "flex-upsell__header";
      const heading = document.createElement("h3");
      heading.className = "flex-upsell__heading";
      heading.textContent =
        isDrawer &&
        (!appearance.heading || appearance.heading === "COMPLETE THE LOOK")
          ? "YOU MAY ALSO LIKE"
          : appearance.heading || "You may also like";
      header.appendChild(heading);
      if (appearance.subheading) {
        const subheading = document.createElement("p");
        subheading.className = "flex-upsell__subheading";
        subheading.textContent = appearance.subheading;
        header.appendChild(subheading);
      }

      let previousButton;
      let nextButton;
      let carouselFooter;
      let carouselProgress;
      let carouselCount;
      if (isDrawer && recommendations.length > 1) {
        const navigation = document.createElement("div");
        navigation.className = "flex-upsell__navigation";

        const navigationButton = (label, iconUrl, fallback) => {
          const button = document.createElement("button");
          button.type = "button";
          button.setAttribute("aria-label", label);

          if (iconUrl) {
            const icon = document.createElement("img");
            icon.src = iconUrl;
            icon.alt = "";
            icon.width = 14;
            icon.height = 14;
            button.appendChild(icon);
          } else {
            button.textContent = fallback;
          }

          return button;
        };

        previousButton = navigationButton(
          "Previous recommendation",
          this.dataset.previousIconUrl,
          "‹",
        );
        nextButton = navigationButton(
          "Next recommendation",
          this.dataset.nextIconUrl,
          "›",
        );
        if (isCamoDrawer) {
          carouselFooter = document.createElement("div");
          carouselFooter.className = "flex-upsell__carousel-footer";
          const track = document.createElement("div");
          track.className = "flex-upsell__progress";
          track.setAttribute("aria-hidden", "true");
          carouselProgress = document.createElement("span");
          track.appendChild(carouselProgress);
          carouselCount = document.createElement("span");
          carouselCount.className = "flex-upsell__carousel-count";
          carouselCount.setAttribute("role", "status");
          carouselCount.setAttribute("aria-live", "polite");
          carouselCount.setAttribute("aria-atomic", "true");
          navigation.append(previousButton, carouselCount, nextButton);
          carouselFooter.append(track, navigation);
        } else {
          navigation.append(previousButton, nextButton);
          header.appendChild(navigation);
        }
      }
      root.appendChild(header);

      const list = document.createElement("div");
      list.className = "flex-upsell__list";
      const previousList = isCamoDrawer
        ? this.renderHost()?.querySelector(":scope > .flex-upsell > .flex-upsell__list")
        : null;
      const previousCards = [...(previousList?.children || [])];
      const sameProducts =
        previousCards.length === recommendations.length &&
        previousCards.every(
          (card, index) =>
            card.dataset.productId === String(recommendations[index].id),
        );
      const preservedScroll = sameProducts ? previousList.scrollLeft : 0;
      recommendations.forEach((product) => {
        const card = this.productCard(product, appearance, discount);
        const previousCard = previousCards.find(
          (item) => item.dataset.productId === String(product.id),
        );
        const previousVariant = previousCard?.querySelector("select")?.value;
        const nextSelect = card.querySelector("select");
        if (
          previousVariant &&
          nextSelect &&
          [...nextSelect.options].some(
            (option) => option.value === previousVariant,
          )
        ) {
          nextSelect.value = previousVariant;
          nextSelect.dispatchEvent(new Event("change"));
        }
        list.appendChild(card);
        this.track("VIEW", product.id, product.price);
      });
      let syncNavigationState;
      if (isDrawer) {
        let navigationTarget = null;
        let stateFrame;
        let maximumScroll = 0;
        let viewportWidth = 0;
        let visibleFraction = 1;
        let snapPositions = [0];
        let cardEnds = [];

        const updateNavigationState = () => {
          const position = Math.min(
            maximumScroll,
            Math.max(0, list.scrollLeft),
          );
          if (
            navigationTarget !== null &&
            Math.abs(position - navigationTarget) <= 1 &&
            !motion.active
          ) {
            navigationTarget = null;
          }
          const destination = navigationTarget ?? position;
          const atStart = destination <= 1;
          const atEnd = destination >= maximumScroll - 1;

          if (carouselProgress && carouselCount) {
            const visibleEnd = Math.min(
              recommendations.length,
              Math.max(
                1,
                cardEnds.filter((end) => end <= position + viewportWidth + 1)
                  .length,
              ),
            );
            const label = `${visibleEnd} / ${recommendations.length}`;
            if (carouselCount.textContent !== label) {
              carouselCount.textContent = label;
              carouselCount.setAttribute(
                "aria-label",
                `Showing recommendations through ${visibleEnd} of ${recommendations.length}`,
              );
            }
            const progress = maximumScroll ? position / maximumScroll : 0;
            carouselProgress.style.transform = `translateX(${progress * (1 - visibleFraction) * 100}%) scaleX(${visibleFraction})`;
          }

          if (previousButton && previousButton.disabled !== atStart) {
            previousButton.disabled = atStart;
            previousButton.setAttribute("aria-disabled", String(atStart));
          }
          if (nextButton && nextButton.disabled !== atEnd) {
            nextButton.disabled = atEnd;
            nextButton.setAttribute("aria-disabled", String(atEnd));
          }
        };

        const scheduleNavigationState = () => {
          if (stateFrame !== undefined) return;
          stateFrame = requestAnimationFrame(() => {
            stateFrame = undefined;
            updateNavigationState();
          });
        };

        const motion = createCarouselMotion({
          read: () => list.scrollLeft,
          write: (position) => {
            list.scrollLeft = position;
            scheduleNavigationState();
          },
          requestFrame: (callback) => requestAnimationFrame(callback),
          cancelFrame: (frame) => cancelAnimationFrame(frame),
          reducedMotion: () =>
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          onActive: (active) => list.classList.toggle("is-animating", active),
          onFinish: () => {
            navigationTarget = null;
            scheduleNavigationState();
          },
        });

        // Measure only on layout changes, not on every scroll frame.
        syncNavigationState = () => {
          const previousWidth = viewportWidth;
          const pendingSnapIndex =
            navigationTarget === null
              ? -1
              : snapPositions.findIndex(
                  (position) => Math.abs(position - navigationTarget) <= 1,
                );
          viewportWidth = list.clientWidth;
          maximumScroll = Math.max(0, list.scrollWidth - viewportWidth);
          visibleFraction = Math.min(
            1,
            viewportWidth / (list.scrollWidth || 1),
          );
          const origin =
            list.getBoundingClientRect().left +
            list.clientLeft -
            list.scrollLeft;
          const cardBounds = [...list.children].map((card) =>
            card.getBoundingClientRect(),
          );
          snapPositions = carouselSnapPositions(
            cardBounds.map((card) => card.left - origin),
            maximumScroll,
          );
          cardEnds = cardBounds.map((card) => card.right - origin);
          // A resize can leave native scrolling aimed at an obsolete pixel offset.
          if (previousWidth > 0 && previousWidth !== viewportWidth) {
            const resizedPosition =
              pendingSnapIndex >= 0
                ? snapPositions[
                    Math.min(pendingSnapIndex, snapPositions.length - 1)
                  ]
                : snapPositions.reduce(
                    (nearest, position) =>
                      Math.abs(position - list.scrollLeft) <
                      Math.abs(nearest - list.scrollLeft)
                        ? position
                        : nearest,
                    0,
                  );
            motion.stop();
            list.scrollTo({
              left: resizedPosition,
              behavior: "instant",
            });
          }
          if (!motion.active) navigationTarget = null;
          if (carouselFooter) carouselFooter.hidden = maximumScroll <= 1;
          updateNavigationState();
        };

        const scrollRecommendations = (direction) => {
          navigationTarget = nextCarouselPosition(
            snapPositions,
            navigationTarget ?? list.scrollLeft,
            direction,
          );
          motion.to(navigationTarget);
          updateNavigationState();
        };

        previousButton?.addEventListener("click", () =>
          scrollRecommendations(-1),
        );
        nextButton?.addEventListener("click", () => scrollRecommendations(1));
        const releaseNavigationTarget = () => {
          if (motion.active) return;
          navigationTarget = null;
          scheduleNavigationState();
        };
        const interruptMotion = () => {
          motion.stop();
          navigationTarget = null;
          scheduleNavigationState();
        };
        const cleanupDrag = enableHorizontalDrag(list, {
          onStart: interruptMotion,
          onEnd: ({ dragged, startScrollLeft }) => {
            const position = list.scrollLeft;
            const projectedPosition =
              position + (dragged ? (position - startScrollLeft) * 0.25 : 0);
            navigationTarget = snapPositions.reduce(
              (nearest, candidate) =>
                Math.abs(candidate - projectedPosition) <
                Math.abs(nearest - projectedPosition)
                  ? candidate
                  : nearest,
              0,
            );
            motion.to(navigationTarget);
            updateNavigationState();
          },
        });
        const interruptTouchMotion = (event) => {
          if (event.pointerType !== "mouse") interruptMotion();
        };
        list.addEventListener("scroll", scheduleNavigationState, {
          passive: true,
        });
        list.addEventListener("scrollend", releaseNavigationTarget, {
          passive: true,
        });
        list.addEventListener("pointerdown", interruptTouchMotion, {
          passive: true,
        });
        list.addEventListener("wheel", interruptMotion, {
          passive: true,
        });
        const resizeObserver = new ResizeObserver(syncNavigationState);
        resizeObserver.observe(list);
        this.carouselCleanup = () => {
          resizeObserver.disconnect();
          cleanupDrag();
          motion.stop();
          if (stateFrame !== undefined) cancelAnimationFrame(stateFrame);
          list.removeEventListener("scroll", scheduleNavigationState);
          list.removeEventListener("scrollend", releaseNavigationTarget);
          list.removeEventListener("pointerdown", interruptTouchMotion);
          list.removeEventListener("wheel", interruptMotion);
        };
      }
      root.appendChild(list);
      if (carouselFooter) root.appendChild(carouselFooter);

      const renderHost = this.renderHost();
      if (!renderHost) return;
      renderHost.replaceChildren(root);
      if (isCamoDrawer) list.scrollLeft = preservedScroll;
      this.addScopedCustomCss(appearance.customCss, renderHost);
      if (syncNavigationState) {
        syncNavigationState();
        requestAnimationFrame(() => syncNavigationState());
      }
      await this.renderRecently(appearance);
    }

    async renderRecently(appearance) {
      if (this.dataset.recentlyViewed === "true" || !this.recentProducts?.length) return;
      const host = this.renderHost();
      if (!host) return;
      const recent = document.createElement("flex-cart-upsell");
      recent.dataset.placement = "CART_DRAWER";
      recent.dataset.recentlyViewed = "true";
      for (const key of ["closeIconUrl", "previousIconUrl", "nextIconUrl"]) {
        if (this.dataset[key]) recent.dataset[key] = this.dataset[key];
      }
      host.prepend(recent);
      await recent.render({
        recommendations: this.recentProducts,
        appearance: { ...appearance, heading: "RECENTLY VIEWED", subheading: "" },
        discount: { type: "NONE" },
      });
    }

    productCard(product, appearance, discount) {
      const isDrawer = this.dataset.placement === "CART_DRAWER";
      const stylePreset = String(
        appearance.stylePreset || "COMPLETE_THE_LOOK",
      ).toUpperCase();
      const isCamoSignal = stylePreset === "CAMOSIGNAL";
      const isCamoDrawer = isDrawer && isCamoSignal;
      const isCompleteLook = !isDrawer && stylePreset === "COMPLETE_THE_LOOK";
      const card = document.createElement("article");
      card.className = "flex-upsell__card";
      card.dataset.productId = String(product.id);

      const imageLink = document.createElement("a");
      imageLink.className = "flex-upsell__image-wrap";
      imageLink.href = productUrl(product.handle);
      imageLink.addEventListener("click", () =>
        this.track("CLICK", product.id, product.price),
      );
      if (product.imageUrl) {
        const image = document.createElement("img");
        image.className = "flex-upsell__image";
        image.src = `${product.imageUrl}${product.imageUrl.includes("?") ? "&" : "?"}width=320`;
        image.alt = product.title;
        image.loading = "lazy";
        image.width = 132;
        image.height = isDrawer ? 165 : 132;
        imageLink.appendChild(image);
      }
      card.appendChild(imageLink);

      const copy = document.createElement("div");
      copy.className = "flex-upsell__copy";
      if (appearance.showVendor) {
        const vendor = document.createElement("span");
        vendor.className = "flex-upsell__vendor";
        vendor.textContent = product.vendor;
        copy.appendChild(vendor);
      }
      const title = document.createElement("a");
      title.className = "flex-upsell__title";
      title.href = productUrl(product.handle);
      title.textContent = product.title;
      title.addEventListener("click", () =>
        this.track("CLICK", product.id, product.price),
      );
      copy.appendChild(title);
      const price = document.createElement("span");
      price.className = "flex-upsell__price";
      const priceValue = document.createElement("span");
      priceValue.className = "flex-upsell__price-value";
      const priceMeta = document.createElement("span");
      priceMeta.className = "flex-upsell__price-meta";
      price.append(priceValue, priceMeta);

      const renderPrice = (basePrice) => {
        const numericBasePrice = Number(basePrice);
        const safeBasePrice = Number.isFinite(numericBasePrice)
          ? numericBasePrice
          : Number(product.price) || 0;
        const salePrice = discountedPrice(safeBasePrice, discount);
        const hasCampaignDiscount = salePrice < safeBasePrice - 0.004;
        priceValue.textContent = money(salePrice);
        priceMeta.replaceChildren();
        imageLink.querySelector(".flex-upsell__image-badge")?.remove();

        if (hasCampaignDiscount) {
          const badge = document.createElement("span");
          badge.className = "flex-upsell__discount-badge";
          badge.textContent = discountLabel(discount);
          if (badge.textContent) {
            if (isCamoDrawer) {
              badge.className = "flex-upsell__image-badge";
              imageLink.appendChild(badge);
            } else {
              priceMeta.appendChild(badge);
            }
          }
        }

        const compareValue = hasCampaignDiscount
          ? safeBasePrice
          : Number(product.compareAtPrice);
        if (
          compareValue > salePrice &&
          (hasCampaignDiscount || appearance.showComparePrice || isDrawer)
        ) {
          const comparePrice = document.createElement("s");
          comparePrice.className = "flex-upsell__compare-price";
          comparePrice.textContent = money(compareValue);
          priceMeta.appendChild(comparePrice);
        }
        priceMeta.hidden = priceMeta.childNodes.length === 0;
      };

      renderPrice(product.variants?.[0]?.price ?? product.price);
      copy.appendChild(price);

      const requiresCustomization = product.requiresCustomization === true;
      let variantSelect;
      let addButton;
      const variants = Array.isArray(product.variants) ? product.variants : [];
      const variantItems = variants.map((variant) => ({
        variant,
        options: selectedOptionsFor(variant),
      }));
      const optionNames = optionNamesFor(variantItems);
      const needsVariantChoice =
        !requiresCustomization &&
        appearance.showVariantPicker !== false &&
        variants.length > 1;
      const showOptionTray =
        !isCamoSignal &&
        (isCompleteLook || isDrawer) &&
        needsVariantChoice &&
        optionNames.length > 0;

      if (!showOptionTray && needsVariantChoice) {
        variantSelect = document.createElement("select");
        variantSelect.className = "flex-upsell__variant";
        variantSelect.setAttribute(
          "aria-label",
          isCamoSignal
            ? `Color / Size for ${product.title}`
            : `Choose a variant for ${product.title}`,
        );
        variants.forEach((variant) => {
          const option = document.createElement("option");
          option.value = variant.id;
          option.textContent = isCamoSignal
            ? variantLabel(variant)
            : `${variantLabel(variant)} · ${money(variant.price)}`;
          variantSelect.appendChild(option);
        });
        let selectedLabel;
        if (isCamoDrawer) {
          const picker = document.createElement("div");
          picker.className = "flex-upsell__drawer-picker";
          selectedLabel = document.createElement("span");
          selectedLabel.setAttribute("aria-hidden", "true");
          picker.append(selectedLabel, variantSelect);
          if (this.dataset.nextIconUrl) {
            const arrow = document.createElement("img");
            arrow.src = this.dataset.nextIconUrl;
            arrow.alt = "";
            arrow.width = 12;
            arrow.height = 12;
            picker.appendChild(arrow);
          }
          copy.appendChild(picker);
        }
        const updateVariantWidth = () => {
          const label =
            variantSelect.selectedOptions[0]?.textContent?.trim() || "";
          if (selectedLabel) selectedLabel.textContent = label;
          variantSelect.classList.toggle(
            "flex-upsell__variant--long",
            label.length >= 16,
          );
        };
        updateVariantWidth();
        variantSelect.addEventListener("change", () => {
          if (addButton) this.clearAddError(addButton);
          updateVariantWidth();
          const selectedVariant = variants.find(
            (variant) => String(variant.id) === variantSelect.value,
          );
          renderPrice(selectedVariant?.price ?? product.price);
        });
        if (!isCamoDrawer) copy.appendChild(variantSelect);
      }
      card.appendChild(copy);

      if (appearance.showQuickAdd !== false && requiresCustomization) {
        const customizeLink = document.createElement("a");
        customizeLink.className = "flex-upsell__add";
        customizeLink.href = productUrl(product.handle);
        customizeLink.textContent = "Customize";
        customizeLink.setAttribute("aria-label", `Customize ${product.title}`);
        customizeLink.addEventListener("click", () =>
          this.track("CLICK", product.id, product.price),
        );
        card.appendChild(customizeLink);
      } else if (appearance.showQuickAdd !== false && variants[0]) {
        addButton = document.createElement("button");
        addButton.className = "flex-upsell__add";
        addButton.type = "button";
        addButton.textContent =
          isCamoDrawer &&
          (!appearance.buttonLabel || /^add$/i.test(appearance.buttonLabel))
            ? "Add to cart"
            : appearance.buttonLabel || "Add";
        addButton.dataset.defaultLabel = addButton.textContent;

        if (showOptionTray) {
          const trayId = `flex-upsell-options-${String(product.id).replace(/[^a-z0-9_-]/gi, "-")}`;
          const tray = document.createElement("div");
          tray.className = "flex-upsell__variant-tray";
          tray.id = trayId;
          tray.hidden = true;
          tray.setAttribute("role", "group");
          tray.setAttribute(
            "aria-label",
            `Choose options for ${product.title}`,
          );
          if (isDrawer) {
            tray.classList.add("flex-upsell__variant-tray--drawer");
            this.applyAppearance(tray, appearance);
          }

          const selected = new Map();
          let step = 0;
          const trayHeader = document.createElement("div");
          trayHeader.className = "flex-upsell__variant-tray-header";
          const trayLabel = document.createElement("strong");
          trayHeader.appendChild(trayLabel);

          const closeButton = document.createElement("button");
          closeButton.className = "flex-upsell__variant-close";
          closeButton.type = "button";
          closeButton.setAttribute("aria-label", "Close option selector");
          if (this.dataset.closeIconUrl) {
            const closeIcon = document.createElement("img");
            closeIcon.src = this.dataset.closeIconUrl;
            closeIcon.alt = "";
            closeIcon.width = 13;
            closeIcon.height = 13;
            closeButton.appendChild(closeIcon);
          } else {
            closeButton.textContent = "Close";
          }
          trayHeader.appendChild(closeButton);
          tray.appendChild(trayHeader);

          const options = document.createElement("div");
          options.className = "flex-upsell__variant-options";
          tray.appendChild(options);

          const closeTray = () => {
            tray.hidden = true;
            addButton.setAttribute("aria-expanded", "false");
            card.classList.remove("is-variant-open");
            if (isDrawer) {
              tray.remove();
              if (this.drawerOptionTray === tray) {
                this.drawerOptionTray = undefined;
              }
            }
          };
          closeButton.addEventListener("click", closeTray);
          tray.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeTray();
          });

          const addVariant = async (variant) => {
            const added = await this.addToCart(addButton, variant.id, product);
            if (added) closeTray();
          };

          const candidatesForStep = () =>
            variantItems.filter((item) =>
              optionNames.slice(0, step).every((name) => {
                const selectedValue = selected.get(normalizeOptionName(name));
                return (
                  !selectedValue || optionValueFor(item, name) === selectedValue
                );
              }),
            );

          const renderChoices = () => {
            options.replaceChildren();
            const optionName = optionNames[step];
            if (!optionName) return;
            trayLabel.textContent = optionName.toUpperCase();
            const candidates = candidatesForStep();
            const choices = uniqueVariantChoices(candidates, (item) =>
              optionValueFor(item, optionName),
            );

            choices.forEach((choice) => {
              const optionButton = document.createElement("button");
              optionButton.type = "button";
              optionButton.textContent = choice.label;
              optionButton.setAttribute(
                "aria-label",
                `Choose ${optionName} ${choice.label}`,
              );
              optionButton.addEventListener("click", () => {
                selected.set(normalizeOptionName(optionName), choice.label);
                for (const laterName of optionNames.slice(step + 1)) {
                  selected.delete(normalizeOptionName(laterName));
                }

                if (step === optionNames.length - 1) {
                  const variant = candidates.find(
                    (item) => optionValueFor(item, optionName) === choice.label,
                  )?.variant;
                  if (variant) addVariant(variant);
                  return;
                }

                step += 1;
                renderChoices();
              });
              options.appendChild(optionButton);
            });
          };

          addButton.setAttribute("aria-controls", trayId);
          addButton.setAttribute("aria-expanded", "false");
          addButton.addEventListener("click", () => {
            const nextOpen = tray.hidden;
            if (nextOpen) {
              selected.clear();
              step = 0;
              renderChoices();
              if (isDrawer) {
                this.closeDrawerOptionTray();
                this.drawerOptionTray = tray;
                this.renderHost()?.appendChild(tray);
              }
            }
            tray.hidden = !nextOpen;
            addButton.setAttribute("aria-expanded", String(nextOpen));
            card.classList.toggle("is-variant-open", nextOpen);
            if (nextOpen) {
              closeButton.focus();
              requestAnimationFrame(() => {
                tray.scrollIntoView({ block: "nearest", inline: "nearest" });
              });
            }
          });
          card.appendChild(addButton);
          if (!isDrawer) card.appendChild(tray);
        } else {
          addButton.addEventListener("click", () => {
            const variantId = variantSelect?.value || variants[0].id;
            this.addToCart(addButton, variantId, product);
          });
          card.appendChild(addButton);
        }
      }
      return card;
    }

    async addToCart(button, variantId, product) {
      this.clearAddError(button);
      const originalLabel =
        button.dataset.defaultLabel || button.textContent || "Add";
      button.dataset.defaultLabel = originalLabel;
      button.disabled = true;
      button.textContent = "Adding…";

      try {
        const normalizedVariantId = String(variantId || "")
          .replace("gid://shopify/ProductVariant/", "")
          .trim();
        if (!/^\d+$/.test(normalizedVariantId)) {
          throw new Error(
            "This product variant is unavailable. Please refresh the page.",
          );
        }

        const { drawer, sectionIds } = cartDrawerState();
        drawer?.setActiveElement?.(button);
        const themeCartApi = window.themeCore?.CartApi;
        const themeAddAction = themeCartApi?.actions?.ADD_TO_CART;
        const useThemeCartApi =
          typeof themeCartApi?.makeRequest === "function" &&
          Boolean(themeAddAction);
        const formData = new FormData();
        formData.append("id", normalizedVariantId);
        formData.append("quantity", "1");
        const themeCartItem = {
          id: Number(normalizedVariantId),
          quantity: 1,
        };
        const upsellPlacement = this.dataset.placement || "CART_DRAWER";
        if (this.dataset.recentlyViewed !== "true") {
          formData.append("properties[_flex_upsell_campaign]", upsellPlacement);
          themeCartItem["properties[_flex_upsell_campaign]"] = upsellPlacement;
        }
        const mainImageUrl = normalizeImageUrl(product.imageUrl);
        if (mainImageUrl) {
          formData.append(
            `properties[${upsellMainImageProperty}]`,
            mainImageUrl,
          );
          themeCartItem[`properties[${upsellMainImageProperty}]`] =
            mainImageUrl;
        }
        if (sectionIds.length) {
          formData.append("sections", sectionIds.join(","));
          formData.append("sections_url", window.location.pathname);
        }

        let responseBody;
        if (useThemeCartApi) {
          responseBody = await themeCartApi.makeRequest(
            themeAddAction,
            themeCartItem,
          );
        } else {
          const response = await fetch(cartAddUrl(), {
            method: "POST",
            headers: {
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
            body: formData,
          });
          responseBody = await response.json().catch(() => null);
          if (!response.ok || responseBody?.status) {
            throw new Error(
              responseBody?.description ||
                responseBody?.message ||
                "This product is unavailable for purchase.",
            );
          }
        }

        button.textContent = "Added";
        this.refreshThemeCart(
          drawer,
          responseBody,
          normalizedVariantId,
          useThemeCartApi,
        );
        window.setTimeout(() => {
          void this.track("ADD", product.id, product.price);
        }, 0);
        window.setTimeout(() => {
          button.disabled = false;
          button.textContent = originalLabel;
        }, 800);
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "This item cannot be added to the cart right now.";
        this.showAddError(button, message);
        console.warn("[Flex Cart Upsell]", error);
        return false;
      }
    }

    refreshThemeCart(
      drawer,
      cartData,
      variantId,
      themeCartHandlesRefresh = false,
    ) {
      let themeCartUpdated = themeCartHandlesRefresh;
      const cartUpdateEvent = window.PUB_SUB_EVENTS?.cartUpdate;
      if (
        !themeCartUpdated &&
        typeof window.publish === "function" &&
        cartUpdateEvent
      ) {
        try {
          const publishResult = window.publish(cartUpdateEvent, {
            source: "flex-upsell",
            productVariantId: variantId,
            cartData,
          });
          if (typeof publishResult?.catch === "function") {
            publishResult.catch((error) => {
              console.warn(
                "[Flex Cart Upsell] Theme cart update event failed.",
                error,
              );
            });
          }
          themeCartUpdated = true;
        } catch (error) {
          console.warn(
            "[Flex Cart Upsell] Theme cart update event failed.",
            error,
          );
        }
      }

      if (
        !themeCartUpdated &&
        typeof drawer?.renderContents === "function" &&
        cartData?.sections
      ) {
        try {
          // The theme replaces the drawer's markup synchronously. Keep the
          // current recommendations alive and move them into the new mount so
          // shoppers do not see an empty gap while fresh data is requested.
          const previousMount = this.drawerMount;
          const preservedUpsellNodes = previousMount
            ? [...previousMount.childNodes]
            : [];
          drawer.renderContents(cartData);
          this.mountDrawerEmbed();
          if (
            preservedUpsellNodes.length &&
            this.drawerMount &&
            this.drawerMount !== previousMount
          ) {
            this.drawerMount.replaceChildren(...preservedUpsellNodes);
          }
          themeCartUpdated = true;
        } catch (error) {
          console.warn("[Flex Cart Upsell] Cart drawer refresh failed.", error);
        }
      }

      if (!themeCartUpdated) {
        window.themeCore?.EventBus?.emit("cart:refresh");
        document.dispatchEvent(
          new CustomEvent("cart:refresh", { detail: { cartData, variantId } }),
        );
      }
      document.dispatchEvent(new CustomEvent("flex-upsell:cart-changed"));
      if (this.dataset.placement === "PRODUCT_PAGE") {
        window.setTimeout(() => {
          void this.refreshCartMainImages();
        }, 0);
      }
    }

    async refreshCartMainImages() {
      try {
        const response = await fetch(cartUrl(), {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const cart = await response.json();
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            this.applyCartMainImages(cart.items);
            resolve();
          });
        });
      } catch (error) {
        console.warn(
          "[Flex Cart Upsell] Unable to apply main product images.",
          error,
        );
      }
    }

    applyCartMainImages(cartItems) {
      if (!Array.isArray(cartItems) || !cartItems.length) return;

      const containers = [
        document.querySelector("cart-drawer"),
        document.querySelector("cart-items"),
        document.querySelector("#main-cart-items"),
      ].filter(
        (container, index, all) =>
          container && all.indexOf(container) === index,
      );

      containers.forEach((container) => {
        const rows = [...container.querySelectorAll(".cart-item")];
        cartItems.forEach((item, index) => {
          const mainImageUrl = normalizeImageUrl(
            item?.properties?.[upsellMainImageProperty],
          );
          if (!mainImageUrl) return;

          const row = rows[index];
          const image = row?.querySelector("img.cart-item__image, img");
          if (!image) return;

          row
            .querySelectorAll("source[srcset]")
            .forEach((source) => source.removeAttribute("srcset"));
          image.removeAttribute("srcset");
          image.removeAttribute("data-srcset");
          image.src = mainImageUrl;
          if (item.product_title) image.alt = item.product_title;
        });
      });
    }

    clearAddError(button) {
      const resetTimer = addErrorTimers.get(button);
      if (resetTimer) {
        window.clearTimeout(resetTimer);
        addErrorTimers.delete(button);
      }
      button
        .closest(".flex-upsell__card")
        ?.querySelector(".flex-upsell__add-error")
        ?.remove();
      button.classList.remove("is-error");
      button.disabled = false;
      button.textContent = button.dataset.defaultLabel || button.textContent;
    }

    showAddError(button, message) {
      const card = button.closest(".flex-upsell__card");
      if (!card) return;
      this.clearAddError(button);
      const soldOut = /sold out|out of stock|inventory|unavailable/i.test(
        String(message || ""),
      );
      const accessibleMessage = soldOut
        ? "This variant is sold out. Please choose another option."
        : "This item could not be added. Please try again.";
      const error = document.createElement("span");
      error.className = "flex-upsell__add-error";
      error.setAttribute("role", "alert");
      error.textContent = accessibleMessage;
      card.appendChild(error);

      button.textContent = soldOut ? "Sold out" : "Try again";
      button.disabled = true;
      button.classList.add("is-error");
      if (soldOut) {
        const selectedOption = card.querySelector(
          ".flex-upsell__variant option:checked",
        );
        if (selectedOption) selectedOption.disabled = true;
        return;
      }
      const resetTimer = window.setTimeout(() => {
        error.remove();
        button.classList.remove("is-error");
        button.disabled = false;
        button.textContent = button.dataset.defaultLabel || "Add";
        addErrorTimers.delete(button);
      }, 2200);
      addErrorTimers.set(button, resetTimer);
    }

    track(eventType, productId, value) {
      if (this.trackingDisabled || !this.dataset.eventsEndpoint) return Promise.resolve();
      const viewKey = `${this.dataset.placement}:${productId}`;
      if (eventType === "VIEW") {
        if (trackedViews.has(viewKey)) return Promise.resolve();
        if (trackedViews.size >= 500) trackedViews.delete(trackedViews.values().next().value);
        trackedViews.add(viewKey);
      }
      const body = new URLSearchParams({
        placement: this.dataset.placement || "CART_DRAWER",
        eventType,
        productId: String(productId || ""),
        sessionKey: sessionKey(),
      });
      if (Number.isFinite(value)) body.set("value", String(value));

      return fetch(this.dataset.eventsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: body.toString(),
        keepalive: true,
      }).catch(() => undefined);
    }

    applyAppearance(root, appearance) {
      const variables = {
        "--flex-card-background": appearance.cardBackground,
        "--flex-card-border": appearance.cardBorder,
        "--flex-text": appearance.textColor,
        "--flex-muted": appearance.mutedTextColor,
        "--flex-button": appearance.buttonBackground,
        "--flex-button-text": appearance.buttonTextColor,
        "--flex-accent": appearance.accentColor,
        "--flex-card-radius": `${appearance.borderRadius ?? 12}px`,
        "--flex-image-radius": `${appearance.imageRadius ?? 9}px`,
        "--flex-image-ratio":
          appearance.imageRatio === "PORTRAIT"
            ? "4 / 5"
            : appearance.imageRatio === "LANDSCAPE"
              ? "4 / 3"
              : "1",
        "--flex-spacing": `${appearance.spacing ?? 12}px`,
      };
      Object.entries(variables).forEach(([name, value]) => {
        if (value) root.style.setProperty(name, value);
      });
    }

    addScopedCustomCss(customCss, renderHost = this.renderHost()) {
      if (!customCss || /@import|url\s*\(|expression\s*\(/i.test(customCss))
        return;
      if (!renderHost) return;
      const hostId =
        renderHost.id || `flex-upsell-${Math.random().toString(36).slice(2)}`;
      renderHost.id = hostId;
      const scopedRules = String(customCss)
        .split("}")
        .map((rule) => {
          const [selectors, declarations] = rule.split("{");
          if (!selectors || !declarations || selectors.trim().startsWith("@"))
            return "";
          const scopedSelectors = selectors
            .split(",")
            .map((selector) => `#${hostId} ${selector.trim()}`)
            .join(", ");
          return `${scopedSelectors} { ${declarations} }`;
        })
        .join("\n");
      if (!scopedRules) return;
      const style = document.createElement("style");
      style.textContent = scopedRules;
      renderHost.appendChild(style);
    }

    renderState(className, message) {
      const state = document.createElement("div");
      state.className = className;
      state.setAttribute("aria-live", "polite");
      state.textContent = message;
      this.renderHost()?.replaceChildren(state);
    }
  }

  customElements.define("flex-cart-upsell", FlexCartUpsell);
})();

import { d as disableTabulationOnNotActiveSlidesWithModel } from "./disableTabulationOnNotActiveSlidesWithModel-38e80234.js";
const ProductForm = () => {
  const selectors = {
    section: "[data-section-type='product']",
    container: "[data-js-product-form]",
    product: "[data-js-product-json]",
    sku: ".js-product-sku",
    price: ".js-price",
    productPrice: "[data-product-price]",
    productPriceOld: "[data-price-old]",
    priceUnit: "[data-js-unit-price]",
    productSalePercentageBadge: ".js-sale-percentage-badge",
    productSalePercentage: "[data-sale-percentage]",
    variantId: '[name="id"]',
    submit: '[type="submit"]',
    quantityError: ".js-product-quantity-error",
    quantityErrorWrapper: ".js-product-quantity-error-wrapper",
    variants: "[data-js-product-variant]",
    variantElemJSON: "[data-selected-variant]",
    isPreset: "[data-is-preset]",
    productInventory: ".js-product-inventory",
    stickyBar: ".js-sticky-add-to-cart",
    stickyBarButton: ".js-sticky-add-to-cart-button",
    recipientCheckbox: ".js-recipient-form-checkbox",
    recipientFieldsContainer: ".js-recipient-form-fields",
    recipientField: ".js-recipient-form-field",
    recipientTimeZoneOffset: ".js-recipient-form-timezone-offset",
    recipientNoJsControl: ".js-recipient-form-no-js-control",
    animate: ".js-animate",
    breaksVal: ".js-price-breaks-val",
    volumePricing: ".js-product-volume-pricing",
    quantityRuleMin: ".js-product-quantity-rule-min",
    quantityRuleMax: ".js-product-quantity-rule-max",
    quantityRuleIncrement: ".js-product-quantity-rule-increment",
    quantityRuleMinVal: ".js-product-quantity-rule-min-val",
    quantityRuleMaxVal: ".js-product-quantity-rule-max-val",
    quantityRuleIncrementVal: ".js-product-quantity-rule-increment-val",
    volumePricingList: ".js-product-volume-pricing-list",
    volumePricingJSON: "[data-product-qty-breaks-json]",
    volumePricingShowMore: ".js-product-volume-pricing-show-more",
    priceVolume: ".js-price-volume",
    formError: ".js-form-error",
    swatchLabelName: ".js-swatch-label-name",
    quantityRules: ".js-product-quantity-rules",
    desktopMediaContainer: ".js-product-media-grid-desktop",
    mediaItem: ".js-product-gallery-slide",
    mediaLayout: "[data-media-layout]"
  };
  let classes = {};
  const attributes = {
    id: "id",
    isCurrencyEnabled: "data-currency-code-enabled"
  };
  const cachedOptions = /* @__PURE__ */ new Map();
  let fetchController = new AbortController();
  let prefetchController = new AbortController();
  let convertFormData;
  let QuantityWidget;
  let cssClasses;
  let formatMoney;
  let getUrlWithVariant;
  let isIosDevice;
  let containers = [];
  let forms = [];
  function init() {
    window.themeCore.utils.arrayIncludes;
    convertFormData = window.themeCore.utils.convertFormData;
    QuantityWidget = window.themeCore.utils.QuantityWidget;
    cssClasses = window.themeCore.utils.cssClasses;
    formatMoney = window.themeCore.utils.formatMoney;
    getUrlWithVariant = window.themeCore.utils.getUrlWithVariant;
    isIosDevice = window.themeCore.utils.isIosDevice;
    classes = {
      ...cssClasses,
      onSale: "price--on-sale",
      hidePrice: "price--hide",
      animate: "js-animate",
      animated: "animated"
    };
    containers = findForms();
    forms = setForms();
    setEventListeners();
    setEventBusListeners();
    initFirstState();
    showOptions();
    initStickyBar();
    initRecipientForm();
  }
  function setEventListeners() {
    forms.forEach(({ container: form }) => {
      form.addEventListener("change", onChangeForm);
      form.addEventListener("submit", onFormSubmit);
    });
    window.themeCore.EventBus.listen("cart:updated", function(cartData) {
      if (!cartData) {
        return;
      }
      if (!cartData.items) {
        return;
      }
      containers.forEach(function(container) {
        const currentVariant = findCurrentVariant(container);
        const quantityVariantInCart = getVariantCountInCart(currentVariant);
        updateVolumePricing(container, currentVariant, quantityVariantInCart, false);
        updateQuantityRules(container, currentVariant);
        updateQuantityLabelCartCount(container, quantityVariantInCart);
      });
    });
  }
  function setEventBusListeners() {
    if (forms.length) {
      forms.forEach(({ container: form }) => {
        const currentFormId = form.getAttribute("id");
        window.themeCore.EventBus.listen(`form:${currentFormId}:change-variant`, updateForm);
      });
    }
  }
  async function updateForm({ currentVariant, elements, form, product, isTrusted }) {
    const quantityVariantInCart = getVariantCountInCart(currentVariant);
    if (isTrusted) {
      await updateDesktopMediaContainer(currentVariant, product.handle, form);
      updateSwatchLabelName(currentVariant, form);
      updateSku(elements, currentVariant);
      updateSku({ skuContainer: elements.mobileSkuContainer }, currentVariant);
      updatePrice(elements, currentVariant);
      updateSalePercentageBadge(product, currentVariant, form);
      updateVariantId(elements, currentVariant);
      updateErrorMessages(elements);
      updateAddToCart(elements, currentVariant);
      updatePickupAvailability(currentVariant, form);
    }
    updateVolumePricing(form, currentVariant, quantityVariantInCart, isTrusted);
    updateQuantityRules(form, currentVariant);
    updateQuantityLabelCartCount(form, quantityVariantInCart);
  }
  async function updateDesktopMediaContainer(variant, productHandle, form) {
    var _a;
    const section = form.closest(selectors.section);
    const desktopMediaContainer = section == null ? void 0 : section.querySelector(selectors.desktopMediaContainer);
    if (!desktopMediaContainer || !variant || !variant.featured_media)
      return;
    const mediaContainerId = desktopMediaContainer.dataset.desktopProductMediaContainerId;
    const firstDesktopMedia = Number((_a = desktopMediaContainer.querySelector(selectors.mediaItem)) == null ? void 0 : _a.dataset.mediaId);
    if (window.matchMedia("(min-width: 1200px)").matches) {
      const slides = document.querySelectorAll(selectors.mediaItem);
      const activeIndex = [...slides].findIndex(
        (slide) => Number(slide.dataset.mediaId) === variant.featured_media.id
      );
      const targetSlide = slides[activeIndex];
      const mediaLayout = targetSlide == null ? void 0 : targetSlide.closest(selectors.mediaLayout).dataset.mediaLayout;
      if (mediaLayout === "stacked") {
        const rect = targetSlide.getBoundingClientRect();
        const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!isInView) {
          requestAnimationFrame(() => {
            targetSlide.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
          });
        }
      }
    }
    if (!mediaContainerId || firstDesktopMedia === variant.featured_media.id)
      return;
    return fetch(`${window.location.origin}/products/${productHandle}?section_id=${mediaContainerId}&variant=${variant.id}`).then((response) => response.text()).then((text) => {
      var _a2;
      const parsedDesktopMediaContainer = (_a2 = new DOMParser().parseFromString(text, "text/html")) == null ? void 0 : _a2.querySelector(selectors.desktopMediaContainer);
      if (!parsedDesktopMediaContainer)
        return;
      desktopMediaContainer.replaceWith(parsedDesktopMediaContainer);
      window.themeCore.EventBus.emit(`product-media:${mediaContainerId}-update-complete`);
    }).catch((error) => {
      console.error(error);
    });
  }
  function updatePickupAvailability(variant, form) {
    const pickUpAvailability = form.querySelector("pickup-availability");
    if (!pickUpAvailability) {
      return;
    }
    if (variant && variant.available) {
      pickUpAvailability.fetchAvailability(variant.id);
    } else {
      pickUpAvailability.removeAttribute("available");
      pickUpAvailability.innerHTML = "";
    }
  }
  function updateSwatchLabelName(variant, container) {
    const swatchNameEl = container.querySelector(selectors.swatchLabelName);
    if (!swatchNameEl) {
      return;
    }
    if (!variant) {
      const swatchName = swatchNameEl.getAttribute("data-swatch-name");
      const swatchOptionSelected = container.querySelector(`[data-option='${swatchName}']:checked`);
      if (swatchOptionSelected) {
        swatchNameEl.textContent = swatchOptionSelected.value;
      }
      return;
    }
    const optionPosition = swatchNameEl.getAttribute("data-swatch-position");
    const optionLabel = "option" + optionPosition;
    const optionName = variant[optionLabel];
    if (!optionName) {
      return;
    }
    swatchNameEl.textContent = optionName;
  }
  function updatePrice({ priceContainers }, variant) {
    if (!variant) {
      priceContainers.forEach((priceContainer) => priceContainer.classList.add(classes.hidePrice));
      updateUnitPrice(priceContainers, {});
      return;
    } else if (!priceContainers.length) {
      return;
    }
    priceContainers.forEach((priceContainer) => {
      const isCurrencyEnabled = priceContainer.hasAttribute(attributes.isCurrencyEnabled);
      const format = isCurrencyEnabled ? window.themeCore.objects.shop.money_with_currency_format : window.themeCore.objects.shop.money_format;
      const { price, compare_at_price } = variant;
      const onSale = compare_at_price > price;
      const moneyPrice = formatMoney(price, format);
      const moneyPriceOld = formatMoney(compare_at_price, format);
      priceContainer.classList.remove(classes.hidePrice);
      if (onSale) {
        priceContainer.classList.add(classes.onSale);
      } else {
        priceContainer.classList.remove(classes.onSale);
      }
      const productPrice = priceContainer.querySelectorAll(selectors.productPrice);
      const productPriceOld = priceContainer.querySelectorAll(selectors.productPriceOld);
      productPrice.forEach((element) => element.innerHTML = moneyPrice);
      productPriceOld.forEach((element) => element.innerHTML = moneyPriceOld);
    });
    updateUnitPrice(priceContainers, variant);
  }
  function updateSalePercentageBadge(product, variant, form) {
    const section = form.closest(selectors.section);
    const productSalePercentageBadges = section.querySelectorAll(selectors.productSalePercentageBadge);
    if (!productSalePercentageBadges.length) {
      return;
    }
    if (!variant || !product || !product.available) {
      productSalePercentageBadges.forEach((productSalePercentageBadge) => productSalePercentageBadge.classList.add(classes.hidden));
      return;
    }
    productSalePercentageBadges.forEach((productSalePercentageBadge) => {
      const productSalePercentage = productSalePercentageBadge.querySelector(selectors.productSalePercentage);
      if (!productSalePercentage) {
        productSalePercentageBadge.classList.add(classes.hidden);
        return;
      }
      const { price, compare_at_price } = variant;
      const onSale = compare_at_price > price;
      if (onSale) {
        const salePercentageValue = Math.floor((compare_at_price - price) * 100 / compare_at_price);
        productSalePercentage.innerHTML = window.themeCore.translations.get("products.product.sale_percentage_label", { number: salePercentageValue });
        productSalePercentageBadge.classList.remove(classes.hidden);
      } else {
        productSalePercentageBadge.classList.add(classes.hidden);
      }
    });
  }
  function updateUnitPrice(priceContainers, variant) {
    priceContainers.forEach((priceContainer) => {
      const unitPrice = [...priceContainer.querySelectorAll(selectors.priceUnit)];
      if (!unitPrice.length) {
        return;
      }
      const unitPriceContainerEl = unitPrice.find((element) => element.dataset.jsUnitPrice === "container");
      const unitPriceMoneyEl = unitPrice.find((element) => element.dataset.jsUnitPrice === "money");
      const unitPriceReferenceEl = unitPrice.find((element) => element.dataset.jsUnitPrice === "reference");
      const variantUnitPrice = variant.unit_price;
      const variantUnitPriceMeasurement = variant.unit_price_measurement;
      if (unitPriceMoneyEl) {
        if (variantUnitPrice) {
          const format = window.themeCore.objects.shop.money_format;
          unitPriceMoneyEl.innerHTML = formatMoney(variantUnitPrice, format);
        } else {
          unitPriceMoneyEl.innerHTML = "";
        }
      }
      if (unitPriceReferenceEl) {
        if (variantUnitPriceMeasurement) {
          const referenceValue = variantUnitPriceMeasurement.reference_value;
          const referenceUnit = variantUnitPriceMeasurement.reference_unit;
          unitPriceReferenceEl.innerHTML = referenceValue !== 1 ? referenceValue + referenceUnit : referenceUnit;
        } else {
          unitPriceReferenceEl.innerHTML = "";
        }
      }
      if (unitPriceContainerEl && (variantUnitPrice || variantUnitPriceMeasurement)) {
        unitPriceContainerEl.classList.remove(classes.hidden);
      } else {
        unitPriceContainerEl.classList.add(classes.hidden);
      }
    });
  }
  function updateSku({ skuContainer }, variant) {
    if (!skuContainer) {
      return;
    }
    let sku = null;
    if (variant) {
      sku = variant.sku;
    }
    if (!sku) {
      const isPreset = skuContainer.closest(selectors.isPreset);
      if (isPreset && isPreset.dataset.isPreset === "true") {
        return;
      }
      skuContainer.innerHTML = "";
      return;
    }
    const skuText = skuContainer.dataset.skuText;
    skuContainer.innerHTML = skuText ? skuText.replaceAll("{SKU}", sku).replaceAll("{sku}", sku) : sku;
  }
  function updateVariantId({ variantIdContainer }, variant) {
    if (!variantIdContainer || !variant) {
      return;
    }
    const { id } = variant;
    variantIdContainer.value = id;
  }
  function updateErrorMessages({ quantityError }) {
    if (!quantityError) {
      return;
    }
    quantityError.innerHTML = "";
  }
  function updateAddToCart({ submit }, currentVariant) {
    const mainAddToCart = submit.find((button) => !button.matches(selectors.stickyBarButton));
    const toggleDisabled = (isDisabled) => submit.forEach((button) => button.disabled = isDisabled);
    const loaderIcon = window.themeCore.utils.icons.loader;
    const setSubmitText = (text) => {
      var _a;
      mainAddToCart.innerHTML = ((_a = mainAddToCart == null ? void 0 : mainAddToCart.dataset) == null ? void 0 : _a.type) === "primary" ? `<span data-loading>${text}</span>${loaderIcon}` : `<span data-text="${text}"><span>${text}</span></span>${loaderIcon}`;
    };
    const isPreorderTemplate = submit.some((button) => button.hasAttribute("data-preorder"));
    const soldOut = window.themeCore.translations.get("products.product.sold_out");
    const unavailable = window.themeCore.translations.get("products.product.unavailable");
    const preOrder = window.themeCore.translations.get("products.product.pre_order");
    const addToCart = isPreorderTemplate ? preOrder : window.themeCore.translations.get("products.product.add_to_cart");
    if (currentVariant && currentVariant.available) {
      toggleDisabled(false);
      setSubmitText(addToCart);
    } else if (currentVariant && !currentVariant.available) {
      toggleDisabled(true);
      setSubmitText(soldOut);
    } else {
      toggleDisabled(true);
      setSubmitText(unavailable);
    }
  }
  function updateQuantityRules(container, variant) {
    const currentContainerData = forms.find((form) => form.container.getAttribute("id") === container.getAttribute("id"));
    const quantityWidgetEl = currentContainerData.elements.quantityWidgetEl;
    const quantityRules = container.querySelector(selectors.quantityRules);
    if (!quantityRules) {
      return;
    }
    if (!variant || variant && !variant.quantity_rule) {
      quantityRules.classList.add(classes.hidden);
      return;
    } else {
      quantityRules.classList.remove(classes.hidden);
    }
    const variantQuantityRules = variant.quantity_rule;
    const quantityRuleIncrement = quantityRules.querySelector(selectors.quantityRuleIncrement);
    const quantityRuleMin = quantityRules.querySelector(selectors.quantityRuleMin);
    const quantityRuleMax = quantityRules.querySelector(selectors.quantityRuleMax);
    const quantityRuleIncrementVal = quantityRules.querySelector(selectors.quantityRuleIncrementVal);
    const quantityRuleMinVal = quantityRules.querySelector(selectors.quantityRuleMinVal);
    const quantityRuleMaxVal = quantityRules.querySelector(selectors.quantityRuleMaxVal);
    if (quantityRuleIncrementVal) {
      quantityRuleIncrementVal.textContent = window.themeCore.translations.get("products.product.increments_of", { number: variantQuantityRules.increment });
      quantityWidgetEl.setIncrement(variantQuantityRules.increment);
      variantQuantityRules.increment > 1 ? quantityRuleIncrement.classList.remove(classes.hidden) : quantityRuleIncrement.classList.add(classes.hidden);
    }
    if (quantityRuleMinVal) {
      quantityRuleMinVal.textContent = window.themeCore.translations.get("products.product.minimum_of", { number: variantQuantityRules.min });
      quantityWidgetEl.setMin(variantQuantityRules.min);
      quantityWidgetEl.toggleDecrease();
      quantityWidgetEl.toggleIncrease();
      variantQuantityRules.min > 1 ? quantityRuleMin.classList.remove(classes.hidden) : quantityRuleMin.classList.add(classes.hidden);
    }
    if (quantityRuleMaxVal) {
      if (variantQuantityRules.max !== null) {
        quantityRuleMaxVal.textContent = window.themeCore.translations.get("products.product.maximum_of", { number: variantQuantityRules.max });
        quantityRuleMax.classList.remove(classes.hidden);
        quantityWidgetEl.setMax(variantQuantityRules.max);
      } else {
        quantityRuleMaxVal.textContent = "";
        quantityRuleMax.classList.add(classes.hidden);
        quantityWidgetEl.setMax("");
      }
      quantityWidgetEl.toggleDecrease();
      quantityWidgetEl.toggleIncrease();
    }
    if (variantQuantityRules.increment < 2 && variantQuantityRules.min < 2 && variantQuantityRules.max === null) {
      quantityRules.classList.add(classes.hidden);
    } else {
      quantityRules.classList.remove(classes.hidden);
    }
  }
  function updateVolumePricing(container, variant, quantity, isTrusted) {
    const currentContainerData = forms.find((form) => form.container.getAttribute("id") === container.getAttribute("id"));
    const quantityWidgetEl = currentContainerData.elements.quantityWidgetEl;
    const currentVariantEl = container.querySelector("[name=id]");
    if (!currentVariantEl) {
      return;
    }
    const volumePricing = container.querySelector(selectors.volumePricing);
    const volumePricingList = container.querySelector(selectors.volumePricingList);
    const volumePricingJSONEl = container.querySelector(selectors.volumePricingJSON);
    let quantityBreaks = null;
    if (!volumePricingJSONEl || !volumePricing) {
      return;
    }
    if (variant) {
      const volumePricingJSON = JSON.parse(volumePricingJSONEl.innerHTML);
      quantityBreaks = volumePricingJSON[variant.id].quantity_price_breaks;
      updateVariantVolumePrice(quantityBreaks);
      if (!isTrusted) {
        return;
      }
      if (quantityBreaks.length) {
        renderVolumePriceList(quantityBreaks);
        volumePricing.classList.remove(classes.hidden);
      } else {
        volumePricing.classList.add(classes.hidden);
      }
    } else {
      volumePricing.classList.add(classes.hidden);
    }
    function renderVolumePriceList(quantityBreaks2) {
      const showMoreBtn = container.querySelector(selectors.volumePricingShowMore);
      const moneyFormat = window.themeCore.objects.shop.money_with_currency_format;
      const priceTranslation = window.themeCore.translations.get("products.product.volume_pricing.each", {
        price: formatMoney(variant.price, moneyFormat)
      });
      showMoreBtn.addEventListener("click", function(e) {
        e.preventDefault();
        let listHiddenItems = volumePricingList.querySelectorAll(".is-hidden");
        if (!listHiddenItems.length) {
          return;
        }
        listHiddenItems.forEach(function(listItem) {
          listItem.classList.remove(classes.hidden);
        });
        showMoreBtn.classList.add(classes.hidden);
      });
      volumePricingList.innerHTML = "";
      let defaultMinPriceHTML = `
				<li class="product-volume-pricing__list-item">
					<span>${variant.quantity_rule.min}<span aria-hidden>+</span></span>
					<span>${priceTranslation}</span>
				</li>
			`;
      volumePricingList.insertAdjacentHTML("beforeend", defaultMinPriceHTML);
      quantityBreaks2.forEach(function(quantityBreak, i) {
        let hiddenClass = i >= 2 ? `${classes.hidden}` : "";
        let quantityBreakHTML = `
					<li class="product-volume-pricing__list-item ${hiddenClass}">
						<span>${quantityBreak.minimum_quantity}<span aria-hidden>+</span></span>
						<span>${quantityBreak.price_each}</span>
					</li>
				`;
        volumePricingList.insertAdjacentHTML("beforeend", quantityBreakHTML);
      });
      if (quantityBreaks2.length >= 3) {
        showMoreBtn.classList.remove(classes.hidden);
      } else {
        showMoreBtn.classList.add(classes.hidden);
      }
    }
    function updateVariantVolumePrice(quantityBreaks2) {
      const priceEls = container.querySelectorAll(selectors.priceVolume);
      const moneyFormat = window.themeCore.objects.shop.money_with_currency_format;
      const priceTranslation = window.themeCore.translations.get("products.product.volume_pricing.price_at_each", {
        price: formatMoney(variant.price, moneyFormat)
      });
      if (!priceEls.length) {
        return;
      }
      if (!variant) {
        priceEls.forEach((el) => el.classList.add(classes.hidden));
        return;
      }
      if (!quantityBreaks2 || !quantityBreaks2.length) {
        priceEls.forEach((el) => el.innerHTML = priceTranslation);
        priceEls.forEach((el) => el.classList.remove(classes.hidden));
        return;
      }
      const currentBreak = quantityBreaks2.findLast((qtyBreak) => {
        return Number(quantity) + Number(quantityWidgetEl.quantity.value) >= qtyBreak.minimum_quantity;
      });
      if (!currentBreak) {
        priceEls.forEach((el) => el.innerHTML = priceTranslation);
        priceEls.forEach((el) => el.classList.remove(classes.hidden));
        return;
      }
      priceEls.forEach((el) => el.innerHTML = currentBreak.price_at_each);
      priceEls.forEach((el) => el.classList.remove(classes.hidden));
    }
  }
  function getVariantCountInCart(variant) {
    const cartData = window.themeCore.cartObject;
    if (!cartData || !variant) {
      return;
    }
    if (!cartData.items.length) {
      return 0;
    }
    const currentVariant = cartData.items.find(function(item) {
      return item.variant_id === variant.id;
    });
    if (!currentVariant) {
      return 0;
    }
    return currentVariant.quantity;
  }
  function updateQuantityLabelCartCount(container, quantity) {
    if (!container) {
      return;
    }
    const priceBreaksEl = container.querySelector(selectors.breaksVal);
    if (!priceBreaksEl) {
      return;
    }
    priceBreaksEl.classList.toggle(classes.hidden, !quantity);
    if (!quantity) {
      priceBreaksEl.innerHTML = "";
    }
    priceBreaksEl.innerHTML = window.themeCore.translations.get("products.product.quantity_in_cart", { quantity });
  }
  async function onChangeForm({ currentTarget: form, target, isTrusted }) {
    const currentFormEntity = forms.find(({ container, elements: { optionElements } }) => form === container);
    if (!currentFormEntity) {
      return;
    }
    if (target.hasAttribute("data-quantity-input")) {
      let currentVariant2 = findCurrentVariant(form);
      let quantityVariantInCart = getVariantCountInCart(currentVariant2);
      updateVolumePricing(form, currentVariant2, quantityVariantInCart, false);
      updateQuantityRules(form, currentVariant2);
      updateQuantityLabelCartCount(form, quantityVariantInCart);
    }
    if (!target || !target.hasAttribute("data-option")) {
      return;
    }
    if (target.tagName === "SELECT" && target.selectedOptions.length) {
      Array.from(target.options).find((option) => option.getAttribute("selected")).removeAttribute("selected");
      target.selectedOptions[0].setAttribute("selected", "selected");
    }
    const productSection = form.closest("[data-section-type=product]");
    const sectionId = productSection.getAttribute("data-section-id");
    const productUrl = productSection.getAttribute("data-url");
    const productOptionsContainer = form.querySelector(".js-product-options");
    if (!productOptionsContainer) {
      return;
    }
    const selectedOptionValues = Array.from(
      productOptionsContainer.querySelectorAll("select[data-option] option[selected], input[data-option]:checked")
    ).map(({ dataset }) => dataset.optionValueId);
    const params = selectedOptionValues.length > 0 ? `&option_values=${selectedOptionValues.join(",")}` : "";
    const url = `${productUrl}?section_id=${sectionId}${params}`;
    let responseText;
    const cachedResult = cachedOptions.get(url);
    if (cachedResult) {
      responseText = cachedResult;
    } else {
      try {
        fetchController.abort();
        fetchController = new AbortController();
        responseText = await (await fetch(url, {
          signal: fetchController.signal
        })).text();
        cachedOptions.set(url, responseText);
      } catch {
        return;
      }
    }
    prefetchOptions(form);
    const html = new DOMParser().parseFromString(responseText, "text/html");
    productOptionsContainer.innerHTML = html.querySelector(".js-product-options").innerHTML;
    let currentVariant = findCurrentVariant(productOptionsContainer);
    let elements = currentFormEntity.elements;
    let product = currentFormEntity.product;
    let volumePricingJSONEl = form.querySelector(selectors.volumePricingJSON);
    if (volumePricingJSONEl && html.querySelector(selectors.volumePricingJSON)) {
      volumePricingJSONEl.innerHTML = html.querySelector(selectors.volumePricingJSON).innerHTML;
    }
    const shouldRestoreFocus = target.tagName !== "SELECT" || !isIosDevice();
    if (shouldRestoreFocus && document.querySelector(`#${target.id}`)) {
      document.querySelector(`#${target.id}`).focus();
    }
    const currentFormId = form.getAttribute("id");
    window.themeCore.EventBus.emit(`form:${currentFormId}:change-variant`, {
      form,
      product,
      currentVariant,
      elements,
      isTrusted
    });
    if (currentVariant) {
      window.themeCore.EventBus.emit(`pdp:section-${sectionId}:change-variant`, {
        variantId: currentVariant.id,
        variant: currentVariant,
        product,
        firstInitialization: false
      });
    }
    let productInventoryWrapper = form.querySelector(selectors.productInventory);
    if (productInventoryWrapper && html.querySelector(selectors.productInventory)) {
      productInventoryWrapper.outerHTML = html.querySelector(selectors.productInventory).outerHTML;
    }
    if (isEnableHistoryState(form)) {
      updateHistoryState(currentVariant);
    }
  }
  function onFormSubmit(event) {
    const target = event.target;
    event.preventDefault();
    const form = forms.find((f) => f.id === target.getAttribute(attributes.id));
    if (form) {
      const { submit } = form.elements;
      submit.forEach((button) => button.classList.add(classes.loading));
    }
    const formData = new FormData(target);
    const serialized = convertFormData(formData);
    window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.ADD_TO_CART, serialized).then((response) => {
      onFormSubmitSuccess(response, form);
    }).catch((error) => {
      onFormSubmitError(error, form);
    });
  }
  function onFormSubmitSuccess(success, form) {
    if (!form) {
      return;
    }
    const formElement = form.container;
    const { quantityWidgetEl, submit } = form.elements;
    quantityWidgetEl && quantityWidgetEl.setValue(0);
    submit.forEach((button) => button.classList.remove(classes.loading));
    resetRecipientForm(formElement);
    window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.GET_CART, { noOpen: true, noRefresh: true });
  }
  function onFormSubmitError(error, form) {
    if (!form) {
      return;
    }
    const formElement = form.container;
    const hasRecipientForm = formElement.querySelector(selectors.recipientCheckbox);
    let { description } = error;
    const { quantityError, submit } = form.elements;
    const quantityErrorWrapper = formElement.querySelector(selectors.quantityErrorWrapper);
    if (typeof description === "object" && hasRecipientForm) {
      const sectionID = form.container.dataset.sectionId;
      let errors = error.errors;
      const errorMessages = formElement.querySelectorAll(selectors.formError);
      const recipientFormFields = formElement.querySelectorAll(selectors.recipientField);
      if (errorMessages.length && recipientFormFields.length) {
        errorMessages.forEach(function(messageEl) {
          messageEl.classList.add(classes.hidden);
          messageEl.innerText = "";
        });
        recipientFormFields.forEach(function(field) {
          field.setAttribute("aria-invalid", false);
          field.removeAttribute("aria-describedby");
        });
      }
      return Object.entries(errors).forEach(([key, value]) => {
        const errorMessageId = `RecipientForm-${key}-error-${sectionID}`;
        const errorMessageElement = formElement.querySelector(`#${errorMessageId}`);
        const inputId = `Recipient-${key}-${sectionID}`;
        const inputElement = formElement.querySelector(`#${inputId}`);
        let message = `${value.join(", ")}`;
        if (key === "send_on") {
          message = `${value.join(", ")}`;
        }
        if (errorMessageElement) {
          errorMessageElement.innerText = message;
          errorMessageElement.classList.remove(classes.hidden);
        }
        if (inputElement) {
          inputElement.setAttribute("aria-invalid", true);
          inputElement.setAttribute("aria-describedby", errorMessageId);
        }
        submit.forEach((button) => button.classList.remove(classes.loading));
      });
    }
    if (quantityError && quantityErrorWrapper) {
      quantityError.innerHTML = description;
      quantityErrorWrapper.classList.remove(classes.hidden);
      window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.UPDATE_CART, { noOpen: true });
    }
    submit.forEach((button) => button.classList.remove(classes.loading));
  }
  function findCurrentVariant(container) {
    if (!container) {
      return;
    }
    const variantJSONElement = container.querySelector(selectors.variantElemJSON);
    const currentVariant = !!variantJSONElement ? JSON.parse(variantJSONElement.innerHTML) : null;
    return currentVariant;
  }
  function updateHistoryState(variant) {
    if (!variant) {
      return null;
    }
    const url = getUrlWithVariant(window.location.href, variant.id);
    window.history.replaceState({ path: url }, "", url);
  }
  function isEnableHistoryState(form) {
    return form.dataset.enableHistoryState || false;
  }
  function initFirstState() {
    forms.forEach(async (form) => {
      let currentVariant = findCurrentVariant(form.container);
      updateForm({ currentVariant, elements: form.elements, form: form.container, product: form.product, isTrusted: true });
      if (currentVariant) {
        const productSection = form.container.closest("[data-section-type=product]");
        const sectionId = productSection.getAttribute("data-section-id");
        window.themeCore.EventBus.emit(`pdp:section-${sectionId}:change-variant`, {
          variantId: currentVariant.id,
          variant: currentVariant,
          product: form.product,
          firstInitialization: true
        });
      }
      if (isEnableHistoryState(form.container)) {
        updateHistoryState(currentVariant);
      }
      await prefetchOptions(form.container);
    });
  }
  function findForms() {
    return [...document.querySelectorAll(selectors.container)];
  }
  function setForms() {
    return containers.reduce((acc, container) => {
      const productJsonTag = container.querySelector(selectors.product);
      let product = {};
      try {
        product = JSON.parse(productJsonTag.innerHTML);
      } catch (e) {
        return acc;
      }
      const id = container.getAttribute(attributes.id);
      const submit = [...container.querySelectorAll(selectors.submit)];
      const skuContainer = container.querySelector(selectors.sku);
      const priceContainers = [...container.querySelectorAll(selectors.price)];
      const quantityError = container.querySelector(selectors.quantityError);
      const variantIdContainer = container.querySelector(selectors.variantId);
      let optionElements = [...container.querySelectorAll("[data-option]")];
      let mobileSkuContainer = null;
      const quantityWidgetEl = QuantityWidget(container, {
        onQuantityChange: (widget) => {
          updateErrorMessages({ quantityError });
        }
      }).init();
      return [
        ...acc,
        {
          id,
          container,
          product,
          elements: {
            skuContainer,
            priceContainers,
            quantityWidgetEl,
            quantityError,
            variantIdContainer,
            submit,
            mobileSkuContainer,
            optionElements
          }
        }
      ];
    }, []);
  }
  function initStickyBar() {
    containers.forEach((form) => {
      const stickyBar = form.querySelector(selectors.stickyBar);
      const mainButton = form.querySelector(selectors.submit);
      if (!stickyBar || !mainButton) {
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const rect = mainButton.getBoundingClientRect();
          stickyBar.classList.toggle(classes.active, !entry.isIntersecting && rect.bottom < 0);
          if (!entry.isIntersecting) {
            const animate = stickyBar.closest(selectors.animate);
            animate && animate.classList.remove(classes.animate);
            animate && animate.classList.add(classes.animated);
          }
        });
      }, {});
      observer.observe(mainButton);
      stickyBar.addEventListener("click", (event) => {
        const stickyBarButton = event.target.closest(selectors.stickyBarButton);
        if (!stickyBarButton) {
          return;
        }
        mainButton.focus();
      });
    });
  }
  function initRecipientForm() {
    containers.forEach((form) => {
      const recipientCheckbox = form.querySelector(selectors.recipientCheckbox);
      const recipientFormFieldsContainer = form.querySelector(selectors.recipientFieldsContainer);
      const recipientFormFields = form.querySelectorAll(selectors.recipientField);
      const recipientTimeZoneOffset = form.querySelector(selectors.recipientTimeZoneOffset);
      const recipientControlNoJsCheckbox = form.querySelector(selectors.recipientNoJsControl);
      if (!recipientCheckbox || !recipientFormFieldsContainer || !recipientFormFields || !recipientTimeZoneOffset) {
        return;
      }
      recipientTimeZoneOffset.value = (/* @__PURE__ */ new Date()).getTimezoneOffset().toString();
      recipientControlNoJsCheckbox.disabled = true;
      recipientCheckbox.disabled = false;
      disableInputFields();
      recipientCheckbox.addEventListener("change", function() {
        if (recipientCheckbox.checked) {
          recipientFormFieldsContainer.classList.remove(classes.hidden);
          enableInputFields();
        } else {
          recipientFormFieldsContainer.classList.add(classes.hidden);
          disableInputFields();
        }
      });
      function disableInputFields() {
        recipientFormFields.forEach(function(field) {
          field.disabled = true;
        });
        recipientTimeZoneOffset.disabled = true;
      }
      function enableInputFields() {
        recipientFormFields.forEach(function(field) {
          field.disabled = false;
        });
        recipientTimeZoneOffset.disabled = false;
      }
    });
  }
  function recipientFormClearErrors(form) {
    const recipientCheckbox = form.querySelector(selectors.recipientCheckbox);
    if (!recipientCheckbox) {
      return;
    }
    const recipientFormFieldsContainer = form.querySelector(selectors.recipientFieldsContainer);
    const errorMessages = recipientFormFieldsContainer.querySelectorAll(selectors.formError);
    const recipientFormFields = form.querySelectorAll(selectors.recipientField);
    if (!errorMessages || !recipientFormFields) {
      return;
    }
    errorMessages.forEach(function(messageEl) {
      messageEl.classList.add(classes.hidden);
      messageEl.innerText = "";
    });
    recipientFormFields.forEach(function(field) {
      field.setAttribute("aria-invalid", false);
      field.removeAttribute("aria-describedby");
    });
  }
  function recipientFormClearInputs(form) {
    const recipientCheckbox = form.querySelector(selectors.recipientCheckbox);
    if (!recipientCheckbox) {
      return;
    }
    const recipientFormFields = form.querySelectorAll(selectors.recipientField);
    if (!recipientFormFields) {
      return;
    }
    recipientFormFields.forEach(function(field) {
      field.value = "";
    });
  }
  function resetRecipientForm(form) {
    const recipientCheckbox = form.querySelector(selectors.recipientCheckbox);
    if (!recipientCheckbox) {
      return;
    }
    if (recipientCheckbox.checked) {
      recipientCheckbox.checked = false;
      recipientCheckbox.dispatchEvent(new Event("change"));
      recipientFormClearErrors(form);
      recipientFormClearInputs(form);
    }
  }
  function showOptions() {
    containers.forEach((form) => {
      const variants = form.querySelector(selectors.variants);
      if (variants && variants.dataset.jsProductVariant !== "no-hidden") {
        variants.classList.add(classes.hidden);
      }
    });
  }
  function transformOptionsToVariants(options) {
    const groupedOptions = options.reduce((acc, option) => {
      if (!acc[option.name]) {
        acc[option.name] = [];
      }
      acc[option.name].push(option);
      return acc;
    }, {});
    const optionTypes = Object.values(groupedOptions);
    function cartesianProduct(arrays) {
      return arrays.reduce((acc, curr) => {
        const result = [];
        acc.forEach((a) => {
          curr.forEach((c) => {
            result.push([...a, c]);
          });
        });
        return result;
      }, [[]]);
    }
    const combinations = cartesianProduct(optionTypes);
    const variants = combinations.map((combination) => {
      return {
        option_values: combination.map((opt) => opt.value).join(","),
        selected: combination.every((opt) => opt.selected),
        options: combination
      };
    });
    return variants;
  }
  function sortVariantsByProximity(variants) {
    const selectedVariant = variants.find((v) => v.selected);
    if (!selectedVariant) {
      return variants;
    }
    const selectedValues = selectedVariant.options.map((opt) => opt.value);
    return variants.sort((a, b) => {
      const aMatches = a.options.filter((opt) => selectedValues.includes(opt.value)).length;
      const bMatches = b.options.filter((opt) => selectedValues.includes(opt.value)).length;
      const aDistance = selectedValues.length - aMatches;
      const bDistance = selectedValues.length - bMatches;
      if (aDistance !== bDistance) {
        return aDistance - bDistance;
      }
      return 0;
    });
  }
  async function fetchUrl(url) {
    const response = await fetch(url, {
      signal: prefetchController.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  }
  async function prefetchOptions(form) {
    const productOptionsContainer = form.querySelector(".js-product-options");
    if (!productOptionsContainer) {
      return;
    }
    const productSection = form.closest("[data-section-type=product]");
    const sectionId = productSection.getAttribute("data-section-id");
    const productUrl = productSection.getAttribute("data-url");
    const allOptions = Array.from(
      productOptionsContainer.querySelectorAll("select[data-option] option, input[data-option]")
    ).map((item) => {
      var _a, _b;
      return {
        name: item.dataset.option || ((_b = (_a = item.closest("select")) == null ? void 0 : _a.dataset) == null ? void 0 : _b.option),
        value: item.dataset.optionValueId,
        selected: item.matches("[selected], :checked")
      };
    });
    const variants = transformOptionsToVariants(allOptions);
    const sortedVariants = sortVariantsByProximity(variants);
    const filteredVariants = sortedVariants.filter((variant) => !Array.from(cachedOptions.keys()).some((key) => key.includes(variant.option_values)));
    const variantsToFetch = filteredVariants.slice(0, 20);
    const urlsToFetch = variantsToFetch.map(({ option_values }) => `${productUrl}?section_id=${sectionId}&option_values=${option_values}`);
    prefetchController.abort();
    prefetchController = new AbortController();
    const fetchPromises = urlsToFetch.map((url) => fetchUrl(url));
    const results = await Promise.allSettled(fetchPromises);
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const url = urlsToFetch[index];
        cachedOptions.set(url, result.value);
      }
    });
  }
  function allForms() {
    return forms;
  }
  return Object.freeze({
    init,
    allForms
  });
};
const ProductCarousel = ({ config, selectors, sectionId }) => {
  const Swiper = window.themeCore.utils.Swiper;
  const on = window.themeCore.utils.on;
  const extendDefaults = window.themeCore.utils.extendDefaults;
  const defaultSelectors = {
    slider: ".js-product-media-slider",
    sliderPagination: ".js-product-media-slider-pagination",
    activeClass: ".swiper-slide-active",
    modelPoster: ".js-product-media-model-poster",
    notInitedIframe: ".js-video.js-video-youtube, .js-video:empty",
    sliderThumbnails: ".js-product-media-slider-thumbnails"
  };
  selectors = extendDefaults(defaultSelectors, selectors);
  let Slider = null;
  let Thumbnails = null;
  let initiated = false;
  let firstLoad = true;
  function init() {
    if (initiated) {
      return Slider;
    }
    const mainSlider = document.querySelector(selectors.slider);
    let sliderAutoHeight = mainSlider.dataset.autoHeight;
    const sliderThumbnails = document.querySelector(selectors.sliderThumbnails);
    let dynamicPagination = mainSlider.dataset.dynamicPagination;
    dynamicPagination = dynamicPagination === "true";
    sliderAutoHeight = sliderAutoHeight === "true";
    if (sliderThumbnails) {
      const thumbnailsPosition = sliderThumbnails.dataset.thumbnailsPosition;
      let thumbnailsDirections = "horizontal";
      if (thumbnailsPosition === "right" || thumbnailsPosition === "left") {
        thumbnailsDirections = "vertical";
      }
      if (thumbnailsDirections === "horizontal") {
        Thumbnails = new Swiper(selectors.sliderThumbnails, {
          direction: thumbnailsDirections,
          slidesPerView: 5,
          spaceBetween: 4,
          freeMode: true,
          watchSlidesProgress: true,
          a11y: {
            slideRole: ""
          },
          threshold: 10,
          breakpoints: {
            1200: {
              slidesPerView: "auto",
              spaceBetween: 16
            }
          }
        });
      } else {
        const thumbPrev = document.querySelector(`.js-thumb-nav-prev-${sectionId}`);
        const thumbNext = document.querySelector(`.js-thumb-nav-next-${sectionId}`);
        Thumbnails = new Swiper(selectors.sliderThumbnails, {
          direction: thumbnailsDirections,
          slidesPerView: "auto",
          spaceBetween: 10,
          freeMode: false,
          watchSlidesProgress: true,
          threshold: 10,
          speed: 400
        });

        // Wire up buttons manually — reliable hơn Swiper navigation option
        // vì buttons nằm ngoài swiper container
        if (thumbPrev) {
          thumbPrev.addEventListener("click", () => {
            Thumbnails.slidePrev(400);
          });
        }
        if (thumbNext) {
          thumbNext.addEventListener("click", () => {
            Thumbnails.slideNext(400);
          });
        }

        // Tự động ẩn/hiện nút dựa trên trạng thái Swiper
        const updateNavState = () => {
          if (!thumbPrev || !thumbNext) return;
          if (Thumbnails.isLocked) {
            // Tất cả slides vừa khớp → ẩn cả 2 nút
            thumbPrev.classList.add("is-hidden");
            thumbNext.classList.add("is-hidden");
          } else {
            thumbPrev.classList.remove("is-hidden");
            thumbNext.classList.remove("is-hidden");
            // Mờ nút khi đã ở đầu/cuối
            thumbPrev.classList.toggle("swiper-button-disabled", Thumbnails.isBeginning);
            thumbNext.classList.toggle("swiper-button-disabled", Thumbnails.isEnd);
          }
        };

        Thumbnails.on("slideChange", updateNavState);
        Thumbnails.on("resize", updateNavState);
        setTimeout(updateNavState, 200);
      }
      on("keydown", Thumbnails.el, (e) => {
        if (e.keyCode !== 13 && e.keyCode !== 32) {
          return;
        }
        const slideIndex = e.target.dataset.slideIndex;
        if (!slideIndex)
          return;
        Thumbnails.slideTo(slideIndex);
        Slider.slideTo(slideIndex);
      });
    }
    let prevArrow = document.querySelector(selectors.sliderNavigationPrev);
    let nextArrow = document.querySelector(selectors.sliderNavigationNext);
    Slider = new Swiper(selectors.slider, {
      ...config,
      autoHeight: sliderAutoHeight,
      spaceBetween: 8,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
        dynamicBullets: dynamicPagination,
        bulletElement: "button"
      },
      navigation: {
        nextEl: nextArrow,
        prevEl: prevArrow
      },
      thumbs: {
        swiper: Thumbnails
      }
    });
    Slider.on("slideChange", function(swiper) {
      const activeSlide = swiper.slides[swiper.activeIndex];
      if (!activeSlide) {
        return;
      }
      swiper.allowTouchMove = !(activeSlide.hasAttribute("data-model-slide") && !activeSlide.querySelector(selectors.modelPoster));
    });
    const targetNode = document.querySelector(selectors.slider);
    const observer = new MutationObserver(() => {
      if (targetNode.querySelector(selectors.notInitedIframe)) {
        return;
      }
      disableTabulationOnNotActiveSlidesWithModel(Slider);
      observer.disconnect();
    });
    const observerOptions = {
      attributes: true,
      childList: true,
      subtree: true
    };
    observer.observe(targetNode, observerOptions);
    setEventBusListeners();
    initiated = true;
  }
  function setEventBusListeners() {
    if (!Slider) {
      return;
    }
    Slider.on("slideChange", function(swiper) {
      window.themeCore.EventBus.emit("product-slider:slide-change");
      disableTabulationOnNotActiveSlidesWithModel(swiper);
    });
    window.themeCore.EventBus.listen(`pdp:section-${sectionId}:change-variant`, onChangeVariant);
  }
  function onChangeVariant({ variant }) {
    if (!Slider) {
      return;
    }
    if (!variant) {
      return;
    }
    let variantMediaID = null;
    if (variant.featured_media) {
      variantMediaID = variant.featured_media.id;
    }
    const currentIndex = [...Slider.slides].findIndex((slide) => {
      const slideVariantIdEl = slide.querySelector(selectors.sliderSlideVariantId);
      if (!slideVariantIdEl) {
        return false;
      }
      const slideMediaId = slideVariantIdEl.getAttribute("data-media-id");
      return slideMediaId.includes(variantMediaID);
    });
    if (currentIndex === false || currentIndex === -1) {
      return;
    }
    const isShowFirstMediaImage = Slider.el.hasAttribute("data-is-show-first-media-image");
    if (firstLoad && isShowFirstMediaImage) {
      firstLoad = false;
      return;
    }
    Slider.slideTo(currentIndex);
  }
  function destroy() {
    if (Slider && initiated) {
      Slider.destroy();
      Slider = null;
    }
    initiated = false;
  }
  function disableSwipe() {
    if (!Slider) {
      return;
    }
    Slider.allowTouchMove = false;
  }
  return Object.freeze({
    init,
    destroy,
    disableSwipe,
    onChangeVariant
  });
};
export {
  ProductCarousel as P,
  ProductForm as a
};

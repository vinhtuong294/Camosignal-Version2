const Cart = () => {
  const Toggle = window.themeCore.utils.Toggle;
  const cssClasses = window.themeCore.utils.cssClasses;
  const formToJSON = window.themeCore.utils.formToJSON;
  const on = window.themeCore.utils.on;
  const QuantityWidget = window.themeCore.utils.QuantityWidget;
  const Preloder = window.themeCore.utils.Preloder;
  const selectors = {
    sectionDrawerWrapper: ".cart-drawer-section",
    section: '[data-section-type="cart-template"]',
    sectionDrawer: '[data-section-modification="drawer"]',
    upsellDrawer: "#CartUpsellDrawer",
    subtotal: ".js-cart-subtotal",
    container: ".js-cart-container",
    header: ".js-cart-header",
    content: ".js-cart-content",
    footer: ".js-cart-footer",
    drawerTabButton: ".js-cart-drawer-tab-button",
    drawerTabContent: ".js-cart-drawer-tab-content",
    buttonsContent: ".js-cart-footer-button",
    additionalButtons: ".js-cart-footer-additional-buttons",
    cartItem: "[data-cart-item]",
    quantity: ".js-quantity",
    quantityError: ".js-cart-item-error-message",
    remove: ".js-cart-item-remove",
    closeButton: ".js-cart-close-button",
    cartNoteField: ".js-cart-notes-field",
    cartDrawerNoteControlText: ".js-cart-note-control-text",
    submit: '[type="submit"]',
    scrollable: "[data-scrollable]",
    discount: ".js-cart-discount-block",
    discountAccordionContainer: ".js-cart-discount-accordion-container",
    accordionItem: ".js-accordion-item",
    accordionControl: ".js-accordion-control",
    discountForm: ".js-cart-discount-form",
    discountApply: ".js-cart-discount-apply-button",
    discountPill: ".js-cart-discount-pill",
    discountRemove: ".js-cart-discount-pill-remove",
    discountError: ".js-cart-discount-error",
    discountErrorCode: ".js-cart-discount-error-code",
    discountErrorShipping: ".js-cart-discount-error-shipping"
  };
  const classes = {
    ...cssClasses,
    empty: "is-empty"
  };
  let sections = [], drawers = [], sectionDrawerWrapper = null;
  const pendingQuantityUpdates = /* @__PURE__ */ new Map();
  const quantityUpdateDelay = 140;
  function init() {
    sectionDrawerWrapper = document.querySelector(selectors.sectionDrawerWrapper);
    setupDrawers();
    setupSections();
    setupEventListeners();
  }
  let hasErrors = false;
  function setupDrawers() {
    drawers = [...document.querySelectorAll(selectors.sectionDrawer)].map((section) => {
      const drawer = Toggle({
        toggleSelector: section.id,
        closeAccordionsOnHide: false,
        overlayPlacement: sectionDrawerWrapper || document.body
      });
      drawer.init();
      const initializedDrawer = {
        el: section,
        toggle: {
          open: () => drawer.open(section),
          close: () => drawer.close(section)
        }
      };
      setupDrawerEvents(initializedDrawer);
      return initializedDrawer;
    });
  }
  function setupDrawerEvents(drawer) {
    if (!drawer || !drawer.toggle) {
      return;
    }
    window.themeCore.EventBus.listen(`cart:drawer:${drawer.el.id}:open`, drawer.toggle.open);
    window.themeCore.EventBus.listen(`cart:drawer:${drawer.el.id}:close`, drawer.toggle.close);
  }
  function setupSections() {
    sections = Array.from(document.querySelectorAll(selectors.section)).map((section) => ({
      el: section,
      id: section.dataset.sectionId,
      content: section.querySelector(selectors.content)
    }));
    sections.forEach((section) => {
      const quantityWidgets = Array.from(section.el.querySelectorAll(selectors.quantity));
      if (!quantityWidgets || !quantityWidgets.length) {
        section.quantityWidgets = [];
      } else {
        section.quantityWidgets = quantityWidgets.map((quantityEl) => {
          const widget = QuantityWidget(quantityEl, {
            onQuantityChange
          });
          return widget.init();
        });
      }
      const preloader = Preloder(section.el);
      if (preloader) {
        section.preloader = preloader.init();
      }
      if (!section.el.dataset.cartSectionListenersBound) {
        on("click", section.el, onRemoveButtonClick);
        on("submit", section.el, onDiscountSubmit);
        on("click", section.el, onRemoveDiscount);
        section.el.dataset.cartSectionListenersBound = "true";
      }
    });
    updateFreeShippingBar();
  }
  function setupEventListeners() {
    window.themeCore.EventBus.listen("cart:updated", onCartUpdated);
    window.themeCore.EventBus.listen("cart:refresh", refreshSections);
    window.themeCore.EventBus.listen("cart:drawer:open", openCartDrawer);
    window.themeCore.EventBus.listen("cart:drawer:refresh-and-open", refreshAndOpenCartDrawer);
    window.themeCore.EventBus.listen("cart:drawer:close", closeCartDrawer);
    document.addEventListener("click", (event) => event.target.closest(selectors.closeButton) && window.themeCore.EventBus.emit("cart:drawer:close"));
    document.addEventListener("change", saveCartNoteValue);
    document.addEventListener("click", initHeaderTabs);
    window.themeCore.EventBus.listen("product-card-form-start-request", function(e) {
      const form = e.target;
      if (!form) {
        return;
      }
      const cartDrawer = form.closest(selectors.sectionDrawer);
      if (!cartDrawer) {
        return;
      }
      showPreloaders();
    });
    window.themeCore.EventBus.listen("product-card-form-end-request", function(e) {
      const form = e.target;
      if (!form) {
        return;
      }
      const cartDrawer = form.closest(selectors.sectionDrawer);
      if (!cartDrawer) {
        return;
      }
      hidePreloaders();
      const cartDrawerFooter = form.closest(selectors.sectionDrawer).querySelector(selectors.footer);
      if (cartDrawerFooter) {
        cartDrawerFooter.classList.remove(classes.hidden);
      }
      scrollToTop();
    });
  }
  function initHeaderTabs(event) {
    const tabButton = event.target.closest(selectors.drawerTabButton);
    if (!tabButton) {
      return;
    }
    const tabContentName = tabButton.getAttribute("data-tab-content");
    const tabContent = document.getElementById(tabContentName);
    const tabButtons = document.querySelectorAll(selectors.drawerTabButton);
    const drawerTabContents = document.querySelectorAll(selectors.drawerTabContent);
    if (tabButton.classList.contains(cssClasses.active) || !tabContent) {
      return;
    }
    tabButtons.forEach((btn) => {
      btn.classList.remove(cssClasses.active);
    });
    drawerTabContents.forEach((tabContentEl) => {
      tabContentEl.classList.add(cssClasses.hidden);
    });
    tabButton.classList.add(cssClasses.active);
    tabContent.classList.remove(cssClasses.hidden);
    const cartDrawerFooter = tabButton.closest(selectors.sectionDrawer).querySelector(selectors.footer);
    if (tabContentName === "CartUpsellDrawer") {
      cartDrawerFooter.classList.add(cssClasses.hidden);
    } else {
      cartDrawerFooter.classList.remove(cssClasses.hidden);
    }
    scrollToTop();
  }
  function scrollToTop() {
    const scrollableElement = document.querySelector(selectors.scrollable);
    if (scrollableElement) {
      scrollableElement.scrollTo({
        top: 0
      });
    }
  }
  async function saveCartNoteValue(event) {
    const cartNotesField = event.target.closest(selectors.cartNoteField);
    const cartNoteControlText = document.querySelector(selectors.cartDrawerNoteControlText);
    if (!cartNotesField)
      return;
    showPreloaders();
    try {
      await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.UPDATE_CART, {
        note: cartNotesField.value
      });
    } catch (error) {
      console.log(error);
    } finally {
      hidePreloaders();
      if (cartNoteControlText) {
        if (cartNotesField.value !== "") {
          cartNoteControlText.textContent = window.themeCore.translations.get("cart.general.edit_note");
        } else {
          cartNoteControlText.textContent = window.themeCore.translations.get("cart.general.note");
        }
      }
    }
  }
  function getSectionsIds() {
    return sections.map((section) => section.id);
  }
  async function getCartSectionsDOMs() {
    const ids = getSectionsIds();
    const requestURL = new URL(window.location.href);
    requestURL.searchParams.set("sections", ids.join(","));
    requestURL.searchParams.set("lazyload", "false");
    return fetch(requestURL.href).then((response) => response.json());
  }
  function openCartDrawer(data) {
    var _a;
    if (data && data.id) {
      window.themeCore.EventBus.emit(`cart:drawer:${data.id}:open`);
      return;
    }
    const firstAvailableCartDrawer = drawers.find((drawer) => drawer.toggle && drawer.toggle.open);
    if (firstAvailableCartDrawer) {
      firstAvailableCartDrawer.toggle.open();
      scrollToTop();
      const cartDrawerFooter = (_a = firstAvailableCartDrawer.el) == null ? void 0 : _a.querySelector(selectors.footer);
      cartDrawerFooter && cartDrawerFooter.classList.toggle(classes.hidden, false);
    }
  }
  function refreshAndOpenCartDrawer(data) {
    refreshSections().then(() => {
      openCartDrawer(data);
    });
  }
  function closeCartDrawer(data) {
    if (data && data.id) {
      window.themeCore.EventBus.emit(`cart:drawer:${data.id}:close`);
      return;
    }
    drawers.forEach((drawer) => {
      if (drawer.toggle && drawer.toggle.close) {
        drawer.toggle.close();
      }
    });
  }
  function showPreloaders() {
    sections.forEach((section) => {
      if (section.preloader) {
        section.preloader.show();
      }
    });
  }
  function hidePreloaders() {
    sections.forEach((section) => {
      if (section.preloader) {
        section.preloader.hide();
      }
    });
  }
  async function refreshSections(sectionsResource = null) {
    const resource = !(sectionsResource && Object.keys(sectionsResource).length === 0 && Object.getPrototypeOf(sectionsResource) === Object.prototype) ? await getCartSectionsDOMs() : sectionsResource;
    if (!resource) {
      return false;
    }
    sections.map((section) => {
      const template = new DOMParser().parseFromString(resource[section.id], "text/html");
      const updatedSection = template.querySelector(selectors.section);
      const header = template.querySelector(selectors.header);
      const content = template.querySelector(selectors.content);
      const subtotalContent = template.querySelector(selectors.subtotal);
      const buttonsContent = template.querySelector(selectors.buttonsContent);
      const additionalButtons = template.querySelector(selectors.additionalButtons);
      const discount = template.querySelector(selectors.discount);
      let isDiscountAccordionActive = false;
      const discountAccordionContainer = section.el.querySelector(selectors.discountAccordionContainer);
      if (discountAccordionContainer) {
        const accordionItem = discountAccordionContainer.querySelector(selectors.accordionItem);
        if (accordionItem) {
          isDiscountAccordionActive = accordionItem.classList.contains(classes.active);
        }
      }
      if (!updatedSection || !content) {
        return;
      }
      section.el.classList.toggle(classes.empty, updatedSection.classList.contains(classes.empty));
      const sectionContent = section.el.querySelector(selectors.content);
      if (!sectionContent) {
        return;
      }
      if (buttonsContent) {
        const sectionButtonsContent = section.el.querySelector(selectors.buttonsContent);
        if (sectionButtonsContent && sectionButtonsContent.innerHTML !== buttonsContent.innerHTML) {
          sectionButtonsContent.innerHTML = buttonsContent.innerHTML;
        }
      }
      if (additionalButtons) {
        const sectionAdditionalButtons = section.el.querySelector(selectors.additionalButtons);
        if (sectionAdditionalButtons && sectionAdditionalButtons.innerHTML !== additionalButtons.innerHTML) {
          sectionAdditionalButtons.classList.toggle(classes.hidden, additionalButtons.classList.contains(classes.hidden));
        }
      }
      if (subtotalContent) {
        const sectionSubtotal = section.el.querySelector(selectors.subtotal);
        if (sectionSubtotal) {
          sectionSubtotal.innerHTML = subtotalContent.innerHTML;
        }
      }
      if (discount) {
        const sectionDiscount = section.el.querySelector(selectors.discount);
        if (sectionDiscount) {
          sectionDiscount.innerHTML = discount.innerHTML;
        }
        if (isDiscountAccordionActive) {
          const newDiscountAccordionContainer = sectionDiscount.querySelector(selectors.discountAccordionContainer);
          if (newDiscountAccordionContainer) {
            const accordionItem = newDiscountAccordionContainer.querySelector(selectors.accordionItem);
            accordionItem.classList.add(cssClasses.active);
            accordionItem.querySelector(selectors.accordionControl).setAttribute("aria-expanded", true);
          }
        }
      }
      sectionContent.innerHTML = content.innerHTML;
      window.themeCore.Accordion.init();
      if (header) {
        const headerContent = section.el.querySelector(".js-cart-header");
        headerContent.innerHTML = header.innerHTML;
      }
    });
    setupSections();
  }
  function onQuantityChange(widget) {
    if (!widget || !widget.controls || !widget.controls.input) {
      return;
    }
    const input = widget.controls.input;
    const key = input.dataset.itemKey;
    const quantity = widget.quantity.value;
    const existingUpdate = pendingQuantityUpdates.get(key);
    if (existingUpdate && existingUpdate.timer) {
      clearTimeout(existingUpdate.timer);
    }
    pendingQuantityUpdates.set(key, {
      ...(existingUpdate || {}),
      widget,
      quantity,
      timer: setTimeout(() => flushQuantityUpdate(key), quantityUpdateDelay)
    });
  }
  function flushQuantityUpdate(key) {
    const pendingUpdate = pendingQuantityUpdates.get(key);
    if (!pendingUpdate || pendingUpdate.inFlight) {
      return;
    }
    const { widget, quantity } = pendingUpdate;
    pendingUpdate.inFlight = true;
    pendingUpdate.timer = null;
    showPreloaders();
    const sectionsIds = getSectionsIds().join(",");
    window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.CHANGE_CART_ITEM_QUANTITY, key, quantity, sectionsIds).then(async (cart) => {
      let item = cart.items.find((item2) => item2.key === key);
      const latestUpdate = pendingQuantityUpdates.get(key);
      if (item && quantity !== item.quantity && latestUpdate && latestUpdate.quantity === quantity) {
        const description = window.themeCore.translations.get("cart.errors.quantity", {
          count: item.quantity,
          title: item.title
        });
        hasErrors = true;
        setTimeout(() => {
          hasErrors = false;
        }, 0);
        throw { description };
      }
    }).catch((error) => {
      const latestUpdate = pendingQuantityUpdates.get(key);
      if (latestUpdate && latestUpdate.quantity === quantity) {
        onQuantityError(widget, error);
      }
    }).finally(() => {
      const latestUpdate = pendingQuantityUpdates.get(key);
      if (latestUpdate && latestUpdate.quantity !== quantity) {
        latestUpdate.inFlight = false;
        latestUpdate.timer = setTimeout(() => flushQuantityUpdate(key), 0);
      } else {
        pendingQuantityUpdates.delete(key);
        if (pendingQuantityUpdates.size === 0) {
          hidePreloaders();
        }
        widget.toggleIncrease();
        widget.toggleDecrease();
      }
    });
  }
  function onRemoveButtonClick(event) {
    const removeButton = event.target.closest(selectors.remove);
    if (!removeButton) {
      return;
    }
    event.preventDefault();
    showPreloaders();
    const sectionsIds = getSectionsIds().join(",");
    const key = removeButton.dataset.itemKey;
    const pendingUpdate = pendingQuantityUpdates.get(key);
    if (pendingUpdate && pendingUpdate.timer) {
      clearTimeout(pendingUpdate.timer);
    }
    pendingQuantityUpdates.delete(key);
    window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.REMOVE_CART_ITEM, key, sectionsIds).finally(() => {
      hidePreloaders();
    });
  }
  function getRenderedDiscounts() {
    const discountPills = [...document.querySelectorAll(selectors.discountPill)];
    return discountPills.map((pillHTML) => pillHTML.dataset.discountCode);
  }
  function getCartLevelDiscountApplicationCodes(cart) {
    const codes = [];
    (cart.cart_level_discount_applications || []).forEach((wrap) => {
      const app = wrap.discount_application ?? wrap;
      if (app.type === "discount_code") {
        codes.push(app.title);
      }
    });
    (cart.items || []).forEach((item) => {
      (item.line_level_discount_allocations || []).forEach((alloc) => {
        const app = alloc.discount_application ?? alloc;
        if (app.type === "discount_code") {
          codes.push(app.title);
        }
      });
    });
    return [...new Set(codes)];
  }
  async function onDiscountSubmit(event) {
    const form = event.target.closest(selectors.discountForm);
    if (!form) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    showPreloaders();
    try {
      const formData = formToJSON(form);
      const discountCodeValue = formData.discount;
      const renderedDiscounts = getRenderedDiscounts();
      if (renderedDiscounts.includes(discountCodeValue)) {
        return;
      }
      const sectionsIds = getSectionsIds().join(",");
      await window.themeCore.CartApi.makeRequest(
        window.themeCore.CartApi.actions.UPDATE_CART,
        {
          discount: [...renderedDiscounts, discountCodeValue].join(",")
        },
        sectionsIds
      );
      form.reset();
    } catch (error) {
      console.log("Error while submit discount:", error);
    } finally {
      hidePreloaders();
    }
  }
  function showDiscountError(type) {
    const rootError = document.querySelector(selectors.discountError);
    const codeError = document.querySelector(selectors.discountErrorCode);
    const shippingError = document.querySelector(selectors.discountErrorShipping);
    rootError.classList.remove(cssClasses.hidden);
    if (type === "discount_code") {
      codeError.classList.remove(cssClasses.hidden);
      shippingError.classList.add(cssClasses.hidden);
    } else if (type === "shipping_error") {
      codeError.classList.add(cssClasses.hidden);
      shippingError.classList.remove(cssClasses.hidden);
    }
  }
  async function onRemoveDiscount(event) {
    const removeButton = event.target.closest(selectors.discountRemove);
    if (!removeButton) {
      return;
    }
    const discountPill = event.target.closest(selectors.discountPill);
    if (!discountPill) {
      return;
    }
    const discountCode = discountPill.dataset.discountCode;
    if (!discountCode) {
      return;
    }
    showPreloaders();
    try {
      const renderedDiscounts = getRenderedDiscounts();
      const index = renderedDiscounts.indexOf(discountCode);
      if (index === -1) {
        return;
      }
      renderedDiscounts.splice(index, 1);
      const sectionsIds = getSectionsIds().join(",");
      await window.themeCore.CartApi.makeRequest(
        window.themeCore.CartApi.actions.UPDATE_CART,
        {
          discount: renderedDiscounts.join(",")
        },
        sectionsIds
      );
    } catch (error) {
      console.log("Error while removing discount:", error);
    } finally {
      hidePreloaders();
    }
  }
  function onQuantityError(quantityWidget, error) {
    if (!quantityWidget || !error) {
      return;
    }
    quantityWidget.rollbackValue();
    const cartItem = quantityWidget.widget.closest(selectors.cartItem);
    if (!cartItem) {
      return;
    }
    const errorEl = cartItem.querySelectorAll(selectors.quantityError);
    if (!errorEl.length) {
      return;
    }
    errorEl.forEach((errorItem) => {
      errorItem.innerHTML = error.message || error.description;
    });
  }
  function onCartUpdated(data) {
    let resource = null;
    if (data) {
      resource = data.sections;
    }
    if (data && data.params && data.params.some((param) => param && param.noRefresh)) {
      return;
    }
    if (!hasErrors) {
      refreshSections(resource).then(() => {
        handleDiscountErrors(data);
        const isNotificationEnable = window.themeCore.objects.settings.show_cart_notification;
        const isOpenCart = !data.params.some((param) => param.noOpen);
        if (!JSON.parse(isNotificationEnable) && isOpenCart) {
          window.themeCore.EventBus.emit("cart:drawer:open");
        }
      });
    }
  }
  function handleDiscountErrors(cartUpdateData) {
    const discountParam = cartUpdateData.params.find(
      (item) => item && typeof item === "object" && "discount" in item
    );
    if (!discountParam)
      return;
    const currentAddedCode = discountParam.discount.split(",").at(-1);
    const responseDiscountCodes = cartUpdateData.discount_codes;
    const isDiscountError = responseDiscountCodes.find((discount) => discount.code === currentAddedCode && !discount.applicable);
    if (isDiscountError) {
      showDiscountError("discount_code");
      return;
    }
    const cartLevelCodes = getCartLevelDiscountApplicationCodes(cartUpdateData);
    const acceptedDiscountCodes = responseDiscountCodes.filter((d) => d.applicable).map((d) => d.code);
    const isShippingError = !acceptedDiscountCodes.every((code) => cartLevelCodes.includes(code));
    if (isShippingError) {
      showDiscountError("shipping_error");
    }
  }
  function updateFreeShippingBar() {
    let freeShippingBar = document.querySelector(".js-cart-shipping");
    if (!freeShippingBar) {
      return;
    }
    let shop_currency_rate = Shopify.currency.rate || 1;
    let moneyFormat = window.themeCore.objects.shop.money_format;
    let cart_total = Number(freeShippingBar.getAttribute("data-cart-total"));
    let amount_cents = freeShippingBar.getAttribute("data-amount-cents") * shop_currency_rate;
    let percentage = cart_total / amount_cents * 100;
    let amount_message = freeShippingBar.getAttribute("data-amount-message");
    let success_message = freeShippingBar.getAttribute("data-success-message");
    let progressBar = freeShippingBar.querySelector(".js-cart-shipping-progress-bar");
    let shippingTextEl = freeShippingBar.querySelector(".js-cart-shipping-amount-msg");
    let shippingIcon = freeShippingBar.querySelector(".js-cart-shipping-icon");
    let progressBarHiddenText = freeShippingBar.querySelector(".js-shipping-bar-progress-hidden-text");
    let progressBarMessage = window.themeCore.translations.get("cart.shipping_bar.progress").replace("{{ value }}", percentage.toFixed(1));
    freeShippingBar.style.setProperty("--shipping-bar-progress-value", percentage + "%");
    if (progressBarHiddenText) {
      progressBarHiddenText.textContent = progressBarMessage;
    }
    if (percentage < 100) {
      let remaining = amount_cents - cart_total;
      let remaining_money = window.themeCore.utils.formatMoney(remaining, moneyFormat);
      let message = amount_message.replace("{amount}", `<strong>${remaining_money}</strong>`);
      shippingTextEl.innerHTML = message;
      progressBar.classList.remove(cssClasses.hidden);
      if (shippingIcon) {
        shippingIcon.classList.add(cssClasses.hidden);
      }
    } else {
      shippingTextEl.innerHTML = success_message;
      progressBar.classList.add(cssClasses.hidden);
      if (shippingIcon) {
        shippingIcon.classList.remove(cssClasses.hidden);
      }
    }
  }
  return Object.freeze({
    init
  });
};
export {
  Cart as C
};

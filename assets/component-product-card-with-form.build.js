const selectors = {
  card: ".js-product-card",
  form: ".js-product-card-form",
  price: ".js-price",
  priceWrapper: ".js-price-container",
  button: ".js-product-card-button",
  product: ".js-product-card-product",
  variantElemJSON: "[data-selected-variant]",
  option: "select[data-option], [data-option]:checked",
  hiddenInput: ".js-product-card-variant-input",
  formError: ".js-product-card-error",
  minQuantity: ".js-product-card-min-value"
};
const ProductCardWithForm = () => {
  const cssClasses = window.themeCore.utils.cssClasses;
  function init() {
    addListeners();
  }
  function addListeners() {
    document.addEventListener("change", changeHandler);
    document.addEventListener("submit", submitHandler);
  }
  async function changeHandler(event) {
    const form = event.target.closest(selectors.form);
    if (!form) {
      return;
    }
    const card = form.closest(selectors.card);
    if (!card) {
      return;
    }
    const sectionId = card.dataset.section;
    [...form.querySelectorAll(selectors.option)];
    const price = card.querySelector(selectors.price);
    const priceContainer = card.querySelector(selectors.priceWrapper);
    let button = form.querySelector(selectors.button);
    button && button.classList.contains(cssClasses.hidden) && (button = null);
    const product = getSettings(form.querySelector(selectors.product));
    const formError = form.querySelector(selectors.formError);
    if (!product) {
      return;
    }
    if (event.target.tagName === "SELECT" && event.target.selectedOptions.length) {
      Array.from(event.target.options).find((option) => option.getAttribute("selected")).removeAttribute("selected");
      event.target.selectedOptions[0].setAttribute("selected", "selected");
    }
    const hiddenInput = form.querySelector(selectors.hiddenInput);
    const hiddenQuantity = form.querySelector(selectors.minQuantity);
    const productUrl = card.getAttribute("data-product-url");
    await updateVariantJSON(form, productUrl);
    const variant = getVariant(form);
    if (variant) {
      setCurrentVariant(variant.id, hiddenInput);
      setCurrentVariantQuantity(variant, hiddenQuantity);
      await updatePrice(product.handle, variant.id, priceContainer);
    } else {
      setCurrentVariant("", hiddenInput);
      hidePrice(price);
    }
    updateButton(variant, button || formError, card);
    window.themeCore.EventBus.emit(`product-card:change-variant`, {
      sectionId
    });
  }
  function getSettings(element) {
    try {
      return JSON.parse(element.textContent);
    } catch {
      return null;
    }
  }
  async function updateVariantJSON(form, productUrl) {
    if (!form || !productUrl) {
      return;
    }
    const selectedOptionValues = Array.from(
      form.querySelectorAll("select[data-option] option[selected], input[data-option]:checked")
    ).map(({ dataset }) => dataset.optionValueId);
    const params = selectedOptionValues.length > 0 ? `&option_values=${selectedOptionValues.join(",")}` : "";
    const productCardUrl = `${productUrl}?section_id=product-bundle-card${params}`;
    const fetchVariantJSONElement = await getHTML(productCardUrl, selectors.variantElemJSON);
    const formVariantJSONElement = form.querySelector(selectors.variantElemJSON);
    if (formVariantJSONElement) {
      formVariantJSONElement.innerHTML = fetchVariantJSONElement.innerHTML;
    }
  }
  function getVariant(container) {
    if (!container) {
      return;
    }
    const variantJSONElement = container.querySelector(selectors.variantElemJSON);
    const currentVariant = !!variantJSONElement ? JSON.parse(variantJSONElement.innerHTML) : null;
    return currentVariant;
  }
  function setCurrentVariant(variantId, hiddenInput) {
    if (!hiddenInput) {
      return;
    }
    hiddenInput.value = variantId;
  }
  function setCurrentVariantQuantity(variant, inputQuantity) {
    if (!inputQuantity || !variant.quantity_rule) {
      return;
    }
    inputQuantity.value = variant.quantity_rule.min;
  }
  async function updatePrice(productHandle, variantId, price) {
    if (!price) {
      return;
    }
    const url = getProductUrl(productHandle, variantId, "price").toString();
    if (!url) {
      return;
    }
    const fetchPrice = await getHTML(url, selectors.fetchPrice);
    price.innerHTML = fetchPrice.querySelector(selectors.price) && fetchPrice.querySelector(selectors.price).outerHTML;
  }
  async function getHTML(url, selector) {
    try {
      const response = await fetch(url);
      const resText = await response.text();
      let result = new DOMParser().parseFromString(resText, "text/html");
      if (selector) {
        result = result.querySelector(selector);
      }
      return result;
    } catch (error) {
      console.error(error);
    }
  }
  function updateButton(variant, button, card) {
    if (!button) {
      return;
    }
    const isFormError = !button.matches(selectors.button);
    const buttonTextEl = button.querySelector("[data-text]");
    const isPreorder = card.hasAttribute("data-preorder");
    if (!variant) {
      buttonTextEl.outerHTML = updateButtonText(window.themeCore.translations.get("products.product.unavailable"));
    } else if (!variant.available) {
      buttonTextEl.outerHTML = updateButtonText(window.themeCore.translations.get("products.product.sold_out"));
    } else if (isPreorder && !isFormError) {
      buttonTextEl.outerHTML = updateButtonText(window.themeCore.translations.get("products.product.pre_order"));
    } else if (!isFormError) {
      buttonTextEl.outerHTML = updateButtonText(window.themeCore.translations.get("products.product.add_to_cart"));
    } else {
      buttonTextEl.innerHTML = "";
    }
    if (isFormError) {
      return;
    }
    button.disabled = !variant || !variant.available;
    function updateButtonText(label) {
      return `
			<span data-text="${label}">
				<span>${label}</span>
			</span>
			`;
    }
  }
  function getProductUrl(productHandle, variant, templateSuffix) {
    if (!productHandle) {
      return;
    }
    const locale = window.Shopify.routes.root;
    const url = new URL(`${window.location.origin}${locale}products/${productHandle}`);
    url.searchParams.set("view", templateSuffix);
    if (variant) {
      url.searchParams.set("variant", variant);
    }
    return url;
  }
  function hidePrice(price) {
    if (!price) {
      return;
    }
    price.innerHTML = "";
  }
  async function submitHandler(event) {
    const form = event.target.closest(selectors.form);
    const formData = form && new FormData(form);
    const variant = form && form.querySelector(selectors.hiddenInput);
    const variantId = variant && variant.value;
    const minQuantityEl = form && form.querySelector(selectors.minQuantity);
    const minQuantity = minQuantityEl ? Number(minQuantityEl.value) : 1;
    const productCard = event.target.closest(selectors.card);
    if (!formData || !variantId) {
      return;
    }
    window.themeCore.EventBus.emit("product-card-form-start-request", event);
    event.preventDefault();
    const errorMessage = await addToCart(variantId, minQuantity, productCard);
    changeErrorMessage(form, errorMessage);
    scheduleSilentCartSync();
    window.themeCore.EventBus.emit("product-card-form-end-request", event);
    if (!errorMessage) {
      return;
    }
  }
  async function addToCart(variantId, quantity, productCard) {
    try {
      const params = {
        id: variantId,
        quantity
      };
      if (productCard && productCard.hasAttribute("data-preorder")) {
        params.properties = params.properties || {};
        params.properties["_Pre-order"] = "true";
      }
      await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.ADD_TO_CART, params);
    } catch (error) {
      return error.description;
    }
  }
  function changeErrorMessage(form, message = "") {
    const formError = form && form.querySelector(selectors.formError);
    if (!formError) {
      return;
    }
    formError.innerText = message;
  }
  function scheduleSilentCartSync() {
    const run = () => window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.GET_CART, { noOpen: true, noRefresh: true });
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout: 1500 });
      return;
    }
    window.setTimeout(run, 600);
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.ProductCardWithForm = window.themeCore.ProductCardWithForm || ProductCardWithForm();
  window.themeCore.utils.register(window.themeCore.ProductCardWithForm, "product-card-with-banner");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

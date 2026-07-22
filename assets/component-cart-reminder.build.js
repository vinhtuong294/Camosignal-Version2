const classes = {
  cartReminder: "cart-reminder",
  closeButton: "cart-reminder__close-button",
  content: "cart-reminder__content",
  count: "cart-reminder__count",
  text: "cart-reminder__text",
  outline: "focus-visible-outline"
};
const CartReminder = (config) => {
  const setCookie = window.themeCore.utils.setCookie;
  const getCookie = window.themeCore.utils.getCookie;
  const deleteCookie = window.themeCore.utils.deleteCookie;
  const on = window.themeCore.utils.on;
  const closeIcon = window.themeCore.utils.icons.close;
  const cartIcon = `
		<svg class="cart-reminder__icon icon" aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M13.9984 5C13.9984 4.46957 13.7877 3.96086 13.4126 3.58579C13.0375 3.21071 12.5288 3 11.9984 3C11.4679 3 10.9592 3.21071 10.5842 3.58579C10.2091 3.96086 9.99836 4.46957 9.99836 5M19.2584 9.696L20.6434 18.696C20.6872 18.9808 20.6689 19.2718 20.5898 19.5489C20.5107 19.8261 20.3726 20.0828 20.1851 20.3016C19.9975 20.5204 19.7649 20.6961 19.5031 20.8167C19.2413 20.9372 18.9566 20.9997 18.6684 21H5.32836C5.04 21 4.75503 20.9377 4.49301 20.8173C4.23098 20.6969 3.99809 20.5212 3.81031 20.3024C3.62253 20.0836 3.48429 19.8267 3.40507 19.5494C3.32585 19.2721 3.30753 18.981 3.35136 18.696L4.73636 9.696C4.80901 9.22359 5.04844 8.79282 5.41129 8.4817C5.77413 8.17059 6.2364 7.9997 6.71436 8H17.2824C17.7602 7.99994 18.2222 8.17094 18.5848 8.48203C18.9475 8.79312 19.1857 9.22376 19.2584 9.696Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
	`;
  const body = document.querySelector("body");
  let cartReminder = null;
  let timeout = null;
  let closeTimeout;
  let cartItemCount = 0;
  let cookieTimeMinutes = config.cookieTime;
  let cookieTime = cookieTimeMinutes * 60 * 1e3;
  if (config.displayFrequency === "one_time") {
    closeTimeout = 24 * 60 * 60 * 1e3;
  } else {
    closeTimeout = cookieTime;
  }
  let cookieExpires = (/* @__PURE__ */ new Date()).setTime((/* @__PURE__ */ new Date()).getTime() + cookieTime);
  let closeCookieExpires = (/* @__PURE__ */ new Date()).setTime((/* @__PURE__ */ new Date()).getTime() + closeTimeout);
  const strings = {
    CART_TYPE_DRAWER: "drawer"
  };
  function init() {
    checkCart();
    setEventListeners();
  }
  function checkCart() {
    window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.GET_CART, { noOpen: true });
  }
  function setTimerTimeout() {
    if (getCookie("cart_reminder")) {
      timeout = +getCookie("cart_reminder") - (/* @__PURE__ */ new Date()).getTime();
    } else {
      timeout = null;
    }
  }
  function setEventListeners() {
    window.themeCore.EventBus.listen("cart:updated", (event) => {
      if (!getCookie("cart_reminder_closed")) {
        onCartUpdated(event);
      }
    });
    window.themeCore.EventBus.listen("cart-reminder:added", () => {
      cartReminder = document.querySelector(`.${classes.cartReminder}`);
      if (!cartReminder) {
        return;
      }
      body.classList.add("cart-reminder-visible");
      updateReminderCount(cartItemCount);
      let cartReminderCloseButton = cartReminder.querySelector(`.${classes.closeButton}`);
      let cartReminderButton = cartReminder.querySelector(`.${classes.content}`);
      on("click", cartReminderButton, () => {
        window.themeCore.EventBus.emit("cart:drawer:open");
        setCookieOnClose();
        removePopupFromDOM();
      });
      on("click", cartReminderCloseButton, () => {
        setCookieOnClose();
        removePopupFromDOM();
      });
    });
  }
  function setCookieTime() {
    cookieExpires = (/* @__PURE__ */ new Date()).setTime((/* @__PURE__ */ new Date()).getTime() + cookieTime);
    setCookie("cart_reminder", cookieExpires, {
      expires: new Date(cookieExpires)
    });
  }
  function setCookieOnClose() {
    closeCookieExpires = (/* @__PURE__ */ new Date()).setTime((/* @__PURE__ */ new Date()).getTime() + closeTimeout);
    setCookie("cart_reminder_closed", "1", {
      expires: new Date(closeCookieExpires)
    });
  }
  function onCartUpdated(event) {
    cartItemCount = event && event.item_count ? Number(event.item_count) || 0 : 0;
    updateReminderCount(cartItemCount);

    if (cartItemCount > 0) {
      if (!getCookie("cart_reminder")) {
        setCookieTime();
      }
      setTimerTimeout();
      if (timeout) {
        setTimeout(() => {
          insertPopupToDOM();
        }, timeout);
      }
    } else {
      deleteCookie("cart_reminder");
      removePopupFromDOM();
    }
  }
  function updateReminderCount(count) {
    if (!cartReminder) {
      return;
    }

    const countBadge = cartReminder.querySelector("[data-cart-reminder-count]");
    if (countBadge) {
      countBadge.textContent = count > 99 ? "99+" : count;
      countBadge.setAttribute("data-cart-count", count);
    }
  }
  function DOMCartReminder() {
    const DOMContent = config.cartType === strings.CART_TYPE_DRAWER && !document.body.classList.contains("template-cart") ? DOMContentWithCartDrawer() : DOMContentWithCartPage();
    return `
			<div class="${classes.cartReminder} color-${config.enableColorSchemeInheritance ? config.colorSchemeGlobal : config.colorSchemeLocal}" data-cart-count="${cartItemCount}">
				${DOMContent}

				<button
					class="${classes.closeButton} ${classes.outline}"
					aria-label="${config.closeButtonA11y}"
					type="button"
					data-cart-reminder-close
				>
					${closeIcon}
				</button>
			</div>
		`;
  }
  function DOMContentWithCartDrawer() {
    return `
			<button
				type="button"
				class="${classes.content} ${classes.outline}"
				data-target="CartDrawer"
				data-js-toggle="CartDrawer"
				aria-expanded="false"
				aria-controls="CartDrawer"
				aria-label="${config.cartButtonA11y}"
			>
				${cartIcon}

				<span class="${classes.count}" data-cart-reminder-count data-cart-count="${cartItemCount}">
					${cartItemCount > 99 ? "99+" : cartItemCount}
				</span>

				<span class="${classes.text}">
					${config.text}
				</span>
			</button>
		`;
  }
  function DOMContentWithCartPage() {
    return `
			<a
				href="${config.cartRoute}"
				class="${classes.content} ${classes.outline}"
				aria-label="${config.cartLinkA11y}"
			>
				${cartIcon}

				<span class="${classes.count}" data-cart-reminder-count data-cart-count="${cartItemCount}">
					${cartItemCount > 99 ? "99+" : cartItemCount}
				</span>

				<span class="${classes.text}">
					${config.text}
				</span>
			</a>
		`;
  }
  function insertPopupToDOM() {
    if (cartReminder) {
      removePopupFromDOM();
    }
    body.insertAdjacentHTML("afterbegin", DOMCartReminder());
    window.themeCore.EventBus.emit("cart-reminder:added");
  }
  function removePopupFromDOM() {
    if (cartReminder) {
      cartReminder.remove();
      cartReminder = null;
    }
    body.classList.remove("cart-reminder-visible");
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  if (!window.themeCore || !window.themeCore.CartReminder || window.themeCore.CartReminder.initiated) {
    return;
  }
  CartReminder(window.themeCore.CartReminder.config).init();
  window.themeCore.CartReminder.initiated = true;
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

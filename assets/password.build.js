import { T as Ticker } from "./ticker-2aaf4347.js";
const PasswordHeader = () => {
  const selectors = {
    passwordHeader: ".js-password-header",
    popup: "password-popup",
    form: ".js-password-header-form",
    input: ".js-password-header-form",
    overlay: '[data-js-window="overlay"]',
    ticker: ".js-password-header-ticker-container"
  };
  const classes = {
    error: "error",
    headerDefault: "password-header--default"
  };
  const cssVariables = {
    tickerHeight: "--password-header-ticker-height"
  };
  const attributes = {
    transparentHeader: "data-transparent-header"
  };
  let passwordHeader;
  let enableTransparentHeader = false;
  const Toggle = window.themeCore.utils.Toggle;
  const on = window.themeCore.utils.on;
  function init() {
    passwordHeader = document.querySelector(selectors.passwordHeader);
    if (!passwordHeader) {
      return;
    }
    enableTransparentHeader = passwordHeader.hasAttribute(attributes.transparentHeader);
    initHeaderState();
    initTicker();
    initPopup();
  }
  function initHeaderState() {
    if (!enableTransparentHeader) {
      return;
    }
    setHeaderState();
    on("scroll", setHeaderState);
    function setHeaderState() {
      let condition = window.scrollY <= 0;
      if (condition && passwordHeader.classList.contains(classes.headerDefault)) {
        passwordHeader.classList.remove(classes.headerDefault);
      } else if (!condition && !passwordHeader.classList.contains(classes.headerDefault)) {
        passwordHeader.classList.add(classes.headerDefault);
      }
    }
  }
  function initTicker() {
    const ticker = passwordHeader.querySelector(selectors.ticker);
    if (!ticker) {
      return;
    }
    Ticker(ticker).init();
    if (!enableTransparentHeader) {
      return;
    }
    const cssRoot = document.querySelector(":root");
    setTickerVariable();
    on("resize", setTickerVariable);
    function setTickerVariable() {
      var _a;
      const tickerHeight = ((_a = ticker == null ? void 0 : ticker.getBoundingClientRect()) == null ? void 0 : _a.height) || 0;
      cssRoot.style.setProperty(cssVariables.tickerHeight, `${tickerHeight}px`);
    }
  }
  function initPopup() {
    const popup = document.getElementById(selectors.popup);
    if (!popup) {
      return;
    }
    const input = popup.querySelector(selectors.input);
    const modal = Toggle({
      toggleSelector: selectors.popup,
      elementToFocus: input,
      toggleTabIndex: false,
      overlayPlacement: passwordHeader
    });
    modal.init();
    on("click", popup, function(e) {
      if (e.target == this) {
        modal.close(popup);
      }
    });
    const form = popup.querySelector(selectors.form);
    const isFormHasErrors = form && form.classList.contains(classes.error);
    if (isFormHasErrors || document.querySelector(selectors.overlay)) {
      modal.open(popup);
    }
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.PasswordHeader = window.themeCore.PasswordHeader || PasswordHeader();
  window.themeCore.utils.register(window.themeCore.PasswordHeader, "password-header");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

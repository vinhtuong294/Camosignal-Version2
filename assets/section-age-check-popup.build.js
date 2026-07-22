const selectors = {
  ageCheckPopup: "age-check-popup",
  ageCheckPopupToggle: "AgeCheckPopupToggle",
  redirectLink: ".js-age-check-popup-redirect-link",
  confirmButton: ".js-age-check-popup-confirm"
};
const AgeCheckPopup = () => {
  const Toggle = window.themeCore.utils.Toggle;
  const on = window.themeCore.utils.on;
  const setCookie = window.themeCore.utils.setCookie;
  const getCookie = window.themeCore.utils.getCookie;
  let ageCheckPopup;
  let ageCheckPopupToggle;
  let preventRedirect;
  function init() {
    ageCheckPopup = document.getElementById(selectors.ageCheckPopup);
    if (!ageCheckPopup) {
      if (Shopify.designMode) {
        const popupOverlay = document.querySelector("[data-js-overlay='AgeCheckPopupToggle']");
        if (popupOverlay) {
          popupOverlay.click();
        }
      }
      return;
    }
    ageCheckPopup.getAttribute("data-redirect-url");
    showAgeCheckPopup();
    setEventListeners();
  }
  function showAgeCheckPopup() {
    if (getCookie("age_check_popup")) {
      return;
    }
    ageCheckPopupToggle = Toggle({
      toggleSelector: selectors.ageCheckPopupToggle
    });
    window.themeCore.ageCheckPopupOpen = true;
    ageCheckPopupToggle.init();
    ageCheckPopupToggle.open(ageCheckPopup);
    on("click", ageCheckPopup, function(e) {
      if (e.target == this) {
        ageCheckPopupToggle.close(ageCheckPopup);
      }
    });
    window.themeCore.EventBus.listen(`Toggle:${selectors.ageCheckPopupToggle}:close`, () => {
      if (!preventRedirect) {
        clickRedirectLink();
      }
    });
    on("keyup", (event) => {
      if (event.keyCode === 27) {
        if (!preventRedirect) {
          clickRedirectLink();
        }
      }
    });
  }
  function setEventListeners() {
    const confirmButton = document.querySelector(selectors.confirmButton);
    if (!confirmButton) {
      return;
    }
    confirmButton.addEventListener("click", function() {
      setPopupCookie();
      preventRedirect = true;
      ageCheckPopupToggle.close(ageCheckPopup);
      window.themeCore.ageCheckPopupOpen = false;
      window.themeCore.EventBus.emit("create:newsletter:popup");
    });
  }
  function setPopupCookie() {
    if (!ageCheckPopup.hasAttribute("data-cookie-time")) {
      return;
    }
    let cookieTimeDay = ageCheckPopup.dataset.cookieTime;
    let cookieTime = cookieTimeDay * 24 * 60 * 60;
    setCookie("age_check_popup", "1", {
      "max-age": cookieTime
    });
  }
  function clickRedirectLink() {
    if (!ageCheckPopup) {
      return;
    }
    let redirectLinkEl = ageCheckPopup.querySelector(selectors.redirectLink);
    if (!redirectLinkEl) {
      return;
    }
    redirectLinkEl.click();
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.AgeCheckPopup = window.themeCore.AgeCheckPopup || AgeCheckPopup();
  window.themeCore.utils.register(window.themeCore.AgeCheckPopup, "age-check-popup");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

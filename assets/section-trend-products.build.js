const selectors = {
  section: ".js-trend-products-section",
  hotSpot: ".js-trend-products-spot",
  productPopup: ".js-trend-product-popup",
  productPopupCloseButton: ".js-trend-products-button-close"
};
const TrendProducts = () => {
  const cssClasses = window.themeCore.utils.cssClasses;
  let sections = [];
  function init(sectionId) {
    sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
    sections.forEach(
      (section) => section.addEventListener("click", clickHandler)
    );
  }
  function clickHandler(event) {
    const spotButton = event.target.closest(selectors.hotSpot);
    const popupButtonClose = event.target.closest(selectors.productPopupCloseButton);
    const section = event.target.closest(selectors.section);
    const spotButtons = [...section.querySelectorAll(selectors.hotSpot)];
    const activeSpotButtons = spotButtons.filter((button) => {
      return button.classList.contains(cssClasses.active);
    });
    if (spotButton) {
      if (spotButton.classList.contains(cssClasses.active) && window.innerWidth <= 991) {
        return;
      }
      const targetPopupID = spotButton.getAttribute("data-target");
      const targetPopup = document.getElementById(targetPopupID);
      if (!targetPopupID || !targetPopup) {
        return;
      }
      if (activeSpotButtons.length) {
        activeSpotButtons.forEach(function(button) {
          if (spotButton === button) {
            return;
          }
          const productPopupID = button.getAttribute("data-target");
          const productPopup = document.getElementById(productPopupID);
          closePopup(productPopup, button);
        });
      }
      spotButton.classList.toggle(cssClasses.active);
      let isExpanded = spotButton.classList.contains(cssClasses.active);
      targetPopup.classList.toggle(cssClasses.active);
      if (isExpanded) {
        spotButton.setAttribute("aria-expanded", "true");
      } else {
        spotButton.setAttribute("aria-expanded", "false");
      }
    }
    if (popupButtonClose) {
      const productPopupID = popupButtonClose.getAttribute("data-target");
      const productPopup = popupButtonClose.closest(selectors.productPopup);
      const currentSpot = document.querySelector(`${selectors.hotSpot}[data-target=${productPopupID}]`);
      if (!productPopupID || !productPopup || !currentSpot) {
        return;
      }
      closePopup(productPopup, currentSpot);
    }
  }
  function closePopup(popup, hotSpot) {
    if (!popup || !hotSpot) {
      return;
    }
    popup.classList.remove(cssClasses.active);
    hotSpot.classList.remove(cssClasses.active);
    hotSpot.setAttribute("aria-expanded", "false");
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.TrendProducts = window.themeCore.TrendProducts || TrendProducts();
  window.themeCore.utils.register(window.themeCore.TrendProducts, "trend-products");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

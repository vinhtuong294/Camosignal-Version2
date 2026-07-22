const selectors = {
  section: ".js-product-features",
  productFeature: ".js-product-feature",
  pointButton: ".js-product-features-point"
};
const attributes = {
  pointButtonIndex: "data-point-index",
  featureIndex: "data-feature-index"
};
const ProductFeatures = () => {
  const on = window.themeCore.utils.on;
  const cssClasses = window.themeCore.utils.cssClasses;
  const classes = {
    visuallyHidden: "visually-hidden",
    ...cssClasses
  };
  let sectionComponents = [];
  async function init(sectionId) {
    const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
    if (sections.length > 0) {
      sections.forEach((section) => {
        sectionComponents.push({
          section,
          productFeatures: [
            ...section.querySelectorAll(selectors.productFeature)
          ],
          pointButtons: [
            ...section.querySelectorAll(selectors.pointButton)
          ]
        });
      });
    }
    setEventListeners();
  }
  function setEventListeners() {
    sectionComponents.forEach(({ pointButtons }) => {
      pointButtons.length && pointButtons.forEach((pointButton) => {
        on("click", pointButton, (event) => pointButtonHandler(event));
      });
    });
  }
  function pointButtonHandler(event) {
    if (!isTargetPointButton(event.target)) {
      return;
    }
    const pointButton = event.target.closest(selectors.pointButton);
    togglePointButton(pointButton);
  }
  function isTargetPointButton(target) {
    return sectionComponents.some(
      ({ pointButtons }) => pointButtons.includes(target.closest(selectors.pointButton))
    );
  }
  function togglePointButton(pointButton) {
    const closestSection = pointButton.closest(selectors.section);
    const currentSection = sectionComponents.find(({ section }) => closestSection === section);
    const pointButtonIndex = getIndex(pointButton, attributes.pointButtonIndex);
    const productFeature = currentSection.productFeatures.find((feature) => getIndex(feature, attributes.featureIndex) === pointButtonIndex);
    removeActiveClasses(currentSection.pointButtons, classes.active);
    currentSection.productFeatures.forEach(
      (element) => element.classList.add(classes.visuallyHidden)
    );
    setCurrentElementActive(pointButton, classes.active);
    productFeature.classList.remove(classes.visuallyHidden);
  }
  function removeActiveClasses(elements, className) {
    elements.forEach(
      (element) => element.classList.remove(className)
    );
  }
  function setCurrentElementActive(element, className) {
    element.classList.add(className);
  }
  function getIndex(element, selector) {
    return +element.getAttribute(selector);
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.ProductFeatures = window.themeCore.ProductFeatures || ProductFeatures();
  window.themeCore.utils.register(window.themeCore.ProductFeatures, "product-features");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

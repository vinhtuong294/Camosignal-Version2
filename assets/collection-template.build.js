const ProductGridControls = (config) => {
  const { section, namespace } = config;
  const selectors = {
    grid: ".js-grid-wrapper",
    gridControls: ".js-product-grid-controls"
  };
  const attributes = {
    gridColDesktop: "data-grid-col-desktop",
    gridColTablet: "data-grid-col-tablet",
    gridColMobile: "data-grid-col-mobile"
  };
  const formToJSON = window.themeCore.utils.formToJSON;
  let grid, gridControlsElements;
  function init() {
    if (!section || !namespace) {
      return;
    }
    grid = section.querySelector(selectors.grid);
    gridControlsElements = section.querySelectorAll(selectors.gridControls);
    if (!grid || !gridControlsElements.length) {
      return;
    }
    gridControlsElements.forEach((gridControlsElement) => initGridControl(gridControlsElement));
  }
  function initGridControl(gridControlsElement) {
    gridControlsElement.addEventListener("change", () => {
      const gridColumnCount = formToJSON(gridControlsElement);
      changeGridColumnSize(gridColumnCount);
    });
  }
  function changeGridColumnSize({ gridColumnCountDesktop, gridColumnCountTablet, gridColumnCountMobile }) {
    grid.setAttribute(attributes.gridColDesktop, gridColumnCountDesktop);
    grid.setAttribute(attributes.gridColTablet, gridColumnCountTablet);
    grid.setAttribute(attributes.gridColMobile, gridColumnCountMobile);
    gridControlsElements.forEach((gridControlsElement) => {
      const gridColumnCountDesktopInput = gridControlsElement.querySelector(`input[name="gridColumnCountDesktop"][value="${gridColumnCountDesktop}"]`);
      const gridColumnCountTabletInput = gridControlsElement.querySelector(`input[name="gridColumnCountTablet"][value="${gridColumnCountTablet}"]`);
      const gridColumnCountMobileInput = gridControlsElement.querySelector(`input[name="gridColumnCountMobile"][value="${gridColumnCountMobile}"]`);
      gridColumnCountDesktopInput.checked = true;
      gridColumnCountTabletInput.checked = true;
      gridColumnCountMobileInput.checked = true;
    });
  }
  return Object.freeze({
    init
  });
};
const CollectionTemplate = () => {
  const selectors = {
    section: ".js-collection"
  };
  let section;
  async function init() {
    section = document.querySelector(selectors.section);
    if (!section) {
      return;
    }
    await initFilters();
    await initGridControls();
  }
  async function initFilters() {
    const ProductFilters = await window.themeCore.utils.getExternalUtil("ProductFilters");
    ProductFilters(section).init();
  }
  async function initGridControls() {
    ProductGridControls({ section, namespace: "collection" }).init();
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.CollectionTemplate = window.themeCore.CollectionTemplate || CollectionTemplate();
  window.themeCore.utils.register(window.themeCore.CollectionTemplate, "collection-template");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

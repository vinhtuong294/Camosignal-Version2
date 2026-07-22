const SearchTemplate = () => {
  const cssClasses = {
    ...window.themeCore.utils.cssClasses,
    animated: "animated",
    barHidden: "bar-hidden"
  };
  const attributes = {
    searchType: "data-search-type"
  };
  const selectors = {
    section: ".js-search",
    tabButton: `[${attributes.searchType}]`,
    tabButtonDataText: ".js-tab-button-data-text",
    tabButtonText: ".js-tab-button-text",
    searchTypeInput: ".js-search-type-input",
    searchBody: ".js-search-body",
    typesWrapper: ".js-search-types-wrapper",
    gridWrapper: ".js-grid-wrapper",
    filtersState: ".js-filters-state"
  };
  async function init() {
    const ProductFilters = await window.themeCore.utils.getExternalUtil(
      "ProductFilters"
    );
    const section = document.querySelector(selectors.section);
    ProductFilters(section).init();
    await initButtons(section);
    window.themeCore.EventBus.listen("search-types:init", () => {
      initButtons(section);
    });
    section.classList.add(cssClasses.animated);
  }
  async function initButtons(section) {
    let url = new URL(window.location.href);
    url.searchParams.set("view", "count");
    const grid = section.querySelector(selectors.gridWrapper);
    const typesWrapper = section.querySelector(selectors.typesWrapper);
    const tabButtons = section.querySelectorAll(selectors.tabButton);
    if (!grid || !typesWrapper || !tabButtons.length) {
      return;
    }
    const searchType = document.querySelector(selectors.searchTypeInput).value;
    if ((searchType == null ? void 0 : searchType.split(",").length) === 1) {
      section.setAttribute("data-type", searchType);
      grid.setAttribute("data-type", searchType);
      tabButtons.forEach((button) => {
        button.classList.toggle(cssClasses.active, button.getAttribute("data-search-type") === searchType);
      });
    }
    const currentButton = [...tabButtons].find((button) => button.classList.contains(cssClasses.active));
    updateButtonPosition(typesWrapper, currentButton);
    for (const tabButton of tabButtons) {
      const type = tabButton.getAttribute(attributes.searchType);
      if (type !== "product") {
        const query = url.searchParams.get("q");
        url = new URL(url.origin + url.pathname);
        url.searchParams.set("view", "count");
        url.searchParams.set("q", query);
      }
      url.searchParams.set("type", type);
      try {
        const res = await fetch(url.toString());
        const data = await res.text();
        const text = window.themeCore.translations.get(`sections.search_template.${type}s`, { count: data });
        const tabButtonDataText = tabButton.querySelector(selectors.tabButtonDataText);
        const tabButtonText = tabButton.querySelector(selectors.tabButtonText);
        tabButtonDataText && (tabButtonDataText.dataset.text = text);
        tabButtonText && (tabButtonText.innerText = text);
        if (type === "product") {
          let hideBar = false;
          let productsCount = parseInt(data);
          let filtersEmpty = true;
          const filtersState = section.querySelector(selectors.filtersState);
          if (filtersState) {
            filtersEmpty = JSON.parse(filtersState.dataset.filtersEmpty);
          }
          if (filtersEmpty && productsCount === 0) {
            hideBar = true;
          }
          section.classList.toggle(cssClasses.barHidden, hideBar);
        }
      } catch (e) {
        console.log(e);
      } finally {
        if (type === "product" && (searchType == null ? void 0 : searchType.split(",").length) !== 1) {
          tabButton.click();
          tabButton.classList.add(cssClasses.active);
          const searchBody = section.querySelector(selectors.searchBody);
          searchBody == null ? void 0 : searchBody.classList.remove(cssClasses.hidden);
        }
        updateButtonPosition(typesWrapper, currentButton);
      }
    }
  }
  function updateButtonPosition(typesWrapper, tabButton) {
    if (!typesWrapper || !tabButton) {
      return;
    }
    const typesWrapperOffset = typesWrapper.offsetLeft + (parseInt(window.getComputedStyle(typesWrapper).paddingLeft) || 0);
    const tabButtonOffset = tabButton.offsetLeft;
    typesWrapper.scrollTo({
      left: tabButtonOffset - typesWrapperOffset
    });
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.SearchTemplate = window.themeCore.SearchTemplate || SearchTemplate();
  window.themeCore.utils.register(window.themeCore.SearchTemplate, "search-template");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

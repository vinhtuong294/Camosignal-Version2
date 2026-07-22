const PredictiveSearch = () => {
  const { debounce, on, off, cssClasses } = window.themeCore.utils;
  const selectors = {
    predictiveSearch: ".js-predictive-search",
    form: ".js-predictive-search-form",
    input: ".js-predictive-search-input",
    resultContainer: ".js-predictive-search-result",
    searchType: "input[name='type']",
    resultWrapper: ".js-predictive-search-result-wrapper",
    tabsButton: ".js-predictive-search-tabs-button",
    preloader: ".js-preloader",
    results: ".js-predictive-search-results",
    footer: ".js-predictive-search-footer",
    tabsWrapper: ".js-predictive-search-tabs-wrapper",
    promoProducts: ".js-predictive-search-promo-products"
  };
  const attributes = {
    disabled: "disabled",
    ariaExpanded: "aria-expanded",
    predictiveSupported: "data-predictive-supported"
  };
  const classes = {
    visuallyHidden: "visually-hidden",
    ...cssClasses
  };
  const CONFIG = {
    rootRoute: window.Shopify.routes.root,
    resourcesLimit: 6,
    resourcesLimitScope: "each"
  };
  const state = {
    cachedResults: {},
    activeTab: null
  };
  const nodes = {};
  function cacheNodes() {
    nodes.predictiveSearch = document.querySelector(selectors.predictiveSearch);
    nodes.form = document.querySelector(selectors.form);
    nodes.tabButtons = [...document.querySelectorAll(selectors.tabsButton)];
    nodes.resultContainer = document.querySelector(selectors.resultContainer);
    nodes.promoProducts = document.querySelector(selectors.promoProducts);
    nodes.footer = document.querySelector(selectors.footer);
  }
  async function handleInput(event) {
    const input = event.target.closest(selectors.input);
    if (!input)
      return;
    const query = input.value.trim();
    if (!query.length)
      return clearResults();
    togglePreloader(true);
    if (state.cachedResults[query]) {
      updateResults(state.cachedResults[query]);
      togglePreloader(false);
      return;
    }
    const responseHTML = await fetchSearchResults(query);
    if (responseHTML) {
      state.cachedResults[query] = responseHTML;
      updateResults(responseHTML);
    }
    togglePreloader(false);
  }
  function clearResults() {
    var _a, _b, _c;
    if (!nodes.resultContainer)
      return;
    nodes.resultContainer.innerHTML = "";
    nodes.resultContainer.classList.add(classes.hidden);
    (_a = nodes.form) == null ? void 0 : _a.classList.remove(classes.active);
    (_b = nodes.promoProducts) == null ? void 0 : _b.classList.remove(classes.hidden);
    (_c = nodes.footer) == null ? void 0 : _c.classList.add(classes.hidden);
    resetTabButtons();
    off("click", nodes.predictiveSearch, setActiveTabCategory);
  }
  function togglePreloader(force) {
    const preloader = nodes.predictiveSearch.querySelector(selectors.preloader);
    if (!preloader)
      return;
    preloader.classList.toggle(classes.active, force);
  }
  function updateResults(responseHTML) {
    var _a, _b, _c, _d, _e, _f;
    if (!nodes.resultContainer)
      return;
    const results = responseHTML.querySelector(selectors.results);
    nodes.resultContainer.innerHTML = "";
    (_a = nodes.promoProducts) == null ? void 0 : _a.classList.add(classes.hidden);
    (_b = nodes.resultContainer) == null ? void 0 : _b.classList.remove(classes.hidden);
    if (!results) {
      (_c = nodes.form) == null ? void 0 : _c.classList.remove(classes.active);
      (_d = nodes.footer) == null ? void 0 : _d.classList.add(classes.hidden);
      setEmptyState();
      return;
    }
    (_e = nodes.form) == null ? void 0 : _e.classList.add(classes.active);
    (_f = nodes.footer) == null ? void 0 : _f.classList.remove(classes.hidden);
    nodes.resultContainer.innerHTML = results.innerHTML;
    const resultWrappers = [...nodes.predictiveSearch.querySelectorAll(selectors.resultWrapper)];
    updateTabsState(resultWrappers);
    on("click", nodes.predictiveSearch, (event) => setActiveTabCategory(event, resultWrappers));
  }
  function resetTabButtons() {
    nodes.tabButtons.forEach((tabButton) => {
      tabButton.classList.remove(classes.active);
      tabButton.setAttribute(attributes.disabled, true);
    });
  }
  function updateTabsState(resultWrappers) {
    let isFirstActiveSet = false;
    let currentActiveButton = nodes.tabButtons.find((tabButton) => isTargetActive(tabButton));
    let currentActiveResultWrapper = null;
    if (currentActiveButton) {
      currentActiveResultWrapper = resultWrappers.find((resultWrapper) => resultWrapper.dataset.id === currentActiveButton.dataset.id);
      if (!currentActiveResultWrapper)
        currentActiveButton = null;
    }
    nodes.tabButtons.forEach((tabButton) => {
      const matchingResult = resultWrappers.find((resultWrapper) => resultWrapper.dataset.id === tabButton.dataset.id);
      if (matchingResult) {
        tabButton.removeAttribute(attributes.disabled);
        if (!isFirstActiveSet && (!currentActiveButton || currentActiveButton === tabButton)) {
          tabButton.classList.add(classes.active);
          currentActiveResultWrapper = matchingResult;
          isFirstActiveSet = true;
        } else {
          tabButton.classList.remove(classes.active);
        }
      } else {
        tabButton.setAttribute(attributes.disabled, true);
        tabButton.classList.remove(classes.active);
      }
    });
    resultWrappers.forEach((resultWrapper) => {
      resultWrapper.classList.toggle(classes.visuallyHidden, resultWrapper !== currentActiveResultWrapper);
    });
  }
  function setActiveTabCategory(event, resultWrappers) {
    const targetTabButton = event.target.closest(selectors.tabsButton);
    if (!targetTabButton)
      return;
    const tabsWrapper = nodes.predictiveSearch.querySelector(selectors.tabsWrapper);
    const tabsOffset = tabsWrapper.offsetLeft + (parseInt(window.getComputedStyle(tabsWrapper).paddingLeft) || 0);
    const newActiveOffset = targetTabButton.offsetLeft;
    tabsWrapper.scrollTo({
      left: newActiveOffset - tabsOffset,
      behavior: "smooth"
    });
    nodes.tabButtons.forEach((button) => {
      button.classList.toggle(classes.active, button === targetTabButton);
      button.setAttribute(attributes.ariaExpanded, button !== targetTabButton);
    });
    resultWrappers.forEach((resultWrapper) => {
      resultWrapper.classList.toggle(classes.visuallyHidden, resultWrapper.dataset.id !== targetTabButton.dataset.id);
    });
  }
  function setEmptyState() {
    var _a, _b, _c;
    resetTabButtons();
    nodes.resultContainer.innerHTML = `
				<div class="h4 predictive-search__result-empty">
					${((_c = (_b = (_a = window.themeCore) == null ? void 0 : _a.objects) == null ? void 0 : _b.settings) == null ? void 0 : _c.predictive_search_no_result) || window.themeCore.translations.get("general.predictive_search.no_results")}
				</div>
			`;
  }
  async function fetchSearchResults(query) {
    var _a;
    try {
      const searchType = (_a = nodes.predictiveSearch.querySelector(selectors.searchType)) == null ? void 0 : _a.value;
      if (!searchType)
        return null;
      const url = `${CONFIG.rootRoute}search/suggest?q=${encodeURIComponent(query)}&resources[type]=${searchType}&resources[limit]=${CONFIG.resourcesLimit}&resources[limit_scope]=${CONFIG.resourcesLimitScope}&section_id=predictive-search`;
      const response = await fetch(url);
      if (response.ok)
        return new DOMParser().parseFromString(await response.text(), "text/html");
      console.error("Failed to fetch search results: HTTP status", response.status);
      return null;
    } catch (error) {
      console.error("Error fetching search results:", error);
      return null;
    }
  }
  function onFormSubmit(event) {
    const targetForm = event.target.closest(selectors.form);
    const search = targetForm.closest(selectors.predictiveSearch);
    if (!targetForm)
      return;
    event.preventDefault();
    const query = targetForm.querySelector(selectors.input).value.trim();
    if (!query.length)
      return;
    const activeTab = nodes.tabButtons.find((tabButton) => isTargetActive(tabButton));
    let type = "";
    if (activeTab) {
      type = `type=${activeTab.getAttribute(activeTab.dataset.id)}&`;
    } else {
      if (search.hasAttribute(attributes.predictiveSupported)) {
        return;
      }
    }
    const url = `${CONFIG.rootRoute}search/?${type}&options%5Bprefix%5D=last&q=${encodeURIComponent(query)}`;
    window.location.replace(url);
  }
  function isTargetActive(target) {
    return target.classList.contains(classes.active);
  }
  function closePopup() {
    if (!isTargetActive(nodes.predictiveSearch))
      return;
    window.themeCore.EventBus.emit("Toggle:searchToggleDrawer:close");
  }
  function init() {
    cacheNodes();
    if (!nodes.predictiveSearch)
      return;
    on("input", nodes.predictiveSearch, debounce(handleInput, 200, false));
    on("reset", nodes.predictiveSearch, clearResults);
    on("submit", nodes.predictiveSearch, onFormSubmit);
    on("change", window.matchMedia("(min-width: 1200px)"), closePopup);
  }
  return Object.freeze({ init });
};
const action = () => {
  window.themeCore.PredictiveSearch = window.themeCore.PredictiveSearch || PredictiveSearch();
  window.themeCore.utils.register(window.themeCore.PredictiveSearch, "predictive-search");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

const Collapse = (container) => {
  const cssClasses = window.themeCore.utils.cssClasses;
  const on = window.themeCore.utils.on;
  const off = window.themeCore.utils.off;
  const removeTrapFocus = window.themeCore.utils.removeTrapFocus;
  const trapFocus = window.themeCore.utils.trapFocus;
  const focusable = window.themeCore.utils.focusable;
  const selectors = {
    item: ".js-collapse-item",
    modal: ".js-collapse-modal",
    content: ".js-collapse-content",
    control: ".js-collapse-control"
  };
  const classes = {
    changeTransition: "change-transition",
    initialTransition: "initial-transition",
    ...cssClasses
  };
  let collapses = [];
  let blocked = false;
  function init() {
    const items = container.querySelectorAll(selectors.item);
    items.forEach((item) => {
      addCollapse(item);
    });
    hideContentTabIndex();
    on("keydown", (event) => onEscEvent(event));
    on("click", document.body, (event) => onDocumentEvent(event));
  }
  function reinit() {
    block(true);
    const items = [...container.querySelectorAll(selectors.item)];
    collapses.slice().forEach((collapse) => {
      if (!items.find((item) => item.id === collapse.id)) {
        removeCollapse(collapse);
      }
    });
    items.forEach((item) => {
      if (!collapses.find((collapse) => item.id === collapse.id)) {
        addCollapse(item);
      }
    });
    hideContentTabIndex();
    block(false);
  }
  function addCollapse(item) {
    const control = item.querySelector(selectors.control);
    const modal = item.querySelector(selectors.modal);
    const content = item.querySelector(selectors.content);
    if (!item || !control || !modal || !content) {
      return;
    }
    const collapse = {
      id: item.id,
      item,
      control,
      modal,
      content,
      isOpen: false,
      timeout: null,
      open: () => openCollapse.call(collapse),
      close: (isTrapFocus) => closeCollapse.call(collapse, isTrapFocus),
      toggle: () => toggleCollapse.call(collapse)
    };
    on("click", control, collapse.toggle);
    collapses.push(collapse);
  }
  function removeCollapse(collapse) {
    if (!collapse) {
      return;
    }
    collapse.close();
    off("click", collapse.control, collapse.toggle);
    const index = collapses.findIndex((currentCollapse) => currentCollapse.id === collapse.id);
    collapses.splice(index, 1);
  }
  function toggleCollapse() {
    if (blocked) {
      return;
    }
    const activeCollapse = collapses.find((collapse) => collapse.isOpen && collapse.item !== this.item);
    if (activeCollapse) {
      this.item.classList.remove(classes.initialTransition);
      this.item.classList.remove(classes.changeTransition);
      this.modal.style.height = `${activeCollapse.modal.offsetHeight}px`;
      activeCollapse.close();
    } else {
      this.item.classList.add(classes.initialTransition);
    }
    this.isOpen ? this.close() : this.open();
  }
  function openCollapse() {
    clearTimeout(this.item.timeout);
    this.item.classList.add(classes.changeTransition);
    this.modal.style.height = `${this.content.offsetHeight}px`;
    this.item.timeout = setTimeout(() => {
      this.modal.style.height = ``;
    }, 500);
    this.isOpen = true;
    focusable(this.content).forEach(
      (element) => element.setAttribute("tabindex", 0)
    );
    trapFocus(this.content);
    this.item.classList.add(classes.active);
    this.control.setAttribute("aria-expanded", true);
  }
  function closeCollapse(isTrapFocus = true) {
    clearTimeout(this.item.timeout);
    this.item.classList.add(classes.changeTransition);
    this.modal.style.height = `${this.content.offsetHeight}px`;
    this.item.timeout = setTimeout(() => {
      this.modal.style.height = 0;
    }, 0);
    focusable(this.content).forEach(
      (element) => element.setAttribute("tabindex", -1)
    );
    this.isOpen = false;
    this.item.classList.remove(classes.active);
    this.control.setAttribute("aria-expanded", false);
    if (isTrapFocus) {
      removeTrapFocus();
      this.control.focus();
    }
  }
  function onEscEvent(event) {
    if (!(event.keyCode === 27)) {
      return;
    }
    closeActiveCollapse();
  }
  function onDocumentEvent(event) {
    const item = event.target.closest(selectors.item);
    if (item || blocked) {
      return;
    }
    closeActiveCollapse();
  }
  function closeActiveCollapse() {
    if (blocked) {
      return;
    }
    const activeCollapse = collapses.find((collapse) => collapse.isOpen);
    if (!activeCollapse) {
      return;
    }
    collapses.forEach((collapse) => {
      clearTimeout(collapse.timeout);
    });
    activeCollapse.item.classList.add(classes.initialTransition);
    activeCollapse.close();
  }
  function hideContentTabIndex() {
    const closedCollapse = collapses.filter((collapse) => !collapse.isOpen);
    closedCollapse.forEach((collapse) => {
      focusable(collapse.content).forEach(
        (element) => element.setAttribute("tabindex", -1)
      );
    });
  }
  function getContainer() {
    return container;
  }
  function block(force) {
    blocked = force;
  }
  return Object.freeze({
    init,
    reinit,
    block,
    removeCollapse,
    addCollapse,
    hideContentTabIndex,
    getContainer
  });
};
const ProductFilters = (section) => {
  const cssClasses = {
    ...window.themeCore.utils.cssClasses,
    filtersHidden: "filters-hidden"
  };
  const Toggle = window.themeCore.utils.Toggle;
  const CHANGEABLE_ELEMENTS_MULTIPLE_SELECTORS = {
    form: ".js-form",
    selectedFiltersWrapper: ".js-selected-filters-wrapper",
    filtersContainer: ".js-filters-container",
    filterItem: ".js-filter-item",
    filterPrice: ".js-filter-price",
    filterSort: ".js-filter-sort"
  };
  const CHANGEABLE_ELEMENTS_ONCE_SELECTORS = {
    emptyTitle: ".js-template-empty-title",
    gridWrapper: ".js-grid-wrapper",
    filterMenuOpenerWrapper: ".js-filter-menu-opener-wrapper",
    filterMenuDrawer: ".js-filter-menu-drawer",
    filterMenuOpener: ".js-filter-menu-opener",
    activeFiltersCounter: ".js-active-filters-counter",
    pagination: ".js-pagination",
    loadMoreButton: ".js-lazy-load",
    infiniteScroll: ".js-infinite-scroll",
    filtersFooter: ".js-filters-footer",
    filterSortExternal: ".js-filter-sort-external",
    filtersState: ".js-filters-state",
    searchTypes: ".js-search-types",
    productCount: ".js-product-count"
  };
  const FILTER_PRICE_SELECTORS = {
    maxInput: ".js-price-input-max",
    minInput: ".js-price-input-min",
    rangeInputs: ".js-range-inputs",
    minRange: ".js-price-range-min",
    maxRange: ".js-price-range-max",
    priceProgress: ".js-price-progress"
  };
  const selectors = {
    elementToScroll: ".js-element-to-scroll",
    paginationLink: ".js-pagination-link",
    priceNumberInput: ".js-price-input",
    priceRangeInput: ".js-price-range",
    removeFilterLink: ".js-remove-filter",
    resetFilters: ".js-reset-filters",
    cssRoot: ":root",
    header: "[data-header-container]",
    drawerPreloader: ".js-preloader",
    pagePreloader: ".js-page-preloader",
    searchTypeActiveButton: "[data-search-type].is-active",
    searchTypeLink: ".js-search-type-link",
    activeFilters: ".js-active-filters",
    sortSelectExternal: ".js-sort-select-external",
    filterList: ".js-filter-list",
    filterItemCounter: ".js-filter-item-counter",
    collapseContainer: ".js-collapse-container",
    accordionContainer: ".js-accordion-container",
    ...CHANGEABLE_ELEMENTS_MULTIPLE_SELECTORS,
    ...CHANGEABLE_ELEMENTS_ONCE_SELECTORS,
    ...FILTER_PRICE_SELECTORS
  };
  const classes = {
    fixed: "is-fixed",
    noEvents: "no-events",
    error: "is-error",
    ...cssClasses
  };
  const FILTER_FORM_KEYS = {
    priceFrom: "filter.v.price.gte",
    priceTo: "filter.v.price.lte"
  };
  const URL_KEYS_TO_SAVE = {
    query: "q",
    type: "type",
    optionsPrefix: "options[prefix]"
  };
  const URL_KEYS = {
    page: "page",
    sort: "sort_by",
    ...URL_KEYS_TO_SAVE
  };
  const cssVariables = {
    rangeMin: "--range-min",
    rangeMax: "--range-max",
    headerHeight: "--header-height-static",
    headerOffsetTop: "--header-offset-top"
  };
  const breakpoints = {
    medium: "(max-width: 1199.98px)"
  };
  const globals = {
    mediumScreen: window.matchMedia(breakpoints.medium),
    openMenuButtonObserver: null,
    infiniteScrollObserver: null,
    cssRoot: document.querySelector(selectors.cssRoot)
  };
  let currentBaseUrl = window.location.href.split("#")[0];
  let drawer;
  let collapses = [];
  let isLoading = false;
  let drawerPreloader = section.querySelector(selectors.drawerPreloader);
  let pagePreloader = document.querySelector(selectors.pagePreloader);
  let currentNodes = getNodes(section, CHANGEABLE_ELEMENTS_MULTIPLE_SELECTORS);
  currentNodes = Object.assign(currentNodes, getNodes(section, CHANGEABLE_ELEMENTS_ONCE_SELECTORS, true));
  function togglePreloader(force) {
    isLoading = force;
    togglePreloaderElement(drawerPreloader, force);
    if (force) {
      const isFiltersDrawerOpen = drawer && (currentNodes == null ? void 0 : currentNodes.filterMenuDrawer.classList.contains(classes.active));
      !isFiltersDrawerOpen && togglePreloaderElement(pagePreloader, true);
    } else {
      togglePreloaderElement(pagePreloader, false);
    }
  }
  function togglePreloaderElement(element, force) {
    element && element.classList.toggle(classes.active, force);
  }
  function getNodes(container, selectors2, once) {
    const nodes = {};
    Object.entries(selectors2).forEach(([elementName, selector]) => {
      const elements = [...container.querySelectorAll(selector)];
      if (!elements.length) {
        nodes[elementName] = null;
        return;
      }
      if (elements.length > 1 || !once) {
        nodes[elementName] = elements;
        return;
      }
      nodes[elementName] = elements[0];
    });
    return nodes;
  }
  function mediumScreenHandler(media) {
    if (!media.matches) {
      drawer.close(currentNodes.filterMenuDrawer);
    }
  }
  function setMenuButtonObserver() {
    let headerHeight = getHeaderHeightWithOffsetTop();
    headerHeight = 0;
    const intersectionOptions = {
      rootMargin: `-${headerHeight}px 0px 0px 0px`
    };
    globals.openMenuButtonObserver = initIntersectionObserver(currentNodes.filterMenuOpenerWrapper, unFixMenuOpener, fixMenuOpener, intersectionOptions);
  }
  function getHeaderHeightWithOffsetTop() {
    const headerHeight = globals.cssRoot.style.getPropertyValue(cssVariables.headerHeight);
    const headerOffsetTop = globals.cssRoot.style.getPropertyValue(cssVariables.headerOffsetTop);
    return parseInt(headerHeight) + parseInt(headerOffsetTop);
  }
  function setInfiniteScrollObserver() {
    globals.infiniteScrollObserver = initIntersectionObserver(
      currentNodes.infiniteScroll,
      () => unobserveAndUpdateTemplate(globals.infiniteScrollObserver, currentNodes.infiniteScroll)
    );
  }
  function initIntersectionObserver(observerNode, intersectCallback, noIntersectCallback, options = {}) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          typeof intersectCallback === "function" && intersectCallback();
        } else {
          typeof noIntersectCallback === "function" && noIntersectCallback();
        }
      });
    }, options);
    observer.observe(observerNode);
    return observer;
  }
  function unFixMenuOpener() {
    if (!currentNodes.filterMenuOpener) {
      return;
    }
    currentNodes.filterMenuOpener.classList.remove(classes.fixed);
    currentNodes.filterMenuOpenerWrapper.style.minHeight = `auto`;
  }
  function fixMenuOpener() {
    if (!currentNodes.filterMenuOpener || isViewPortAboveElement(currentNodes.filterMenuOpenerWrapper)) {
      return;
    }
    currentNodes.filterMenuOpenerWrapper.style.minHeight = `${currentNodes.filterMenuOpenerWrapper.offsetHeight}px`;
    currentNodes.filterMenuOpener.classList.add(classes.fixed);
  }
  function isViewPortAboveElement(opener) {
    const headerHeight = getHeaderHeightWithOffsetTop();
    return opener.offsetTop + opener.offsetHeight >= window.pageYOffset + headerHeight;
  }
  async function externalSelectChangeHandler(event) {
    const sortSelectExternal = event.target.closest(selectors.sortSelectExternal);
    if (!sortSelectExternal) {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set(sortSelectExternal.name, sortSelectExternal.value);
    window.parent === window.top && window.history.pushState({}, null, url);
    scrollToTop();
    await rerenderTemplate(url);
  }
  async function formChangeHandler(event) {
    const form = event.target.closest(selectors.form);
    if (!form || isPriceInputsWithErrors()) {
      return;
    }
    const formData = new FormData(form);
    const formKeys = [...formData.keys()];
    let { minInput, maxInput } = getNodes(form, FILTER_PRICE_SELECTORS);
    if (Array.isArray(minInput)) {
      minInput = minInput[0];
    }
    if (Array.isArray(maxInput)) {
      maxInput = maxInput[0];
    }
    formKeys.forEach((key) => {
      if (key === FILTER_FORM_KEYS.priceFrom || key === FILTER_FORM_KEYS.priceTo) {
        if (key === FILTER_FORM_KEYS.priceFrom && Number(minInput.value) === Number(minInput.min) || key === FILTER_FORM_KEYS.priceTo && Number(maxInput.value) === Number(maxInput.max)) {
          formData.delete(key);
        }
      }
    });
    const url = createFetchingURL(formData);
    const formSort = form.querySelector(selectors.filterSort);
    if (!formSort) {
      const sortSelectExternal = section.querySelector(selectors.sortSelectExternal);
      if (!sortSelectExternal) {
        return;
      }
      url.searchParams.set(sortSelectExternal.name, sortSelectExternal.value);
    }
    window.parent === window.top && window.history.pushState({}, null, url);
    scrollToTop();
    await rerenderTemplate(url);
  }
  function createFetchingURL(formData) {
    const queryString = new URLSearchParams(formData).toString();
    const initialUrl = new URL(window.location.href);
    const url = new URL(`${window.location.origin}${window.location.pathname}?${queryString}`);
    for (const key in URL_KEYS_TO_SAVE) {
      const value = initialUrl.searchParams.get(URL_KEYS_TO_SAVE[key]);
      value && url.searchParams.set(URL_KEYS_TO_SAVE[key], value);
    }
    return url;
  }
  function isPriceInputsWithErrors() {
    if (!currentNodes.filterPrice) {
      return false;
    }
    const priceNumberInputs = [...currentNodes.filterPrice].flatMap((filterPrice) => {
      return [...filterPrice.querySelectorAll(selectors.priceNumberInput)];
    });
    return priceNumberInputs.some((input) => input.classList.contains(classes.error));
  }
  let latestRequestURL = null;

  async function rerenderTemplate(url) {
    const requestURL = getSectionIdRequestURL(url, section.id);
    latestRequestURL = requestURL;
    togglePreloader(true);
    currentNodes.gridWrapper.ariaBusy = "true";
    collapses.length && collapses.forEach((collapse) => collapse.block(true));
    
    const newHTML = await getHTML(requestURL);
    if (latestRequestURL !== requestURL) {
      return;
    }
    
    let newNodes = getNodes(newHTML, CHANGEABLE_ELEMENTS_MULTIPLE_SELECTORS);
    newNodes = Object.assign(newNodes, getNodes(newHTML, CHANGEABLE_ELEMENTS_ONCE_SELECTORS, true));
    setHTML(newNodes);
    currentNodes.gridWrapper.ariaBusy = "false";
    collapses.length && collapses.forEach((collapse) => collapse.block(false));
    window.themeCore.Accordion.setTabIndex(selectors.filterItem + selectors.accordionContainer, "hidden");
    window.themeCore.EventBus.emit("search-types:init");
    togglePreloader(false);
    currentBaseUrl = window.location.href.split("#")[0];
  }
  function getSectionIdRequestURL(url, sectionId = section.id) {
    const requestURL = new URL(url);
    requestURL.searchParams.set("section_id", sectionId);
    return requestURL.toString();
  }
  async function getHTML(url) {
    const response = await fetch(url);
    const resText = await response.text();
    return new DOMParser().parseFromString(resText, "text/html");
  }
  function setHTML(newNodes) {
    if (!newNodes || !Object.keys(newNodes).length) {
      return;
    }
    const {
      selectedFiltersWrapper,
      gridWrapper,
      filterMenuOpener,
      activeFiltersCounter,
      filterPrice,
      pagination,
      loadMoreButton,
      infiniteScroll,
      filtersFooter,
      filterSort,
      filtersState,
      searchTypes,
      productCount
    } = newNodes;
    if (filtersState) {
      section.classList.toggle(classes.filtersHidden, JSON.parse(filtersState.dataset.filtersEmpty));
    }
    currentNodes.gridWrapper.innerHTML = gridWrapper.innerHTML;
    if (gridWrapper.innerHTML.trim() !== '') {
      currentNodes.emptyTitle.classList.add(classes.hidden);
      currentNodes.emptyTitle.ariaHidden = "true";
    } else {
      currentNodes.emptyTitle.classList.remove(classes.hidden);
      currentNodes.emptyTitle.ariaHidden = "false";
    }
    currentNodes.filterItem = [...section.querySelectorAll(CHANGEABLE_ELEMENTS_MULTIPLE_SELECTORS.filterItem)];
    currentNodes.filterPrice = [...section.querySelectorAll(CHANGEABLE_ELEMENTS_MULTIPLE_SELECTORS.filterPrice)];
    if (currentNodes.filtersContainer) {
      [...currentNodes.filtersContainer].forEach((filtersContainer) => {
        const filtersContainerId = filtersContainer.id;
        const currentFilterItems = [...currentNodes.filterItem].filter((filterItem) => filterItem.parentElement && filterItem.parentElement.id === filtersContainerId);
        const newFilterItems = [...newNodes.filterItem].filter((filterItem) => filterItem.parentElement && filterItem.parentElement.id === filtersContainerId);
        currentFilterItems.forEach((currentFilterItem) => {
          if (!newFilterItems.find((newFilterItem) => currentFilterItem.id === newFilterItem.id)) {
            currentFilterItem.remove();
          }
        });
      });
    }
    currentNodes.filterItem = [...section.querySelectorAll(CHANGEABLE_ELEMENTS_MULTIPLE_SELECTORS.filterItem)];
    currentNodes.filterPrice = [...section.querySelectorAll(CHANGEABLE_ELEMENTS_MULTIPLE_SELECTORS.filterPrice)];
    if (newNodes.filtersContainer) {
      [...newNodes.filtersContainer].forEach((filtersContainer) => {
        const filtersContainerId = filtersContainer.id;
        const currentFiltersContainer = [...currentNodes.filtersContainer].find((filtersContainer2) => filtersContainer2.id === filtersContainerId);
        const currentFilterItems = [...currentNodes.filterItem].filter((filterItem) => filterItem.parentElement && filterItem.parentElement.id === filtersContainerId);
        const newFilterItems = [...newNodes.filterItem].filter((filterItem) => filterItem.parentElement && filterItem.parentElement.id === filtersContainerId);
        newFilterItems.forEach((newFilterItem, index) => {
          const currentFilterItem = currentFilterItems.find((currentFilterItem2) => currentFilterItem2.id === newFilterItem.id);
          if (currentFilterItem) {
            const currentFilterList = currentFilterItem.querySelector(selectors.filterList);
            const newFilterList = newFilterItem.querySelector(selectors.filterList);
            if (currentFilterList && newFilterList) {
              currentFilterList.innerHTML = newFilterList.innerHTML;
            }
            const currentFilterItemCounter = currentFilterItem.querySelector(selectors.filterItemCounter);
            const newFilterItemCounter = newFilterItem.querySelector(selectors.filterItemCounter);
            if (currentFilterItemCounter && newFilterItemCounter) {
              currentFilterItemCounter.innerHTML = newFilterItemCounter.innerHTML;
            }
          } else {
            const newFilterItemClone = newFilterItem.cloneNode(true);
            if (!currentFilterItems.length) {
              currentFiltersContainer.appendChild(newFilterItemClone);
            } else if (index === 0) {
              const firstElement = currentFilterItems[0];
              const firstElementId = firstElement.id;
              document.getElementById(firstElementId).before(newFilterItemClone);
            } else {
              const previousElement = newFilterItems[index - 1];
              const previousElementId = previousElement.id;
              document.getElementById(previousElementId).after(newFilterItemClone);
            }
          }
        });
      });
    }
    currentNodes.filterItem = [...section.querySelectorAll(CHANGEABLE_ELEMENTS_MULTIPLE_SELECTORS.filterItem)];
    currentNodes.filterPrice = [...section.querySelectorAll(CHANGEABLE_ELEMENTS_MULTIPLE_SELECTORS.filterPrice)];
    collapses.forEach((collapse) => collapse.reinit());
    window.themeCore.Accordion.init();
    if (currentNodes.filterMenuOpener) {
      currentNodes.filterMenuOpener.dataset.count = filterMenuOpener ? filterMenuOpener.dataset.count : 0;
    }
    replaceNodes({
      activeFiltersCounter,
      filterPrice,
      pagination,
      selectedFiltersWrapper,
      infiniteScroll,
      loadMoreButton,
      filtersFooter,
      filterSort,
      searchTypes,
      productCount
    });
    infiniteScroll && setInfiniteScrollObserver();
    filterPrice && drawPriceRange();
  }
  function drawPriceRange() {
    const { minInput, maxInput, rangeInputs } = getNodes(section, FILTER_PRICE_SELECTORS);
    if (!rangeInputs) {
      return;
    }
    [...rangeInputs].forEach((rangeInputs2, index) => {
      const { thumbOffset } = rangeInputs2.dataset;
      const rangeMinStyle = `calc(${Number(minInput[index].value) / Number(minInput[index].max) * 100}% - ${thumbOffset}px)`;
      const rangeMaxStyle = `calc(${Number(maxInput[index].value) / Number(maxInput[index].max) * 100}% + ${thumbOffset}px)`;
      rangeInputs2.style.setProperty(cssVariables.rangeMin, rangeMinStyle);
      rangeInputs2.style.setProperty(cssVariables.rangeMax, rangeMaxStyle);
    });
  }
  function replaceNodes(newNodes) {
    if (!newNodes || !Object.keys(newNodes).length) {
      return;
    }
    for (const newNodeName in newNodes) {
      if (currentNodes[newNodeName]) {
        const nodesList = Array.isArray(currentNodes[newNodeName]) ? currentNodes[newNodeName] : [currentNodes[newNodeName]];
        const newValues = Array.isArray(newNodes[newNodeName]) ? newNodes[newNodeName] : [newNodes[newNodeName]];
        nodesList.forEach((listEl, index) => {
          const currentValue = newValues[index];
          if (!currentValue) {
            return;
          }
          listEl.classList.remove(...listEl.classList);
          listEl.classList.add(...(currentValue == null ? void 0 : currentValue.classList) || []);
          listEl.innerHTML = (currentValue == null ? void 0 : currentValue.innerHTML) || "";
          if (currentValue) {
            for (const key in currentValue.dataset) {
              listEl.dataset[key] = currentValue.dataset[key];
            }
          }
        });
      }
    }
  }
  async function paginationClickHandler(event) {
    const paginationLink = event.target.closest(selectors.paginationLink);
    if (!paginationLink) {
      return;
    }
    event.preventDefault();
    unFixMenuOpener();
    window.parent === window.top && window.history.pushState({}, null, paginationLink.href);
    scrollToTop();
    await rerenderTemplate(paginationLink.href);
  }
  async function searchTypeClickHandler(event) {
    const searchTypeLink = event.target.closest(selectors.searchTypeLink);
    if (!searchTypeLink) {
      return;
    }
    event.preventDefault();
    window.parent === window.top && window.history.pushState({}, null, searchTypeLink.href);
    await rerenderTemplate(searchTypeLink.href);
  }
  async function popStateHandler() {
    const newBaseUrl = window.location.href.split("#")[0];
    if (newBaseUrl === currentBaseUrl) {
      return;
    }
    currentBaseUrl = newBaseUrl;
    await rerenderTemplate(window.location.href);
  }
  function scrollToTop() {
    const isHeaderSticky = document.querySelector(selectors.header).hasAttribute("data-header-sticky");
    const headerHeight = isHeaderSticky ? getHeaderHeightWithOffsetTop() : 0;
    const elToScroll = section.querySelector(selectors.elementToScroll);
    if (!elToScroll) {
      return;
    }
    const elToScrollRect = elToScroll.getBoundingClientRect();
    const elToScrollTopPosition = elToScrollRect.top - headerHeight;
    if (elToScrollTopPosition >= 0 && elToScrollTopPosition <= window.innerHeight) {
      return;
    }
    let scrollTo = elToScroll.offsetTop - headerHeight;
    window.scrollTo(0, scrollTo);
  }
  function priceInputHandler(event) {
    const currentInput = event.target.closest(selectors.priceNumberInput);
    if (!currentInput) {
      return;
    }
    let { minInput, maxInput, minRange, maxRange } = getNodes(section, FILTER_PRICE_SELECTORS);
    [...minInput].forEach((minInput2, index) => {
      const isInputsValuesValid = maxInput[index].value && minInput2.value && Number(maxInput[index].value) <= Number(maxInput[index].max) && Number(minInput2.value) >= Number(minInput2.min);
      if (Number(maxInput[index].value) - Number(minInput2.value) >= 0 && isInputsValuesValid) {
        currentInput.dataset.type === "min" ? minRange.value = minInput2.value : maxRange[index].value = maxInput[index].value;
        removePriceErrorState(minInput2, maxInput[index]);
        return;
      }
      currentInput.dataset.type === "min" ? minInput2.classList.add(classes.error) : maxInput[index].classList.add(classes.error);
    });
    drawPriceRange();
  }
  function priceRangeInputHandler(event) {
    const currentRange = event.target.closest(selectors.priceRangeInput);
    if (!currentRange) {
      return;
    }
    const { minInput, maxInput, minRange, maxRange } = getNodes(section, FILTER_PRICE_SELECTORS);
    [...minInput].forEach((minInput2, index) => {
      if (maxRange[index].value - minRange[index].value < 0) {
        currentRange.dataset.type === "min" ? minRange[index].value = minInput2.value : maxRange[index].value = maxInput[index].value;
      }
      minInput2.value = minRange[index].value;
      maxInput[index].value = maxRange[index].value;
      removePriceErrorState(minInput2, maxInput[index]);
    });
    drawPriceRange();
  }
  function removePriceErrorState(...inputs) {
    inputs.forEach((input) => input.classList.remove(classes.error));
  }
  async function removeFilterClickHandler(event) {
    const removeFilterLink = event.target.closest(selectors.removeFilterLink);
    if (!removeFilterLink) {
      return;
    }
    event.preventDefault();
    window.parent === window.top && window.history.pushState({}, null, removeFilterLink.href);
    scrollToTop();
    await rerenderTemplate(removeFilterLink.href);
  }
  async function resetFiltersClickHandler(event) {
    const resetFilters = event.target.closest(selectors.resetFilters);
    if (!resetFilters) {
      return;
    }
    event.preventDefault();
    let targetHref = resetFilters.href || window.location.href;
    const url = new URL(targetHref, window.location.origin);
    
    const urlKeys = [...url.searchParams.keys()];
    urlKeys.filter((key) => ![URL_KEYS.sort, URL_KEYS.query, URL_KEYS.type].includes(key)).forEach((key) => url.searchParams.delete(key));
    
    if (!resetFilters.href && url.pathname.startsWith('/collections/')) {
      url.pathname = '/collections/all';
    }
    
    window.parent === window.top && window.history.pushState({}, null, url);
    scrollToTop();
    await rerenderTemplate(url);
    const activeFilters = section.querySelectorAll(selectors.activeFilters);
    activeFilters.forEach((filter) => filter.remove());
  }
  async function unobserveAndUpdateTemplate(observer, infiniteScroll) {
    observer.unobserve(infiniteScroll);
    const link = window.location.origin + infiniteScroll.dataset.nextUrl;
    await updateTemplate(link);
  }
  async function updateTemplate(url) {
    togglePreloader(true);
    collapses.length && collapses.forEach((collapse) => collapse.block(true));
    const requestURL = getSectionIdRequestURL(url, section.id);
    const newHTML = await getHTML(requestURL);
    const { gridWrapper, infiniteScroll, loadMoreButton } = getNodes(newHTML, CHANGEABLE_ELEMENTS_ONCE_SELECTORS, true);
    currentNodes.gridWrapper.insertAdjacentHTML("beforeend", gridWrapper.innerHTML);
    replaceNodes({ infiniteScroll, loadMoreButton });
    infiniteScroll && setInfiniteScrollObserver();
    window.themeCore.EventBus.emit("search-types:init");
    collapses.length && collapses.forEach((collapse) => collapse.block(false));
    togglePreloader(false);
  }
  async function loadMoreClickHandler(event) {
    const loadMoreButton = event.target.closest(selectors.loadMoreButton);
    if (!loadMoreButton) {
      return;
    }
    loadMoreButton.classList.add(classes.noEvents);
    const nextUrl = window.location.origin + loadMoreButton.dataset.nextUrl;
    await updateTemplate(nextUrl);
  }
  function setListeners(nodes) {
    const { filterMenuOpenerWrapper, filterMenuDrawer, loadMoreButton, infiniteScroll, filterPrice, pagination, form, filterSortExternal, filtersContainer } = nodes;
    if (filterMenuOpenerWrapper && filterMenuDrawer) {
      drawer = Toggle({
        toggleSelector: filterMenuDrawer.dataset.toggleTarget,
        closeAccordionsOnHide: false,
        toggleTabIndex: false
      });
      drawer.init();
      setMenuButtonObserver();
      globals.mediumScreen.addEventListener("change", mediumScreenHandler);
      window.themeCore.EventBus.listen(`Toggle:${filterMenuDrawer.dataset.toggleTarget}:close`, () => {
        togglePreloaderElement(pagePreloader, isLoading);
      });
    }
    if (filtersContainer) {
      [...filtersContainer].forEach((filterContainer) => {
        if (filterContainer.matches(selectors.collapseContainer)) {
          const collapse = Collapse(section);
          collapse.init();
          collapses.push(collapse);
        }
      });
    }
    filtersContainer && section.addEventListener("click", removeFilterClickHandler);
    filterPrice && drawPriceRange();
    section.addEventListener("input", priceInputHandler);
    section.addEventListener("input", priceRangeInputHandler);
    if (pagination || form) {
      window.addEventListener("popstate", popStateHandler);
    }
    filterSortExternal && section.addEventListener("change", externalSelectChangeHandler);
    form && section.addEventListener("change", formChangeHandler);
    filtersContainer && section.addEventListener("click", resetFiltersClickHandler);
    (pagination || !!section.querySelector(selectors.paginationLink)) && section.addEventListener("click", paginationClickHandler);
    !!section.querySelector(selectors.searchTypeLink) && section.addEventListener("click", searchTypeClickHandler);
    loadMoreButton && section.addEventListener("click", loadMoreClickHandler);
    infiniteScroll && setInfiniteScrollObserver();
  }
  function init() {
    if (!section || !Object.keys(currentNodes).length) {
      return;
    }
    setListeners(currentNodes);
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.utils.registerExternalUtil(ProductFilters, "ProductFilters");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true }, { once: true });
}

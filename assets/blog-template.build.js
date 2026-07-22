const BlogTemplate = () => {
  const { cssClasses, bodyScrollLock } = window.themeCore.utils;
  const selectors = {
    section: ".js-blog",
    grid: ".js-blog-grid",
    filtersWrapper: ".js-blog-filters",
    filterLink: ".js-blog-filter-link",
    resetLink: ".js-blog-filter-reset",
    pagination: ".js-blog-pagination",
    paginationLink: ".js-pagination-link",
    infiniteScroll: ".js-blog-infinite-scroll",
    lazyLoad: ".js-blog-lazy-load",
    pageLoader: ".js-page-preloader"
  };
  const classes = {
    noEvents: "no-events",
    ...cssClasses
  };
  const attributes = {
    tabindex: "tabindex"
  };
  const section = document.querySelector(selectors.section);
  const pageLoader = document.querySelector(selectors.pageLoader);
  let infinityScrollObserver = null;
  const nodes = {
    grid: section.querySelector(selectors.grid),
    filtersWrapper: section.querySelector(selectors.filtersWrapper),
    filterLinks: [...section.querySelectorAll(selectors.filterLink)],
    resetLink: section.querySelector(selectors.resetLink),
    pagination: section.querySelector(selectors.pagination),
    lazyLoad: section.querySelector(selectors.lazyLoad),
    infiniteScroll: section.querySelector(selectors.infiniteScroll)
  };
  async function paginationClickHandler(event) {
    const paginationLink = event.target.closest(selectors.paginationLink);
    if (!paginationLink) {
      return;
    }
    event.preventDefault();
    window.scrollTo(0, 0);
    await rerenderTemplate(paginationLink.href);
    window.history.pushState({}, null, paginationLink.href);
  }
  async function filterClickHandler(event) {
    const [filterLink, resetLink] = [
      event.target.closest(selectors.filterLink),
      event.target.closest(selectors.resetLink)
    ];
    if (!filterLink && !resetLink)
      return;
    event.preventDefault();
    const lastActiveFilterLink = nodes.filterLinks.find(
      (filterLink2) => filterLink2.classList.contains(classes.active)
    ) || nodes.resetLink;
    if (filterLink) {
      lastActiveFilterLink.classList.remove(classes.active);
      filterLink.classList.add(classes.active);
      scrollToActiveFilter(filterLink);
      await rerenderTemplate(filterLink.href);
      window.history.pushState({}, null, filterLink.href);
      handleFiltersTabindex(lastActiveFilterLink, filterLink);
      return;
    }
    if (resetLink && !resetLink.classList.contains(classes.active)) {
      lastActiveFilterLink.classList.remove(classes.active);
      scrollToActiveFilter(resetLink);
      resetLink.classList.add(classes.active);
      handleFiltersTabindex(lastActiveFilterLink, resetLink);
      await rerenderTemplate(resetLink.href);
      window.history.pushState({}, null, resetLink.href);
    }
  }
  function handleFiltersTabindex(lastActiveFilterLink, filterLink) {
    lastActiveFilterLink && lastActiveFilterLink.setAttribute(attributes.tabindex, "0");
    filterLink && filterLink.setAttribute(attributes.tabindex, "-1");
  }
  function scrollToActiveFilter(element) {
    return element.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }
  async function loadMoreClickHandler(event) {
    const lazyLoad = event.target.closest(selectors.lazyLoad);
    if (!lazyLoad)
      return;
    lazyLoad.classList.add(classes.noEvents);
    const url = window.location.origin + lazyLoad.dataset.nextUrl;
    await updateTemplate(url);
  }
  async function rerenderTemplate(url) {
    nodes.grid.ariaBusy = "true";
    pageLoader.classList.add(classes.active);
    bodyScrollLock.disableBodyScroll(document.body);
    const requestURL = getSectionIdURL(url, section.id);
    const newNodes = await fetchNodes(requestURL);
    setHTML(newNodes);
    pageLoader.classList.remove(classes.active);
    bodyScrollLock.enableBodyScroll(document.body);
    nodes.grid.ariaBusy = "false";
  }
  function getSectionIdURL(link, sectionId = section.id) {
    const url = new URL(link);
    url.searchParams.set("section_id", sectionId);
    return url.toString();
  }
  async function fetchNodes(url) {
    const response = await fetch(url);
    const responseText = await response.text();
    const responseHTML = new DOMParser().parseFromString(
      responseText,
      "text/html"
    );
    return {
      grid: responseHTML.querySelector(selectors.grid),
      pagination: responseHTML.querySelector(selectors.pagination),
      infiniteScroll: responseHTML.querySelector(selectors.infiniteScroll),
      lazyLoad: responseHTML.querySelector(selectors.lazyLoad)
    };
  }
  function setHTML({ grid, pagination, infiniteScroll, lazyLoad }) {
    if (!grid && !pagination && !infiniteScroll && !lazyLoad)
      return;
    nodes.grid.innerHTML = grid.innerHTML;
    unobserve(nodes.infiniteScroll);
    replaceNodes({ pagination, infiniteScroll, lazyLoad });
    infiniteScroll && initIntersectionObserver(infiniteScroll);
  }
  function replaceNodes(newNodes) {
    if (!newNodes || !Object.keys(newNodes).length) {
      return;
    }
    for (const newNodeName in newNodes) {
      if (nodes[newNodeName]) {
        nodes[newNodeName].replaceWith(newNodes[newNodeName]);
        nodes[newNodeName] = newNodes[newNodeName];
      }
    }
  }
  async function popStateEvent() {
    const url = window.location.href;
    const lastActiveFilterLink = nodes.filterLinks.find(
      (filterLink) => filterLink.classList.contains(classes.active)
    ) || nodes.resetLink;
    const newActiveFilterLink = nodes.filterLinks.find(
      (filterLink) => url.includes(filterLink.href)
    ) || nodes.resetLink;
    lastActiveFilterLink !== newActiveFilterLink && lastActiveFilterLink.classList.remove(classes.active);
    await rerenderTemplate(url);
    lastActiveFilterLink !== newActiveFilterLink && newActiveFilterLink.classList.add(classes.active);
  }
  function initIntersectionObserver(infiniteScroll) {
    infinityScrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting)
            await unobserveAndUpdateTemplate(infiniteScroll);
        });
      },
      { threshold: 0.25 }
    );
    infinityScrollObserver.observe(infiniteScroll);
  }
  function unobserve(infiniteScroll) {
    infiniteScroll && infinityScrollObserver && infinityScrollObserver.unobserve(infiniteScroll);
  }
  async function unobserveAndUpdateTemplate(infiniteScroll) {
    unobserve(infiniteScroll);
    const url = window.location.origin + infiniteScroll.dataset.nextUrl;
    await updateTemplate(url);
  }
  async function updateTemplate(nextPageLink) {
    pageLoader.classList.add(classes.active);
    bodyScrollLock.disableBodyScroll(document.body);
    const url = getSectionIdURL(nextPageLink, section.id);
    const { grid, infiniteScroll, lazyLoad } = await fetchNodes(url);
    nodes.grid.insertAdjacentHTML("beforeend", grid.innerHTML);
    unobserve(nodes.infiniteScroll);
    replaceNodes({ infiniteScroll, lazyLoad });
    infiniteScroll && initIntersectionObserver(infiniteScroll);
    pageLoader.classList.remove(classes.active);
    bodyScrollLock.enableBodyScroll(document.body);
  }
  function init() {
    nodes.pagination && section.addEventListener("click", paginationClickHandler);
    nodes.filtersWrapper && section.addEventListener("click", filterClickHandler);
    nodes.lazyLoad && section.addEventListener("click", loadMoreClickHandler);
    if (nodes.filtersWrapper || nodes.pagination) {
      window.addEventListener("popstate", popStateEvent);
    }
    nodes.infiniteScroll && initIntersectionObserver(nodes.infiniteScroll);
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.BlogTemplate = window.themeCore.BlogTemplate || BlogTemplate();
  window.themeCore.utils.register(window.themeCore.BlogTemplate, "blog-template");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  if (window.themeCore && window.themeCore.loaded) {
    action();
  } else {
    document.addEventListener("theme:all:loaded", action, { once: true });
  }
}

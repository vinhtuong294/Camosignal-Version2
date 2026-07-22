const selectors = {
  section: ".js-stores-locator",
  tab: ".js-stores-locator-item",
  tabButton: ".js-stores-locator__item-button",
  tabActive: ".js-stores-locator-item.is-active",
  tabText: ".js-stores-locator-item-text",
  bodyBox: ".js-stores-locator-box-map",
  body: ".js-stores-locator-map-wrapper",
  bodyActive: ".js-stores-locator-map-wrapper.is-active",
  accordionBody: ".js-stores-locator-accordion-body"
};
const StoresLocator = () => {
  const classes = {
    ...window.themeCore.utils.cssClasses,
    bodyLink: "stores-locator__map-wrapper--link"
  };
  const focusable = window.themeCore.utils.focusable;
  let isProcessing = false;
  function init(sectionId) {
    const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
    sections.forEach((section) => {
      const tabItem = section.querySelector(`${selectors.tab}`);
      const accordionBody = tabItem.querySelector(selectors.accordionBody);
      if (accordionBody) {
        accordionBody.style.height = accordionBody.scrollHeight + "px";
      }
      section.addEventListener("click", handlerTabs);
      setTabIndexForAccordionLinks(section);
      handlerFocusTab(section);
    });
  }
  function handlerTabs(event) {
    if (isProcessing) {
      return;
    }
    const section = event.target.closest(selectors.section);
    const tab = event.target.closest(selectors.tab);
    if (!section || !tab) {
      return;
    }
    if (tab.classList.contains(classes.active)) {
      return;
    }
    const tabs = [...section.querySelectorAll(selectors.tab)];
    const tabsBody = [...section.querySelectorAll(selectors.body)];
    const index = tab.dataset.index;
    tabsBody.forEach((body) => {
      body.classList.toggle(classes.active, body.dataset.index === index);
    });
    tabs.forEach((tab2) => {
      tab2.classList.toggle(classes.active, tab2.dataset.index === index);
      hideContent(tab2);
    });
  }
  function hideContent(element) {
    if (!element) {
      return;
    }
    const accordionBody = element.querySelector(selectors.accordionBody);
    const animationDelay = 500;
    if (accordionBody) {
      const accordionBodyHeight = accordionBody.scrollHeight;
      if (element.classList.contains(classes.active)) {
        isProcessing = true;
        accordionBody.style.height = accordionBodyHeight + "px";
        element.setAttribute("aria-expanded", true);
        toggleTabIndex(accordionBody, "0");
        setTimeout(() => {
          accordionBody.removeAttribute("style");
          isProcessing = false;
        }, animationDelay);
      } else {
        accordionBody.style.height = accordionBodyHeight + "px";
        element.setAttribute("aria-expanded", false);
        toggleTabIndex(accordionBody, "-1");
        requestAnimationFrame(() => {
          accordionBody.style.height = 0;
        });
      }
    }
  }
  function toggleTabIndex(target, tabIndexValue) {
    if (!target)
      return;
    return focusable(target).forEach((element) => element.setAttribute("tabindex", tabIndexValue));
  }
  function setTabIndexForAccordionLinks(section) {
    const tabs = [...section.querySelectorAll(selectors.tab)];
    tabs.forEach((tab) => {
      const accordionBody = tab.querySelector(selectors.accordionBody);
      toggleTabIndex(accordionBody, tab.classList.contains(classes.active) ? "0" : "-1");
    });
  }
  function handlerFocusTab(section) {
    section.addEventListener("keydown", (e) => {
      var _a;
      const tabActive = section.querySelector(selectors.tabActive);
      const tabNext = (_a = tabActive.nextElementSibling) == null ? void 0 : _a.querySelector(selectors.tabButton);
      const focusable2 = [...tabActive.querySelectorAll("a, button")];
      const lastFocusable = focusable2[focusable2.length - 1];
      const tabBodyBox = section.querySelector(selectors.bodyBox);
      const tabBodyActiveDesktop = tabBodyBox.querySelector(selectors.bodyActive);
      const activeElement = document.activeElement;
      const isTabBodyActiveLink = tabBodyActiveDesktop.classList.contains(classes.active) && tabBodyActiveDesktop.classList.contains(classes.bodyLink);
      if (getComputedStyle(tabBodyBox).getPropertyValue("display") === "none") {
        return;
      }
      if (e.key === "Tab") {
        if (!e.shiftKey) {
          if (activeElement === lastFocusable && isTabBodyActiveLink) {
            e.preventDefault();
            tabBodyActiveDesktop.focus();
          } else if (activeElement === tabBodyActiveDesktop && tabNext) {
            e.preventDefault();
            tabNext.focus();
          }
        } else {
          if (activeElement === tabNext && isTabBodyActiveLink) {
            e.preventDefault();
            tabBodyActiveDesktop.focus();
          } else if (activeElement === tabBodyActiveDesktop) {
            e.preventDefault();
            lastFocusable.focus();
          }
        }
      }
    });
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.StoresLocator = window.themeCore.StoresLocator || StoresLocator();
  window.themeCore.utils.register(window.themeCore.StoresLocator, "stores-locator");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

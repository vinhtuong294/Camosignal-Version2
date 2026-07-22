const headerMegaMenu = (config) => {
  const {
    extendDefaults,
    overlay,
    on,
    removeTrapFocus,
    trapFocus,
    focusable,
    isElement,
    cssClasses,
    bodyScrollLock,
    isIosDevice
  } = window.themeCore.utils;
  const defaults = {
    containerId: "",
    overlayPlacement: document.body,
    header: null
  };
  const settings = extendDefaults(defaults, config);
  const selectors = {
    drawer: ".js-multi-drawer",
    drawerToggle: ".js-multi-drawer-toggle",
    drawerContent: ".js-multi-drawer-content",
    drawerTogglePrimary: `[data-multi-drawer-toggle=${settings.containerId}]`,
    drawerImage: ".js-multi-drawer-image"
  };
  const classes = {
    scrollLockIgnore: "js-scroll-lock-ignore",
    locked: "locked",
    ...cssClasses
  };
  const attributes = {
    drawerLevel: "data-drawer-level",
    ariaExpanded: "aria-expanded"
  };
  const mediaQuery = "(min-width: 1200px)";
  const mediaQueryList = window.matchMedia(mediaQuery);
  let container, drawers, drawerToggles, drawerTogglesPrimary, drawerContents, drawerOverlay, primarySelectedToggle, intervalId, isProcessing = false;
  function init() {
    container = document.getElementById(settings.containerId);
    if (!container)
      return;
    drawers = [...container.querySelectorAll(selectors.drawer)];
    if (!drawers.length)
      return;
    drawers = drawers.sort((a, b) => {
      const levelA = parseInt(a.getAttribute(attributes.drawerLevel));
      const levelB = parseInt(b.getAttribute(attributes.drawerLevel));
      return levelA - levelB;
    });
    drawerTogglesPrimary = [...document.querySelectorAll(selectors.drawerTogglePrimary)];
    drawerToggles = [...container.querySelectorAll(selectors.drawerToggle), ...drawerTogglesPrimary];
    drawerContents = [...container.querySelectorAll(selectors.drawerContent)];
    initOverlay();
    setEventListeners();
    setEventBusListeners();
  }
  function setEventListeners() {
    drawerToggles.forEach((drawerToggle) => {
      on("click", drawerToggle, async (event) => {
        event.preventDefault();
        await processToggleDrawer(drawerToggle);
      });
    });
    on("keydown", (event) => onEscEvent(event));
    on("change", mediaQueryList, async (event) => {
      if (!event.matches)
        await processHideDrawers(1);
    });
    document.addEventListener("HeaderMegaMenu:hide", async () => {
      await hideDrawersHandle(null);
    });
  }
  function onEscEvent(event) {
    if (!isKeyPressIsEsc(event))
      return;
    window.themeCore.EventBus.emit(`EscEvent:on:${settings.containerId}`);
  }
  function isKeyPressIsEsc(event) {
    return event.keyCode === 27;
  }
  function setEventBusListeners() {
    window.themeCore.EventBus.listen([`Overlay:${settings.containerId}:close`], async () => {
      const isActiveDrawers = drawers.some((drawer) => isActive(drawer));
      isActiveDrawers && await hideDrawersHandle(null);
    });
    window.themeCore.EventBus.listen(["Toggle:open"], async () => {
      const isActiveDrawers = drawers.some((drawer) => isActive(drawer));
      isActiveDrawers && await hideDrawersHandle(true, true);
    });
    window.themeCore.EventBus.listen(`EscEvent:on:${settings.containerId}`, async () => {
      const activeDrawers = getActiveDrawers();
      if (!activeDrawers.length)
        return;
      const drawerLevel = parseInt(activeDrawers.reverse()[0].dataset.drawerLevel);
      await processHideDrawers(drawerLevel);
    });
  }
  async function hideDrawersHandle(target, remove = false) {
    if (isProcessing) {
      intervalId = setInterval(async () => {
        if (!isProcessing) {
          clearInterval(intervalId);
          await hideDrawers(1, target, remove);
        }
      }, 100);
    } else {
      await hideDrawers(1, target, remove);
    }
  }
  function initOverlay() {
    drawerOverlay = overlay({
      namespace: settings.containerId,
      overlayPlacement: settings.overlayPlacement
    });
  }
  async function processToggleDrawer(drawerToggle) {
    if (isProcessing)
      return;
    isProcessing = true;
    await toggleDrawer(drawerToggle);
    isProcessing = false;
  }
  async function processHideDrawers(level) {
    if (isProcessing)
      return;
    isProcessing = true;
    await hideDrawers(level, null);
    isProcessing = false;
  }
  async function toggleDrawer(drawerToggle) {
    const drawerLevel = parseInt(drawerToggle.dataset.drawerLevel);
    if (isActive(drawerToggle)) {
      await hideDrawers(drawerLevel, null);
      removeActiveToggles(drawerLevel);
    } else {
      await showDrawer(drawerLevel, drawerToggle);
    }
  }
  function removeActiveToggles(level) {
    const activeToggles = getActiveToggleByLevel(level);
    activeToggles.forEach((activeToggle) => {
      activeToggle.classList.remove(classes.active);
      toggleAriaExpanded(activeToggle, false);
    });
  }
  function setActiveToggle(drawerToggle) {
    const drawerLevel = parseInt(drawerToggle.dataset.drawerLevel);
    removeActiveToggles(drawerLevel);
    if (drawerLevel === 1) {
      primarySelectedToggle = drawerToggle;
      const toggles = getToggleByLevel(drawerLevel);
      toggles.forEach((toggle) => {
        toggle.classList.add(classes.active);
        toggleAriaExpanded(toggle, true);
      });
    } else {
      drawerToggle.classList.add(classes.active);
      toggleAriaExpanded(drawerToggle, true);
    }
  }
  function isActive(target) {
    return target.classList.contains(classes.active);
  }
  async function hideDrawers(level, target, remove = false) {
    const activeDrawers = getActiveDrawers();
    const drawersToClose = activeDrawers.filter((drawer) => {
      return parseInt(drawer.dataset.drawerLevel) >= level;
    }).reverse();
    if (!drawersToClose.length)
      return;
    remove && toggleDrawersRemoving(activeDrawers, true);
    for (let i = 0; i <= drawersToClose.length - 1; i++) {
      await hideDrawer(parseInt(drawersToClose[i].dataset.drawerLevel), target);
    }
    remove && toggleDrawersRemoving(activeDrawers, false);
  }
  async function showDrawer(level, drawerToggle) {
    var _a;
    await hideDrawers(level + 1, null);
    const drawer = getDrawerByLevel(level);
    const drawerContentAttribute = (_a = drawerToggle.dataset) == null ? void 0 : _a.drawerContent;
    let drawerContent = drawerContents.find((item) => item.dataset.drawerContent === drawerContentAttribute);
    setActiveToggle(drawerToggle);
    drawerContentAttribute && showList(level, drawerContentAttribute);
    const isDrawerActive = drawer.classList.contains(classes.active);
    drawer.classList.add(classes.active);
    drawerContent && bodyScrollLock.disableBodyScroll(drawerContent, {
      allowTouchMove: (el) => {
        while (el && el !== document.body) {
          if (el.classList.contains(classes.scrollLockIgnore))
            return true;
          el = el.parentElement;
        }
      }
    });
    if (level === 1) {
      window.themeCore.isMegaMenuOpened = true;
      isIosDevice() && document.body.classList.add(classes.locked);
      document.body.classList.add("scroll-padding-0");
      drawerOverlay.open();
    } else {
      const multiDrawerImages = [...drawer.querySelectorAll(selectors.drawerImage)];
      multiDrawerImages.filter((image) => image.hasAttribute("loading")).forEach((image) => image.removeAttribute("loading"));
    }
    if (isDrawerActive) {
      focusTarget(drawerContent);
    } else {
      await new Promise((resolve) => {
        setTimeout(() => {
          focusTarget(drawerContent);
          resolve();
        }, 500);
      });
    }
  }
  async function hideDrawer(level, target) {
    const drawer = getDrawerByLevel(level);
    const toggle = getActiveToggleByLevel(level)[0];
    const drawerContent = drawerContents.find((item) => {
      var _a;
      return item.dataset.drawerContent === ((_a = toggle.dataset) == null ? void 0 : _a.drawerContent);
    });
    drawer.classList.remove(classes.active);
    removeActiveToggles(level);
    bodyScrollLock.enableBodyScroll(drawerContent);
    await new Promise((resolve) => {
      setTimeout(() => {
        if (level === 1) {
          drawerOverlay.close();
          isIosDevice() && document.body.classList.remove(classes.locked);
          if (!target) {
            document.body.style.overflow = null;
            setTimeout(() => {
              var _a, _b;
              document.body.classList.remove("scroll-padding-0");
              !((_a = settings.header) == null ? void 0 : _a.matches(":hover")) && ((_b = settings.header) == null ? void 0 : _b.classList.remove(cssClasses.hover));
            }, 400);
          }
          removeFocusTarget();
          setTimeout(function() {
            window.themeCore.EventBus.emit("HeaderMegaMenu:closed");
            window.themeCore.isMegaMenuOpened = false;
          }, 400);
        } else {
          const drawer2 = getDrawerByLevel(level - 1);
          focusTarget(drawer2, toggle);
        }
        resolve();
      }, 400);
    });
  }
  function showList(drawerLevel, listId) {
    const activeList = getActiveListByLevel(drawerLevel);
    activeList && activeList.classList.remove(classes.active);
    const drawerContent = drawerContents.find((drawerContent2) => drawerContent2.dataset.drawerContent === listId);
    drawerContent.classList.add(classes.active);
  }
  function getActiveDrawers() {
    return drawers.filter((drawer) => drawer.classList.contains(classes.active));
  }
  function getActiveToggleByLevel(level) {
    return drawerToggles.filter((drawerToggle) => {
      return parseInt(drawerToggle.dataset.drawerLevel) === level && drawerToggle.classList.contains(classes.active);
    });
  }
  function getToggleByLevel(level) {
    return drawerToggles.filter((drawerToggle) => parseInt(drawerToggle.dataset.drawerLevel) === level);
  }
  function getActiveListByLevel(level) {
    return drawerContents.find((drawerContent) => {
      return parseInt(drawerContent.dataset.drawerLevel) === level && drawerContent.classList.contains(classes.active);
    });
  }
  function getDrawerByLevel(level) {
    return drawers.find((drawer) => parseInt(drawer.dataset.drawerLevel) === level);
  }
  function toggleAriaExpanded(toggler, flag) {
    toggler.setAttribute(attributes.ariaExpanded, flag);
  }
  function focusTarget(target, elementToFocus) {
    if (!target)
      return;
    elementToFocus = elementToFocus || focusable(target)[0];
    trapFocus(target, { elementToFocus });
  }
  function removeFocusTarget() {
    if (isElement(primarySelectedToggle))
      window.setTimeout(() => primarySelectedToggle.focus(), 0);
    removeTrapFocus();
  }
  function toggleDrawersRemoving(drawers2, force) {
    drawers2.forEach((drawer) => {
      drawer.classList.toggle(classes.removing, force);
    });
  }
  return Object.freeze({
    init
  });
};
const Header = () => {
  const {
    Toggle,
    cssClasses,
    isElement,
    on,
    focusable,
    removeTrapFocus,
    trapFocus,
    bind,
    debounce,
    bodyScrollLock,
    isIosDevice
  } = window.themeCore.utils;
  const binder = bind(document.documentElement, {
    className: "esc-bind"
  });
  const selectors = {
    announcementBar: ".js-announcement-bar",
    header: {
      headerWrapper: ".header-section",
      headerInner: ".js-header",
      headerDrawerToggler: ".js-header-drawer-toggler",
      burgerMultiDrawer: ".js-multi-drawer",
      drawerMenu: "#headerDrawerMenu",
      headerMobileMenu: ".js-mobile-header-menu",
      headerMobileMainMenu: ".js-mobile-header-main-menu",
      headerMobileMainToggler: ".js-mobile-header-main-toggler",
      headerMobileMenuToggler: ".js-mobile-header-menu-toggler",
      headerMobileMenuImage: ".js-mobile-header-menu-image",
      headerDropdownToggler: ".js-header-dropdown-menu-toggler",
      headerDropdownNestedToggler: ".js-header-dropdown-menu-nested-toggler",
      headerDropdownMenuWrapper: ".js-header-dropdown-menu-wrapper",
      headerDropdownMenu: ".js-header-dropdown-menu",
      headerDropdownNestedMenu: ".js-header-dropdown-menu-nested",
      headerCartItemCount: ".js-header-cart-item-count",
      headerCartItemCountWrapper: ".js-header-cart-item-count-wrapper",
      headerSearchToggler: ".js-header-search-toggler",
      headerCartToggler: ".js-header-cart-toggler",
      headerMenuItemNested: ".js-header-menu-item-nested"
    },
    predictiveSearch: {
      predictiveSearchPopup: ".js-predictive-search",
      predictiveSearchInput: ".js-predictive-search-input"
    },
    localization: {
      localizationForm: ".js-localization-form",
      localizationButton: ".js-disclosure-button",
      localizationPanel: ".js-disclosure-list",
      localizationLink: ".js-disclosure-link"
    },
    cartDrawer: ".js-cart-drawer"
  };
  const classes = {
    headerTopPosition: "header-section--top-position",
    headerTransparent: "header-section--transparent",
    headerTransparentMobile: "header-section--transparent-mobile",
    headerMenuItemActive: "header-menu__item--active",
    locked: "locked",
    ...cssClasses
  };
  const attributes = {
    drawerToggle: "data-js-toggle",
    itemCount: "data-cart-count",
    hideOnScrollDown: "data-hide-on-scroll-down",
    headerTransparent: "data-header-transparent",
    headerTransparentMobile: "data-header-transparent-mobile",
    ariaExpanded: "aria-expanded",
    hidden: "hidden",
    tabIndex: "tabindex",
    dropdownNestedWrapper: "data-target-nested-wrapper",
    menuType: "data-menu-type"
  };
  const cssVariables = {
    headerHeight: "--header-height",
    headerHeightStatic: "--header-height-static",
    headerOffsetBottom: "--header-offset-bottom",
    headerOffsetTop: "--header-offset-top",
    headerOffsetTopStatic: "--header-offset-top-static",
    pageHeight: "--page-height",
    announcementBarHeight: "--announcement-bar-height"
  };
  let cssRoot = null, announcementBar = null, header = null, headerInner = null, headerCartItemCount = null, openMenuType = null, headerCartItemCountWrapper = null, headerDrawerTogglers = [], burgerMultiDrawers = [], drawerMenu = null, headerMobileMenus = [], headerMobileMainMenu = null, headerMobileMainToggler = null, headerMobileMenuTogglers = [], headerDropdownTogglers = [], headerDropdownNestedTogglers = [], headerDropdownMenusWrapper = [], headerDropdownMenus = [], headerDropdownNestedMenus = [], previouslySelectedElement = {}, headerHeight = 0, headerHeightStatic = 0, headerOffsetTop = 0, isHideOnScrollDown = false, isHeaderTransparent = false, lastScrollPosition = 0, isHeaderHidden = false, openProcessing = false, headerCartToggler = null, cartDrawer = null, pendingSearchDrawer = false, pendingCartDrawer = false, headerSearchTogglers = [], predictiveSearchPopup = null, searchToggle = null, isCartOpened = false, isMobileMenuOpened = false, isSearchOpened = false;
  const mediaQuery = "(min-width: 1200px)";
  const mediaQueryList = window.matchMedia(mediaQuery);
  function init() {
    cssRoot = document.querySelector(":root");
    header = document.querySelector(selectors.header.headerWrapper);
    headerInner = document.querySelector(selectors.header.headerInner);
    announcementBar = document.querySelector(selectors.announcementBar);
    predictiveSearchPopup = document.querySelector(selectors.predictiveSearch.predictiveSearchPopup);
    cartDrawer = document.querySelector(selectors.cartDrawer);
    if (!header || !headerInner)
      return;
    const isHeaderTransparentMobile = headerInner.hasAttribute(attributes.headerTransparentMobile);
    lastScrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
    headerCartItemCount = header.querySelectorAll(selectors.header.headerCartItemCount);
    headerCartItemCountWrapper = header.querySelectorAll(selectors.header.headerCartItemCountWrapper);
    isHideOnScrollDown = headerInner.hasAttribute(attributes.hideOnScrollDown);
    isHeaderTransparent = headerInner.hasAttribute(attributes.headerTransparent);
    openMenuType = headerInner.dataset.openMenuType;
    if (isHeaderTransparent) {
      header.classList.add(classes.headerTransparent, classes.headerTopPosition);
      if (isHeaderTransparentMobile) {
        header.classList.add(classes.headerTransparentMobile);
      }
    }
    headerDrawerTogglers = [...header.querySelectorAll(selectors.header.headerDrawerToggler)];
    drawerMenu = header.querySelector(selectors.header.drawerMenu);
    burgerMultiDrawers = [...header.querySelectorAll(selectors.header.burgerMultiDrawer)];
    headerMobileMenus = [...header.querySelectorAll(selectors.header.headerMobileMenu)];
    headerMobileMainMenu = header.querySelector(selectors.header.headerMobileMainMenu);
    headerMobileMainToggler = header.querySelector(selectors.header.headerMobileMainToggler);
    headerMobileMenuTogglers = [...header.querySelectorAll(selectors.header.headerMobileMenuToggler)];
    headerDropdownTogglers = [...header.querySelectorAll(selectors.header.headerDropdownToggler)];
    headerDropdownNestedTogglers = [...header.querySelectorAll(selectors.header.headerDropdownNestedToggler)];
    headerDropdownMenusWrapper = [...header.querySelectorAll(selectors.header.headerDropdownMenuWrapper)];
    headerDropdownMenus = [...header.querySelectorAll(selectors.header.headerDropdownMenu)];
    headerDropdownNestedMenus = [...header.querySelectorAll(selectors.header.headerDropdownNestedMenu)];
    headerSearchTogglers = [...header.querySelectorAll(selectors.header.headerSearchToggler)];
    headerCartToggler = header.querySelector(selectors.header.headerCartToggler);
    initDrawers();
    initMegaMenu();
    setEventListeners();
    setEventBusListeners();
    headerTopPositionHandler();
  }
  function initMegaMenu() {
    headerMegaMenu({
      containerId: "HeaderMegaMenu",
      overlayPlacement: header,
      header
    }).init();
  }
  function setEventListeners() {
    const debounceHeaderVariables = debounce(updateHeaderVariablesAfterAnimation, 450, false);
    on("scroll", () => {
      headerTopPositionHandler();
      hideOnScrollHeaderHandler();
      updateHeaderVariables();
      if (getActiveElements(headerDropdownMenus).length) {
        updateHeaderVariablesAfterAnimation();
      } else {
        debounceHeaderVariables();
      }
    });
    on("resize", () => {
      headerTopPositionHandler();
      updateHeaderVariables();
      updateHeaderVariablesAfterAnimation();
    });
    if (isHeaderTransparent) {
      on("mouseover", header, () => {
        if (header.classList.contains(classes.hover))
          return;
        header.classList.add(classes.hover);
        updateHeaderVariables();
        updateHeaderVariablesAfterAnimation();
      });
      on("mouseleave", header, () => {
        if (!header.classList.contains(classes.hover) || getActiveElements(burgerMultiDrawers).length || getActiveElements(headerDropdownMenus).length || hasActiveLocalizationPanel() || predictiveSearchPopup && isTargetActive(predictiveSearchPopup) || cartDrawer && isTargetActive(cartDrawer))
          return;
        header.classList.remove(classes.hover);
        updateHeaderVariables();
        updateHeaderVariablesAfterAnimation();
      });
      on("focusin", header, () => {
        if (header.classList.contains(classes.hover))
          return;
        header.classList.add(classes.hover);
        updateHeaderVariables();
        updateHeaderVariablesAfterAnimation();
      });
      on("focusout", header, (e) => {
        if (headerInner.contains(e.relatedTarget) || header.matches(":hover") || !header.classList.contains(classes.hover) || getActiveElements(burgerMultiDrawers).length || getActiveElements(headerDropdownMenus).length || hasActiveLocalizationPanel() || predictiveSearchPopup && isTargetActive(predictiveSearchPopup) || cartDrawer && isTargetActive(cartDrawer))
          return;
        header.classList.remove(classes.hover);
        updateHeaderVariables();
        updateHeaderVariablesAfterAnimation();
      });
    }
    if (drawerMenu) {
      on("change", mediaQueryList, (event) => {
        if (event.matches) {
          isTargetActive(drawerMenu) && window.themeCore.EventBus.emit("Toggle:headerToggleMenuDrawer:close");
        } else {
          getActiveElements(headerDropdownMenus).length && closeAllMenus(getActiveElements(headerDropdownMenus));
          getActiveElements(headerDropdownNestedMenus).length && closeAllMenus(getActiveElements(headerDropdownNestedMenus));
        }
      });
    }
    if (headerDropdownTogglers.length) {
      headerDropdownTogglers.forEach((toggler) => {
        const target = document.getElementById(toggler.dataset.target);
        on(openMenuType, toggler, (event) => {
          updateHeaderVariables();
          updateHeaderVariablesAfterAnimation();
          closeAllMenus(getActiveElements(headerDropdownNestedMenus));
          closeAllMenus(headerDropdownMenus.filter((menu) => menu !== target));
          if (openMenuType === "mouseenter") {
            headerDropdownMenusWrapper.filter((menuWrapper) => menuWrapper.dataset.targetNestedWrapper !== toggler.dataset.target).forEach((menuWrapper) => removeActiveClass(menuWrapper));
            const headerDropdownMenuWrapper = header.querySelector(`[${attributes.dropdownNestedWrapper}="${toggler.dataset.target}"]`);
            headerDropdownMenuWrapper && addActiveClass(headerDropdownMenuWrapper);
            openToggleTarget(target);
          } else {
            handleToggleEvent(event, target, false, toggler);
          }
        });
        if (openMenuType === "mouseenter") {
          on("click", toggler, (event) => {
            if (toggler.matches(":not(:focus-visible)")) {
              return;
            }
            closeAllMenus(headerDropdownMenus.filter((menu) => menu !== target));
            handleToggleEvent(event, target, false, toggler);
          });
        }
      });
      on("click", document, (event) => {
        if (!event.target.closest(selectors.header.headerDropdownMenu) && !event.target.closest(selectors.header.headerDropdownNestedMenu) && getActiveElements(headerDropdownMenus).length) {
          if (openMenuType === "mouseenter" && event.target.matches(":not(:focus-visible)")) {
            return;
          }
          closeAllMenus(getActiveElements(headerDropdownMenus));
        }
      });
    }
    if (headerDropdownNestedTogglers.length) {
      headerDropdownNestedTogglers.forEach((toggler) => {
        const target = document.getElementById(toggler.dataset.target);
        on("click", toggler, (event) => {
          if (openMenuType === "mouseenter" && toggler.matches(":not(:focus-visible)")) {
            return;
          }
          closeAllMenus(headerDropdownNestedMenus.filter((menu) => menu !== target));
          handleToggleEvent(event, target, false, toggler);
          setTimeout(() => {
            const menuItemNested = toggler.closest(selectors.header.headerMenuItemNested);
            if (menuItemNested) {
              menuItemNested.classList.toggle(classes.headerMenuItemActive, isTargetActive(target));
            }
          }, 0);
        });
      });
      on("click", document, (event) => {
        if (!event.target.closest(selectors.header.headerDropdownNestedMenu) && getActiveElements(headerDropdownNestedMenus).length) {
          if (openMenuType === "mouseenter" && event.target.matches(":not(:focus-visible)")) {
            return;
          }
          closeAllMenus(getActiveElements(headerDropdownNestedMenus));
        }
      });
      if (openMenuType === "mouseenter") {
        headerDropdownNestedTogglers.forEach((toggler) => {
          const target = document.getElementById(toggler.dataset.target);
          const menuItemNested = toggler.closest(selectors.header.headerMenuItemNested);
          if (!target || !menuItemNested)
            return;
          on("mouseenter", menuItemNested, () => {
            closeAllMenus(headerDropdownNestedMenus.filter((menu) => menu !== target), false, 0);
            openToggleTarget(target);
            menuItemNested.classList.add(classes.headerMenuItemActive);
          });
          const mouseleaveHandler = () => {
            setTimeout(() => {
              if (!menuItemNested.matches(":hover") && !target.matches(":hover") && isTargetActive(target)) {
                closeAllMenus([target], false, 0);
              }
            }, 200);
          };
          on("mouseleave", menuItemNested, mouseleaveHandler);
          on("mouseleave", target, mouseleaveHandler);
        });
      }
    }
    if (headerMobileMenuTogglers.length) {
      headerMobileMenuTogglers.forEach((toggler) => {
        const target = document.getElementById(toggler.dataset.target);
        on("click", toggler, (event) => {
          if (openProcessing) {
            return;
          }
          let isNested = false;
          let targetMenu = document.getElementById(event.target.closest(selectors.header.headerMobileMenuToggler).dataset.target);
          if (isTargetActive(targetMenu)) {
            isNested = true;
          }
          handleToggleEvent(event, target, true, 700, true, false);
          if (isNested) {
            let nextTarget;
            if (targetMenu.dataset.menuType === "deep-nested") {
              drawerMenu.classList.remove(classes.grandChildActive);
              nextTarget = targetMenu.closest(`[${attributes.menuType}="nested"]`);
            } else if (targetMenu.dataset.menuType === "nested") {
              drawerMenu.classList.remove(classes.childActive);
              nextTarget = targetMenu.closest(`[${attributes.menuType}="main"]`);
            }
            if (nextTarget) {
              focusTarget(nextTarget);
            }
            if (!binder.isSet()) {
              binder.set();
            }
          } else {
            if (targetMenu.dataset.menuType === "deep-nested") {
              const previousMenu = targetMenu.closest(`[${attributes.menuType}="nested"]`);
              drawerMenu.classList.add(classes.grandChildActive);
              previousMenu.scrollTo({
                top: 0,
                behavior: "smooth"
              });
            } else if (targetMenu.dataset.menuType === "nested") {
              const targetMenuImages = [...targetMenu.querySelectorAll(selectors.header.headerMobileMenuImage)];
              drawerMenu.classList.add(classes.childActive);
              targetMenuImages.filter((image) => image.hasAttribute("loading")).forEach((image) => image.removeAttribute("loading"));
              headerMobileMainMenu.scrollTo({
                top: 0,
                behavior: "smooth"
              });
            }
          }
        });
      });
    }
    if (openMenuType === "mouseenter") {
      headerDropdownTogglers.forEach((toggler) => {
        const target = header.querySelector(`[${attributes.dropdownNestedWrapper}="${toggler.dataset.target}"]`);
        const mouseleaveHandler = () => {
          setTimeout(() => {
            if (!toggler.matches(":hover") && !target.matches(":hover") && isTargetActive(target)) {
              const targetNestedMenus = getActiveElements(headerDropdownNestedMenus);
              const targetMenus = getActiveElements(headerDropdownMenus);
              [...targetNestedMenus, ...targetMenus].forEach((menu) => {
                menu.scrollTo({
                  top: 0
                });
              });
              closeAllMenus(targetNestedMenus);
              closeAllMenus(targetMenus);
            }
            if (isHeaderTransparent && !header.matches(":hover"))
              header.classList.remove(classes.hover);
          }, 400);
        };
        on("mouseleave", toggler, mouseleaveHandler);
        on("mouseleave", target, mouseleaveHandler);
      });
    }
    on("click", document, () => {
      if (hasActiveLocalizationPanel()) {
        closeLocalizationSelector();
      }
    });
    on("click", document, async (event) => {
      const targetSearchToggler = event.target.closest(selectors.header.headerSearchToggler);
      if (!targetSearchToggler)
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pendingSearchDrawer = true;
      if (getActiveElements(burgerMultiDrawers).length) {
        document.dispatchEvent(new CustomEvent("HeaderMegaMenu:hide"));
        window.themeCore.EventBus.listen("HeaderMegaMenu:closed", () => {
          pendingSearchDrawer && setTimeout(() => {
            openSearchDrawer(targetSearchToggler);
          }, 100);
        });
      } else {
        openSearchDrawer(targetSearchToggler);
      }
    }, true);
    headerCartToggler && on("click", headerCartToggler, async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      pendingCartDrawer = true;
      if (getActiveElements(burgerMultiDrawers).length) {
        document.dispatchEvent(new CustomEvent("HeaderMegaMenu:hide"));
        window.themeCore.EventBus.listen("HeaderMegaMenu:closed", () => {
          pendingCartDrawer && setTimeout(() => {
            openCartDrawer();
          }, 100);
        });
      } else {
        openCartDrawer();
      }
    }, true);
  }
  function openCartDrawer() {
    window.themeCore.EventBus.emit("cart:drawer:CartDrawer:open");
    isIosDevice() && document.body.classList.add(classes.locked);
    isCartOpened = true;
    pendingCartDrawer = false;
  }
  function openSearchDrawer(toggler) {
    const targetDrawer = document.getElementById(toggler.dataset.target);
    if (!targetDrawer)
      return;
    searchToggle.open(targetDrawer);
    addActiveClass(toggler);
    isIosDevice() && document.body.classList.add(classes.locked);
    isSearchOpened = true;
    pendingSearchDrawer = false;
  }
  function setEventBusListeners() {
    window.themeCore.EventBus.listen(["EscEvent:on", "Overlay:headerToggleMenuDrawer:close", "Toggle:headerToggleMenuDrawer:close"], () => {
      removeActiveClass(headerMobileMainToggler);
      if (getActiveElements(headerMobileMenus).length) {
        closeAllMenus(getActiveElements(headerMobileMenus), true, 0);
        drawerMenu.classList.remove(classes.childActive, classes.grandChildActive);
      }
      headerMobileMainMenu.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      if (getActiveElements(headerDropdownNestedMenus).length) {
        setTimeout(() => {
          closeAllMenus(getActiveElements(headerDropdownNestedMenus), true, 0);
          setTimeout(() => {
            trapFocus(getActiveElements(headerDropdownMenus)[0]);
            if (!binder.isSet()) {
              binder.set();
            }
          }, 500);
        }, 0);
      }
      if (getActiveElements(headerDropdownMenus).length && !getActiveElements(headerDropdownNestedMenus).length) {
        const focusElement = headerInner.querySelector(`[data-target="${getActiveElements(headerDropdownMenus)[0].id}"]`);
        closeAllMenus(getActiveElements(headerDropdownMenus), true, 0);
        setTimeout(() => {
          if (focusElement !== previouslySelectedElement)
            focusElement.focus();
        }, 500);
      }
      bodyScrollLock.clearAllBodyScrollLocks();
      isIosDevice() && document.body.classList.remove(classes.locked);
      setTimeout(() => isMobileMenuOpened = false, 450);
    });
    window.themeCore.EventBus.listen(["EscEvent:on", "Overlay:searchToggleDrawer:close", "Toggle:searchToggleDrawer:close"], () => {
      const activeSearchToggler = headerSearchTogglers.find((toggler) => toggler.classList.contains(classes.active));
      removeActiveClass(activeSearchToggler);
      isIosDevice() && document.body.classList.remove(classes.locked);
      setTimeout(() => isSearchOpened = false, 450);
      isHeaderTransparent && setTimeout(() => {
        !header.matches(":hover") && header.classList.remove(classes.hover);
      }, 450);
    });
    window.themeCore.EventBus.listen(["EscEvent:on", "Overlay:CartDrawer:close", "Toggle:CartDrawer:close"], () => {
      isIosDevice() && document.body.classList.remove(classes.locked);
      bodyScrollLock.clearAllBodyScrollLocks();
      setTimeout(() => isCartOpened = false, 450);
      isHeaderTransparent && setTimeout(() => {
        !header.matches(":hover") && header.classList.remove(classes.hover);
      }, 450);
    });
    window.themeCore.EventBus.listen("Toggle:headerToggleMenuDrawer:open", () => {
      addActiveClass(headerMobileMainToggler);
      isIosDevice() && document.body.classList.add(classes.locked);
      isMobileMenuOpened = true;
    });
    window.themeCore.EventBus.listen(["cart:updated", "header:update-item-count"], (e) => {
      updateItemCount(e);
    });
    window.themeCore.EventBus.listen("announcement-bar:changed", () => {
      headerTopPositionHandler();
    });
    on("click", setActiveSearchToggler);
  }
  function setActiveSearchToggler(event) {
    const targetSearchToggler = event.target.closest(selectors.header.headerSearchToggler);
    if (!targetSearchToggler)
      return;
    addActiveClass(targetSearchToggler);
  }
  function updateHeaderVariables() {
    if (isHeaderHidden) {
      headerHeight = 0;
      changeCssVariable(cssVariables.headerHeight, `${headerHeight}px`);
      changeCssVariable(cssVariables.pageHeight, `${window.innerHeight}px`);
      return;
    }
    const updatedHeaderHeight = getHeaderHeight();
    if (updatedHeaderHeight !== headerHeight) {
      headerHeight = updatedHeaderHeight;
      headerHeightStatic = headerHeight;
      changeCssVariable(cssVariables.headerHeight, `${headerHeight}px`);
    }
    changeCssVariable(cssVariables.pageHeight, `${window.innerHeight}px`);
    changeCssVariable(cssVariables.headerHeightStatic, `${headerHeightStatic}px`);
    changeCssVariable(cssVariables.announcementBarHeight, `${getAnnouncementBarHeight()}px`);
  }
  function updateHeaderVariablesAfterAnimation() {
    setTimeout(() => {
      if (isHeaderHidden) {
        headerOffsetTop = 0;
        changeCssVariable(cssVariables.headerOffsetTop, `${headerOffsetTop}px`);
        changeCssVariable(cssVariables.headerOffsetBottom, "0px");
        return;
      }
      headerOffsetTop = getHeaderOffsetTop();
      if (headerOffsetTop > 0) {
        changeCssVariable(cssVariables.headerOffsetTop, ` ${Math.max(headerOffsetTop, 0)}px`);
      }
      changeCssVariable(cssVariables.headerOffsetBottom, `${getHeaderOffsetBottom()}px`);
    }, 0);
  }
  function updateItemCount(event) {
    if (!event.hasOwnProperty("item_count")) {
      return;
    }
    headerCartItemCountWrapper.forEach((itemCountWrapper) => {
      itemCountWrapper.setAttribute(attributes.itemCount, event.item_count);
    });
    headerCartItemCount.forEach((itemCount) => {
      if (event.item_count > 99) {
        itemCount.innerHTML = "99+";
      } else {
        itemCount.innerHTML = event.item_count;
      }
    });
  }
  function changeCssVariable(variable, value) {
    requestAnimationFrame(() => {
      cssRoot.style.setProperty(variable, value);
    });
  }
  function getHeaderHeight() {
    const headerRect = header.getBoundingClientRect();
    if (isHeaderTransparent && headerRect.height <= 0) {
      return headerInner.getBoundingClientRect().height;
    }
    return headerRect.height;
  }
  function getAnnouncementBarHeight() {
    if (window.Shopify.designMode) {
      announcementBar = document.querySelector(selectors.announcementBar);
    }
    if (!announcementBar) {
      return 0;
    }
    return announcementBar.getBoundingClientRect().height;
  }
  function getHeaderOffsetTop() {
    const headerRect = header.getBoundingClientRect();
    const offsetTop = isHeaderTransparent && headerRect.height <= 0 ? headerInner.getBoundingClientRect().top : headerRect.top;
    return offsetTop > 0 ? offsetTop : 0;
  }
  function getHeaderOffsetBottom() {
    const headerRect = header.getBoundingClientRect();
    const offsetBottom = isHeaderTransparent && headerRect.height <= 0 ? headerInner.getBoundingClientRect().bottom : headerRect.bottom;
    return offsetBottom > 0 ? offsetBottom : 0;
  }
  function initDrawers() {
    headerDrawerTogglers.forEach((drawerToggler) => {
      const toggle = drawerToggler.getAttribute(attributes.drawerToggle);
      if (toggle === "searchToggleDrawer") {
        const input = document.querySelector(selectors.predictiveSearch.predictiveSearchInput);
        searchToggle = Toggle({
          toggleSelector: toggle,
          toggleTabIndex: true,
          elementToFocus: input
        });
        searchToggle.init();
        return;
      }
      Toggle({
        toggleSelector: toggle,
        toggleTabIndex: true,
        overlayPlacement: header
      }).init();
    });
  }
  function isTargetActive(target) {
    return target.classList.contains(classes.active);
  }
  function handleToggleEvent(event, target, bodyScroll, timeout, isTrapFocus, isRemoveTrapFocus) {
    event.preventDefault();
    if (timeout === void 0) {
      timeout = 200;
    }
    openProcessing = true;
    if (isTrapFocus === void 0) {
      isTrapFocus = true;
    }
    if (isRemoveTrapFocus === void 0) {
      isRemoveTrapFocus = true;
    }
    toggleActive(target, bodyScroll, timeout, isTrapFocus, isRemoveTrapFocus);
    setTimeout(() => openProcessing = false, timeout);
  }
  function toggleActive(target, bodyScroll, timeout, isTrapFocus, isRemoveTrapFocus) {
    return isTargetActive(target) ? closeToggleTarget(target, !bodyScroll, timeout, isRemoveTrapFocus) : openToggleTarget(target, bodyScroll, isTrapFocus);
  }
  function openToggleTarget(target, bodyScroll, isTrapFocus) {
    const scrollbarWidth = window.innerWidth - document.body.clientWidth;
    const togglers = [...document.querySelectorAll(`[data-target="${target.id}"]`)];
    togglers.forEach((toggler) => {
      toggleAriaExpanded(toggler, true);
      addActiveClass(toggler);
    });
    setTimeout(() => addActiveClass(target), 0);
    if (bodyScroll) {
      bodyScrollLock.disableBodyScroll(target);
      headerInner.style.paddingRight = scrollbarWidth + "px";
    }
    if (isTrapFocus) {
      setTimeout(() => {
        focusTarget(target);
      }, 300);
    }
    if (!binder.isSet()) {
      binder.set();
    }
  }
  function closeToggleTarget(target, bodyScroll, timeout, isRemoveTrapFocus) {
    if (!target || !isTargetActive(target)) {
      return;
    }
    target.classList.remove(classes.active);
    let togglers = [...document.querySelectorAll(`[data-target="${target.id}"]`)];
    togglers.forEach((toggler) => {
      toggleAriaExpanded(toggler, false);
      removeActiveClass(toggler);
      const linkNested = toggler.closest(".js-header-menu-item-nested");
      linkNested == null ? void 0 : linkNested.classList.remove("header-menu__item--active");
    });
    if (bodyScroll) {
      bodyScrollLock.enableBodyScroll(target);
      headerInner.style.paddingRight = "0px";
    }
    if (isRemoveTrapFocus) {
      setTimeout(() => {
        removeFocusTarget();
      }, 500);
    }
    binder.remove();
  }
  function addActiveClass(target) {
    target == null ? void 0 : target.classList.add(classes.active);
  }
  function removeActiveClass(target) {
    target == null ? void 0 : target.classList.remove(classes.active);
  }
  function toggleAriaExpanded(toggler, flag) {
    toggler.setAttribute(attributes.ariaExpanded, flag);
  }
  function focusTarget(target) {
    if (!target) {
      return;
    }
    previouslySelectedElement = document.activeElement;
    const focusableElements = focusable(target);
    if (focusableElements.length) {
      window.setTimeout(() => trapFocus(target, { elementToFocus: focusableElements[0] }), 0);
      return;
    }
    trapFocus(target);
  }
  function removeFocusTarget() {
    if (isElement(previouslySelectedElement)) {
      window.setTimeout(() => previouslySelectedElement.focus(), 0);
    }
    removeTrapFocus();
  }
  function closeAllMenus(list, isRemoveTrapFocus, timeout) {
    if (hasActiveLocalizationPanel()) {
      closeLocalizationSelector();
    }
    if (timeout === void 0) {
      timeout = 200;
    }
    if (isRemoveTrapFocus === void 0) {
      isRemoveTrapFocus = true;
    }
    list.forEach((menu) => {
      closeToggleTarget(menu, true, timeout, isRemoveTrapFocus);
    });
  }
  function getActiveElements(list) {
    return list.filter((item) => isTargetActive(item));
  }
  function headerTopPositionHandler() {
    if (!isHeaderTransparent)
      return;
    const topValue = document.body.style.top || window.scrollY;
    const condition = Math.abs(parseInt(topValue)) <= 0;
    if (condition && !header.classList.contains(classes.headerTopPosition)) {
      header.classList.add(classes.headerTopPosition);
    } else if (!condition && header.classList.contains(classes.headerTopPosition)) {
      header.classList.remove(classes.headerTopPosition);
    }
  }
  function hideOnScrollHeaderHandler() {
    if (!isHideOnScrollDown)
      return;
    const currentScrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
    const condition = currentScrollPosition > 0 && lastScrollPosition <= currentScrollPosition;
    const isAboveTheFold = getHeaderHeight() + getAnnouncementBarHeight() < currentScrollPosition;
    if (condition && getComputedStyle(document.body).overflow !== "hidden" && (!header.matches(":hover") || !mediaQueryList.matches) && isAboveTheFold && !isCartOpened && !isSearchOpened && !isMobileMenuOpened && !window.themeCore.isMegaMenuOpened) {
      header.classList.add(classes.collapsed);
      isHeaderHidden = true;
      window.themeCore.EventBus.emit("Toggle:headerToggleMenuDrawer:close");
    } else if (!condition) {
      header.classList.remove(classes.collapsed);
      isHeaderHidden = false;
    }
    lastScrollPosition = currentScrollPosition;
    if (hasActiveLocalizationPanel()) {
      closeLocalizationSelector();
    }
  }
  function closeLocalizationSelector() {
    const localizationForms = [...document.querySelectorAll(selectors.localization.localizationForm)];
    localizationForms.forEach((form) => {
      const links = form.querySelectorAll(selectors.localization.localizationLink);
      const button = form.querySelector(selectors.localization.localizationButton);
      const panel = form.querySelector(selectors.localization.localizationPanel);
      panel.setAttribute(attributes.hidden, "true");
      button.setAttribute(attributes.ariaExpanded, "false");
      links.forEach((link) => link.setAttribute("tabindex", -1));
    });
    isHeaderTransparent && setTimeout(() => {
      !header.matches(":hover") && header.classList.remove(classes.hover);
    }, 400);
  }
  function hasActiveLocalizationPanel() {
    const localizationForms = [...document.querySelectorAll(selectors.localization.localizationForm)];
    let active = false;
    localizationForms.forEach((form) => {
      let panel = form.querySelector(selectors.localization.localizationPanel);
      if (!panel.hasAttribute(attributes.hidden)) {
        active = true;
      }
    });
    return active;
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.Header = window.themeCore.Header || Header();
  window.themeCore.utils.register(window.themeCore.Header, "header");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

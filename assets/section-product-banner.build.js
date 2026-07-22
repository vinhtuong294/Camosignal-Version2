const ProductBanner = () => {
  const { Swiper, cssClasses, Pagination, on, off, focusable } = window.themeCore.utils;
  const classes = {
    headerTopCollapsed: "header-section--top-collapsed",
    headerTransparent: "header-section--transparent",
    ...cssClasses
  };
  const selectors = {
    sectionWrapper: ".js-product-banner-wrapper",
    headerWrapper: ".header-section",
    header: ".js-header",
    section: ".js-product-banner",
    sliderMedia: ".js-product-banner-slider-media",
    sliderContent: ".js-product-banner-slider-content",
    sliderMediaPagination: ".js-product-banner-slider-media-pagination",
    productCardsWrapper: ".js-product-banner-products-wrapper",
    productCard: ".js-product-banner-product-card",
    sliderContentWithProducts: ".js-product-banner-slider-content-with-products",
    sliderContentWithProductsPagination: ".js-product-banner-slider-content-with-products-pagination",
    paginationBullet: ".swiper-pagination-bullet"
  };
  const attributes = {
    hideOnScrollDown: "data-hide-on-scroll-down"
  };
  const sectionComponents = [];
  const headerWrapper = document.querySelector(selectors.headerWrapper);
  const header = headerWrapper == null ? void 0 : headerWrapper.querySelector(selectors.header);
  const isTransparentHeader = headerWrapper == null ? void 0 : headerWrapper.classList.contains(classes.headerTransparent);
  const isHideOnScrollDownHeader = header.hasAttribute(attributes.hideOnScrollDown);
  const isMobile = window.matchMedia("(max-width: 1199px)");
  async function init(sectionId) {
    const Controller = await window.themeCore.utils.getExternalUtil("swiperController");
    const EffectCreative = await window.themeCore.utils.getExternalUtil("swiperEffectCreative");
    const EffectFade = await window.themeCore.utils.getExternalUtil("swiperEffectFade");
    Swiper.use([Pagination, EffectCreative, Controller, EffectFade]);
    const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
    sections.forEach((section) => sectionComponents.push(createSectionComponents(section)));
    on("change", isMobile, handleMedia);
    handleMedia(isMobile);
  }
  function createSectionComponents(section) {
    return {
      section,
      sliderMediaSelector: section.querySelector(selectors.sliderMedia),
      sliderMediaInstance: null,
      sliderMediaPagination: section.querySelector(selectors.sliderMediaPagination),
      sliderContentSelector: section.querySelector(selectors.sliderContent),
      sliderContentInstance: null,
      productCards: [...section.querySelectorAll(selectors.productCard)],
      sliderContentWithProductsSelector: section.querySelector(selectors.sliderContentWithProducts),
      sliderContentWithProductsInstance: null,
      sliderContentWithProductsPagination: section.querySelector(selectors.sliderContentWithProductsPagination),
      removeScrollHandler: null
    };
  }
  function handleMedia(media) {
    if (media.matches) {
      destroyDesktopSliders();
      initMobileSlider();
    } else {
      destroyMobileSlider();
      initDesktopSliders();
    }
  }
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function initCustomScrollSlider(sliderInstance, sectionWrapper) {
    const totalSlides = sliderInstance.slides.length;
    let currentSlideIndex = sliderInstance.activeIndex;
    function onScroll() {
      const rect = sectionWrapper.getBoundingClientRect();
      const isInViewport = rect.top <= 0 && rect.bottom >= window.innerHeight;
      const newSlideIndex = clamp(Math.round(-rect.top / window.innerHeight), 0, totalSlides - 1);
      if (newSlideIndex !== currentSlideIndex) {
        currentSlideIndex = newSlideIndex;
        sliderInstance.slideTo(currentSlideIndex, 1200);
      }
      if (isInViewport) {
        isTransparentHeader && (headerWrapper == null ? void 0 : headerWrapper.classList.add(classes.headerTopCollapsed));
        headerWrapper == null ? void 0 : headerWrapper.classList.add(classes.collapsed);
      } else {
        isTransparentHeader && (headerWrapper == null ? void 0 : headerWrapper.classList.remove(classes.headerTopCollapsed));
        !isHideOnScrollDownHeader && (headerWrapper == null ? void 0 : headerWrapper.classList.remove(classes.collapsed));
      }
    }
    on("scroll", onScroll);
    return () => off("scroll", onScroll);
  }
  function initDesktopSliders() {
    sectionComponents.forEach((component) => {
      const sliderMediaPaginationOptions = {
        el: component.sliderMediaPagination,
        type: "bullets",
        clickable: true
      };
      const sliderMediaCreativeEffectOptions = createEffectOptions(
        [0, "-20%", -1],
        [0, "100%", 0]
      );
      const sliderContentCreativeEffectOptions = createEffectOptions(
        [0, 0, -1],
        [0, "-100%", 0]
      );
      const sliderContentOnFunctionObject = {
        init() {
          updateSlidesA11y(this);
          updateSectionColorScheme(this, component.section);
        },
        slideChange() {
          updateSlidesA11y(this);
          updateSectionColorScheme(this, component.section);
        }
      };
      const sliderMedia = createDesktopSlider(
        component.sliderMediaSelector,
        sliderMediaCreativeEffectOptions,
        sliderMediaPaginationOptions
      );
      const sliderContent = createDesktopSlider(
        component.sliderContentSelector,
        sliderContentCreativeEffectOptions,
        {},
        sliderContentOnFunctionObject
      );
      component.sliderMediaInstance = sliderMedia;
      component.sliderContentInstance = sliderContent;
      sliderMedia.controller.control = sliderContent;
      sliderContent.controller.control = sliderMedia;
      component.removeScrollHandler = initCustomScrollSlider(
        sliderMedia,
        component.section.closest(selectors.sectionWrapper)
      );
      sliderMedia.on("slideChange", function() {
        component.productCards.forEach((card, index) => {
          card.classList.toggle(classes.active, index === sliderMedia.activeIndex);
        });
      });
      component.sliderMediaPagination && on("click", component.sliderMediaPagination, (event) => {
        const bullet = event.target.closest(selectors.paginationBullet);
        if (!bullet)
          return;
        const paginationBullets = [...component.sliderMediaPagination.querySelectorAll(selectors.paginationBullet)];
        const targetIndex = paginationBullets.indexOf(bullet);
        if (targetIndex === -1)
          return;
        const sectionContainer = component.section.closest(selectors.sectionWrapper);
        if (!sectionContainer)
          return;
        const targetScrollTop = sectionContainer.offsetTop + targetIndex * window.innerHeight;
        window.scrollTo({
          top: targetScrollTop,
          behavior: "smooth"
        });
      });
    });
  }
  function initMobileSlider() {
    sectionComponents.forEach((section) => {
      section.sliderContentWithProductsInstance = createMobileSlider(
        section.sliderContentWithProductsSelector,
        section.sliderContentWithProductsPagination
      );
    });
  }
  function destroyDesktopSliders() {
    sectionComponents.forEach((component) => {
      ["sliderMediaInstance", "sliderContentInstance"].forEach((prop) => {
        var _a;
        (_a = component[prop]) == null ? void 0 : _a.destroy();
        component[prop] = null;
      });
      if (component.removeScrollHandler) {
        component.removeScrollHandler();
        component.removeScrollHandler = null;
      }
    });
  }
  function destroyMobileSlider() {
    sectionComponents.forEach((section) => {
      var _a;
      (_a = section.sliderContentWithProductsInstance) == null ? void 0 : _a.destroy();
      section.sliderContentWithProductsInstance = null;
    });
  }
  function createDesktopSlider(selector, creativeEffectOptions, paginationOptions = {}, onFunctionObject = null) {
    return new Swiper(selector, {
      direction: "vertical",
      slidesPerView: 1,
      effect: "creative",
      speed: 600,
      creativeEffect: creativeEffectOptions,
      pagination: paginationOptions,
      on: onFunctionObject
    });
  }
  function createMobileSlider(selector, paginationSelector) {
    return new Swiper(selector, {
      effect: "fade",
      pagination: {
        el: paginationSelector,
        type: "bullets",
        clickable: true
      },
      on: {
        init() {
          let section = this.el.closest(selectors.section);
          updateSectionColorScheme(this, section);
        },
        slideChange() {
          let section = this.el.closest(selectors.section);
          updateSectionColorScheme(this, section);
        }
      }
    });
  }
  function createEffectOptions(prevTranslate, nextTranslate) {
    return {
      prev: {
        shadow: true,
        translate: prevTranslate
      },
      next: {
        shadow: true,
        translate: nextTranslate
      }
    };
  }
  function updateSlidesA11y(swiper) {
    swiper.slides.forEach((slide, index) => {
      const isActive = index === swiper.activeIndex;
      slide.setAttribute("aria-hidden", !isActive);
      const focusableElements = focusable(slide);
      focusableElements.forEach((el) => {
        if (isActive) {
          el.removeAttribute("tabindex");
        } else {
          el.setAttribute("tabindex", "-1");
        }
      });
    });
  }
  function updateSectionColorScheme(swiper, section) {
    if (!swiper || !section) {
      return;
    }
    const activeIndex = swiper.activeIndex;
    const activeSlide = swiper.slides[activeIndex];
    if (!activeSlide) {
      return;
    }
    const colorScheme = activeSlide.getAttribute("data-color-scheme");
    let prefix = "color-";
    let classes2 = section.className.split(" ").filter(function(c) {
      return c.lastIndexOf(prefix, 0) !== 0;
    });
    section.className = classes2.join(" ").trim();
    section.classList.add(colorScheme);
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.ProductBanner = window.themeCore.ProductBanner || ProductBanner();
  window.themeCore.utils.register(window.themeCore.ProductBanner, "product-banner");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

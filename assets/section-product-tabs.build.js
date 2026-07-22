const ProductTabs = () => {
  const cssClasses = window.themeCore.utils.cssClasses;
  const Swiper = window.themeCore.utils.Swiper;
  const on = window.themeCore.utils.on;
  const mobileScreen = window.matchMedia("(max-width: 767.98px)");
  const selectors = {
    section: ".js-product-tabs-section",
    collection: ".js-product-tabs-collection",
    tabsList: ".js-product-tabs-buttons-list",
    tab: ".js-product-tabs-button",
    sliderWrapper: ".js-product-tabs-slider-wrapper",
    slider: ".js-product-tabs-slider",
    slide: ".js-product-tabs-slide",
    sliderButtonsWrapper: ".js-product-tabs-slider-buttons-wrapper",
    sliderPrevButton: ".js-product-tabs-slider-button-prev",
    sliderNextButton: ".js-product-tabs-slider-button-next"
  };
  const attributes = {
    tabindex: "tabindex"
  };
  const classes = {
    ...cssClasses,
    isInitialized: "is-initialized",
    slide: "swiper-slide",
    slideActive: "swiper-slide-active",
    isMobileSlideOnly: "product-tabs__slide--mobile"
  };
  function init(sectionId) {
    const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
    sections.forEach((section) => {
      const sliders = [...section.querySelectorAll(selectors.slider)];
      on("click", section, (event) => changeTab(event, section));
      sliders.forEach((slider, index) => initSlider(section, slider, index + 1));
    });
  }
  function initSlider(section, slider, index) {
    if (!slider)
      return;
    const slides = [...slider.querySelectorAll(selectors.slide)];
    const sliderButtonsWrapper = findTargetSliderButtonsWrapper(section, selectors.sliderButtonsWrapper, index);
    const sliderPrevButton = sliderButtonsWrapper == null ? void 0 : sliderButtonsWrapper.querySelector(selectors.sliderPrevButton);
    const sliderNextButton = sliderButtonsWrapper == null ? void 0 : sliderButtonsWrapper.querySelector(selectors.sliderNextButton);
    const sliderOptions = {
      grabCursor: true,
      slidesPerView: 1.25,
      spaceBetween: 12,
      navigation: {
        prevEl: sliderPrevButton,
        nextEl: sliderNextButton
      },
      breakpoints: {
        576: {
          slidesPerView: slides.length > 2 ? 2.25 : 2
        },
        768: {
          slidesPerView: 2
        },
        1200: {
          slidesPerView: 3
        }
      },
      on: {
        init() {
          sliderButtonsWrapper.classList.add(classes.isInitialized);
        }
      }
    };
    new Swiper(slider, sliderOptions);
    on("change", mobileScreen, () => changeSlideState(slides));
    changeSlideState(slides);
  }
  function changeSlideState(slides) {
    return slides.forEach((slide) => {
      toggleClass(slide, classes.slide, mobileScreen.matches || !slide.classList.contains(classes.isMobileSlideOnly));
      slide.classList.remove(classes.slideActive);
    });
  }
  function findTargetSliderButtonsWrapper(section, selector, index) {
    return [...section.querySelectorAll(selector)].find((element) => +element.dataset.index === index);
  }
  function changeTab(event, section) {
    const tab = event.target.closest(selectors.tab);
    if (!tab)
      return;
    const tabIndexTarget = +tab.dataset.index;
    const sliderWrappers = [...section.querySelectorAll(selectors.sliderWrapper)];
    const tabs = [...section.querySelectorAll(selectors.tab)];
    const collections = [...section.querySelectorAll(selectors.collection)];
    const sliderButtonsWrappers = [...section.querySelectorAll(selectors.sliderButtonsWrapper)];
    tabs.forEach((tab2) => {
      toggleClass(tab2, classes.active, +tab2.dataset.index === tabIndexTarget);
      tab2.setAttribute(attributes.tabindex, tab2.classList.contains(classes.active) ? -1 : 0);
    });
    sliderWrappers.forEach((sliderWrapper) => {
      toggleClass(sliderWrapper, classes.active, +sliderWrapper.dataset.index === tabIndexTarget);
      toggleClass(sliderWrapper, classes.hidden, +sliderWrapper.dataset.index !== tabIndexTarget);
    });
    collections.forEach((collection) => {
      toggleClass(collection, classes.active, +collection.dataset.index === tabIndexTarget);
      toggleClass(collection, classes.hidden, +collection.dataset.index !== tabIndexTarget);
    });
    sliderButtonsWrappers.forEach(
      (sliderButtonsWrapper) => toggleClass(sliderButtonsWrapper, classes.hidden, +sliderButtonsWrapper.dataset.index !== tabIndexTarget)
    );
    tab.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }
  function toggleClass(element, className, force) {
    if (!element)
      return;
    return element.classList.toggle(className, force);
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.ProductTabs = window.themeCore.ProductTabs || ProductTabs();
  window.themeCore.utils.register(window.themeCore.ProductTabs, "product-tabs");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

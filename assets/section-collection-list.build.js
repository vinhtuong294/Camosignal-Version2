const CollectionList = () => {
  const selectors = {
    section: ".js-collection-list",
    slider: ".js-collection-list-slider",
    slide: ".js-collection-list-slide",
    sliderPrevButton: ".js-collection-list-button-prev",
    sliderNextButton: ".js-collection-list-button-next"
  };
  const classes = {
    swiperBackfaceHidden: "swiper-backface-hidden"
  };
  const breakpoints = {
    large: "(max-width: 1500.98px)",
    medium: "(max-width: 1199.98px)",
    small: "(max-width: 991.98px)",
    extraSmall: "(max-width: 767.98px)",
    smallTabletPortrait: "(max-width: 575.98px)",
    smallMobile: "(max-width: 373.98px)"
  };
  const on = window.themeCore.utils.on;
  const Swiper = window.themeCore.utils.Swiper;
  const LARGE_SCREEN = window.matchMedia(breakpoints.large);
  const MEDIUM_SCREEN = window.matchMedia(breakpoints.medium);
  const SMALL_SCREEN = window.matchMedia(breakpoints.small);
  const EXTRA_SMALL_SCREEN = window.matchMedia(breakpoints.extraSmall);
  const SMALL_TABLET_PORTRAIT_SCREEN = window.matchMedia(breakpoints.smallTabletPortrait);
  const SMALL_MOBILE = window.matchMedia(breakpoints.smallMobile);
  function init(sectionId) {
    const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
    sections.forEach((section) => {
      const slider = section.querySelector(selectors.slider);
      if (!slider)
        return;
      initSlider(slider);
    });
  }
  function initSlider(slider) {
    let swiperInstance = null;
    const slides = [...slider.querySelectorAll(selectors.slide)];
    let sliderOptions = {
      slidesPerView: 1.2,
      spaceBetween: 16,
      navigation: {
        nextEl: selectors.sliderNextButton,
        prevEl: selectors.sliderPrevButton
      },
      breakpoints: {
        374: {
          slidesPerView: 2.24
        },
        576: {
          slidesPerView: 3.2
        },
        768: {
          slidesPerView: 4.2
        },
        992: {
          slidesPerView: 5.2
        },
        1200: {
          slidesPerView: 6
        },
        1501: {
          slidesPerView: 8
        }
      }
    };
    function changeSliderStateOnBreakpoint() {
      if (SMALL_MOBILE.matches && slides.length > 1 || SMALL_TABLET_PORTRAIT_SCREEN.matches && slides.length > 2 || EXTRA_SMALL_SCREEN.matches && slides.length > 3 || SMALL_SCREEN.matches && slides.length > 4 || MEDIUM_SCREEN.matches && slides.length > 5 || LARGE_SCREEN.matches && slides.length > 6 || !LARGE_SCREEN.matches && slides.length > 8) {
        if (!swiperInstance)
          swiperInstance = new Swiper(slider, sliderOptions);
      } else {
        if (!swiperInstance)
          return;
        swiperInstance.destroy();
        swiperInstance = null;
        slider.classList.remove(classes.swiperBackfaceHidden);
      }
    }
    on("resize", changeSliderStateOnBreakpoint);
    changeSliderStateOnBreakpoint();
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.CollectionList = window.themeCore.CollectionList || CollectionList();
  window.themeCore.utils.register(window.themeCore.CollectionList, "collection-list");
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

const FeaturedProducts = () => {
  let Swiper = window.themeCore.utils.Swiper;
  const selectors = {
    section: ".js-featured-products",
    slider: ".js-featured-products-slider",
    slide: ".js-featured-products-slide",
    sliderPrevButton: ".js-featured-products-slider-button-prev",
    sliderNextButton: ".js-featured-products-slider-button-next"
  };
  const classes = {
    isInitialized: "is-initialized"
  };
  const attributes = {
    slidesPerRow: "data-slides-in-row"
  };
  function init(sectionId) {
    const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
    sections.forEach((section) => {
      const slider = section.querySelector(selectors.slider);
      if (!slider)
        return;
      initSlider(section, slider);
    });
  }
  function initSlider(section, slider) {
    if (window.matchMedia('(max-width: 767px)').matches) return;
    const slidesLength = [...slider.querySelectorAll(selectors.slide)].length;
    const slidesPerViewDesktop = +slider.getAttribute(attributes.slidesPerRow) || 4;
    const sliderPrevButton = section.querySelector(selectors.sliderPrevButton);
    const sliderNextButton = section.querySelector(selectors.sliderNextButton);
    const sliderOptions = {
      grabCursor: true,
      slidesPerView: 2.2,
      spaceBetween: 12,
      navigation: {
        prevEl: sliderPrevButton,
        nextEl: sliderNextButton
      },
      breakpoints: {
        576: {
          slidesPerView: slidesLength > 2 ? 2.2 : 2
        },
        768: {
          slidesPerView: slidesLength > 3 ? 3.2 : 3
        },
        1200: {
          slidesPerView: slidesPerViewDesktop
        }
      },
      on: {
        init() {
          section.classList.add(classes.isInitialized);
        }
      }
    };
    new Swiper(slider, sliderOptions);
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.FeaturedProducts = window.themeCore.FeaturedProducts || FeaturedProducts();
  window.themeCore.utils.register(window.themeCore.FeaturedProducts, "featured-products");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

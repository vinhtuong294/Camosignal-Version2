const CollectionsCarousel$1 = async (section) => {
  const Swiper = window.themeCore.utils.Swiper;
  const Autoplay = await window.themeCore.utils.getExternalUtil("swiperAutoplay");
  Swiper.use([Autoplay]);
  const selectors2 = {
    slider: ".js-slider",
    customSliderSettings: ".js-slider-settings",
    slide: ".swiper-slide",
    activeSlide: ".swiper-slide-active",
    imageBlock: ".js-collections-carousel-image-block"
  };
  const classes = {
    isVisible: "is-visible"
  };
  const slider = section.querySelector(selectors2.slider);
  const sliderSettingsDOM = section.querySelector(selectors2.customSliderSettings);
  const imageBlocks = [...section.querySelectorAll(selectors2.imageBlock)];
  let customSliderSettings, swiperSlider;
  async function initSwiper() {
    customSliderSettings = getCustomSliderSettings();
    if (!customSliderSettings) {
      return;
    }
    const slidesLength = [...slider.querySelectorAll(selectors2.slide)].length;
    swiperSlider = new Swiper(slider, {
      slidesPerView: 2.455,
      grabCursor: true,
      centeredSlides: true,
      loop: slidesLength > 4,
      breakpoints: {
        768: {
          slidesPerView: 3.4,
          loop: slidesLength > 5
        },
        992: {
          slidesPerView: 4.4,
          loop: slidesLength > 6
        },
        1500: {
          slidesPerView: 4.8,
          loop: slidesLength > 6
        }
      },
      ...customSliderSettings
    });
    swiperSlider.on("slideChange", onSlideChange);
  }
  const onSlideChange = (swiper) => {
    const activeIndex = swiper.realIndex;
    imageBlocks.forEach((block) => {
      const blockIndex = Number(block.dataset.slideIndex);
      block.classList.toggle(classes.isVisible, activeIndex === blockIndex);
    });
  };
  function getCustomSliderSettings() {
    try {
      return JSON.parse(sliderSettingsDOM.textContent);
    } catch (error) {
      console.error("Failed to parse custom slider settings:", error);
      return null;
    }
  }
  async function init() {
    if (slider && sliderSettingsDOM) {
      initSwiper();
    }
  }
  return Object.freeze({
    init
  });
};
const selectors = {
  section: ".js-collections-carousel"
};
const CollectionsCarousel = () => {
  async function init(sectionId) {
    const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
    sections.forEach(async (section) => {
      const slider = await CollectionsCarousel$1(section);
      slider.init();
    });
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.CollectionsCarousel = window.themeCore.CollectionsCarousel || CollectionsCarousel();
  window.themeCore.utils.register(window.themeCore.CollectionsCarousel, "collections-carousel");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

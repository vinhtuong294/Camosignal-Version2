import { T as Ticker } from "./ticker-2aaf4347.js";
const AnnouncementBar = () => {
  const globalCssClasses = window.themeCore.utils.cssClasses;
  const selectors = {
    section: ".js-announcement-bar",
    slider: ".js-announcement-bar-slider",
    slideContent: ".js-announcement-bar-slide-content",
    copyCodeButton: ".js-announcement-bar-copy-code",
    copyText: ".js-announcement-bar-copy",
    copiedText: ".js-announcement-bar-copied",
    discountText: ".js-announcement-bar-discount-text",
    tickerContainer: ".js-announcement-bar-ticker-container"
  };
  const Swiper = window.themeCore.utils.Swiper;
  let section = null;
  let slider = null;
  let swiperSlider = null;
  let tickerContainer = null;
  async function initSlider(sliderEl) {
    if (!sliderEl) {
      return;
    }
    const Autoplay = await window.themeCore.utils.getExternalUtil("swiperAutoplay");
    Swiper.use([Autoplay]);
    const autoplaySpeed = sliderEl.getAttribute("data-autoplay-speed");
    const isAutoPlay = sliderEl.getAttribute("data-autoplay") === "true";
    swiperSlider = new Swiper(sliderEl, {
      init: false,
      direction: "vertical",
      slidesPerView: 1,
      arrows: false,
      loop: true,
      navigation: {
        nextEl: ".js-announcement-swiper-button-next",
        prevEl: ".js-announcement-swiper-button-prev"
      },
      autoplay: isAutoPlay ? {
        delay: autoplaySpeed,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      } : false
    });
    swiperSlider.on("init", function() {
      initSwiperHeight();
      window.addEventListener("resize", initSwiperHeight);
    });
    swiperSlider.init();
    sliderEl.classList.add("swiper-initialized");
  }
  function initSwiperHeight() {
    if (!swiperSlider || !swiperSlider.initialized) {
      return;
    }
    let swiperContainer = swiperSlider.el;
    let swiperSlides = swiperSlider.slides;
    if (!swiperSlider || !swiperSlider || !swiperSlides.length) {
      return;
    }
    let maxHeight = 0;
    swiperContainer.style.height = 0;
    swiperSlides.forEach((swiperSlide) => {
      let swiperSlideContent = swiperSlide.querySelector(selectors.slideContent);
      if (swiperSlideContent) {
        swiperSlideContent.style.height = "auto";
        if (swiperSlideContent && swiperSlideContent.scrollHeight > maxHeight) {
          maxHeight = swiperSlideContent.scrollHeight;
        }
      }
    });
    swiperContainer.style.height = `${maxHeight}px`;
    swiperSlides.forEach(function(swiperSlide) {
      let swiperSlideContent = swiperSlide.querySelector(selectors.slideContent);
      swiperSlideContent.style.height = "";
    });
  }
  async function init() {
    section = document.querySelector(selectors.section);
    slider = section.querySelector(selectors.slider);
    tickerContainer = section.querySelector(selectors.tickerContainer);
    section.addEventListener("click", copyToClipboard);
    setTimeout(() => {
      window.themeCore.EventBus.emit("announcement-bar:changed", {});
    }, 0);
    initSlider(slider);
    Ticker(tickerContainer).init();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const bounds = entry.boundingClientRect;
        changeCssVariable("--announcement-bar-height", ` ${bounds.height}px`);
      }
      observer.disconnect();
    });
    observer.observe(section);
    function changeCssVariable(variable, value) {
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty(variable, value);
      });
    }
  }
  function copyToClipboard(clickEvent) {
    const button = clickEvent.target.closest(selectors.copyCodeButton);
    if (!button) {
      return;
    }
    const textToCopy = button.dataset.code;
    const discountText = button.previousElementSibling || button.parentElement.querySelector(selectors.discountText);
    const parent = button.parentElement;
    const parentWidth = parent.offsetWidth;
    navigator.clipboard.writeText(textToCopy).then(() => {
      var _a, _b;
      discountText == null ? void 0 : discountText.classList.add(globalCssClasses.hidden);
      (_a = button.querySelector(selectors.copyText)) == null ? void 0 : _a.classList.add(globalCssClasses.hidden);
      (_b = button.querySelector(selectors.copiedText)) == null ? void 0 : _b.classList.remove(globalCssClasses.hidden);
      button.setAttribute("disabled", "");
      parent.style.setProperty("--min-width", `${parentWidth}px`);
      setTimeout(() => {
        var _a2, _b2;
        discountText == null ? void 0 : discountText.classList.remove(globalCssClasses.hidden);
        (_a2 = button.querySelector(selectors.copyText)) == null ? void 0 : _a2.classList.remove(globalCssClasses.hidden);
        (_b2 = button.querySelector(selectors.copiedText)) == null ? void 0 : _b2.classList.add(globalCssClasses.hidden);
        button.removeAttribute("disabled");
        parent.style.setProperty("--min-width", `${0}px`);
      }, 2e3);
    }).catch((err) => {
      console.error(err);
    });
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.AnnouncementBar = window.themeCore.AnnouncementBar || AnnouncementBar();
  window.themeCore.utils.register(window.themeCore.AnnouncementBar, "announcement-bar");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

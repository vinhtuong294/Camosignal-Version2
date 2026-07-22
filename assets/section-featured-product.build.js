import { P as ProductCarousel, a as ProductForm } from "./product-carousel-5c4cc215.js";
import "./disableTabulationOnNotActiveSlidesWithModel-38e80234.js";
const FeaturedProductSection = (section) => {
  const { Toggle: Toggle2, on, cssClasses: cssClasses2 } = window.themeCore.utils;
  const selectors2 = {
    mediaContainer: ".js-product-media-container",
    modelButton: ".js-product-media-model-button",
    modelPoster: ".js-product-media-model-poster",
    modelContent: ".js-product-media-model-content"
  };
  const sectionId = section && section.dataset.sectionId;
  const carouselSelectors = {
    slider: `.js-product-media-slider-${sectionId}`,
    sliderPagination: `.js-product-media-slider-pagination-${sectionId}`,
    sliderSlideVariantId: `.js-product-gallery-slide-variant-${sectionId}`,
    sliderThumbnails: `.js-product-media-slider-thumbnails-${sectionId}`,
    sliderNavigationNext: `.js-product-media-slider-next-${sectionId}`,
    sliderNavigationPrev: `.js-product-media-slider-prev-${sectionId}`
  };
  const drawersSelectors = {
    sizeGuideDrawer: `productSizeGuideDrawer-${sectionId}`,
    descriptionDrawer: `descriptionDrawer-${sectionId}`,
    customDrawer1: `productDrawer1-${sectionId}`,
    customDrawer2: `productDrawer2-${sectionId}`,
    customDrawer3: `productDrawer3-${sectionId}`
  };
  let Carousel = null, mediaContainer = null;
  const mediaQuery = window.matchMedia("(min-width: 1200px)");
  function init2() {
    mediaContainer = section == null ? void 0 : section.querySelector(selectors2.mediaContainer);
    Carousel = ProductCarousel({
      selectors: carouselSelectors,
      sectionId
    });
    if (mediaContainer) {
      updateMedia(mediaQuery);
      on("change", mediaQuery, updateMedia);
    }
    setDrawers();
    initModelButtons();
    const productHandle = section.dataset.productHandle;
    if (!productHandle) {
      return;
    }
    let recentlyViewed = localStorage.getItem("theme_recently_viewed");
    if (recentlyViewed) {
      try {
        recentlyViewed = JSON.parse(recentlyViewed);
        recentlyViewed = recentlyViewed.filter((handle) => handle !== productHandle);
        recentlyViewed.push(productHandle);
        recentlyViewed = recentlyViewed.slice(-13);
        localStorage.setItem("theme_recently_viewed", JSON.stringify(recentlyViewed));
      } catch (e) {
        console.log(e);
      } finally {
        return;
      }
    }
    localStorage.setItem("theme_recently_viewed", `["${productHandle}"]`);
  }
  function updateMedia(event) {
    const mediaLayout = mediaContainer.dataset.mediaLayout;
    if (!event)
      return;
    return event.matches && mediaLayout !== "carousel" ? Carousel.destroy() : Carousel.init();
  }
  function setDrawers() {
    try {
      setToggleDrawer(drawersSelectors.sizeGuideDrawer, { hasFullWidth: true, overlayPlacement: section });
      setToggleDrawer(drawersSelectors.descriptionDrawer, { overlayPlacement: section });
      setToggleDrawer(drawersSelectors.customDrawer1, { overlayPlacement: section });
      setToggleDrawer(drawersSelectors.customDrawer2, { overlayPlacement: section });
      setToggleDrawer(drawersSelectors.customDrawer3, { overlayPlacement: section });
    } catch (e) {
    }
  }
  function setToggleDrawer(selector, options = {}) {
    const toggleButton = document.querySelector(`[data-js-toggle="${selector}"]`);
    if (!toggleButton) {
      return;
    }
    const ToggleDrawer = Toggle2({
      toggleSelector: selector,
      ...options
    });
    ToggleDrawer.init();
    if (selector === drawersSelectors.sizeGuideDrawer) {
      let sizeGuideDrawer = document.getElementById(drawersSelectors.sizeGuideDrawer);
      if (!sizeGuideDrawer) {
        return;
      }
      on("click", sizeGuideDrawer, function(e) {
        if (e.target == this) {
          ToggleDrawer.close(sizeGuideDrawer);
        }
      });
    }
  }
  function initModelButtons() {
    const modelButtons = [...section.querySelectorAll(selectors2.modelButton)];
    if (!modelButtons.length) {
      return;
    }
    section.addEventListener("click", (event) => {
      const button = event.target.closest(selectors2.modelButton);
      if (!button) {
        return;
      }
      const container = button.parentElement;
      const poster = container.querySelector(selectors2.modelPoster);
      const content = container.querySelector(selectors2.modelContent);
      if (!poster || !content) {
        return;
      }
      poster.remove();
      button.remove();
      content.classList.remove(cssClasses2.hidden);
      Carousel.disableSwipe();
    });
  }
  return Object.freeze({
    init: init2
  });
};
const selectors = {
  section: '[data-section-type="product"]',
  productAvailabilityToggleSelector: "[data-js-toggle-selector]",
  mediaContainer: ".js-product-media-container",
  video: ".js-video",
  slide: ".js-product-gallery-slide",
  paused: ".js-paused-video",
  placeholder: ".js-product-gallery-video-placeholder"
};
const videos = [];
let sections;
let ProductForms;
let Toggle;
let Video;
let cssClasses;
function init(sectionId) {
  Toggle = window.themeCore.utils.Toggle;
  sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
  ProductForms = ProductForm();
  sections.forEach(initSection);
  ProductForms.init();
  Video = window.themeCore.utils.Video;
  cssClasses = {
    ...window.themeCore.utils.cssClasses,
    pausedVideo: "is-paused-video"
  };
  initVideos();
  setEventBusListeners();
}
function initSection(section) {
  const productSection = FeaturedProductSection(section);
  window.themeCore.EventBus.listen(
    `pickup-availability-drawer:productAvailability-pickup-availability__${section.dataset.sectionId}:loaded`,
    () => {
      const productAvailabilityToggles = [
        ...document.querySelectorAll(
          selectors.productAvailabilityToggleSelector
        )
      ];
      const productAvailabilityToggle = productAvailabilityToggles.find(
        (toggle) => {
          return toggle.dataset.jsToggle === `productAvailability-pickup-availability__${section.dataset.sectionId}`;
        }
      );
      const productAvailability = Toggle({
        toggleSelector: productAvailabilityToggle.dataset.target
      });
      productAvailability.init();
    }
  );
  window.themeCore.EventBus.listen(`product-media:${section.dataset.sectionId}-update-complete`, initVideos);
  window.setTimeout(() => {
    handlerPauseVideo(section);
  }, 0);
  productSection.init();
}
function onProductSliderSlideChange() {
  if (!videos.length) {
    window.themeCore.EventBus.remove("product-slider:slide-change", onProductSliderSlideChange);
  }
  pauseVideos();
}
function handlerPauseVideo(section) {
  const mediaContainer = section.querySelector(selectors.mediaContainer);
  if (!mediaContainer) {
    return;
  }
  mediaContainer.addEventListener("click", (event) => {
    const paused = event.target.closest(selectors.paused);
    if (!paused || !paused.classList.contains(cssClasses.pausedVideo)) {
      return;
    }
    pauseVideos();
    const placeholder = paused.querySelector(selectors.placeholder);
    const videoEl = paused.querySelector(selectors.video);
    if (placeholder) {
      paused.classList.remove(cssClasses.pausedVideo);
      placeholder.classList.add(cssClasses.hidden);
      videos.forEach(({ player, videoWrapper, type }) => {
        if (videoWrapper === videoEl) {
          playVideo(player, type);
        }
      });
    }
  });
}
function playVideo(player, type) {
  const VIDEO_TYPES = window.themeCore.utils.VIDEO_TYPES;
  switch (type) {
    case VIDEO_TYPES.html: {
      player.play();
      break;
    }
    case VIDEO_TYPES.vimeo: {
      player.play();
      break;
    }
    case VIDEO_TYPES.youtube: {
      player.mute();
      player.playVideo();
      break;
    }
    default:
      return;
  }
}
function pauseVideos() {
  videos.forEach(({ player }) => {
    try {
      player.pauseVideo();
    } catch (e) {
    }
    try {
      player.pause();
    } catch (e) {
    }
  });
}
function setEventBusListeners() {
  window.themeCore.EventBus.listen("product-slider:slide-change", onProductSliderSlideChange);
  window.themeCore.EventBus.emit("product:loaded");
}
async function initVideos() {
  const slides = [...document.querySelectorAll(selectors.slide)];
  slides.forEach((slide) => {
    const [video] = Video({
      videoContainer: slide,
      options: {
        youtube: {
          controls: 1,
          showinfo: 1
        }
      }
    }).init();
    if (video) {
      videos.push(video);
    }
  });
}
const FeaturedProduct = () => {
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.FeaturedProduct = window.themeCore.FeaturedProduct || FeaturedProduct();
  window.themeCore.utils.register(window.themeCore.FeaturedProduct, "featured-product");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

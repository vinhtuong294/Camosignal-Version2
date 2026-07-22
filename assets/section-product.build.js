import { P as ProductCarousel, a as ProductForm } from "./product-carousel-5c4cc215.js";
import { d as disableTabulationOnNotActiveSlidesWithModel } from "./disableTabulationOnNotActiveSlidesWithModel-38e80234.js";
const Zoom = (context = document) => {
  const {
    Swiper,
    off,
    on,
    Toggle: Toggle2,
    VIDEO_TYPES,
    Video: Video2
  } = window.themeCore.utils;
  const globalClasses = {
    ...window.themeCore.utils.cssClasses,
    isDragging: "is-dragging"
  };
  const selectors2 = {
    container: "[data-zoom-container]",
    media: "[data-zoom-media]",
    modal: "[data-zoom-modal]",
    toggle: "[data-zoom-modal-toggle]",
    content: "[data-zoom-content]",
    slider: "[data-zoom-slider]",
    slide: "[data-zoom-slide]",
    slideImage: ".js-zoom-slide-image",
    prevSlide: ".js-zoom-slider-prev-button",
    nextSlide: ".js-zoom-slider-next-button",
    productSlider: "[data-js-product-media-slider]",
    productSliderWrapper: ".swiper-wrapper",
    notInitedIframe: ".js-video.js-video-youtube, .js-video:empty"
  };
  const breakpoints = {
    afterMedium: 1200
  };
  let containers = null;
  let isDrag = false;
  async function init2() {
    let zoomSlider = context.querySelector(selectors2.slider);
    if (!zoomSlider) {
      return;
    }
    let videosSlides = zoomSlider.querySelectorAll(".js-video");
    let hasVideos = videosSlides && videosSlides.length > 0;
    containers = getContainers();
    containers.forEach((container) => {
      if (!container.media.length) {
        return;
      }
      container.modal.init();
      if (hasVideos) {
        initVideos2(container);
      }
      container.slider = initMediaSlider(container);
      const observer = new MutationObserver(() => {
        if (container.el.querySelector(selectors2.notInitedIframe)) {
          return;
        }
        disableTabulationOnNotActiveSlidesWithModel(container.slider);
        observer.disconnect();
      });
      const observerOptions = {
        attributes: true,
        childList: true,
        subtree: true
      };
      observer.observe(container.el, observerOptions);
      zoomMove(container);
      setEventListeners(container);
    });
  }
  function zoomMove(container) {
    let pos = { top: 0, left: 0, x: 0, y: 0 };
    const setDraggingCursor = (isDragging) => {
      if (!container.sliderEl)
        return;
      container.sliderEl.classList.toggle(globalClasses.isDragging, isDragging);
    };
    const mouseDownHandler = function(e) {
      if (window.innerWidth < breakpoints.afterMedium) {
        return;
      }
      isDrag = false;
      pos = {
        x: e.clientX,
        y: e.clientY
      };
      on("mousemove", document, mouseMoveHandler);
      on("mouseup", document, mouseUpHandler);
    };
    const mouseMoveHandler = function(e) {
      const dx = e.clientX - pos.x;
      const dy = e.clientY - pos.y;
      const DRAG_THRESHOLD = 3;
      if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
        isDrag = true;
      }
    };
    const mouseUpHandler = function() {
      off("mousemove", document, mouseMoveHandler);
      off("mouseup", document, mouseUpHandler);
      setDraggingCursor(false);
    };
    on("mousedown", container.el, mouseDownHandler);
    on("dragstart", container.el, (e) => {
      const target = e.target;
      if (target && target.tagName === "IMG" && target.closest(selectors2.slider)) {
        e.preventDefault();
      }
    });
    on("mousedown", container.el, (e) => {
      if (window.innerWidth < breakpoints.afterMedium || e.button !== 0)
        return;
      const target = e.target;
      const isImage = target && target.tagName === "IMG" && target.closest(selectors2.slider);
      const isZoomed = container.slider && container.slider.zoom && container.slider.zoom.scale > 1;
      if (isImage && isZoomed) {
        e.preventDefault();
        setDraggingCursor(true);
      }
    });
  }
  function setEventListeners(container) {
    on("click", container.el, (e) => onTriggerClick(e, container));
    on("click", container.el, (e) => onSlideClick(e, container));
    window.themeCore.EventBus.listen(
      `Toggle:${container.modalEl.id}:close`,
      (e) => onZoomModalClose(e, container)
    );
  }
  function getContainers() {
    return [...context.querySelectorAll(selectors2.container)].map(
      (container) => {
        const media = [...container.querySelectorAll(selectors2.media)];
        const slides = [...container.querySelectorAll(selectors2.slide)];
        const content = container.querySelector(selectors2.content);
        const modalEl = container.querySelector(selectors2.modal);
        const sliderEl = container.querySelector(selectors2.slider);
        const modal = Toggle2({
          toggleSelector: modalEl.id
        });
        return {
          el: container,
          sliderEl,
          slides,
          modalEl,
          modal,
          media,
          content
        };
      }
    );
  }
  function initVideos2({ slides }) {
    slides.forEach((slide) => {
      const [video] = Video2({
        videoContainer: slide,
        options: {
          youtube: {
            controls: 1,
            showinfo: 1
          }
        }
      }).init();
      if (video) {
        slide.video = video;
      }
    });
  }
  function initMediaSlider({ sliderEl, slides }) {
    return new Swiper(sliderEl, {
      slidesPerView: 1,
      allowTouchMove: false,
      zoom: {
        maxRatio: 3,
        minRatio: 1
      },
      navigation: {
        prevEl: selectors2.prevSlide,
        nextEl: selectors2.nextSlide
      },
      on: {
        beforeSlideChangeStart: function(slider) {
          if (slider && slider.zoom && typeof slider.zoom.out === "function") {
            slider.zoom.out();
          }
        },
        slideChange: function(swiper) {
          pauseAllVideos(slides);
          disableTabulationOnNotActiveSlidesWithModel(swiper);
          removeMediaLoader(swiper.slides[swiper.activeIndex]);
        }
      }
    });
  }
  function pauseAllVideos(slides) {
    const videoSlides = slides.filter((slide) => slide.video);
    if (!videoSlides.length) {
      return;
    }
    videoSlides.forEach(({ video }) => {
      if (VIDEO_TYPES.youtube === video.type) {
        video.player.pauseVideo();
      } else {
        video.player.pause();
      }
    });
  }
  function onTriggerClick(event, container) {
    const media = event.target.closest(selectors2.media);
    if (!media || !container.media.length) {
      return;
    }
    const mediaId = media.dataset.zoomMedia;
    const targetIndex = container.slides.findIndex(
      (slide) => slide.dataset.zoomSlide === mediaId
    );
    const targetSlide = targetIndex !== -1 ? container.slides[targetIndex] : null;
    removeMediaLoader(targetSlide);
    container.slider.slideTo(targetIndex, 0);
    document.querySelector(":root").style.setProperty("--page-height", ` ${window.innerHeight}px`);
    container.modal.open(container.modalEl);
    disableTabulationOnNotActiveSlidesWithModel(container.slider);
  }
  function onSlideClick(event, container) {
    const slide = event.target.closest(selectors2.slide);
    if (!slide || isDrag) {
      isDrag = false;
      return;
    }
    container.slider.zoom.toggle();
  }
  function onZoomModalClose(event, container) {
    if (!event) {
      return;
    }
    container.slider.zoom.out();
    pauseAllVideos(container.slides);
  }
  function removeMediaLoader(targetSlide) {
    if (!targetSlide || !targetSlide.classList.contains(globalClasses.loading))
      return;
    const imageMedia = targetSlide.querySelector(selectors2.slideImage);
    const removeClass = () => targetSlide.classList.remove(globalClasses.loading);
    imageMedia && !imageMedia.complete ? on("load", imageMedia, removeClass) : removeClass();
  }
  return Object.freeze({
    init: init2
  });
};
const BackInStockAlert = (section) => {
  const sectionId = section && section.dataset.sectionId;
  const classes = window.themeCore.utils.cssClasses;
  const selectors2 = {
    backInStockAlertButtonWrapper: ".js-back-in-stock-alert-button-wrapper",
    backInStockAlertButton: ".js-back-in-stock-alert-button",
    backInStockAlertPopup: ".js-back-in-stock-alert-popup",
    backInStockAlertForm: ".js-back-in-stock-alert-form",
    backInStockAlertFormStatus: ".js-back-in-stock-alert-form-status",
    backInStockAlertFormInputMessage: "[name='contact[message]']",
    backInStockAlertFormInputProductURL: "[name='contact[ProductURL]']"
  };
  const placeholders = {
    productTitle: "{{ product_title }}"
  };
  const cssClasses2 = {
    ...classes,
    isPosted: "is-posted",
    isNotifyMeActive: "is-notify-me-popup-active"
  };
  const searchParams = {
    contactPosted: "contact_posted",
    contactProductUrl: "contact[ProductURL]",
    contactMessage: "contact[message]",
    formType: "form_type"
  };
  const Toggle2 = window.themeCore.utils.Toggle;
  const on = window.themeCore.utils.on;
  let backInStockAlertButton = null;
  let backInStockAlertPopup = null;
  let backInStockAlertForm = null;
  let backInStockAlertFormInputMessage = null;
  let backInStockAlertFormInputProductURL = null;
  let backInStockAlertPopupToggle = null;
  let backInStockAlertFormStatus = null;
  let backInStockAlertFormId = null;
  let changeVariantIsFired = false;
  function init2() {
    if (!section || !sectionId) {
      return false;
    }
    backInStockAlertButton = section.querySelector(selectors2.backInStockAlertButton);
    backInStockAlertPopup = section.querySelector(selectors2.backInStockAlertPopup);
    backInStockAlertForm = section.querySelector(selectors2.backInStockAlertForm);
    if (!backInStockAlertButton || !backInStockAlertPopup || !backInStockAlertForm) {
      return false;
    }
    if (!backInStockAlertPopup.classList.contains(classes.active) && Shopify.designMode) {
      const popupOverlay = document.querySelector(`[data-js-overlay="ProductNotifyMePopup-${section.dataset.sectionId}"]`);
      if (popupOverlay) {
        popupOverlay.click();
      }
    }
    backInStockAlertFormId = backInStockAlertForm.id;
    backInStockAlertFormInputMessage = backInStockAlertForm.querySelector(selectors2.backInStockAlertFormInputMessage);
    backInStockAlertFormInputProductURL = backInStockAlertForm.querySelector(selectors2.backInStockAlertFormInputProductURL);
    backInStockAlertFormStatus = backInStockAlertForm.querySelector(selectors2.backInStockAlertFormStatus);
    if (!backInStockAlertFormInputMessage || !backInStockAlertFormInputProductURL || !backInStockAlertFormStatus) {
      return;
    }
    initToggle();
    initFormStatus();
    setEventBusListeners2();
  }
  function initToggle() {
    backInStockAlertPopupToggle = Toggle2({
      toggleSelector: backInStockAlertPopup.id
    });
    backInStockAlertPopupToggle.init();
    on("click", backInStockAlertPopup, function(e) {
      if (e.target == this) {
        console.log(backInStockAlertPopup);
        backInStockAlertPopupToggle.close(backInStockAlertPopup);
      }
    });
    window.themeCore.EventBus.listen(`Toggle:${backInStockAlertPopup.id}:close`, closeBackInStockAlertPopup);
    window.themeCore.EventBus.listen(`Toggle:${backInStockAlertPopup.id}:open`, openBackInStockAlertPopup);
  }
  function initFormStatus() {
    if (isCurrentFormPosted()) {
      backInStockAlertForm.classList.add(cssClasses2.isPosted);
      backInStockAlertPopupToggle.open(backInStockAlertPopup);
    }
  }
  function isCurrentFormPosted() {
    return window.location.hash.includes(`#${backInStockAlertFormId}`) && backInStockAlertFormStatus.dataset.formStatus === "posted";
  }
  function closeBackInStockAlertPopup() {
    if (isCurrentFormPosted()) {
      setTimeout(() => {
        backInStockAlertForm.classList.remove(cssClasses2.isPosted);
      }, 400);
      let newUrl = new URL(window.location.href);
      newUrl.hash = "";
      newUrl.searchParams.delete(searchParams.contactPosted);
      newUrl.searchParams.delete(searchParams.contactProductUrl);
      newUrl.searchParams.delete(searchParams.contactMessage);
      newUrl.searchParams.delete(searchParams.formType);
      window.history.replaceState({}, null, newUrl.toString());
    }
  }
  function openBackInStockAlertPopup() {
    section.classList.add(cssClasses2.isNotifyMeActive);
  }
  function setEventBusListeners2() {
    window.themeCore.EventBus.listen(`pdp:section-${sectionId}:change-variant`, onChangeVariant);
    if (!changeVariantIsFired) {
      const productElementJSON = section.querySelector("[data-js-product-json]");
      let productJSON;
      try {
        productJSON = JSON.parse(productElementJSON.innerText);
      } catch {
        productJSON = null;
      }
      if (!productJSON) {
        return;
      }
      if (productJSON.has_only_default_variant) {
        updateFormFields(productJSON.variants[0], productJSON);
        updateBackInStockAlertButton(productJSON.variants[0]);
      }
    }
  }
  function onChangeVariant({ variant, product }) {
    changeVariantIsFired = true;
    if (!variant || !product) {
      return false;
    }
    updateBackInStockAlertButton(variant);
    updateFormFields(variant, product);
  }
  function updateFormFields(variant, product) {
    const variantAvailable = variant.available;
    const variantId = variant.id;
    const productURL = product.url;
    const productTitle = product.title;
    if (variantAvailable || !variantId || !productURL || !productTitle) {
      backInStockAlertFormInputMessage.value = "";
      backInStockAlertFormInputProductURL.value = "";
      return false;
    }
    const variantURL = `${window.location.origin}${productURL}?variant=${variantId}`;
    const backInStockAlertMessage = backInStockAlertFormInputMessage.dataset.backInStockAlertMessage;
    backInStockAlertFormInputMessage.value = backInStockAlertMessage.replace(placeholders.productTitle, productTitle);
    backInStockAlertFormInputProductURL.value = variantURL;
  }
  function updateBackInStockAlertButton(variant) {
    const variantAvailable = variant.available;
    const backInStockAlertButtonWrapper = backInStockAlertButton.closest(selectors2.backInStockAlertButtonWrapper);
    if (variantAvailable) {
      backInStockAlertButton.classList.add(cssClasses2.hidden);
      backInStockAlertButtonWrapper && backInStockAlertButtonWrapper.classList.add(cssClasses2.hidden);
    } else {
      backInStockAlertButton.classList.remove(cssClasses2.hidden);
      backInStockAlertButtonWrapper && backInStockAlertButtonWrapper.classList.remove(cssClasses2.hidden);
    }
  }
  return Object.freeze({
    init: init2
  });
};
const ProductStickyForm = (section) => {
  const on = window.themeCore.utils.on;
  const DEFAULT_HEADER_HEIGHT = 1;
  const STICKY_SCROLL_KOEFICIENT = 100;
  const selectors2 = {
    stickyContainer: ".js-product-sticky-container",
    headerContentWrapper: "[data-header-container]",
    headerSticky: "[data-header-sticky]"
  };
  const breakpoints = {
    afterMedium: 1200
  };
  const stickyContainers = [
    ...section.querySelectorAll(selectors2.stickyContainer)
  ];
  const header = document.querySelector(selectors2.headerContentWrapper);
  const headerHeight = (header == null ? void 0 : header.closest(selectors2.headerSticky)) ? header == null ? void 0 : header.offsetHeight : DEFAULT_HEADER_HEIGHT;
  let windowHeight = window.innerHeight;
  let oldScrollPosition = window.scrollY;
  function init2() {
    if (!stickyContainers.length)
      return;
    const smallerContainer = stickyContainers.reduce(
      (acc, container) => container.offsetHeight > (acc && acc.offsetHeight) ? acc : container
    );
    initStickyContainer(smallerContainer);
  }
  function initStickyContainer(container) {
    if (!container || !section || !header) {
      return;
    }
    container.style.top = headerHeight + "px";
    on("scroll", () => {
      onScroll(container);
    });
  }
  function onScroll(container) {
    if (window.innerWidth < breakpoints.afterMedium) {
      return;
    }
    let containerHeight = container.getBoundingClientRect().height || 0;
    let differentHeights = windowHeight - containerHeight + headerHeight;
    setTimeout(() => {
      let currentScrollPosition = window.scrollY;
      windowHeight = window.innerHeight;
      containerHeight = container.getBoundingClientRect().height || 0;
      if (differentHeights < headerHeight) {
        if (oldScrollPosition > differentHeights) {
          section.style.top = `${windowHeight - containerHeight}px`;
        } else {
          section.style.top = `${oldScrollPosition}px`;
        }
      }
      if (currentScrollPosition > oldScrollPosition) {
        let containerTopPosition = parseInt(
          container.style.top.replace("px", "")
        );
        if (!containerTopPosition) {
          return;
        }
        if (containerTopPosition > windowHeight - containerHeight - Math.ceil(
          container.clientHeight / STICKY_SCROLL_KOEFICIENT
        )) {
          container.style.top = `${containerTopPosition - Math.ceil(
            container.clientHeight / STICKY_SCROLL_KOEFICIENT
          )}px`;
        }
      } else if (currentScrollPosition < oldScrollPosition) {
        let containerTopPosition = parseInt(
          container.style.top.replace("px", "")
        );
        if (!containerTopPosition) {
          return;
        }
        if (containerTopPosition < headerHeight) {
          container.style.top = `${containerTopPosition + Math.ceil(
            container.clientHeight / STICKY_SCROLL_KOEFICIENT
          )}px`;
        }
      }
      oldScrollPosition = window.scrollY;
    }, 0);
  }
  return Object.freeze({
    init: init2
  });
};
const ProductCustomZoomCursor = (container) => {
  const { on, cssClasses: cssClasses2 } = window.themeCore.utils;
  const selectors2 = {
    zoomSlide: ".js-product-gallery-slide-zoom",
    mediaCustomCursor: ".js-product-media-custom-cursor"
  };
  let cursorState = {
    x: null,
    y: null,
    renderX: 0,
    renderY: 0,
    isCursorActive: false,
    transition: 0.3,
    animationFrameId: null
  };
  let customMediaCursor = null;
  function init2() {
    const zoomSlides = [...container == null ? void 0 : container.querySelectorAll(selectors2.zoomSlide)];
    customMediaCursor = container == null ? void 0 : container.querySelector(selectors2.mediaCustomCursor);
    if (!customMediaCursor)
      return;
    zoomSlides.forEach((slide) => {
      on("mouseleave", slide, handleCursorLeave);
    });
    on("mousemove", container, handleCursorMove);
    on("scroll", window, handleScroll);
  }
  function handleScroll() {
    if (cursorState.x === null || cursorState.y === null) {
      return;
    }
    const { left, top, right, bottom } = container.getBoundingClientRect();
    const isCursorInside = cursorState.x >= left && cursorState.x <= right && cursorState.y >= top && cursorState.y <= bottom;
    if (isCursorInside) {
      handleCursorMove({
        clientX: cursorState.x,
        clientY: cursorState.y,
        target: document.elementFromPoint(cursorState.x, cursorState.y)
      });
    } else {
      handleCursorLeave();
    }
  }
  function handleCursorMove(event) {
    const target = event.target.closest(selectors2.zoomSlide);
    if (!target) {
      handleCursorLeave();
      return;
    }
    const { left, top } = container.getBoundingClientRect();
    const cursorX = event.clientX - left;
    const cursorY = event.clientY - top;
    if (!cursorState.isCursorActive) {
      cursorState.renderX = cursorX;
      cursorState.renderY = cursorY;
      updateCursorPosition(cursorX, cursorY);
    }
    cursorState.x = event.clientX;
    cursorState.y = event.clientY;
    cursorState.isCursorActive = true;
    customMediaCursor.classList.add(cssClasses2.active);
    if (!cursorState.animationFrameId) {
      animateCursor();
    }
  }
  function handleCursorLeave() {
    cursorState.isCursorActive = false;
    cursorState.x = null;
    cursorState.y = null;
    customMediaCursor.classList.remove(cssClasses2.active);
    if (cursorState.animationFrameId) {
      cancelAnimationFrame(cursorState.animationFrameId);
      cursorState.animationFrameId = null;
    }
  }
  function animateCursor() {
    if (!cursorState.isCursorActive) {
      cursorState.animationFrameId = null;
      return;
    }
    const { left, top } = container.getBoundingClientRect();
    cursorState.renderX = smoothApproach(cursorState.renderX, cursorState.x - left, cursorState.transition);
    cursorState.renderY = smoothApproach(cursorState.renderY, cursorState.y - top, cursorState.transition);
    updateCursorPosition(cursorState.renderX, cursorState.renderY);
    cursorState.animationFrameId = requestAnimationFrame(animateCursor);
  }
  function updateCursorPosition(x, y) {
    customMediaCursor.style.setProperty("--cursor-x", `${x.toFixed(2)}px`);
    customMediaCursor.style.setProperty("--cursor-y", `${y.toFixed(2)}px`);
  }
  function smoothApproach(start, end, t) {
    return start + (end - start) * t;
  }
  return Object.freeze({
    init: init2
  });
};
const ProductSection = (section) => {
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
    sliderPagination: `.product-media__slider-pagination-${sectionId}`,
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
  let Carousel = null, mediaContainer = null, currentVariant = null, currentVariantId = null;
  const mediaQuery = window.matchMedia("(min-width: 1200px)");
  function init2() {
    mediaContainer = section == null ? void 0 : section.querySelector(selectors2.mediaContainer);
    Carousel = ProductCarousel({
      selectors: carouselSelectors,
      sectionId
    });
    Zoom(section).init();
    BackInStockAlert(section).init();
    ProductStickyForm(section).init();
    if (mediaContainer) {
      updateMedia(mediaQuery);
      on("change", mediaQuery, updateMedia);
      ProductCustomZoomCursor(mediaContainer).init();
    }
    setDrawers();
    initCarousel();
    initModelButtons();
    window.themeCore.EventBus.listen(`product-media:${sectionId}-update-complete`, updateDesktopMediaContainer);
    window.themeCore.EventBus.listen(`pdp:section-${sectionId}:change-variant`, ({ variantId, variant }) => {
      currentVariantId = variantId;
      currentVariant = variant;
    });
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
  function initCarousel() {
    if (!mediaContainer) {
      return;
    }
    const mediaLayout = mediaContainer.dataset.mediaLayout;
    if (!mediaLayout) {
      return;
    }
    if (mediaLayout === "carousel") {
      Carousel.init();
    }
  }
  function updateDesktopMediaContainer() {
    ProductCustomZoomCursor(mediaContainer).init();
  }
  function updateMedia(event) {
    const mediaLayout = mediaContainer.dataset.mediaLayout;
    if (!event)
      return;
    if (event.matches && mediaLayout !== "carousel") {
      Carousel.destroy();
    } else {
      Carousel.init();
      Carousel.onChangeVariant({ variantId: currentVariantId, variant: currentVariant });
    }
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
  slideActive: ".js-product-gallery-slide.swiper-slide-active",
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
  Video = window.themeCore.utils.Video;
  cssClasses = {
    ...window.themeCore.utils.cssClasses,
    pausedVideo: "is-paused-video"
  };
  sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
  ProductForms = ProductForm();
  sections.forEach(initSection);
  ProductForms.init();
  initVideos();
  setEventBusListeners();
}
function initSection(section) {
  const productSection = ProductSection(section);
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
  setTimeout(() => {
    sections.forEach((section) => {
      const slideActive = section.querySelector(selectors.slideActive);
      if (!slideActive) {
        return;
      }
      const slider = slideActive.closest("[data-video-play-autoplay]");
      if (!slider) {
        return;
      }
      const videoEl = slideActive.querySelector(selectors.video);
      videos.forEach(({ player, videoWrapper, type }) => {
        if (videoWrapper === videoEl && type === "html") {
          playVideo(player, type);
        }
      });
    });
  }, 0);
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
    const placeholder = paused.querySelector(selectors.placeholder);
    const videoEl = paused.querySelector(selectors.video);
    pauseVideos(videoEl);
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
function pauseVideos(currentVideo) {
  videos.forEach(({ player, videoWrapper }) => {
    if (videoWrapper === currentVideo) {
      return;
    }
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
const Product = () => {
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.Product = window.themeCore.Product || Product();
  window.themeCore.utils.register(window.themeCore.Product, "product-template");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

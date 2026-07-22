const selectors = {
  section: ".js-product-recommendations",
  content: ".js-product-recommendations-content",
  recommendations: "[data-product-recommendations]",
  recommendationsItems: ".js-product-recommendations-col",
  recommendationsRowWrapper: ".js-product-recommendations-row-wrapper",
  productCard: ".js-product-card",
  existingProduct: "[data-existing-product]",
  sliderButtonPrev: ".js-product-recommendations-slider-button-prev",
  sliderButtonNext: ".js-product-recommendations-slider-button-next"
};
const attributes = {
  id: "id"
};
const PARAMS = {
  section: "section_id",
  limit: "limit",
  product: "product_id",
  view: "view"
};
const ProductRecommendations = () => {
  let Swiper = window.themeCore.utils.Swiper;
  let sections = [];
  const cssClasses = window.themeCore.utils.cssClasses;
  const classes = {
    featuredContentSlider: "js-featured-content-slider",
    isInitialized: "is-initialized",
    ...cssClasses
  };
  async function init(sectionId) {
    sections = setSections(sectionId);
    await Promise.all(sections.map((section) => setupRecommendations(section)));
    sections.forEach((section) => {
      const slider = section.el.querySelector(selectors.recommendationsRowWrapper);
      if (!slider)
        return;
      initSlider(section, slider);
      section.el.classList.remove(classes.loading);
    });
  }
  function initSlider(section, slider) {
    const slidesLength = [...slider.querySelectorAll(selectors.recommendationsItems)].length;
    const sliderPrevButton = section.el.querySelector(selectors.sliderButtonPrev);
    const sliderNextButton = section.el.querySelector(selectors.sliderButtonNext);
    const sliderOptions = {
      grabCursor: true,
      slidesPerView: 2,
      spaceBetween: 12,
      centeredSlides: false,
      roundLengths: true,
      watchOverflow: true,
      navigation: {
        prevEl: sliderPrevButton,
        nextEl: sliderNextButton
      },
      breakpoints: {
        576: {
          slidesPerView: 2
        },
        768: {
          slidesPerView: slidesLength > 3 ? 3.2 : 3
        },
        1200: {
          slidesPerView: 4
        }
      },
      on: {
        init() {
          section.el.classList.add(classes.isInitialized);
        }
      }
    };
    new Swiper(slider, sliderOptions);
  }
  function setSections(sectionId) {
    return [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`)).map((section) => {
      const id = section.getAttribute(attributes.id);
      const requestUrl = window.themeCore.objects.routes.product_recommendations_url;
      const product = section.dataset.productId;
      const limit = section.dataset.limit;
      const enableRecommendations = Boolean(section.closest(selectors.recommendations));
      return {
        el: section,
        id,
        requestUrl,
        product,
        limit,
        enableRecommendations
      };
    });
  }
  async function setupRecommendations(section) {
    if (!section.enableRecommendations) {
      if (!section.limit) {
        return Promise.resolve();
      }
      return Promise.resolve();
    }
    try {
      const url = new URL(window.location.origin + section.requestUrl);
      url.searchParams.set(PARAMS.section, section.id);
      url.searchParams.set(PARAMS.product, section.product);
      url.searchParams.set(PARAMS.limit, section.limit);
      await fetch(url.toString()).then((response) => response.text()).then(async (response) => {
        const html = document.createElement("div");
        html.innerHTML = response;
        const currentRecommendations = section.el.querySelector(selectors.content);
        let recommendations = html.querySelector(selectors.content);
        const recommendationsItems = [...recommendations.querySelectorAll(selectors.recommendationsItems)];
        const recommendationsRowWrapper = recommendations.querySelector(selectors.recommendationsRowWrapper);
        if (!section.limit) {
          const recommendationsExist = !!recommendations.querySelector(selectors.existingProduct);
          if (!recommendationsExist) {
            section.el.remove();
            return;
          }
        }
        if (recommendations && recommendations.innerHTML.trim().length) {
          currentRecommendations.innerHTML = recommendations.innerHTML;
        }
        recommendationsItems && recommendationsItems.length && recommendationsRowWrapper && recommendationsRowWrapper.classList.add(classes.featuredContentSlider);
      }).catch((e) => {
        console.error(e);
      });
    } catch (e) {
      console.error(e);
    }
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.ProductRecommendations = window.themeCore.ProductRecommendations || ProductRecommendations();
  window.themeCore.utils.register(window.themeCore.ProductRecommendations, "product-recommendations");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

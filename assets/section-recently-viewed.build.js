const RecentlyViewed = () => {
  let Swiper = window.themeCore.utils.Swiper;
  const cssClasses = window.themeCore.utils.cssClasses;
  const selectors = {
    section: ".js-recently-viewed",
    slider: ".js-recently-viewed-slider",
    slide: ".js-recently-viewed-slide",
    viewedContent: ".js-recently-viewed-content",
    productCard: ".js-product-card",
    sliderPrevButton: ".js-recently-viewed-slider-button-prev",
    sliderNextButton: ".js-recently-viewed-slider-button-next"
  };
  const attributes = {
    slidesPerRow: "data-slides-in-row"
  };
  const PARAMS = {
    section: "section_id",
    product: "product_id",
    limit: "limit",
    view: "view"
  };
  const classes = {
    isInitialized: "is-initialized",
    ...cssClasses
  };
  async function init(sectionId) {
    const sections = setSections(sectionId);
    await Promise.all(sections.map((section) => initRecentlyViewed(section)));
    sections.forEach((section) => {
      const slider = section.el.querySelector(selectors.slider);
      if (!slider)
        return;
      initSlider(section, slider);
      section.el.classList.remove(classes.loading);
    });
  }
  function initSlider(section, slider) {
    const slidesLength = [...slider.querySelectorAll(selectors.slide)].length;
    const slidesPerViewDesktop = +slider.getAttribute(attributes.slidesPerRow) || 4;
    const sliderPrevButton = section.el.querySelector(selectors.sliderPrevButton);
    const sliderNextButton = section.el.querySelector(selectors.sliderNextButton);
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
          section.el.classList.add(classes.isInitialized);
        }
      }
    };
    new Swiper(slider, sliderOptions);
  }
  function setSections(sectionId) {
    return [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`)).map((section) => {
      const limit = section.dataset.limit;
      const sectionWrapper = section.closest(".shopify-section");
      return {
        el: section,
        sectionWrapper,
        limit
      };
    });
  }
  async function initRecentlyViewed(section) {
    let handles = localStorage.getItem("theme_recently_viewed");
    if (!handles) {
      section.sectionWrapper.remove();
      return;
    }
    try {
      handles = JSON.parse(handles);
      if (window.location.href.includes("/products/")) {
        const url = new URL(window.location.href);
        const pathname = url.pathname;
        const trimmedPathname = pathname.startsWith("/") ? pathname.substring(1) : pathname;
        const currentHandle = trimmedPathname.split("/").pop();
        handles = handles.filter((handle) => handle !== currentHandle);
      }
      handles = handles.slice(-13);
      if (!handles.length) {
        section.sectionWrapper.remove();
        return;
      }
      const productCards = (await getProductCards(handles)).map((promise) => promise.value).filter(Boolean).slice(-1 * +section.limit);
      if (!productCards.length) {
        section.sectionWrapper.remove();
        return;
      }
      const productCols = productCards.map((card) => getWrappedProductCard(card));
      const viewedContent = section.el.querySelector(selectors.viewedContent);
      if (viewedContent) {
        viewedContent.innerHTML = productCols.reduce((acc, col) => acc += col.outerHTML, "");
        section.el.classList.remove(classes.loading);
      }
    } catch (e) {
      section.sectionWrapper.remove();
      console.error(e);
    }
  }
  async function getProductCards(handles) {
    return await Promise.allSettled(handles.map((handle) => getProductCard(handle)));
  }
  async function getProductCard(handle) {
    let url = new URL(`${window.location.origin}${window.themeCore.objects.routes.root_url}/products/${handle}`);
    url.searchParams.set(PARAMS.view, "card");
    return await fetch(url.toString()).then((response) => {
      if (!response.ok) {
        return false;
      }
      return response.text();
    }).then((response) => {
      if (!response) {
        return false;
      }
      const html = document.createElement("div");
      html.innerHTML = response;
      const productCard = html.querySelector(selectors.productCard);
      if (!productCard) {
        return false;
      }
      return html.querySelector(selectors.productCard);
    }).catch((e) => {
      console.error(e);
    });
  }
  function getWrappedProductCard(productCard) {
    const html = document.createElement("div");
    html.innerHTML = `
			<div class="recently-viewed__col swiper-slide js-recently-viewed-slide">
				${productCard.outerHTML}
			</div>
		`;
    return html.querySelector(".recently-viewed__col");
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.RecentlyViewed = window.themeCore.RecentlyViewed || RecentlyViewed();
  window.themeCore.utils.register(window.themeCore.RecentlyViewed, "recently-viewed");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

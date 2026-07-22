const ArticleTemplate = () => {
  const selectors = {
    productsSwiper: ".js-article-products-swiper",
    swiperPrevBtn: ".js-article-swiper-button-prev",
    swiperNextBtn: ".js-article-swiper-button-next",
    readAlsoSwiper: ".js-article-read-also-swiper"
  };
  const attributes = {
    articlesSize: "data-articles-size",
    productsSize: "data-products-size"
  };
  const Swiper = window.themeCore.utils.Swiper;
  async function init() {
    const productsSwiper = document.querySelector(selectors.productsSwiper);
    const readAlsoSwiper = document.querySelector(selectors.readAlsoSwiper);
    const productsSize = +(productsSwiper == null ? void 0 : productsSwiper.getAttribute(attributes.productsSize));
    const articlesSize = +(readAlsoSwiper == null ? void 0 : readAlsoSwiper.getAttribute(attributes.articlesSize));
    const swiperConfig = [
      {
        swiper: productsSwiper,
        slidesPerView: 1,
        spaceBetween: 16,
        breakpoint: {
          768: {
            slidesPerView: 2
          }
        },
        swiperSizeCondition: productsSize > 1
      },
      {
        swiper: readAlsoSwiper,
        slidesPerView: articlesSize > 2 ? 1.25 : 1,
        spaceBetween: 16,
        breakpoint: {
          768: {
            slidesPerView: 3
          },
          1200: {
            slidesPerView: 4,
            spaceBetween: 24
          }
        },
        swiperSizeCondition: articlesSize > 2
      }
    ];
    swiperConfig.map((swiperEl) => {
      const { swiper } = swiperEl;
      const swiperPrevBtn = swiper == null ? void 0 : swiper.querySelector(selectors.swiperPrevBtn);
      const swiperNextBtn = swiper == null ? void 0 : swiper.querySelector(selectors.swiperNextBtn);
      initSlider({ ...swiperEl, swiperPrevBtn, swiperNextBtn });
    });
  }
  function initSlider({ swiper, slidesPerView, spaceBetween, breakpoint, swiperPrevBtn, swiperNextBtn, swiperSizeCondition }) {
    if (!swiper || !swiperSizeCondition)
      return;
    new Swiper(swiper, {
      slidesPerView,
      spaceBetween,
      navigation: {
        nextEl: swiperNextBtn,
        prevEl: swiperPrevBtn
      },
      breakpoints: breakpoint
    });
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.ArticleTemplate = window.themeCore.ArticleTemplate || ArticleTemplate();
  window.themeCore.utils.register(window.themeCore.ArticleTemplate, "article-template");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

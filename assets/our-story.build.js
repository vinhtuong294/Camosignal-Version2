const OurStory = () => {
  const off = window.themeCore.utils.off;
  const on = window.themeCore.utils.on;
  const selectors = {
    section: ".js-our-story",
    item: ".js-our-story-item"
  };
  const animationSpeed = 0.07;
  function init(sectionId) {
    const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
    sections.forEach((section) => {
      const items = [...section.querySelectorAll(selectors.item)];
      if (!items.length) {
        return;
      }
      initIntersectionObserver(section, items);
    });
  }
  function scrollAnimation(items) {
    items.forEach((item) => {
      const offset = window.scrollY - item.offsetTop + window.innerHeight;
      item.style.transform = `translateY(-${offset * animationSpeed}px)`;
    });
  }
  function initIntersectionObserver(section, items) {
    const onScroll = () => scrollAnimation(items);
    const intersectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          on("scroll", document, onScroll);
        } else {
          off("scroll", document, onScroll);
        }
      });
    });
    intersectionObserver.observe(section);
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.OurStory = window.themeCore.OurStory || OurStory();
  window.themeCore.utils.register(window.themeCore.OurStory, "our-story");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

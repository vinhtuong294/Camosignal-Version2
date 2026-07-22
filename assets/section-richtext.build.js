const selectors = {
  section: ".js-richtext",
  button: ".js-rich-text-read-more",
  buttonTextEl: "[data-text]"
};
const RichText = () => {
  const cssClasses = window.themeCore.utils.cssClasses;
  function init(sectionId) {
    const sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
    sections.forEach((section) => {
      const button = section.querySelector(selectors.button);
      if (!button)
        return;
      button.addEventListener("click", () => toggleContent(button));
    });
  }
  function toggleContent(button) {
    const buttonText = {
      readMore: button.getAttribute("data-read-more-text"),
      showLess: button.getAttribute("data-show-less-text")
    };
    const isExpanded = button.getAttribute("aria-expanded");
    const textContent = document.getElementById(button.getAttribute("aria-controls"));
    const buttonTextEl = button.querySelector(selectors.buttonTextEl);
    const buttonTextElChild = buttonTextEl.firstElementChild ?? buttonTextEl;
    if (!textContent) {
      return;
    }
    if (isExpanded === "false") {
      button.setAttribute("aria-expanded", "true");
      button.classList.add(cssClasses.active);
      buttonTextElChild.textContent = buttonText.showLess;
      buttonTextEl.dataset.text = buttonText.showLess;
      textContent.classList.remove("text-section__content--cut-off");
    } else {
      button.setAttribute("aria-expanded", "false");
      button.classList.remove(cssClasses.active);
      buttonTextElChild.textContent = buttonText.readMore;
      buttonTextEl.dataset.text = buttonText.readMore;
      textContent.classList.add("text-section__content--cut-off");
      if (window.innerWidth < 992) {
        textContent.scrollIntoView();
      }
    }
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.RichText = window.themeCore.RichText || RichText();
  window.themeCore.utils.register(window.themeCore.RichText, "richtext");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}

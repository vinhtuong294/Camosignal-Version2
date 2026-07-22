/**
 * Desktop PDP: route wheel based on hovered column.
 * - Hover media: scroll media first; when media reaches edge, scroll form; then let page scroll.
 * - Hover form: scroll form first; when form reaches edge, let page scroll.
 *
 * Goal: force scroll the hovered column reliably (avoid scroll-chaining to page),
 * while keeping form interactions intact.
 */
(() => {
  const DESKTOP_MQ = "(min-width: 1200px)";
  const SECTION_SELECTOR = '[data-section-type="product"]';
  const MEDIA_SELECTOR = ".product-media";
  const FORM_SELECTOR = ".product-form";

  const INTERACTIVE_SELECTOR = [
    "input",
    "select",
    "textarea",
    "button",
    "summary",
    "[contenteditable='true']",
    "[data-prevent-wheel-router]"
  ].join(",");

  function isDesktop() {
    return window.matchMedia && window.matchMedia(DESKTOP_MQ).matches;
  }

  function canScroll(el, deltaY) {
    if (!el) return false;
    const scrollTop = el.scrollTop;
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    if (maxScrollTop <= 1) return false;
    return deltaY > 0 ? scrollTop < maxScrollTop - 1 : scrollTop > 1;
  }

  function getClosestScrollableColumn(target, section) {
    if (!target || !section) return null;
    const media = section.querySelector(MEDIA_SELECTOR);
    const form = section.querySelector(FORM_SELECTOR);
    const inMedia = target.closest(MEDIA_SELECTOR);
    const inForm = target.closest(FORM_SELECTOR);
    if (inMedia && media && media.contains(inMedia)) return { type: "media", el: media };
    if (inForm && form && form.contains(inForm)) return { type: "form", el: form };
    return null;
  }

  function shouldIgnoreEventTarget(target) {
    if (!target || !(target instanceof Element)) return true;
    // Don't hijack wheel over interactive controls (variant picker, qty, ATC, etc.)
    if (target.closest(INTERACTIVE_SELECTOR)) return true;
    // If a modal is open (zoom, drawers), don't interfere
    if (target.closest(".modal.is-open, .modal.is-active, [aria-modal='true']")) return true;
    return false;
  }

  function onWheel(e) {
    if (!isDesktop()) return;
    if (!e || e.defaultPrevented) return;
    // Only care about vertical scroll intent
    const deltaY = e.deltaY;
    if (!deltaY) return;
    const target = e.target;
    if (shouldIgnoreEventTarget(target)) return;

    const section = target.closest(SECTION_SELECTOR);
    if (!section) return;

    const media = section.querySelector(MEDIA_SELECTOR);
    const form = section.querySelector(FORM_SELECTOR);
    if (!media || !form) return;

    const hovered = getClosestScrollableColumn(target, section);
    if (!hovered) return;

    if (hovered.type === "media") {
      // Force scroll media when possible (matches "old theme" expectation on hover).
      if (canScroll(media, deltaY)) {
        e.preventDefault();
        media.scrollTop += deltaY;
        return;
      }

      // Media is at edge → route scroll into form if it can scroll.
      if (canScroll(form, deltaY)) {
        e.preventDefault();
        form.scrollTop += deltaY;
        return;
      }

      // Both at edge → allow page scroll (do nothing).
      return;
    }

    if (hovered.type === "form") {
      // Force scroll form when possible.
      if (canScroll(form, deltaY)) {
        e.preventDefault();
        form.scrollTop += deltaY;
        return;
      }

      // Form at edge → allow page scroll (image will remain sticky).
      return;
    }
  }

  function init() {
    // Ensure we only add one listener
    if (window.__pdpHoverScrollInited) return;
    window.__pdpHoverScrollInited = true;

    // Capture phase helps us decide before browser scroll chaining
    document.addEventListener("wheel", onWheel, { passive: false, capture: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();


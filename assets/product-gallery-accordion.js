/* Preserve the gallery's viewport position while an accordion changes height.
   Native sticky positioning alone re-clamps against the shorter product column
   when a customer closes an accordion near the bottom of that column. */
(() => {
  const desktop = window.matchMedia('(min-width: 992px)');
  let pinned = null;

  function release() {
    if (!pinned) return;
    const { gallery, placeholder } = pinned;
    gallery.classList.remove('product-media--accordion-pinned');
    ['--accordion-gallery-left', '--accordion-gallery-top', '--accordion-gallery-width'].forEach(name => {
      gallery.style.removeProperty(name);
    });
    placeholder.remove();
    pinned = null;
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('.product-accordion summary, .product-accordion [data-accordion-trigger]');
    if (!desktop.matches || !trigger) return;

    const section = trigger.closest('[data-section-type="product"]');
    const gallery = section && section.querySelector('.product-media--layout-carousel');
    if (!gallery || gallery.parentElement !== section.querySelector('.product__container')) return;
    if (pinned && pinned.gallery === gallery) return;
    release();

    const rect = gallery.getBoundingClientRect();
    // Do not bring an offscreen gallery back into view when using the keyboard.
    if (!rect.width || rect.bottom <= 0 || rect.top >= window.innerHeight) return;

    const placeholder = document.createElement('div');
    placeholder.className = 'product-media__accordion-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.cssText = `flex: 0 0 ${rect.width}px; width: ${rect.width}px; height: ${rect.height}px;`;
    gallery.before(placeholder);
    gallery.style.setProperty('--accordion-gallery-left', `${rect.left}px`);
    gallery.style.setProperty('--accordion-gallery-top', `${rect.top}px`);
    gallery.style.setProperty('--accordion-gallery-width', `${rect.width}px`);
    gallery.classList.add('product-media--accordion-pinned');
    pinned = { gallery, placeholder, scrollX: window.scrollX, scrollY: window.scrollY };
  }, true);

  // Resume normal sticky scrolling on the customer's next scroll, rather than
  // treating an accordion's layout change as a request to move the image.
  window.addEventListener('scroll', () => {
    if (pinned && (window.scrollY !== pinned.scrollY || window.scrollX !== pinned.scrollX)) release();
  }, { passive: true });
  window.addEventListener('resize', release, { passive: true });
  desktop.addEventListener('change', release);
  document.addEventListener('shopify:section:unload', release);
  document.addEventListener('shopify:section:load', release);
})();

/* Animate the body below its heading, preserving native details/summary
   behavior when JavaScript is unavailable. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Map();

  function finish(details, state) {
    if (active.get(details) !== state) return;
    details.open = state.expanded;
    state.animation.cancel();
    details.removeAttribute('data-accordion-expanded');
    state.summary.removeAttribute('aria-expanded');
    active.delete(details);
  }

  document.addEventListener('click', event => {
    const summary = event.target.closest('.product-accordion summary');
    if (!summary || event.defaultPrevented) return;
    const details = summary.parentElement;
    if (!details.matches('details.product-inline-details, details.product-review-preview__details')) return;
    if (typeof details.animate !== 'function') return;

    event.preventDefault();
    const previous = active.get(details);
    const expanded = previous ? !previous.expanded : !details.open;
    const startHeight = details.getBoundingClientRect().height;
    if (previous) {
      previous.animation.cancel();
      active.delete(details);
    }

    if (reducedMotion.matches) {
      details.open = expanded;
      details.removeAttribute('data-accordion-expanded');
      summary.removeAttribute('aria-expanded');
      return;
    }

    // Keep the body rendered during collapse so it can slide closed rather
    // than disappearing as soon as the native open attribute is removed.
    details.open = true;
    details.setAttribute('data-accordion-expanded', String(expanded));
    summary.setAttribute('aria-expanded', String(expanded));
    const style = getComputedStyle(details);
    const borderHeight = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const endHeight = expanded
      ? details.getBoundingClientRect().height
      : summary.getBoundingClientRect().height + borderHeight;
    const animation = details.animate([
      { height: `${startHeight}px` },
      { height: `${endHeight}px` }
    ], { duration: 400, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' });
    const state = { expanded, summary, animation };
    active.set(details, state);
    animation.onfinish = () => finish(details, state);
  });

  function finishAll() {
    active.forEach((state, details) => finish(details, state));
  }
  window.addEventListener('resize', finishAll, { passive: true });
  reducedMotion.addEventListener('change', finishAll);
  document.addEventListener('shopify:section:unload', finishAll);
})();

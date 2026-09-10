if (!customElements.get('camo-empty-cart-products')) {
  customElements.define('camo-empty-cart-products', class extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('.cart-empty-recommendations__track');
      this.controls = this.querySelector('.cart-empty-recommendations__controls');
      if (!this.track || !this.controls) return;
      this.controller = new AbortController();
      const options = { signal: this.controller.signal };
      this.previous = this.querySelector('[data-direction="previous"]');
      this.next = this.querySelector('[data-direction="next"]');
      this.controls.hidden = false;
      this.previous.addEventListener('click', () => this.move(-1), options);
      this.next.addEventListener('click', () => this.move(1), options);
      this.track.addEventListener('scroll', () => this.update(), { ...options, passive: true });
      this.resizeObserver = new ResizeObserver(() => this.update());
      this.resizeObserver.observe(this.track);
      this.update();
    }

    disconnectedCallback() {
      this.controller?.abort();
      this.resizeObserver?.disconnect();
    }

    move(direction) {
      const first = this.track.firstElementChild;
      const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(this.track).columnGap || 0);
      const rtl = getComputedStyle(this.track).direction === 'rtl';
      this.track.scrollBy({
        left: direction * step * (rtl ? -1 : 1),
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
      });
    }

    update() {
      if (!this.track.children.length || !this.track.clientWidth) return;
      const offset = Math.abs(this.track.scrollLeft);
      const maxOffset = this.track.scrollWidth - this.track.clientWidth;
      this.previous.disabled = offset <= 2;
      this.next.disabled = offset >= maxOffset - 2;
    }
  });
}

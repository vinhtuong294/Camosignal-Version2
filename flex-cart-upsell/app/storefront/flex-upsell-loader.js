(() => {
  if (window.__flexUpsellCoreRequested) return;
  const loader = document.currentScript;
  if (!loader?.src) return;

  window.__flexUpsellCoreRequested = true;
  const script = document.createElement("script");
  script.src = new URL("flex-upsell-cart-refresh.js", loader.src).href;
  script.async = true;
  script.fetchPriority = "high";
  document.head.appendChild(script);
})();

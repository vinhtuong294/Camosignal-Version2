const {readFileSync} = require('node:fs');
const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const source = readFileSync('sections/product-recommendations.liquid', 'utf8');
function functionSource(name) {
  const start = source.indexOf(`\t\tfunction ${name}(`);
  assert.ok(start >= 0);
  return source.slice(start, source.indexOf('\n\t\tfunction ', start + 1));
}
function setup(count = 10) {
  const slides = [];
  const widgets = [];
  let observerCallback, observerOptions;
  const wrapper = {
    children: slides,
    querySelectorAll: () => slides.slice(),
    appendChild(slide) { slides.splice(slides.indexOf(slide), 1); slides.push(slide); }
  };
  const section = {
    contains: () => false,
    getAttribute: key => ({'data-recommended-limit':'8', 'data-best-seller-limit':'0'}[key] || null),
    querySelector: () => wrapper,
    querySelectorAll: () => slides.slice()
  };
  for (let i = 0; i < count; i++) {
    const classes = new Set(i >= 8 ? ['product-recommendations__candidate-fallback'] : []);
    const slide = {
      handle: `item-${i}`, classes,
      getAttribute: key => ({'data-product-handle':`item-${i}`, 'data-recommendation-source':'related'}[key] || null),
      querySelector: () => null,
      classList: {toggle: (key, enabled) => enabled ? classes.add(key) : classes.delete(key)},
      remove: () => slides.splice(slides.indexOf(slide), 1)
    };
    slides.push(slide);
  }
  const element = attrs => ({getAttribute: key => attrs[key] || null});
  function flexWidget(handle) {
    const attrs = {href:`/products/${handle}?variant=123`};
    const link = element(attrs);
    const widget = {
      ...element({}),
      selector: '.flex-upsell--product-page',
      querySelectorAll: selector => selector.includes('[data-product-card-handle]') ? [link] : []
    };
    widgets.push(widget);
    return {widget, attrs};
  }
  const context = {
    URL,
    document: {body:{}, getElementById: () => section, querySelectorAll: selector => widgets.filter(w => selector.includes(w.selector))},
    window: {location:{origin:'https://example.test'}, MutationObserver:true},
    collectTextTitles: () => {}, addTitleFromElement: () => {},
    applyResponsiveProductLimit: () => {}, refreshRecommendationsSlider: () => {},
    trackRuntimeObserver: observer => observer,
    MutationObserver: class {constructor(callback) {observerCallback = callback;} observe(target, options) {observerOptions = options;}},
    elementMatchesBundleSelector: () => false
  };
  vm.createContext(context);
  const selectorStart = source.indexOf('\t\tvar bundleSelector =');
  vm.runInContext(source.slice(selectorStart, source.indexOf('\t\tvar filterTimer', selectorStart)), context);
  ['normalizeProductHandle','normalizeProductTitle','getProductHandleFromUrl','addHandleFromElement','collectBundleProductMatches','getRecommendationProductHandle','getRecommendationProductTitle','rebalanceRecommendationGroups','filterBundleProductsFromRecommendations','observeBundleWidgets'].forEach(name => vm.runInContext(functionSource(name), context));
  context.requestBundleFilter = () => context.filterBundleProductsFromRecommendations();
  return {context,slides,section,widgets,element,flexWidget,notify: mutation => observerCallback([mutation]),get observerOptions() {return observerOptions;}};
}

test('Flex upsell duplicates are removed from related recommendations and reserves fill eight slots', () => {
  const state = setup();
  state.flexWidget('item-0'); state.flexWidget('item-2');
  assert.equal(state.context.filterBundleProductsFromRecommendations(), true);
  assert.deepEqual(state.slides.map(s=>s.handle), ['item-1','item-3','item-4','item-5','item-6','item-7','item-8','item-9']);
  assert.ok(state.slides.every(s=>!s.classes.has('product-recommendations__candidate-fallback')));
});

test('Late upsell insertion and later product-link changes reapply the exclusion', () => {
  const state = setup(12);
  state.context.observeBundleWidgets();
  assert.equal(state.context.filterBundleProductsFromRecommendations(), false);
  const flex = state.flexWidget('item-1');
  state.notify({target:{closest: () => flex.widget}, addedNodes:[]});
  assert.ok(!state.slides.some(s=>s.handle==='item-1'));
  assert.ok(state.observerOptions.attributeFilter.includes('href'));
  flex.attrs.href = '/collections/hunting/products/item-4?variant=456';
  state.notify({type:'attributes', attributeName:'href', target:{closest: () => flex.widget}, addedNodes:[]});
  assert.ok(!state.slides.some(s=>s.handle==='item-4'));
  assert.equal(state.slides.filter(s=>!s.classes.has('product-recommendations__candidate-fallback')).length, 8);
});

test('Legacy upsell handle-only cards are excluded and an empty section is hidden', () => {
  const state = setup(1);
  state.widgets.push({...state.element({'lb-product-handle':'item-0'}), selector:'lb-upsell-flat-card', querySelectorAll:()=>[]});
  assert.equal(state.context.filterBundleProductsFromRecommendations(), true);
  assert.equal(state.slides.length, 0);
  assert.equal(state.section.hidden, true);
});

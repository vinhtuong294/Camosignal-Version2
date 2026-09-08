(function () {
	'use strict';

	if (window.__camoCustomizationGuardInstalled) return;
	window.__camoCustomizationGuardInstalled = true;

	var config = window.camoCustomizationGuardConfig || {};
	var customizeLabel = config.customizeLabel || 'Customize';
	var requiredMessage = config.requiredMessage || 'Please enter all required personalization details.';
	var productRoute = config.productRoute || '/products/';
	var requirementsByVariant = Object.create(null);
	var scanScheduled = false;

	function clean(value) {
		return value == null ? '' : String(value).trim();
	}

	function registerVariant(id, requirements) {
		id = clean(id);
		if (!id) return;

		var existing = requirementsByVariant[id] || {};
		requirementsByVariant[id] = {
			name: Boolean(existing.name || requirements.name),
			number: Boolean(existing.number || requirements.number),
			productPageOnly: Boolean(existing.productPageOnly || requirements.productPageOnly)
		};
	}

	function registerThemeCustomization(root) {
		var nodes = root.querySelectorAll ? root.querySelectorAll('[data-camo-customization]') : [];

		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			var requirements = {
				name: node.getAttribute('data-requires-name') === 'true',
				number: node.getAttribute('data-requires-number') === 'true',
				productPageOnly: false
			};
			var ids = clean(node.getAttribute('data-variant-ids')).split(',');

			for (var j = 0; j < ids.length; j++) {
				registerVariant(ids[j], requirements);
			}
		}
	}

	function cardRequiresCustomization(card) {
		var handle = clean(card.getAttribute('lb-product-handle')).toLowerCase();
		var title = clean(card.textContent).toLowerCase();
		return handle.indexOf('personalized-') === 0 || title.indexOf('personalized') !== -1;
	}

	function getCardRequirements(card) {
		var handle = clean(card.getAttribute('lb-product-handle')).toLowerCase();
		return {
			name: true,
			number: handle.indexOf('number') !== -1,
			productPageOnly: true
		};
	}

	function getCardVariantId(card) {
		var picker = card.querySelector('select');
		return clean(picker && picker.value) || clean(card.getAttribute('lb-variant-id'));
	}

	function registerCardVariants(card) {
		var requirements = getCardRequirements(card);
		registerVariant(card.getAttribute('lb-variant-id'), requirements);

		var options = card.querySelectorAll('select option');
		for (var i = 0; i < options.length; i++) {
			registerVariant(options[i].value, requirements);
		}
	}

	function enhanceSelleasyCards(root) {
		var cards = root.querySelectorAll ? root.querySelectorAll('lb-upsell-flat-card[lb-product-handle]') : [];

		for (var i = 0; i < cards.length; i++) {
			var card = cards[i];
			if (!cardRequiresCustomization(card)) continue;

			card.setAttribute('data-camo-personalized-guard', 'true');
			registerCardVariants(card);

			var buttons = card.querySelectorAll('lb-button .lb-button, .lb-button[role="button"]');
			for (var j = 0; j < buttons.length; j++) {
				if (clean(buttons[j].textContent) !== customizeLabel) {
					buttons[j].textContent = customizeLabel;
				}
				buttons[j].setAttribute('aria-label', customizeLabel);
			}
		}
	}

	function syncCheckoutState() {
		var invalid = Boolean(document.querySelector('[data-camo-cart-customization-invalid="true"]'));
		var dynamicButtons = document.querySelectorAll('.js-cart-footer-additional-buttons');

		for (var i = 0; i < dynamicButtons.length; i++) {
			dynamicButtons[i].classList.toggle('camo-customization-checkout-hidden', invalid);
			dynamicButtons[i].setAttribute('aria-hidden', invalid ? 'true' : 'false');
		}
	}

	function scan() {
		scanScheduled = false;
		registerThemeCustomization(document);
		enhanceSelleasyCards(document);
		syncCheckoutState();
	}

	function scheduleScan() {
		if (scanScheduled) return;
		scanScheduled = true;
		if (window.requestAnimationFrame) {
			window.requestAnimationFrame(scan);
		} else {
			window.setTimeout(scan, 0);
		}
	}

	function isSelleasyAction(target) {
		return target && target.closest && target.closest('lb-button, .lb-button[role="button"]');
	}

	function guardedCardFromTarget(target) {
		if (!isSelleasyAction(target)) return null;
		var card = target.closest('lb-upsell-flat-card[lb-product-handle]');
		return card && cardRequiresCustomization(card) ? card : null;
	}

	function openCustomizationPage(card) {
		registerCardVariants(card);
		var handle = clean(card.getAttribute('lb-product-handle'));
		if (!handle) return;

		var url = productRoute + encodeURIComponent(handle);
		var variantId = getCardVariantId(card);
		if (variantId) url += '?variant=' + encodeURIComponent(variantId);
		window.location.assign(url);
	}

	document.addEventListener('click', function (event) {
		var card = guardedCardFromTarget(event.target);
		if (card) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			openCustomizationPage(card);
			return;
		}

		var checkout = event.target.closest && event.target.closest('.js-checkout-button, .js-cart-footer-additional-buttons button, .js-cart-footer-additional-buttons [role="button"]');
		if (!checkout || !document.querySelector('[data-camo-cart-customization-invalid="true"]')) return;

		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
		var message = document.querySelector('.cart-footer__customization-error');
		if (message) {
			message.scrollIntoView({ behavior: 'smooth', block: 'center' });
			message.setAttribute('tabindex', '-1');
			message.focus();
		}
	}, true);

	document.addEventListener('keydown', function (event) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		var card = guardedCardFromTarget(event.target);
		if (!card) return;

		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
		openCustomizationPage(card);
	}, true);

	document.addEventListener('change', function (event) {
		var card = event.target.closest && event.target.closest('lb-upsell-flat-card[lb-product-handle]');
		if (card && cardRequiresCustomization(card)) registerCardVariants(card);
	}, true);

	document.addEventListener('submit', function (event) {
		var form = event.target;
		if (!form.querySelector || !form.querySelector('[data-camo-customization]')) return;
		if (form.checkValidity()) return;

		event.preventDefault();
		event.stopImmediatePropagation();
		form.reportValidity();
	}, true);

	function propertyValue(item, name) {
		var properties = item.properties || {};
		return clean(properties[name] != null ? properties[name] : item['properties[' + name + ']']);
	}

	function itemIsMissingCustomization(item) {
		if (!item) return false;
		var requirements = requirementsByVariant[clean(item.id || item.variant_id)];
		if (!requirements) return false;

		if (requirements.name && !propertyValue(item, 'Your Name')) return true;
		if (requirements.number && !propertyValue(item, 'Your Number')) return true;
		if (requirements.productPageOnly && !item.properties) return true;
		return false;
	}

	function formLikeBodyToItem(body) {
		var item = { properties: {} };
		body.forEach(function (value, key) {
			if (key === 'id') item.id = value;
			var match = /^properties\[(.+)\]$/.exec(key);
			if (match) item.properties[match[1]] = value;
		});
		return item;
	}

	function parseCartItems(body) {
		if (!body) return [];

		if (typeof FormData !== 'undefined' && body instanceof FormData) {
			return [formLikeBodyToItem(body)];
		}
		if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
			return [formLikeBodyToItem(body)];
		}

		if (typeof body === 'string') {
			try {
				var parsed = JSON.parse(body);
				return Array.isArray(parsed.items) ? parsed.items : [parsed];
			} catch (error) {
				return [formLikeBodyToItem(new URLSearchParams(body))];
			}
		}

		return [];
	}

	function isCartAddUrl(input) {
		var url = typeof input === 'string' ? input : input && input.url;
		return Boolean(url && /\/cart\/add(?:\.js)?(?:\?|$)/i.test(url));
	}

	function notifyRequired() {
		if (window.themeCore && window.themeCore.CartNotificationError) {
			window.themeCore.CartNotificationError.addNotification(requiredMessage);
			window.themeCore.CartNotificationError.open();
		}
		document.dispatchEvent(new CustomEvent('camo:customization-required', {
			detail: { message: requiredMessage }
		}));
	}

	function blockedResponse() {
		return new Response(JSON.stringify({
			status: 422,
			message: requiredMessage,
			description: requiredMessage
		}), {
			status: 422,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	if (typeof window.fetch === 'function' && typeof window.Response === 'function') {
		var nativeFetch = window.fetch;
		window.fetch = function (input, init) {
			if (isCartAddUrl(input)) {
				var items = parseCartItems(init && init.body);
				for (var i = 0; i < items.length; i++) {
					if (itemIsMissingCustomization(items[i])) {
						notifyRequired();
						return Promise.resolve(blockedResponse());
					}
				}
			}

			return nativeFetch.apply(this, arguments);
		};
	}

	var observer = new MutationObserver(scheduleScan);
	observer.observe(document.documentElement, { childList: true, subtree: true });

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', scan, { once: true });
	} else {
		scan();
	}
})();

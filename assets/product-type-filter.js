(() => {
	if (window.camoProductTypeFilterInitialized) return;
	window.camoProductTypeFilterInitialized = true;

	const productTypeParam = 'filter.p.product_type';
	const typeSeparator = '|||';

	function getLinkTypes(link) {
		const values = link.getAttribute('data-product-types') || link.getAttribute('data-product-type') || '';

		return [...new Set(values.split(typeSeparator).map(value => value.trim()).filter(Boolean))];
	}

	function refreshProductTypeLinks() {
		const activeTypes = new Set(new URL(window.location.href).searchParams.getAll(productTypeParam));

		document.querySelectorAll('.js-clothing-type-link').forEach(link => {
			const linkTypes = getLinkTypes(link);
			const isActive = linkTypes.some(type => activeTypes.has(type));
			link.classList.toggle('filter-list__collection-link--active', isActive);
		});

		document.querySelectorAll('.js-clothing-accordion').forEach(accordion => {
			const accordionBtn = accordion.querySelector('.js-clothing-accordion-btn');
			const accordionContent = accordion.querySelector('.js-clothing-accordion-content');
			const counter = accordion.querySelector('.js-clothing-counter');

			if (activeTypes.size > 0) {
				accordion.classList.add('is-active');
				if (accordionBtn) {
					accordionBtn.classList.add('is-active');
					accordionBtn.setAttribute('aria-expanded', 'true');
				}
				if (accordionContent) {
					accordionContent.style.height = 'auto';
					accordionContent.classList.add('is-active');
				}
				if (counter) counter.style.display = 'inline';
			} else if (counter) {
				counter.style.display = 'none';
			}
		});
	}

	document.addEventListener('click', event => {
		const typeLink = event.target.closest('.js-clothing-type-link');
		if (!typeLink) return;

		event.preventDefault();
		if (typeLink.classList.contains('filter-list__clothing-disabled')) return;

		const typesToApply = getLinkTypes(typeLink);
		if (typesToApply.length === 0) return;

		const form = typeLink.closest('form.js-form') || document.querySelector('form.js-form');
		if (!form) return;

		const activeTypes = new URL(window.location.href).searchParams.getAll(productTypeParam);
		const isExactActiveGroup = activeTypes.length === typesToApply.length
			&& typesToApply.every(type => activeTypes.includes(type));

		form.querySelectorAll(`input[name="${productTypeParam}"]`).forEach(input => {
			input.checked = false;
		});

		if (!isExactActiveGroup) {
			typesToApply.forEach(type => {
				let input = Array.from(form.querySelectorAll(`input[name="${productTypeParam}"]`))
					.find(candidate => candidate.value === type);

				if (!input) {
					input = document.createElement('input');
					input.className = 'js-appended-hidden-filter';
					input.type = 'checkbox';
					input.name = productTypeParam;
					input.value = type;
					input.style.display = 'none';
					form.appendChild(input);
				}

				input.disabled = false;
				input.checked = true;
			});
		}

		form.dispatchEvent(new Event('change', { bubbles: true }));
	});

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', refreshProductTypeLinks, { once: true });
	} else {
		refreshProductTypeLinks();
	}
})();

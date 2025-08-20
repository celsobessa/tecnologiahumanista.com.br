/**
 * Kelp UI v1.1.0 - Custom Download
 * https://kelpui.com/docs/tools/install/?features=core+lcon+lcls+lgrd+lsdc+lspl+lstk+nbar+nsbn+ccal+chan+ctoc+uai+uar+udiv+ufil+uflx+ugap+uha+ujc+umar+upad+usa+utxt+usz+uviz
 */

(() => {

/**
 * Emit a debug event
 * @param  {Element} elem   The element with errors
 * @param  {String}  detail The error details
 */
 function debug (elem, detail = '') {

	// Create a new event
	const event = new CustomEvent('kelp:debug', {
		bubbles: true,
		detail
	});

	// Dispatch the event
	return elem.dispatchEvent(event);

}

/**
 * Emit a custom event
 * @param  {Element} elem       The custom element to emit the event on
 * @param  {String}  component  The name of the component
 * @param  {String}  id         The event ID
 * @param  {*}       detail     Any details about the event (optional)
 * @param  {Boolean} cancelable If true, event can be cancelled
 */
 function emit (elem, component, id, detail = null, cancelable = false) {

	// Create a new event
	const event = new CustomEvent(`kelp-${component}:${id}`, {
		bubbles: true,
		cancelable,
		detail
	});

	// Dispatch the event
	return elem.dispatchEvent(event);

}

/**
 * Run .init() method after DOM is ready
 * @param  {KelpWCInstance} instance The component class instance
 */
 function ready (instance) {
	if (document.readyState !== 'loading') {
		instance.init();
		return;
	}
	document.addEventListener('DOMContentLoaded', () => instance.init(), {once: true});
}

/**
 * Restore properties and behaviors when reconnected to the DOM
 * Only runs if element is currently ready but paused
 * @param  {KelpWCInstance} instance The component class instance
 * @param  {Function}       callback A function to run reinit activities
 * @return {Boolean}                 If true, component is already initialized
 */
 function reinit (instance, callback) {

	// Make sure function should run
	if (!instance.hasAttribute('is-ready')) return false;
	if (!instance.hasAttribute('is-paused') || typeof callback !== 'function') return true;

	// Run callback and remove paused state
	callback();
	instance.removeAttribute('is-paused');

	return true;

}

/**
 * Convert element text into a valid ID and set it on the element
 * @param  {Element} elem The heading element
 */
 function setTextAsID (elem) {

	// If the element already has an ID, nothing else to do
	if (elem.id) return;

	// Generate the ID string
	const id = elem.textContent?.replace(/[^a-zA-Z0-9-_\u00A0-\uFFEF\s-]/g, '-').replace(/[\s-]+/g, '-');
	if (!id) return;

	// Make sure it's not already in use
	let suffix = 0;
	let existing = document.querySelector(`#kelp_${id}`);
	while (existing) {
		suffix++;
		existing = document.querySelector(`#kelp_${id}_${suffix}`);
	}

	// Set the ID on the element
	elem.id = `kelp_${id}${suffix ? `_${suffix}` : ''}`;

}

customElements.define('kelp-subnav', class extends HTMLElement {

	// Initialize on connect
	connectedCallback () {
		ready(this);
	}

	// Cleanup global events on disconnect
	disconnectedCallback () {
		document.removeEventListener('click', this);
		document.removeEventListener('keydown', this);
		this.setAttribute('is-paused', '');
	}

	// Initialize the component
	init () {

		// Don't run if already initialized
		const isInit = reinit(this, () => this.#listen());
		if (isInit) return;

		// Only run if there's a subnav to close
		if (!this.querySelector('details')) {
			debug(this, 'No subnav was found');
			return;
		}

		// Listen for click and keyboard events
		this.#listen();

		// Ready
		emit(this, 'subnav', 'ready');
		this.setAttribute('is-ready', '');

	}

	// Setup event listeners
	#listen () {
		document.addEventListener('click', this);
		document.addEventListener('keydown', this);
	}

	/**
	 * Handle events
	 * @param  {Event} event The event object
	 */
	handleEvent (event) {
		if (event.type === 'click') {
			return this.#onClick();
		}
		this.#onKeydown(event);
	}

	/**
	 * Handle click events
	 */
	#onClick () {

		// Get all open subnav's that aren't currently focused
		const navs = this.querySelectorAll('details[open]:not(:focus-within)');

		// Close them
		for (const nav of navs) {
			nav.removeAttribute('open');
		}

	}

	/**
	 * Handle keydown events
	 * @param  {Event} event The event object
	 */
	#onKeydown (event) {

		// Only run on keyboard events
		if (!(event instanceof KeyboardEvent)) return;

		// Only run if pressed key was Escape
		if (event.key !== 'Escape') return;

		// Get all open subnav's
		const navs = this.querySelectorAll('details[open]');

		// Close them
		// If focus is inside it, shift focus to toggle
		for (const nav of navs) {
			const hasFocus = nav.matches(':has(:focus)');
			nav.removeAttribute('open');
			if (hasFocus) {
				const summary = nav.querySelector('summary');
				summary?.focus();
			}
		}

	}

});

customElements.define('kelp-heading-anchors', class extends HTMLElement {

	/** @type String */  #icon
	/** @type String */  #levels;
	/** @type Boolean */ #before;

	// Initialize on connect
	connectedCallback () {
		ready(this);
	}

	// Initialize the component
	init () {

		// Don't run if already initialized
		if (this.hasAttribute('is-ready')) return;

		// Get settings
		this.#icon = this.getAttribute('icon') || '#';
		this.#levels = this.getAttribute('levels') || 'h2, h3, h4, h5, h6';
		this.#before = this.hasAttribute('before');

		// Render
		if (!this.render()) {
			debug(this, 'No matching headings were found');
			return;
		}

		// Ready
		emit(this, 'heading-anchors', 'ready');
		this.setAttribute('is-ready', '');

	}

	// Render the anchor links
	render () {

		// Get the headings
		const headings = this.querySelectorAll(this.#levels);
		if (!headings.length) return;

		for (const heading of headings) {

			// Store original heading and add class
			heading.classList.add('anchor-h');

			// Add missing IDs
			setTextAsID(heading);

			// Create anchor content
			const text = `<span class="anchor-text">${heading.innerHTML}</span>`;
			const icon = `<span class="anchor-icon" aria-hidden="true">${this.#icon}</span>`;

			// Inject the link
			heading.innerHTML =
				`<a class="anchor-link" href="#${heading.id}">
					${this.#before ? `${icon} ${text}` : `${text} ${icon}`}
				</a>`;

		}

		return true;

	}

});

customElements.define('kelp-toc', class extends HTMLElement {

	/** @type Boolean */       #nested;
	/** @type String */        #level;
	/** @type String | null */ #heading;
	/** @type String | null */ #headingType;
	/** @type String */        #target;
	/** @type String | null */ #listClass;
	/** @type String */        #listType;
	/** @type Object */	       #index;

	// Initialize on connect
	connectedCallback () {
		ready(this);
	}

	// Initialize the component
	init () {

		// Don't run if already initialized
		if (this.hasAttribute('is-ready')) return;

		// Get settings
		this.#nested = this.hasAttribute('nested');
		this.#level = this.getAttribute('level') || (this.#nested ? 'h2, h3, h4, h5, h6' : 'h2');
		this.#heading = this.getAttribute('heading');
		this.#headingType = this.getAttribute('heading-type') || (this.#nested ? 'h2' : 'li');
		this.#target = this.getAttribute('target') || '';
		this.#listClass = this.getAttribute('list-class') || (this.#nested ? null : 'list-inline');
		this.#listType = this.getAttribute('list-type') || 'ul';
		this.#index = 0;

		// Render
		if (!this.render()) {
			debug(this, 'No matching headings were found');
			return;
		}

		// Ready
		emit(this, 'toc', 'ready');
		this.setAttribute('is-ready', '');

	}

	// Render the TOC
	render () {

		// Get matching headings
		const headings = document.querySelectorAll(`${this.#target} :is(${this.#level})`);
		if (!headings.length) return;

		// Create TOC
		this.innerHTML = this.#createList(headings, true);

		return true;

	}

	/**
	 * Create the list HTML
	 * Runs recursively on nested ToCs
	 * @param  {NodeList} headings The headings to generate the list from
	 * @param  {Boolean}  isFirst  If true, this is the start of the list
	 * @return {String}            The HTML string
	 */
	#createList (headings, isFirst = false) {

		// Define or update this.#indexue
		this.#index = isFirst ? 0 : this.#index + 1;

		// Create HTML string
		let list = '';
		for (; this.#index < headings.length; this.#index++) {

			// Get the heading element
			const heading = /** @type {Element} */ (headings[this.#index]);

			// If there's no heading, create one
			setTextAsID(heading);

			// Get the current and next heading levels
			const currentLevel = heading.tagName.slice(1);

			// Append the HTML
			// If nested and next heading is smaller than current, run recursively
			list +=
				`<li>
					<a class="link-subtle" href="#${heading.id}">${heading.textContent}</a>
					${this.#nested && (/** @type {Element} */ (headings[this.#index + 1])?.tagName.slice(1) || currentLevel) > currentLevel ? this.#createList(headings) : ''}
				</li>`;

			// If next heading is bigger, finish this list
			if (!isFirst && (/** @type {Element} */ (headings[this.#index + 1])?.tagName.slice(1) || currentLevel) < currentLevel) break;

		}

		// Check if a heading should be rendered
		const renderHeading = isFirst && this.#heading;

		return `
			${renderHeading && this.#headingType !== 'li' ? `<${this.#headingType}>${this.#heading}</${this.#headingType}>`: ''}
			<${this.#listType} ${this.#listClass ? `class="${this.#listClass}"` : ''}>
				${renderHeading && this.#headingType === 'li' ?  `<li><strong>${this.#heading}</strong></li>` : ''}
				${list}
			</${this.#listType}>`;

	}

});

})();
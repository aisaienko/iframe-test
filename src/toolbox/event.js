/* eslint max-params: off */
const registeredListeners = {};
let hasCustomEventSupport = false;
const usedNativeEventsList = [
    'change', 'click', 'keydown', 'keypress', 'keyup',
    'mouseenter', 'mouseleave', 'mousemove', 'mouseup', 'mousedown', 'mouseover', 'mouseout',
    'touchmove', 'touchstart', 'touchend', 'dragstart', 'wheel',
    'focus', 'focusout', 'focusin', 'blur', 'copy', 'paste', 'drag', 'drop',
    'input', 'invalid', 'submit', 'reset', 'scroll',
    'play', 'ended', 'pause', 'loadeddata', 'seeked',
    'beforeunload', 'hashchange',
];

/**
 * Check if event is native or not against known list of used native events
 * @param {String} eventName - Event Name
 * @returns {Boolean} - Return true if event is native and false otherwise
 */
function isNativeEvent(eventName) {
    return usedNativeEventsList.indexOf(eventName.split('.')[0]) !== -1;
}

/**
 *
 * @param {String} eventName - Event Name
 * @param {HTMLElement} target - Element where the event needs to be binded
 * @param {Function} fn Event handler function
 * @param {Object|Boolean} options // Can be an options or a boolean (useCapture)
 * @param {Boolean} one // Event is attached once
 * see doc: https://developer.mozilla.org/fr/docs/Web/API/EventTarget/addEventListener
 */
function registerListener(eventName, target, fn, options, one) {
    const {
        eventId,
    } = target;

    if (one) {
        const originalFunction = fn;
        fn = (args) => {
            // if we listen only once, we can remove the event listener right after the callback is executed
            target.removeEventListener(eventName, fn, options);
            return originalFunction(...args);
        };
    } else {
        // We don't register the event if it's only triggered once.
        if (!registeredListeners[eventId]) {
            registeredListeners[eventId] = {};
        }

        registeredListeners[eventId][eventName] = {
            fn,
            target,
            options,
        };
    }

    // Event can be namespaced. ie. click.search
    // As such, performing check against list of used native events to determine if event is custom or not
    if (isNativeEvent(eventName)) {
        [eventName] = eventName.split('.');
    }

    target.addEventListener(eventName, fn, options);
}

/**
 *
 * @param {String} eventName - Event Name
 * @param {HTMLElement} target - Element where the event needs to be binded
 * @param {Function} fn Event handler function
 * @param {Object|Boolean} options // Can be an options or a boolean (useCapture)
 */
function removeEvent(eventName, target, fn, options) {
    const {
        eventId,
    } = target;
    const registeredId = registeredListeners[eventId];
    const listener = registeredId[eventName];

    if (typeof fn === 'function') {
        listener.fn = fn;
    }

    if (eventId && registeredId && listener) {
        delete registeredListeners[eventId][eventName];
        // Event can be namespaced
        // As such, performing check against list of used native events to determine if event is custom or not
        if (isNativeEvent(eventName)) {
            [eventName] = eventName.split('.');
        }
        listener.target.removeEventListener(eventName, listener.fn, options);
    }
}

/**
 *
 * @param {String} eventName - Event Name
 * @param {HTMLElement} target - Element where the event needs to be binded
 * @param {Function} fn Event handler function
 * @param {Object|Boolean} options // Can be an options or a boolean (useCapture)
 * see doc: https://developer.mozilla.org/fr/docs/Web/API/EventTarget/removeEventListener
 */
function removeEventListener(eventName, target, fn, options = false) {
    const {
        eventId,
    } = target;
    const registeredId = registeredListeners[eventId];

    if (!registeredId) {
        throw new Error('Do not remove event that has not been attached', target);
    }

    if (eventName === 'all') {
        Object.keys(registeredId).forEach((event) => {
            const element = registeredId[event];
            if (element) {
                element.options = options;
                removeEvent(event, element.target, element.fn, element.options);
            }
        });
    } else {
        removeEvent(eventName, target, fn, options);
    }
}

/**
 * Check if event is already attached to an element
 * @param {HTMLElement} target - Element where the event needs to be binded
 * @param {String} eventName - Event Name
 * @returns {Boolean} - Return true if event is already attached and false if not
 */
function isEventAttached(target, eventName) {
    const {
        eventId,
    } = target;
    // Check if listener is already registered or not to an element

    if (eventId && registeredListeners[eventId] && registeredListeners[eventId][eventName]) {
        console.warn(new Error(`The same event (${eventName}) has been already attached to the element: ${target}`));
        return true;
    }

    return false;
}

/**
 * Add polyfill for older browser that doesn't support customEvent
 */
function addCustomEventPolyfill() {
    if (typeof window.CustomEvent === 'function') {
        hasCustomEventSupport = true;
        return;
    }

    /**
     * Init the custom event
     * @param {String} event - Event to be binded
     * @param {Object} params - Options of the event
     * @returns {Event} - Event object
     */
    function CustomEvent(event, params) {
        params = params || {
            bubbles: false,
            cancelable: false,
            detail: undefined,
        };
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
    hasCustomEventSupport = true;
}

/**
 * Attach event to an HTMLElement or NodeList
 * @param {string} eventName - Name of the event.
 * @param {HTMLElement | Nodelist} target - Can be either a selector or a list of selectors
 * @param {function} fn - Listener function
 * @param {object} options - An options object that specifies characteristics about the event listener. The available options are:
 * @param {Boolean} one - event is attached only once and removed after being listened
 * capture, once, passive. See more info: (https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
 */
export function on(eventName, target, fn, options = {}, one) {
    if (typeof eventName !== 'string') {
        throw new Error('eventName has to be a string', target);
    }

    if (!target) {
        throw new Error('Element is required. It can be an HTMLElement or a NodeList');
    }

    if (typeof fn !== 'function') {
        throw new Error('Handler function is mandatory', target);
    }

    // Generate and attribute an ID for the element

    // A eventName can be also a list of many event separated by a space like jQuery
    const events = eventName.split(' ');
    let targets = [];

    if (target instanceof HTMLElement
        || target instanceof window.Window
        || target instanceof window.Document) {
        targets = [target];
    } else if (target instanceof NodeList) {
        targets = [...target];
    }

    events.forEach((event) => {
        targets.forEach((targetElement) => {
            if (!isEventAttached(targetElement, event)) {
                const eventId = targetElement.eventId || `event_${Math.random().toString(36).substr(2, 16)}`;
                targetElement.eventId = eventId;
                registerListener(event, targetElement, fn, options, one);
            }
        });
    });
}

/**
 * Attach event once
 * @param {string} eventName - Name of the event.
 * @param {HTMLElement | Nodelist} target - Can be either a selector or a list of selectors
 * @param {function} fn - Listener function
 * @param {object} options - An options object that specifies characteristics about the event listener. The available options are:
 */
export function once(eventName, target, fn, options = {}) {
    options = Object.assign(options, {
        once: true,
    });
    on(eventName, target, fn, options, true);
}

/**
 * Remove event listeners from an element
 * @param {string} eventName - Name of the event.
 * @param {HTMLElement | Nodelist} target - Can be either a selector or a list of selectors
 * @param {function} fn - Listener function
 * @param {boolean} capture - If true, forces bubbling on non-bubbling events
 */
export function off(eventName, target, fn, capture = false) {
    // If there is only one param and if it not a eventName. We consider that we should remove all the listeners
    // from that selector(s).
    if (eventName && typeof eventName !== 'string' && arguments.length === 1) {
        target = eventName;
        eventName = 'all';
    }

    const events = eventName.split(' ');
    events.forEach((event) => {
        if (target instanceof HTMLElement
            || target instanceof window.Window
            || target instanceof window.Document
        ) {
            removeEventListener(event, target, fn, capture);
        } else if (target instanceof NodeList) {
            [...target].forEach((nodeElement) => {
                removeEventListener(event, nodeElement, capture);
            });
        } else {
            throw new Error('HTMLElement or Nodelist is required');
        }
    });
}

/**
 * Trigger event
 * @param {string} eventName - Name of the event.
 * @param {HTMLElement|Nodelist} element - Can be either a selector or a list of selectors
 * @param {Object} options see options info: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
 *
 */
export function trigger(eventName, element, options = {}) {
    if (!hasCustomEventSupport) {
        addCustomEventPolyfill();
    }

    const event = new CustomEvent(eventName, {
        bubbles: options.bubbles || false,
        cancelable: options.cancelable || false,
        detail: options,
    });
    element.dispatchEvent(event);
}

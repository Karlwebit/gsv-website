/**
 * Trigger an event on an element.
 * @module trigger-event
 * @exports triggerEvent
 * @public
 * @version 1.0.0
 * @author frontend@webit.de
 * @see https://developer.mozilla.org/en-US/docs/Web/Events
 */

'use strict';

/**
 * @function triggerEvent
 * @param {Object} element - The element where we want to trigger an event
 * @param {string} type - The type of the event
 */
export function triggerEvent (element, type) {
  /** @type {Object} */
  let event;

  if (typeof window.CustomEvent === 'function') {
    event = new CustomEvent(type);
  } else {
    /** This is used for old Internet Explorer versions. */
    /** @deprecated */
    event = document.createEvent('CustomEvent');
    event.initCustomEvent(type, false, true, null);
  }

  element.dispatchEvent(event);
}

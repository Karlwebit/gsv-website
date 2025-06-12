/**
 * Debounce a specified function to avoid multiple unnecessary calls.
 * @module debounce
 * @exports debounce
 * @public
 * @version 1.0.0
 * @author frontend@webit.de
 * @example
 * eventTarget.addEventListener('keydown', CORE.debounce((event) => {
 *   // do the Ajax request
 * }, 250));
 * @see https://remysharp.com/2010/07/21/throttling-function-calls
 */

'use strict';

/**
 * @function debounce
 * @param {!Function} func - The function that should be executed with a debounce
 * @param {number=} delay - Time in milliseconds until the function will be fired
 * @param {string=} scope - The context of the fired function
 */
export function debounce(func, delay = 250, scope = this) {
  /** @type {Object} */
  let timer = null;

  return function () {
    /** @type {Object} */
    const ARGS = arguments;

    clearTimeout(timer);
    timer = setTimeout(() => func.apply(scope, ARGS), delay);
  };
}

 /**
 * Throttle a specified function to avoid multiple unnecessary calls.
 * @module throttle
 * @exports throttle
 * @public
 * @version 1.0.0
 * @author frontend@webit.de
 * @example
 * eventTarget.addEventListener('keydown', CORE.throttle(event => {
 *   // do a fancy animation
 * }, 250));
 * @see https://remysharp.com/2010/07/21/throttling-function-calls
 */

'use strict';

/**
 * @function throttle
 * @param {!Function} func - The function that should be executed within a throttle
 * @param {number=} threshold - Time in milliseconds until the function will be fired
 * @param {string=} scope - The context of the fired function
 */
export function throttle(func, threshold = 250, scope = this) {
  /** @type {number} */
  let last;
  /** @type {Object} */
  let defer_timer;

  return function () {
    /** @type {number} */
    let now = +new Date;
    /** @type {Object} */
    const ARGS = arguments;

    if (last && now < last + threshold) {
      clearTimeout(defer_timer);
      defer_timer = setTimeout(() => {
        last = now;
        func.apply(scope, ARGS);
      }, threshold);
    } else {
      last = now;
      func.apply(scope, ARGS);
    }
  }
}

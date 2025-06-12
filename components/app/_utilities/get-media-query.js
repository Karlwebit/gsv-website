/**
 * Get HTML font family for current viewport.
 * @module get-media-query
 * @exports getMediaQuery
 * @public
 * @version 1.0.0
 * @author frontend@webit.de
 */

'use strict';

/**
 * @function getMediaQuery
 * @return {string}
 */
export function getMediaQuery() {
  /** @type {!Object} */
  const regex = new RegExp('[\'",]', 'g');
  /** @type {string} */
  let media_query;

  if (window.getComputedStyle) {
    media_query = window
                    .getComputedStyle(document.documentElement, null)
                    .getPropertyValue('font-family');
  }

  media_query = media_query.replace(regex, '');

  return media_query;
}

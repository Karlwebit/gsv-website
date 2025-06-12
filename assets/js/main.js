/**
 * Main entry point into all JavaScript.
 * @module main
 * @requires debounce
 * @requires throttle
 * @requires trigger-event
 * @author frontend@webit.de
 */

'use strict';

// Self-written modules
import { debounce } from './_utilities/debounce.js';
import { throttle } from './_utilities/throttle.js';
import { triggerEvent } from './_utilities/trigger-event.js';
import InitSliderHero from "./swiper-slider/swiper-slider.js";
import InitImageZoom from "./image-zoom/image-zoom.js";
import InitSliderTestimonial from "./landing-page/landing-page.js";
import InitMenuOverlayPhone from "./header/header.js";


/**
 * Binds all events to DOM objects.
 * @function bindEvents
 */
function bindEvents() {
  window.addEventListener('resize',
    debounce(() => triggerEvent(window, 'resize:smart'), 250));
  window.addEventListener('scroll',
    throttle(() => triggerEvent(window, 'scroll:smart'), 250));
}

/**
 * Caches all objects for later use.
 * @function cacheElements
 */
function cacheElements() {

}

function init() {
  cacheElements();
  bindEvents();
  InitSliderHero();
  InitImageZoom();
  InitSliderTestimonial();
  InitMenuOverlayPhone();
};

init();
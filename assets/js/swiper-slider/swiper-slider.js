function SliderHero() {
  // 1. Try to find the slider element
  const sliderElement = document.querySelector('.hero-slider');

  // 2. Check if the element was found
  //    If document.querySelector doesn't find anything, it returns null.
  //    An if (element) checks if element is not null, undefined, false, 0, or ''.
  if (sliderElement) {
    // --- The element exists - Proceed with initialization ---
    console.log("'.hero-slider' found. Initializing Swiper..."); // Helpful for debugging

    const HeroSwiper = new Swiper(sliderElement, { // Use the found element directly
      direction: 'horizontal',
      centeredSlides: true,
      slidesPerView: 1,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.hero-pagination', // Important: Ensure this element also exists if the slider exists!
        clickable: true,
      },
      // Optional: Add an event listener in case Swiper itself throws errors
      // on: {
      //   init: function () {
      //     console.log('HeroSwiper initialized');
      //   },
      //   slideChange: function () {
      //     console.log('HeroSwiper slide changed');
      //   },
      // },
    });

    let isPlaying = true;

    // Find the pause buttons. It makes sense to do this only if the slider exists.
    document.querySelectorAll('.swiper-slider-pause').forEach(button => {
      // Ensure HeroSwiper exists before accessing it (should be guaranteed by the if block above)
      button.addEventListener('click', function () {
        if (isPlaying) {
          HeroSwiper.autoplay.stop();
          this.textContent = '▶'; // Play symbol
          console.log('Swiper was stopped');
        } else {
          HeroSwiper.autoplay.start();
          this.textContent = '⏸'; // Pause symbol
          console.log('Swiper runs again');
        }
        isPlaying = !isPlaying;
      });
    });

    // Intersection Observer for autoplay - also only initialize if the slider exists
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Check if HeroSwiper was initialized before accessing it
        if (!HeroSwiper || !HeroSwiper.autoplay) return;

        if (entry.isIntersecting) {
          // Only start if isPlaying is true (i.e., the user hasn't manually paused)
          if (isPlaying) {
            HeroSwiper.autoplay.start();
            console.log('Swiper is visible - autoplay running');
          } else {
             console.log('Swiper is visible - autoplay manually paused');
          }
        } else {
          // Stop autoplay if the slider is not visible
          HeroSwiper.autoplay.stop();
          console.log('Swiper not visible - autoplay paused');
        }
      });
    }, { threshold: 0.2 }); // At least 20% of the slider must be visible

    observer.observe(sliderElement); // Observe the found slider element

  } else {
    // --- The element does NOT exist - Do nothing or log a message ---
    console.log("Element '.hero-slider' not found on this page. Skipping SliderHero initialization.");
    // No explicit 'return' needed, the function simply ends here.
  }
}


// Swiper initialize
// This function is always called, but SliderHero decides internally whether there's anything to do.
export default function init() {
  SliderHero();
  // Here you could call other initialization functions,
  // which should perhaps also have such internal checks.
  // AnotherFeatureInit();
}
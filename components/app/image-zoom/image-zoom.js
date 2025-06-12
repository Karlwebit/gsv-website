function imagezoom() {
  // Select all thumbnails
  const thumbnails = document.querySelectorAll('.thumbnail img');
  // Select the overlay element and the image inside it
  const overlay = document.getElementById('image-overlay');
  const overlayImage = document.getElementById('overlay-image');
  // Select the close button in the overlay
  const closeBtn = document.querySelector('.close-btn');

  // --- PRE-CHECK: Ensure all necessary overlay elements exist ---
  // If any of these are missing, the image zoom feature cannot work on this page.
  if (!overlay || !overlayImage || !closeBtn) {
    console.log("Image zoom essential elements (overlay, overlayImage, or closeBtn) not found. Skipping initialization.");
    return; // Stop executing the imagezoom function
  }

  // --- If we reach here, all essential overlay elements exist ---
  console.log("Image zoom elements found. Initializing listeners.");

  /**
   * Opens the overlay and loads the larger image source.
   * The overlay only opens if the window width is > 500px.
   * @param {Event} event - The click event from the thumbnail.
   */
  function openOverlay(event) {
    // Check if the window width is <= 500px
    if (window.innerWidth <= 500) {
      return; // Do not open the overlay
    }

    const img = event.target;
    // Use the data-large attribute or, if not present, the current src
    const largeSrc = img.getAttribute('data-large') || img.src;
    overlayImage.src = largeSrc; // Safe now because we checked overlayImage exists
    overlay.classList.remove('hidden'); // Safe now because we checked overlay exists
  }

  /**
   * Closes the overlay and clears the image content.
   */
  function closeOverlay() {
    overlay.classList.add('hidden'); // Safe now
    overlayImage.src = '';           // Safe now
  }

  // Add a click event to each thumbnail
  // Only proceed if there are actually thumbnails found
  if (thumbnails.length > 0) {
     thumbnails.forEach(thumbnail => {
       thumbnail.addEventListener('click', openOverlay);
     });
  } else {
      console.log("No thumbnail images found for image zoom.");
  }


  // Close the overlay via the button (Safe: closeBtn exists)
  closeBtn.addEventListener('click', closeOverlay);

  // Close the overlay when the ESC key is pressed
  document.addEventListener('keydown', function (e) {
    // Check if overlay exists and is visible before trying to access its classList
    if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
      closeOverlay();
    }
  });

  // Optional: Close the overlay when clicking on the background (overlay itself) (Safe: overlay exists)
  overlay.addEventListener('click', function (e) {
    // Check if the click target is the overlay element itself, not a child (like the image)
    if (e.target === overlay) {
      closeOverlay();
    }
  });
};

export default function init() {
  imagezoom(); // This will now internally check if elements exist
}
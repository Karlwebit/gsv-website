function MenuOverlayPhone() {
    // Get DOM elements
    const menuToggle = document.getElementById("menu-toggle");
    const hamburgerMenu = document.querySelector(".hamburger-menu");
    const menuOverlay = document.getElementById("menu-overlay");
    const closeButton = document.querySelector(".close-menu-overlay");
  
    // Track menu state
    let isMenuOpen = false;
  
    // Initialize the menu
    function init() {
      setupEventListeners();
      updateMenuState();
    }
  
    // Set up all event listeners
    function setupEventListeners() {
      // Hamburger button
      hamburgerMenu.addEventListener("click", handleHamburgerClick);
      hamburgerMenu.addEventListener("keydown", handleHamburgerKeydown);
  
      // Close button
      closeButton.addEventListener("click", handleCloseClick);
      closeButton.addEventListener("keydown", handleCloseKeydown);
  
      // Menu overlay
      menuOverlay.addEventListener("keydown", handleOverlayKeydown);
  
      // Menu links
      const menuLinks = menuOverlay.querySelectorAll("a");
      menuLinks.forEach(link => {
        link.addEventListener("click", handleLinkClick);
      });
    }
  
    // Event handlers
    function handleHamburgerClick() {
      toggleMenu();
    }
  
    function handleHamburgerKeydown(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleMenu();
      }
    }
  
    function handleCloseClick() {
      closeMenu();
    }
  
    function handleCloseKeydown(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        closeMenu();
      }
    }
  
    function handleOverlayKeydown(e) {
      if (e.key === "Escape") {
        closeMenu();
      }
    }
  
    function handleLinkClick() {
      closeMenu();
    }
  
    // Menu actions
    function toggleMenu() {
      isMenuOpen = !isMenuOpen;
      updateMenuState();
    }
  
    function closeMenu() {
      isMenuOpen = false;
      updateMenuState();
      hamburgerMenu.focus();
    }
  
    // Update UI state
    function updateMenuState() {
      // Update checkbox
      menuToggle.checked = isMenuOpen;
      
      // Update ARIA attributes
      hamburgerMenu.setAttribute("aria-expanded", isMenuOpen);
      menuOverlay.setAttribute("aria-hidden", !isMenuOpen);
      
      // Update tabindex for all focusable elements
      const focusableElements = menuOverlay.querySelectorAll('a, button, [tabindex]');
      focusableElements.forEach(el => {
        el.setAttribute("tabindex", isMenuOpen ? "0" : "-1");
      });
  
      // Update overlay visibility
      if (isMenuOpen) {
        menuOverlay.focus();
      }
    }
  
    // Initialize focus trap when menu is open
    function setupFocusTrap() {
      const focusableElements = menuOverlay.querySelectorAll('a, button, [tabindex="0"]');
      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
  
        firstElement.addEventListener("keydown", (e) => {
          if (e.key === "Tab" && e.shiftKey) {
            e.preventDefault();
            lastElement.focus();
          }
        });
  
        lastElement.addEventListener("keydown", (e) => {
          if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            firstElement.focus();
          }
        });
      }
    }
  
    // Initialize the menu
    init();
    setupFocusTrap();
  }
  
  export default function init() {
    MenuOverlayPhone();
  }
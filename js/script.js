// ===============================
// Mobile topbar + slide-in sidebar
// ===============================

const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".overlay");
const menuBtn = document.querySelector(".menu-toggle");
const closeBtnSidebar = document.querySelector(".menu-close");

function openSidebar() {
  if (!sidebar || !overlay || !menuBtn) return;

  sidebar.classList.add("is-open");
  overlay.classList.add("is-visible");
  menuBtn.setAttribute("aria-expanded", "true");
  document.body.classList.add("no-scroll");
}

function closeSidebar() {
  if (!sidebar || !overlay || !menuBtn) return;

  sidebar.classList.remove("is-open");
  overlay.classList.remove("is-visible");
  menuBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("no-scroll");
}

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    const isOpen = sidebar && sidebar.classList.contains("is-open");
    if (isOpen) closeSidebar();
    else openSidebar();
  });
}

if (closeBtnSidebar) {
  closeBtnSidebar.addEventListener("click", closeSidebar);
}

if (overlay) {
  overlay.addEventListener("click", closeSidebar);
}

// Close sidebar on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (sidebar && sidebar.classList.contains("is-open")) closeSidebar();
  }
});

// Close sidebar when a link is clicked (mobile UX)
if (sidebar) {
  sidebar.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.tagName === "A") closeSidebar();
  });
}

// ===============================
// Lightbox (gallery preview -> full)
// ===============================

// ===============================
// Lightbox (gallery preview -> full)
// ===============================

const galleryItems = document.querySelectorAll(".gallery-item");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCaption = document.getElementById("lightbox-caption");
const closeBtnLightbox = document.getElementById("close");

// Create Zoom Button
const zoomBtn = document.createElement("button");
zoomBtn.className = "lightbox-zoom-btn";
zoomBtn.innerText = "Zoom / Pan";
zoomBtn.style.display = "none";
if (lightbox) lightbox.appendChild(zoomBtn);

let isZoomed = false;

function openLightbox({ src, title, notes }) {
  if (!lightbox || !lightboxImg || !lightboxCaption) return;

  lightboxImg.src = src;
  lightboxImg.classList.remove("is-zoomed");
  isZoomed = false;
  zoomBtn.innerHTML = "Enable Pan/Zoom";

  // Reset zoom styles
  lightboxImg.style.transform = "none";

  // Build caption with Sky Map link
  let captionHtml = `<strong>${title || ""}</strong><br>${notes || ""}`;

  // Add Sky Map link if title exists
  if (title) {
    let cleanTitle = title.replace(/\(.*\)/, "").trim(); // Remove () for cleaner search
    if (Object.keys(arguments[0]).includes('aliases') && arguments[0].aliases) {
      const aliasList = arguments[0].aliases.split(',').map(s => s.trim());
      if (aliasList.length > 0) {
        cleanTitle = aliasList[0]; // Use first alias for search
        captionHtml += `<br><span class="alias-list"><strong>Aliases:</strong> ${aliasList.join(', ')}</span>`;
      }
    }

    const skyMapUrl = `https://wikisky.org/?object=${encodeURIComponent(cleanTitle)}`;
    captionHtml += `<br><a href="${skyMapUrl}" target="_blank" class="skymap-link">✨ Find in Sky Map (WikiSky)</a>`;
  }

  lightboxCaption.innerHTML = captionHtml;

  lightbox.style.display = "flex";
  zoomBtn.style.display = "block";
  document.body.classList.add("no-scroll");
}

function closeLightbox() {
  if (!lightbox) return;

  lightbox.style.display = "none";
  document.body.classList.remove("no-scroll");

  // Reset zoom state
  lightboxImg.classList.remove("is-zoomed");
  isZoomed = false;
}

function toggleZoom(e) {
  e.stopPropagation(); // Prevent closing lightbox
  isZoomed = !isZoomed;

  if (isZoomed) {
    lightboxImg.classList.add("is-zoomed");
    zoomBtn.innerHTML = "Reset View";
  } else {
    lightboxImg.classList.remove("is-zoomed");
    zoomBtn.innerHTML = "Enable Pan/Zoom";
  }
}

// Lightbox Zoom/Pan Logic
if (lightboxImg) {
  lightboxImg.addEventListener("click", (e) => {
    // If zoomed, don't close, maybe dragging logic here if needed (simple native scroll works for now with overflow)
    if (isZoomed) e.stopPropagation();
  });

  // Simple Pan: Scrolling the container works if we set overflow, 
  // but for "grab and drag" we need mouse events.
  let isDown = false;
  let startX;
  let scrollLeft;
  let startY;
  let scrollTop;

  lightboxImg.addEventListener('mousedown', (e) => {
    if (!isZoomed) return;
    isDown = true;
    lightboxImg.classList.add('active');
    startX = e.pageX - lightbox.offsetLeft;
    startY = e.pageY - lightbox.offsetTop;
    scrollLeft = lightbox.scrollLeft;
    scrollTop = lightbox.scrollTop;
  });

  lightboxImg.addEventListener('mouseleave', () => {
    isDown = false;
  });

  lightboxImg.addEventListener('mouseup', () => {
    isDown = false;
  });

  lightboxImg.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - lightbox.offsetLeft;
    const y = e.pageY - lightbox.offsetTop;
    const walkX = (x - startX) * 1.5; // scroll-fast
    const walkY = (y - startY) * 1.5;
    lightbox.scrollLeft = scrollLeft - walkX;
    lightbox.scrollTop = scrollTop - walkY;
  });
}

if (zoomBtn) {
  zoomBtn.addEventListener("click", toggleZoom);
}

galleryItems.forEach((item) => {
  item.addEventListener("click", () => {
    const img = item.querySelector("img");

    // Prefer full-res image when provided
    const fullSrc = item.getAttribute("data-full");
    const src = fullSrc || (img ? img.src : "");

    const title = item.getAttribute("data-title") || "";
    const notes = item.getAttribute("data-notes") || "";
    const aliases = item.getAttribute("data-aliases") || "";

    if (src) openLightbox({ src, title, notes, aliases });
  });
});

if (closeBtnLightbox) {
  closeBtnLightbox.addEventListener("click", closeLightbox);
}

// Click outside image closes (unless zooming)
if (lightbox) {
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

const menuClose = document.querySelector(".menu-close");
if (menuClose) menuClose.addEventListener("click", closeSidebar);

// Close lightbox on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox && lightbox.style.display === "flex") {
    closeLightbox();
  }
});


// ===============================
// Comparison Slider Logic
// ===============================
// ===============================
// Comparison Slider Logic (Responsive)
// ===============================
function initComparisons() {
  const overlays = document.getElementsByClassName("img-comp-overlay");

  // We iterate backwards or safely because simple loop is fine here
  // But each instance needs its own handlers
  for (let i = 0; i < overlays.length; i++) {
    // Determine the base image (sibling)
    // The overlay is the separate div. The base image is the previous sibling div.
    const overlayDiv = overlays[i];
    const container = overlayDiv.parentElement;
    // Base img is the one NOT overlay
    const baseImgDiv = container.querySelector('.img-comp-img:not(.img-comp-overlay)');
    const baseImg = baseImgDiv ? baseImgDiv.querySelector('img') : null;
    const overlayImg = overlayDiv.querySelector('img');

    if (baseImg && overlayImg) {
      setupSlider(overlayDiv, overlayImg, baseImg, container);
    }
  }

  function setupSlider(overlayDiv, overlayImg, baseImg, container) {
    let slider, clicked = 0, w, h;

    // We need to wait for image load to get dimensions if not ready
    if (!baseImg.complete) {
      baseImg.onload = () => init();
    } else {
      init();
    }

    function init() {
      // Create slider knob
      slider = document.createElement("DIV");
      slider.setAttribute("class", "img-comp-slider");
      container.appendChild(slider); // Append to container, so it floats over both

      // Initial sizing
      updateDimensions();

      // Events
      slider.addEventListener("mousedown", slideReady);
      window.addEventListener("mouseup", slideFinish);
      slider.addEventListener("touchstart", slideReady);
      window.addEventListener("touchend", slideFinish);

      // Update on resize
      window.addEventListener('resize', updateDimensions);
    }

    function updateDimensions() {
      // Get current displayed dimensions of base image
      w = baseImg.offsetWidth;
      h = baseImg.offsetHeight;

      // Force overlay image to match base image dimensions exactly
      overlayImg.style.width = w + "px";
      overlayImg.style.height = h + "px";

      // Center slider knob vertically
      slider.style.top = (h / 2) - (slider.offsetHeight / 2) + "px";

      // Reset slider to center or keep percentage? Center is safest for resize reset
      // Or keep current position relative to width
      const currentWidth = overlayDiv.offsetWidth;
      // If first run (currentWidth is maybe 50% from css), keep it
      // actually, just ensuring slider position matches overlay width
      slider.style.left = (currentWidth) - (slider.offsetWidth / 2) + "px";
    }

    function slideReady(e) {
      e.preventDefault();
      clicked = 1;
      window.addEventListener("mousemove", slideMove);
      window.addEventListener("touchmove", slideMove);
    }

    function slideFinish() {
      clicked = 0;
    }

    function slideMove(e) {
      let pos;
      if (clicked == 0) return false;
      pos = getCursorPos(e);
      // Limits
      if (pos < 0) pos = 0;
      if (pos > w) pos = w;

      slide(pos);
    }

    function getCursorPos(e) {
      let a, x = 0;
      e = (e.changedTouches) ? e.changedTouches[0] : e;
      a = baseImg.getBoundingClientRect();
      x = e.pageX - a.left;
      x = x - window.pageXOffset;
      return x;
    }

    function slide(x) {
      // Resize overlay DIV
      overlayDiv.style.width = x + "px";
      // Move slider
      slider.style.left = x - (slider.offsetWidth / 2) + "px";
    }
  }
}

// Initialize sliders if exist
if (document.querySelectorAll(".img-comp-overlay").length > 0) {
  initComparisons();
}


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
    const cleanTitle = title.replace(/\(.*\)/, "").trim(); // Remove () for cleaner search
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

    if (src) openLightbox({ src, title, notes });
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
function initComparisons() {
  const x = document.getElementsByClassName("img-comp-overlay");
  for (let i = 0; i < x.length; i++) {
    compareImages(x[i]);
  }

  function compareImages(img) {
    let clicked = 0, w, h;

    // Get the width and height of the img element
    w = img.offsetWidth;
    h = img.offsetHeight;

    // Set the width of the img element to 50%
    img.style.width = (w / 2) + "px";

    // Create slider
    const slider = document.createElement("DIV");
    slider.setAttribute("class", "img-comp-slider");
    img.parentElement.insertBefore(slider, img);

    // Position slider
    slider.style.top = (h / 2) - (slider.offsetHeight / 2) + "px";
    slider.style.left = (w / 2) - (slider.offsetWidth / 2) + "px";

    // Events
    slider.addEventListener("mousedown", slideReady);
    window.addEventListener("mouseup", slideFinish);
    slider.addEventListener("touchstart", slideReady);
    window.addEventListener("touchend", slideFinish);

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
      if (pos < 0) pos = 0;
      if (pos > w) pos = w;
      slide(pos);
    }

    function getCursorPos(e) {
      let a, x = 0;
      e = (e.changedTouches) ? e.changedTouches[0] : e;
      a = img.getBoundingClientRect();
      x = e.pageX - a.left;
      x = x - window.pageXOffset;
      return x;
    }

    function slide(x) {
      img.style.width = x + "px";
      slider.style.left = img.offsetWidth - (slider.offsetWidth / 2) + "px";
    }
  }
}

// Initialize sliders if exist
if (document.querySelectorAll(".img-comp-overlay").length > 0) {
  initComparisons();
}


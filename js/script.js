// Main initialization function
function initDSOImage() {
  console.log("Initializing DSO Image Scripts..."); // Debug

  // ===============================
  // Mobile topbar + slide-in sidebar
  // ===============================

  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".overlay");
  const menuBtn = document.querySelector(".menu-toggle");
  const closeBtnSidebar = document.querySelector(".menu-close");

  function openSidebar() {
    if (sidebar) sidebar.classList.add("is-open");
    if (overlay) overlay.classList.add("is-visible");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("is-open");
    if (overlay) overlay.classList.remove("is-visible");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
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

  const galleryItems = document.querySelectorAll(".gallery-item");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeBtnLightbox = document.getElementById("close");

  // Create Zoom Button
  let zoomBtn = document.querySelector(".lightbox-zoom-btn");
  if (!zoomBtn && lightbox) {
    zoomBtn = document.createElement("button");
    zoomBtn.className = "lightbox-zoom-btn";
    zoomBtn.innerText = "Zoom / Pan";
    zoomBtn.style.display = "none";
    lightbox.appendChild(zoomBtn);
  }

  let isZoomed = false;

  function openLightbox({ src, title, notes, aliases }) {
    if (!lightbox || !lightboxImg || !lightboxCaption) return;

    lightboxImg.src = src;
    lightboxImg.classList.remove("is-zoomed");
    isZoomed = false;
    if (zoomBtn) zoomBtn.innerHTML = "Enable Pan/Zoom";

    lightboxImg.style.transform = "none";

    // Build caption
    let captionHtml = `<strong>${title || ""}</strong><br>${notes || ""}`;
    if (title) {
      let cleanTitle = title.replace(/\(.*\)/, "").trim();
      if (aliases) {
        const aliasList = aliases.split(',').map(s => s.trim());
        if (aliasList.length > 0) cleanTitle = aliasList[0];
        captionHtml += `<br><span class="alias-list"><strong>Aliases:</strong> ${aliases}</span>`;
      }
      const skyMapUrl = `https://wikisky.org/?object=${encodeURIComponent(cleanTitle)}`;
      captionHtml += `<br><a href="${skyMapUrl}" target="_blank" class="skymap-link">✨ Find in Sky Map (WikiSky)</a>`;
    }

    lightboxCaption.innerHTML = captionHtml;
    lightbox.style.display = "flex";
    if (zoomBtn) zoomBtn.style.display = "block";
    document.body.classList.add("no-scroll");
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.style.display = "none";
    document.body.classList.remove("no-scroll");
    lightboxImg.classList.remove("is-zoomed");
    isZoomed = false;
  }

  function toggleZoom(e) {
    e.stopPropagation();
    isZoomed = !isZoomed;
    if (isZoomed) {
      lightboxImg.classList.add("is-zoomed");
      if (zoomBtn) zoomBtn.innerHTML = "Reset View";
    } else {
      lightboxImg.classList.remove("is-zoomed");
      if (zoomBtn) zoomBtn.innerHTML = "Enable Pan/Zoom";
    }
  }

  if (lightboxImg) {
    lightboxImg.addEventListener("click", (e) => {
      if (isZoomed) e.stopPropagation();
    });

    // Pan logic
    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;

    lightboxImg.addEventListener('mousedown', (e) => {
      if (!isZoomed) return;
      isDown = true;
      startX = e.pageX - lightbox.offsetLeft;
      startY = e.pageY - lightbox.offsetTop;
      scrollLeft = lightbox.scrollLeft;
      scrollTop = lightbox.scrollTop;
    });

    lightboxImg.addEventListener('mouseleave', () => { isDown = false; });
    lightboxImg.addEventListener('mouseup', () => { isDown = false; });

    lightboxImg.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - lightbox.offsetLeft;
      const y = e.pageY - lightbox.offsetTop;
      const walkX = (x - startX) * 1.5;
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

  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  const menuClose = document.querySelector(".menu-close");
  if (menuClose) menuClose.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox && lightbox.style.display === "flex") {
      closeLightbox();
    }
  });


  // ===============================
  // Comparison Slider Logic
  // ===============================
  function initComparisons() {
    const overlays = document.getElementsByClassName("img-comp-overlay");
    for (let i = 0; i < overlays.length; i++) {
      const overlayDiv = overlays[i];
      const container = overlayDiv.parentElement;
      const baseImgDiv = container.querySelector('.img-comp-img:not(.img-comp-overlay)');
      const baseImg = baseImgDiv ? baseImgDiv.querySelector('img') : null;
      const overlayImg = overlayDiv.querySelector('img');

      if (baseImg && overlayImg) {
        setupSlider(overlayDiv, overlayImg, baseImg, container);
      }
    }

    function setupSlider(overlayDiv, overlayImg, baseImg, container) {
      let slider, clicked = 0, w, h;
      if (!baseImg.complete) {
        baseImg.onload = () => init();
      } else {
        init();
      }

      function init() {
        slider = document.createElement("DIV");
        slider.setAttribute("class", "img-comp-slider");
        container.appendChild(slider);
        updateDimensions();
        slider.addEventListener("mousedown", slideReady);
        window.addEventListener("mouseup", slideFinish);
        slider.addEventListener("touchstart", slideReady);
        window.addEventListener("touchend", slideFinish);
        window.addEventListener('resize', updateDimensions);
      }

      function updateDimensions() {
        w = baseImg.offsetWidth;
        h = baseImg.offsetHeight;
        overlayImg.style.width = w + "px";
        overlayImg.style.height = h + "px";
        slider.style.top = (h / 2) - (slider.offsetHeight / 2) + "px";
        const currentWidth = overlayDiv.offsetWidth;
        slider.style.left = (currentWidth) - (slider.offsetWidth / 2) + "px";
      }

      function slideReady(e) {
        e.preventDefault();
        clicked = 1;
        window.addEventListener("mousemove", slideMove);
        window.addEventListener("touchmove", slideMove);
      }
      function slideFinish() { clicked = 0; }
      function slideMove(e) {
        if (clicked == 0) return false;
        let pos = getCursorPos(e);
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
        overlayDiv.style.width = x + "px";
        slider.style.left = x - (slider.offsetWidth / 2) + "px";
      }
    }
  }

  if (document.querySelectorAll(".img-comp-overlay").length > 0) {
    initComparisons();
  }

  // ===============================
  // Red Mode (Night Vision)
  // ===============================
  const redModeToggle = document.getElementById("red-mode-toggle");

  if (localStorage.getItem("redMode") === "true") {
    document.body.classList.add("red-mode");
    if (redModeToggle) redModeToggle.classList.add("active");
  }

  function toggleRedMode() {
    document.body.classList.toggle("red-mode");
    const isActive = document.body.classList.contains("red-mode");
    if (redModeToggle) {
      redModeToggle.classList.toggle("active");
    }
    localStorage.setItem("redMode", isActive);
  }

  if (redModeToggle) {
    redModeToggle.addEventListener("click", toggleRedMode);
  }

  // ===============================
  // Search Functionality
  // ===============================
  const searchData = [
    { title: "Andromeda Galaxy (M31)", aliases: "M31, NGC 224", url: "galaxies.html", img: "images/preview/Andromeda_Galaxy.jpg" },
    { title: "Triangulum Galaxy (M33)", aliases: "M33, NGC 598", url: "galaxies.html", img: "images/preview/Triangulum_Galaxy.jpg" },
    { title: "M101 Pinwheel Galaxy", aliases: "M101, NGC 5457", url: "galaxies.html", img: "images/preview/M101.jpg" },
    { title: "M77 Galaxy", aliases: "M77, NGC 1068", url: "galaxies.html", img: "images/preview/M77.jpg" },
    { title: "Hercules Galaxy Cluster (Abell 2151)", aliases: "Abell 2151", url: "galaxies.html", img: "images/preview/Abell2151.jpg" },
    { title: "Bode's & Cigar Galaxy (M81/M82)", aliases: "M81, NGC 3031, M82, NGC 3034", url: "galaxies.html", img: "images/preview/M81_M82_Galaxies.jpg" },
    { title: "HorseHead and Flame Nebulae", aliases: "IC 434, Barnard 33, NGC 2024", url: "nebulae.html", img: "images/preview/HorseHead_Flame_Nebula.jpg" },
    { title: "Flaming Star, Tadpole & Spider", aliases: "IC 405, IC 410, IC 417", url: "nebulae.html", img: "images/preview/ic405_410_417.jpg" },
    { title: "NGC 1333", aliases: "NGC 1333", url: "nebulae.html", img: "images/preview/ngc_1333.jpg" },
    { title: "Eagle Nebula (M16)", aliases: "M16, NGC 6611", url: "nebulae.html", img: "images/preview/M16_hubble_pallete.jpg" },
    { title: "Tulip Nebula", aliases: "Sh2-101", url: "nebulae.html", img: "images/preview/Tulip_Nebula.jpg" },
    { title: "Bubble Nebula", aliases: "NGC 7635", url: "nebulae.html", img: "images/preview/Bubble_Nebula_HOO.jpg" },
    { title: "Wizard Nebula", aliases: "NGC 7380", url: "nebulae.html", img: "images/preview/wizard_nebula_1.jpg" },
    { title: "North America Nebula", aliases: "NGC 7000", url: "nebulae.html", img: "images/preview/north_america_nebula.jpg" },
    { title: "Helix Nebula", aliases: "NGC 7293", url: "nebulae.html", img: "images/preview/helix_nebula.jpg" },
    { title: "Veil Nebula", aliases: "NGC 6960, NGC 6992", url: "nebulae.html", img: "images/preview/veil_nebula.jpg" },
    { title: "Trifid Nebula", aliases: "M20, NGC 6514", url: "nebulae.html", img: "images/preview/Trifid_Nebula.jpg" },
    { title: "Jellyfish Nebula", aliases: "IC 443", url: "nebulae.html", img: "images/preview/Jellyfish_Nebula.jpg" },
    { title: "Great Hercules Cluster (M13)", aliases: "M13, NGC 6205", url: "clusters.html", img: "images/preview/M13.jpg" }
  ];

  const searchOverlay = document.getElementById("search-overlay");
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const searchClose = document.querySelector(".search-close");
  const searchTriggers = document.querySelectorAll(".search-trigger");

  function openSearch() {
    if (searchOverlay) {
      searchOverlay.classList.add("is-active");
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 100);
    }
  }

  function closeSearch() {
    if (searchOverlay) {
      searchOverlay.classList.remove("is-active");
      if (searchInput) searchInput.value = "";
      if (searchResults) searchResults.innerHTML = "";
    }
  }

  // Attach event to ALL search triggers
  searchTriggers.forEach(btn => {
    btn.addEventListener("click", openSearch);
  });

  if (searchClose) {
    searchClose.addEventListener("click", closeSearch);
  }

  if (searchOverlay) {
    searchOverlay.addEventListener("click", (e) => {
      if (e.target === searchOverlay) closeSearch();
    });
  }

  function performSearch(query) {
    if (!searchResults) return;
    searchResults.innerHTML = "";
    if (!query || query.length < 2) return;

    const lowerQuery = query.toLowerCase();
    const matches = searchData.filter(item => {
      return item.title.toLowerCase().includes(lowerQuery) ||
        item.aliases.toLowerCase().includes(lowerQuery);
    });

    if (matches.length === 0) {
      searchResults.innerHTML = '<div style="color:#aaa; padding:15px; font-size:16px;">I haven\'t imaged this object yet.</div>';
      return;
    }

    matches.forEach(item => {
      const div = document.createElement("div");
      div.className = "search-result-item";
      div.innerHTML = `
            <img src="${item.img}" class="search-result-thumb" alt="${item.title}">
            <div class="search-result-text">
                <h4>${item.title}</h4>
                <p>${item.aliases}</p>
            </div>
        `;
      div.addEventListener("click", () => {
        window.location.href = item.url;
      });
      searchResults.appendChild(div);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => performSearch(e.target.value));

    // Keydown for Escape AND Enter
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSearch();

      if (e.key === "Enter") {
        // If results exist, click the first one
        if (searchResults && searchResults.firstChild) {
          searchResults.firstChild.click();
        }
      }
    });
  }
}

// Robust loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDSOImage);
} else {
  initDSOImage();
}

// Last updated: 2026-01-25 (Fixing Search/Night Vision v6)

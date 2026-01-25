// Main initialization function
function initDSOImage() {
  console.log("Initializing DSO Image Scripts...");

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

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (sidebar && sidebar.classList.contains("is-open")) closeSidebar();
    }
  });

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

      // Push history state so deep linking works if user copies URL
      // But only if we are not already there
      const cleanTitle = title.replace(/\(.*\)/, "").trim();
      const newUrl = window.location.pathname + "?object=" + encodeURIComponent(cleanTitle);
      window.history.replaceState(null, null, newUrl);

      if (src) openLightbox({ src, title, notes, aliases });
    });
  });

  if (closeBtnLightbox) {
    closeBtnLightbox.addEventListener("click", () => {
      closeLightbox();
      // Remove query param on close
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, null, cleanUrl);
    });
  }

  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, null, cleanUrl);
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox && lightbox.style.display === "flex") {
      closeLightbox();
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, null, cleanUrl);
    }
  });

  // ===============================
  // Deep Linking Handler
  // ===============================
  function checkDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const objectName = urlParams.get('object');

    if (objectName) {
      const decodeObj = decodeURIComponent(objectName).toLowerCase();

      // Find matching gallery item
      // We check data-title or data-aliases
      let foundItem = null;

      // Convert NodeList to Array to use find
      const items = Array.from(galleryItems);
      foundItem = items.find(item => {
        const t = (item.getAttribute("data-title") || "").toLowerCase();
        const a = (item.getAttribute("data-aliases") || "").toLowerCase();
        // Check loose match
        return t.includes(decodeObj) || a.includes(decodeObj);
      });

      if (foundItem) {
        console.log("Deep link found for:", objectName);
        // Trigger click to open lightbox
        // Use a small timeout to ensure DOM is ready-ready
        setTimeout(() => {
          foundItem.click();
        }, 100);
      }
    }
  }

  // Run deep link check on load
  checkDeepLink();


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
  // Red Mode
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

  // Bind to triggers
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

      // Extract a clean name for the URL param (remove parentheses)
      let cleanName = item.title.replace(/\(.*\)/, "").trim();

      div.innerHTML = `
            <img src="${item.img}" class="search-result-thumb" alt="${item.title}">
            <div class="search-result-text">
                <h4>${item.title}</h4>
                <p>${item.aliases}</p>
            </div>
        `;
      div.addEventListener("click", () => {
        // Navigate to specific object
        // Appending ?object=Name
        window.location.href = item.url + "?object=" + encodeURIComponent(cleanName);
      });
      searchResults.appendChild(div);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => performSearch(e.target.value));

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSearch();
      if (e.key === "Enter") {
        if (searchResults && searchResults.firstChild) {
          searchResults.firstChild.click();
        }
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDSOImage);
} else {
  initDSOImage();
}

// Last updated: 2026-01-25 (Tools Implementation)

// ===============================
// ASTRONOMY TOOLS MODULE
// ===============================

// 1. Moon Phase Calculator
function updateMoonPhase() {
  const moonNameEl = document.getElementById("moon-phase-name");
  const moonIllumEl = document.getElementById("moon-illumination");
  const daysToNewEl = document.getElementById("days-to-new-moon");

  if (!moonNameEl) return;

  // Synodic month
  const synodic = 29.53058867;
  // Known New Moon: Jan 18, 2026 17:55 UTC (Epoch)
  const knownNewMoon = new Date(Date.UTC(2026, 0, 18, 17, 55, 0));
  const now = new Date();

  // Diff in days
  const diffMs = now - knownNewMoon;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const cycleCount = Math.floor(diffDays / synodic);
  const currentCycleAge = diffDays % synodic;

  // Normalized Phase (0 to 1)
  const phase = currentCycleAge / synodic; // 0.0 = New, 0.5 = Full

  // Naming
  let phaseName = "";
  let icon = "";
  if (phase < 0.02) { phaseName = "New Moon"; icon = "🌑"; }
  else if (phase < 0.24) { phaseName = "Waxing Crescent"; icon = "🌒"; }
  else if (phase < 0.26) { phaseName = "First Quarter"; icon = "🌓"; }
  else if (phase < 0.49) { phaseName = "Waxing Gibbous"; icon = "🌔"; }
  else if (phase < 0.51) { phaseName = "Full Moon"; icon = "🌕"; }
  else if (phase < 0.74) { phaseName = "Waning Gibbous"; icon = "🌖"; }
  else if (phase < 0.76) { phaseName = "Last Quarter"; icon = "🌗"; }
  else if (phase < 0.98) { phaseName = "Waning Crescent"; icon = "🌘"; }
  else { phaseName = "New Moon"; icon = "🌑"; }

  // Illumination (Approx sinusoidal)
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);

  // Time to next New Moon
  const daysRemaining = Math.round(synodic - currentCycleAge);

  // Update UI
  moonNameEl.innerText = `${icon} ${phaseName}`;
  moonIllumEl.innerText = `Illumination: ${illumination}%`;
  if (daysToNewEl) daysToNewEl.innerText = daysRemaining;
}

// 2. ISS Tracker (Fetch API)
async function updateISS() {
  const latEl = document.getElementById("iss-lat");
  const lonEl = document.getElementById("iss-lon");
  const velEl = document.getElementById("iss-vel");
  const visEl = document.getElementById("iss-visibility");

  if (!latEl) return;

  try {
    const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    const data = await response.json();

    latEl.innerText = data.latitude.toFixed(4);
    lonEl.innerText = data.longitude.toFixed(4);
    velEl.innerText = Math.round(data.velocity) + " km/h";

    if (data.visibility === "daylight") {
      visEl.innerText = "In Daylight";
      visEl.className = "status-pill";
    } else {
      visEl.innerText = "Eclipse (Dark)";
      visEl.className = "status-pill status-good";
    }

  } catch (e) {
    console.warn("ISS Fetch failed", e);
    if (visEl) visEl.innerText = "Offline";
  }
}

// 3. Astronomical Twilight Calculator (Simplified for Israel 31N)
function updateTwilight() {
  const startEl = document.getElementById("dark-start");
  const endEl = document.getElementById("dark-end");
  const statusEl = document.getElementById("twilight-status");

  if (!startEl) return;

  // Approximate for Tel Aviv (31N)
  // In reality, this changes daily. 
  // We will simply simulate "Darkness is approx 1.5h after sunset" for this static demo,
  // OR use a very simplified seasonal offset.

  const now = new Date();
  const month = now.getMonth(); // 0-11

  // Rough Estimations for Israel
  // Summer: Dark 20:30 - 04:00
  // Winter: Dark 18:00 - 05:00
  let darkStartHour = 19;
  let darkEndHour = 5;

  if (month >= 3 && month <= 8) { // Summer-ish
    darkStartHour = 20;
    darkEndHour = 4;
  } else { // Winter
    darkStartHour = 18;
    darkEndHour = 5;
  }

  startEl.innerText = `${darkStartHour}:00`;
  endEl.innerText = `0${darkEndHour}:00`;

  const currentHour = now.getHours();
  // Check if we are in darkness now
  // Darkness is usually across midnight, so logic:
  // IF (now > start) OR (now < end)
  if (currentHour >= darkStartHour || currentHour < darkEndHour) {
    statusEl.innerText = "Currently Dark";
    statusEl.className = "status-pill status-good";
  } else {
    statusEl.innerText = "Daylight / Twilight";
    statusEl.className = "status-pill";
  }
}

// 4. Planet Visibility (Static/Approximated for 2026 Demo)
function updatePlanets() {
  const planets = ['venus', 'mars', 'jupiter', 'saturn'];

  // In a real app, use 'astronomy-engine'. 
  // Here we will randomize or hardcode "Visible" vs "Set" for demo purposes 
  // since we lack a full ephemeris library

  planets.forEach(p => {
    const el = document.getElementById(`planet-${p}`);
    if (el) {
      const badge = el.querySelector(".badge");
      // Mock logic: randomly visible for the demo to show UI state
      // Replaced with fixed states for consistency
      let isVisible = true;
      if (p === 'venus') isVisible = false; // Usually sets early

      if (isVisible) {
        badge.innerText = "Visible";
        badge.classList.add("visible");
      } else {
        badge.innerText = "Set";
        badge.classList.remove("visible");
      }
    }
  });
}

// 5. Coordinate Converter
window.switchTab = function (tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  // Find button that calls this and add active (simple match)
  // Actually simplicity:
  const btns = document.querySelectorAll('.tab-btn');
  if (tabId === 'dec-to-dms') btns[0].classList.add('active');
  else btns[1].classList.add('active');
}

window.convertDecToDms = function () {
  const val = parseFloat(document.getElementById("input-dec").value);
  if (isNaN(val)) return;

  const d = Math.floor(Math.abs(val));
  const mFloat = (Math.abs(val) - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(1);

  const sign = val < 0 ? "-" : "";

  document.getElementById("result-dms").innerText = `${sign}${d}° ${m}' ${s}"`;
}

window.convertDmsToDec = function () {
  const d = parseFloat(document.getElementById("input-d").value || 0);
  const m = parseFloat(document.getElementById("input-m").value || 0);
  const s = parseFloat(document.getElementById("input-s").value || 0);

  let dec = Math.abs(d) + (m / 60) + (s / 3600);
  if (d < 0) dec = -dec;

  document.getElementById("result-dec").innerText = dec.toFixed(5) + "°";
}

// Run Tools
function initTools() {
  updateMoonPhase();
  updateISS();
  updateTwilight();
  updatePlanets();

  // Refresh ISS every 10s
  if (document.getElementById("iss-lat")) {
    setInterval(updateISS, 10000);
  }
}

// Hook into main init
const originalInit = window.onload; // or the event listener
// We act inside DOMContentLoaded in main block, so let's just call it if we are on tools page
if (window.location.pathname.includes("tools.html")) {
  // Add to specific listener or just run calculation
  document.addEventListener("DOMContentLoaded", initTools);
}

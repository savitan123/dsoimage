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

    // History Push Logic
    // Only push if we aren't already there (to avoid loops if called by popstate)
    const cleanName = aliases ? aliases.split(',')[0].trim() : title.replace(/\(.*\)/, "").trim();
    const newUrl = window.location.pathname + "?object=" + encodeURIComponent(cleanName);

    // Check if current state is already this lightbox to avoid double push
    if (!history.state || !history.state.lightboxOpen) {
      history.pushState({ lightboxOpen: true, object: cleanName }, "", newUrl);
    }
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.style.display = "none";
    document.body.classList.remove("no-scroll");
    lightboxImg.classList.remove("is-zoomed");
    isZoomed = false;
  }

  // Handle Back Button (Popstate)
  window.addEventListener("popstate", (e) => {
    // If we popped back to a state that doesn't have lightboxOpen, close it
    if (lightbox && lightbox.style.display === "flex") {
      if (!e.state || !e.state.lightboxOpen) {
        closeLightbox();
      }
    } else if (e.state && e.state.lightboxOpen) {
      // If we popped forward to an open state, re-open (optional, but good)
      // Typically deep link check handles load, but popstate needs to handle forward/back
      // For simplicity, we mostly care about BACK closing the modal.
      // To fully support Forward re-opening, we'd need to find the item again.
      // Let's rely on the URL param check if needed, or just let users click again.
    }
  });

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

      if (src) openLightbox({ src, title, notes, aliases });
    });
  });

  if (closeBtnLightbox) {
    closeBtnLightbox.addEventListener("click", () => {
      // Logic: If we have a history state for the lightbox, go back.
      // Else (deep link load), just close and replaceState.
      if (history.state && history.state.lightboxOpen) {
        history.back();
      } else {
        closeLightbox();
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, null, cleanUrl);
      }
    });
  }

  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        // Same logic as Close Button
        if (history.state && history.state.lightboxOpen) {
          history.back();
        } else {
          closeLightbox();
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, null, cleanUrl);
        }
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox && lightbox.style.display === "flex") {
      if (history.state && history.state.lightboxOpen) {
        history.back();
      } else {
        closeLightbox();
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, null, cleanUrl);
      }
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
          // Manually open to avoid double pushState if the click handler does it
          // Actually, we WANT consistent state.
          // IF we trigger click, it pushes state.
          // BUT on page load, we don't want to push state on top of the deep link URL?
          // Actually: Load Page -> URL has ?object=M81.
          // If we click(), it pushes ?object=M81 (same URL).
          // Browsers handle same-URL pushState differently, often creating a duplicate.
          // Better: Call openLightbox directly WITHOUT pushing state, OR `replaceState`.

          const img = foundItem.querySelector("img");
          const fullSrc = foundItem.getAttribute("data-full");
          const src = fullSrc || (img ? img.src : "");
          const title = foundItem.getAttribute("data-title") || "";
          const notes = foundItem.getAttribute("data-notes") || "";
          const aliases = foundItem.getAttribute("data-aliases") || "";

          // Open VISUALLY but manually manage state to avoid dupes
          if (!lightbox || !lightboxImg || !lightboxCaption) return;

          lightboxImg.src = src;
          lightboxImg.classList.remove("is-zoomed");
          isZoomed = false;
          if (zoomBtn) zoomBtn.innerHTML = "Enable Pan/Zoom";
          lightboxImg.style.transform = "none";

          let captionHtml = `<strong>${title || ""}</strong><br>${notes || ""}`;
          if (title) {
            let cleanTitle = title.replace(/\(.*\)/, "").trim();
            const skyMapUrl = `https://wikisky.org/?object=${encodeURIComponent(cleanTitle)}`;
            captionHtml += `<br><a href="${skyMapUrl}" target="_blank" class="skymap-link">✨ Find in Sky Map (WikiSky)</a>`;
          }
          lightboxCaption.innerHTML = captionHtml;
          lightbox.style.display = "flex";
          if (zoomBtn) zoomBtn.style.display = "block";
          document.body.classList.add("no-scroll");

          // Set initial state without pushing new entry
          const cleanName = aliases ? aliases.split(',')[0].trim() : title.replace(/\(.*\)/, "").trim();
          // We use replaceState so "Back" goes to previous page (outside site), 
          // BUT "Close" will need to just empty the URL.
          // Wait, if I load deep link, I want "Close" to stay on Galaxy page.
          // If I hit Back, I leave Galaxy page.
          history.replaceState({ lightboxOpen: true, object: cleanName }, "", window.location.href);

        }, 100);
      }
    }
  }

  // Run deep link check on load
  checkDeepLink();


  // ===============================
  // Globalization / Translations
  // ===============================
  const translations = {
    "en": {
      "tools_title": "Astronomy Tools",
      "moon_status": "Moon Status",
      "astro_darkness": "Astro Darkness",
      "iss_tracker": "ISS Tracker",
      "planets_tonight": "Planets Tonight",
      "coord_converter": "Coordinate Converter",
      "shoot_tonight": "What to Shoot Tonight?",
      "shoot_desc": "Find the best Deep Sky Objects visible right now from your location. Database: 14,000+ items (Messier, Caldwell, NGC, IC).",
      "min_alt": "Min Altitude:",
      "sort_by": "Sort By:",
      "filter_type": "Filter Type:",
      "find_targets": "Find Targets 🚀",
      "tonights_best": "🌟 Tonight's Best",
      "live_skymap": "Live Sky Map (Interactive)",
      "table_name": "Name",
      "table_type": "Type",
      "table_mag": "Mag",
      "table_size": "Size",
      "table_alt": "Alt",
      "menu_home": "Home",
      "menu_galaxies": "Galaxies",
      "menu_nebulae": "Nebulae",
      "menu_clusters": "Star Clusters",
      "menu_equipment": "Equipment",
      "menu_processing": "Processing",
      "menu_weather": "Weather",
      "menu_tools": "Tools",
      "menu_about": "About",
      "menu_contact": "Contact",
      "menu_nightvision": "Night Vision",
      "menu_follow": "Follow Me",

      "hero_part1": "D",
      "hero_part1_text": "eep",
      "hero_part2": "S",
      "hero_part2_text": "ky",
      "hero_part3": "O",
      "hero_part3_text": "bject Imaging",
      "hero_desc": "A curated collection of deep-sky astrophotography captured under dark skies, revealing galaxies, nebulae, and star clusters far beyond our solar system.",
      "hero_btn_gal": "Browse Galaxies",
      "hero_btn_neb": "Browse Nebulae",
      "hero_btn_cl": "Browse Clusters",
      "home_subtitle": "Choose a category to browse preview images. Click any preview to open the full resolution with notes and links.",
      "cat_gal_title": "Galaxies",
      "cat_gal_desc": "M31, M33, M81/M82, M101, M77 and more.",
      "cat_neb_title": "Nebulae",
      "cat_neb_desc": "Emission, reflection and narrowband targets.",
      "cat_cl_title": "Star Clusters",
      "cat_cl_desc": "Globular and open clusters."
    },
    "he": {
      "tools_title": "כלי אסטרונומיה",
      "moon_status": "מצב הירח",
      "astro_darkness": "חלון חושך אסטרונומי",
      "iss_tracker": "מעקב תחנת החלל",
      "planets_tonight": "כוכבי לכת הלילה",
      "coord_converter": "ממיר קואורדינטות",
      "shoot_tonight": "מה לצלם הלילה?",
      "shoot_desc": "מצא את האובייקטים הטובים ביותר לצילום הנראים כרגע מהמיקום שלך. מסד נתונים: 14,000+ פריטים.",
      "min_alt": "גובה מינימלי:",
      "sort_by": "מיון לפי:",
      "filter_type": "סוג אובייקט:",
      "find_targets": "מצא מטרות 🚀",
      "tonights_best": "🌟 המומלצים להלילה",
      "live_skymap": "מפת שמיים חיה",
      "table_name": "שם",
      "table_type": "סוג",
      "table_mag": "בהירות",
      "table_size": "גודל",
      "table_alt": "גובה",

      "menu_home": "בית",
      "menu_galaxies": "גלקסיות",
      "menu_nebulae": "ערפיליות",
      "menu_clusters": "צבירי כוכבים",
      "menu_equipment": "ציוד",
      "menu_processing": "עיבוד תמונה",
      "menu_weather": "מזג אוויר",
      "menu_tools": "כלים",
      "menu_about": "אודות",
      "menu_contact": "צור קשר",
      "menu_nightvision": "ראיית לילה",
      "menu_follow": "עקבו אחריי",

      "hero_part1": "צ",
      "hero_part1_text": "ילום",
      "hero_part2": "ע",
      "hero_part2_text": "צמים",
      "hero_part3": "ע",
      "hero_part3_text": "מוקים",
      "hero_desc": "אוסף נבחר של צילומי חלל עמוק שצולמו תחת שמיים חשוכים. גלקסיות, ערפיליות וצבירי כוכבים הרחק מעבר למערכת השמש שלנו.",
      "hero_btn_gal": "גלקסיות",
      "hero_btn_neb": "ערפיליות",
      "hero_btn_cl": "צבירי כוכבים",
      "home_subtitle": "בחר קטגוריה לצפייה בתמונות. לחץ על תמונה לפתיחת הרזולוציה המלאה עם הסברים וקישורים.",
      "cat_gal_title": "גלקסיות",
      "cat_gal_desc": "M31, M33, M81/M82, M101, M77 ועוד.",
      "cat_neb_title": "ערפיליות",
      "cat_neb_desc": "ערפיליות פליטה, החזרה וצילום צר-סרט.",
      "cat_cl_title": "צבירי כוכבים",
      "cat_cl_desc": "צבירים כדוריים ופתוחים."
    }
  };

  let currentLang = localStorage.getItem('site_lang') || 'en';

  // Expose to window for HTML onclick
  window.setLanguage = function (lang) {
    console.log("Language setting to:", lang);
    currentLang = lang;
    localStorage.setItem('site_lang', lang);

    // RTL Support
    if (lang === 'he') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.body.classList.add('rtl-mode');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.body.classList.remove('rtl-mode');
    }

    // Update fixed text elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    // Update specific inputs/placeholders if needed
    const btn = document.getElementById('lang-toggle-btn');
    if (btn) btn.textContent = lang === 'en' ? '🇮🇱 עברית' : '🇺🇸 English';

    // Re-render table headers if they exist dynamically (handled in renderTable theoretically, but ours are HTML or JS generated)
    // Since our table headers are in JS, we need to handle them inside the render function too.
    // Update flag opacity if present
    // (Optional: visual feedback for active flag)
  }

  document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);

    // Add toggle button listener if exists
    const toggleBtn = document.getElementById('lang-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const newLang = currentLang === 'en' ? 'he' : 'en';
        setLanguage(newLang);
        // If table is showing, re-render it to update headers
        // (This requires calling the finding logic again or refreshing, but for now we just change text)
      });
    }
  });

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
  // ===============================
  // Search Functionality (Dynamic Indexing)
  // ===============================
  let searchData = []; // Now dynamic

  // Auto-build index from HTML pages
  async function buildSearchIndex() {
    console.log("Building Search Index...");
    const pages = ['galaxies.html', 'nebulae.html', 'clusters.html'];
    const newIndex = [];

    try {
      // Parallel fetch
      const responses = await Promise.all(pages.map(url => fetch(url)));
      const texts = await Promise.all(responses.map(res => res.text()));

      const parser = new DOMParser();

      pages.forEach((pageUrl, i) => {
        const doc = parser.parseFromString(texts[i], 'text/html');
        const items = doc.querySelectorAll('.gallery-item');

        items.forEach(item => {
          const rawTitle = item.getAttribute('data-title') || "";
          const aliases = item.getAttribute('data-aliases') || "";
          // Clean title removing parens if needed or keep as is
          let title = rawTitle;

          // Image Src: use preview if possible
          const imgEl = item.querySelector('img');
          const imgSrc = imgEl ? imgEl.getAttribute('src') : '';

          // Add to index
          newIndex.push({
            title: title + (aliases ? ` (${aliases})` : ""),
            // Composite title for display, or just raw title? 
            // Let's use raw title for display, and use aliases for search matching separately?
            // Existing logic searches both. 
            // Let's stick to simple obj structure.
            displayTitle: title,
            aliases: aliases,
            url: pageUrl,
            img: imgSrc,
            searchStr: (title + " " + aliases).toLowerCase()
          });
        });
      });

      console.log(`Index built: ${newIndex.length} items found.`);
      searchData = newIndex;

      // Persist to session storage to avoid re-fetch on same visit? 
      // Nah, it's fast enough.
    } catch (e) {
      console.error("Error building search index:", e);
      // Fallback or empty
    }
  }

  // Start indexing immediately
  buildSearchIndex();

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

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      searchResults.innerHTML = "";

      if (query.length < 2) {
        searchResults.style.display = "none";
        return;
      }

      // Filter from dynamic searchData
      const matches = searchData.filter(item => {
        // We pre-calculated searchStr for speed
        return item.searchStr.includes(query);
      });

      if (matches.length > 0) {
        searchResults.style.display = "flex"; // Changed from block for better styling if needed
        searchResults.style.flexDirection = "column";

        matches.forEach(match => {
          const div = document.createElement("div");
          div.className = "search-item";
          // Use displayTitle + Aliases for UI
          div.innerHTML = `
             <img src="${match.img}" alt="thumbnail">
             <div class="meta">
               <div class="title">${match.displayTitle}</div>
               <div class="subtitle">${match.aliases}</div>
             </div>
          `;
          div.addEventListener("click", () => {
            // Navigate to page + query param for auto-open
            // We must encode the object name
            const cleanName = match.displayTitle.replace(/\(.*\)/, "").trim();
            window.location.href = `${match.url}?object=${encodeURIComponent(cleanName)}`;
          });
          searchResults.appendChild(div);
        });
      } else {
        searchResults.style.display = "none"; // Or show "No results"
      }
    });

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

// 6. VirtualSky Init
function initSkyMap() {
  const mapContainer = document.getElementById("starmap");
  if (!mapContainer) return;

  // VirtualSky must be loaded
  if (typeof jQuery !== 'undefined' && typeof VirtualSky !== 'undefined') {
    const planetarium = jQuery.virtualsky({
      id: 'starmap',
      projection: 'stereo',
      latitude: 31.046, // Israel
      longitude: 34.851,
      ground: false,
      constellations: true, // Show lines
      constellationlabels: true,
      gridlines_az: true,
      live: true,
      az: 180, // Facing South default
      fov: 60, // Field of view
      showdate: false,
      showposition: false,
      colors: {
        background: 'rgba(0,0,0,0)', // Transparent to match theme
        base: '#fff',
        stars: '#fff',
        letters: '#1e90ff'
      }
    });
  }
}

// Run Tools
function initTools() {
  updateMoonPhase();
  updateISS();
  updateTwilight();
  updatePlanets();
  // Sky Map is handled via Iframe now

  // Refresh ISS every 10s
  if (document.getElementById("iss-lat")) {
    setInterval(updateISS, 10000);
  }
}

// 7. Carousel Logic
function initCarousel() {
  const containers = document.querySelectorAll('.carousel-container');

  // If we have a carousel, we want the Dynamic Background feature
  if (containers.length > 0) {
    let bgLayer = document.getElementById('dynamic-bg');
    if (!bgLayer) {
      bgLayer = document.createElement('div');
      bgLayer.id = 'dynamic-bg';
      document.body.prepend(bgLayer);
      // CRITICAL: Make body transparent so the fixed layer behind it is visible
      document.body.style.background = 'transparent';
    }
  }

  containers.forEach(container => {
    const track = container.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextBtn = container.querySelector('.next-btn');
    const prevBtn = container.querySelector('.prev-btn');

    // We assume 1 carousel per page for the background logic to make sense
    const bgLayer = document.getElementById('dynamic-bg');

    let currentIndex = 0;

    const updateCarousel = () => {
      const slideWidth = slides[0].getBoundingClientRect().width;
      // Use percentage for reliability
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      // Update Dynamic Background
      if (bgLayer) {
        const currentImg = slides[currentIndex].querySelector('img');
        if (currentImg) {
          bgLayer.style.backgroundImage = `url('${currentImg.src}')`;
        }
      }
    };

    // Initialize background
    updateCarousel();

    nextBtn.addEventListener('click', () => {
      currentIndex++;
      if (currentIndex >= slides.length) {
        currentIndex = 0; // Loop back
      }
      updateCarousel();
    });

    prevBtn.addEventListener('click', () => {
      currentIndex--;
      if (currentIndex < 0) {
        currentIndex = slides.length - 1; // Loop to end
      }
      updateCarousel();
    });

    // Swipe Support (Basic)
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    });

    container.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });

    function handleSwipe() {
      if (touchEndX < touchStartX - 50) {
        // Swipe Left -> Next
        nextBtn.click();
      }
      if (touchEndX > touchStartX + 50) {
        // Swipe Right -> Prev
        prevBtn.click();
      }
    }
  });
}

// 8. Target Suggester (NGC/IC/Messier)
let targetDatabase = [];

async function initSuggester() {
  const btn = document.getElementById("suggester-btn");
  const bestBtn = document.getElementById("best-tonight-btn");
  if (!btn) return;

  // Load DB Helper
  async function loadDB() {
    const loadingDiv = document.getElementById("suggester-loading");
    if (targetDatabase.length === 0) {
      if (loadingDiv) loadingDiv.style.display = "block";
      try {
        const resp = await fetch('data/targets.json');
        if (!resp.ok) throw new Error("DB Load Failed");
        targetDatabase = await resp.json();
        // Debug: Check if Common Names are loaded
        const m13 = targetDatabase.find(x => x.n === 'NGC6205');
        console.log('Loaded Targets. Check M13:', m13); // Should show cn: "Hercules..."
      } catch (e) {
        if (loadingDiv) loadingDiv.innerText = "Error loading DB.";
        return false;
      }
    }
    return true;
  }

  btn.addEventListener("click", async () => {
    if (await loadDB()) {
      runSuggesterLogic(false); // Normal mode
    }
  });

  if (bestBtn) {
    bestBtn.addEventListener("click", async () => {
      if (await loadDB()) {
        runSuggesterLogic(true); // "Best" mode
      }
    });
  }
}

function runSuggesterLogic(isBestMode) {
  const resultsDiv = document.getElementById("suggester-results");
  const loadingDiv = document.getElementById("suggester-loading");
  const btn = document.getElementById("suggester-btn");

  if (loadingDiv) loadingDiv.style.display = "block";
  if (resultsDiv) resultsDiv.innerHTML = "";

  const minAltInput = document.getElementById("suggester-alt");
  let minAlt = minAltInput ? (parseFloat(minAltInput.value) || 30) : 30;

  let sortType = "alt_desc";
  const sortInput = document.getElementById("suggester-sort");
  if (sortInput) sortType = sortInput.value;

  let filterType = "all";
  const filterInput = document.getElementById("suggester-type");
  if (filterInput) filterType = filterInput.value;

  // OVERRIDE for "Tonight's Best"
  if (isBestMode) {
    minAlt = 40; // Only high objects
    sortType = 'alt_desc'; // Highest first
    filterType = 'all'; // We will do custom filtering inside loop
  }

  // Location (Tel Aviv Default)
  const lat = 32.0853;
  const lon = 34.7818;
  const now = new Date();

  // Mode Check
  const modeSelect = document.getElementById("suggester-mode");
  const isPlanMode = modeSelect && modeSelect.value === 'plan';
  let planStartStr = "18:00";
  let planEndStr = "06:00";

  if (isPlanMode) {
    planStartStr = document.getElementById("plan-start").value;
    planEndStr = document.getElementById("plan-end").value;
    // Sort override if planning: default to max alt
    if (sortType === 'alt_desc') sortType = 'max_alt_desc';
  }

  // Cache math constants
  const gmst = getGMST(now);
  const lst = gmst + (lon / 15.0); // Hours
  const latRad = lat * (Math.PI / 180.0);
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);

  const candidates = [];

  for (let i = 0; i < targetDatabase.length; i++) {
    const obj = targetDatabase[i];

    // Custom "Best" Filter
    if (isBestMode) {
      // Skip faint objects (Mag > 11)
      const m = parseFloat(obj.m);
      if (isNaN(m) || m > 11) continue;

      // Skip uninteresting types for "Best" 
      const t = (obj.t || "").toUpperCase();
      const interesting = t.includes('G') || t.includes('N') || t.includes('C') || t.includes('PN');
      if (!interesting) continue;
    } else {
      // Normal Filter
      if (filterType !== 'all') {
        let match = false;
        const t = (obj.t || "").toUpperCase();
        if (filterType === 'G' && t.includes('G')) match = true;
        else if (filterType === 'Nb' && (t.includes('N') || t.includes('BN'))) match = true;
        else if (filterType === 'Pn' && t.includes('PN')) match = true;
        else if (filterType === 'Cl' && (t.includes('C') || t.includes('CL'))) match = true;
        if (!match) continue;
      }
    }

    // Parse RA/Dec
    const raH = parseHMS(obj.r);
    const decD = parseDMS(obj.d);

    if (isNaN(raH) || isNaN(decD)) continue;

    // Calc Altitude
    let ha = lst - raH;
    while (ha < -12) ha += 24;
    while (ha >= 12) ha -= 24;

    const haRad = ha * 15.0 * (Math.PI / 180.0);
    const decRad = decD * (Math.PI / 180.0);
    const sinDec = Math.sin(decRad);
    const cosDec = Math.cos(decRad);
    const cosHA = Math.cos(haRad);

    const sinAlt = (sinDec * sinLat) + (cosDec * cosLat * cosHA);
    const altRad = Math.asin(sinAlt);
    const altDeg = altRad * (180.0 / Math.PI);

    let finalAlt = altDeg;
    let timeNote = "Now";

    // PLANNING MODE CALCULATION
    if (isPlanMode) {
      // We need to find MAX altitude between Start and End
      // 1. Get Alt at Start
      // 2. Get Alt at End
      // 3. Get Alt at Transit (HA=0). IF Transit is in window.

      const win = getWindowTimes(planStartStr, planEndStr, now);

      // Helper to get Alt at specific Date
      const getAltAtTime = (dateObj) => {
        const g = getGMST(dateObj);
        const l = g + (lon / 15.0);
        let h = l - raH;
        while (h < -12) h += 24; while (h >= 12) h -= 24;
        const hRad = h * 15.0 * (Math.PI / 180.0);
        const sA = (sinDec * sinLat) + (cosDec * cosLat * Math.cos(hRad));
        return (Math.asin(sA) * (180 / Math.PI));
      };

      const startAlt = getAltAtTime(win.start);
      const endAlt = getAltAtTime(win.end);

      // Transit time?
      // Transit happens when LST = RA => GMST + lon/15 = RA => GMST = RA - lon/15
      // currentGMST known. Diff in GMST hours = Diff in sidereal hours approx solar hours.
      // It's cheaper to just check if transit is inside window.
      // Transit HA = 0.
      // Current HA 'ha' is for 'now'.
      // Time to transit (hours) = -ha. 
      // Transit Time = now - ha (hours).

      const msPerH = 3600 * 1000 * 0.9972696; // Sidereal approx? No, solar to-from. 
      // Let's use simple approximation: 1h RA diff ~ 1h Time diff.
      // Transit Date = now - (ha * 3600 * 1000) ??
      // Actually, let's just use the max possible altitude (at Meridian)
      // AND check if the object crosses meridian between start/end.
      // Max Alt (Meridian) = 90 - abs(lat - dec)
      let maxAltPossible = 90 - Math.abs(lat - decD);

      // Does it transit in window?
      // We calculate LST at Start and LST at End.
      // Transit happens when LST = RA.
      // Check if RA is between LST_start and LST_end (handling 24h wrap).

      // Recalc LSTs properly
      const gmstStart = getGMST(win.start);
      const lstStart = (gmstStart + (lon / 15.0) + 24) % 24;

      const gmstEnd = getGMST(win.end);
      const lstEnd = (gmstEnd + (lon / 15.0) + 24) % 24;

      let crossesMeridian = false;
      const r = (raH + 24) % 24;

      // Simple range check handling wrap
      if (lstStart < lstEnd) {
        // Normal range e.g. 2, 5
        if (r >= lstStart && r <= lstEnd) crossesMeridian = true;
      } else {
        // Wrapped range e.g. 22, 04
        if (r >= lstStart || r <= lstEnd) crossesMeridian = true;
      }

      if (crossesMeridian) {
        finalAlt = maxAltPossible;
        // Calculate approximate transit time for display?
        // Transit happens roughly when LST=RA. 
        // Time offset from Start = (RA - LST_Start) * 0.997...
        // Good enough for "Max Alt":
        timeNote = "Transit";
      } else {
        // Did not cross meridian, so max is either start or end
        finalAlt = Math.max(startAlt, endAlt);
        timeNote = (startAlt > endAlt) ? "Start" : "End";
      }
    }

    if (finalAlt >= minAlt) {
      candidates.push({
        obj: obj,
        alt: finalAlt,
        timeNote: timeNote,
        mag: parseFloat(obj.m) || 99
      });
    }
  }

  // Sort
  if (sortType === 'alt_desc') {
    candidates.sort((a, b) => b.alt - a.alt);
  } else {
    candidates.sort((a, b) => a.mag - b.mag);
  }

  // Limit Results
  const topResults = candidates.slice(0, 100);

  // Render
  if (topResults.length === 0) {
    if (resultsDiv) resultsDiv.innerHTML = `<div style="padding:20px; text-align:center;">No targets found matching criteria.</div>`;
  } else {
    // START TABLE
    let html = `<table style="width:100%; border-collapse:collapse; font-size:11px; table-layout: auto;">
                <tr style="border-bottom:1px solid #444; color:#888; font-size:10px;">
                    <th style="padding:4px 2px; text-align:left;">Name</th>
                    <th style="padding:4px 2px; text-align:center; white-space:nowrap;">Type</th>
                    <th style="padding:4px 2px; text-align:center; white-space:nowrap;">Mag</th>
                    <th style="padding:4px 2px; text-align:center; white-space:nowrap;">Size</th>
                    <th style="padding:4px 2px; text-align:right; white-space:nowrap;">${isPlanMode ? 'Max Alt' : 'Alt'}</th>
                </tr>`;

    topResults.forEach(item => {
      const o = item.obj;
      const altColor = item.alt > 60 ? "#4caf50" : (item.alt > 40 ? "#ffeb3b" : "#aaa");
      // Size string (newly added to DB or fallback)
      let sizeStr = o.sz || "-";

      let displayName = `<span style="font-weight:bold;">${o.n}</span>`;
      if (o.cn) {
        displayName += `<br><span style="color:#aaa; font-size:0.85em;">${o.cn}</span>`;
      }
      const searchName = o.n;

      const altValStr = item.alt.toFixed(0);
      const altDisplay = isPlanMode ? `${altValStr}°<br><span style="font-size:9px; color:#888; font-weight:normal;">${item.timeNote}</span>` : `${item.alt.toFixed(1)}°`;

      html += `<tr style="border-bottom:1px solid #333;">
                    <td style="padding:6px 2px;"><a href="https://wikisky.org/?object=${searchName}" target="_blank" style="color:#1e90ff; text-decoration:none;">${displayName}</a></td>
                    <td style="padding:6px 2px; color:#ccc; text-align:center; white-space:nowrap;">${o.t}</td>
                    <td style="padding:6px 2px; color:#ccc; text-align:center; white-space:nowrap;">${o.m === 99 ? '-' : o.m}</td>
                    <td style="padding:6px 2px; color:#aaa; font-family:monospace; font-size:11px; text-align:center; white-space:nowrap;">${sizeStr}</td>
                    <td style="padding:6px 2px; color:${altColor}; font-weight:bold; text-align:right; white-space:nowrap; line-height:1.2;">${altDisplay}</td>
                 </tr>`;
    });
    html += `</table>`;
    if (resultsDiv) resultsDiv.innerHTML = html;
  }

  if (loadingDiv) loadingDiv.style.display = "none";
  if (btn) btn.disabled = false;
}

// Helper: Parse Times to Date objects relative to "Tonight"
function getWindowTimes(startStr, endStr, now) {
  // Logic: If Start < 12:00, it's probably "tommorow morning" (unlikely for start).
  // If Start > 12:00, it's "today evening".
  // If End < Start, End is "tomorrow".

  // We assume "Tonight" logic based on current *Actual* time.
  // If Now is 14:00. Start 20:00 -> Today 20:00.
  // If Now is 23:00. Start 20:00 -> Today 20:00 (Past).
  // If Now is 01:00. Start 20:00 -> Yesterday 20:00?
  // Let's standardise: The calculated session is "The upcoming night" or "Current night".
  // Keep it simple: Start Time is closest future occurrence? Or just Today's absolute time?

  // Simple heuristic: 
  // Set Start/End Date to Today.
  // If End < Start, Add 1 day to End.
  // If Start has passed significantly (e.g. > 12 hours ago?), maybe user means tomorrow? 
  // Let's stick to: "Today's date" for Start.

  const s = new Date(now);
  const [sh, sm] = startStr.split(':');
  s.setHours(parseInt(sh), parseInt(sm), 0, 0);

  const e = new Date(now);
  const [eh, em] = endStr.split(':');
  e.setHours(parseInt(eh), parseInt(em), 0, 0);

  // If end is before start, assume next day
  if (e <= s) {
    e.setDate(e.getDate() + 1);
  }

  // Fix for "Now is 01:00, Planning 20:00-04:00"
  // The user probably means "Yesterday 20:00 to Today 04:00" because we are currently IN the session.
  // BUT, commonly people plan for UPCOMING.
  // Let's Assume:
  // If Now is 10:00 (Morning) -> Plan 20:00 is Tonight.
  // If Now is 23:00 (Night) -> Plan 20:00 is Tonight (Past start).

  // What if Now is 02:00? Start 20:00. 
  // If we just set 20:00 today, that is 18 hours in FUTURE.
  // User probably implies the session that covers 02:00.
  // However, safest bet is usually "The Start Time Today".
  // Let's stick to "Start is Today" unless explicit override.

  return { start: s, end: e };
}

// Math Helpers
function parseHMS(hmsStr) {
  if (!hmsStr) return NaN;
  const parts = hmsStr.split(':');
  if (parts.length < 2) return NaN;
  // H + M/60 + S/3600
  const h = parseFloat(parts[0]);
  const m = parseFloat(parts[1]);
  const s = parseFloat(parts[2] || 0);
  return h + (m / 60.0) + (s / 3600.0);
}

function parseDMS(dmsStr) {
  if (!dmsStr) return NaN;
  const parts = dmsStr.split(':');
  if (parts.length < 2) return NaN;

  // Degrees can be negative
  let d = parseFloat(parts[0]);
  let m = parseFloat(parts[1]);
  let s = parseFloat(parts[2] || 0);

  let sign = Math.sign(d);
  if (d === 0 && dmsStr.startsWith('-')) sign = -1; // Handle -0 case
  if (sign === 0) sign = 1;

  // Convert all to positive for math then apply sign
  return sign * (Math.abs(d) + (m / 60.0) + (s / 3600.0));
}

function getGMST(date) {
  // Julian Date
  const time = date.getTime();
  const jd = (time / 86400000.0) + 2440587.5;
  const D = jd - 2451545.0;

  // GMST in degrees? No, usually typical formula gives Degrees or Hours.
  // GMST = 18.697374558 + 24.06570982441908 D
  let gmst = 18.697374558 + 24.06570982441908 * D;
  gmst = gmst % 24;
  if (gmst < 0) gmst += 24;

  return gmst; // Hours
}

// Hook into main init
const originalInit = window.onload; // or the event listener
// We act inside DOMContentLoaded in main block, so let's just call it if we are on tools page
if (window.location.pathname.includes("tools.html")) {
  // Add to specific listener or just run calculation
  document.addEventListener("DOMContentLoaded", initTools);
  document.addEventListener("DOMContentLoaded", initSuggester);
}

// Call Carousel Init globally (it checks for existence internally)
document.addEventListener("DOMContentLoaded", initCarousel);

// Helper for UI Toggle
window.toggleTimeInputs = function () {
  const mode = document.getElementById("suggester-mode").value;
  const timeInputs = document.getElementById("time-inputs");
  if (mode === 'plan') {
    timeInputs.style.display = 'flex';
  } else {
    timeInputs.style.display = 'none';
  }
}

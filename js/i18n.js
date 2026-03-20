/**
 * i18n.js — Bilingual (EN/HE) toggle for DSOImage
 * Reads data-i18n attributes, swaps text from JSON, toggles RTL, persists in localStorage.
 */
(function () {
    const STORAGE_KEY = 'dsoimage_lang';
    let currentLang = localStorage.getItem(STORAGE_KEY) || 'en';
    let strings = {};

    // Expose globally so widget scripts (moon.js, apod.js, tonights_best.js) can access translations
    window.i18nStrings = {};
    window.currentLang = currentLang;

    async function loadLanguage(lang) {
        try {
            const resp = await fetch(`lang/${lang}.json?v=117`);
            strings = await resp.json();
            window.i18nStrings = strings;
            window.currentLang = lang;
        } catch (err) {
            console.error('i18n: Failed to load language file:', err);
            return;
        }

        // Apply title tooltips (data-i18n-title)
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (strings[key]) el.title = strings[key];
        });

        // Apply to all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!strings[key]) return;

            // For input placeholders
            if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
                el.placeholder = strings[key];
                return;
            }

            // Find existing text nodes — update in place, never touch icon elements
            const textNodes = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
            const target = textNodes.find(n => n.textContent.trim());
            if (target) {
                target.textContent = ' ' + strings[key];
            } else if (textNodes.length > 0) {
                textNodes[0].textContent = ' ' + strings[key];
            } else {
                // No child elements at all — safe to set textContent directly
                el.textContent = strings[key];
            }
        });

        // Toggle RTL
        const htmlEl = document.documentElement;
        if (lang === 'he') {
            htmlEl.setAttribute('dir', 'rtl');
            htmlEl.setAttribute('lang', 'he');
        } else {
            htmlEl.setAttribute('dir', 'ltr');
            htmlEl.setAttribute('lang', 'en');
        }

        // Update toggle button label
        const toggleBtn = document.getElementById('lang-toggle-btn');
        if (toggleBtn) {
            toggleBtn.textContent = lang === 'he' ? 'EN' : 'עב';
        }

        // Save preference
        localStorage.setItem(STORAGE_KEY, lang);
        currentLang = lang;

        // Dispatch custom event so widget scripts can re-render
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
    }

    // Setup toggle button click
    document.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('lang-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const newLang = currentLang === 'en' ? 'he' : 'en';
                loadLanguage(newLang);
            });
        }

        // Apply saved language on load
        loadLanguage(currentLang);
    });
})();

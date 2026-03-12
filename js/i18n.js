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
            const resp = await fetch(`lang/${lang}.json?v=107`);
            strings = await resp.json();
            window.i18nStrings = strings;
            window.currentLang = lang;
        } catch (err) {
            console.error('i18n: Failed to load language file:', err);
            return;
        }

        // Apply to all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (strings[key]) {
                // For input placeholders
                if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
                    el.placeholder = strings[key];
                } else {
                    // Preserve any leading icon <i> elements
                    const icon = el.querySelector('i');
                    if (icon) {
                        el.innerHTML = '';
                        el.appendChild(icon);
                        el.append(' ' + strings[key]);
                    } else {
                        el.textContent = strings[key];
                    }
                }
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

        // Update toggle button label with SVG flag
        const toggleBtn = document.getElementById('lang-toggle-btn');
        if (toggleBtn) {
            const flagUSA = `<img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40'><path fill='%23fff' d='M0 0h60v40H0z'/><path fill='%23c41130' d='M0 0h60v3.07H0zm0 6.15h60v3.08H0zm0 6.16h60v3.08H0zm0 6.15h60v3.08H0zm0 6.16h60v3.07H0zm0 6.15h60v3.08H0zm0 6.15h60v3.08H0z'/><path fill='%23002164' d='M0 0h24v21.54H0z'/><g fill='%23fff'><g id='d'><g id='c'><g id='e'><g id='b'><path id='a' d='M1.2 1.9l.4 1.2 1.1-.9-1.4-.9-1.4.9 1.1.9z'/><use href='%23a' y='3.84'/><use href='%23a' y='7.69'/><use href='%23a' y='11.54'/><use href='%23a' y='15.38'/></g><use href='%23b' x='4'/><use href='%23b' x='8'/><use href='%23b' x='12'/><use href='%23b' x='16'/><use href='%23b' x='20'/></g><use href='%23a' x='2' y='1.92'/><use href='%23a' x='2' y='5.77'/><use href='%23a' x='2' y='9.62'/><use href='%23a' x='2' y='13.46'/><use href='%23a' x='2' y='17.31'/></g><use href='%23c' x='4'/></g><use href='%23d' x='8'/><use href='%23d' x='16'/></g></svg>" style="width:20px;height:14px;vertical-align:middle;margin-right:5px;display:inline-block"> EN`;
            const flagIL = `<img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40'><path fill='%23fff' d='M0 0h60v40H0z'/><path fill='%230038b8' d='M0 4h60v6H0zm0 24h60v6H0z'/><g fill='none' stroke='%230038b8' stroke-width='2.5'><path d='M30 11l-8 13.8h16z'/><path d='M30 29l-8-13.8h16z'/></g></svg>" style="width:20px;height:14px;vertical-align:middle;margin-right:5px;display:inline-block"> עב`;
            toggleBtn.innerHTML = lang === 'he' ? flagUSA : flagIL;
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

import translations from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    // Language handling
    const langToggleBtn = document.getElementById('langToggle');
    let currentLang = localStorage.getItem('lang') ||
        (navigator.language.startsWith('ja') ? 'ja' : 'en');

    // Apply initial language
    applyLanguage(currentLang);

    // Toggle button handler
    langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'ja' : 'en';
        applyLanguage(currentLang);
    });

    function applyLanguage(lang) {
        // Save preference
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;

        // Update button text
        langToggleBtn.textContent = lang === 'en' ? 'JP' : 'EN';

        // Update title
        document.title = translations[lang]['title'];

        // Update all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                // If the translation contains HTML tags, use innerHTML
                if (translations[lang][key].includes('<')) {
                    el.innerHTML = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        });
    }
});

document.querySelector("html")
  .querySelectorAll("[data-i18n]")
  .forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = translations[lang][key];
  });

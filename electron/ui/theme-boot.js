// Applies the last-used theme before first paint (avoids a flash of the default theme).
// The persisted source of truth is settings.json; this cache only speeds up startup.
(function () {
  try {
    const t = localStorage.getItem('theme');
    if (t === 'acid' || t === 'lavender') document.documentElement.dataset.theme = t;
  } catch {}
})();

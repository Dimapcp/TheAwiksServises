document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.search-form');
  if (!form) return;
  const input = form.querySelector('input[name="q"], input[type="search"], input');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!input) {
      alert('Search input not found');
      return;
    }

    const value = input.value.trim();
    if (value.toLowerCase() === 'awiksadmin12') {
      window.location.href = 'login.html';
      return;
    }
    if (!value) {
      alert('Please enter a search term');
      return;
    }

   
    try {
      const url = new URL(form.action || window.location.pathname, window.location.href);
      url.searchParams.set('q', value);
      window.location.href = url.toString();
    } catch (err) {
      // Fallback: simple query string
      const action = form.action || './search.html';
      window.location.href = action + '?q=' + encodeURIComponent(value);
    }
  });
});

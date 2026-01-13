document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.search-form');
  const input = document.querySelector('#search');

  form.addEventListener('submit', e => {
    e.preventDefault();

    const value = input.value.trim();
    if (!value) return;

    alert('Search: ' + value);
  });
});

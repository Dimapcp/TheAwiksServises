document.addEventListener('DOMContentLoaded', () => {
  const id = location.hash && location.hash.substring(1);
  if (id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
});
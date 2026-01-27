document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const q = (params.get('q') || '').trim();
  const resultsEl = document.getElementById('results');
  const titleEl = document.getElementById('results-title');

  // Populate header search input if present
  const headerInput = document.querySelector('.search-form input[name="q"]');
  if (headerInput) headerInput.value = q;

  if (!q) {
    titleEl.textContent = 'Enter a search term';
    resultsEl.innerHTML = '<p>Use the search box to look through the site.</p>';
    return;
  }

  titleEl.innerHTML = `Search results for "<strong>${escapeHtml(q)}</strong>"`;

  // Small client-side index of pages and snippets
  const pages = [
    {
      title: 'Home — The Awiks Servises',
      url: 'index.html',
      content: 'What are we doing? Programs on Scrach base, Logos, Websites, Memes. Easy way to take that virtual product that you want.'
    },
    {
      title: 'Services — The Awiks Servises',
      url: 'servises.html',
      content: "Our designer creating logos, programs on Scratch base, websites (HTML/CSS only) and memes. Prices: logos $5, scratch projects $10, websites $15, memes $1."
    },
    {
      title: 'Portfolio — The Awiks Servises',
      url: 'portfolio.html',
      content: 'Team members: Dima Marmuta (Owner, HTML/CSS), Yaroslav Hahun (Designer, Marketer), Maxim Pustovoit (Designer). Ranks and work experience listed.'
    },
    {
      title: 'Contacts — The Awiks Servises',
      url: 'contacts.html',
      content: 'Emails: TheAwiksSupport@gmail.com, TheAwiksServises@gmail.com. Messengers: Discord: TheAwiks.'
    }
  ];

  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);

  function score(page) {
    const text = (page.title + ' ' + page.content).toLowerCase();
    let s = 0;
    for (const t of terms) {
      const re = new RegExp(escapeRegExp(t), 'g');
      const count = (text.match(re) || []).length;
      s += count * 10;
      if (page.title.toLowerCase().includes(t)) s += 5;
    }
    return s;
  }

  pages.forEach(p => p.score = score(p));
  const results = pages.filter(p => p.score > 0).sort((a,b) => b.score - a.score);

  if (results.length === 0) {
    resultsEl.innerHTML = `<p>No results found for "${escapeHtml(q)}".</p>`;
    return;
  }

  // Render results
  const list = document.createElement('div');
  list.className = 'search-results-list';
  for (const r of results) {
    const item = document.createElement('div');
    item.className = 'search-result-item';

    const h3 = document.createElement('h3');
    const a = document.createElement('a');
    a.href = r.url;
    a.textContent = r.title;
    h3.appendChild(a);

    const urlP = document.createElement('p');
    urlP.className = 'search-result-url';
    urlP.textContent = r.url;

    const snippet = makeSnippet(r.content, terms);
    const snipP = document.createElement('p');
    snipP.className = 'search-result-snippet';
    snipP.innerHTML = snippet;

    item.appendChild(h3);
    item.appendChild(urlP);
    item.appendChild(snipP);
    list.appendChild(item);
  }

  resultsEl.appendChild(list);

  // Helpers
  function makeSnippet(text, terms) {
    const lower = text.toLowerCase();
    let idx = -1;
    for (const t of terms) {
      idx = lower.indexOf(t);
      if (idx !== -1) break;
    }
    let start = 0;
    if (idx > 0) start = Math.max(0, idx - 30);
    let snippet = text.substring(start, start + 160);
    snippet = escapeHtml(snippet);
    for (const t of terms) {
      const re = new RegExp('(' + escapeRegExp(t) + ')', 'ig');
      snippet = snippet.replace(re, '<mark>$1</mark>');
    }
    return snippet + (text.length > start + 160 ? '…' : '');
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
});

const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('temp.html', 'utf-8');
const $ = cheerio.load(html);

const animeList = [];
$('h2').each((i, el) => {
  const title = $(el).text().trim();
  if (!title || title.includes('目次') || title.includes('一覧')) return;

  // The content for this anime is usually in the DOM after the h2
  // We can get the next elements until the next h2
  let content = '';
  let nextEl = $(el).next();
  while (nextEl.length > 0 && nextEl[0].name !== 'h2' && nextEl[0].name !== 'style') {
    content += nextEl.text() + '\n';
    nextEl = nextEl.next();
  }

  animeList.push({
    title,
    synopsis: content.substring(0, 100).replace(/\n/g, ' '),
  });
});

console.log(animeList.slice(0, 5));

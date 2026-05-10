const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('temp.html', 'utf-8');
const $ = cheerio.load(html);

const animeList = [];
$('h2').each((_, el) => {
  const title = $(el).text().trim();
  if (!title || title.includes('目次') || title.includes('一覧')) return;

  let contentText = '';
  let image_url = '';
  let official_site = '';
  let nextEl = $(el).next();

  while (nextEl.length > 0 && nextEl[0].name !== 'h2' && nextEl[0].name !== 'style') {
    contentText += nextEl.text() + '\n';
    if (!image_url) image_url = nextEl.find('img').attr('src') || '';
    if (!official_site) official_site = nextEl.find('a:contains("公式サイト")').attr('href') || '';
    nextEl = nextEl.next();
  }

  const copyMatch = contentText.match(/[\(（]?[Cc©][\)）]?.{1,200}/);
  const copyright = copyMatch ? copyMatch[0].trim().substring(0, 150) : '';
  const synopsis = contentText.replace(title, '').replace(/[\n\t\r]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);

  if (image_url && !image_url.startsWith('http')) image_url = `https://www.animatetimes.com${image_url}`;

  animeList.push({ title, image_url, copyright, synopsis, official_site });
});

console.log(animeList.slice(0, 3));

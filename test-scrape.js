const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('temp.html', 'utf-8');
const $ = cheerio.load(html);
const result = [];
$('.c-anime').each((i, el) => {
  const $el = $(el);
  const title = $el.find('h2, .name').text().trim();
  result.push({ title });
});
console.log('c-anime block count:', $('.c-anime').length);
console.log('c-anime titles:', result.slice(0, 5));

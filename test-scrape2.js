const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('temp.html', 'utf-8');
const $ = cheerio.load(html);

// List all <h2> tags
console.log('--- H2 Tags ---');
console.log($('h2').map((i, el) => $(el).text().trim()).get().slice(0, 10));

// Let's see if there is any other block structure
const classes = {};
$('*').each((i, el) => {
  const cls = $(el).attr('class');
  if (cls) {
    cls.split(' ').forEach(c => {
      if (c.includes('anime') || c.includes('detail') || c.includes('title')) {
        classes[c] = (classes[c] || 0) + 1;
      }
    });
  }
});
console.log('--- Relevant Classes ---');
console.log(Object.entries(classes).sort((a,b)=>b[1]-a[1]).slice(0, 20));

const fs = require('fs');
fetch('https://www.animatetimes.com/tag/details.php?id=5228', {headers:{'User-Agent':'Mozilla/5.0'}})
  .then(r => r.text())
  .then(t => {
    fs.writeFileSync('temp.html', t);
    const cheerio = require('cheerio');
    const $ = cheerio.load(t);
    const classes = new Set();
    $('*').each((i, el) => {
      const cls = $(el).attr('class');
      if (cls) cls.split(' ').forEach(c => classes.add(c));
    });
    console.log(Array.from(classes).filter(c => c.includes('tag_detail') || c.includes('anime')));
  });

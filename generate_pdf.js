const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/substitution-cards', {waitUntil: 'networkidle0'});
    await page.evaluate(() => {
      const btn = document.querySelector('.no-print');
      if (btn) btn.style.display = 'none';
    });
    await page.pdf({
      path: 'public/Substitution-Cards.pdf',
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        bottom: '0',
        left: '0',
        right: '0'
      }
    });
    await browser.close();
    console.log('PDF generated successfully');
  } catch(e) {
    console.error(e);
  }
})();

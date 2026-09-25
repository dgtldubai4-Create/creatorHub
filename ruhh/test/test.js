/*
 * End-to-end smoke tests for the Ruhh single-file app (ruhh/index.html).
 * Run: NODE_PATH=<path with playwright> node test.js
 * Requires playwright + a Chromium install it can find.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8932;
const results = [];
function log(name, ok, detail) { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`); }

(async () => {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(path.join(__dirname, '..', 'index.html')));
  }).listen(PORT);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

  // stub dialogs + window.open so WhatsApp handoffs are capturable
  await page.addInitScript(() => {
    window.__opened = [];
    window.open = (u) => { window.__opened.push(u); return null; };
    window.confirm = () => true;
    window.alert = (m) => { (window.__alerts = window.__alerts || []).push(m); };
    window.prompt = () => window.__pin === undefined ? '2019' : window.__pin;
  });

  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForTimeout(300);

  // Home + menu
  log('home hero renders', await page.locator('.hero h1').count() === 1);
  log('2 specials on home', await page.locator('#specialsHome .special-card').count() === 2);
  await page.click('.nav-tab[data-page="menu"]');
  log('menu renders all 19 items', await page.locator('.mcard').count() === 19, `cards=${await page.locator('.mcard').count()}`);
  log('category row All + 6', await page.locator('.cat-btn').count() === 7);

  // Unpriced items say "price on request", never AED 0
  await page.click('.cat-btn:has-text("Chocolate Barks")');
  const barkPrice = await page.locator('.mcard .mprice').first().textContent();
  log('unpriced bark shows "price on request"', barkPrice.includes('price on request'), barkPrice.trim());
  await page.click('.mcard:has-text("Milk Chocolate with Pistachio")');
  await page.waitForTimeout(200);
  const askBtn = await page.locator('#modalContent button:has-text("Ask price on WhatsApp")').count();
  log('unpriced item picker offers WhatsApp ask instead of add', askBtn === 1);
  await page.click('#modalContent button:has-text("Ask price on WhatsApp")');
  await page.waitForTimeout(200);
  const askOpened = await page.evaluate(() => window.__opened);
  log('ask-price opens wa.me', askOpened.length === 1 && askOpened[0].startsWith('https://wa.me/'), decodeURIComponent(askOpened[0] || '').slice(0, 80));
  log('unpriced item never entered cart', await page.locator('#cartCount').textContent() === '0');
  await page.evaluate(() => { window.__opened = []; });

  // Direct add + mix box
  await page.click('.cat-btn:has-text("Mono Cheesecakes")');
  await page.click('.mcard >> nth=0');
  await page.waitForTimeout(200);
  log('single-size item adds directly', await page.locator('#cartCount').textContent() === '1');
  log('toast confirms the add', (await page.locator('#toast.show').textContent().catch(() => '')).includes('added to cart'));
  log('cart pill pops on add', await page.locator('.cart-pill.pop').count() >= 1);
  await page.click('.cat-btn:has-text("Cookies")');
  await page.click('.mcard:has-text("Build Your Own Cookie Box")');
  await page.waitForTimeout(200);
  log('mix picker opens', await page.locator('#modal').isVisible());
  log('mix add blocked until full', await page.locator('#modalContent .btn-p').isDisabled());
  for (let i = 0; i < 3; i++) await page.click('.mix-row:has-text("Dark Chocolate Chip") .qbtn:last-child');
  for (let i = 0; i < 3; i++) await page.click('.mix-row:has-text("Milk Chocolate Chip") .qbtn:last-child');
  await page.click('.mix-row:has-text("White Chocolate Chip") .qbtn:last-child'); // must be a no-op
  log('mix capped at box size', (await page.locator('#mixCounter').textContent()).includes('6 of 6'));
  await page.click('#modalContent .btn-p');
  await page.waitForTimeout(200);
  log('mixed box added', await page.locator('#cartCount').textContent() === '2');

  // Cart, fees, day picker
  await page.click('.nav-tab[data-page="order"]');
  const summary = (await page.locator('#summaryBox').textContent()).replace(/\s+/g, ' ');
  log('delivery total 35+60+15=110', summary.includes('110'), summary.slice(-60));
  await page.click('.del-opt:has-text("Pickup")');
  log('pickup total 95, address hidden', (await page.locator('#summaryBox').textContent()).includes('95') && !(await page.locator('#addrRow').isVisible()));
  await page.click('.del-opt:has-text("Delivery")');
  log('day picker has 7 options starting Today', await page.locator('#ddate option').count() === 7 && (await page.locator('#ddate option').first().textContent()).startsWith('Today'));

  // Validation then place order
  await page.click('button:has-text("Confirm & send to Shweta")');
  log('empty form blocked', await page.locator('#err-cname.show').count() === 1 && (await page.evaluate(() => window.__opened.length)) === 0);
  await page.fill('#addr', 'Villa 12, Jumeirah 1, Dubai');
  await page.fill('#cname', "Tester O'Brien");
  await page.fill('#cphone', '+971 50 123 4567');
  await page.selectOption('#ddate', { index: 1 });
  await page.click('button:has-text("Confirm & send to Shweta")');
  await page.waitForTimeout(200);
  const opened = await page.evaluate(() => window.__opened);
  const waMsg = decodeURIComponent((opened[0] || '').split('text=')[1] || '');
  log('order opens wa.me with message', opened.length === 1 && opened[0].startsWith('https://wa.me/'));
  log('message has When: Tomorrow + total 110', waMsg.includes('When: Tomorrow') && waMsg.includes('Total: AED 110'), waMsg.split('\n').find(l => l.startsWith('When')) || '');
  log('success box + cart cleared', (await page.locator('#successBox.show').isVisible()) && (await page.locator('#cartCount').textContent()) === '0');

  // Track: honest initial state
  await page.click('.nav-tab[data-page="track"]');
  const nowStep = (await page.locator('.tlabel.now').textContent().catch(() => '')).trim();
  log('new order starts at "Order sent"', nowStep === 'Order sent', `now=${nowStep}`);
  log('5 tracking steps', await page.locator('.tstep').count() === 5);

  // Search spans all categories
  await page.click('.nav-tab[data-page="menu"]');
  await page.click('.cat-btn:has-text("Cookies")');
  await page.fill('#srch', 'tiramisu');
  await page.waitForTimeout(200);
  log('search ignores active category filter', await page.locator('.mcard').count() === 1, `cards=${await page.locator('.mcard').count()}`);
  await page.fill('#srch', '');

  // Admin PIN gate
  await page.evaluate(() => { window.__pin = '9999'; });
  await page.click('.admin-link');
  await page.waitForTimeout(200);
  log('wrong PIN keeps admin closed', !(await page.locator('#adminApp').isVisible()));
  await page.evaluate(() => { window.__pin = '2019'; });
  await page.click('.admin-link');
  await page.waitForTimeout(200);
  log('correct PIN opens admin', await page.locator('#adminApp').isVisible());
  await page.click('.admin-tab[data-tab="settings"]');
  log('placeholder WhatsApp number warning shown', await page.locator('#waWarn').isVisible());
  await page.click('.admin-tab[data-tab="menu"]');

  // Quotes in admin-entered names must not break markup or handlers
  const nameInput = page.locator('.item-card >> nth=0 >> input[aria-label="Item name"]');
  await nameInput.fill('6" Celebration Cake');
  await nameInput.dispatchEvent('change');
  const sizeLabel = page.locator('.item-card >> nth=0 >> .size-row >> nth=0 >> input[aria-label="Size label"]');
  await sizeLabel.fill(`8" round`);
  await sizeLabel.dispatchEvent('change');
  await page.click('.save-btn');
  await page.click('.exit-admin');
  await page.waitForTimeout(300);
  await page.click('.nav-tab[data-page="menu"]');
  const errsBefore = consoleErrors.length;
  await page.click('.mcard:has-text("Celebration")');
  await page.waitForTimeout(300);
  const chipTxt = await page.locator('.pchip').first().textContent().catch(() => 'NO CHIP');
  log('quoted name + size render in picker', chipTxt.includes('8" round'), JSON.stringify(chipTxt));
  await page.click('.pchip >> nth=1');
  await page.click('.pchip >> nth=0');
  await page.waitForTimeout(200);
  log('clicking quoted size chip works (no JS errors)', consoleErrors.length === errsBefore && (await page.locator('.pchip.sel').first().textContent()).includes('8"'), consoleErrors.slice(errsBefore).join('~').slice(0, 120));
  await page.keyboard.press('Escape');

  // Admin edits survive a DATA_VERSION reseed (ruh_admin_touched)
  await page.evaluate(() => localStorage.setItem('ruh_ver', 'stale-version'));
  await page.reload();
  await page.waitForTimeout(300);
  const stillEdited = await page.evaluate(() => (JSON.parse(localStorage.getItem('ruh_menu')) || []).some(m => m.name.includes('Celebration')));
  log('admin edits survive version reseed', stillEdited);

  // Orders persist
  log('order persisted across reload', (await page.evaluate(() => JSON.parse(localStorage.getItem('ruh_orders') || '[]').length)) === 1);

  log('no console/page errors in whole session', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' ~ ').slice(0, 200));

  await browser.close();
  server.close();
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  process.exit(passed === results.length ? 0 : 1);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });

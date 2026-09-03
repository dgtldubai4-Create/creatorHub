/*
 * Cloud-sync end-to-end tests: drives TWO browser contexts (Shweta's device + a customer's
 * device) against a mock Supabase backend implementing the same REST/RPC surface as
 * supabase-schema.sql. Verifies: publish → other device sees the menu; order → appears in
 * the admin Orders tab; advance → the customer's tracker moves.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const APP_PORT = 8936, CLOUD_PORT = 8937;
const TOKEN = 'test-token-1234567890';
const results = [];
function log(name, ok, detail) { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`); }

// ---- mock Supabase ----
const db = { site: { data: {} }, orders: [] };
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, apikey, authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}
const cloud = http.createServer((req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(obj === undefined ? '' : JSON.stringify(obj)); };
    const url = req.url.split('?')[0];
    if (req.method === 'GET' && url === '/rest/v1/site') return send(200, [{ data: db.site.data }]);
    if (req.method === 'POST' && url.startsWith('/rest/v1/rpc/')) {
      const fn = url.slice('/rest/v1/rpc/'.length);
      let a = {}; try { a = JSON.parse(body || '{}'); } catch (e) {}
      const authed = a.p_token === TOKEN;
      switch (fn) {
        case 'publish_site':
          if (!authed) return send(401, { message: 'invalid admin token' });
          db.site.data = a.p_data; return send(204);
        case 'create_order':
          db.orders.unshift({ code: a.p_code, key: a.p_key, payload: a.p_payload, status: 0, created_at: new Date().toISOString() });
          return send(204);
        case 'get_order': {
          const o = db.orders.find(x => x.code === a.p_code && x.key === a.p_key);
          return send(200, o ? [{ status: o.status }] : []);
        }
        case 'list_orders':
          if (!authed) return send(401, { message: 'invalid admin token' });
          return send(200, db.orders.map(({ code, status, payload, created_at }) => ({ code, status, payload, created_at })));
        case 'set_order_status': {
          if (!authed) return send(401, { message: 'invalid admin token' });
          const o = db.orders.find(x => x.code === a.p_code);
          if (o) o.status = Math.max(0, Math.min(4, a.p_status));
          return send(204);
        }
      }
      return send(404, { message: 'unknown rpc ' + fn });
    }
    send(404, { message: 'not found' });
  });
}).listen(CLOUD_PORT);

(async () => {
  const app = http.createServer((q, s) => { s.setHeader('Content-Type', 'text/html'); s.end(fs.readFileSync(path.join(__dirname, '..', 'index.html'))); }).listen(APP_PORT);
  const browser = await chromium.launch();
  const initFor = (pin) => `
    window.RUHH_CLOUD = { url: 'http://localhost:${CLOUD_PORT}', anonKey: 'mock-anon-key' };
    window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; };
    window.confirm = () => true; window.alert = () => {}; window.prompt = () => '${pin}';
  `;

  // ---- Shweta's device: set token, edit menu, publish ----
  const shweta = await browser.newContext({ viewport: { width: 900, height: 900 } });
  const sp = await shweta.newPage();
  const errsA = []; sp.on('pageerror', e => errsA.push(e.message));
  await sp.addInitScript(initFor('2019'));
  await sp.goto(`http://localhost:${APP_PORT}/`);
  await sp.click('.admin-link');
  await sp.waitForSelector('#adminApp', { state: 'visible' });
  await sp.click('.admin-tab[data-tab="settings"]');
  log('cloud status shows connected', (await sp.locator('#cloudStatus').textContent()).includes('Connected'));
  await sp.fill('#setToken', TOKEN);
  await sp.click('.admin-tab[data-tab="menu"]');
  const nameInput = sp.locator('.item-card >> nth=0 >> input[aria-label="Item name"]');
  await nameInput.fill('Cloud Cookie Box');
  await nameInput.dispatchEvent('change');
  await sp.click('.save-btn');
  await sp.waitForFunction(() => document.getElementById('saveStatus').textContent.includes('published'), null, { timeout: 5000 });
  log('save publishes to backend', !!(db.site.data.menu && db.site.data.menu[0].name === 'Cloud Cookie Box'));
  log('published settings exclude PIN and token', db.site.data.settings && db.site.data.settings.adminPin === undefined && db.site.data.settings.adminToken === undefined);

  // ---- customer device: sees the published menu, places an order ----
  const cust = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const cp = await cust.newPage();
  const errsB = []; cp.on('pageerror', e => errsB.push(e.message));
  await cp.addInitScript(initFor('2019'));
  await cp.goto(`http://localhost:${APP_PORT}/`);
  await cp.click('.nav-tab[data-page="menu"]');
  await cp.waitForSelector('.mcard:has-text("Cloud Cookie Box")', { timeout: 5000 });
  log('second device receives published menu', true);
  await cp.click('.cat-btn:has-text("Mono Cheesecakes")');
  await cp.click('.mcard >> nth=0');
  await cp.click('.nav-tab[data-page="order"]');
  await cp.fill('#addr', 'Marina Walk, Dubai');
  await cp.fill('#cname', 'Cloud Customer');
  await cp.fill('#cphone', '+971501112222');
  await cp.click('button:has-text("Confirm & send to Shweta")');
  await cp.waitForTimeout(400);
  log('order stored centrally with status 0', db.orders.length === 1 && db.orders[0].status === 0 && db.orders[0].payload.name === 'Cloud Customer');
  log('WhatsApp handoff still happens', (await cp.evaluate(() => window.__opened.length)) === 1);

  // ---- Shweta: sees the order, advances it twice ----
  await sp.click('.admin-tab[data-tab="orders"]');
  await sp.waitForSelector('#adminOrdersList .admin-card', { timeout: 5000 });
  const orderCard = await sp.locator('#adminOrdersList').textContent();
  log('admin Orders tab lists the live order', orderCard.includes('Cloud Customer') && orderCard.includes('AED'));
  await sp.click('#adminOrdersList button:has-text("Advance to")');
  await sp.waitForFunction(() => document.querySelector('#adminOrdersList')?.textContent.includes('Advance to “Baking”'), null, { timeout: 5000 });
  await sp.click('#adminOrdersList button:has-text("Advance to")');
  await sp.waitForFunction(() => document.querySelector('#adminOrdersList')?.textContent.includes('Advance to “On the way”'), null, { timeout: 5000 });
  log('advance updates backend status to 2 (Baking)', db.orders[0].status === 2);

  // ---- customer: tracker reflects the new status ----
  await cp.click('.nav-tab[data-page="track"]');
  await cp.waitForFunction(() => document.querySelector('.tlabel.now')?.textContent.trim() === 'Baking', null, { timeout: 5000 });
  log('customer tracker moves to Baking', true);

  log('no page errors on either device', errsA.length === 0 && errsB.length === 0, [...errsA, ...errsB].join(' ~ ').slice(0, 150));

  await browser.close(); app.close(); cloud.close();
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} cloud checks passed`);
  process.exit(passed === results.length ? 0 : 1);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });

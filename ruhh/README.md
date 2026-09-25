# Ruhh — by Shweta 🧁

Single-file bakery storefront (`index.html`): customer menu + cart + WhatsApp checkout,
a hidden admin panel (the `·` in the footer, PIN-gated), and **optional cloud sync** so
Shweta's menu edits reach every customer and order statuses update the customer's tracker live.

See `ANALYSIS.md` for the audit of the original version and everything that was fixed.

## Modes

| | Offline (default) | Cloud sync enabled |
| --- | --- | --- |
| Menu edits in admin | This device only | Published to all customers on Save |
| Orders | WhatsApp message only | WhatsApp **+** stored centrally |
| Admin → Orders tab | Explains how to enable | Live orders with "Advance" buttons |
| Customer tracker | Stays at "Order sent" | Moves as Shweta advances the order |

With the `CLOUD` constant left empty the app behaves exactly like a static page — nothing
breaks, nothing is required.

## Go-live checklist

1. **WhatsApp number** — in `index.html`, set `DEFAULT_SETTINGS.waNumber` to the real number
   (international format, digits only). Until then every order button targets the placeholder
   `971500000000` and the admin Settings tab shows a red warning.
2. **Bark prices** — the Chocolate Barks ship with `price: 0`; they render as "price on
   request → Ask on WhatsApp" until real prices are entered.
3. **Admin PIN** — change the default (`2019`) in Admin → Settings.
4. Bump `DATA_VERSION` whenever you change the defaults in the file, so returning visitors
   get the new menu (devices with saved admin edits are never overwritten).

## Enabling cloud sync (≈10 minutes, free tier)

1. Create a project at [supabase.com](https://supabase.com).
2. Dashboard → SQL editor → paste and run `supabase-schema.sql`. Uncomment the final
   `insert into admin_secret …` line first and set a long random token.
3. Dashboard → Settings → API: copy the **Project URL** and **anon public key** into
   `index.html`:
   ```js
   const CLOUD = Object.assign({url: 'https://YOURREF.supabase.co', anonKey: 'eyJ…'}, window.RUHH_CLOUD || {});
   ```
4. Deploy the file. On Shweta's phone: Admin → Settings → Cloud sync → paste the admin
   token → Save. From then on, Save publishes the menu to everyone, the Orders tab shows
   live orders, and advancing an order moves that customer's tracker.

Security shape: the anon key is public by design; all writes except order creation require
the admin token (verified server-side inside SQL functions), customers can only read their
own order's status via its per-order secret key, and the `orders`/`admin_secret` tables have
no direct anonymous access.

## Tests

```bash
cd test
NODE_PATH=<node_modules containing playwright> node test.js        # 33 offline checks
NODE_PATH=<node_modules containing playwright> node cloud-test.js  # 10 cloud-sync checks (mock backend)
```

Both suites drive the real page in headless Chromium: rendering, the mix-a-box flow,
delivery/pickup totals, validation, the WhatsApp handoff, tracking, search, the PIN gate,
quote-safe rendering, reseed behavior — and for cloud: publish → second device sees the menu,
order → appears in admin Orders, advance → customer tracker moves.

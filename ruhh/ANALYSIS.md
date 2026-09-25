# Ruhh — App Analysis, Test Results & Rebuild Notes

**App:** "Ruhh — by Shweta" — single-file HTML bakery storefront (customer app + hidden admin
panel), localStorage persistence, WhatsApp checkout.
**Analyzed:** `original/ruhh-v1.html` (the uploaded version).
**Rebuilt:** `index.html` (same design & architecture, bugs fixed).
**Tests:** `test/test.js` — 31 automated end-to-end checks in headless Chromium (Playwright).
All 31 pass against the rebuild; the original fails the escaping and zero-price checks.

---

## 1. What's wrong (confirmed by running the app)

### Critical

1. **Orders go to a placeholder WhatsApp number.** `DEFAULT_SETTINGS.waNumber` is
   `971500000000`. Every "Confirm & send", "Chat with Shweta", and "Reserve" button opens
   `wa.me/971500000000` — a dead number. Setting the real number in the admin panel only fixes
   it *on that one device* (see #2), so in practice **every customer's order goes nowhere**
   until the number is hardcoded in the file.
   *Fix in rebuild:* the placeholder is a named constant and the admin Settings tab shows a red
   warning until it's replaced. The real fix is editing `DEFAULT_SETTINGS` before deploying.

2. **Admin edits never reach customers.** There is no backend: menu, prices, specials, logo and
   settings are saved to `localStorage` — i.e. only the browser they were edited in. Shweta
   editing her menu on her phone changes nothing for anyone else. The only real publishing
   mechanism is editing `DEFAULT_MENU` in the HTML file and bumping `DATA_VERSION`.
   *Architectural limit — documented, not fixable client-side (see §3, "What's missing").*

3. **Broken escaping → broken markup and JS errors (self-XSS surface).** `escapeAttr()`
   backslash-escaped quotes (`\"`), which does nothing in HTML attributes — backslash is not an
   escape character there. Verified live: renaming an item to `6" Celebration Cake` or a size to
   `8" round` in the admin panel produced mangled attributes (`aria-label="Add 6\"`) and clicking
   the size chip threw `SyntaxError: Invalid or unexpected token`, making the size unselectable.
   Any admin-entered name/label/flavour/category containing a quote corrupts the storefront.
   *Fix in rebuild:* `escapeAttr` deleted; user-entered strings are only ever emitted through
   `escapeHtml` (safe for text and double-quoted attributes), and inline handlers receive
   numeric indexes (`pickSize(2)`) instead of interpolated strings.

4. **AED 0 items are fully orderable.** All Chocolate Barks have `price: 0` ("prices pending"),
   but the storefront shows "from AED 0" and happily lets a customer order a 1 kg bark for
   AED 0 — a real business/monetary bug.
   *Fix in rebuild:* unpriced items show **"price on request"**; the picker replaces "Add to
   cart" with **"Ask price on WhatsApp"**, and `addConfigured`/`addSpecialToCart` refuse
   zero-price lines. (Real prices still need to be entered.)

### High

5. **The tracker lies.** New orders were stored with `status: 1`, rendering "Confirmed ✓,
   **Baking** ←" the second the customer pressed the button — before Shweta had even seen the
   WhatsApp message. And since nothing can ever update the status (no backend, orders live on
   the *customer's* device where the admin panel can't see them), every order shows "Baking"
   forever, and "In progress" in past orders forever.
   *Fix in rebuild:* honest 5-step, mode-aware tracker — *Order sent → Confirmed → Baking →
   On the way/Ready for pickup → Delivered/Picked up* — starting at "Order sent" with copy
   explaining updates arrive via WhatsApp. Real tracking needs a backend (§3).

6. **Admin panel has zero authentication.** The `·` button in the footer opens the full menu
   editor for any customer who finds it. Blast radius is limited to their own device (see #2),
   but a customer can silently corrupt their own copy of the menu/prices.
   *Fix in rebuild:* a PIN gate (default `2019`, changeable in Settings), clearly labeled as a
   convenience lock, not security — nothing client-side can be.

7. **`DATA_VERSION` reseed wipes Shweta's edits.** Any version bump overwrote `ruh_menu`,
   `ruh_cats`, `ruh_specials` on every device — including the owner's device with her saved
   admin work.
   *Fix in rebuild:* devices where the admin has saved (`ruh_admin_touched` flag) are skipped
   by the reseed. Verified by test.

### Medium / low

8. **Search only searched the selected category** — searching "tiramisu" while on the Cookies
   tab returned "No treats found". *Fixed: a query searches the whole menu (incl. category names).*
9. **Order IDs collide across customers.** `RUH-YYMMDD-001` was a per-device counter, so every
   customer's first order of the day had the same ID. *Fixed: random base-36 suffix.*
10. **Storage-quota failures were silent.** Every `saveX()` swallowed exceptions; uploading a
    few photos could blow the ~5 MB localStorage quota and drop menu data with "Saved just now"
    still shown. *Fixed: saves report success/failure; the save bar shows a real warning.*
11. **No date selection.** Customers picked a time slot but no *day* — Shweta had to ask on
    WhatsApp. *Fixed: 7-day day picker, included in the order + WhatsApp message + tracker.*
12. **Phone validation accepted absurd input** (any 7+ digits, e.g. 40 digits). *Fixed: 7–15.*
13. **Dead code:** `orderViaWA()` was unreachable. *Removed.*
14. **No favicon, meta description, or theme-color.** *Added (emoji-style SVG favicon).*
15. **Minor a11y gaps:** nav tabs lacked `role="tab"`/`aria-selected`. *Added.* (Modal focus
    trapping is still not implemented — noted below.)
16. **Fragile inline `onerror` in the picker image** interpolated the emoji into a nested JS
    string. *Removed (SVG data-URI images can't fail to load).*

## 2. Test results

`test/test.js` spins up a local HTTP server, drives the app in headless Chromium at iPhone-ish
viewport (390×844), stubs `window.open`/`prompt`/`confirm`, and checks 31 behaviors:
rendering (19 items, 6+1 categories, 2 specials), unpriced-item flows, direct add, the full
mix-a-box flow (blocked until 6/6, capped, added), delivery vs pickup totals (110 vs 95 AED),
day picker, form validation, WhatsApp message content (`When: Tomorrow…`, `Total: AED 110`),
honest tracking state, cross-category search, PIN gate (wrong PIN rejected), the placeholder-
number warning, quote-safe rendering/handlers, reseed-preserves-edits, persistence across
reload, and zero console/page errors.

**Original:** fails quote-escaping (JS `SyntaxError`), shows/orders AED 0 items, starts tracking
at "Baking", opens admin with no gate. **Rebuild: 31/31 pass.**

## 3. What's missing (can't be fixed inside a static single file)

In rough priority order — these are the gaps between "demo" and "business":

1. **A backend (the big one).** One shared source of truth would fix #1/#2/#5 at the root:
   Shweta edits the menu once, everyone sees it; orders are stored centrally; she can advance
   order status and the customer's tracker actually moves. Smallest viable version: a tiny
   hosted DB/API (e.g. Supabase/Firebase — menu + orders tables) with this same front end;
   the current localStorage layer already has clean load/save seams to swap out.
2. **Real data:** Chocolate Bark prices (8 sizes across 4 products are AED 0), Shweta's real
   WhatsApp number, real product photos (current images are generated SVG placeholder tiles),
   and a real brand logo.
3. **Payments.** Everything is pay-on-WhatsApp. Even a payment-link field per order
   (Stripe/Tap/PayBy link pasted by Shweta) would close the loop.
4. **Order notifications that work.** The "WhatsApp updates" / "Weekly specials" toggles in the
   order form are decorative — nothing reads them and no system sends anything. Weekly specials
   broadcast needs WhatsApp Business tooling.
5. **Business rules:** minimum order value, delivery zones/fees by area, lead time (a 1 kg
   cheesecake probably can't arrive in 2 hours), daily capacity/stock, closed days.
6. **Ops basics:** no way for Shweta to see orders anywhere except her WhatsApp thread — an
   Orders view needs the backend; no analytics; no error reporting.
7. **PWA polish:** manifest + service worker for install/offline, Open Graph tags for link
   previews when the site is shared on WhatsApp/Instagram.
8. **Deeper a11y:** modal focus trap + focus return, `aria-live` announcements for cart
   changes, full keyboard pass.
9. **Legal/trust:** no contact/about details beyond WhatsApp, no terms/refund policy, no
   food-safety/allergen listing (only a free-text notes field).

## 4. Files

| Path | What |
| --- | --- |
| `index.html` | Rebuilt app (deploy this — after setting the real WhatsApp number) |
| `original/ruhh-v1.html` | The uploaded original, unchanged, for diffing |
| `test/test.js` | Playwright end-to-end suite (31 checks) |
| `ANALYSIS.md` | This document |

**Before going live:** set `waNumber` in `DEFAULT_SETTINGS` to the real number, fill in bark
prices in `DEFAULT_MENU`, change the default admin PIN, and bump `DATA_VERSION`.

---

## 5. Update — round 2: backend sync + frontend motion layer

Items **§3.1** (backend) and the tracker/menu-publishing gaps are now addressed:

- **Cloud sync (optional, Supabase-ready).** `supabase-schema.sql` + a small client adapter in
  `index.html` (`CLOUD` constant). When configured: admin **Save publishes** the menu/prices/
  specials to every customer; orders are stored centrally as well as sent on WhatsApp; a new
  **admin Orders tab** lists live orders with one-tap "Advance" buttons; the customer's tracker
  polls and **actually moves**. All writes except order creation are guarded by an admin token
  checked server-side; customers read only their own order status via a per-order secret; the
  published settings never include the PIN or token. With `CLOUD` left empty the app runs
  exactly as before (offline, localStorage). Setup steps in `README.md`.
- **Look & feel — the three changes** (with animations/interactions throughout):
  1. **Motion system** — page transitions, staggered card/special/cart entrances, hero text
     cascade, all under `prefers-reduced-motion: reduce`.
  2. **Cart micro-interactions** — fly-to-cart morsel, cart-pill pop + count bump, and a toast
     ("🍪 … added to cart") on every add.
  3. **Hero & depth polish** — shimmering gradient on the headline, floating pastry accents,
     richer card hover lift + shadows, pressed-state scaling on all buttons, nav shadow on
     scroll, pulsing "current step" dot on the tracker.
- **Tests:** offline suite grew to **33 checks**; a new `test/cloud-test.js` drives two browser
  contexts (Shweta + a customer) against a mock Supabase backend for **10 more** — publish →
  second device sees it; order → Orders tab; advance ×2 → customer tracker shows "Baking".
  **43/43 passing.**

# AirRide Cabs

Taxi booking site (airport / outstation / one-way / local). Plain HTML/CSS/JS frontend + Vercel serverless API. No framework, no build step, no dependencies. Fast and free to host.

## Structure

```
public/                 → static frontend, served from Vercel's CDN
  index.html
  assets/css/styles.css
  assets/js/app.js      → UI logic; loads fares from /api/fares, posts to /api/bookings
  favicon.png, apple-touch-icon.png
  assets/images/logo.webp  → brand logo (header/footer)
api/                    → serverless functions (one file = one endpoint)
  fares.js              → GET  /api/fares     (edge-cached for 1h)
  bookings.js           → POST /api/bookings  (validate → price → notify)
lib/                    → shared backend code
  fleet.js              → vehicles & fares (single source of truth)
  validate.js           → input validation / sanitising
  notify.js             → booking alerts: WhatsApp (CallMeBot), Google Sheet, Telegram
integrations/
  google-sheet.gs       → Apps Script that logs bookings into a Google Sheet
scripts/
  dev.js                → zero-dependency local server
  api.test.js           → API tests
vercel.json             → output dir, cache + security headers, function limits
```

## Run locally

```bash
npm run dev     # http://localhost:3000
npm test
```

## Deploy to Vercel (free Hobby plan)

1. Push this folder to a GitHub repo.
2. vercel.com → **Add New Project** → import the repo → Framework preset: **Other** → Deploy.
   (or from the terminal: `npx vercel` then `npx vercel --prod`)
3. **Set up booking alerts (WhatsApp + Google Sheet): follow [SETUP-BOOKINGS.md](SETUP-BOOKINGS.md).** Without this, form bookings reach no one.

## Customise

- Phone / WhatsApp numbers: `public/index.html` and `WHATSAPP_NUMBER` in `public/assets/js/app.js`
- Fares & cars: `lib/fleet.js`
- Colours: CSS variables at the top of `public/assets/css/styles.css`
- After editing CSS/JS, bump `?v=1` in `index.html`, because assets are cached for a year.

## Car photos

`public/assets/images/cars/<vehicle-id>.webp` (800px wide, ~40–70 KB each). Source photos are from Wikimedia Commons; each one's author and licence are stored in `lib/fleet.js` and listed under "Photo credits" in the footer, as the CC licences require.
To use your own photos: save them as `<vehicle-id>.webp` in that folder (e.g. `cwebp -q 78 -resize 800 0 photo.jpg -o tempo.webp`), and remove that car's `photo` credit if the photo is yours.

## SEO / Google search

Built in: page title + description, canonical `https://airridecabs.in/`, Open Graph tags, structured data
(`WebSite` + `LocalBusiness` JSON-LD in `index.html`), `public/robots.txt`, `public/sitemap.xml`.

After the domain is live:
1. Vercel → Settings → Domains: add `airridecabs.in` + `www.airridecabs.in`, and redirect `air-cabs.vercel.app` → `airridecabs.in`.
2. Google Search Console → add Domain property `airridecabs.in` (verify via DNS TXT) → submit `https://airridecabs.in/sitemap.xml` → URL Inspection → Request indexing.
3. Create a Google Business Profile ("AirRide Cabs", category Taxi service) with the same phone + website.
4. Check structured data at https://search.google.com/test/rich-results.
If the domain ever changes, update the URLs in `index.html`, `robots.txt` and `sitemap.xml`.

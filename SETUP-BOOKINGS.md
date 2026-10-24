# Receive bookings on WhatsApp + Google Sheet

When a customer presses **Book Now**, the backend (`api/bookings.js`) sends the booking to:

1. **WhatsApp** on +91 76769 50652: instant alert
2. **Google Sheet**: one row per booking, so you have the full history and can update the status

Both are free. Setup takes about 10 minutes, and you only do it once.

---

## 1) WhatsApp alert (CallMeBot), about 2 min

1. On the phone that has WhatsApp for **7676950652**, save this contact: **+34 644 51 95 23** (CallMeBot; the number may change, check https://www.callmebot.com/blog/free-api-whatsapp-messages/).
2. Send it this WhatsApp message: `I allow callmebot to send me messages`
3. You'll get a reply with your **API key** (e.g. `123456`).
4. In Vercel → your project → **Settings → Environment Variables**, add:
   - `CALLMEBOT_PHONE` = `+917676950652`
   - `CALLMEBOT_APIKEY` = the key you received

> CallMeBot is a free service for personal alerts. It only sends messages **to your own number**, which is exactly what we need. If you outgrow it, switch to the official WhatsApp Business Cloud API.

## 2) Google Sheet booking log, about 5 min

1. Go to https://sheets.new and name the sheet e.g. **AirRide Bookings**.
2. **Extensions → Apps Script**. Delete what's there and paste everything from `integrations/google-sheet.gs`.
3. On the `const SECRET = "..."` line, replace the text with your own long random text (e.g. `airride-9f3k2m8q7x`). Click **Save**.
4. (Optional) choose `testInsert` in the toolbar and click **Run**. Google asks for permission; allow it. A *Bookings* tab with a test row appears. You can delete that row.
5. **Deploy → New deployment** → type **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** and copy the **Web app URL** (ends in `/exec`).
6. In Vercel → Environment Variables, add:
   - `GOOGLE_SHEET_URL` = the Web app URL
   - `GOOGLE_SHEET_SECRET` = the same secret text from step 3

> "Anyone" only means anyone can *send to* the script. Without the secret, the script rejects the request. Nobody can read your sheet.
> If you edit the script later, use **Deploy → Manage deployments → Edit → New version**, which keeps the same URL.

## 3) Redeploy

Vercel → **Deployments** → ⋯ on the latest → **Redeploy** (env vars only apply after a redeploy).
Then make a test booking on your live site: you should get a WhatsApp message and see a new row in the sheet.

## Viewing and managing bookings

- Open the sheet in the **Google Sheets app** on your phone.
- Change **Status** (New → Confirmed → Driver assigned → Completed / Cancelled) and add **Notes**.
- Use **Data → Create a filter** to show only today's or "New" bookings.

## If something doesn't arrive

- Vercel → your project → **Logs**: every booking is also printed there as `[booking] {...}`, and any delivery problem shows as `[notify] ...`.
- If **both** channels fail, the customer is told to call or WhatsApp you instead, so the booking isn't silently lost.

## Testing locally

Copy `.env.example` to `.env`, fill in the values, run `npm run dev`, and book on http://localhost:3000.

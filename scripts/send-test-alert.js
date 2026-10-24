// Sends one sample booking through every configured channel (WhatsApp / Google Sheet / Telegram).
// Run: npm run test:alert   (reads keys from .env)
import { notifyBooking } from "../lib/notify.js";

const missing = [];
if (!process.env.CALLMEBOT_APIKEY) missing.push("CALLMEBOT_APIKEY (WhatsApp)");
if (!process.env.GOOGLE_SHEET_URL) missing.push("GOOGLE_SHEET_URL (Google Sheet)");
if (missing.length) console.log("Not configured yet:", missing.join(", "), "\n");

const now = new Date();
const result = await notifyBooking({
  id: "ARTEST" + now.getSeconds(),
  tripLabel: "Airport Taxi",
  direction: "Drop to Airport",
  from: "Test pickup – Koramangala",
  to: "Kempegowda International Airport",
  date: now.toISOString().slice(0, 10),
  time: "10:00",
  vehicle: "Swift Dzire (4+1)",
  fare: 699,
  phone: "9999999999",
  createdAt: now.toISOString(),
});

console.log(`\nChannels configured: ${result.channels}, delivered: ${result.delivered}`);
if (!result.channels) console.log("⚠️  Nothing to send to: add your keys to .env first (see SETUP-BOOKINGS.md).");
else if (result.delivered === result.channels) console.log("✅ Check your WhatsApp / Google Sheet now.");
else console.log("⚠️  Some channels failed: see the [notify] errors above.");

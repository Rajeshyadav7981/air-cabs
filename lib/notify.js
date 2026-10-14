// Delivers new bookings to the operator. All channels are optional and
// configured through environment variables (see .env.example / SETUP-BOOKINGS.md),
// so the site works on Vercel's free plan with zero paid services.
//
//   WhatsApp      → CALLMEBOT_PHONE + CALLMEBOT_APIKEY   (instant alert on your phone)
//   Google Sheet  → GOOGLE_SHEET_URL + GOOGLE_SHEET_SECRET (booking history)
//   Telegram      → TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (optional extra)

const TIMEOUT_MS = 8000;

async function send(url, { method = "POST", body } = {}) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "follow", // Google Apps Script answers via a redirect
  });
  const host = new URL(url).host;
  if (!res.ok) throw new Error(`${host} responded ${res.status}`);
  // JSON APIs (Telegram, our Apps Script) report failures as { ok: false }
  if (res.headers.get("content-type")?.includes("json")) {
    const data = await res.json().catch(() => ({}));
    if (data.ok === false) throw new Error(`${host}: ${data.error || data.description || "rejected"}`);
  } else {
    const text = await res.text();
    // CallMeBot returns 200 with an HTML page even when the API key is wrong
    if (/APIKey is invalid|not activated|ERROR/i.test(text)) throw new Error(`${host}: ${text.replace(/<[^>]+>/g, " ").trim().slice(0, 120)}`);
  }
}

export function formatBooking(b) {
  return [
    `🚕 *New booking ${b.id}*`,
    `Trip: ${b.tripLabel}${b.direction ? ` (${b.direction})` : ""}`,
    `From: ${b.from}`,
    b.to ? `To: ${b.to}` : null,
    `When: ${b.date} ${b.time}`,
    `Car: ${b.vehicle}`,
    `Fare: ₹${b.fare}`,
    `Customer: +91 ${b.phone}`,
  ].filter(Boolean).join("\n");
}

export async function notifyBooking(booking) {
  const text = formatBooking(booking);
  const env = process.env;
  const jobs = [];

  if (env.CALLMEBOT_PHONE && env.CALLMEBOT_APIKEY) {
    const q = new URLSearchParams({ phone: env.CALLMEBOT_PHONE, text, apikey: env.CALLMEBOT_APIKEY });
    jobs.push(send(`https://api.callmebot.com/whatsapp.php?${q}`, { method: "GET" }));
  }
  if (env.GOOGLE_SHEET_URL) {
    jobs.push(send(env.GOOGLE_SHEET_URL, { body: { ...booking, secret: env.GOOGLE_SHEET_SECRET || "" } }));
  }
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    jobs.push(send(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { body: { chat_id: env.TELEGRAM_CHAT_ID, text } }));
  }

  // Backup record in Vercel's function logs (Project → Logs) in case every channel fails
  console.log("[booking]", JSON.stringify(booking));

  const results = await Promise.allSettled(jobs);
  const failed = results.filter(r => r.status === "rejected");
  failed.forEach(r => console.error("[notify]", r.reason?.message));
  return { channels: jobs.length, delivered: jobs.length - failed.length };
}

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { notifyBooking } from "../lib/notify.js";

const booking = { id: "ARTEST1", tripLabel: "Airport Taxi", direction: "Drop to Airport", from: "Koramangala", to: "Airport", date: "2026-10-20", time: "06:00", vehicle: "Swift Dzire (4+1)", fare: 699, phone: "9876543210", createdAt: "2026-10-14T10:00:00Z" };
const realFetch = globalThis.fetch;
const realLog = console.log, realErr = console.error;
let calls;

function mockFetch(responder) {
  calls = [];
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), method: opts.method, body: opts.body && JSON.parse(opts.body) });
    return responder(String(url));
  };
}
const json = obj => new Response(JSON.stringify(obj), { headers: { "content-type": "application/json" } });
const html = text => new Response(text, { headers: { "content-type": "text/html" } });

beforeEach(() => {
  for (const k of ["CALLMEBOT_PHONE", "CALLMEBOT_APIKEY", "GOOGLE_SHEET_URL", "GOOGLE_SHEET_SECRET", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]) delete process.env[k];
  console.log = console.error = () => {};
});
afterEach(() => { globalThis.fetch = realFetch; console.log = realLog; console.error = realErr; });

test("no channels configured → nothing sent", async () => {
  mockFetch(() => json({ ok: true }));
  assert.deepEqual(await notifyBooking(booking), { channels: 0, delivered: 0 });
  assert.equal(calls.length, 0);
});

test("WhatsApp (CallMeBot) and Google Sheet both receive the booking", async () => {
  Object.assign(process.env, { CALLMEBOT_PHONE: "+917676950652", CALLMEBOT_APIKEY: "123", GOOGLE_SHEET_URL: "https://script.google.com/macros/s/x/exec", GOOGLE_SHEET_SECRET: "s3cret" });
  mockFetch(url => (url.includes("callmebot") ? html("Message queued. You will receive it in a few seconds.") : json({ ok: true })));
  assert.deepEqual(await notifyBooking(booking), { channels: 2, delivered: 2 });

  const wa = new URL(calls.find(c => c.url.includes("callmebot")).url);
  assert.equal(wa.searchParams.get("phone"), "+917676950652");
  assert.equal(wa.searchParams.get("apikey"), "123");
  assert.match(wa.searchParams.get("text"), /ARTEST1[\s\S]*Koramangala[\s\S]*₹699[\s\S]*9876543210/);

  const sheet = calls.find(c => c.url.includes("script.google.com"));
  assert.equal(sheet.method, "POST");
  assert.equal(sheet.body.secret, "s3cret");
  assert.equal(sheet.body.id, "ARTEST1");
});

test("wrong CallMeBot key or sheet secret counts as a failure", async () => {
  Object.assign(process.env, { CALLMEBOT_PHONE: "+917676950652", CALLMEBOT_APIKEY: "bad", GOOGLE_SHEET_URL: "https://script.google.com/macros/s/x/exec" });
  mockFetch(url => (url.includes("callmebot") ? html("<p>APIKey is invalid.</p>") : json({ ok: false, error: "unauthorized" })));
  assert.deepEqual(await notifyBooking(booking), { channels: 2, delivered: 0 });
});

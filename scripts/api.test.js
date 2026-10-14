import { test } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../api/fares.js";
import { POST } from "../api/bookings.js";

const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
const valid = { trip: "airport", direction: "Drop to Airport", from: "Koramangala", to: "Airport", date: tomorrow, time: "10:00", vehicleId: "innova-crysta", phone: "9876543210" };
const post = body => POST(new Request("http://x/api/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));

test("GET /api/fares returns vehicles with edge caching", async () => {
  const res = GET();
  assert.equal(res.status, 200);
  assert.match(res.headers.get("cache-control"), /s-maxage/);
  assert.ok((await res.json()).vehicles.length > 0);
});

test("valid booking is accepted and priced server-side", async () => {
  const res = await post({ ...valid, price: 1 });
  const data = await res.json();
  assert.equal(res.status, 201);
  assert.equal(data.fare, 1799);
  assert.match(data.id, /^AR/);
});

test("invalid booking returns field errors", async () => {
  const res = await post({ ...valid, phone: "123", vehicleId: "bus", date: "2000-01-01" });
  const { errors } = await res.json();
  assert.equal(res.status, 422);
  assert.deepEqual(Object.keys(errors).sort(), ["date", "phone", "vehicleId"]);
});

test("local trips don't require a drop location", async () => {
  const res = await post({ ...valid, trip: "local", to: "" });
  assert.equal(res.status, 201);
});

test("honeypot silently drops bots", async () => {
  const res = await post({ ...valid, company: "spam inc" });
  assert.equal(res.status, 200);
});

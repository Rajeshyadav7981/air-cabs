import { TRIP_TYPES, findVehicle } from "../lib/fleet.js";
import { validateBooking } from "../lib/validate.js";
import { notifyBooking } from "../lib/notify.js";

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const newId = () => "AR" + Date.now().toString(36).toUpperCase().slice(-6);

// POST /api/bookings — validates, prices server-side, notifies the operator.
export async function POST(request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "Expected JSON body" }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Honeypot: real users never see or fill this field
  if (body.company) return json({ ok: true, id: newId() });

  const result = validateBooking(body);
  if (!result.ok) return json({ error: "Validation failed", errors: result.errors }, 422);

  const d = result.data;
  const vehicle = findVehicle(d.vehicleId);
  const booking = {
    id: newId(),
    tripLabel: TRIP_TYPES[d.trip],
    direction: d.trip === "airport" ? d.direction : "",
    from: d.from,
    to: d.trip === "local" ? "" : d.to,
    date: d.date,
    time: d.time,
    vehicle: `${vehicle.name} (${vehicle.seats})`,
    fare: vehicle.price,
    phone: d.phone,
    createdAt: new Date().toISOString(),
  };

  const { channels, delivered } = await notifyBooking(booking);
  if (channels > 0 && delivered === 0) {
    return json({ error: "Could not place booking right now. Please call or WhatsApp us." }, 502);
  }

  return json({ ok: true, id: booking.id, fare: booking.fare, vehicle: booking.vehicle }, 201);
}

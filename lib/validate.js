import { TRIP_TYPES, findVehicle } from "./fleet.js";

const clean = (v, max = 120) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);

/**
 * Validates and normalises a booking payload.
 * Returns { ok: true, data } or { ok: false, errors: { field: message } }.
 */
export function validateBooking(body = {}) {
  const errors = {};
  const data = {
    trip: clean(body.trip, 20),
    direction: clean(body.direction, 40),
    from: clean(body.from),
    to: clean(body.to),
    date: clean(body.date, 10),
    time: clean(body.time, 5),
    vehicleId: clean(body.vehicleId, 40),
    phone: clean(body.phone, 15).replace(/\D/g, ""),
  };

  if (!TRIP_TYPES[data.trip]) errors.trip = "Invalid trip type";
  if (data.from.length < 3) errors.from = "Enter a pickup location";
  if (data.trip !== "local" && data.to.length < 3) errors.to = "Enter a drop location";
  if (!/^[6-9]\d{9}$/.test(data.phone)) errors.phone = "Enter a valid 10-digit mobile number";
  if (!findVehicle(data.vehicleId)) errors.vehicleId = "Choose a vehicle";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !/^\d{2}:\d{2}$/.test(data.time)) {
    errors.date = "Enter a valid date and time";
  } else {
    // Times are entered in IST
    const when = new Date(`${data.date}T${data.time}:00+05:30`);
    if (Number.isNaN(when.getTime())) errors.date = "Enter a valid date and time";
    else if (when.getTime() < Date.now() - 5 * 60e3) errors.date = "Pickup time is in the past";
    else if (when.getTime() > Date.now() + 180 * 864e5) errors.date = "Bookings open up to 180 days ahead";
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

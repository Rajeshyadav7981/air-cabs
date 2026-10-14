/**
 * AirRide Cabs → Google Sheet booking log
 *
 * Paste this whole file into: your Google Sheet → Extensions → Apps Script.
 * Then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Full steps: SETUP-BOOKINGS.md
 */

// Must match GOOGLE_SHEET_SECRET in Vercel. Change it to any long random text.
const SECRET = "change-me-to-a-long-random-text";

const SHEET_NAME = "Bookings";
const HEADERS = ["Booking ID", "Received", "Trip", "Direction", "From", "To", "Date", "Time", "Car", "Fare (₹)", "Customer mobile", "Status", "Notes"];
const STATUSES = ["New", "Confirmed", "Driver assigned", "Completed", "Cancelled"];

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "bad json" });
  }
  if (data.secret !== SECRET) return reply({ ok: false, error: "unauthorized" });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // avoid two bookings writing the same row
  try {
    const sheet = getSheet();
    sheet.appendRow([
      data.id,
      new Date(data.createdAt),
      data.tripLabel,
      data.direction || "",
      data.from,
      data.to || "",
      data.date,
      data.time,
      data.vehicle,
      data.fare,
      "'+91 " + data.phone, // leading ' keeps it as text
      "New",
      "",
    ]);
    const row = sheet.getLastRow();
    sheet.getRange(row, 12).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build()
    );
  } finally {
    lock.releaseLock();
  }
  return reply({ ok: true });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#0f3d3e").setFontColor("#ffffff");
    sheet.getRange("B:B").setNumberFormat("dd-mmm-yyyy hh:mm");
  }
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Optional: run this once from the Apps Script editor to check the sheet gets a test row.
function testInsert() {
  const fake = { postData: { contents: JSON.stringify({
    secret: SECRET, id: "ARTEST1", createdAt: new Date().toISOString(), tripLabel: "Airport Taxi",
    direction: "Drop to Airport", from: "Koramangala", to: "Kempegowda International Airport",
    date: "2026-10-20", time: "06:00", vehicle: "Swift Dzire (4+1)", fare: 699, phone: "9876543210",
  }) } };
  Logger.log(doPost(fake).getContent());
}

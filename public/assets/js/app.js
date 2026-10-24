// ============ CONFIG ============
const WHATSAPP_NUMBER = "917676950652";

// ============ STATIC DATA (SEO route links) ============
const routes = {
  outstation: ["Mysore", "Coorg", "Ooty", "Chikmagalur", "Nandi Hills", "Wayanad", "Sakleshpur", "Hampi", "Gokarna", "Udupi", "Kodaikanal", "Goa", "Mangalore", "Dharmasthala", "Tirupati", "Puducherry", "Chennai", "Yercaud", "Dandeli", "Kudremukh", "BR Hills", "Bheemeshwari"]
    .map(c => `Bangalore → ${c}`),
  airport: ["MG Road", "Koramangala", "Whitefield", "Hoodi", "ITPL", "HAL", "Silk Board", "Brookfield", "Indiranagar", "HSR Layout", "Electronic City", "Jayanagar", "Marathahalli", "Hebbal", "Yelahanka", "BTM Layout"]
    .map(c => `${c} ⇄ Airport`),
  local: ["MG Road", "Koramangala", "Whitefield", "Indiranagar", "HSR Layout", "Electronic City", "Jayanagar", "Marathahalli", "Hebbal", "Malleshwaram", "Rajajinagar", "JP Nagar"]
    .map(c => `Local taxi in ${c}`),
};

// ============ HELPERS ============
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const inr = n => "₹" + Number(n).toLocaleString("en-IN");
const waLink = msg => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function toast(msg, ms = 3500) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), ms);
}

// ============ FLEET ============
let vehicles = [];
let currentFilter = "all";

async function loadFleet() {
  try {
    const res = await fetch("/api/fares");
    if (!res.ok) throw new Error(res.status);
    vehicles = (await res.json()).vehicles;
    renderFleet();
    renderCarOptions();
    renderCredits();
  } catch {
    $("#fleetGrid").innerHTML = `<p class="fleet-error">Couldn't load fares. Please call <a href="tel:+917676950652"><b>+91 76769 50652</b></a>.</p>`;
  } finally {
    $("#fleetGrid").removeAttribute("aria-busy");
  }
}

function renderFleet() {
  const list = currentFilter === "all" ? vehicles : vehicles.filter(c => c.type === currentFilter);
  $("#fleetGrid").innerHTML = list.map((c, i) => {
    const msg = `Hi, I want to book ${c.name} (${c.seats}) for ${inr(c.price)}.`;
    return `
      <article class="car" style="animation-delay:${i * 60}ms">
        <div class="car-visual">
          <img src="/assets/images/cars/${esc(c.id)}.webp" alt="${esc(c.name)}" width="800" height="500"
               loading="${i < 4 ? "eager" : "lazy"}" decoding="async" />
        </div>
        <div class="car-body">
          <h3>${esc(c.name)}</h3>
          <ul class="specs">
            <li><svg class="ic"><use href="#i-users"/></svg><span class="spec-l">Seats</span><b>${esc(c.seats)}</b></li>
            <li><svg class="ic"><use href="#i-route"/></svg><span class="spec-l">Distance</span><b>${esc(c.km)} km</b></li>
            <li><svg class="ic"><use href="#i-toll"/></svg><span class="spec-l">Toll</span><b>Optional</b></li>
          </ul>
          <div class="price"><small>Starts at</small><b>${inr(c.price)}</b></div>
          <div class="car-actions">
            <a href="#book" class="btn btn-primary btn-sm" data-car="${esc(c.id)}">Book now</a>
            <a href="${esc(waLink(msg))}" target="_blank" rel="noopener" class="btn btn-wa btn-sm" aria-label="Book ${esc(c.name)} on WhatsApp"><svg class="ic"><use href="#i-wa"/></svg><span class="wa-txt">WhatsApp</span></a>
          </div>
        </div>
      </article>`;
  }).join("");
}

function renderCredits() {
  $("#photoCredits").innerHTML = vehicles
    .map(v => `<li><a href="${esc(v.photo.source)}" target="_blank" rel="noopener">${esc(v.name)}</a> — ${esc(v.photo.author)}, ${esc(v.photo.license)}</li>`)
    .join("");
}

// ============ CAR PICKER (custom dropdown backed by the hidden #car select) ============
const GROUPS = { sedan: "Sedan", suv: "SUV / MUV", premium: "Premium", group: "Group travel" };
const carImg = id => `/assets/images/cars/${id}.webp`;
const picker = $("#carPicker"), pickerBtn = $("#carBtn"), pickerList = $("#carList");
const CHECK = `<svg class="pk-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>`;

function renderCarOptions() {
  const sel = $("#car");
  const prev = sel.value;
  sel.replaceChildren(...vehicles.map(v => new Option(v.name, v.id)));
  if (vehicles.some(v => v.id === prev)) sel.value = prev;

  let lastType = "";
  pickerList.innerHTML = vehicles.map(v => {
    const head = v.type !== lastType ? `<li class="pk-group" role="presentation">${esc(GROUPS[v.type] || v.type)}</li>` : "";
    lastType = v.type;
    return `${head}<li class="picker-opt" role="option" id="opt-${esc(v.id)}" data-id="${esc(v.id)}" aria-selected="false">
        <img class="pk-img" src="${carImg(esc(v.id))}" alt="" width="64" height="40" loading="lazy" decoding="async" />
        <span class="pk-text"><b>${esc(v.name)}</b><small>${esc(v.seats)} seats · ${esc(v.sub)}</small></span>
        <span class="pk-price">${inr(v.price)}</span>${CHECK}
      </li>`;
  }).join("");
  syncPicker();
}

const options = () => $$(".picker-opt", pickerList);

function syncPicker() {
  const v = vehicles.find(x => x.id === $("#car").value) || vehicles[0];
  if (!v) return;
  $("#car").value = v.id;
  const img = $(".pk-img", pickerBtn);
  img.src = carImg(v.id);
  $(".pk-text b", pickerBtn).textContent = v.name;
  $(".pk-text small", pickerBtn).textContent = `${v.seats} seats · ${v.sub}`;
  $(".pk-price", pickerBtn).textContent = inr(v.price);
  options().forEach(o => o.setAttribute("aria-selected", String(o.dataset.id === v.id)));
}

function setCar(id) {
  $("#car").value = id;
  pickerBtn.classList.remove("invalid");
  syncPicker();
}

function setActive(opt) {
  options().forEach(o => o.classList.toggle("active", o === opt));
  if (!opt) return;
  pickerList.setAttribute("aria-activedescendant", opt.id);
  opt.scrollIntoView({ block: "nearest" });
}

function openPicker() {
  if (!vehicles.length) return;
  // Open upwards if there isn't room below in the viewport
  const below = innerHeight - pickerBtn.getBoundingClientRect().bottom;
  picker.classList.toggle("up", below < 360 && pickerBtn.getBoundingClientRect().top > below);
  picker.classList.add("open");
  pickerList.hidden = false;
  pickerBtn.setAttribute("aria-expanded", "true");
  setActive(options().find(o => o.getAttribute("aria-selected") === "true"));
  pickerList.focus({ preventScroll: true });
}

function closePicker(focusBtn = true) {
  picker.classList.remove("open");
  pickerList.hidden = true;
  pickerBtn.setAttribute("aria-expanded", "false");
  if (focusBtn) pickerBtn.focus({ preventScroll: true });
}

pickerBtn.addEventListener("click", () => (pickerList.hidden ? openPicker() : closePicker()));
pickerBtn.addEventListener("keydown", e => {
  if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); openPicker(); }
});
pickerList.addEventListener("click", e => {
  const opt = e.target.closest(".picker-opt");
  if (!opt) return;
  setCar(opt.dataset.id);
  closePicker();
});
pickerList.addEventListener("mousemove", e => {
  const opt = e.target.closest(".picker-opt");
  if (opt && !opt.classList.contains("active")) setActive(opt);
});
pickerList.addEventListener("keydown", e => {
  const list = options();
  const i = list.findIndex(o => o.classList.contains("active"));
  const go = n => { e.preventDefault(); setActive(list[Math.max(0, Math.min(list.length - 1, n))]); };
  if (e.key === "ArrowDown") go(i + 1);
  else if (e.key === "ArrowUp") go(i - 1);
  else if (e.key === "Home") go(0);
  else if (e.key === "End") go(list.length - 1);
  else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (list[i]) setCar(list[i].dataset.id); closePicker(); }
  else if (e.key === "Escape") { e.preventDefault(); closePicker(); }
  else if (e.key === "Tab") closePicker(false);
});
document.addEventListener("pointerdown", e => {
  if (!pickerList.hidden && !picker.contains(e.target)) closePicker(false);
});

$("#filters").addEventListener("click", e => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  $$(".chip", $("#filters")).forEach(b => b.classList.toggle("active", b === btn));
  currentFilter = btn.dataset.filter;
  renderFleet();
});

// "Book now" on a card → scroll to form with that car preselected
$("#fleetGrid").addEventListener("click", e => {
  const btn = e.target.closest("[data-car]");
  if (!btn) return;
  const car = vehicles.find(v => v.id === btn.dataset.car);
  setCar(car.id);
  setTimeout(() => $("#from").focus({ preventScroll: true }), 600);
  toast(`${car.name} selected — fill in your trip details`);
});

// ============ ROUTES ============
function renderRoutes(kind) {
  $("#routesList").innerHTML = routes[kind]
    .map((r, i) => `<a href="#book" class="route" style="animation-delay:${i * 20}ms">${esc(r)}<i>→</i></a>`)
    .join("");
}
$(".route-tabs").addEventListener("click", e => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  $$(".chip", $(".route-tabs")).forEach(b => b.classList.toggle("active", b === btn));
  renderRoutes(btn.dataset.routes);
});

// ============ BOOKING FORM ============
let trip = "airport";
const AIRPORT = "Kempegowda International Airport";

function setTrip(t) {
  trip = t;
  $$(".tab").forEach(b => b.classList.toggle("active", b.dataset.trip === t));
  $(".airport-only").style.display = t === "airport" ? "" : "none";
  $("#toField").style.display = t === "local" ? "none" : "";
  updateAirportFields();
}

function updateAirportFields() {
  const to = $("#to"), from = $("#from");
  if (trip !== "airport") {
    to.placeholder = "e.g. Mysore";
    from.placeholder = "e.g. Koramangala, Bangalore";
    return;
  }
  const pickup = $('input[name="dir"]:checked').value.startsWith("Pickup");
  from.placeholder = pickup ? AIRPORT : "e.g. Koramangala, Bangalore";
  to.placeholder = pickup ? "e.g. Whitefield, Bangalore" : AIRPORT;
}

$(".tabs").addEventListener("click", e => {
  const btn = e.target.closest(".tab");
  if (btn) setTrip(btn.dataset.trip);
});
$$('input[name="dir"]').forEach(r => r.addEventListener("change", updateAirportFields));
$$(".nav a[data-tab]").forEach(a => a.addEventListener("click", () => setTrip(a.dataset.tab)));

const FIELD_IDS = { from: "from", to: "to", date: "date", phone: "phone", vehicleId: "carBtn" };

function showErrors(errors = {}) {
  Object.values(FIELD_IDS).forEach(id => $("#" + id).classList.remove("invalid"));
  Object.keys(errors).forEach(k => FIELD_IDS[k] && $("#" + FIELD_IDS[k]).classList.add("invalid"));
  $("#formError").textContent = Object.values(errors).join(" · ");
}

$("#bookingForm").addEventListener("submit", async e => {
  e.preventDefault();
  const isAirport = trip === "airport";
  const pickupFromAirport = isAirport && $('input[name="dir"]:checked').value.startsWith("Pickup");
  // Airport field may be left blank — fill it in
  const from = $("#from").value.trim() || (pickupFromAirport ? AIRPORT : "");
  const to = $("#to").value.trim() || (isAirport && !pickupFromAirport ? AIRPORT : "");

  const payload = {
    trip,
    direction: isAirport ? $('input[name="dir"]:checked').value : "",
    from, to,
    date: $("#date").value,
    time: $("#time").value,
    vehicleId: $("#car").value,
    phone: $("#phone").value,
    company: $("#company").value,
  };

  const btn = $("#submitBtn");
  btn.disabled = true;
  btn.firstElementChild.textContent = "Booking…";
  showErrors();

  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showErrors(data.errors || { form: data.error || "Something went wrong. Please try again." });
      return;
    }
    toast(`✅ Booking ${data.id} received! We'll call you shortly.`, 6000);
    $("#bookingForm").reset();
    syncPicker();
    initDateTime();
    setTrip(trip);
  } catch {
    showErrors({ form: "Network error — please call or WhatsApp us." });
  } finally {
    btn.disabled = false;
    btn.firstElementChild.textContent = "Book Now";
  }
});

// Default date = today (IST of the device), time = +2h
function initDateTime() {
  const d = new Date(Date.now() + 2 * 3600e3);
  const pad = n => String(n).padStart(2, "0");
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  $("#date").value = day;
  $("#date").min = day;
  $("#time").value = `${pad(d.getHours())}:00`;
}

// ============ HEADER / MENU ============
const nav = $("#nav"), toggle = $("#menuToggle");
toggle.addEventListener("click", () => {
  nav.classList.toggle("open");
  toggle.classList.toggle("open");
});
$$("a", nav).forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("open");
  toggle.classList.remove("open");
}));
const header = $("#header");
window.addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 10), { passive: true });

// ============ INIT ============
$("#year").textContent = new Date().getFullYear();
initDateTime();
setTrip("airport");
renderRoutes("outstation");
loadFleet();

// Single source of truth for vehicles & fares.
// The frontend reads this via GET /api/fares; POST /api/bookings uses it to
// price trips server-side so a client can never submit its own price.

export const TRIP_TYPES = {
  airport: "Airport Taxi",
  outstation: "Outstation",
  oneway: "One Way Drop",
  local: "Local Taxi",
};

// Photos live in public/assets/images/cars/<id>.webp (from Wikimedia Commons).
// CC BY / BY-SA licences require the credit below to be shown on the site.
const commons = file => `https://commons.wikimedia.org/wiki/File:${file}`;

export const VEHICLES = [
  { id: "dzire-carrier", name: "Swift Dzire", sub: "AC · With carrier", seats: "4+1", km: 30, price: 699, type: "sedan",
    photo: { author: "Biswarup Ganguly", license: "CC BY 3.0", source: commons("Maruti_Suzuki_Dzire_VXi_VVT_(front).JPG") } },
  { id: "etios", name: "Toyota Etios", sub: "AC · Diesel", seats: "4+1", km: 30, price: 799, type: "sedan",
    photo: { author: "Lingeswaran Marimuthukumar", license: "CC BY 2.0", source: commons("Toyota_Etios_top_left_front.jpg") } },
  { id: "dzire-petrol", name: "Dzire Petrol", sub: "AC · Petrol", seats: "4+1", km: 30, price: 799, type: "sedan",
    photo: { author: "Biswarup Ganguly", license: "CC BY 3.0", source: commons("Maruti_Suzuki_Dzire_VXi_VVT_-_Subcompact_Car_-_Kolkata_2018-01-17_7574.JPG") } },
  { id: "ertiga", name: "Ertiga / Kia Carens", sub: "AC · MUV", seats: "6+1", km: 40, price: 1449, type: "suv",
    photo: { author: "Ramakrishna Mission Vidyapith", license: "Public domain", source: commons("2022_Maruti_Suzuki_Ertiga_LXi.jpg") } },
  { id: "innova-crysta", name: "Innova Crysta", sub: "AC · Premium MUV", seats: "7+1", km: 30, price: 1799, type: "suv",
    photo: { author: "Premnath Kudva", license: "CC BY-SA 4.0", source: commons("Toyota_Innova_Crysta_2.4_Z_front_right.jpg") } },
  { id: "innova-hycross", name: "Innova Hycross", sub: "AC · Hybrid", seats: "7+1", km: 30, price: 2299, type: "premium",
    photo: { author: "Ethan Llamas", license: "CC BY-SA 4.0", source: commons("Toyota_Zenix_2.0_V_Silver_Metallic.jpg") } },
  { id: "tempo", name: "Tempo Traveller", sub: "AC · Group travel", seats: "12+1", km: 40, price: 3199, type: "group",
    photo: { author: "Biswarup Ganguly", license: "CC BY 3.0", source: commons("Force_Motors_-_Traveller_26_-_Agra_2014-05-14_4222.JPG") } },
  { id: "fortuner", name: "Toyota Fortuner", sub: "AC · Luxury SUV", seats: "7+1", km: 40, price: 3499, type: "premium",
    photo: { author: "Captainmorlypogi1959", license: "CC BY-SA 4.0", source: commons("Toyota_Fortuner_4x4_Legender_(LTD)_2022.jpg") } },
];

export const findVehicle = id => VEHICLES.find(v => v.id === id);

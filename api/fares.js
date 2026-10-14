import { VEHICLES } from "../lib/fleet.js";

// GET /api/fares — cached at Vercel's edge, so most requests never invoke the function.
export function GET() {
  return Response.json(
    { vehicles: VEHICLES },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}

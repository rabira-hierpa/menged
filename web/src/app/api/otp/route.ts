const OTP_URL = process.env.OTP_URL ?? "http://localhost:8080";

/**
 * Proxy to the OpenTripPlanner GTFS GraphQL API so the browser never talks
 * to OTP directly (avoids CORS and keeps OTP internal in production).
 */
export async function POST(request: Request) {
  const body = await request.text();
  try {
    const response = await fetch(`${OTP_URL}/otp/gtfs/v1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json(
      { error: "Journey planner is unavailable" },
      { status: 502 },
    );
  }
}

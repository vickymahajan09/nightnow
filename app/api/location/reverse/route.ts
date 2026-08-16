import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat")?.trim() || "";
  const lon = request.nextUrl.searchParams.get("lon")?.trim() || "";

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "18");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "NightNow/1.0 (delivery location reverse lookup)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Reverse location provider error" },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Location reverse API error:", error);
    return NextResponse.json(
      { error: "Reverse location lookup failed" },
      { status: 500 }
    );
  }
}
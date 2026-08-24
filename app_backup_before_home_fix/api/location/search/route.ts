import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";

  if (query.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "8");
    url.searchParams.set("countrycodes", "in");
    url.searchParams.set("q", query);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "NightNow/1.0 (delivery location search)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { results: [], error: "Location provider error" },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json(
      { results: Array.isArray(data) ? data : [] },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Location search API error:", error);
    return NextResponse.json(
      { results: [], error: "Location search failed" },
      { status: 500 }
    );
  }
}
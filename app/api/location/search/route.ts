import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

const PHOTON_URL =
  "https://photon.komoot.io/api/";

const USER_AGENT =
  "NightNow/1.0 (delivery location search)";

const buildNominatimUrl = (query: string) => {
  const url = new URL(NOMINATIM_URL);

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("namedetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("accept-language", "en");
  url.searchParams.set("q", query);

  return url.toString();
};

const buildPhotonUrl = (query: string) => {
  const url = new URL(PHOTON_URL);

  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");

  return url.toString();
};

const fetchJson = async (
  url: string,
  headers: Record<string, string>
) => {
  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Location provider HTTP ${response.status}`);
  }

  return response.json();
};

const searchNominatim = async (query: string) => {
  const data = await fetchJson(
    buildNominatimUrl(query),
    {
      Accept: "application/json",
      "Accept-Language": "en-IN,en;q=0.9",
      "User-Agent": USER_AGENT,
    }
  );

  return Array.isArray(data) ? data : [];
};

const searchPhoton = async (query: string) => {
  const data = await fetchJson(
    buildPhotonUrl(query),
    {
      Accept: "application/json",
      "Accept-Language": "en-IN,en;q=0.9",
      "User-Agent": USER_AGENT,
    }
  );

  const features = Array.isArray(data?.features)
    ? data.features
    : [];

  return features.map((feature: any, index: number) => {
    const properties = feature?.properties || {};
    const coordinates = feature?.geometry?.coordinates || [];

    const parts = [
      properties.name,
      properties.street,
      properties.suburb,
      properties.district,
      properties.city,
      properties.state,
      properties.postcode,
      properties.country,
    ].filter(Boolean);

    return {
      place_id: `photon-${index}-${coordinates[1] || ""}-${coordinates[0] || ""}`,
      display_name:
        parts.join(", ") ||
        properties.name ||
        "Selected Location",
      lat: coordinates[1],
      lon: coordinates[0],
      address: {
        road: properties.street,
        suburb: properties.suburb,
        neighbourhood: properties.neighbourhood,
        district: properties.district,
        city: properties.city,
        state: properties.state,
        postcode: properties.postcode,
        country: properties.country,
        country_code: properties.countrycode,
      },
      namedetails: {
        name: properties.name,
      },
      source: "photon",
    };
  });
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[.,/\\_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildQueries = (query: string) => {
  const clean = query.trim();
  const normalized = normalizeText(clean);

  const queries = [
    clean,
    `${clean}, Dindoli, Surat, Gujarat, India`,
    `${clean}, Surat, Gujarat, India`,
  ];

  // Common singular/plural correction:
  // "Abhinav Height" -> "Abhinav Heights"
  if (
    /\bheight\b/i.test(clean) &&
    !/\bheights\b/i.test(clean)
  ) {
    queries.push(
      clean.replace(/\bheight\b/gi, "Heights")
    );
  }

  // If user typed "heights", also try singular.
  if (/\bheights\b/i.test(clean)) {
    queries.push(
      clean.replace(/\bheights\b/gi, "Height")
    );
  }

  // Try the last meaningful address tokens.
  const tokens = normalized
    .split(" ")
    .filter((token) => token.length >= 3);

  if (tokens.length >= 2) {
    queries.push(
      `${tokens.slice(-5).join(" ")}, Surat, Gujarat, India`
    );
  }

  return Array.from(
    new Set(
      queries
        .map((item) => item.trim())
        .filter((item) => item.length >= 3)
    )
  );
};

const normalizeResults = (results: any[]) => {
  const seen = new Set<string>();

  return results.filter((item) => {
    const lat = Number(item?.lat);
    const lon = Number(item?.lon);

    const key =
      String(item?.place_id || "") ||
      `${lat.toFixed(6)}-${lon.toFixed(6)}-${normalizeText(
        String(item?.display_name || "")
      )}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export async function GET(request: NextRequest) {
  const query =
    request.nextUrl.searchParams.get("q")?.trim() || "";

  if (query.length < 3) {
    return NextResponse.json({
      results: [],
    });
  }

  const queries = buildQueries(query);
  let results: any[] = [];

  try {
    // First use Nominatim.
    // It supports free-form address searches and addressdetails.
    for (const searchQuery of queries) {
      try {
        const found = await searchNominatim(searchQuery);

        if (found.length > 0) {
          results.push(...found);
        }

        if (results.length >= 8) {
          break;
        }
      } catch (error) {
        console.warn(
          "Nominatim query failed:",
          searchQuery,
          error
        );
      }
    }

    results = normalizeResults(results).slice(0, 8);

    // Photon fallback for buildings/societies/POIs that
    // are not returned by Nominatim.
    if (results.length === 0) {
      for (const searchQuery of queries) {
        try {
          const found = await searchPhoton(searchQuery);

          if (found.length > 0) {
            results.push(...found);
          }

          if (results.length >= 8) {
            break;
          }
        } catch (error) {
          console.warn(
            "Photon query failed:",
            searchQuery,
            error
          );
        }
      }

      results = normalizeResults(results).slice(0, 8);
    }

    return NextResponse.json(
      {
        results,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Location search API error:",
      error
    );

    return NextResponse.json(
      {
        results: [],
        error: "Location search failed",
      },
      {
        status: 500,
      }
    );
  }
}
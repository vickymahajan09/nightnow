import { NextRequest, NextResponse } from "next/server";

const PHOTON_URL =
  "https://photon.komoot.io/api/";

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

const USER_AGENT =
  "NightNow/1.0 (delivery location autocomplete)";

/*
  Words that are NOT unique building/society identifiers.
  Example:
    "Abhinav Heights Dindoli"
  becomes:
    importantWords = ["abhinav", "dindoli"]

  "heights" is ignored, so "Abhilasha Heights"
  can NEVER match only because of "Heights".
*/
const GENERIC_WORDS = new Set([
  "road",
  "rd",
  "street",
  "st",
  "roadway",
  "lane",
  "ln",
  "avenue",
  "ave",
  "highway",
  "area",
  "near",
  "nearby",
  "main",
  "city",
  "town",
  "village",

  // Building / society generic words
  "height",
  "heights",
  "society",
  "soc",
  "residency",
  "residence",
  "residential",
  "apartment",
  "apartments",
  "flat",
  "flats",
  "building",
  "buildings",
  "tower",
  "towers",
  "complex",
  "enclave",
  "colony",
  "nagar",
  "park",
  "garden",
  "gardens",
  "homes",
  "home",
  "villa",
  "villas",
  "view",
  "phase",
  "block",
  "sector",
  "extension",
  "layout",
  "locality",
  "district",
]);

function cleanWords(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueParts(parts: unknown[]) {
  const seen = new Set<string>();

  return parts
    .map((part) => String(part || "").trim())
    .filter((part) => {
      if (!part) return false;

      const key = normalizeText(part);

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
}

function getPhotonAddress(properties: any) {
  return uniqueParts([
    properties?.housenumber,
    properties?.street,
    properties?.neighbourhood,
    properties?.suburb,
    properties?.district,
    properties?.city,
    properties?.town,
    properties?.village,
    properties?.state,
    properties?.postcode,
    properties?.country,
  ]).join(", ");
}

function getNominatimAddress(item: any) {
  const address = item?.address || {};

  return uniqueParts([
    address?.house_number,
    address?.road,
    address?.neighbourhood,
    address?.suburb,
    address?.quarter,
    address?.residential,
    address?.hamlet,
    address?.village,
    address?.town,
    address?.city,
    address?.municipality,
    address?.district,
    address?.state_district,
    address?.state,
    address?.postcode,
    address?.country,
  ]).join(", ");
}

function getName(item: any) {
  const properties = item?.properties || {};
  const address = item?.address || {};

  return String(
    item?.namedetails?.name ||
      properties?.name ||
      address?.building ||
      address?.amenity ||
      address?.shop ||
      address?.road ||
      address?.suburb ||
      address?.neighbourhood ||
      address?.city ||
      properties?.street ||
      "Location"
  ).trim();
}

function photonToResult(
  item: any,
  index: number
) {
  const properties = item?.properties || {};

  const coordinates = Array.isArray(
    item?.geometry?.coordinates
  )
    ? item.geometry.coordinates
    : [];

  const lat = Number(coordinates[1]);
  const lon = Number(coordinates[0]);

  const name = String(
    properties?.name ||
      properties?.street ||
      properties?.suburb ||
      properties?.neighbourhood ||
      properties?.city ||
      properties?.town ||
      properties?.village ||
      "Location"
  ).trim();

  const address =
    getPhotonAddress(properties);

  return {
    place_id:
      `photon-${index}-${lat}-${lon}`,

    display_name:
      uniqueParts([
        name,
        address,
      ]).join(", "),

    lat: Number.isFinite(lat)
      ? lat
      : undefined,

    lon: Number.isFinite(lon)
      ? lon
      : undefined,

    address: {
      building:
        properties?.name || "",

      house_number:
        properties?.housenumber || "",

      road:
        properties?.street || "",

      neighbourhood:
        properties?.neighbourhood || "",

      suburb:
        properties?.suburb || "",

      district:
        properties?.district || "",

      city:
        properties?.city ||
        properties?.town ||
        properties?.village ||
        "",

      state:
        properties?.state || "",

      postcode:
        properties?.postcode || "",

      country:
        properties?.country || "India",
    },

    namedetails: {
      name,
    },

    source: "photon",
  };
}

function nominatimToResult(
  item: any,
  index: number
) {
  const address = item?.address || {};
  const name = getName(item);

  const fullAddress =
    getNominatimAddress(item);

  const lat = Number(item?.lat);
  const lon = Number(item?.lon);

  return {
    place_id:
      `nominatim-${item?.place_id || index}`,

    display_name:
      uniqueParts([
        name,
        fullAddress,
      ]).join(", "),

    lat: Number.isFinite(lat)
      ? lat
      : undefined,

    lon: Number.isFinite(lon)
      ? lon
      : undefined,

    address,

    namedetails: {
      name,
    },

    source: "nominatim",
  };
}

function makeSearchUrl(
  base: string,
  query: string
) {
  const url = new URL(base);

  url.searchParams.set(
    "q",
    query
  );

  return url;
}

async function fetchJson(
  url: URL
) {
  const response =
    await fetch(
      url.toString(),
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",

          "Accept-Language":
            "en-IN,en;q=0.9",

          "User-Agent":
            USER_AGENT,
        },

        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}`
    );
  }

  return response.json();
}

/*
  HARD RELEVANCE FILTER

  This is the fix for:

      Search:
      Abhinav Heights Dindoli

      Wrong result:
      Abhilasha Heights

  Important words become:

      ["abhinav", "dindoli"]

  The PRIMARY word is "abhinav".

  A result MUST contain the PRIMARY word.
  "heights" is generic and is ignored.

  Therefore:

      Abhilasha Heights
      -> contains "heights"
      -> does NOT contain "abhinav"
      -> REJECT

  This is intentionally strict. It is better to
  show no result than to show the wrong building.
*/
function scoreAndFilter(
  items: any[],
  query: string
) {
  const words =
    cleanWords(query);

  const importantWords =
    words.filter(
      (word) =>
        word.length >= 3 &&
        !GENERIC_WORDS.has(word)
    );

  /*
    If the user only typed generic words such as
    "road" or "society", don't pretend we know
    which place they mean.
  */
  if (
    importantWords.length === 0
  ) {
    return [];
  }

  const primaryWord =
    importantWords[0];

  const scored =
    items
      .map((item) => {
        const nameText =
          normalizeText(
            getName(item)
          );

        const displayText =
          normalizeText(
            item?.display_name
          );

        const addressText =
          normalizeText(
            [
              item?.address?.building,
              item?.address?.road,
              item?.address?.neighbourhood,
              item?.address?.suburb,
              item?.address?.district,
              item?.address?.city,
              item?.address?.town,
              item?.address?.village,
              item?.address?.state,
              item?.address?.postcode,
            ].join(" ")
          );

        const combined =
          `${nameText} ${displayText} ${addressText}`;

        /*
          CRITICAL:
          Primary building/search word MUST exist.

          Do NOT use fuzzy matching here.
          Do NOT use startsWith.
          Do NOT use partial similarity.

          "abhinav" != "abhilasha".
        */
        if (
          !combined
            .split(/\s+/)
            .includes(primaryWord)
        ) {
          return null;
        }

        let score = 100;

        /*
          Exact primary word in the place name
          gets the highest priority.
        */
        if (
          nameText
            .split(/\s+/)
            .includes(primaryWord)
        ) {
          score += 300;
        }

        /*
          Exact other search words improve ranking.
        */
        for (
          const word of importantWords
        ) {
          if (
            combined
              .split(/\s+/)
              .includes(word)
          ) {
            score += 40;
          }
        }

        /*
          If the user typed an area/city after the
          building name, prefer results containing it.
        */
        const locationWords =
          importantWords.slice(1);

        for (
          const word of locationWords
        ) {
          if (
            combined
              .split(/\s+/)
              .includes(word)
          ) {
            score += 60;
          }
        }

        return {
          item,
          score,
        };
      })
      .filter(
        (
          entry
        ): entry is {
          item: any;
          score: number;
        } => Boolean(entry)
      )
      .sort(
        (a, b) =>
          b.score - a.score
      );

  return scored.map(
    (entry) => entry.item
  );
}

function dedupe(
  items: any[]
) {
  const seen =
    new Set<string>();

  return items.filter(
    (item) => {
      const key =
        normalizeText(
          `${item?.display_name || ""}|${item?.lat || ""}|${item?.lon || ""}`
        );

      if (
        !key ||
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q")?.trim() || "";
  const query = rawQuery.replace(/\s+/g, " ");

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const importantWords = cleanWords(query).filter(
    (word) => word.length >= 3 && !GENERIC_WORDS.has(word)
  );

  if (importantWords.length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const photonUrl = makeSearchUrl(PHOTON_URL, query);
    photonUrl.searchParams.set("limit", "25");
    photonUrl.searchParams.set("lang", "en");

    const nominatimUrl = makeSearchUrl(NOMINATIM_URL, query);
    nominatimUrl.searchParams.set("format", "jsonv2");
    nominatimUrl.searchParams.set("addressdetails", "1");
    nominatimUrl.searchParams.set("namedetails", "1");
    nominatimUrl.searchParams.set("limit", "20");
    nominatimUrl.searchParams.set("countrycodes", "in");
    nominatimUrl.searchParams.set("accept-language", "en-IN,en;q=0.9");

    const [photonResult, nominatimResult] = await Promise.allSettled([
      fetchJson(photonUrl),
      fetchJson(nominatimUrl),
    ]);

    const photonItems =
      photonResult.status === "fulfilled" && Array.isArray(photonResult.value?.features)
        ? photonResult.value.features.map(photonToResult)
        : [];

    const nominatimItems =
      nominatimResult.status === "fulfilled" && Array.isArray(nominatimResult.value)
        ? nominatimResult.value.map(nominatimToResult)
        : [];

    const merged = dedupe([...photonItems, ...nominatimItems]);
    const filtered = scoreAndFilter(merged, query);
    const finalResults = dedupe(filtered).slice(0, 10);

    return NextResponse.json(
      { results: finalResults },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Location search error:", error);
    return NextResponse.json(
      { results: [], error: "Location search failed. Please try again." },
      { status: 502 }
    );
  }
}

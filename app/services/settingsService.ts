import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getDistanceKm } from "../lib/distance";

export type StoreSettings = {
  storeName?: string;
  phone?: string;
  address?: string;
  location?: { lat: number; lng: number };
  deliveryRules?: {
    oneToThreeKm?: number;
    threeToFiveKm?: number;
    freeAbove?: number;
    maxDistanceKm?: number;
  };
  deliveryTimes?: { near?: number; normal?: number };
};

const DEFAULTS: Required<Pick<StoreSettings, "deliveryRules">>["deliveryRules"] = {
  oneToThreeKm: 30,
  threeToFiveKm: 50,
  freeAbove: 299,
  maxDistanceKm: 5,
};

export const getStoreSettings = async (): Promise<StoreSettings> => {
  try {
    const snap = await getDoc(doc(db, "settings", "store"));
    return snap.exists() ? (snap.data() as StoreSettings) : {};
  } catch (error) {
    console.error("Get store settings error:", error);
    return {};
  }
};

export type DeliveryChargeResult = {
  charge: number | null; // null = out of delivery range
  distanceKm: number | null;
  reason: "free-above-threshold" | "1-3km" | "3-5km" | "out-of-range" | "unknown-distance";
};

/**
 * Distance + order-value based delivery charge, using admin-configured
 * rules (falls back to sensible defaults if admin hasn't set them):
 *  - Free above ₹{freeAbove} (default ₹299)
 *  - 0–3 km  → ₹{oneToThreeKm} (default ₹30)
 *  - 3–5 km  → ₹{threeToFiveKm} (default ₹50)
 *  - beyond {maxDistanceKm} km → out of delivery range
 */
export const calculateDeliveryCharge = (
  cartTotal: number,
  customerLat: number | null,
  customerLng: number | null,
  settings: StoreSettings
): DeliveryChargeResult => {
  const rules = { ...DEFAULTS, ...(settings.deliveryRules || {}) };
  const freeAbove = rules.freeAbove ?? DEFAULTS.freeAbove!;

  if (cartTotal >= freeAbove) {
    const distanceKm =
      settings.location && customerLat != null && customerLng != null
        ? getDistanceKm(settings.location.lat, settings.location.lng, customerLat, customerLng)
        : null;
    return { charge: 0, distanceKm, reason: "free-above-threshold" };
  }

  if (!settings.location || customerLat == null || customerLng == null) {
    // No shop location configured yet, or we don't know the customer's
    // coordinates — fall back to the nearest-tier charge rather than
    // blocking checkout entirely.
    return { charge: rules.oneToThreeKm ?? 30, distanceKm: null, reason: "unknown-distance" };
  }

  const distanceKm = getDistanceKm(
    settings.location.lat,
    settings.location.lng,
    customerLat,
    customerLng
  );

  const maxDistanceKm = rules.maxDistanceKm ?? DEFAULTS.maxDistanceKm!;

  if (distanceKm > maxDistanceKm) {
    return { charge: null, distanceKm, reason: "out-of-range" };
  }

  if (distanceKm <= 3) {
    return { charge: rules.oneToThreeKm ?? 30, distanceKm, reason: "1-3km" };
  }

  return { charge: rules.threeToFiveKm ?? 50, distanceKm, reason: "3-5km" };
};

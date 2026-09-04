"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Emoji-based markers — no external icon image files needed, so nothing
// to break under a bundler. One color/emoji for the partner, one for
// the customer's drop location.
function emojiIcon(emoji: string, background: string) {
  return L.divIcon({
    html: `<div style="
      width: 34px; height: 34px; border-radius: 9999px;
      background: ${background}; display: flex; align-items: center;
      justify-content: center; font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35); border: 2px solid white;
    ">${emoji}</div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

const partnerIcon = emojiIcon("🛵", "#f59e0b");
const customerIcon = emojiIcon("📍", "#16a34a");

// Keeps both markers in view as the partner moves — fits the map to
// whichever points are actually available.
function FitToMarkers({
  points,
}: {
  points: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }

    map.fitBounds(points, { padding: [40, 40] });
  }, [points, map]);

  return null;
}

export default function LiveTrackingMap({
  partnerLat,
  partnerLng,
  customerLat,
  customerLng,
  height = 240,
}: {
  partnerLat: number;
  partnerLng: number;
  customerLat?: number | null;
  customerLng?: number | null;
  height?: number;
}) {
  const hasCustomer =
    typeof customerLat === "number" && typeof customerLng === "number";

  const partnerPoint: [number, number] = [partnerLat, partnerLng];
  const customerPoint: [number, number] | null = hasCustomer
    ? [customerLat as number, customerLng as number]
    : null;

  const points: [number, number][] = customerPoint
    ? [partnerPoint, customerPoint]
    : [partnerPoint];

  return (
    <MapContainer
      center={partnerPoint}
      zoom={15}
      scrollWheelZoom={false}
      zoomControl={true}
      style={{ width: "100%", height: `${height}px` }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={partnerPoint} icon={partnerIcon} />

      {customerPoint && (
        <>
          <Marker position={customerPoint} icon={customerIcon} />
          <Polyline
            positions={[partnerPoint, customerPoint]}
            pathOptions={{
              color: "#f97316",
              weight: 4,
              dashArray: "8, 8",
            }}
          />
        </>
      )}

      <FitToMarkers points={points} />
    </MapContainer>
  );
}

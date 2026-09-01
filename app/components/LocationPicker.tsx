"use client";

import { useEffect } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";

interface Props {
  location: {
    lat: number;
    lng: number;
  };
  setLocation: (location: {
    lat: number;
    lng: number;
  }) => void;
}

export default function LocationPicker({
  location,
  setLocation,
}: Props) {

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey:
      process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY || "",
  });

  useEffect(() => {
    let mounted = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mounted) return;

        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {}
    );

    return () => {
      mounted = false;
    };
  }, [setLocation]);

  if (!isLoaded) {
    return (
      <div className="rounded-lg bg-zinc-800 p-5">
        Loading Map...
      </div>
    );
  }

  return (
    <GoogleMap
      zoom={16}
      center={location}
      mapContainerStyle={{
        width: "100%",
        height: "350px",
      }}
      onClick={(e) =>
        setLocation({
          lat: e.latLng?.lat() || location.lat,
          lng: e.latLng?.lng() || location.lng,
        })
      }
    >
      <Marker position={location} />
    </GoogleMap>
  );
}
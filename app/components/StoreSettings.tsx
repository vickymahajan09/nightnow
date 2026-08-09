"use client";

import { useEffect, useState } from "react";

export default function StoreSettings() {
  const [settings, setSettings] = useState({
    storeName: "Night Now",
    deliveryTime: "10 Minutes",
    freeDelivery: "299",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "nightnow-settings"
      );

      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  return settings;
}
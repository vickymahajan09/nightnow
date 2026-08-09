"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then(() => {
            console.log(
              "Service Worker Registered"
            );
          })
          .catch((error) => {
            console.error(
              "Service Worker Error:",
              error
            );
          });
      });
    }
  }, []);

  return null;
}
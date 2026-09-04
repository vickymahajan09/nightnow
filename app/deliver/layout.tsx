import type { Metadata, Viewport } from "next";

/**
 * Riders get their own installable web app. Opening /deliver in
 * Chrome and choosing "Add to Home screen" installs it as a separate
 * icon called "NightNow Partner" that opens straight to the
 * dashboard, full screen, with no browser bar - so there is no need
 * to build and distribute a separate rider APK on day one.
 */

export const metadata: Metadata = {
  title: "NightNow Partner",
  description: "Delivery partner dashboard",
  manifest: "/deliver-manifest.json",
  appleWebApp: {
    capable: true,
    title: "NightNow Partner",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#facc15",
};

export default function DeliverLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}

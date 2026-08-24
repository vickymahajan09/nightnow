"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("Night Now");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [delivery1to3, setDelivery1to3] = useState("30");
  const [delivery3to5, setDelivery3to5] = useState("50");
  const [timeNear, setTimeNear] = useState("10");
  const [timeNormal, setTimeNormal] = useState("15");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "store"));
        if (!snap.exists()) return;
        const d = snap.data();
        setStoreName(d.storeName || "Night Now");
        setPhone(d.phone || "");
        setAddress(d.address || "");
        setLat(d.location?.lat != null ? String(d.location.lat) : "");
        setLng(d.location?.lng != null ? String(d.location.lng) : "");
        setDelivery1to3(String(d.deliveryRules?.oneToThreeKm ?? 30));
        setDelivery3to5(String(d.deliveryRules?.threeToFiveKm ?? 50));
        setTimeNear(String(d.deliveryTimes?.near ?? 10));
        setTimeNormal(String(d.deliveryTimes?.normal ?? 15));
      } catch (error) { console.error(error); }
    })();
  }, []);

  const saveSettings = async () => {
    if (!storeName.trim()) return alert("Store name required.");
    if (lat && Number.isNaN(Number(lat))) return alert("Invalid latitude.");
    if (lng && Number.isNaN(Number(lng))) return alert("Invalid longitude.");
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "store"), {
        storeName: storeName.trim(),
        phone: phone.replace(/\D/g, ""),
        address: address.trim(),
        location: { lat: Number(lat || 0), lng: Number(lng || 0) },
        deliveryRules: { oneToThreeKm: Number(delivery1to3 || 30), threeToFiveKm: Number(delivery3to5 || 50) },
        deliveryTimes: { near: Number(timeNear || 10), normal: Number(timeNormal || 15) },
        updatedAt: new Date(),
      }, { merge: true });
      alert("Store & delivery settings saved.");
    } catch (error) {
      console.error(error);
      alert("Settings save failed.");
    } finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white sm:p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-black text-yellow-400 sm:text-4xl">Store Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">Shop location, delivery charges aur ETA yahan set karein.</p>
        <div className="mt-6 space-y-6 rounded-2xl bg-zinc-900 p-4 sm:p-6">
          <section>
            <h2 className="mb-4 text-lg font-black">Shop Details</h2>
            <div className="space-y-3">
              <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Store Name" className="w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400" />
              <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="Shop Phone" inputMode="numeric" className="w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400" />
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Shop Address" rows={3} className="w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400" />
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-black">Shop Location</h2>
            <p className="mb-3 text-xs text-zinc-500">Google Maps se shop ke exact latitude/longitude yahan set karein.</p>
            <div className="grid grid-cols-2 gap-3">
              <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" inputMode="decimal" className="w-full rounded-xl bg-zinc-800 p-4 outline-none" />
              <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" inputMode="decimal" className="w-full rounded-xl bg-zinc-800 p-4 outline-none" />
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-lg font-black">Automatic Delivery Charge</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-xl bg-zinc-800 p-4 text-sm">1–3 km (₹)<input value={delivery1to3} onChange={(e) => setDelivery1to3(e.target.value.replace(/\D/g, ""))} className="mt-2 w-full rounded-lg bg-zinc-700 p-3 outline-none" /></label>
              <label className="rounded-xl bg-zinc-800 p-4 text-sm">3–5 km (₹)<input value={delivery3to5} onChange={(e) => setDelivery3to5(e.target.value.replace(/\D/g, ""))} className="mt-2 w-full rounded-lg bg-zinc-700 p-3 outline-none" /></label>
            </div>
            <p className="mt-3 text-xs text-zinc-500">5 km se upar ka rule next delivery engine batch me add hoga.</p>
          </section>
          <section>
            <h2 className="mb-4 text-lg font-black">Delivery Time</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-xl bg-zinc-800 p-4 text-sm">Near shop (minutes)<input value={timeNear} onChange={(e) => setTimeNear(e.target.value.replace(/\D/g, ""))} className="mt-2 w-full rounded-lg bg-zinc-700 p-3 outline-none" /></label>
              <label className="rounded-xl bg-zinc-800 p-4 text-sm">Normal area (minutes)<input value={timeNormal} onChange={(e) => setTimeNormal(e.target.value.replace(/\D/g, ""))} className="mt-2 w-full rounded-lg bg-zinc-700 p-3 outline-none" /></label>
            </div>
          </section>
          <button onClick={saveSettings} disabled={saving} className="w-full rounded-xl bg-yellow-400 py-4 font-black text-black disabled:opacity-50">{saving ? "Saving..." : "Save Settings"}</button>
        </div>
      </div>
    </main>
  );
}

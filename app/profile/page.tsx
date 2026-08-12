"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../lib/firebase";
import { logoutUser } from "../services/authService";

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  pincode: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    try {
      const saved = localStorage.getItem("nightnow-saved-addresses");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setAddresses(parsed);
      }
    } catch (error) {
      console.error("Saved addresses loading failed:", error);
    }

    return () => unsubscribe();
  }, []);

  const persistAddresses = (next: SavedAddress[]) => {
    setAddresses(next);
    localStorage.setItem("nightnow-saved-addresses", JSON.stringify(next));
  };

  const saveAddress = () => {
    if (!address.trim() || !city.trim() || !/^\d{6}$/.test(pincode.trim())) {
      alert("Address, city aur valid 6 digit pincode bhariye.");
      return;
    }

    const next = [
      ...addresses,
      {
        id: `${Date.now()}`,
        label: label.trim() || "Home",
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
      },
    ];

    persistAddresses(next);
    setAddress("");
    setCity("");
    setPincode("");
    setLabel("Home");
    setShowAddressForm(false);
  };

  const deleteAddress = (id: string) => {
    persistAddresses(addresses.filter((item) => item.id !== id));
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      alert("Logout failed");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="font-bold">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="text-6xl">👤</div>
          <h1 className="mt-5 text-2xl font-black">Login Required</h1>
          <p className="mt-2 text-sm text-zinc-500">Login to view your profile.</p>
          <Link href="/login" className="mt-6 block rounded-xl bg-yellow-400 py-4 font-black">
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 pb-28 text-black">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-bold text-zinc-500">← Home</Link>

        <div className="mt-5 overflow-hidden rounded-3xl bg-black p-6 text-white">
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-2xl text-black">👤</div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black">{user.displayName || "Night Now User"}</h1>
              <p className="truncate text-sm text-zinc-400">{user.phoneNumber || user.email || "Customer"}</p>
            </div>
          </div>
        </div>

        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Saved Addresses</h2>
              <p className="mt-1 text-xs text-zinc-500">Checkout par jaldi address select karne ke liye save karein.</p>
            </div>
            <button type="button" onClick={() => setShowAddressForm((v) => !v)} className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black">
              {showAddressForm ? "Close" : "+ Add"}
            </button>
          </div>

          {showAddressForm && (
            <div className="mt-5 space-y-3 rounded-2xl bg-zinc-50 p-4">
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (Home/Office)" className="w-full rounded-xl border bg-white p-3 outline-none" />
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" rows={3} className="w-full rounded-xl border bg-white p-3 outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-xl border bg-white p-3 outline-none" />
                <input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Pincode" inputMode="numeric" className="rounded-xl border bg-white p-3 outline-none" />
              </div>
              <button type="button" onClick={saveAddress} className="w-full rounded-xl bg-black py-3 font-black text-white">Save Address</button>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {addresses.length === 0 ? (
              <div className="rounded-xl border border-dashed p-5 text-center text-sm text-zinc-500">No saved address yet.</div>
            ) : addresses.map((item) => (
              <div key={item.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">📍 {item.label}</p>
                    <p className="mt-1 text-sm text-zinc-600">{item.address}</p>
                    <p className="mt-1 text-sm text-zinc-500">{item.city} - {item.pincode}</p>
                  </div>
                  <button type="button" onClick={() => deleteAddress(item.id)} className="text-xs font-bold text-red-500">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm">
          <Link href="/orders" className="flex items-center gap-4 border-b border-zinc-100 p-5 hover:bg-zinc-50">
            <span className="text-2xl">📦</span><div className="flex-1"><p className="font-black">My Orders</p><p className="text-xs text-zinc-500">Track your orders</p></div><span>→</span>
          </Link>
          <Link href="/cart" className="flex items-center gap-4 border-b border-zinc-100 p-5 hover:bg-zinc-50">
            <span className="text-2xl">🛒</span><div className="flex-1"><p className="font-black">My Cart</p><p className="text-xs text-zinc-500">View your cart</p></div><span>→</span>
          </Link>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-4 p-5 text-left hover:bg-red-50">
            <span className="text-2xl">🚪</span><div className="flex-1"><p className="font-black text-red-600">Logout</p><p className="text-xs text-zinc-500">Sign out from Night Now</p></div>
          </button>
        </div>
      </div>
    </main>
  );
}

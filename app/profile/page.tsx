"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  deleteUser,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { auth, db, storage } from "../lib/firebase";
import { logoutUser } from "../services/authService";

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gst, setGst] = useState("");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] =
    useState(false);

  const [addressLabel, setAddressLabel] =
    useState("Home");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [wallet, setWallet] = useState(0);

  const [theme, setTheme] = useState("system");

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  // ==========================================
  // APPLY THEME ONLY WHEN USER SELECTS IT
  // ==========================================

  const applyTheme = (value: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;

    if (value === "dark") {
      root.classList.add("dark");
      return;
    }

    if (value === "light") {
      root.classList.remove("dark");
      return;
    }

    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    root.classList.toggle(
      "dark",
      systemDark
    );
  };

  // ==========================================
  // LOAD USER
  // ==========================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser);
          setLoading(false);

          if (!currentUser) {
            return;
          }

          setName(
            currentUser.displayName || ""
          );

          setPhone(
            currentUser.phoneNumber || ""
          );

          try {
            // ================================
            // ADDRESSES
            // ================================

            const addressSnapshot =
              await getDocs(
                collection(
                  db,
                  "users",
                  currentUser.uid,
                  "addresses"
                )
              );

            const addressData =
              addressSnapshot.docs.map(
                (item) => ({
                  id: item.id,
                  ...(item.data() as Omit<
                    Address,
                    "id"
                  >),
                })
              );

            setAddresses(
              addressData as Address[]
            );

            // ================================
            // WALLET
            // ================================

            const walletSnapshot =
              await getDocs(
                collection(
                  db,
                  "users",
                  currentUser.uid,
                  "wallet"
                )
              );

            let total = 0;

            walletSnapshot.docs.forEach(
              (item) => {
                total += Number(
                  item.data()?.amount || 0
                );
              }
            );

            setWallet(total);

            // ================================
            // PROFILE DATA
            // ================================

            const profileSnapshot =
              await getDoc(
                doc(
                  db,
                  "users",
                  currentUser.uid
                )
              );

            const profileData =
              profileSnapshot.data();

            setGst(
              profileData?.gstNumber || ""
            );

            /*
              IMPORTANT:
              Profile load par theme APPLY nahi kar rahe.
              Isse homepage ka existing theme automatically
              change nahi hoga.
            */

            setTheme(
              profileData?.theme ||
                "system"
            );
          } catch (error) {
            console.error(
              "Profile loading error:",
              error
            );
          }
        }
      );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // CHANGE THEME
  // ==========================================

  const changeTheme = async (
    value: string
  ) => {
    setTheme(value);

    localStorage.setItem(
      "nightnow-theme",
      value
    );

    applyTheme(value);

    if (!user) {
      return;
    }

    try {
      await setDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {
          theme: value,
        },
        {
          merge: true,
        }
      );
    } catch (error) {
      console.error(
        "Theme save error:",
        error
      );
    }
  };

  // ==========================================
  // SAVE PERSONAL DETAILS
  // ==========================================

  const savePersonalDetails =
    async () => {
      if (!user) {
        return;
      }

      try {
        const finalName =
          name.trim() ||
          "Night Now Customer";

        await updateProfile(
          user,
          {
            displayName:
              finalName,
          }
        );

        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            name: finalName,
            phone: phone.trim(),
            gstNumber: gst.trim(),
            updatedAt:
              new Date(),
          },
          {
            merge: true,
          }
        );

        setName(finalName);
        setEditing(false);

        alert(
          "Profile updated successfully."
        );
      } catch (error) {
        console.error(
          "Profile update error:",
          error
        );

        alert(
          "Profile update failed."
        );
      }
    };

  // ==========================================
  // PROFILE PHOTO
  // ==========================================

  const uploadPhoto = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file || !user) {
      return;
    }

    setUploadingPhoto(true);

    try {
      const storageRef = ref(
        storage,
        `users/${user.uid}/profile-${Date.now()}`
      );

      await uploadBytes(
        storageRef,
        file
      );

      const url =
        await getDownloadURL(
          storageRef
        );

      await updateProfile(
        user,
        {
          photoURL: url,
        }
      );

      await setDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {
          photoURL: url,
        },
        {
          merge: true,
        }
      );

      setUser({
        ...user,
        photoURL: url,
      });

      alert(
        "Profile photo updated."
      );
    } catch (error) {
      console.error(
        "Photo upload error:",
        error
      );

      alert(
        "Photo upload failed."
      );
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  // ==========================================
  // SAVE ADDRESS
  // ==========================================

  const saveAddress = async () => {
    if (!user) {
      return;
    }

    if (
      !address.trim() ||
      !city.trim() ||
      pincode.length !== 6
    ) {
      alert(
        "Please enter complete address."
      );

      return;
    }

    try {
      const id =
        `address_${Date.now()}`;

      const newAddress: Address = {
        id,
        label:
          addressLabel ||
          "Other",
        name:
          name ||
          "Customer",
        phone,
        address:
          address.trim(),
        city:
          city.trim(),
        pincode,
      };

      await setDoc(
        doc(
          db,
          "users",
          user.uid,
          "addresses",
          id
        ),
        newAddress
      );

      setAddresses(
        (previous) => [
          ...previous,
          newAddress,
        ]
      );

      setAddress("");
      setCity("");
      setPincode("");
      setShowAddressForm(false);

      // SAVE FOR CHECKOUT AUTO-FILL
      localStorage.setItem(
        "nightnow-checkout-address",
        JSON.stringify(
          newAddress
        )
      );

      alert(
        "Address saved successfully."
      );
    } catch (error) {
      console.error(
        "Address save error:",
        error
      );

      alert(
        "Address save failed."
      );
    }
  };

  // ==========================================
  // SELECT ADDRESS
  // ==========================================

  const selectAddress = (
    item: Address
  ) => {
    localStorage.setItem(
      "nightnow-checkout-address",
      JSON.stringify(item)
    );

    alert(
      "Address selected for checkout."
    );
  };

  // ==========================================
  // DELETE ADDRESS
  // ==========================================

  const removeAddress = async (
    item: Address
  ) => {
    if (!user) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "addresses",
          item.id
        )
      );

      setAddresses(
        (previous) =>
          previous.filter(
            (addressItem) =>
              addressItem.id !==
              item.id
          )
      );
    } catch (error) {
      console.error(
        "Address delete error:",
        error
      );

      alert(
        "Address delete failed."
      );
    }
  };

  // ==========================================
  // SHARE PROFILE
  // ==========================================

  const shareProfile =
    async () => {
      try {
        const url =
          `${window.location.origin}/profile`;

        if (
          navigator.share
        ) {
          await navigator.share({
            title:
              "Night Now",
            text:
              "Check Night Now",
            url,
          });

          return;
        }

        await navigator.clipboard.writeText(
          url
        );

        alert(
          "Profile link copied."
        );
      } catch (error) {
        console.error(
          "Share error:",
          error
        );
      }
    };

  // ==========================================
  // DELETE ACCOUNT
  // ==========================================

  const handleDeleteAccount =
    async () => {
      if (!user) {
        return;
      }

      const confirmed =
        window.confirm(
          "Delete your Night Now account permanently?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteUser(
          user
        );

        window.location.href =
          "/";
      } catch (error: any) {
        console.error(error);

        alert(
          error?.message ||
            "For security, please login again and retry account deletion."
        );
      }
    };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout =
    async () => {
      try {
        await logoutUser();
      } catch (error) {
        console.error(
          "Logout error:",
          error
        );
      } finally {
        window.location.href =
          "/";
      }
    };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black">
        <div className="text-center">

          <div className="text-5xl">
            🌙
          </div>

          <p className="mt-3 text-sm font-black">
            Loading Profile...
          </p>

        </div>
      </main>
    );
  }

  // ==========================================
  // LOGIN REQUIRED
  // ==========================================

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black">

        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow">

          <div className="text-6xl">
            👤
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Login Required
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Profile access karne ke liye login karein.
          </p>

          <Link
            href="/login"
            className="mt-6 block rounded-2xl bg-yellow-400 py-4 font-black text-black"
          >
            Login
          </Link>

        </div>

      </main>
    );
  }

  // ==========================================
  // MAIN PROFILE
  // ==========================================

  return (
    <main className="min-h-screen bg-zinc-50 px-3 py-5 pb-24 text-black dark:bg-zinc-950 dark:text-white sm:px-5">

      <div className="mx-auto max-w-2xl">

        {/* BACK */}

        <Link
          href="/"
          className="text-xs font-black text-zinc-500"
        >
          ← Back to Night Now
        </Link>

        {/* ====================================
            PROFILE HEADER
        ===================================== */}

        <section className="mt-4 overflow-hidden rounded-3xl bg-black p-5 text-white shadow-lg">

          <div className="flex items-center gap-4">

            {/* IMAGE */}

            <div className="relative shrink-0">

              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border-2 border-yellow-400 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400 text-3xl text-black">
                  👤
                </div>
              )}

              <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-yellow-400 text-xs text-black">

                ✏️

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    uploadPhoto
                  }
                  className="hidden"
                />

              </label>

            </div>

            {/* USER INFO */}

            <div className="min-w-0 flex-1">

              <h1 className="truncate text-xl font-black">
                {user.displayName ||
                  "Night Now Customer"}
              </h1>

              <p className="mt-1 truncate text-xs text-zinc-400">
                {user.email}
              </p>

              {phone && (
                <p className="mt-1 text-xs text-zinc-400">
                  📱 {phone}
                </p>
              )}

              {uploadingPhoto && (
                <p className="mt-2 text-xs font-bold text-yellow-400">
                  Uploading photo...
                </p>
              )}

            </div>

            {/* EDIT */}

            <button
              type="button"
              onClick={() =>
                setEditing(
                  !editing
                )
              }
              className="shrink-0 rounded-xl bg-yellow-400 px-3 py-2 text-xs font-black text-black"
            >
              {editing
                ? "Close"
                : "Edit"}
            </button>

          </div>

          {/* EDIT FORM */}

          {editing && (
            <div className="mt-5 space-y-3 border-t border-zinc-800 pt-5">

              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Full Name"
                className="w-full rounded-xl bg-zinc-900 p-3 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-400"
              />

              <input
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
                placeholder="Mobile Number"
                className="w-full rounded-xl bg-zinc-900 p-3 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-400"
              />

              <input
                value={gst}
                onChange={(e) =>
                  setGst(
                    e.target.value.toUpperCase()
                  )
                }
                placeholder="GST Number (Optional)"
                className="w-full rounded-xl bg-zinc-900 p-3 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-400"
              />

              <button
                type="button"
                onClick={
                  savePersonalDetails
                }
                className="w-full rounded-xl bg-yellow-400 py-3 font-black text-black"
              >
                Save Personal Details
              </button>

            </div>
          )}

        </section>

        {/* ====================================
            QUICK MENU
        ===================================== */}

        <div className="mt-4 grid grid-cols-2 gap-3">

          <Link
            href="/orders"
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-yellow-400 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-2xl">
              📦
            </div>

            <p className="mt-2 text-sm font-black">
              Your Orders
            </p>

            <p className="mt-1 text-[10px] text-zinc-500">
              Order history
            </p>
          </Link>

          <Link
            href="/wishlist"
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-yellow-400 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-2xl">
              ❤️
            </div>

            <p className="mt-2 text-sm font-black">
              Your Wishlist
            </p>

            <p className="mt-1 text-[10px] text-zinc-500">
              Saved products
            </p>
          </Link>

          <Link
            href="/cart"
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-yellow-400 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-2xl">
              🛒
            </div>

            <p className="mt-2 text-sm font-black">
              Your Cart
            </p>

            <p className="mt-1 text-[10px] text-zinc-500">
              Review items
            </p>
          </Link>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">

            <div className="text-2xl">
              💰
            </div>

            <p className="mt-2 text-sm font-black">
              Wallet
            </p>

            <p className="mt-1 text-sm font-black text-green-600">
              ₹{wallet}
            </p>

          </div>

        </div>

        {/* ====================================
            ADDRESS
        ===================================== */}

        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

          <div className="flex items-center justify-between gap-3">

            <div>

              <h2 className="font-black">
                📍 Saved Addresses
              </h2>

              <p className="mt-1 text-[10px] text-zinc-500">
                Multiple delivery addresses
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowAddressForm(
                  !showAddressForm
                )
              }
              className="shrink-0 rounded-xl bg-yellow-400 px-3 py-2 text-[10px] font-black text-black"
            >
              + Add Address
            </button>

          </div>

          {/* ADD FORM */}

          {showAddressForm && (
            <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">

              <select
                value={addressLabel}
                onChange={(e) =>
                  setAddressLabel(
                    e.target.value
                  )
                }
                className="w-full rounded-xl bg-zinc-100 p-3 text-sm outline-none dark:bg-zinc-800"
              >
                <option value="Home">
                  Home
                </option>

                <option value="Work">
                  Work
                </option>

                <option value="Other">
                  Other
                </option>
              </select>

              <textarea
                rows={3}
                value={address}
                onChange={(e) =>
                  setAddress(
                    e.target.value
                  )
                }
                placeholder="Flat / House / Building / Street / Area"
                className="w-full resize-none rounded-xl bg-zinc-100 p-3 text-sm outline-none dark:bg-zinc-800"
              />

              <div className="grid grid-cols-2 gap-3">

                <input
                  value={city}
                  onChange={(e) =>
                    setCity(
                      e.target.value
                    )
                  }
                  placeholder="City"
                  className="rounded-xl bg-zinc-100 p-3 text-sm outline-none dark:bg-zinc-800"
                />

                <input
                  value={pincode}
                  maxLength={6}
                  onChange={(e) =>
                    setPincode(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder="Pincode"
                  className="rounded-xl bg-zinc-100 p-3 text-sm outline-none dark:bg-zinc-800"
                />

              </div>

              <button
                type="button"
                onClick={
                  saveAddress
                }
                className="w-full rounded-xl bg-black py-3 text-sm font-black text-white dark:bg-yellow-400 dark:text-black"
              >
                Save Address
              </button>

            </div>
          )}

          {/* ADDRESS LIST */}

          <div className="mt-4 space-y-3">

            {addresses.length ===
              0 && (
              <div className="rounded-xl bg-zinc-100 p-5 text-center dark:bg-zinc-800">

                <div className="text-3xl">
                  📍
                </div>

                <p className="mt-2 text-sm font-bold">
                  No saved address
                </p>

              </div>
            )}

            {addresses.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
                >

                  <div className="flex items-center justify-between">

                    <span className="rounded-full bg-yellow-400 px-2 py-1 text-[9px] font-black text-black">
                      {item.label}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeAddress(
                          item
                        )
                      }
                      className="text-[10px] font-black text-red-500"
                    >
                      Delete
                    </button>

                  </div>

                  <p className="mt-2 text-sm font-black">
                    {item.address}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {item.city} -{" "}
                    {item.pincode}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      selectAddress(
                        item
                      )
                    }
                    className="mt-3 rounded-lg bg-black px-3 py-2 text-[10px] font-black text-white dark:bg-yellow-400 dark:text-black"
                  >
                    Use at Checkout
                  </button>

                </div>
              )
            )}

          </div>

        </section>

        {/* ====================================
            SETTINGS
        ===================================== */}

        <section className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

          {/* ORDERS */}

          <Link
            href="/orders"
            className="flex items-center gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800"
          >
            <span className="text-xl">
              📦
            </span>

            <div>
              <p className="text-sm font-black">
                Your Order
              </p>

              <p className="text-[10px] text-zinc-500">
                View order history
              </p>
            </div>

            <span className="ml-auto">
              →
            </span>
          </Link>

          {/* WISHLIST */}

          <Link
            href="/wishlist"
            className="flex items-center gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800"
          >
            <span className="text-xl">
              ❤️
            </span>

            <div>
              <p className="text-sm font-black">
                Your Wishlist
              </p>

              <p className="text-[10px] text-zinc-500">
                Products you liked
              </p>
            </div>

            <span className="ml-auto">
              →
            </span>
          </Link>

          {/* WALLET */}

          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">

            <div className="flex items-center gap-3">

              <span className="text-xl">
                💰
              </span>

              <div>
                <p className="text-sm font-black">
                  Your Wallet
                </p>

                <p className="text-[10px] text-zinc-500">
                  Refund balance
                </p>
              </div>

              <strong className="ml-auto text-green-600">
                ₹{wallet}
              </strong>

            </div>

            <button
              type="button"
              onClick={() =>
                alert(
                  "Add Payment Method will be connected to Razorpay."
                )
              }
              className="mt-3 rounded-xl bg-yellow-400 px-4 py-2 text-[10px] font-black text-black"
            >
              + Add Payment Method
            </button>

          </div>

          {/* PAYMENT */}

          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">

            <div className="flex items-center gap-3">

              <span className="text-xl">
                💳
              </span>

              <div>
                <p className="text-sm font-black">
                  Payment Method
                </p>

                <p className="text-[10px] text-zinc-500">
                  UPI / Card / COD / Online
                </p>
              </div>

            </div>

          </div>

          {/* GST */}

          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">

            <div className="flex items-center gap-3">

              <span className="text-xl">
                🧾
              </span>

              <div>

                <p className="text-sm font-black">
                  GST Details
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {gst ||
                    "GST number not added"}
                </p>

              </div>

            </div>

          </div>

          {/* APPEARANCE */}

          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">

            <div className="flex items-center gap-3">

              <span className="text-xl">
                🎨
              </span>

              <div>

                <p className="text-sm font-black">
                  Appearance
                </p>

                <p className="text-[10px] text-zinc-500">
                  Light / Dark / System
                </p>

              </div>

            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">

              <button
                type="button"
                onClick={() =>
                  changeTheme(
                    "light"
                  )
                }
                className={[
                  "rounded-xl px-2 py-3 text-[10px] font-black",
                  theme === "light"
                    ? "bg-yellow-400 text-black"
                    : "bg-zinc-100 dark:bg-zinc-800",
                ].join(" ")}
              >
                ☀️ Light
              </button>

              <button
                type="button"
                onClick={() =>
                  changeTheme(
                    "dark"
                  )
                }
                className={[
                  "rounded-xl px-2 py-3 text-[10px] font-black",
                  theme === "dark"
                    ? "bg-yellow-400 text-black"
                    : "bg-zinc-100 dark:bg-zinc-800",
                ].join(" ")}
              >
                🌙 Dark
              </button>

              <button
                type="button"
                onClick={() =>
                  changeTheme(
                    "system"
                  )
                }
                className={[
                  "rounded-xl px-2 py-3 text-[10px] font-black",
                  theme === "system"
                    ? "bg-yellow-400 text-black"
                    : "bg-zinc-100 dark:bg-zinc-800",
                ].join(" ")}
              >
                ⚙️ System
              </button>

            </div>

          </div>

          {/* CHAT / SERVICE */}

          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">

            <div className="flex items-center gap-3">

              <span className="text-xl">
                💬
              </span>

              <div>

                <p className="text-sm font-black">
                  Chat & Service
                </p>

                <p className="text-[10px] text-zinc-500">
                  Need help?
                </p>

              </div>

            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">

              <button
                type="button"
                onClick={() =>
                  alert(
                    "Chat support will be connected."
                  )
                }
                className="rounded-xl bg-green-100 p-3 text-[10px] font-black text-green-700"
              >
                💬 Chat
              </button>

              <button
                type="button"
                onClick={() =>
                  alert(
                    "Customer service will be connected."
                  )
                }
                className="rounded-xl bg-blue-100 p-3 text-[10px] font-black text-blue-700"
              >
                ☎️ Service
              </button>

              <button
                type="button"
                onClick={() =>
                  alert(
                    "Contact Night Now."
                  )
                }
                className="rounded-xl bg-zinc-100 p-3 text-[10px] font-black text-black"
              >
                📩 Contact
              </button>

            </div>

          </div>

          {/* ABOUT */}

          <Link
            href="/about"
            className="flex items-center gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800"
          >
            <span className="text-xl">
              ℹ️
            </span>

            <span className="text-sm font-black">
              About Us
            </span>

            <span className="ml-auto">
              →
            </span>
          </Link>

          {/* TERMS */}

          <Link
            href="/terms"
            className="flex items-center gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800"
          >
            <span className="text-xl">
              📜
            </span>

            <span className="text-sm font-black">
              Terms & Conditions
            </span>

            <span className="ml-auto">
              →
            </span>
          </Link>

          {/* SHARE */}

          <button
            type="button"
            onClick={
              shareProfile
            }
            className="flex w-full items-center gap-3 border-b border-zinc-200 p-4 text-left dark:border-zinc-800"
          >
            <span className="text-xl">
              🔗
            </span>

            <span className="text-sm font-black">
              Share Night Now
            </span>

            <span className="ml-auto">
              →
            </span>
          </button>

          {/* PRIVACY */}

          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">

            <div className="flex items-center gap-3">

              <span className="text-xl">
                🔐
              </span>

              <div>

                <p className="text-sm font-black">
                  Account Privacy
                </p>

                <p className="mt-1 text-[10px] text-zinc-500">
                  Your account information is stored securely.
                </p>

              </div>

            </div>

          </div>

          {/* DELETE ACCOUNT */}

          <button
            type="button"
            onClick={
              handleDeleteAccount
            }
            className="flex w-full items-center gap-3 border-b border-zinc-200 p-4 text-left text-red-600 dark:border-zinc-800"
          >
            <span className="text-xl">
              🗑️
            </span>

            <span className="text-sm font-black">
              Delete Account
            </span>
          </button>

          {/* LOGOUT */}

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="flex w-full items-center gap-3 p-4 text-left text-red-600"
          >
            <span className="text-xl">
              🚪
            </span>

            <span className="text-sm font-black">
              Logout
            </span>
          </button>

        </section>

        {/* FOOTER */}

        <div className="py-8 text-center">

          <div className="text-xl font-black">
            Night
            <span className="text-yellow-500">
              Now
            </span>
          </div>

          <p className="mt-1 text-[10px] text-zinc-500">
            Fast delivery. Anytime.
          </p>

        </div>

      </div>

    </main>
  );
}
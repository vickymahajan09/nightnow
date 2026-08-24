"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
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

type ThemeMode =
  | "light"
  | "dark"
  | "system";

export default function ProfilePage() {
  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [editing, setEditing] =
    useState(false);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [gst, setGst] =
    useState("");

  const [gstOpen, setGstOpen] =
    useState(false);

  const [gstSaving, setGstSaving] =
    useState(false);

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [showAddressForm, setShowAddressForm] =
    useState(false);

  const [addressLabel, setAddressLabel] =
    useState("Home");

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [pincode, setPincode] =
    useState("");

  const [wallet, setWallet] =
    useState(0);

  const [theme, setTheme] =
    useState<ThemeMode>("system");

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  // ==========================================
  // IMAGE CROP STATES
  // ==========================================

  const [cropOpen, setCropOpen] =
    useState(false);

  const [cropImage, setCropImage] =
    useState<string | null>(null);

  const [cropZoom, setCropZoom] =
    useState(1);

  const [cropX, setCropX] =
    useState(0);

  const [cropY, setCropY] =
    useState(0);

  const [draggingCrop, setDraggingCrop] =
    useState(false);

  const cropStartRef =
    useRef({
      x: 0,
      y: 0,
      cropX: 0,
      cropY: 0,
    });

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  // ==========================================
  // APPLY THEME
  // ==========================================

  const applyTheme = (
    value: ThemeMode
  ) => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const root =
      document.documentElement;

    if (value === "dark") {
      root.classList.add("dark");
      return;
    }

    if (value === "light") {
      root.classList.remove("dark");
      return;
    }

    const systemDark =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

    root.classList.toggle(
      "dark",
      systemDark
    );
  };

  // ==========================================
  // LOAD SAVED THEME
  // ==========================================

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const saved =
      localStorage.getItem(
        "nightnow-theme"
      ) as ThemeMode | null;

    const initialTheme =
      saved === "light" ||
      saved === "dark" ||
      saved === "system"
        ? saved
        : "system";

    setTheme(initialTheme);
    applyTheme(initialTheme);

    const media =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

    const handleSystemTheme =
      () => {
        if (
          initialTheme ===
          "system"
        ) {
          applyTheme("system");
        }
      };

    media.addEventListener(
      "change",
      handleSystemTheme
    );

    return () => {
      media.removeEventListener(
        "change",
        handleSystemTheme
      );
    };
  }, []);

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
            currentUser.displayName ||
              ""
          );

          setPhone(
            currentUser.phoneNumber ||
              ""
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
                  item.data()?.amount ||
                    0
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

            const savedGst =
              profileData?.gstNumber ||
              "";

            setGst(savedGst);

            const savedTheme =
              profileData?.theme;

            if (
              savedTheme === "light" ||
              savedTheme === "dark" ||
              savedTheme === "system"
            ) {
              setTheme(savedTheme);
              applyTheme(savedTheme);

              localStorage.setItem(
                "nightnow-theme",
                savedTheme
              );
            }
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
    value: ThemeMode
  ) => {
    setTheme(value);

    if (
      typeof window !==
      "undefined"
    ) {
      localStorage.setItem(
        "nightnow-theme",
        value
      );
    }

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
          updatedAt:
            new Date(),
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
            gstNumber:
              gst.trim(),
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
  // SAVE GST
  // ==========================================

  const saveGstDetails =
    async () => {
      if (!user) {
        return;
      }

      setGstSaving(true);

      try {
        const cleanGst =
          gst.trim().toUpperCase();

        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            gstNumber: cleanGst,
            updatedAt:
              new Date(),
          },
          {
            merge: true,
          }
        );

        setGst(cleanGst);
        setGstOpen(false);

        alert(
          cleanGst
            ? "GST details saved successfully."
            : "GST details removed."
        );
      } catch (error) {
        console.error(
          "GST save error:",
          error
        );

        alert(
          "GST details save failed."
        );
      } finally {
        setGstSaving(false);
      }
    };

  // ==========================================
  // PROFILE PHOTO - SELECT FILE
  // ==========================================

  const uploadPhoto = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert(
        "Please select an image file."
      );

      event.target.value = "";
      return;
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(
        "Image size should be less than 10 MB."
      );

      event.target.value = "";
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result !==
        "string"
      ) {
        return;
      }

      setCropImage(
        reader.result
      );

      setCropZoom(1);
      setCropX(0);
      setCropY(0);
      setCropOpen(true);
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  // ==========================================
  // CROP DRAG START
  // ==========================================

  const startCropDrag = (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.TouchEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    const point =
      "touches" in event
        ? event.touches[0]
        : event;

    setDraggingCrop(true);

    cropStartRef.current = {
      x: point.clientX,
      y: point.clientY,
      cropX,
      cropY,
    };
  };

  // ==========================================
  // CROP DRAG MOVE
  // ==========================================

  const moveCropDrag = (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!draggingCrop) {
      return;
    }

    const point =
      "touches" in event
        ? event.touches[0]
        : event;

    const dx =
      point.clientX -
      cropStartRef.current.x;

    const dy =
      point.clientY -
      cropStartRef.current.y;

    setCropX(
      cropStartRef.current.cropX +
        dx
    );

    setCropY(
      cropStartRef.current.cropY +
        dy
    );
  };

  const stopCropDrag = () => {
    setDraggingCrop(false);
  };

  // ==========================================
  // CREATE CROPPED IMAGE
  // ==========================================

  const createCroppedImage =
    async () => {
      if (
        !cropImage ||
        !user
      ) {
        return;
      }

      setUploadingPhoto(true);

      try {
        const image =
          await loadImage(
            cropImage
          );

        const canvas =
          document.createElement(
            "canvas"
          );

        const outputSize = 600;

        canvas.width =
          outputSize;

        canvas.height =
          outputSize;

        const context =
          canvas.getContext(
            "2d"
          );

        if (!context) {
          throw new Error(
            "Canvas not supported"
          );
        }

        /*
          Crop area UI is 280x280.
          Image position is calculated
          according to zoom and drag.
        */

        const sourceSize =
          Math.min(
            image.width,
            image.height
          );

        const baseScale =
          280 /
          sourceSize;

        const scale =
          baseScale *
          cropZoom;

        const scaledWidth =
          image.width * scale;

        const scaledHeight =
          image.height * scale;

        const drawX =
          (280 -
            scaledWidth) /
            2 +
          cropX;

        const drawY =
          (280 -
            scaledHeight) /
            2 +
          cropY;

        context.clearRect(
          0,
          0,
          outputSize,
          outputSize
        );

        context.save();

        context.beginPath();

        context.rect(
          0,
          0,
          outputSize,
          outputSize
        );

        context.clip();

        /*
          Convert the 280px preview
          coordinates into 600px output.
        */

        const outputScale =
          outputSize / 280;

        context.drawImage(
          image,
          drawX *
            outputScale,
          drawY *
            outputScale,
          scaledWidth *
            outputScale,
          scaledHeight *
            outputScale
        );

        context.restore();

        const blob =
          await canvasToBlob(
            canvas
          );

        const storageRef =
          ref(
            storage,
            `users/${user.uid}/profile-${Date.now()}.jpg`
          );

        await uploadBytes(
          storageRef,
          blob,
          {
            contentType:
              "image/jpeg",
          }
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
            updatedAt:
              new Date(),
          },
          {
            merge: true,
          }
        );

        setUser({
          ...user,
          photoURL: url,
        });

        setCropOpen(false);
        setCropImage(null);

        alert(
          "Profile photo updated successfully."
        );
      } catch (error) {
        console.error(
          "Photo crop/upload error:",
          error
        );

        alert(
          "Profile photo update failed."
        );
      } finally {
        setUploadingPhoto(false);
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

    const confirmed =
      window.confirm(
        "Delete this saved address?"
      );

    if (!confirmed) {
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
      <main className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-zinc-950 dark:text-white">
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
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black dark:bg-zinc-950 dark:text-white">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow dark:bg-zinc-900">
          <div className="text-6xl">
            👤
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Login Required
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Profile access karne ke liye
            login karein.
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

            {/* PROFILE IMAGE */}

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
                  ref={
                    fileInputRef
                  }
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
                {user.email ||
                  user.phoneNumber ||
                  ""}
              </p>

              {phone && (
                <p className="mt-1 text-xs text-zinc-400">
                  📱 {phone}
                </p>
              )}

              {uploadingPhoto && (
                <p className="mt-2 text-xs font-bold text-yellow-400">
                  Processing photo...
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

              <button
                type="button"
                onClick={() =>
                  setGstOpen(true)
                }
                className="w-full rounded-xl bg-zinc-800 p-3 text-left text-sm text-white"
              >
                🧾 GST Details
                <span className="float-right text-yellow-400">
                  →
                </span>
              </button>

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
                  key={item.id}
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

          <button
            type="button"
            onClick={() =>
              setGstOpen(true)
            }
            className="flex w-full items-center gap-3 border-b border-zinc-200 p-4 text-left dark:border-zinc-800"
          >

            <span className="text-xl">
              🧾
            </span>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-black">
                GST Details
              </p>

              <p className="mt-1 truncate text-xs text-zinc-500">
                {gst ||
                  "GST number not added"}
              </p>

            </div>

            <span className="text-lg">
              →
            </span>

          </button>

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

          {/* ACCOUNT PRIVACY */}

          <Link
            href="/account/privacy"
            className="flex items-center gap-3 border-b border-zinc-200 p-4 text-left dark:border-zinc-800"
          >
            <span className="text-xl">
              🔐
            </span>

            <div className="flex-1">

              <p className="text-sm font-black">
                Account Privacy
              </p>

              <p className="mt-1 text-[10px] text-zinc-500">
                Privacy, security & delete account
              </p>

            </div>

            <span>
              →
            </span>
          </Link>

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

      {/* ====================================
          GST MODAL
      ===================================== */}

      {gstOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-3 sm:items-center">

          <div className="w-full max-w-md rounded-3xl bg-white p-5 text-black shadow-2xl dark:bg-zinc-900 dark:text-white">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-black">
                  🧾 GST Details
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Add your business GST number.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setGstOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 font-black dark:bg-zinc-800"
              >
                ×
              </button>

            </div>

            <input
              value={gst}
              onChange={(e) =>
                setGst(
                  e.target.value.toUpperCase()
                )
              }
              maxLength={15}
              placeholder="Enter GST Number"
              className="mt-5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-bold uppercase outline-none focus:border-yellow-400 dark:border-zinc-700 dark:bg-zinc-800"
            />

            <p className="mt-2 text-[10px] text-zinc-500">
              Example: 24ABCDE1234F1Z5
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() =>
                  setGstOpen(false)
                }
                className="rounded-2xl bg-zinc-100 py-3 text-sm font-black dark:bg-zinc-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={gstSaving}
                onClick={
                  saveGstDetails
                }
                className="rounded-2xl bg-yellow-400 py-3 text-sm font-black text-black disabled:opacity-60"
              >
                {gstSaving
                  ? "Saving..."
                  : "Save GST"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ====================================
          IMAGE CROP MODAL
      ===================================== */}

      {cropOpen &&
        cropImage && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-3">

            <div className="w-full max-w-md rounded-3xl bg-white p-5 text-black shadow-2xl dark:bg-zinc-900 dark:text-white">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-xl font-black">
                    Crop Profile Photo
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    Drag image and adjust zoom.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => {
                    setCropOpen(false);
                    setCropImage(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-xl font-black dark:bg-zinc-800"
                >
                  ×
                </button>

              </div>

              {/* CROP AREA */}

              <div className="mt-5 flex justify-center">

                <div
                  className="relative h-[280px] w-[280px] touch-none select-none overflow-hidden rounded-2xl bg-black"
                  onMouseDown={
                    startCropDrag
                  }
                  onMouseMove={
                    moveCropDrag
                  }
                  onMouseUp={
                    stopCropDrag
                  }
                  onMouseLeave={
                    stopCropDrag
                  }
                  onTouchStart={
                    startCropDrag
                  }
                  onTouchMove={
                    moveCropDrag
                  }
                  onTouchEnd={
                    stopCropDrag
                  }
                >

                  <img
                    src={cropImage}
                    alt="Crop preview"
                    draggable={false}
                    className="pointer-events-none absolute max-w-none select-none"
                    style={{
                      width: `${Math.max(
                        280,
                        cropImage
                          ? 280 *
                              cropZoom *
                              1.25
                          : 280
                      )}px`,
                      height: "auto",
                      left: `${cropX}px`,
                      top: `${cropY}px`,
                      minWidth: "280px",
                    }}
                  />

                  {/* CROP GUIDE */}

                  <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-white/90 shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.18)]">

                    <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/30" />

                    <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/30" />

                  </div>

                </div>

              </div>

              {/* ZOOM */}

              <div className="mt-5">

                <div className="flex items-center justify-between">

                  <span className="text-xs font-black">
                    Zoom
                  </span>

                  <span className="text-xs font-bold text-zinc-500">
                    {cropZoom.toFixed(
                      1
                    )}x
                  </span>

                </div>

                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={cropZoom}
                  onChange={(e) => {
                    setCropZoom(
                      Number(
                        e.target.value
                      )
                    );
                  }}
                  className="mt-3 w-full accent-yellow-400"
                />

              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">

                <button
                  type="button"
                  disabled={
                    uploadingPhoto
                  }
                  onClick={() => {
                    setCropOpen(false);
                    setCropImage(null);
                    setCropZoom(1);
                    setCropX(0);
                    setCropY(0);
                  }}
                  className="rounded-2xl bg-zinc-100 py-3 text-sm font-black dark:bg-zinc-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    uploadingPhoto
                  }
                  onClick={
                    createCroppedImage
                  }
                  className="rounded-2xl bg-yellow-400 py-3 text-sm font-black text-black disabled:opacity-60"
                >
                  {uploadingPhoto
                    ? "Saving..."
                    : "Crop & Save"}
                </button>

              </div>

            </div>

          </div>
        )}

    </main>
  );
}

// ==========================================
// IMAGE HELPERS
// ==========================================

function loadImage(
  src: string
): Promise<HTMLImageElement> {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image();

      image.onload = () =>
        resolve(image);

      image.onerror = reject;

      image.src = src;
    }
  );
}

function canvasToBlob(
  canvas: HTMLCanvasElement
): Promise<Blob> {
  return new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(
              new Error(
                "Could not create image."
              )
            );
          }
        },
        "image/jpeg",
        0.9
      );
    }
  );
}
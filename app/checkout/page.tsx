"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../lib/firebase";

import {
  useCart,
} from "../context/CartContext";

import {
  addOrder,
} from "../services/orderService";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type SavedAddress = {
  id: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  label?: string;
};

export default function CheckoutPage() {
  const {
    cart,
    cartTotal,
    deleteFromCart,
  } = useCart();

  const [user, setUser] =
    useState<any>(null);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [pincode, setPincode] =
    useState("");

  const [savedAddresses, setSavedAddresses] =
    useState<SavedAddress[]>([]);

  const [showAddresses, setShowAddresses] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const delivery =
    cartTotal >= 299 ? 0 : 30;

  const grandTotal =
    cartTotal + delivery;

  // =====================================
  // AUTH + SAVED ADDRESS
  // =====================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser);

          if (!currentUser) {
            return;
          }

          try {
            const snapshot =
              await getDocs(
                collection(
                  db,
                  "users",
                  currentUser.uid,
                  "addresses"
                )
              );

            const addresses =
              snapshot.docs.map(
                (item) => ({
                  id: item.id,
                  ...(item.data() as any),
                })
              );

            setSavedAddresses(
              addresses
            );

            // AUTO SELECT FIRST SAVED ADDRESS
            if (
              addresses.length > 0
            ) {
              const first =
                addresses[0];

              setName(
                first.name || ""
              );

              setPhone(
                first.phone || ""
              );

              setAddress(
                first.address || ""
              );

              setCity(
                first.city || ""
              );

              setPincode(
                first.pincode || ""
              );
            }
          } catch (error) {
            console.error(
              "Address loading failed:",
              error
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, []);

  // =====================================
  // SELECT SAVED ADDRESS
  // =====================================

  const selectAddress = (
    item: SavedAddress
  ) => {
    setName(
      item.name || ""
    );

    setPhone(
      item.phone || ""
    );

    setAddress(
      item.address || ""
    );

    setCity(
      item.city || ""
    );

    setPincode(
      item.pincode || ""
    );

    setShowAddresses(false);
  };

  // =====================================
  // VALIDATE
  // =====================================

  const validate = () => {
    if (!name.trim()) {
      alert(
        "Please enter your name"
      );
      return false;
    }

    if (
      !phone ||
      phone.length !== 10
    ) {
      alert(
        "Enter valid 10 digit phone number"
      );
      return false;
    }

    if (!address.trim()) {
      alert(
        "Please enter delivery address"
      );
      return false;
    }

    if (!city.trim()) {
      alert(
        "Please enter city"
      );
      return false;
    }

    if (
      !pincode ||
      pincode.length !== 6
    ) {
      alert(
        "Enter valid 6 digit pincode"
      );
      return false;
    }

    if (
      !cart ||
      cart.length === 0
    ) {
      alert("Cart is empty");
      return false;
    }

    return true;
  };

  // =====================================
  // SAVE ORDER
  // =====================================

  const saveOrder = async (
    paymentMethod: string,
    paymentData: any = {}
  ) => {
    const order = {
      customer: {
        name,
        phone,
        address,
        city,
        pincode,
      },

      items: cart,

      subtotal: cartTotal,

      delivery,

      total: grandTotal,

      paymentMethod,

      payment: paymentData,

      userId:
        user?.uid || null,

      customerEmail:
        user?.email || null,

      status: "Placed",

      createdAt:
        new Date(),
    };

    await addOrder(
      order
    );

    cart.forEach(
      (item: any) => {
        deleteFromCart(
          item.id
        );
      }
    );

    window.location.href =
      "/orders";
  };

  // =====================================
  // COD
  // =====================================

  const placeCOD = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await saveOrder(
        "COD"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Order Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // ONLINE PAYMENT
  // =====================================

  const payOnline = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      if (
        !window.Razorpay
      ) {
        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.async = true;

        document.body.appendChild(
          script
        );

        await new Promise(
          (
            resolve,
            reject
          ) => {
            script.onload =
              resolve;

            script.onerror =
              reject;
          }
        );
      }

      const response =
        await fetch(
          "/api/razorpay/create-order",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                amount:
                  grandTotal,
              }
            ),
          }
        );

      const razorpayOrder =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          "Razorpay order creation failed"
        );
      }

      const options = {
        key:
          process.env
            .NEXT_PUBLIC_RAZORPAY_KEY_ID,

        amount:
          razorpayOrder.amount,

        currency: "INR",

        name: "Night Now",

        description:
          "Night Now Order",

        order_id:
          razorpayOrder.id,

        prefill: {
          name,
          contact:
            `+91${phone}`,
        },

        notes: {
          address,
          city,
          pincode,
        },

        theme: {
          color:
            "#facc15",
        },

        handler:
          async (
            paymentResponse: any
          ) => {
            try {
              await saveOrder(
                "Online",
                paymentResponse
              );
            } catch (error) {
              console.error(
                error
              );

              alert(
                "Payment successful but order saving failed. Please contact support."
              );
            }
          },
      };

      const razorpay =
        new window.Razorpay(
          options
        );

      razorpay.open();
    } catch (error) {
      console.error(
        error
      );

      alert(
        "Online payment failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // UI
  // =====================================

  return (
    <main className="min-h-screen bg-black px-3 py-5 pb-10 text-white">

      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-5 flex items-center justify-between">

          <div>
            <Link
              href="/cart"
              className="text-xs font-bold text-zinc-500"
            >
              ← Back to Cart
            </Link>

            <h1 className="mt-2 text-3xl font-black">
              Checkout
            </h1>
          </div>

          <div className="rounded-2xl bg-yellow-400 px-4 py-2 text-black">

            <p className="text-[9px] font-bold">
              TOTAL
            </p>

            <p className="text-lg font-black">
              ₹{grandTotal}
            </p>

          </div>

        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

          {/* DELIVERY DETAILS */}

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-black">
                  Delivery Address
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Where should we deliver?
                </p>
              </div>

              {savedAddresses.length >
                0 && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAddresses(
                      !showAddresses
                    )
                  }
                  className="rounded-xl bg-yellow-400 px-3 py-2 text-[10px] font-black text-black"
                >
                  📍 Saved Addresses
                </button>
              )}

            </div>

            {/* SAVED ADDRESS */}

            {showAddresses && (
              <div className="mt-4 space-y-2">

                {savedAddresses.map(
                  (item) => (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        selectAddress(
                          item
                        )
                      }
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left hover:border-yellow-400"
                    >

                      <p className="text-xs font-black">
                        {item.label ||
                          "Saved Address"}
                      </p>

                      <p className="mt-1 text-xs text-zinc-400">
                        {
                          item.address
                        }
                        {item.city
                          ? `, ${item.city}`
                          : ""}
                        {item.pincode
                          ? ` - ${item.pincode}`
                          : ""}
                      </p>

                    </button>
                  )
                )}

              </div>
            )}

            <div className="mt-5 space-y-3">

              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Full Name"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              />

              <input
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    ).slice(0, 10)
                  )
                }
                placeholder="10 Digit Mobile Number"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              />

              <textarea
                rows={4}
                value={address}
                onChange={(e) =>
                  setAddress(
                    e.target.value
                  )
                }
                placeholder="House / Flat / Building / Street"
                className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              />

              <div className="grid gap-3 sm:grid-cols-2">

                <input
                  value={city}
                  onChange={(e) =>
                    setCity(
                      e.target.value
                    )
                  }
                  placeholder="City"
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />

                <input
                  value={pincode}
                  onChange={(e) =>
                    setPincode(
                      e.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          6
                        )
                    )
                  }
                  placeholder="Pincode"
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                />

              </div>

            </div>

          </section>

          {/* ORDER SUMMARY */}

          <section className="h-fit rounded-3xl border border-zinc-800 bg-zinc-950 p-5">

            <h2 className="text-lg font-black">
              Order Summary
            </h2>

            <div className="mt-4 space-y-3">

              {cart.map(
                (item: any) => (
                  <div
                    key={
                      item.id
                    }
                    className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-900 p-3"
                  >

                    <div className="min-w-0">

                      <p className="truncate text-xs font-black">
                        {
                          item.name
                        }
                      </p>

                      <p className="mt-1 text-[10px] text-zinc-500">
                        Qty:{" "}
                        {
                          item.quantity ||
                            1
                        }
                      </p>

                    </div>

                    <p className="shrink-0 text-xs font-black">
                      ₹
                      {Number(
                        item.price ||
                          0
                      ) *
                        Number(
                          item.quantity ||
                            1
                        )}
                    </p>

                  </div>
                )
              )}

            </div>

            <div className="my-5 h-px bg-zinc-800" />

            <div className="space-y-3 text-sm">

              <div className="flex justify-between">
                <span className="text-zinc-500">
                  Items
                </span>

                <span className="font-bold">
                  ₹{cartTotal}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">
                  Delivery
                </span>

                <span className="font-bold text-green-400">
                  {delivery === 0
                    ? "FREE"
                    : `₹${delivery}`}
                </span>
              </div>

              <div className="flex justify-between border-t border-zinc-800 pt-3 text-lg">
                <span className="font-black">
                  Total
                </span>

                <span className="font-black text-yellow-400">
                  ₹{grandTotal}
                </span>
              </div>

            </div>

            {/* PAYMENT */}

            <div className="mt-6">

              <p className="mb-3 text-xs font-black text-zinc-500">
                PAYMENT METHOD
              </p>

              <button
                disabled={loading}
                onClick={
                  payOnline
                }
                className="w-full rounded-2xl bg-yellow-400 py-4 text-sm font-black text-black disabled:opacity-50"
              >
                💳 Pay Online
              </button>

              <button
                disabled={loading}
                onClick={
                  placeCOD
                }
                className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-900 py-4 text-sm font-black disabled:opacity-50"
              >
                💵 Cash on Delivery
              </button>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}
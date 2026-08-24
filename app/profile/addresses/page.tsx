"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "../../lib/firebase";

import {
  addAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  type Address,
} from "../../services/addressService";

import AddressCard from "../../components/AddressCard";

const EMPTY_FORM = {
  name: "",
  phone: "",
  address: "",
  city: "",
  pincode: "",
  label: "",
  isDefault: false,
};

export default function AddressesPage() {
  const [user, setUser] =
    useState<any>(null);

  const [addresses, setAddresses] =
    useState<Address[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editingId, setEditingId] =
    useState("");

  const [form, setForm] =
    useState(EMPTY_FORM);

  const load =
    async () => {
      try {
        setLoading(true);

        const data =
          await getAddresses();

        setAddresses(data);
      } catch (error) {
        console.error(
          "Addresses loading error:",
          error
        );

        setAddresses([]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(
            currentUser
          );

          if (!currentUser) {
            setAddresses([]);
            setLoading(false);
            return;
          }

          await load();
        }
      );

    return () =>
      unsubscribe();
  }, []);

  const resetForm =
    () => {
      setEditingId("");
      setForm(
        EMPTY_FORM
      );
    };

  const submit =
    async () => {
      if (!form.name.trim()) {
        alert(
          "Please enter name."
        );
        return;
      }

      if (!form.phone.trim()) {
        alert(
          "Please enter phone."
        );
        return;
      }

      if (!form.address.trim()) {
        alert(
          "Please enter address."
        );
        return;
      }

      if (!form.city.trim()) {
        alert(
          "Please enter city."
        );
        return;
      }

      if (
        !/^\d{6}$/.test(
          form.pincode.trim()
        )
      ) {
        alert(
          "Please enter a valid 6-digit pincode."
        );
        return;
      }

      try {
        setSaving(true);

        if (editingId) {
          await updateAddress(
            editingId,
            {
              ...form,
              name:
                form.name.trim(),
              phone:
                form.phone.trim(),
              address:
                form.address.trim(),
              city:
                form.city.trim(),
              pincode:
                form.pincode.trim(),
              label:
                form.label.trim(),
            }
          );
        } else {
          await addAddress({
            ...form,
            name:
              form.name.trim(),
            phone:
              form.phone.trim(),
            address:
              form.address.trim(),
            city:
              form.city.trim(),
            pincode:
              form.pincode.trim(),
            label:
              form.label.trim(),
          });
        }

        resetForm();

        await load();
      } catch (
        error: any
      ) {
        console.error(
          "Address save error:",
          error
        );

        alert(
          error?.message ||
            "Address save failed."
        );
      } finally {
        setSaving(false);
      }
    };

  const edit =
    (address: Address) => {
      setEditingId(
        address.id || ""
      );

      setForm({
        name:
          address.name || "",
        phone:
          address.phone || "",
        address:
          address.address || "",
        city:
          address.city || "",
        pincode:
          address.pincode || "",
        label:
          address.label || "",
        isDefault:
          Boolean(
            address.isDefault
          ),
      });
    };

  const remove =
    async (
      address: Address
    ) => {
      if (
        !address.id ||
        !window.confirm(
          "Delete this address?"
        )
      ) {
        return;
      }

      try {
        await deleteAddress(
          address.id
        );

        await load();
      } catch (
        error: any
      ) {
        console.error(
          "Address delete error:",
          error
        );

        alert(
          error?.message ||
            "Address delete failed."
        );
      }
    };

  const makeDefault =
    async (
      address: Address
    ) => {
      if (!address.id) {
        return;
      }

      try {
        await setDefaultAddress(
          address.id
        );

        await load();
      } catch (
        error: any
      ) {
        console.error(
          "Default address error:",
          error
        );

        alert(
          error?.message ||
            "Unable to set default address."
        );
      }
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black">
        <div className="mx-auto max-w-xl text-center">
          <div className="text-5xl">
            📍
          </div>

          <p className="mt-4 font-black">
            Loading addresses...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-16 text-black">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black">
            Login Required
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Saved addresses use karne ke liye login karein.
          </p>

          <Link
            href="/login"
            className="mt-6 block rounded-xl bg-yellow-400 py-4 font-black"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-3 py-5 pb-24 text-black">
      <div className="mx-auto max-w-4xl">

        <Link
          href="/profile"
          className="text-sm font-black text-zinc-500"
        >
          ← Profile
        </Link>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">
              Saved Addresses
            </h1>

            <p className="mt-1 text-xs text-zinc-500">
              {addresses.length} saved address
              {addresses.length !==
              1
                ? "es"
                : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              window.scrollTo({
                top: 0,
                behavior:
                  "smooth",
              });
            }}
            className="rounded-xl bg-yellow-400 px-4 py-3 text-xs font-black"
          >
            + Add
          </button>
        </div>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">
            {editingId
              ? "Edit Address"
              : "Add Address"}
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) =>
                setForm(
                  (current) => ({
                    ...current,
                    name:
                      e.target.value,
                  })
                )
              }
              placeholder="Full Name"
              className="rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-yellow-400"
            />

            <input
              value={form.phone}
              onChange={(e) =>
                setForm(
                  (current) => ({
                    ...current,
                    phone:
                      e.target.value,
                  })
                )
              }
              placeholder="Phone Number"
              className="rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-yellow-400"
            />

            <input
              value={form.city}
              onChange={(e) =>
                setForm(
                  (current) => ({
                    ...current,
                    city:
                      e.target.value,
                  })
                )
              }
              placeholder="City"
              className="rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-yellow-400"
            />

            <input
              value={form.pincode}
              onChange={(e) =>
                setForm(
                  (current) => ({
                    ...current,
                    pincode:
                      e.target.value.replace(
                        /\D/g,
                        ""
                      ).slice(
                        0,
                        6
                      ),
                  })
                )
              }
              placeholder="Pincode"
              inputMode="numeric"
              className="rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-yellow-400"
            />

            <input
              value={form.label}
              onChange={(e) =>
                setForm(
                  (current) => ({
                    ...current,
                    label:
                      e.target.value,
                  })
                )
              }
              placeholder="Label (Home / Office)"
              className="rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-yellow-400 sm:col-span-2"
            />

            <textarea
              value={form.address}
              onChange={(e) =>
                setForm(
                  (current) => ({
                    ...current,
                    address:
                      e.target.value,
                  })
                )
              }
              placeholder="Complete Address"
              rows={4}
              className="resize-none rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-yellow-400 sm:col-span-2"
            />
          </div>

          <label className="mt-4 flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={
                form.isDefault
              }
              onChange={(e) =>
                setForm(
                  (current) => ({
                    ...current,
                    isDefault:
                      e.target.checked,
                  })
                )
              }
            />
            Set as default address
          </label>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                submit
              }
              className="flex-1 rounded-xl bg-yellow-400 py-3 text-sm font-black disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Address"
                  : "Save Address"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={
                  resetForm
                }
                className="rounded-xl bg-zinc-200 px-5 text-sm font-black"
              >
                Cancel
              </button>
            )}
          </div>
        </section>

        <div className="mt-5 space-y-3">
          {addresses.length ===
          0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">
                📍
              </div>

              <p className="mt-4 font-black">
                No saved addresses
              </p>
            </div>
          ) : (
            addresses.map(
              (address) => (
                <AddressCard
                  key={
                    address.id
                  }
                  address={
                    address
                  }
                  onEdit={
                    edit
                  }
                  onDelete={
                    remove
                  }
                  onDefault={
                    makeDefault
                  }
                />
              )
            )
          )}
        </div>
      </div>
    </main>
  );
}
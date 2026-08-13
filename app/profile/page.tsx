"use client";

import { useEffect, useState } from "react";

type Profile = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
};

const STORAGE_KEY =
  "nightnow_customer_profile";

const EMPTY_PROFILE: Profile = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  pincode: "",
};

export default function ProfilePage() {
  const [profile, setProfile] =
    useState<Profile>(
      EMPTY_PROFILE
    );

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    try {
      const data =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (data) {
        setProfile(
          JSON.parse(data)
        );
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const update = (
    field: keyof Profile,
    value: string
  ) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  const saveProfile = () => {
    if (!profile.name.trim()) {
      alert("Name required");
      return;
    }

    if (
      profile.phone.length !== 10
    ) {
      alert(
        "Enter valid 10 digit mobile number"
      );
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(profile)
      );

      setSaved(true);

      alert(
        "✅ Profile & address saved"
      );
    } catch (error) {
      console.error(error);
      alert("Save failed");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">

      <div className="mx-auto max-w-3xl">

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <p className="text-xs font-black uppercase tracking-widest text-yellow-600">
            NIGHT NOW
          </p>

          <h1 className="mt-1 text-3xl font-black">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Apni details aur delivery address save karein.
          </p>

        </div>

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black">
            Personal Details
          </h2>

          <div className="mt-5 space-y-4">

            <Input
              label="Full Name"
              value={profile.name}
              onChange={(value) =>
                update(
                  "name",
                  value
                )
              }
              placeholder="Your name"
            />

            <Input
              label="Mobile Number"
              value={profile.phone}
              onChange={(value) =>
                update(
                  "phone",
                  value.replace(
                    /\D/g,
                    ""
                  ).slice(0, 10)
                )
              }
              placeholder="10 digit mobile"
              type="tel"
            />

            <Input
              label="Email"
              value={profile.email}
              onChange={(value) =>
                update(
                  "email",
                  value
                )
              }
              placeholder="example@gmail.com"
              type="email"
            />

          </div>

        </section>

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="text-3xl">
              📍
            </div>

            <div>
              <h2 className="text-xl font-black">
                Saved Delivery Address
              </h2>

              <p className="text-xs text-slate-500">
                Checkout par ye address automatically use kiya ja sakta hai.
              </p>
            </div>

          </div>

          <div className="mt-5 space-y-4">

            <Input
              label="Complete Address"
              value={
                profile.address
              }
              onChange={(value) =>
                update(
                  "address",
                  value
                )
              }
              placeholder="House no, building, street..."
            />

            <div className="grid gap-4 md:grid-cols-2">

              <Input
                label="City"
                value={profile.city}
                onChange={(value) =>
                  update(
                    "city",
                    value
                  )
                }
                placeholder="Surat"
              />

              <Input
                label="Pincode"
                value={
                  profile.pincode
                }
                onChange={(value) =>
                  update(
                    "pincode",
                    value.replace(
                      /\D/g,
                      ""
                    ).slice(0, 6)
                  )
                }
                placeholder="3950XX"
              />

            </div>

          </div>

        </section>

        <button
          type="button"
          onClick={
            saveProfile
          }
          className="mt-5 w-full rounded-2xl bg-yellow-400 py-4 font-black text-black shadow-lg hover:bg-yellow-300"
        >
          {saved
            ? "✅ Saved"
            : "Save Profile & Address"}
        </button>

      </div>

    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-black">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-yellow-400 focus:bg-white"
      />

    </div>
  );
}
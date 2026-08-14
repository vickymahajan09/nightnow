"use client";

import { useEffect, useState } from "react";

import {
  addBrand,
  deleteBrand,
  getBrands,
  toggleBrand,
  toggleTopBrand,
  updateBrand,
  type Brand,
} from "../../services/brandService";
export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);

  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");

  const [active, setActive] = useState(true);
  const [topBrand, setTopBrand] = useState(false);

  const [editingId, setEditingId] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);

      const data = await getBrands();

      setBrands(data);
 } catch (error: any) {
  console.error("BRAND LOAD ERROR:", error);

  alert(
    `Failed to load brands.\n\n${
      error?.code || "Unknown error"
    }\n\n${
      error?.message || "Check Firebase Firestore rules."
    }`
  );
} finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setName("");
    setLogo("");
    setActive(true);
    setTopBrand(false);
    setEditingId("");
  };

  const saveBrand = async () => {
    if (!name.trim()) {
      alert("Please enter brand name.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await updateBrand(editingId, {
          name,
          logo,
          active,
          topBrand,
        });

        alert("Brand updated successfully.");
      } else {
        await addBrand(
          name,
          logo,
          active,
          topBrand
        );

        alert("Brand added successfully.");
      }

      clearForm();

      await loadBrands();
    } catch (error) {
      console.error(error);
      alert("Failed to save brand.");
    } finally {
      setSaving(false);
    }
  };

  const editBrand = (brand: Brand) => {
    setEditingId(brand.id);

    setName(brand.name || "");
    setLogo(brand.logo || "");
    setActive(brand.active);
    setTopBrand(brand.topBrand);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const removeBrand = async (id: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this brand?"
    );

    if (!confirmDelete) return;

    try {
      await deleteBrand(id);

      setBrands((old) =>
        old.filter((item) => item.id !== id)
      );

      if (editingId === id) {
        clearForm();
      }

      alert("Brand deleted successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to delete brand.");
    }
  };

  const changeActive = async (
    brand: Brand
  ) => {
    try {
      await toggleBrand(
        brand.id,
        !brand.active
      );

      setBrands((old) =>
        old.map((item) =>
          item.id === brand.id
            ? {
                ...item,
                active: !brand.active,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update brand status.");
    }
  };

  const changeTopBrand = async (
    brand: Brand
  ) => {
    try {
      await toggleTopBrand(
        brand.id,
        !brand.topBrand
      );

      setBrands((old) =>
        old.map((item) =>
          item.id === brand.id
            ? {
                ...item,
                topBrand: !brand.topBrand,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update Top Brand.");
    }
  };

  const filteredBrands = brands.filter(
    (brand) =>
      brand.name
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-3xl font-black text-yellow-400">
            Brand Editor
          </h1>

          <p className="mt-1 text-sm text-zinc-400">
            Add, edit, delete and manage Night Now brands.
          </p>
        </div>

        {/* FORM */}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">
              {editingId
                ? "Edit Brand"
                : "Add New Brand"}
            </h2>

            {editingId && (
              <button
                onClick={clearForm}
                className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-bold"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {/* BRAND NAME */}

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">
                Brand Name *
              </label>

              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter brand name"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white outline-none focus:border-yellow-400"
              />
            </div>

            {/* LOGO */}

            <div>
              <label className="mb-2 block text-xs font-bold text-zinc-400">
                Brand Logo URL
              </label>

              <input
                value={logo}
                onChange={(e) =>
                  setLogo(e.target.value)
                }
                placeholder="https://..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white outline-none focus:border-yellow-400"
              />
            </div>

          </div>

          {/* PREVIEW */}

          {logo && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-zinc-900 p-3">
              <img
                src={logo}
                alt={name || "Brand"}
                className="h-14 w-14 rounded-xl bg-white object-contain p-1"
                onError={(e) => {
                  e.currentTarget.style.display =
                    "none";
                }}
              />

              <div>
                <p className="text-sm font-black">
                  {name || "Brand Preview"}
                </p>

                <p className="text-xs text-zinc-500">
                  Logo Preview
                </p>
              </div>
            </div>
          )}

          {/* OPTIONS */}

          <div className="mt-5 grid gap-3 md:grid-cols-2">

            <button
              type="button"
              onClick={() =>
                setActive(!active)
              }
              className={`rounded-xl border p-4 text-left ${
                active
                  ? "border-green-500 bg-green-500/10"
                  : "border-zinc-700 bg-zinc-900"
              }`}
            >
              <p className="font-black">
                {active
                  ? "🟢 Brand Enabled"
                  : "🔴 Brand Disabled"}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Enable or disable this brand.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setTopBrand(!topBrand)
              }
              className={`rounded-xl border p-4 text-left ${
                topBrand
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-zinc-700 bg-zinc-900"
              }`}
            >
              <p className="font-black">
                {topBrand
                  ? "⭐ Top Brand ON"
                  : "☆ Top Brand OFF"}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Show this brand in Top Brands section.
              </p>
            </button>

          </div>

          {/* SAVE */}

          <button
            onClick={saveBrand}
            disabled={saving}
            className="mt-5 w-full rounded-xl bg-yellow-400 py-3 font-black text-black hover:bg-yellow-300 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Update Brand"
              : "Add Brand"}
          </button>

        </section>

        {/* SEARCH */}

        <div className="mt-8">
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search brands..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-white outline-none focus:border-yellow-400"
          />
        </div>

        {/* BRAND LIST */}

        <section className="mt-5">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">
              All Brands
            </h2>

            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-400">
              {filteredBrands.length} Brands
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-zinc-950 p-10 text-center text-zinc-400">
              Loading brands...
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
              No brands found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {filteredBrands.map(
                (brand) => (
                  <div
                    key={brand.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >

                    {/* BRAND TOP */}

                    <div className="flex items-center gap-3">

                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="h-14 w-14 rounded-xl bg-white object-contain p-1"
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800 text-xl">
                          🏷️
                        </div>
                      )}

                      <div className="min-w-0 flex-1">

                        <h3 className="truncate font-black">
                          {brand.name}
                        </h3>

                        <div className="mt-1 flex flex-wrap gap-1">

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                              brand.active
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {brand.active
                              ? "ACTIVE"
                              : "DISABLED"}
                          </span>

                          {brand.topBrand && (
                            <span className="rounded-full bg-yellow-400/20 px-2 py-1 text-[10px] font-bold text-yellow-400">
                              ⭐ TOP
                            </span>
                          )}

                        </div>
                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="mt-4 grid grid-cols-2 gap-2">

                      <button
                        onClick={() =>
                          editBrand(brand)
                        }
                        className="rounded-lg bg-blue-600 py-2 text-sm font-black hover:bg-blue-500"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          removeBrand(
                            brand.id
                          )
                        }
                        className="rounded-lg bg-red-600 py-2 text-sm font-black hover:bg-red-500"
                      >
                        Delete
                      </button>

                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">

                      <button
                        onClick={() =>
                          changeActive(
                            brand
                          )
                        }
                        className="rounded-lg bg-zinc-800 py-2 text-xs font-bold hover:bg-zinc-700"
                      >
                        {brand.active
                          ? "Disable"
                          : "Enable"}
                      </button>

                      <button
                        onClick={() =>
                          changeTopBrand(
                            brand
                          )
                        }
                        className="rounded-lg bg-zinc-800 py-2 text-xs font-bold hover:bg-zinc-700"
                      >
                        {brand.topBrand
                          ? "Remove Top"
                          : "Make Top"}
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}
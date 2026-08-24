"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addCampaign,
  deleteCampaign,
  getCampaigns,
  updateCampaign,
  type Campaign,
} from "../../services/campaignService";

import {
  getProducts,
  type Product,
} from "../../services/productService";

import {
  getBrands,
  type Brand,
} from "../../services/brandService";

import {
  getCategories,
} from "../../services/categoryService";

import {
  getOffers,
  type Offer,
} from "../../services/offerService";

type FormState = {
  name: string;
  slug: string;

  banner: string;
  mobileBanner: string;
  desktopBanner: string;

  startDate: string;
  endDate: string;

  categoryIds: string[];
  brandIds: string[];
  productIds: string[];

  offerIds: string[];
  couponCodes: string[];

  sectionPosition: string;

  priority: string;

  active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",

  banner: "",
  mobileBanner: "",
  desktopBanner: "",

  startDate: "",
  endDate: "",

  categoryIds: [],
  brandIds: [],
  productIds: [],

  offerIds: [],
  couponCodes: [],

  sectionPosition: "home",

  priority: "1",

  active: true,
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const campaignStatus = (
  campaign: Campaign
) => {
  if (!campaign.active) {
    return "Inactive";
  }

  const now = Date.now();

  if (campaign.startDate) {
    const start = new Date(
      campaign.startDate
    ).getTime();

    if (
      Number.isFinite(start) &&
      now < start
    ) {
      return "Scheduled";
    }
  }

  if (campaign.endDate) {
    const end = new Date(
      campaign.endDate
    ).getTime();

    if (
      Number.isFinite(end) &&
      now > end
    ) {
      return "Expired";
    }
  }

  return "LIVE";
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] =
    useState<Campaign[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [brands, setBrands] =
    useState<Brand[]>([]);

  const [categories, setCategories] =
    useState<any[]>([]);

  const [offers, setOffers] =
    useState<Offer[]>([]);

  const [form, setForm] =
    useState<FormState>(emptyForm());

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [productSearch, setProductSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadAll = async () => {
    setLoading(true);
    setError("");

    const [
      campaignResult,
      productResult,
      brandResult,
      categoryResult,
      offerResult,
    ] = await Promise.allSettled([
      getCampaigns(),
      getProducts(),
      getBrands(),
      getCategories(),
      getOffers(),
    ]);

    if (
      campaignResult.status ===
      "fulfilled"
    ) {
      setCampaigns(
        Array.isArray(
          campaignResult.value
        )
          ? campaignResult.value
          : []
      );
    } else {
      console.error(
        "Campaign load error:",
        campaignResult.reason
      );
      setCampaigns([]);
    }

    if (
      productResult.status ===
      "fulfilled"
    ) {
      setProducts(
        Array.isArray(
          productResult.value
        )
          ? productResult.value.filter(
              (item: any) =>
                item?.active !== false
            )
          : []
      );
    }

    if (
      brandResult.status ===
      "fulfilled"
    ) {
      setBrands(
        Array.isArray(
          brandResult.value
        )
          ? brandResult.value.filter(
              (item: any) =>
                item?.active !== false
            )
          : []
      );
    }

    if (
      categoryResult.status ===
      "fulfilled"
    ) {
      setCategories(
        Array.isArray(
          categoryResult.value
        )
          ? categoryResult.value.filter(
              (item: any) =>
                item?.active !== false
            )
          : []
      );
    }

    if (
      offerResult.status ===
      "fulfilled"
    ) {
      setOffers(
        Array.isArray(
          offerResult.value
        )
          ? offerResult.value
          : []
      );
    }

    if (
      campaignResult.status ===
      "rejected"
    ) {
      setError(
        "Campaigns could not be loaded. Check Firestore rules."
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const filteredProducts = useMemo(() => {
    const search =
      productSearch
        .trim()
        .toLowerCase();

    if (!search) {
      return products.slice(0, 100);
    }

    return products
      .filter((product: any) => {
        const text = [
          product?.name,
          product?.title,
          product?.productName,
          product?.brandName,
          product?.sku,
          product?.category,
        ]
          .flat()
          .join(" ")
          .toLowerCase();

        return text.includes(search);
      })
      .slice(0, 100);
  }, [
    products,
    productSearch,
  ]);

  const updateForm = (
    key: keyof FormState,
    value: any
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleArrayValue = (
    key:
      | "categoryIds"
      | "brandIds"
      | "productIds"
      | "offerIds",
    id: string
  ) => {
    setForm((current) => {
      const currentValues =
        current[key];

      const exists =
        currentValues.includes(id);

      return {
        ...current,
        [key]: exists
          ? currentValues.filter(
              (item) => item !== id
            )
          : [
              ...currentValues,
              id,
            ],
      };
    });
  };

  const saveCampaign = async () => {
    if (!form.name.trim()) {
      alert("Campaign Name required.");
      return;
    }

    if (!form.startDate) {
      alert("Start Date required.");
      return;
    }

    if (
      form.endDate &&
      new Date(form.endDate) <
        new Date(form.startDate)
    ) {
      alert(
        "End Date cannot be before Start Date."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),

        slug:
          form.slug.trim() ||
          slugify(form.name),

        banner:
          form.banner.trim(),

        mobileBanner:
          form.mobileBanner.trim(),

        desktopBanner:
          form.desktopBanner.trim(),

        startDate:
          form.startDate,

        endDate:
          form.endDate,

        categoryIds:
          form.categoryIds,

        brandIds:
          form.brandIds,

        productIds:
          form.productIds,

        offerIds:
          form.offerIds,

        couponCodes:
          form.couponCodes,

        sectionPosition:
          form.sectionPosition,

        priority:
          Number(form.priority || 1),

        active:
          form.active,
      };

      if (editingId) {
        await updateCampaign(
          editingId,
          payload
        );
      } else {
        await addCampaign(payload);
      }

      setForm(emptyForm());
      setEditingId(null);

      await loadAll();

      alert(
        editingId
          ? "Campaign updated successfully."
          : "Campaign created successfully."
      );
    } catch (saveError) {
      console.error(
        "Campaign save error:",
        saveError
      );

      alert(
        "Campaign save failed. Check console and Firestore rules."
      );
    } finally {
      setSaving(false);
    }
  };

  const editCampaign = (
    campaign: Campaign
  ) => {
    setEditingId(
      campaign.id || null
    );

    setForm({
      name: campaign.name || "",
      slug: campaign.slug || "",

      banner:
        campaign.banner || "",

      mobileBanner:
        campaign.mobileBanner || "",

      desktopBanner:
        campaign.desktopBanner || "",

      startDate:
        campaign.startDate || "",

      endDate:
        campaign.endDate || "",

      categoryIds:
        Array.isArray(
          campaign.categoryIds
        )
          ? campaign.categoryIds
          : [],

      brandIds:
        Array.isArray(
          campaign.brandIds
        )
          ? campaign.brandIds
          : [],

      productIds:
        Array.isArray(
          campaign.productIds
        )
          ? campaign.productIds
          : [],

      offerIds:
        Array.isArray(
          campaign.offerIds
        )
          ? campaign.offerIds
          : [],

      couponCodes:
        Array.isArray(
          campaign.couponCodes
        )
          ? campaign.couponCodes
          : [],

      sectionPosition:
        campaign.sectionPosition ||
        "home",

      priority:
        String(
          campaign.priority || 1
        ),

      active:
        campaign.active !== false,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const removeCampaign = async (
    id: string
  ) => {
    if (
      !confirm(
        "Delete this campaign permanently?"
      )
    ) {
      return;
    }

    try {
      await deleteCampaign(id);
      await loadAll();
    } catch (deleteError) {
      console.error(
        "Campaign delete error:",
        deleteError
      );

      alert(
        "Campaign delete failed."
      );
    }
  };

  const toggleCampaign = async (
    campaign: Campaign
  ) => {
    if (!campaign.id) return;

    try {
      await updateCampaign(
        campaign.id,
        {
          active:
            campaign.active === false,
        }
      );

      await loadAll();
    } catch (toggleError) {
      console.error(
        "Campaign toggle error:",
        toggleError
      );
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setProductSearch("");
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <p className="text-xs font-black tracking-[0.2em] text-yellow-700">
            NIGHTNOW ADMIN
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Festival & Campaign Manager
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Diwali, Holi, Raksha Bandhan,
            Weekend Sale, Midnight Sale and
            custom campaigns manage करें।
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* =========================================
            FORM
        ========================================= */}

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">
              {editingId
                ? "Edit Campaign"
                : "Create Campaign"}
            </h2>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-black"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <label className="text-sm font-bold">
              Campaign Name *
              <input
                value={form.name}
                onChange={(e) => {
                  const value =
                    e.target.value;

                  updateForm(
                    "name",
                    value
                  );

                  if (
                    !editingId &&
                    !form.slug
                  ) {
                    updateForm(
                      "slug",
                      slugify(value)
                    );
                  }
                }}
                placeholder="Raksha Bandhan Sale"
                className="mt-1 w-full rounded-xl border border-zinc-300 p-3 font-normal outline-none focus:border-yellow-400"
              />
            </label>

            <label className="text-sm font-bold">
              Campaign Slug
              <input
                value={form.slug}
                onChange={(e) =>
                  updateForm(
                    "slug",
                    slugify(
                      e.target.value
                    )
                  )
                }
                placeholder="raksha-bandhan-sale"
                className="mt-1 w-full rounded-xl border border-zinc-300 p-3 font-normal outline-none focus:border-yellow-400"
              />
            </label>

            <label className="text-sm font-bold">
              Start Date *
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) =>
                  updateForm(
                    "startDate",
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded-xl border border-zinc-300 p-3 font-normal"
              />
            </label>

            <label className="text-sm font-bold">
              End Date
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) =>
                  updateForm(
                    "endDate",
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded-xl border border-zinc-300 p-3 font-normal"
              />
            </label>

            <label className="text-sm font-bold">
              Main Banner URL
              <input
                value={form.banner}
                onChange={(e) =>
                  updateForm(
                    "banner",
                    e.target.value
                  )
                }
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-zinc-300 p-3 font-normal"
              />
            </label>

            <label className="text-sm font-bold">
              Mobile Banner URL
              <input
                value={form.mobileBanner}
                onChange={(e) =>
                  updateForm(
                    "mobileBanner",
                    e.target.value
                  )
                }
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-zinc-300 p-3 font-normal"
              />
            </label>

            <label className="text-sm font-bold">
              Desktop Banner URL
              <input
                value={form.desktopBanner}
                onChange={(e) =>
                  updateForm(
                    "desktopBanner",
                    e.target.value
                  )
                }
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-zinc-300 p-3 font-normal"
              />
            </label>

            <label className="text-sm font-bold">
              Section Position
              <select
                value={
                  form.sectionPosition
                }
                onChange={(e) =>
                  updateForm(
                    "sectionPosition",
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-3 font-normal"
              >
                <option value="home">
                  Home
                </option>
                <option value="top">
                  Top Banner
                </option>
                <option value="offers">
                  Offers
                </option>
                <option value="categories">
                  Categories
                </option>
                <option value="products">
                  Products
                </option>
              </select>
            </label>

            <label className="text-sm font-bold">
              Priority
              <input
                type="number"
                min="1"
                value={form.priority}
                onChange={(e) =>
                  updateForm(
                    "priority",
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded-xl border border-zinc-300 p-3 font-normal"
              />
            </label>

          </div>

          {/* CATEGORIES */}

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-black">
              Categories
            </h3>

            <div className="flex max-h-40 flex-wrap gap-2 overflow-auto rounded-2xl border border-zinc-200 p-3">
              {categories.map(
                (category: any) => {
                  const id =
                    String(
                      category.id ||
                        category.name
                    );

                  const checked =
                    form.categoryIds.includes(
                      id
                    );

                  return (
                    <label
                      key={id}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold ${
                        checked
                          ? "border-yellow-400 bg-yellow-100"
                          : "border-zinc-200 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleArrayValue(
                            "categoryIds",
                            id
                          )
                        }
                        className="mr-2"
                      />
                      {category.name ||
                        category.title ||
                        id}
                    </label>
                  );
                }
              )}
            </div>
          </div>

          {/* BRANDS */}

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-black">
              Brands
            </h3>

            <div className="flex max-h-40 flex-wrap gap-2 overflow-auto rounded-2xl border border-zinc-200 p-3">
              {brands.map(
                (brand: any) => {
                  const id =
                    String(
                      brand.id ||
                        brand.name
                    );

                  const checked =
                    form.brandIds.includes(
                      id
                    );

                  return (
                    <label
                      key={id}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold ${
                        checked
                          ? "border-yellow-400 bg-yellow-100"
                          : "border-zinc-200 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleArrayValue(
                            "brandIds",
                            id
                          )
                        }
                        className="mr-2"
                      />
                      {brand.name ||
                        brand.title ||
                        id}
                    </label>
                  );
                }
              )}
            </div>
          </div>

          {/* PRODUCTS */}

          <div className="mt-6">
            <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h3 className="text-sm font-black">
                Products
              </h3>

              <span className="text-xs font-bold text-zinc-500">
                Selected:{" "}
                {form.productIds.length}
              </span>
            </div>

            <input
              value={productSearch}
              onChange={(e) =>
                setProductSearch(
                  e.target.value
                )
              }
              placeholder="Search product, brand, SKU..."
              className="mb-3 w-full rounded-xl border border-zinc-300 p-3 text-sm outline-none"
            />

            <div className="grid max-h-80 gap-2 overflow-auto rounded-2xl border border-zinc-200 p-3 md:grid-cols-2">
              {filteredProducts.map(
                (product: any) => {
                  const id =
                    String(
                      product.id
                    );

                  const checked =
                    form.productIds.includes(
                      id
                    );

                  return (
                    <label
                      key={id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                        checked
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-zinc-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleArrayValue(
                            "productIds",
                            id
                          )
                        }
                      />

                      <div className="min-w-0">
                        <p className="truncate text-xs font-black">
                          {product.name ||
                            product.title ||
                            product.productName ||
                            "Product"}
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-500">
                          {product.brandName ||
                            ""}

                          {product.sku
                            ? ` • ${product.sku}`
                            : ""}
                        </p>
                      </div>
                    </label>
                  );
                }
              )}
            </div>
          </div>

          {/* OFFERS */}

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-black">
              Offers
            </h3>

            <div className="flex max-h-40 flex-wrap gap-2 overflow-auto rounded-2xl border border-zinc-200 p-3">
              {offers.map(
                (offer: any) => {
                  const id =
                    String(
                      offer.id
                    );

                  const checked =
                    form.offerIds.includes(
                      id
                    );

                  return (
                    <label
                      key={id}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold ${
                        checked
                          ? "border-yellow-400 bg-yellow-100"
                          : "border-zinc-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleArrayValue(
                            "offerIds",
                            id
                          )
                        }
                        className="mr-2"
                      />

                      {offer.title ||
                        offer.name ||
                        id}
                    </label>
                  );
                }
              )}
            </div>
          </div>

          {/* COUPONS */}

          <label className="mt-6 block text-sm font-bold">
            Coupon Codes
            <textarea
              value={form.couponCodes.join(
                ", "
              )}
              onChange={(e) =>
                updateForm(
                  "couponCodes",
                  e.target.value
                    .split(",")
                    .map((x) =>
                      x.trim()
                    )
                    .filter(Boolean)
                )
              }
              placeholder="RAKSHA10, FESTIVE20"
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-300 p-3 font-normal"
            />
          </label>

          <label className="mt-5 flex items-center gap-2 text-sm font-black">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                updateForm(
                  "active",
                  e.target.checked
                )
              }
            />

            Campaign Active
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveCampaign}
              disabled={saving}
              className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-black disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Campaign"
                : "Create Campaign"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-black"
            >
              Reset
            </button>
          </div>
        </section>

        {/* =========================================
            LIST
        ========================================= */}

        <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">
              Campaign History
            </h2>

            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black">
              {campaigns.length}
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm font-bold text-zinc-500">
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-2xl bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-500">
              No campaigns created yet.
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(
                (campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-2xl border border-zinc-200 p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black">
                            {campaign.name}
                          </h3>

                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-black">
                            {campaignStatus(
                              campaign
                            )}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                          /{campaign.slug}
                        </p>

                        <p className="mt-2 text-xs font-bold">
                          Products:{" "}
                          {
                            campaign
                              .productIds
                              ?.length
                          }
                          {" • "}
                          Categories:{" "}
                          {
                            campaign
                              .categoryIds
                              ?.length
                          }
                          {" • "}
                          Brands:{" "}
                          {
                            campaign
                              .brandIds
                              ?.length
                          }
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-500">
                          {campaign.startDate ||
                            "No start"}

                          {" → "}

                          {campaign.endDate ||
                            "No end"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            editCampaign(
                              campaign
                            )
                          }
                          className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-black"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleCampaign(
                              campaign
                            )
                          }
                          className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-black text-white"
                        >
                          {campaign.active
                            ? "Disable"
                            : "Enable"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            campaign.id &&
                            removeCampaign(
                              campaign.id
                            )
                          }
                          className="rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-600"
                        >
                          Delete
                        </button>
                      </div>

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
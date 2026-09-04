"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getOffers,
  updateOffer,
  deleteOffer,
  type Offer,
  type OfferType,
} from "../../services/offerService";

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingOffer, setEditingOffer] =
    useState<Offer | null>(null);

  const [deletingOffer, setDeletingOffer] =
    useState<Offer | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getOffers();

      const activeOffers =
        Array.isArray(result)
          ? result.filter(
              (offer) =>
                offer.active !== false
            )
          : [];

      setOffers(activeOffers);
    } catch (err) {
      console.error(
        "Offers loading error:",
        err
      );

      setOffers([]);

      setError(
        "Failed to load offers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOffers();
  }, []);

  const getOfferLabel = (
    offer: Offer
  ) => {
    if (
      offer.type === "BUY_1_GET_1"
    ) {
      return "BUY 1 GET 1";
    }

    if (
      offer.type === "BUY_1_GET_2"
    ) {
      return "BUY 1 GET 2";
    }

    if (
      offer.type === "BUY_X_GET_Y"
    ) {
      return `BUY ${
        offer.buyQuantity || 1
      } GET ${
        offer.freeQuantity || 1
      }`;
    }

    return "SPECIAL OFFER";
  };


  // =====================================================
  // SAVE EDIT
  // =====================================================

  const handleSaveEdit = async () => {
    if (!editingOffer) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await updateOffer(
        String(editingOffer.id),
        {
          title:
            editingOffer.title,

          description:
            editingOffer.description || "",

          type:
            editingOffer.type,

          buyQuantity:
            Number(
              editingOffer.buyQuantity || 1
            ),

          freeQuantity:
            Number(
              editingOffer.freeQuantity || 0
            ),

          brandIds:
            editingOffer.brandIds || [],

          productIds:
            editingOffer.productIds || [],

          active:
            editingOffer.active !== false,
        }
      );

      setEditingOffer(null);

      setMessage(
        "Offer successfully updated."
      );

      await loadOffers();

    } catch (err: any) {
      console.error(
        "Offer update error:",
        err
      );

      setError(
        err?.message ||
          "Failed to update the offer."
      );
    } finally {
      setSaving(false);
    }
  };


  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async () => {
    if (!deletingOffer) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      await deleteOffer(
        String(deletingOffer.id)
      );

      setDeletingOffer(null);

      setMessage(
        "Offer successfully deleted."
      );

      await loadOffers();

    } catch (err: any) {
      console.error(
        "Offer delete error:",
        err
      );

      setError(
        err?.message ||
          "Failed to delete the offer."
      );
    } finally {
      setDeleting(false);
    }
  };


  // =====================================================
  // CHANGE OFFER TYPE
  // =====================================================

  const handleTypeChange = (
    type: OfferType
  ) => {
    if (!editingOffer) {
      return;
    }

    let buyQuantity =
      editingOffer.buyQuantity || 1;

    let freeQuantity =
      editingOffer.freeQuantity || 0;

    if (
      type === "BUY_1_GET_1"
    ) {
      buyQuantity = 1;
      freeQuantity = 1;
    }

    if (
      type === "BUY_1_GET_2"
    ) {
      buyQuantity = 1;
      freeQuantity = 2;
    }

    if (
      type === "BUY_X_GET_Y"
    ) {
      buyQuantity =
        Math.max(
          1,
          buyQuantity
        );

      freeQuantity =
        Math.max(
          1,
          freeQuantity
        );
    }

    if (
      type === "NONE"
    ) {
      buyQuantity = 1;
      freeQuantity = 0;
    }

    setEditingOffer({
      ...editingOffer,
      type,
      buyQuantity,
      freeQuantity,
    });
  };


  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fff8e7] via-[#f7f7ff] to-[#f4edff] text-zinc-900">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">

          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <span className="text-3xl">
              🌙
            </span>

            <div>
              <div className="text-xl font-black leading-none">
                Night
                <span className="text-yellow-500">
                  Now
                </span>
              </div>

              <div className="mt-1 text-[8px] font-bold tracking-[0.18em] text-zinc-400">
                15 MIN DELIVERY
              </div>
            </div>
          </Link>

          <Link
            href="/admin"
            className="rounded-xl bg-black px-4 py-2 text-xs font-black text-white"
          >
            ← Admin
          </Link>

        </div>

      </header>


      {/* =================================================
          PAGE
      ================================================= */}

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-7">

        {/* TITLE */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">
              NightNow Deals
            </p>

            <h1 className="mt-1 text-3xl font-black">
              All Offers
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Create, edit and manage all offers.
            </p>
          </div>

          <Link
            href="/admin/offers/create"
            className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black text-black shadow-sm hover:bg-yellow-300"
          >
            + Create New Offer
          </Link>

        </div>


        {/* SUCCESS */}

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            ✅ {message}
          </div>
        )}


        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            ⚠️ {error}
          </div>
        )}


        {/* LOADING */}

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-3xl bg-white"
                />
              )
            )}

          </div>
        )}


        {/* EMPTY */}

        {!loading &&
          offers.length === 0 && (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center">

              <div className="text-5xl">
                🎁
              </div>

              <h2 className="mt-4 text-xl font-black">
                No active offers
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Create your first offer.
              </p>

              <Link
                href="/admin/offers/create"
                className="mt-5 inline-flex rounded-xl bg-yellow-400 px-5 py-3 text-xs font-black"
              >
                + Create Offer
              </Link>

            </div>
          )}


        {/* =================================================
            OFFERS
        ================================================= */}

        {!loading &&
          offers.length > 0 && (

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {offers.map(
              (offer) => {

                const offerLabel =
                  getOfferLabel(
                    offer
                  );

                return (

                  <div
                    key={String(
                      offer.id
                    )}
                    className="overflow-hidden rounded-3xl border border-yellow-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  >

                    {/* CARD TOP */}

                    <div className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 p-5">

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 text-3xl shadow-sm">
                          🎁
                        </div>

                        <span className="rounded-full bg-black px-3 py-1.5 text-[9px] font-black text-white">
                          {offerLabel}
                        </span>

                      </div>

                    </div>


                    {/* CARD CONTENT */}

                    <div className="p-5">

                      <h2 className="line-clamp-2 text-lg font-black">
                        {offer.title}
                      </h2>


                      {offer.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-500">
                          {offer.description}
                        </p>
                      )}


                      {/* PRODUCT / BRAND COUNT */}

                      <div className="mt-4 flex flex-wrap gap-2">

                        {offer.productIds?.length >
                          0 && (

                          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-600">
                            {offer.productIds.length} Products
                          </span>

                        )}

                        {offer.brandIds?.length >
                          0 && (

                          <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-[9px] font-black text-purple-600">
                            {offer.brandIds.length} Brands
                          </span>

                        )}

                      </div>


                      {/* =================================================
                          EDIT / DELETE
                      ================================================= */}

                      <div className="mt-5 grid grid-cols-2 gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            setEditingOffer({
                              ...offer,
                            })
                          }
                          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-black text-blue-700 transition hover:bg-blue-100 active:scale-95"
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeletingOffer(
                              offer
                            )
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-100 active:scale-95"
                        >
                          🗑️ Delete
                        </button>

                      </div>


                      {/* VIEW */}

                      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-4">

                        <span className="text-[10px] font-bold text-zinc-400">
                          View offer details
                        </span>

                        <Link
                          href={`/offers/${encodeURIComponent(
                            String(
                              offer.id
                            )
                          )}`}
                          className="rounded-xl bg-black px-4 py-2 text-[10px] font-black text-white transition hover:bg-zinc-800"
                        >
                          View Offer →
                        </Link>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </section>


      {/* =====================================================
          EDIT MODAL
      ===================================================== */}

      {editingOffer && (

        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">

              <div>
                <h2 className="text-xl font-black">
                  Edit Offer
                </h2>

                <p className="text-xs text-zinc-500">
                  Update your offer details
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditingOffer(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-lg font-black"
              >
                ×
              </button>

            </div>


            {/* MODAL BODY */}

            <div className="space-y-5 p-5">

              {/* TITLE */}

              <div>
                <label className="text-xs font-black text-zinc-700">
                  Offer Title
                </label>

                <input
                  value={
                    editingOffer.title
                  }
                  onChange={(e) =>
                    setEditingOffer({
                      ...editingOffer,
                      title:
                        e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold outline-none focus:border-yellow-400"
                  placeholder="Offer title"
                />
              </div>


              {/* DESCRIPTION */}

              <div>
                <label className="text-xs font-black text-zinc-700">
                  Description
                </label>

                <textarea
                  value={
                    editingOffer.description ||
                    ""
                  }
                  onChange={(e) =>
                    setEditingOffer({
                      ...editingOffer,
                      description:
                        e.target.value,
                    })
                  }
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                  placeholder="Offer description"
                />
              </div>


              {/* TYPE */}

              <div>
                <label className="text-xs font-black text-zinc-700">
                  Offer Type
                </label>

                <select
                  value={
                    editingOffer.type
                  }
                  onChange={(e) =>
                    handleTypeChange(
                      e.target
                        .value as OfferType
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-yellow-400"
                >
                  <option value="NONE">
                    Special Offer
                  </option>

                  <option value="BUY_1_GET_1">
                    BUY 1 GET 1
                  </option>

                  <option value="BUY_1_GET_2">
                    BUY 1 GET 2
                  </option>

                  <option value="BUY_X_GET_Y">
                    BUY X GET Y
                  </option>
                </select>
              </div>


              {/* QUANTITIES */}

              {editingOffer.type ===
                "BUY_X_GET_Y" && (

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <label className="text-xs font-black text-zinc-700">
                      Buy Quantity
                    </label>

                    <input
                      type="number"
                      min={1}
                      value={
                        editingOffer.buyQuantity
                      }
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          buyQuantity:
                            Math.max(
                              1,
                              Number(
                                e.target
                                  .value
                              )
                            ),
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold"
                    />
                  </div>


                  <div>
                    <label className="text-xs font-black text-zinc-700">
                      Free Quantity
                    </label>

                    <input
                      type="number"
                      min={1}
                      value={
                        editingOffer.freeQuantity
                      }
                      onChange={(e) =>
                        setEditingOffer({
                          ...editingOffer,
                          freeQuantity:
                            Math.max(
                              1,
                              Number(
                                e.target
                                  .value
                              )
                            ),
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold"
                    />
                  </div>

                </div>

              )}


              {/* ACTIVE */}

              <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-4">

                <div>
                  <p className="text-sm font-black">
                    Offer Active
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Active offers appear to customers.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditingOffer({
                      ...editingOffer,
                      active:
                        !editingOffer.active,
                    })
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    editingOffer.active
                      ? "bg-green-500"
                      : "bg-zinc-300"
                  }`}
                >

                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      editingOffer.active
                        ? "left-6"
                        : "left-1"
                    }`}
                  />

                </button>

              </div>


              {/* NOTE */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">

                <strong>
                  Products / Brands:
                </strong>{" "}
                Existing selected products
                and brands will remain unchanged.
                Edit modal is only changing the
                offer information.

              </div>

            </div>


            {/* MODAL FOOTER */}

            <div className="sticky bottom-0 flex gap-3 border-t border-zinc-200 bg-white p-5">

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setEditingOffer(
                    null
                  )
                }
                className="flex-1 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-black text-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  !editingOffer.title.trim()
                }
                onClick={
                  handleSaveEdit
                }
                className="flex-1 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      {deletingOffer && (

        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">

            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
                🗑️
              </div>

              <h2 className="mt-4 text-xl font-black">
                Delete Offer?
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Are you sure you want to delete
                <strong className="text-zinc-900">
                  {" "}
                  "{deletingOffer.title}"
                </strong>
                ?
              </p>

              <p className="mt-2 text-xs text-red-500">
                This action cannot be undone.
              </p>

            </div>


            <div className="mt-6 grid grid-cols-2 gap-3">

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeletingOffer(
                    null
                  )
                }
                className="rounded-xl bg-zinc-100 px-4 py-3 text-sm font-black text-zinc-700"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={
                  handleDelete
                }
                className="rounded-xl bg-red-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}
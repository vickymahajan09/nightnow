"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  addCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
} from "../../services/couponService";


export default function AdminCouponsPage() {

  const [coupons, setCoupons] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [code, setCode] =
    useState("");

  const [discount, setDiscount] =
    useState("");

  const [minOrder, setMinOrder] =
    useState("0");

  const [expiresAt, setExpiresAt] =
    useState("");

  const [active, setActive] =
    useState(true);


  useEffect(() => {
    loadCoupons();
  }, []);


  const loadCoupons = async () => {
    try {

      setLoading(true);

      const data =
        await getCoupons();

      setCoupons(data);

    } catch (error) {

      console.error(error);

      alert(
        "Failed to load coupons"
      );

    } finally {

      setLoading(false);

    }
  };


  const resetForm = () => {

    setEditingId(null);
    setCode("");
    setDiscount("");
    setMinOrder("0");
    setExpiresAt("");
    setActive(true);

  };


  const saveCoupon = async () => {

    if (!code.trim()) {
      alert(
        "Enter coupon code"
      );
      return;
    }

    if (
      !discount ||
      Number(discount) <= 0 ||
      Number(discount) > 100
    ) {
      alert(
        "Discount must be between 1 and 100"
      );
      return;
    }

    setSaving(true);

    try {

      const data = {
        code:
          code.trim().toUpperCase(),

        discount:
          Number(discount),

        minOrder:
          Number(minOrder || 0),

        expiresAt:
          expiresAt || "",

        active,
      };


      if (editingId) {

        await updateCoupon(
          editingId,
          data
        );

        alert(
          "Coupon updated successfully"
        );

      } else {

        await addCoupon(data);

        alert(
          "Coupon created successfully"
        );

      }

      resetForm();

      await loadCoupons();

    } catch (error: any) {

      console.error(error);

      alert(
        error?.message ||
        "Failed to save coupon"
      );

    } finally {

      setSaving(false);

    }
  };


  const editCoupon = (
    coupon: any
  ) => {

    setEditingId(
      coupon.id
    );

    setCode(
      coupon.code || ""
    );

    setDiscount(
      String(
        coupon.discount || ""
      )
    );

    setMinOrder(
      String(
        coupon.minOrder || 0
      )
    );

    setActive(
      coupon.active !== false
    );

    if (
      coupon.expiresAt
    ) {

      const date =
        coupon.expiresAt.toDate
          ? coupon.expiresAt.toDate()
          : new Date(
              coupon.expiresAt
            );

      if (
        !isNaN(
          date.getTime()
        )
      ) {

        const local =
          new Date(
            date.getTime() -
            date.getTimezoneOffset() *
              60000
          )
            .toISOString()
            .slice(0, 16);

        setExpiresAt(local);

      }

    } else {

      setExpiresAt("");

    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  const removeCoupon = async (
    id: string
  ) => {

    if (
      !confirm(
        "Delete this coupon?"
      )
    ) {
      return;
    }

    try {

      await deleteCoupon(id);

      setCoupons(
        (old) =>
          old.filter(
            (item) =>
              item.id !== id
          )
      );

    } catch (error) {

      console.error(error);

      alert(
        "Failed to delete coupon"
      );

    }
  };


  const changeStatus = async (
    id: string,
    current: boolean
  ) => {

    try {

      await toggleCoupon(
        id,
        !current
      );

      setCoupons(
        (old) =>
          old.map(
            (item) =>
              item.id === id
                ? {
                    ...item,
                    active: !current,
                  }
                : item
          )
      );

    } catch (error) {

      console.error(error);

      alert(
        "Failed to update coupon"
      );

    }
  };


  const formatExpiry = (
    value: any
  ) => {

    if (!value) {
      return "No expiry";
    }

    const date =
      value.toDate
        ? value.toDate()
        : new Date(value);

    if (
      isNaN(
        date.getTime()
      )
    ) {
      return "No expiry";
    }

    return date.toLocaleString(
      "en-IN"
    );
  };


  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">

      <div className="mx-auto max-w-6xl">

        <h1 className="text-4xl font-black text-yellow-400">
          Coupons
        </h1>

        <p className="mt-1 text-zinc-400">
          Create and manage discount coupons
        </p>


        {/* FORM */}

        <div className="mt-8 rounded-2xl bg-zinc-900 p-6">

          <h2 className="mb-5 text-xl font-bold">
            {editingId
              ? "Edit Coupon"
              : "Create Coupon"}
          </h2>


          <div className="grid gap-4 md:grid-cols-2">

            <input
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="Coupon Code e.g. NIGHT10"
              className="w-full rounded-xl bg-zinc-800 p-4 outline-none"
            />


            <input
              type="number"
              min="1"
              max="100"
              value={discount}
              onChange={(e) =>
                setDiscount(
                  e.target.value
                )
              }
              placeholder="Discount %"
              className="w-full rounded-xl bg-zinc-800 p-4 outline-none"
            />


            <input
              type="number"
              min="0"
              value={minOrder}
              onChange={(e) =>
                setMinOrder(
                  e.target.value
                )
              }
              placeholder="Minimum Order ₹"
              className="w-full rounded-xl bg-zinc-800 p-4 outline-none"
            />


            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) =>
                setExpiresAt(
                  e.target.value
                )
              }
              className="w-full rounded-xl bg-zinc-800 p-4 outline-none"
            />

          </div>


          <label className="mt-5 flex items-center gap-3">

            <input
              type="checkbox"
              checked={active}
              onChange={(e) =>
                setActive(
                  e.target.checked
                )
              }
              className="h-5 w-5"
            />

            <span>
              Coupon Active
            </span>

          </label>


          <div className="mt-6 flex gap-3">

            <button
              onClick={saveCoupon}
              disabled={saving}
              className="flex-1 rounded-xl bg-yellow-400 py-4 font-bold text-black disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Coupon"
                : "Create Coupon"}
            </button>


            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-xl bg-zinc-700 px-6 font-bold"
              >
                Cancel
              </button>
            )}

          </div>

        </div>


        {/* LIST */}

        <div className="mt-8 space-y-4">

          {loading ? (

            <div className="rounded-2xl bg-zinc-900 p-8 text-center text-zinc-500">
              Loading Coupons...
            </div>

          ) : coupons.length === 0 ? (

            <div className="rounded-2xl bg-zinc-900 p-8 text-center text-zinc-500">
              No Coupons Found
            </div>

          ) : (

            coupons.map(
              (coupon: any) => (

                <div
                  key={coupon.id}
                  className="rounded-2xl bg-zinc-900 p-5"
                >

                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div>

                      <div className="flex items-center gap-3">

                        <h2 className="text-2xl font-black text-yellow-400">
                          {coupon.code}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            coupon.active === false
                              ? "bg-red-600"
                              : "bg-green-600"
                          }`}
                        >
                          {coupon.active === false
                            ? "INACTIVE"
                            : "ACTIVE"}
                        </span>

                      </div>


                      <p className="mt-2 text-lg font-bold">
                        {coupon.discount}% OFF
                      </p>


                      <p className="mt-1 text-sm text-zinc-400">
                        Minimum Order: ₹
                        {coupon.minOrder || 0}
                      </p>


                      <p className="mt-1 text-sm text-zinc-500">
                        Expires:{" "}
                        {formatExpiry(
                          coupon.expiresAt
                        )}
                      </p>

                    </div>


                    <div className="flex flex-wrap gap-2">

                      <button
                        onClick={() =>
                          changeStatus(
                            coupon.id,
                            coupon.active !== false
                          )
                        }
                        className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-bold"
                      >
                        {coupon.active === false
                          ? "Activate"
                          : "Deactivate"}
                      </button>


                      <button
                        onClick={() =>
                          editCoupon(
                            coupon
                          )
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold"
                      >
                        Edit
                      </button>


                      <button
                        onClick={() =>
                          removeCoupon(
                            coupon.id
                          )
                        }
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              )
            )

          )}

        </div>

      </div>

    </main>
  );
}
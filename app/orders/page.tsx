"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import { useParams } from "next/navigation";

import {
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "../lib/firebase";

import {
  subscribeToOrder,
  cancelOrderByCustomer,
  requestProductReturn,
  requestProductExchange,
} from "../services/orderService";

type OrderItem = {
  id?: string;
  name?: string;
  image?: string;
  price?: number;
  quantity?: number;

  returnStatus?: string;
  returnReason?: string;
  returnDescription?: string;

  exchangeStatus?: string;
  exchangeReason?: string;
  exchangeDescription?: string;
};

type Order = {
  id: string;

  userId?: string;

  customer?: {
    uid?: string;
    userId?: string;
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    pincode?: string;
  };

  items?: OrderItem[];

  subtotal?: number;
  delivery?: number;
  deliveryCharge?: number;
  total?: number;

  payment?: string;
  paymentMethod?: string;

  status?: string;

  cancelledBy?: string;
  cancellationReason?: string;
  cancelledAt?: any;

  createdAt?: any;
};

export default function CustomerOrderDetailPage() {
  const params = useParams();

  const orderId = String(
    params?.id || ""
  );

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [notAllowed, setNotAllowed] =
    useState(false);

  const [showCancelModal, setShowCancelModal] =
    useState(false);

  const [cancelReason, setCancelReason] =
    useState("");

  const [customReason, setCustomReason] =
    useState("");

  const [cancelling, setCancelling] =
    useState(false);

  const [returnItem, setReturnItem] =
    useState<OrderItem | null>(null);

  const [returnReason, setReturnReason] =
    useState("");

  const [returnDescription, setReturnDescription] =
    useState("");

  const [exchangeItem, setExchangeItem] =
    useState<OrderItem | null>(null);

  const [exchangeReason, setExchangeReason] =
    useState("");

  const [exchangeDescription, setExchangeDescription] =
    useState("");

  const [requestLoading, setRequestLoading] =
    useState(false);

  // =====================================================
  // LOAD ORDER
  // =====================================================

  useEffect(() => {
    if (!orderId) {
      return;
    }

    let unsubscribeOrder:
      | (() => void)
      | null = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {
          if (!user) {
            setNotAllowed(true);
            setLoading(false);
            return;
          }

          setLoading(true);

          if (unsubscribeOrder) {
            unsubscribeOrder();
          }

          unsubscribeOrder =
            subscribeToOrder(
              orderId,
              (data: any) => {
                if (!data) {
                  setOrder(null);
                  setLoading(false);
                  return;
                }

                const loadedOrder =
                  data as Order;

                const owner =
                  loadedOrder.userId ||
                  loadedOrder.customer?.uid ||
                  loadedOrder.customer?.userId ||
                  "";

                if (
                  owner &&
                  owner !== user.uid
                ) {
                  setNotAllowed(true);
                  setLoading(false);
                  return;
                }

                setOrder(loadedOrder);
                setLoading(false);
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();

      if (unsubscribeOrder) {
        unsubscribeOrder();
      }
    };
  }, [orderId]);

  // =====================================================
  // CANCEL ORDER
  // =====================================================

  const handleCancelOrder =
    async () => {
      if (!order) return;

      if (!auth.currentUser) {
        alert("Please login again.");
        return;
      }

      const finalReason =
        cancelReason === "Other"
          ? customReason.trim()
          : cancelReason.trim();

      if (!finalReason) {
        alert(
          "Please select a cancellation reason."
        );
        return;
      }

      try {
        setCancelling(true);

        await cancelOrderByCustomer(
          order.id,
          finalReason,
          auth.currentUser.uid
        );

        setShowCancelModal(false);
        setCancelReason("");
        setCustomReason("");
      } catch (error: any) {
        console.error(
          "Cancellation error:",
          error
        );

        alert(
          error?.message ||
            "Order cancellation failed."
        );
      } finally {
        setCancelling(false);
      }
    };

  // =====================================================
  // RETURN PRODUCT
  // =====================================================

  const handleReturn =
    async () => {
      if (
        !order ||
        !returnItem?.id
      ) {
        return;
      }

      if (!returnReason) {
        alert(
          "Please select return reason."
        );
        return;
      }

      try {
        setRequestLoading(true);

        await requestProductReturn(
          order.id,
          String(returnItem.id),
          returnReason,
          returnDescription
        );

        alert(
          "Return request submitted successfully."
        );

        setReturnItem(null);
        setReturnReason("");
        setReturnDescription("");
      } catch (error: any) {
        console.error(
          "Return request error:",
          error
        );

        alert(
          error?.message ||
            "Return request failed."
        );
      } finally {
        setRequestLoading(false);
      }
    };

  // =====================================================
  // EXCHANGE PRODUCT
  // =====================================================

  const handleExchange =
    async () => {
      if (
        !order ||
        !exchangeItem?.id
      ) {
        return;
      }

      if (!exchangeReason) {
        alert(
          "Please select exchange reason."
        );
        return;
      }

      try {
        setRequestLoading(true);

        await requestProductExchange(
          order.id,
          String(exchangeItem.id),
          exchangeReason,
          exchangeDescription
        );

        alert(
          "Exchange request submitted successfully."
        );

        setExchangeItem(null);
        setExchangeReason("");
        setExchangeDescription("");
      } catch (error: any) {
        console.error(
          "Exchange request error:",
          error
        );

        alert(
          error?.message ||
            "Exchange request failed."
        );
      } finally {
        setRequestLoading(false);
      }
    };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-5">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">
            📦
          </div>

          <p className="mt-4 font-black">
            Loading order...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // LOGIN
  // =====================================================

  if (notAllowed) {
    return (
      <main className="min-h-screen bg-slate-50 p-5">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">
            🔐
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Login Required
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please login to view this order.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block rounded-2xl bg-yellow-400 px-6 py-3 font-black text-black"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-50 p-5">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">
            📦
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Order Not Found
          </h1>

          <Link
            href="/orders"
            className="mt-6 inline-block rounded-2xl bg-yellow-400 px-6 py-3 font-black text-black"
          >
            ← My Orders
          </Link>
        </div>
      </main>
    );
  }

  const status =
    order.status || "Pending";

  const customer =
    order.customer || {};

  const total = Number(
    order.total ??
      order.subtotal ??
      0
  );

  const delivery = Number(
    order.delivery ??
      order.deliveryCharge ??
      0
  );

  const itemCount =
    (order.items || []).reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 1
        ),
      0
    );

  const canCancel = [
    "Pending",
    "Confirmed",
    "Preparing",
  ].includes(status);

  const canReturnExchange =
    status === "Delivered";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 pb-24 text-slate-900">

      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <Link
            href="/orders"
            className="text-xs font-black text-slate-500"
          >
            ← My Orders
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                ORDER ID
              </p>

              <h1 className="mt-1 break-all text-xl font-black">
                #{order.id}
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                {formatDate(
                  order.createdAt
                )}
              </p>

            </div>

            <Status
              status={status}
            />

          </div>

        </section>

        {/* STATUS */}

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">

          <h2 className="text-lg font-black">
            Order Status
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">

            <StatusStep
              title="Pending"
              active={[
                "Pending",
                "Confirmed",
                "Preparing",
                "Packed",
                "Out for Delivery",
                "Delivered",
              ].includes(status)}
              icon="🟡"
            />

            <StatusStep
              title="Confirmed"
              active={[
                "Confirmed",
                "Preparing",
                "Packed",
                "Out for Delivery",
                "Delivered",
              ].includes(status)}
              icon="🔵"
            />

            <StatusStep
              title="Preparing"
              active={[
                "Preparing",
                "Packed",
                "Out for Delivery",
                "Delivered",
              ].includes(status)}
              icon="🟣"
            />

            <StatusStep
              title="Packed"
              active={[
                "Packed",
                "Out for Delivery",
                "Delivered",
              ].includes(status)}
              icon="📦"
            />

            <StatusStep
              title="Out for Delivery"
              active={[
                "Out for Delivery",
                "Delivered",
              ].includes(status)}
              icon="🚚"
            />

            <StatusStep
              title="Delivered"
              active={
                status === "Delivered"
              }
              icon="🟢"
            />

            {status === "Cancelled" && (
              <StatusStep
                title="Cancelled"
                active
                icon="🔴"
              />
            )}

          </div>

        </section>

        {/* CANCEL */}

        {canCancel && (
          <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">

            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">

              <p className="text-sm font-black text-red-700">
                Want to cancel this order?
              </p>

              <p className="mt-1 text-xs text-red-600">
                You can cancel before the order is dispatched.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowCancelModal(true)
                }
                className="mt-4 w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white"
              >
                ❌ Cancel Order
              </button>

            </div>

          </section>
        )}

        {/* DELIVERY TRACKING */}

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">

          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600">
            DELIVERY TRACKING
          </p>

          <h2 className="mt-1 text-lg font-black">

            {status === "Out for Delivery"
              ? "Your order is on the way 🚚"
              : status === "Delivered"
              ? "Order delivered successfully ✅"
              : status === "Cancelled"
              ? "Order cancelled"
              : status === "Confirmed"
              ? "Order accepted and being prepared"
              : "We are processing your order"}

          </h2>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">

            <p className="text-[10px] font-black uppercase text-slate-400">
              DELIVERY LOCATION
            </p>

            <p className="mt-2 text-sm font-black">
              📍{" "}
              {customer.address ||
                "Delivery address not available"}
            </p>

            {(customer.city ||
              customer.pincode) && (
              <p className="mt-1 text-xs text-slate-500">
                {customer.city}
                {customer.city &&
                customer.pincode
                  ? " - "
                  : ""}
                {customer.pincode}
              </p>
            )}

            {customer.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${customer.address}, ${
                    customer.city || ""
                  }, ${
                    customer.pincode || ""
                  }`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
              >
                📍 Open Delivery Location
              </a>
            )}

          </div>

          {status === "Out for Delivery" && (
            <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">

              <p className="text-sm font-black text-orange-700">
                🚚 Delivery partner is on the way
              </p>

              <p className="mt-1 text-xs text-orange-600">
                Your delivery address is shown above.
              </p>

            </div>
          )}

        </section>

        {/* DELIVERY DETAILS */}

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">

          <h2 className="text-lg font-black">
            Delivery Details
          </h2>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4">

            <p className="font-black">
              {customer.name ||
                "Customer"}
            </p>

            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="mt-2 inline-block text-sm font-bold text-blue-600"
              >
                📞 {customer.phone}
              </a>
            )}

            <p className="mt-3 text-sm font-bold">
              📍{" "}
              {customer.address ||
                "Address not available"}
            </p>

            {(customer.city ||
              customer.pincode) && (
              <p className="mt-1 text-xs text-slate-500">
                {customer.city}
                {customer.city &&
                customer.pincode
                  ? " - "
                  : ""}
                {customer.pincode}
              </p>
            )}

          </div>

        </section>

        {/* ITEMS */}

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <h2 className="text-lg font-black">
              Order Items
            </h2>

            <span className="text-xs font-bold text-slate-400">
              {itemCount} items
            </span>

          </div>

          <div className="mt-4 space-y-3">

            {(order.items || []).map(
              (
                item,
                index
              ) => {

                const quantity =
                  Number(
                    item.quantity || 1
                  );

                const price =
                  Number(
                    item.price || 0
                  );

                return (
                  <div
                    key={`${item.id || index}-${index}`}
                    className="rounded-2xl bg-slate-50 p-3"
                  >

                    <div className="flex items-center gap-3">

                      {item.image ? (
                        <img
                          src={item.image}
                          alt={
                            item.name ||
                            "Product"
                          }
                          className="h-16 w-16 shrink-0 rounded-xl bg-white object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-2xl">
                          📦
                        </div>
                      )}

                      <div className="min-w-0 flex-1">

                        <p className="font-black">
                          {item.name ||
                            "Product"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          ₹{price} ×{" "}
                          {quantity}
                        </p>

                      </div>

                      <p className="font-black">
                        ₹
                        {price *
                          quantity}
                      </p>

                    </div>

                    {/* RETURN / EXCHANGE */}

                    {canReturnExchange && (
                      <div className="mt-3">

                        <div className="flex gap-2">

                          {item.returnStatus !==
                            "Requested" &&
                            item.returnStatus !==
                              "Approved" &&
                            item.returnStatus !==
                              "Completed" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReturnItem(
                                    item
                                  );
                                  setReturnReason(
                                    ""
                                  );
                                  setReturnDescription(
                                    ""
                                  );
                                }}
                                className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-black text-red-600"
                              >
                                ↩️ Return
                              </button>
                            )}

                          {item.exchangeStatus !==
                            "Requested" &&
                            item.exchangeStatus !==
                              "Approved" &&
                            item.exchangeStatus !==
                              "Completed" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setExchangeItem(
                                    item
                                  );
                                  setExchangeReason(
                                    ""
                                  );
                                  setExchangeDescription(
                                    ""
                                  );
                                }}
                                className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-600"
                              >
                                🔄 Exchange
                              </button>
                            )}

                        </div>

                        {item.returnStatus && (
                          <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[10px] font-black text-red-600">
                            Return:{" "}
                            {item.returnStatus}
                          </p>
                        )}

                        {item.exchangeStatus && (
                          <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-black text-blue-600">
                            Exchange:{" "}
                            {item.exchangeStatus}
                          </p>
                        )}

                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* PAYMENT */}

        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">

          <h2 className="text-lg font-black">
            Payment Summary
          </h2>

          <div className="mt-4 space-y-3">

            <div className="flex justify-between text-sm">

              <span className="text-slate-500">
                Payment
              </span>

              <span className="font-black">
                {order.paymentMethod ||
                  order.payment ||
                  "COD"}
              </span>

            </div>

            <div className="flex justify-between text-sm">

              <span className="text-slate-500">
                Delivery
              </span>

              <span className="font-black">
                ₹{delivery}
              </span>

            </div>

            <div className="border-t border-slate-100 pt-3">

              <div className="flex justify-between">

                <span className="font-black">
                  Total
                </span>

                <span className="text-xl font-black text-green-600">
                  ₹{total}
                </span>

              </div>

            </div>

          </div>

        </section>

      </div>

      {/* =====================================================
          CANCEL MODAL
      ===================================================== */}

      {showCancelModal && (
        <Modal>

          <h2 className="text-xl font-black">
            Cancel Order
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Please select a reason.
          </p>

          <div className="mt-4 space-y-2">

            {[
              "Ordered by mistake",
              "Changed my mind",
              "Found a better price",
              "Delivery taking too long",
              "Wrong product ordered",
              "Payment issue",
              "Other",
            ].map(
              (reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() =>
                    setCancelReason(
                      reason
                    )
                  }
                  className={`w-full rounded-xl border p-3 text-left text-xs font-bold ${
                    cancelReason ===
                    reason
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-slate-200"
                  }`}
                >
                  {cancelReason ===
                  reason
                    ? "🔴 "
                    : "⚪ "}
                  {reason}
                </button>
              )
            )}

          </div>

          {cancelReason ===
            "Other" && (
            <textarea
              value={
                customReason
              }
              onChange={(e) =>
                setCustomReason(
                  e.target.value
                )
              }
              placeholder="Tell us your reason..."
              rows={3}
              className="mt-4 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none"
            />
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => {
                setShowCancelModal(
                  false
                );
                setCancelReason("");
                setCustomReason("");
              }}
              disabled={
                cancelling
              }
              className="rounded-xl border border-slate-200 py-3 text-xs font-black"
            >
              Keep Order
            </button>

            <button
              type="button"
              onClick={
                handleCancelOrder
              }
              disabled={
                cancelling ||
                !cancelReason ||
                (cancelReason ===
                  "Other" &&
                  !customReason.trim())
              }
              className="rounded-xl bg-red-600 py-3 text-xs font-black text-white disabled:opacity-40"
            >
              {cancelling
                ? "Cancelling..."
                : "Confirm"}
            </button>

          </div>

        </Modal>
      )}

      {/* =====================================================
          RETURN MODAL
      ===================================================== */}

      {returnItem && (
        <Modal>

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-xl font-black">
                Return Product
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {returnItem.name ||
                  "Product"}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setReturnItem(null)
              }
              className="h-8 w-8 rounded-full bg-slate-100 font-black"
            >
              ×
            </button>

          </div>

          <div className="mt-5 space-y-2">

            {[
              "Wrong product received",
              "Damaged product",
              "Missing item",
              "Quality issue",
              "Product not as expected",
              "Other",
            ].map(
              (reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() =>
                    setReturnReason(
                      reason
                    )
                  }
                  className={`w-full rounded-xl border p-3 text-left text-xs font-bold ${
                    returnReason ===
                    reason
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-slate-200"
                  }`}
                >
                  {returnReason ===
                  reason
                    ? "🔴 "
                    : "⚪ "}
                  {reason}
                </button>
              )
            )}

          </div>

          <textarea
            value={
              returnDescription
            }
            onChange={(e) =>
              setReturnDescription(
                e.target.value
              )
            }
            placeholder="Additional details (optional)"
            rows={3}
            className="mt-4 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => {
                setReturnItem(null);
                setReturnReason("");
                setReturnDescription("");
              }}
              className="rounded-xl border border-slate-200 py-3 text-xs font-black"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                requestLoading ||
                !returnReason
              }
              onClick={
                handleReturn
              }
              className="rounded-xl bg-red-600 py-3 text-xs font-black text-white disabled:opacity-40"
            >
              {requestLoading
                ? "Submitting..."
                : "Submit Return"}
            </button>

          </div>

        </Modal>
      )}

      {/* =====================================================
          EXCHANGE MODAL
      ===================================================== */}

      {exchangeItem && (
        <Modal>

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-xl font-black">
                Exchange Product
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {exchangeItem.name ||
                  "Product"}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setExchangeItem(null)
              }
              className="h-8 w-8 rounded-full bg-slate-100 font-black"
            >
              ×
            </button>

          </div>

          <div className="mt-5 space-y-2">

            {[
              "Wrong product received",
              "Damaged product",
              "Wrong size / variant",
              "Quality issue",
              "Product not as expected",
              "Other",
            ].map(
              (reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() =>
                    setExchangeReason(
                      reason
                    )
                  }
                  className={`w-full rounded-xl border p-3 text-left text-xs font-bold ${
                    exchangeReason ===
                    reason
                      ? "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-slate-200"
                  }`}
                >
                  {exchangeReason ===
                  reason
                    ? "🔵 "
                    : "⚪ "}
                  {reason}
                </button>
              )
            )}

          </div>

          <textarea
            value={
              exchangeDescription
            }
            onChange={(e) =>
              setExchangeDescription(
                e.target.value
              )
            }
            placeholder="Additional details (optional)"
            rows={3}
            className="mt-4 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => {
                setExchangeItem(null);
                setExchangeReason("");
                setExchangeDescription("");
              }}
              className="rounded-xl border border-slate-200 py-3 text-xs font-black"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                requestLoading ||
                !exchangeReason
              }
              onClick={
                handleExchange
              }
              className="rounded-xl bg-blue-600 py-3 text-xs font-black text-white disabled:opacity-40"
            >
              {requestLoading
                ? "Submitting..."
                : "Submit Exchange"}
            </button>

          </div>

        </Modal>
      )}

    </main>
  );
}

// =====================================================
// MODAL
// =====================================================

function Modal({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">

      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
        {children}
      </div>

    </div>
  );
}

// =====================================================
// STATUS
// =====================================================

function Status({
  status,
}: {
  status?: string;
}) {
  const value =
    status || "Pending";

  const config =
    getStatusConfig(value);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${config.className}`}
    >
      {config.icon}
      {value}
    </span>
  );
}

// =====================================================
// STATUS STEP
// =====================================================

function StatusStep({
  title,
  active,
  icon,
}: {
  title: string;
  active: boolean;
  icon: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        active
          ? "border-green-200 bg-green-50"
          : "border-slate-200 bg-slate-50 opacity-50"
      }`}
    >
      <div className="text-xl">
        {icon}
      </div>

      <p className="mt-1 text-xs font-black">
        {title}
      </p>

      <p
        className={`mt-1 text-[9px] font-bold ${
          active
            ? "text-green-600"
            : "text-slate-400"
        }`}
      >
        {active
          ? "Completed"
          : "Pending"}
      </p>
    </div>
  );
}

// =====================================================
// STATUS CONFIG
// =====================================================

function getStatusConfig(
  status: string
) {
  switch (status) {
    case "Pending":
      return {
        icon: "🟡",
        className:
          "border-yellow-300 bg-yellow-100 text-yellow-800",
      };

    case "Confirmed":
      return {
        icon: "🔵",
        className:
          "border-blue-300 bg-blue-100 text-blue-800",
      };

    case "Preparing":
      return {
        icon: "🟣",
        className:
          "border-purple-300 bg-purple-100 text-purple-800",
      };

    case "Packed":
      return {
        icon: "📦",
        className:
          "border-blue-300 bg-blue-100 text-blue-800",
      };

    case "Out for Delivery":
      return {
        icon: "🟠",
        className:
          "border-orange-300 bg-orange-100 text-orange-800",
      };

    case "Delivered":
      return {
        icon: "🟢",
        className:
          "border-green-300 bg-green-100 text-green-800",
      };

    case "Cancelled":
      return {
        icon: "🔴",
        className:
          "border-red-300 bg-red-100 text-red-800",
      };

    default:
      return {
        icon: "⚪",
        className:
          "border-slate-300 bg-slate-100 text-slate-700",
      };
  }
}

// =====================================================
// DATE
// =====================================================

function getTime(
  value: any
) {
  if (!value) {
    return 0;
  }

  if (
    typeof value?.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value?.toDate ===
    "function"
  ) {
    return value.toDate().getTime();
  }

  if (
    typeof value?.seconds ===
    "number"
  ) {
    return (
      value.seconds * 1000
    );
  }

  const time =
    new Date(value).getTime();

  return Number.isNaN(time)
    ? 0
    : time;
}

function formatDate(
  value: any
) {
  const time =
    getTime(value);

  if (!time) {
    return "-";
  }

  return new Date(
    time
  ).toLocaleString(
    "en-IN"
  );
}
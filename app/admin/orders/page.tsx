"use client";

import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";

import {
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from "../../services/orderService";

import { createTrackingLink } from "../../services/deliveryTrackingService";

import { db, auth } from "../../lib/firebase";

type Order = {
  id: string;

  name?: string;
  phone?: string;
  address?: string;

  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    pincode?: string;
  };

  items?: any[];

  subtotal?: number;
  delivery?: number;
  deliveryCharge?: number;
  total?: number;

  payment?: string;
  paymentMethod?: string;

  status?: string;

  isOfferOrder?: boolean;
  offerId?: string | null;
  offerType?: string | null;
  offerLabel?: string | null;
  offerTitle?: string | null;
  offerBuyQuantity?: number;
  offerFreeQuantity?: number;
  offerDescription?: string | null;

  createdAt?: any;
};

type AdminNotification = {
  id: string;

  audience?: string;
  type?: string;

  title?: string;
  message?: string;

  orderId?: string;
  userId?: string;

  customer?: any;

  read?: boolean;

  createdAt?: any;
};

const STATUSES = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Packed",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const ADMIN_EMAIL =
  "mahajanvicky04@gmail.com";

export default function AdminOrdersPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  // =====================================================
  // ADMIN NOTIFICATIONS
  // =====================================================

  const [
    notifications,
    setNotifications,
  ] =
    useState<AdminNotification[]>(
      []
    );

  const [
    showNotifications,
    setShowNotifications,
  ] =
    useState(false);

  const [
    notificationLoading,
    setNotificationLoading,
  ] =
    useState(true);

  // =====================================================
  // DELIVERY PARTNER TRACKING LINK
  // =====================================================

  const [trackingModalOrderId, setTrackingModalOrderId] =
    useState<string | null>(null);

  const [partnerNameInput, setPartnerNameInput] =
    useState("");

  const [partnerPhoneInput, setPartnerPhoneInput] =
    useState("");

  const [generatingLink, setGeneratingLink] =
    useState(false);

  const [generatedLink, setGeneratedLink] =
    useState("");

  const openTrackingModal = (orderId: string) => {
    setTrackingModalOrderId(orderId);
    setPartnerNameInput("");
    setPartnerPhoneInput("");
    setGeneratedLink("");
  };

  const closeTrackingModal = () => {
    setTrackingModalOrderId(null);
    setGeneratedLink("");
  };

  const handleGenerateLink = async (
    orderId: string,
    dropAddress?: string
  ) => {
    try {
      setGeneratingLink(true);

      const { url } = await createTrackingLink(orderId, {
        partnerName: partnerNameInput,
        partnerPhone: partnerPhoneInput,
        dropAddress,
      });

      setGeneratedLink(url);
    } catch (error) {
      console.error("Tracking link error:", error);
      alert("Tracking link generate nahi ho paya.");
    } finally {
      setGeneratingLink(false);
    }
  };

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  const loadOrders = async () => {
    try {
      setLoading(true);

      const data =
        await getOrders();

      const sorted =
        (data as Order[]).sort(
          (a, b) =>
            getTime(b.createdAt) -
            getTime(a.createdAt)
        );

      setOrders(sorted);
    } catch (error) {
      console.error(
        "Orders loading error:",
        error
      );

      alert(
        "Orders loading failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // =====================================================
  // REAL-TIME ADMIN NOTIFICATIONS
  // =====================================================

  useEffect(() => {
    const unsubscribeAuth =
      auth.onAuthStateChanged(
        (user) => {
          if (!user) {
            setNotifications([]);
            setNotificationLoading(false);
            return;
          }

          const email =
            user.email?.toLowerCase();

          if (
            email !==
            ADMIN_EMAIL.toLowerCase()
          ) {
            setNotifications([]);
            setNotificationLoading(false);
            return;
          }

          const notificationsQuery =
            query(
              collection(
                db,
                "notifications"
              ),
              where(
                "audience",
                "==",
                "admin"
              )
            );

          const unsubscribeNotifications =
            onSnapshot(
              notificationsQuery,
              (snapshot) => {
                const data =
                  snapshot.docs.map(
                    (item) => ({
                      id: item.id,
                      ...item.data(),
                    })
                  ) as AdminNotification[];

                data.sort(
                  (a, b) =>
                    getTime(
                      b.createdAt
                    ) -
                    getTime(
                      a.createdAt
                    )
                );

                setNotifications(
                  data.slice(0, 50)
                );

                setNotificationLoading(
                  false
                );
              },
              (error) => {
                console.error(
                  "Admin notifications error:",
                  error
                );

                setNotifications([]);
                setNotificationLoading(
                  false
                );
              }
            );

          return () => {
            unsubscribeNotifications();
          };
        }
      );

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // =====================================================
  // UNREAD COUNT
  // =====================================================

  const unreadCount =
    notifications.filter(
      (item) =>
        item.read !== true
    ).length;

  // =====================================================
  // MARK ONE NOTIFICATION READ
  // =====================================================

  const markNotificationRead =
    async (
      notificationId: string
    ) => {
      try {
        await updateDoc(
          doc(
            db,
            "notifications",
            notificationId
          ),
          {
            read: true,
          }
        );
      } catch (error) {
        console.error(
          "Notification read error:",
          error
        );
      }
    };

  // =====================================================
  // MARK ALL READ
  // =====================================================

  const markAllNotificationsRead =
    async () => {
      try {
        const unread =
          notifications.filter(
            (item) =>
              item.read !== true
          );

        await Promise.all(
          unread.map(
            (item) =>
              updateDoc(
                doc(
                  db,
                  "notifications",
                  item.id
                ),
                {
                  read: true,
                }
              )
          )
        );
      } catch (error) {
        console.error(
          "Mark all notifications error:",
          error
        );
      }
    };

  // =====================================================
  // OPEN NOTIFICATION
  // =====================================================

  const openNotification =
    async (
      notification: AdminNotification
    ) => {
      if (!notification.read) {
        await markNotificationRead(
          notification.id
        );
      }

      setShowNotifications(
        false
      );

      const orderId =
        notification.orderId;

      if (!orderId) {
        return;
      }

      const orderElement =
        document.getElementById(
          `order-${orderId}`
        );

      if (orderElement) {
        orderElement.scrollIntoView(
          {
            behavior: "smooth",
            block: "center",
          }
        );

        orderElement.classList.add(
          "ring-4",
          "ring-yellow-300"
        );

        setTimeout(() => {
          orderElement.classList.remove(
            "ring-4",
            "ring-yellow-300"
          );
        }, 2500);
      }
    };

  // =====================================================
  // CHANGE STATUS
  // =====================================================

  const changeStatus = async (
    id: string,
    status: string
  ) => {
    try {
      await updateOrderStatus(
        id,
        status
      );

      setOrders((current) =>
        current.map((order) =>
          order.id === id
            ? {
                ...order,
                status,
              }
            : order
        )
      );
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        "Status update failed"
      );
    }
  };

  // =====================================================
  // DELETE ORDER
  // =====================================================

  const removeOrder = async (
    id: string
  ) => {
    if (
      !window.confirm(
        "Delete this order?"
      )
    ) {
      return;
    }

    try {
      await deleteOrder(id);

      setOrders((current) =>
        current.filter(
          (order) =>
            order.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Order delete error:",
        error
      );

      alert(
        "Order delete failed"
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="relative rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-yellow-600">
                NIGHT NOW ADMIN
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Orders
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Customer, address, items aur order status.
              </p>
            </div>

            {/* =================================================
                NOTIFICATION BUTTON
            ================================================= */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setShowNotifications(
                    !showNotifications
                  )
                }
                className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl transition hover:bg-yellow-50"
              >
                🔔

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </button>

              {/* =================================================
                  NOTIFICATION DROPDOWN
              ================================================= */}

              {showNotifications && (
                <div className="absolute right-0 top-14 z-[100] w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

                  <div className="flex items-center justify-between border-b border-slate-100 p-4">

                    <div>
                      <h2 className="text-base font-black">
                        Notifications
                      </h2>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {unreadCount} unread
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={
                          markAllNotificationsRead
                        }
                        className="rounded-xl bg-yellow-400 px-3 py-2 text-[10px] font-black text-black"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">

                    {notificationLoading ? (
                      <div className="p-8 text-center">
                        <div className="text-3xl">
                          🔔
                        </div>

                        <p className="mt-2 text-xs font-bold text-slate-400">
                          Loading notifications...
                        </p>
                      </div>
                    ) : notifications.length ===
                      0 ? (
                      <div className="p-8 text-center">
                        <div className="text-4xl">
                          🔕
                        </div>

                        <p className="mt-3 text-sm font-black">
                          No notifications
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          New orders will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <button
                            key={
                              notification.id
                            }
                            type="button"
                            onClick={() =>
                              openNotification(
                                notification
                              )
                            }
                            className={`w-full border-b border-slate-100 p-4 text-left transition hover:bg-yellow-50 ${
                              notification.read
                                ? "bg-white"
                                : "bg-yellow-50/70"
                            }`}
                          >
                            <div className="flex gap-3">

                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                                  notification.type ===
                                  "order-cancelled"
                                    ? "bg-red-100"
                                    : "bg-yellow-100"
                                }`}
                              >
                                {notification.type ===
                                "order-cancelled"
                                  ? "❌"
                                  : "🔔"}
                              </div>

                              <div className="min-w-0 flex-1">

                                <div className="flex items-start justify-between gap-2">

                                  <p className="text-xs font-black">
                                    {notification.title ||
                                      "Admin Notification"}
                                  </p>

                                  {!notification.read && (
                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                                  )}

                                </div>

                                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                  {notification.message ||
                                    "New notification received."}
                                </p>

                                <p className="mt-2 text-[9px] font-bold text-slate-400">
                                  {formatDate(
                                    notification.createdAt
                                  )}
                                </p>

                              </div>
                            </div>
                          </button>
                        )
                      )
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            STATUS SUMMARY
        ================================================= */}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

          {STATUSES.map(
            (status) => {
              const count =
                orders.filter(
                  (order) =>
                    normalizeStatus(
                      order.status
                    ) === status
                ).length;

              return (
                <div
                  key={status}
                  className={`rounded-2xl border p-4 ${getStatusBoxClass(
                    status
                  )}`}
                >
                  <p className="text-[10px] font-black">
                    {status}
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {count}
                  </p>
                </div>
              );
            }
          )}

        </div>

        {/* =================================================
            ORDERS
        ================================================= */}

        {loading ? (
          <div className="mt-5 rounded-3xl bg-white py-20 text-center font-bold">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-white p-10 text-center">
            <div className="text-4xl">
              📦
            </div>

            <p className="mt-3 font-black">
              No orders found.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">

            {orders.map(
              (order) => {
                const customerName =
                  order.customer?.name ||
                  order.name ||
                  "Customer";

                const phone =
                  order.customer?.phone ||
                  order.phone ||
                  "";

                const address =
                  order.customer?.address ||
                  order.address ||
                  "";

                const city =
                  order.customer?.city ||
                  "";

                const pincode =
                  order.customer?.pincode ||
                  "";

                const status =
                  normalizeStatus(
                    order.status
                  );

                const total =
                  Number(
                    order.total ??
                      order.subtotal ??
                      0
                  );

                const payment =
                  order.paymentMethod ||
                  order.payment ||
                  "COD";

                const offerItem =
                  (
                    order.items || []
                  ).find(
                    (item: any) =>
                      Boolean(
                        item?.offerId ||
                        item?.offerType ||
                        item?.offerLabel
                      )
                  ) as any;

                const isOfferOrder =
                  Boolean(
                    order.isOfferOrder ||
                    order.offerId ||
                    order.offerType ||
                    order.offerLabel ||
                    offerItem
                  );

                const offerType =
                  order.offerType ||
                  offerItem?.offerType ||
                  "";

                const offerLabel =
                  order.offerLabel ||
                  offerItem?.offerLabel ||
                  "";

                const offerTitle =
                  order.offerTitle ||
                  offerItem?.offerTitle ||
                  offerItem?.offerName ||
                  "";

                const offerBuyQuantity =
                  Number(
                    order.offerBuyQuantity ??
                      offerItem?.offerBuyQuantity ??
                      0
                  );

                const offerFreeQuantity =
                  Number(
                    order.offerFreeQuantity ??
                      offerItem?.offerFreeQuantity ??
                      0
                  );

                return (
                  <div
                    key={order.id}
                    id={`order-${order.id}`}
                    className="rounded-3xl bg-white p-5 shadow-sm transition-all duration-500"
                  >

                    {/* TOP */}

                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

                      <div>

                        <p className="text-xs font-bold text-slate-400">
                          ORDER
                        </p>

                        <h2 className="mt-1 font-black">
                          #{order.id}
                        </h2>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            order.createdAt
                          )}
                        </p>

                        {isOfferOrder ? (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-2">

                            <span className="text-base">
                              🎁
                            </span>

                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-yellow-700">
                                OFFER ORDER
                              </p>

                              <p className="mt-0.5 text-xs font-black text-slate-900">
                                {offerLabel ||
                                  offerTitle ||
                                  "Special Offer"}
                              </p>
                            </div>

                          </div>
                        ) : (
                          <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                            NORMAL ORDER
                          </div>
                        )}

                      </div>

                      {/* STATUS */}

                      <select
                        value={status}
                        onChange={(event) =>
                          changeStatus(
                            order.id,
                            event.target.value
                          )
                        }
                        className={`h-11 rounded-xl border px-4 text-sm font-black outline-none ${getStatusSelectClass(
                          status
                        )}`}
                      >
                        {STATUSES.map(
                          (item) => (
                            <option
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          )
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          openTrackingModal(order.id)
                        }
                        className="mt-2 rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-black text-orange-700"
                      >
                        🚚 Assign Delivery Partner
                      </button>

                    </div>

                    {/* CUSTOMER + LOCATION */}

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">

                      {/* CUSTOMER */}

                      <div className="rounded-2xl bg-slate-50 p-4">

                        <p className="text-xs font-black text-slate-400">
                          CUSTOMER
                        </p>

                        <p className="mt-2 font-black">
                          {customerName}
                        </p>

                        {phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="mt-1 inline-block text-sm font-bold text-blue-600"
                          >
                            📞 {phone}
                          </a>
                        ) : (
                          <p className="mt-1 text-xs text-slate-400">
                            Phone not available
                          </p>
                        )}

                      </div>

                      {/* LOCATION */}

                      <div className="rounded-2xl bg-slate-50 p-4 lg:col-span-2">

                        <p className="text-xs font-black text-slate-400">
                          DELIVERY LOCATION
                        </p>

                        <p className="mt-2 text-sm font-bold">
                          📍{" "}
                          {address ||
                            "Address not available"}
                        </p>

                        {(city ||
                          pincode) && (
                          <p className="mt-1 text-sm text-slate-500">
                            {city}

                            {city &&
                            pincode
                              ? " - "
                              : ""}

                            {pincode}
                          </p>
                        )}

                        {address && (
                          <button
                            type="button"
                            onClick={() => {
                              const query =
                                `${address}, ${city}, ${pincode}`;

                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  query
                                )}`,
                                "_blank"
                              );
                            }}
                            className="mt-3 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
                          >
                            📍 Open Location
                          </button>
                        )}

                      </div>
                    </div>

                    {/* OFFER DETAILS */}

                    {isOfferOrder && (
                      <div className="mt-5 rounded-2xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4">

                        <div className="flex items-start gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-xl">
                            🎁
                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="text-[10px] font-black uppercase tracking-wider text-yellow-700">
                              OFFER DETAILS
                            </p>

                            <p className="mt-1 text-base font-black text-slate-900">
                              {offerTitle ||
                                offerLabel ||
                                "Special Offer"}
                            </p>

                            {offerLabel &&
                              offerTitle && (
                                <p className="mt-1 text-xs font-black text-yellow-700">
                                  {offerLabel}
                                </p>
                              )}

                            {offerType && (
                              <p className="mt-1 text-[10px] font-bold text-slate-500">
                                Type: {offerType}
                              </p>
                            )}

                            {(offerBuyQuantity >
                              0 ||
                              offerFreeQuantity >
                                0) && (
                              <div className="mt-3 flex flex-wrap gap-2">

                                {offerBuyQuantity >
                                  0 && (
                                  <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-black text-slate-700 shadow-sm">
                                    Buy{" "}
                                    {
                                      offerBuyQuantity
                                    }
                                  </span>
                                )}

                                {offerFreeQuantity >
                                  0 && (
                                  <span className="rounded-lg bg-green-100 px-2.5 py-1 text-[10px] font-black text-green-700">
                                    Free{" "}
                                    {
                                      offerFreeQuantity
                                    }
                                  </span>
                                )}

                              </div>
                            )}

                            {order.offerDescription && (
                              <p className="mt-3 text-xs leading-5 text-slate-600">
                                {
                                  order.offerDescription
                                }
                              </p>
                            )}

                          </div>
                        </div>
                      </div>
                    )}

                    {/* ITEMS */}

                    <div className="mt-5 rounded-2xl border border-slate-200 p-4">

                      <p className="text-xs font-black text-slate-400">
                        ORDER ITEMS
                      </p>

                      <div className="mt-3 space-y-2">

                        {(order.items || [])
                          .map(
                            (
                              item,
                              index
                            ) => {
                              const quantity =
                                Number(
                                  item?.quantity ||
                                    1
                                );

                              const price =
                                Number(
                                  item?.price ||
                                    0
                                );

                              return (
                                <div
                                  key={`${item?.id || index}-${index}`}
                                  className="flex justify-between gap-3 border-b border-slate-100 py-2 last:border-0"
                                >
                                  <span className="text-sm font-bold">
                                    {item?.name ||
                                      "Product"}{" "}
                                    ×{" "}
                                    {
                                      quantity
                                    }
                                  </span>

                                  <span className="font-black">
                                    ₹
                                    {price *
                                      quantity}
                                  </span>
                                </div>
                              );
                            }
                          )}

                        {(order.items ||
                          []).length ===
                          0 && (
                          <p className="py-3 text-sm text-slate-400">
                            No item details available.
                          </p>
                        )}

                      </div>
                    </div>

                    {/* TOTAL */}

                    <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                      <div>
                        <p className="text-xs text-slate-400">
                          PAYMENT
                        </p>

                        <p className="font-black">
                          {payment}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">

                        <p className="text-xs text-slate-400">
                          TOTAL
                        </p>

                        <p className="text-2xl font-black text-green-600">
                          ₹{total}
                        </p>

                      </div>

                    </div>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        removeOrder(
                          order.id
                        )
                      }
                      className="mt-5 rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-600 hover:bg-red-100"
                    >
                      🗑️ Delete Order
                    </button>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* DELIVERY PARTNER TRACKING MODAL */}

      {trackingModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <p className="text-lg font-black">
              🚚 Assign Delivery Partner
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Order #{trackingModalOrderId}
            </p>

            {!generatedLink ? (
              <>
                <input
                  value={partnerNameInput}
                  onChange={(e) =>
                    setPartnerNameInput(e.target.value)
                  }
                  placeholder="Partner Name"
                  className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none"
                />

                <input
                  value={partnerPhoneInput}
                  onChange={(e) =>
                    setPartnerPhoneInput(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Partner Phone"
                  inputMode="numeric"
                  className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none"
                />

                <button
                  type="button"
                  disabled={generatingLink}
                  onClick={() =>
                    handleGenerateLink(trackingModalOrderId)
                  }
                  className="mt-4 w-full rounded-xl bg-yellow-400 py-3 text-sm font-black text-black disabled:opacity-60"
                >
                  {generatingLink
                    ? "Generating..."
                    : "Generate Tracking Link"}
                </button>
              </>
            ) : (
              <>
                <p className="mt-4 text-xs font-bold text-slate-500">
                  Yeh link partner ko bhejo (WhatsApp/SMS):
                </p>

                <div className="mt-2 break-all rounded-xl bg-slate-50 p-3 text-xs">
                  {generatedLink}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard?.writeText(
                        generatedLink
                      )
                    }
                    className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-black text-white"
                  >
                    📋 Copy Link
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `NightNow delivery link: ${generatedLink}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-xl bg-green-500 py-2.5 text-center text-xs font-black text-white"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={closeTrackingModal}
              className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-black text-slate-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* =====================================================
   STATUS NORMALIZE
===================================================== */

function normalizeStatus(
  status?: string
) {
  if (!status) {
    return "Pending";
  }

  const allowedStatuses = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Packed",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];

  return allowedStatuses.includes(
    status
  )
    ? status
    : "Pending";
}

/* =====================================================
   DATE
===================================================== */

function getTime(value: any) {
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
    return value.seconds * 1000;
  }

  const time =
    new Date(value).getTime();

  return Number.isNaN(time)
    ? 0
    : time;
}

function formatDate(value: any) {
  const time =
    getTime(value);

  if (!time) {
    return "-";
  }

  return new Date(
    time
  ).toLocaleString("en-IN");
}

/* =====================================================
   STATUS COLORS
===================================================== */

function getStatusBoxClass(
  status: string
) {
  if (status === "Pending") {
    return "border-yellow-200 bg-yellow-50 text-yellow-800";
  }

  if (status === "Confirmed") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (status === "Preparing") {
    return "border-purple-200 bg-purple-50 text-purple-800";
  }

  if (status === "Packed") {
    return "border-indigo-200 bg-indigo-50 text-indigo-800";
  }

  if (
    status ===
    "Out for Delivery"
  ) {
    return "border-orange-200 bg-orange-50 text-orange-800";
  }

  if (status === "Delivered") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (status === "Cancelled") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-800";
}

function getStatusSelectClass(
  status: string
) {
  if (status === "Pending") {
    return "border-yellow-300 bg-yellow-100 text-yellow-800";
  }

  if (status === "Confirmed") {
    return "border-blue-300 bg-blue-100 text-blue-800";
  }

  if (status === "Preparing") {
    return "border-purple-300 bg-purple-100 text-purple-800";
  }

  if (status === "Packed") {
    return "border-indigo-300 bg-indigo-100 text-indigo-800";
  }

  if (
    status ===
    "Out for Delivery"
  ) {
    return "border-orange-300 bg-orange-100 text-orange-800";
  }

  if (status === "Delivered") {
    return "border-green-300 bg-green-100 text-green-800";
  }

  if (status === "Cancelled") {
    return "border-red-300 bg-red-100 text-red-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-800";
}
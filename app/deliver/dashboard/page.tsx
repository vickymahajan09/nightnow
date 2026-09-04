"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  subscribeToDeliveryPartnerAuth,
  subscribeToAvailableOrders,
  subscribeToMyCurrentOrder,
  subscribeToMyEarnings,
  acceptOrder,
  markOrderPickedUp,
  completeDelivery,
  logoutDeliveryPartner,
  type DeliveryPartnerProfile,
  type EarningEntry,
} from "../../services/deliveryPartnerService";

import {
  startSharingLocation,
  stopSharingLocation,
  type PartnerLocation,
} from "../../services/deliveryTrackingService";

import { getStoreSettings, type StoreSettings } from "../../services/settingsService";
import { registerPushToken } from "../../services/pushNotificationService";

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function DeliveryPartnerDashboard() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [partner, setPartner] = useState<DeliveryPartnerProfile | null>(null);

  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [currentOrder, setCurrentOrder] = useState<any | null>(null);
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [store, setStore] = useState<StoreSettings>({});

  const [accepting, setAccepting] = useState<string | null>(null);
  const [pickingUp, setPickingUp] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const [sharing, setSharing] = useState(false);
  const [lastLocation, setLastLocation] = useState<PartnerLocation | null>(null);
  const [stopFn, setStopFn] = useState<(() => void) | null>(null);

  const [notifyOn, setNotifyOn] = useState(false);

  // AUTH GUARD
  useEffect(() => {
    const unsubscribe = subscribeToDeliveryPartnerAuth((profile) => {
      setPartner(profile);
      setCheckingAuth(false);

      if (!profile) router.replace("/deliver/login");
    });

    return () => unsubscribe();
  }, [router]);

  // SHOP ADDRESS (pickup point)
  useEffect(() => {
    getStoreSettings().then(setStore).catch(() => setStore({}));
  }, []);

  // AVAILABLE ORDERS
  useEffect(() => {
    if (!partner) return;
    const unsubscribe = subscribeToAvailableOrders(setAvailableOrders);
    return () => unsubscribe();
  }, [partner]);

  // MY CURRENT JOB
  useEffect(() => {
    if (!partner) return;

    const unsubscribe = subscribeToMyCurrentOrder(partner.uid, (order) => {
      setCurrentOrder(order);

      if (!order && stopFn) {
        stopFn();
        setStopFn(null);
        setSharing(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner]);

  // MY EARNINGS
  useEffect(() => {
    if (!partner) return;
    const unsubscribe = subscribeToMyEarnings(partner.uid, setEarnings);
    return () => unsubscribe();
  }, [partner]);

  // Whether notifications are already granted for this device.
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setNotifyOn(Notification.permission === "granted");
  }, []);

  // Once the rider is out for delivery, live GPS should just be on -
  // no extra button to forget about.
  useEffect(() => {
    if (!currentOrder || currentOrder.status !== "Out for Delivery") return;
    if (sharing || stopFn) return;

    const stop = startSharingLocation(
      currentOrder.id,
      (loc) => {
        setLastLocation(loc);
        setSharing(true);
      },
      (message) => {
        setError(message);
        setSharing(false);
      }
    );

    setStopFn(() => stop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrder?.id, currentOrder?.status]);

  const todayEarning = useMemo(() => {
    const today = new Date().toDateString();
    return earnings
      .filter((e) => toDate(e.createdAt)?.toDateString() === today)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [earnings]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return earnings.filter(
      (e) => toDate(e.createdAt)?.toDateString() === today
    ).length;
  }, [earnings]);

  const isReadyForPickup = currentOrder?.status === "Packed";
  const isOutForDelivery = currentOrder?.status === "Out for Delivery";

  const shopMapsUrl = store.location
    ? `https://www.google.com/maps/search/?api=1&query=${store.location.lat},${store.location.lng}`
    : store.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        store.address
      )}`
    : null;

  const handleEnableNotifications = async () => {
    if (!partner) return;
    const token = await registerPushToken(partner.uid, "partner");

    if (token) {
      setNotifyOn(true);
      setFlash("Notifications on. Naye order ka alert aayega.");
      setTimeout(() => setFlash(""), 4000);
    } else {
      setError(
        "Notification permission nahi mili. Browser settings me Notifications allow karo."
      );
    }
  };

  const handleAccept = async (orderId: string) => {
    if (!partner) return;
    setError("");
    setAccepting(orderId);

    try {
      await acceptOrder(orderId, partner);
    } catch (err: any) {
      setError(err?.message || "Order accept nahi ho paya.");
    } finally {
      setAccepting(null);
    }
  };

  const handlePickedUp = async () => {
    if (!currentOrder || !partner) return;
    setError("");
    setPickingUp(true);

    try {
      await markOrderPickedUp(currentOrder.id, partner);
    } catch (err: any) {
      setError(err?.message || "Update fail ho gaya.");
    } finally {
      setPickingUp(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!currentOrder) return;
    setDelivering(true);
    setError("");

    try {
      stopFn?.();
      setStopFn(null);
      setSharing(false);

      await stopSharingLocation(currentOrder.id).catch(() => null);

      const { earning } = await completeDelivery(currentOrder.id);

      setFlash(`Delivered. Rs ${earning} tumhari earning me add ho gaya.`);
      setTimeout(() => setFlash(""), 5000);
    } catch (err: any) {
      setError(err?.message || "Update fail ho gaya.");
    } finally {
      setDelivering(false);
    }
  };

  const handleLogout = async () => {
    stopFn?.();
    await logoutDeliveryPartner();
    router.replace("/deliver/login");
  };

  if (checkingAuth || !partner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <p className="text-sm font-semibold text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 pb-16 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl">🌙🛵</p>
            <h1 className="mt-1 text-lg font-black">
              Hi, {partner.name.split(" ")[0]}
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-black text-zinc-300"
          >
            Logout
          </button>
        </div>

        {/* =================================================
            EARNINGS
        ================================================= */}

        <section className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-yellow-800/40 bg-yellow-950/20 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-yellow-500">
              Aaj ki kamai
            </p>
            <p className="mt-1 text-xl font-black text-yellow-400">
              ₹{Math.round(todayEarning)}
            </p>
            <p className="text-[10px] text-zinc-500">
              {todayCount} {todayCount === 1 ? "delivery" : "deliveries"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              Pending payout
            </p>
            <p className="mt-1 text-xl font-black">
              ₹{Math.round(Number(partner.unpaidEarnings || 0))}
            </p>
            <p className="text-[10px] text-zinc-500">shop se lena hai</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              Total
            </p>
            <p className="mt-1 text-xl font-black">
              ₹{Math.round(Number(partner.totalEarnings || 0))}
            </p>
            <p className="text-[10px] text-zinc-500">
              {Number(partner.totalDeliveries || 0)} deliveries
            </p>
          </div>
        </section>

        {!notifyOn && (
          <button
            onClick={handleEnableNotifications}
            className="mt-3 w-full rounded-2xl border border-yellow-700/50 bg-yellow-950/30 p-3 text-left"
          >
            <p className="text-xs font-black text-yellow-400">
              🔔 Notifications chalu karo
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Bina iske naya order aane par alert nahi milega. Tap karke
              allow kar do.
            </p>
          </button>
        )}

        {flash && (
          <p className="mt-4 rounded-xl bg-green-950 p-3 text-xs font-semibold text-green-300">
            ✅ {flash}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-950 p-3 text-xs font-semibold text-red-300">
            ⚠️ {error}
          </p>
        )}

        {/* =================================================
            CURRENT JOB
        ================================================= */}

        {currentOrder ? (
          <section className="mt-5 rounded-3xl border border-yellow-800/50 bg-yellow-950/20 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
              {isOutForDelivery ? "Step 2 — Customer ke paas jao" : "Step 1 — Shop jao"}
            </p>

            <h2 className="mt-1 text-lg font-black">
              Order #{currentOrder.id.slice(0, 8)}
            </h2>

            {!isOutForDelivery ? (
              <>
                {/* ---------- PHASE A: GO TO SHOP ---------- */}
                <p className="mt-2 text-sm text-zinc-300">
                  🏪 {store.address || "Shop address admin settings me set nahi hai"}
                </p>

                {shopMapsUrl && (
                  <a
                    href={shopMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block w-full rounded-xl bg-zinc-800 py-2.5 text-center text-xs font-black text-white"
                  >
                    🗺️ Shop tak ka rasta
                  </a>
                )}

                <div className="mt-4 rounded-2xl bg-zinc-900 p-4">
                  {isReadyForPickup ? (
                    <p className="text-xs font-black text-green-400">
                      ✅ Order pack ho gaya hai — counter se uthao.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs font-black text-yellow-400">
                        ⏳ Abhi pack ho raha hai ({currentOrder.status})
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        Tum shop ke liye nikal jao — pahunchne tak pack ho
                        chuka hoga. Pack hote hi ye button chalu ho jayega.
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={handlePickedUp}
                  disabled={!isReadyForPickup || pickingUp}
                  className="mt-4 w-full rounded-xl bg-yellow-400 py-3 text-sm font-black text-black disabled:bg-zinc-800 disabled:text-zinc-500"
                >
                  {pickingUp
                    ? "Updating..."
                    : isReadyForPickup
                    ? "📦 Maine order utha liya"
                    : "📦 Pack hone ka wait karo"}
                </button>
              </>
            ) : (
              <>
                {/* ---------- PHASE B: DELIVER ---------- */}
                <p className="mt-2 text-sm text-zinc-300">
                  📍 {currentOrder.customer?.address || "Address not available"}
                  {currentOrder.customer?.city ? `, ${currentOrder.customer.city}` : ""}
                  {currentOrder.customer?.pincode
                    ? ` - ${currentOrder.customer.pincode}`
                    : ""}
                </p>

                {currentOrder.customer?.phone && (
                  <a
                    href={`tel:${currentOrder.customer.phone}`}
                    className="mt-2 inline-block text-xs font-black text-yellow-400"
                  >
                    📞 {currentOrder.customer.phone}
                  </a>
                )}

                {currentOrder.customer?.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${currentOrder.customer.address}, ${
                        currentOrder.customer.city || ""
                      }, ${currentOrder.customer.pincode || ""}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block w-full rounded-xl bg-zinc-800 py-2.5 text-center text-xs font-black text-white"
                  >
                    🗺️ Customer tak ka rasta
                  </a>
                )}

                <div className="mt-4 rounded-2xl bg-zinc-900 p-4">
                  {sharing ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                        </span>
                        <p className="text-sm font-black text-green-400">
                          Live location customer ko dikh rahi hai
                        </p>
                      </div>

                      {lastLocation && (
                        <p className="mt-2 text-xs text-zinc-500">
                          {lastLocation.lat.toFixed(5)}, {lastLocation.lng.toFixed(5)}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-zinc-400">
                      📡 Location start ho rahi hai... agar na chale toh
                      browser me Location permission allow karo.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleMarkDelivered}
                  disabled={delivering}
                  className="mt-4 w-full rounded-xl bg-green-500 py-3 text-sm font-black text-black disabled:opacity-50"
                >
                  {delivering ? "Updating..." : "✅ Deliver ho gaya"}
                </button>
              </>
            )}
          </section>
        ) : (
          <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900 p-5 text-center">
            <p className="text-3xl">📭</p>
            <p className="mt-2 text-sm font-black">
              Abhi koi delivery assign nahi hai
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Neeche available orders me se koi order accept karo.
            </p>
          </section>
        )}

        {/* =================================================
            AVAILABLE ORDERS
        ================================================= */}

        {!currentOrder && (
          <section className="mt-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Naye orders ({availableOrders.length})
            </p>

            <div className="mt-3 space-y-3">
              {availableOrders.length === 0 && (
                <p className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
                  Abhi koi naya order nahi hai. Order aate hi yahan dikhega
                  aur notification bhi aayega.
                </p>
              )}

              {availableOrders.map((order) => {
                const itemCount = (order.items || []).reduce(
                  (sum: number, item: any) => sum + Number(item.quantity || 1),
                  0
                );

                const placedAt = toDate(order.createdAt);
                const minsAgo = placedAt
                  ? Math.max(
                      0,
                      Math.round((Date.now() - placedAt.getTime()) / 60000)
                    )
                  : null;

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {itemCount} {itemCount === 1 ? "item" : "items"} • ₹
                          {Number(order.total ?? order.subtotal ?? 0)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          📍 {order.customer?.city || "Area not set"}
                        </p>
                        <p className="mt-1 text-[10px] font-bold text-yellow-500">
                          {order.status}
                          {minsAgo !== null ? ` • ${minsAgo} min pehle` : ""}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAccept(order.id)}
                        disabled={accepting === order.id}
                        className="shrink-0 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-black text-black disabled:opacity-50"
                      >
                        {accepting === order.id ? "..." : "Accept"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* =================================================
            RECENT EARNINGS
        ================================================= */}

        {earnings.length > 0 && (
          <section className="mt-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Recent deliveries
            </p>

            <div className="mt-3 divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              {earnings.slice(0, 10).map((entry) => {
                const when = toDate(entry.createdAt);

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-xs font-black">
                        #{entry.orderId.slice(0, 8)}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {when
                          ? when.toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : ""}
                        {entry.nightBonus ? " • night bonus" : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-yellow-400">
                        +₹{Math.round(Number(entry.amount || 0))}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {entry.paid ? "paid" : "pending"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

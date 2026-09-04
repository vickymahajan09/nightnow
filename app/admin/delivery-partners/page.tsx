"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../lib/firebase";
import AdminGuard from "../AdminGuard";

type Partner = {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  active?: boolean;
  currentOrderId?: string | null;
  totalEarnings?: number;
  unpaidEarnings?: number;
  totalDeliveries?: number;
};

type PayoutRules = {
  perOrder: number;
  perKm: number;
  nightBonus: number;
  nightStartHour: number;
  nightEndHour: number;
};

const DEFAULT_PAYOUT: PayoutRules = {
  perOrder: 20,
  perKm: 0,
  nightBonus: 10,
  nightStartHour: 22,
  nightEndHour: 6,
};

function DeliveryPartnersInner() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [payout, setPayout] = useState<PayoutRules>(DEFAULT_PAYOUT);
  const [savingPayout, setSavingPayout] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Live partner list - earnings update on screen as riders deliver.
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "deliveryPartners"),
      (snapshot) => {
        setPartners(
          snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        );
        setLoading(false);
      },
      (err: any) => {
        console.error("Partners load error:", err);

        // A generic message hides which of the two very different
        // problems this is, so surface the Firebase code.
        const code = err?.code || "";

        if (code === "permission-denied") {
          setError(
            "Permission denied - Firebase Console me nayi firestore.rules publish karni hai."
          );
        } else if (code === "unavailable") {
          setError(
            "Firestore tak connection nahi bana. Internet / antivirus HTTPS scanning check karo."
          );
        } else {
          setError(
            `Delivery partners load nahi ho paye${code ? ` (${code})` : ""}.`
          );
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getDoc(doc(db, "settings", "store"))
      .then((snap) => {
        const saved = snap.exists() ? (snap.data() as any)?.riderPayout : null;
        if (saved) setPayout({ ...DEFAULT_PAYOUT, ...saved });
      })
      .catch(() => null);
  }, []);

  const totals = useMemo(
    () => ({
      unpaid: partners.reduce(
        (sum, p) => sum + Number(p.unpaidEarnings || 0),
        0
      ),
      deliveries: partners.reduce(
        (sum, p) => sum + Number(p.totalDeliveries || 0),
        0
      ),
      active: partners.filter((p) => p.active !== false).length,
    }),
    [partners]
  );

  const handleSavePayout = async () => {
    setSavingPayout(true);
    setError("");
    setMessage("");

    try {
      await setDoc(
        doc(db, "settings", "store"),
        { riderPayout: payout, updatedAt: new Date() },
        { merge: true }
      );
      setMessage("Payout rules save ho gaye.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Save fail ho gaya.");
    } finally {
      setSavingPayout(false);
    }
  };

  const handleToggleActive = async (partner: Partner) => {
    try {
      await updateDoc(doc(db, "deliveryPartners", partner.id), {
        active: partner.active === false,
      });
    } catch (err: any) {
      setError(err?.message || "Update fail ho gaya.");
    }
  };

  // Settles everything owed to one rider: marks each unpaid earning
  // entry as paid and zeroes their pending balance.
  const handleMarkPaid = async (partner: Partner) => {
    const amount = Math.round(Number(partner.unpaidEarnings || 0));

    if (amount <= 0) return;

    if (
      !confirm(
        `${partner.name || "Rider"} ko \u20b9${amount} de diye? Ye pending balance zero kar dega.`
      )
    ) {
      return;
    }

    setPayingId(partner.id);
    setError("");

    try {
      const unpaidSnap = await getDocs(
        query(
          collection(db, "deliveryPartners", partner.id, "earnings"),
          where("paid", "==", false)
        )
      );

      const batch = writeBatch(db);

      unpaidSnap.docs.forEach((entry) => {
        batch.update(entry.ref, { paid: true, paidAt: new Date() });
      });

      batch.update(doc(db, "deliveryPartners", partner.id), {
        unpaidEarnings: 0,
        lastPaidAt: new Date(),
      });

      await batch.commit();

      setMessage(`\u20b9${amount} paid mark ho gaya.`);
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      setError(err?.message || "Payment update fail ho gaya.");
    } finally {
      setPayingId(null);
    }
  };

  const numberField = (
    label: string,
    hint: string,
    key: keyof PayoutRules
  ) => (
    <div>
      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <input
        type="number"
        value={payout[key]}
        onChange={(e) =>
          setPayout({ ...payout, [key]: Number(e.target.value) })
        }
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-amber-500"
      />
      <p className="mt-1 text-[10px] text-slate-500">{hint}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-xs font-black text-amber-600">
          ← Back to Dashboard
        </Link>

        <h1 className="mt-3 text-2xl font-black">🛵 Delivery Partners</h1>
        <p className="mt-1 text-sm text-slate-500">
          Riders, unki earnings aur payout rules.
        </p>

        {message && (
          <p className="mt-4 rounded-xl bg-green-50 p-3 text-xs font-semibold text-green-700">
            ✅ {message}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
            ⚠️ {error}
          </p>
        )}

        {/* SUMMARY */}
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Active riders
            </p>
            <p className="mt-1 text-2xl font-black">{totals.active}</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
              Total dena baaki
            </p>
            <p className="mt-1 text-2xl font-black text-amber-600">
              ₹{Math.round(totals.unpaid)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Total deliveries
            </p>
            <p className="mt-1 text-2xl font-black">{totals.deliveries}</p>
          </div>
        </section>

        {/* PAYOUT RULES */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Rider payout rules</h2>
          <p className="mt-1 text-xs text-slate-500">
            Har delivery complete hone par ye rules se earning calculate
            hoti hai. Calculation server pe hoti hai, isliye rider apni
            earning nahi badal sakta.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {numberField(
              "Per order (₹)",
              "Har delivery ka base amount",
              "perOrder"
            )}
            {numberField(
              "Per km (₹)",
              "Shop se customer ki doori ka extra. 0 rakho toh band.",
              "perKm"
            )}
            {numberField(
              "Night bonus (₹)",
              "Raat ki delivery pe extra",
              "nightBonus"
            )}
            {numberField(
              "Night start (hour)",
              "24-hour format, jaise 22 = raat 10 baje",
              "nightStartHour"
            )}
            {numberField(
              "Night end (hour)",
              "Jaise 6 = subah 6 baje",
              "nightEndHour"
            )}
          </div>

          <button
            onClick={handleSavePayout}
            disabled={savingPayout}
            className="mt-5 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-black disabled:opacity-50"
          >
            {savingPayout ? "Saving..." : "Save payout rules"}
          </button>
        </section>

        {/* PARTNER LIST */}
        <section className="mt-6">
          <h2 className="text-lg font-black">Riders ({partners.length})</h2>

          {loading ? (
            <p className="mt-3 text-sm text-slate-500">Loading...</p>
          ) : partners.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Abhi koi rider register nahi hua. Unhe{" "}
              <span className="font-black text-amber-600">
                /deliver/register
              </span>{" "}
              ka link bhejo.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-black">
                          {partner.name || "Unnamed"}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                            partner.active === false
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {partner.active === false ? "BLOCKED" : "ACTIVE"}
                        </span>
                        {partner.currentOrderId && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700">
                            ON DELIVERY
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        📞 {partner.phone || "-"} · {partner.email || "-"}
                      </p>

                      <p className="mt-2 text-xs text-slate-600">
                        {Number(partner.totalDeliveries || 0)} deliveries ·
                        total earned ₹
                        {Math.round(Number(partner.totalEarnings || 0))}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                        Dena baaki
                      </p>
                      <p className="text-2xl font-black text-amber-600">
                        ₹{Math.round(Number(partner.unpaidEarnings || 0))}
                      </p>

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleMarkPaid(partner)}
                          disabled={
                            payingId === partner.id ||
                            Number(partner.unpaidEarnings || 0) <= 0
                          }
                          className="rounded-xl bg-green-500 px-3 py-2 text-[11px] font-black text-black disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          {payingId === partner.id ? "..." : "Paid kar diya"}
                        </button>

                        <button
                          onClick={() => handleToggleActive(partner)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-[11px] font-black text-slate-700"
                        >
                          {partner.active === false ? "Unblock" : "Block"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function DeliveryPartnersPage() {
  return (
    <AdminGuard>
      <DeliveryPartnersInner />
    </AdminGuard>
  );
}

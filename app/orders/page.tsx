"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { subscribeToOrders } from "../services/orderService";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type OrderItem = {
  id?: string;
  name?: string;
  image?: string;
  price?: number;
  quantity?: number;
};

type Order = {
  id: string;
  userId?: string;

  customer?: {
    uid?: string;
    userId?: string;
    name?: string;
  };

  items?: OrderItem[];

  total?: number;
  subtotal?: number;

  status?: string;
  createdAt?: any;
};

type FilterType =
  | "All"
  | "Pending"
  | "Active"
  | "Completed"
  | "Cancelled";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<FilterType>("All");

  useEffect(() => {
    let unsubscribeOrders: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setLoggedIn(false);
          setOrders([]);
          setLoading(false);

          if (unsubscribeOrders) {
            unsubscribeOrders();
            unsubscribeOrders = null;
          }

          return;
        }

        setLoggedIn(true);
        setLoading(true);

        if (unsubscribeOrders) {
          unsubscribeOrders();
        }

        unsubscribeOrders = subscribeToOrders(
          (data) => {
            const ownOrders = data.filter(
              (order) =>
                order.userId === user.uid ||
                order.customer?.uid === user.uid ||
                order.customer?.userId === user.uid
            );

            setOrders(ownOrders);
            setLoading(false);
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();

      if (unsubscribeOrders) {
        unsubscribeOrders();
      }
    };
  }, []);

  // =====================================================
  // FILTER + SEARCH
  // =====================================================

  const filteredOrders = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const status = order.status || "Pending";

      // -----------------------------------------------
      // STATUS FILTER
      // -----------------------------------------------

      let matchesFilter = true;

      if (filter === "Pending") {
        matchesFilter =
          status === "Pending";
      }

      if (filter === "Active") {
        matchesFilter = [
          "Confirmed",
          "Packed",
          "Preparing",
          "Out for Delivery",
        ].includes(status);
      }

      if (filter === "Completed") {
        matchesFilter =
          status === "Delivered";
      }

      if (filter === "Cancelled") {
        matchesFilter =
          status === "Cancelled";
      }

      if (!matchesFilter) {
        return false;
      }

      // -----------------------------------------------
      // SEARCH
      // -----------------------------------------------

      if (!searchText) {
        return true;
      }

      const productNames =
        (order.items || [])
          .map(
            (item) =>
              item.name || ""
          )
          .join(" ")
          .toLowerCase();

      const orderId =
        order.id.toLowerCase();

      return (
        productNames.includes(
          searchText
        ) ||
        orderId.includes(
          searchText
        )
      );
    });
  }, [orders, filter, search]);

  // =====================================================
  // COUNTS
  // =====================================================

  const counts = useMemo(() => {
    return {
      all: orders.length,

      pending: orders.filter(
        (order) =>
          (order.status || "Pending") ===
          "Pending"
      ).length,

      active: orders.filter(
        (order) =>
          [
            "Confirmed",
            "Packed",
            "Preparing",
            "Out for Delivery",
          ].includes(
            order.status || ""
          )
      ).length,

      completed: orders.filter(
        (order) =>
          order.status ===
          "Delivered"
      ).length,

      cancelled: orders.filter(
        (order) =>
          order.status ===
          "Cancelled"
      ).length,
    };
  }, [orders]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-6 text-black dark:bg-zinc-950 dark:text-white">
        <div className="mx-auto max-w-2xl">

          <Link
            href="/profile"
            className="text-xs font-black text-zinc-500"
          >
            ← Profile
          </Link>

          <h1 className="mt-5 text-3xl font-black">
            My Orders
          </h1>

          <div className="mt-6 space-y-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl bg-white dark:bg-zinc-900"
                />
              )
            )}
          </div>

        </div>
      </main>
    );
  }

  // =====================================================
  // LOGIN REQUIRED
  // =====================================================

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-10 text-black dark:bg-zinc-950 dark:text-white">

        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm dark:bg-zinc-900">

          <div className="text-5xl">
            🔐
          </div>

          <h1 className="mt-4 text-2xl font-black">
            Login Required
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Please login to see your orders.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-black"
          >
            Login
          </Link>

        </div>

      </main>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 pb-24 text-black dark:bg-zinc-950 dark:text-white">

      <div className="mx-auto max-w-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">

          <div>
            <Link
              href="/profile"
              className="text-xs font-black text-zinc-500"
            >
              ← Profile
            </Link>

            <h1 className="mt-4 text-3xl font-black">
              My Orders
            </h1>

            <p className="mt-1 text-xs text-zinc-500">
              Track and manage your orders
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
          >
            Shop
          </Link>

        </div>

        {/* SEARCH */}

        <div className="relative mt-6">

          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
            🔎
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search product or order ID..."
            className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pl-11 pr-10 text-sm font-bold outline-none transition focus:border-yellow-400 dark:border-zinc-800 dark:bg-zinc-900"
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-100 text-sm font-black text-zinc-500 dark:bg-zinc-800"
            >
              ×
            </button>
          )}

        </div>

        {/* FILTERS */}

        <div className="mt-4 overflow-x-auto pb-1">

          <div className="flex min-w-max gap-2">

            <FilterButton
              label="All"
              count={counts.all}
              active={
                filter === "All"
              }
              onClick={() =>
                setFilter("All")
              }
            />

            <FilterButton
              label="Pending"
              count={counts.pending}
              active={
                filter === "Pending"
              }
              onClick={() =>
                setFilter("Pending")
              }
            />

            <FilterButton
              label="Active"
              count={counts.active}
              active={
                filter === "Active"
              }
              onClick={() =>
                setFilter("Active")
              }
            />

            <FilterButton
              label="Completed"
              count={counts.completed}
              active={
                filter === "Completed"
              }
              onClick={() =>
                setFilter("Completed")
              }
            />

            <FilterButton
              label="Cancelled"
              count={counts.cancelled}
              active={
                filter === "Cancelled"
              }
              onClick={() =>
                setFilter("Cancelled")
              }
            />

          </div>

        </div>

        {/* RESULT COUNT */}

        <div className="mt-5 flex items-center justify-between">

          <p className="text-xs font-black text-zinc-500">
            {filteredOrders.length}{" "}
            {filteredOrders.length === 1
              ? "order"
              : "orders"}
          </p>

          {(search ||
            filter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("All");
              }}
              className="text-xs font-black text-yellow-600"
            >
              Clear filters
            </button>
          )}

        </div>

        {/* EMPTY */}

        {orders.length === 0 ? (
          <EmptyOrders />
        ) : filteredOrders.length === 0 ? (
          <NoSearchResults
            search={search}
            filter={filter}
            onClear={() => {
              setSearch("");
              setFilter("All");
            }}
          />
        ) : (
          <div className="mt-3 space-y-3">

            {filteredOrders.map(
              (order) => (
                <OrderHistoryCard
                  key={order.id}
                  order={order}
                />
              )
            )}

          </div>
        )}

      </div>

    </main>
  );
}

// =====================================================
// FILTER BUTTON
// =====================================================

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-2.5 text-xs font-black transition",
        active
          ? "border-yellow-400 bg-yellow-400 text-black"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-yellow-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
      ].join(" ")}
    >
      {label}

      <span
        className={[
          "ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]",
          active
            ? "bg-black/10"
            : "bg-zinc-100 dark:bg-zinc-800",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

// =====================================================
// ORDER CARD
// =====================================================

function OrderHistoryCard({
  order,
}: {
  order: Order;
}) {
  const items =
    Array.isArray(order.items)
      ? order.items
      : [];

  const firstItem =
    items[0];

  const extraItems =
    Math.max(
      items.length - 1,
      0
    );

  const totalQuantity =
    items.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity || 1
        ),
      0
    );

  const status =
    order.status ||
    "Pending";

  const total =
    Number(
      order.total ??
        order.subtotal ??
        0
    );

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block"
    >
      <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-yellow-400 hover:shadow-md active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900">

        <div className="flex items-center gap-3">

          {/* IMAGE */}

          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">

            {firstItem?.image ? (
              <img
                src={firstItem.image}
                alt={
                  firstItem.name ||
                  "Product"
                }
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <span className="text-2xl">
                📦
              </span>
            )}

          </div>

          {/* PRODUCT */}

          <div className="min-w-0 flex-1">

            <h2 className="truncate text-sm font-black">
              {firstItem?.name ||
                "Order"}
            </h2>

            {extraItems > 0 ? (
              <p className="mt-1 text-xs font-bold text-zinc-500">
                + {extraItems} more{" "}
                {extraItems === 1
                  ? "item"
                  : "items"}
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">
                {totalQuantity}{" "}
                {totalQuantity === 1
                  ? "item"
                  : "items"}
              </p>
            )}

            <p className="mt-2 text-xs font-black">
              ₹{total}
            </p>

          </div>

          {/* STATUS */}

          <div className="shrink-0 text-right">

            <StatusBadge
              status={status}
            />

            <p className="mt-2 text-[9px] font-bold text-zinc-400">
              #{order.id.slice(
                0,
                8
              )}
            </p>

          </div>

        </div>

        {/* FOOTER */}

        <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">

          <p className="text-[10px] font-medium text-zinc-400">
            {formatDate(
              order.createdAt
            )}
          </p>

          <span className="text-[10px] font-black text-yellow-600">
            View Details →
          </span>

        </div>

      </article>
    </Link>
  );
}

// =====================================================
// STATUS
// =====================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const config =
    getStatusConfig(status);

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black",
        config.className,
      ].join(" ")}
    >
      {config.icon} {status}
    </span>
  );
}

function getStatusConfig(
  status: string
) {
  switch (status) {
    case "Pending":
      return {
        icon: "🟡",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
      };

    case "Confirmed":
      return {
        icon: "🔵",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      };

    case "Packed":
      return {
        icon: "📦",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      };

    case "Preparing":
      return {
        icon: "🟣",
        className:
          "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
      };

    case "Out for Delivery":
      return {
        icon: "🚚",
        className:
          "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
      };

    case "Delivered":
      return {
        icon: "🟢",
        className:
          "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
      };

    case "Cancelled":
      return {
        icon: "🔴",
        className:
          "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
      };

    default:
      return {
        icon: "⚪",
        className:
          "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
      };
  }
}

// =====================================================
// EMPTY ORDERS
// =====================================================

function EmptyOrders() {
  return (
    <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm dark:bg-zinc-900">

      <div className="text-6xl">
        📦
      </div>

      <h2 className="mt-4 text-2xl font-black">
        No Orders Yet
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        Your placed orders will appear here.
      </p>

      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-black"
      >
        Start Shopping
      </Link>

    </div>
  );
}

// =====================================================
// NO SEARCH RESULTS
// =====================================================

function NoSearchResults({
  search,
  filter,
  onClear,
}: {
  search: string;
  filter: FilterType;
  onClear: () => void;
}) {
  return (
    <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm dark:bg-zinc-900">

      <div className="text-5xl">
        🔎
      </div>

      <h2 className="mt-4 text-xl font-black">
        No matching orders
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        {search
          ? `No orders found for "${search}".`
          : `No ${filter.toLowerCase()} orders found.`}
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-black"
      >
        Clear Filters
      </button>

    </div>
  );
}

// =====================================================
// DATE
// =====================================================

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

function formatDate(value: any) {
  const time =
    getTime(value);

  if (!time) {
    return "-";
  }

  return new Date(
    time
  ).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}
"use client";

interface OrderStatusProps {
  status?: string;
}

const statuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Out for Delivery",
  "Delivered",
];

export default function OrderStatus({
  status = "Pending",
}: OrderStatusProps) {
  const normalizedStatus =
    status === "Preparing"
      ? "Packed"
      : status;

  const currentIndex =
    statuses.indexOf(
      normalizedStatus
    );

  const safeIndex =
    currentIndex >= 0
      ? currentIndex
      : 0;

  if (
    normalizedStatus ===
    "Cancelled"
  ) {
    return (
      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <p className="font-black text-red-600 dark:text-red-400">
          🔴 Order Cancelled
        </p>

        <p className="mt-1 text-sm text-red-500 dark:text-red-300">
          This order has been cancelled.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="mb-5 text-lg font-black">
        Order Status
      </h3>

      <div className="space-y-4">
        {statuses.map(
          (item, index) => {
            const completed =
              safeIndex >= index;

            const active =
              normalizedStatus ===
              item;

            return (
              <div
                key={item}
                className="flex items-center gap-4"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black ${
                    completed
                      ? "border-yellow-400 bg-yellow-400 text-black"
                      : "border-zinc-300 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
                  }`}
                >
                  {completed
                    ? "✓"
                    : index + 1}
                </div>

                <div>
                  <p
                    className={`font-bold ${
                      active
                        ? "text-yellow-600 dark:text-yellow-400"
                        : completed
                          ? "text-zinc-900 dark:text-white"
                          : "text-zinc-400"
                    }`}
                  >
                    {item === "Confirmed"
                      ? "Order Accepted"
                      : item === "Packed"
                        ? "Order Packed"
                        : item}
                  </p>

                  {active && (
                    <p className="text-xs text-zinc-500">
                      Current order status
                    </p>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
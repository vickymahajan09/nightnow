"use client";

interface OrderStatusProps {
  status?: string;
}

const statuses = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];

export default function OrderStatus({
  status = "Pending",
}: OrderStatusProps) {
  const currentIndex =
    statuses.indexOf(status);

  return (
    <div className="mt-6">

      <h3 className="mb-5 text-lg font-bold">
        Order Status
      </h3>

      <div className="space-y-4">

        {statuses.map(
          (item, index) => {
            const completed =
              currentIndex >= index;

            const active =
              status === item;

            return (
              <div
                key={item}
                className="flex items-center gap-4"
              >

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
                    completed
                      ? "bg-yellow-400 text-black"
                      : "bg-zinc-800 text-zinc-500"
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
                        ? "text-yellow-400"
                        : completed
                        ? "text-white"
                        : "text-zinc-500"
                    }`}
                  >
                    {item}
                  </p>

                  {active && (
                    <p className="text-xs text-zinc-400">
                      Current order status
                    </p>
                  )}
                </div>

              </div>
            );
          }
        )}

      </div>

      {status === "Cancelled" && (
        <div className="mt-5 rounded-xl bg-red-950 p-4 text-red-400">
          <p className="font-bold">
            Order Cancelled
          </p>

          <p className="mt-1 text-sm">
            This order has been cancelled.
          </p>
        </div>
      )}

    </div>
  );
}
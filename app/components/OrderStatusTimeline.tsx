"use client";

type OrderStatusTimelineProps = {
  status?: string;
};

const statuses = [
  {
    key: "Pending",
    label: "Order Placed",
    icon: "📝",
  },
  {
    key: "Confirmed",
    label: "Confirmed",
    icon: "✅",
  },
  {
    key: "Preparing",
    label: "Preparing",
    icon: "👨‍🍳",
  },
  {
    key: "Packed",
    label: "Packed",
    icon: "📦",
  },
  {
    key: "Out for Delivery",
    label: "Out for Delivery",
    icon: "🚚",
  },
  {
    key: "Delivered",
    label: "Delivered",
    icon: "🎉",
  },
];

export default function OrderStatusTimeline({
  status = "Pending",
}: OrderStatusTimelineProps) {
  const currentIndex =
    statuses.findIndex(
      (item) =>
        item.key === status
    );

  const isCancelled =
    status === "Cancelled";

  const activeIndex =
    currentIndex >= 0
      ? currentIndex
      : 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <h3 className="text-sm font-black">
        Order Status
      </h3>

      {isCancelled ? (
        <div className="mt-3 rounded-xl bg-red-50 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm text-white">
              ❌
            </div>

            <div>
              <p className="text-sm font-black text-red-600">
                Order Cancelled
              </p>

              <p className="text-[10px] text-zinc-500">
                This order is no longer active.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          {statuses.map(
            (
              item,
              index
            ) => {
              const completed =
                index <=
                activeIndex;

              const last =
                index ===
                statuses.length - 1;

              return (
                <div
                  key={
                    item.key
                  }
                  className="flex gap-2"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                        completed
                          ? "bg-yellow-400"
                          : "bg-zinc-100"
                      }`}
                    >
                      {item.icon}
                    </div>

                    {!last && (
                      <div
                        className={`h-4 w-0.5 rounded-full ${
                          index <
                          activeIndex
                            ? "bg-yellow-400"
                            : "bg-zinc-200"
                        }`}
                      />
                    )}
                  </div>

                  <p
                    className={`pb-1 pt-1 text-xs font-black ${
                      completed
                        ? "text-black"
                        : "text-zinc-400"
                    }`}
                  >
                    {item.label}
                  </p>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
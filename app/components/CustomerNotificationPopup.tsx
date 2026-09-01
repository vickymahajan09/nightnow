"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  AppNotification,
  subscribeToMyNotifications,
} from "../services/notificationService";

export default function CustomerNotificationPopup() {
  const [
    notification,
    setNotification,
  ] =
    useState<AppNotification | null>(
      null
    );

  const [
    visible,
    setVisible,
  ] = useState(false);

  const initialized =
    useRef(false);

  const previousIds =
    useRef<Set<string>>(
      new Set()
    );

  const hideTimer =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  useEffect(() => {
    let active = true;

    const unsubscribe =
      subscribeToMyNotifications(
        (notifications) => {
          if (!active) {
            return;
          }

          /*
           * First snapshot = old notifications.
           * Inko popup nahi karna.
           */

          if (
            !initialized.current
          ) {
            previousIds.current =
              new Set(
                notifications
                  .map(
                    (item) =>
                      item.id
                  )
                  .filter(
                    (
                      id
                    ): id is string =>
                      Boolean(id)
                  )
              );

            initialized.current =
              true;

            return;
          }

          /*
           * Sirf new notification find karo.
           */

          const newNotification =
            notifications.find(
              (item) =>
                Boolean(item.id) &&
                !previousIds.current.has(
                  item.id as string
                )
            );

          /*
           * Latest IDs save karo.
           */

          notifications.forEach(
            (item) => {
              if (item.id) {
                previousIds.current.add(
                  item.id
                );
              }
            }
          );

          if (
            !newNotification
          ) {
            return;
          }

          /*
           * Read notification popup nahi karegi.
           */

          if (
            newNotification.read ===
            true
          ) {
            return;
          }

          setNotification(
            newNotification
          );

          setVisible(true);

          if (
            hideTimer.current
          ) {
            clearTimeout(
              hideTimer.current
            );
          }

          hideTimer.current =
            setTimeout(() => {
              if (!active) {
                return;
              }

              setVisible(false);
              hideTimer.current =
                null;
            }, 6000);
        }
      );

    return () => {
      active = false;

      unsubscribe();

      if (
        hideTimer.current
      ) {
        clearTimeout(
          hideTimer.current
        );

        hideTimer.current =
          null;
      }
    };
  }, []);

  if (
    !visible ||
    !notification
  ) {
    return null;
  }

  const closePopup =
    () => {
      setVisible(false);

      if (
        hideTimer.current
      ) {
        clearTimeout(
          hideTimer.current
        );

        hideTimer.current =
          null;
      }
    };

  const orderId =
    notification.orderId ||
    "";

  const title =
    notification.title ||
    "Night Now";

  const message =
    notification.message ||
    "You have a new notification.";

  const status =
    String(
      notification.status ||
        ""
    ).toLowerCase();

  let icon = "🔔";

  if (
    status.includes("confirm")
  ) {
    icon = "✅";
  } else if (
    status.includes("prepar")
  ) {
    icon = "👨‍🍳";
  } else if (
    status.includes("pack")
  ) {
    icon = "📦";
  } else if (
    status.includes("out")
  ) {
    icon = "🛵";
  } else if (
    status.includes("deliver")
  ) {
    icon = "🎉";
  } else if (
    status.includes("cancel")
  ) {
    icon = "❌";
  }

  if (
    notification.type?.includes(
      "return"
    )
  ) {
    icon = "↩️";
  }

  if (
    notification.type?.includes(
      "exchange"
    )
  ) {
    icon = "🔄";
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[9999] flex justify-center sm:left-auto sm:right-5 sm:inset-x-auto sm:w-[380px]">

      <div className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">

        <div className="flex gap-3 p-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-xl">
            {icon}
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex items-start justify-between gap-2">

              <p className="text-sm font-black text-zinc-900">
                {title}
              </p>

              <button
                type="button"
                onClick={
                  closePopup
                }
                className="text-xl font-bold leading-none text-zinc-400"
                aria-label="Close notification"
              >
                ×
              </button>

            </div>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {message}
            </p>

            {orderId && (
              <Link
                href={`/orders/${orderId}`}
                onClick={
                  closePopup
                }
                className="mt-3 inline-block rounded-lg bg-yellow-400 px-3 py-2 text-[11px] font-black text-black"
              >
                View Order →
              </Link>
            )}

          </div>

        </div>

        <div className="h-1 w-full bg-yellow-400" />

      </div>

    </div>
  );
}
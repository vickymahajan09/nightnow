"use client";

import type { Address } from "../services/addressService";

type Props = {
  address: Address;

  onEdit?: (
    address: Address
  ) => void;

  onDelete?: (
    address: Address
  ) => void;

  onDefault?: (
    address: Address
  ) => void;
};

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onDefault,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black">
              {address.name ||
                "Customer"}
            </p>

            {address.label && (
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-[9px] font-black text-zinc-500">
                {address.label}
              </span>
            )}

            {address.isDefault && (
              <span className="rounded-full bg-green-100 px-2 py-1 text-[9px] font-black text-green-700">
                DEFAULT
              </span>
            )}
          </div>

          {address.phone && (
            <p className="mt-1 text-xs text-zinc-500">
              📞 {address.phone}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-zinc-50 p-3">
        <p className="text-sm font-bold">
          {address.address}
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          {address.city}
          {address.city &&
          address.pincode
            ? " - "
            : ""}
          {address.pincode}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {!address.isDefault &&
          onDefault && (
            <button
              type="button"
              onClick={() =>
                onDefault(
                  address
                )
              }
              className="rounded-xl bg-green-50 px-4 py-2 text-xs font-black text-green-700"
            >
              Set Default
            </button>
          )}

        {onEdit && (
          <button
            type="button"
            onClick={() =>
              onEdit(address)
            }
            className="rounded-xl bg-yellow-50 px-4 py-2 text-xs font-black text-yellow-700"
          >
            Edit
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() =>
              onDelete(address)
            }
            className="rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-600"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
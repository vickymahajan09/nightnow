"use client";

type Props = {
  gstNumber?: string;
  companyName?: string;

  onEdit?: () => void;
};

export default function GSTDetailsCard({
  gstNumber,
  companyName,
  onEdit,
}: Props) {
  const hasGST =
    Boolean(
      gstNumber ||
      companyName
    );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600">
            BUSINESS DETAILS
          </p>

          <h2 className="mt-1 text-lg font-black">
            GST Details
          </h2>
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black"
          >
            {hasGST
              ? "Edit"
              : "Add"}
          </button>
        )}
      </div>

      {hasGST ? (
        <div className="mt-4 space-y-3">
          {companyName && (
            <div className="rounded-xl bg-zinc-50 p-3">
              <p className="text-[10px] font-black text-zinc-400">
                COMPANY NAME
              </p>

              <p className="mt-1 text-sm font-black">
                {companyName}
              </p>
            </div>
          )}

          {gstNumber && (
            <div className="rounded-xl bg-zinc-50 p-3">
              <p className="text-[10px] font-black text-zinc-400">
                GST NUMBER
              </p>

              <p className="mt-1 text-sm font-black">
                {gstNumber}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500">
          GST details are not added yet.
        </p>
      )}
    </div>
  );
}
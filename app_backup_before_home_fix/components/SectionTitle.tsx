"use client";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

export default function SectionTitle({
  title,
  subtitle,
  action,
  onAction,
}: SectionTitleProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black text-white">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 text-sm font-bold text-yellow-400 hover:text-yellow-300"
        >
          {action} →
        </button>
      )}
    </div>
  );
}
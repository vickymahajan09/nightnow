"use client";

import { useEffect, useState } from "react";
import {
  getBrands,
  type Brand,
} from "../services/brandService";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function BrandSelect({
  value,
  onChange,
}: Props) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBrands();

        setBrands(
          data.filter(
            (brand) => brand.active
          )
        );
      } catch (error) {
        console.error(
          "Brand loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div>
      <label className="mb-2 block text-sm font-bold">
        Brand
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        disabled={loading}
        className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">
          {loading
            ? "Loading brands..."
            : "Select Brand"}
        </option>

        {brands.map((brand) => (
          <option
            key={brand.id}
            value={brand.name}
          >
            {brand.name}
          </option>
        ))}
      </select>
    </div>
  );
}
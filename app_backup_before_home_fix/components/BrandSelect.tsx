"use client";

import { useEffect, useState } from "react";
import {
  getBrands,
  type Brand,
} from "../services/brandService";

type BrandSelectorProps = {
  value?: string;
  onChange: (brandId: string, brandName: string) => void;
};

export default function BrandSelector({
  value = "",
  onChange,
}: BrandSelectorProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const data = await getBrands();

        setBrands(
          data.filter(
            (brand) => brand.active !== false
          )
        );
      } catch (error) {
        console.error(
          "Brand loading failed:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadBrands();
  }, []);

  const selectedBrand = brands.find(
    (brand) => brand.id === value
  );

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-300">
        Brand
      </label>

      <select
        value={value}
        onChange={(e) => {
          const brandId = e.target.value;

          const brand = brands.find(
            (item) => item.id === brandId
          );

          onChange(
            brandId,
            brand?.name || ""
          );
        }}
        disabled={loading}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400"
      >
        <option value="">
          {loading
            ? "Loading brands..."
            : "Select Brand"}
        </option>

        {brands.map((brand) => (
          <option
            key={brand.id}
            value={brand.id}
          >
            {brand.name}
          </option>
        ))}
      </select>

      {!loading &&
        brands.length === 0 && (
          <p className="mt-2 text-xs text-red-400">
            Pehle Brand Master mein brand add karo.
          </p>
        )}

      {selectedBrand && (
        <p className="mt-2 text-xs text-zinc-500">
          Selected: {selectedBrand.name}
        </p>
      )}
    </div>
  );
}
"use client";

import Link from "next/link";
import { useCart, type CartItem } from "../context/CartContext";

type Product = {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image?: string;
  unit?: string;
  stock?: number;
  [key: string]: any;
};

type Props = {
  products?: Product[];
  onViewCart?: () => void;
};

const defaultProducts: Product[] = [
  { id: "milk", name: "Milk", price: 60, unit: "1 L", stock: 10 },
  { id: "bread", name: "Bread", price: 40, unit: "1 Pack", stock: 10 },
  { id: "eggs", name: "Eggs", price: 70, unit: "6 Pcs", stock: 10 },
  { id: "butter", name: "Butter", price: 55, unit: "100 g", stock: 10 },
];

export default function AapkiZarurat({ products = defaultProducts, onViewCart }: Props) {
  const { cart, cartCount, cartTotal, addToCart, removeFromCart, clearCart, getItemQuantity } = useCart();

  const handleAdd = (product: Product) => {
    if (Number(product.stock ?? 1) <= 0) return;
    addToCart({ ...product, quantity: 1 } as CartItem);
  };

  return (
    <section className="mt-8 rounded-3xl bg-zinc-950 p-5 text-white">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Aapki Zarurat</h2>
          <p className="mt-1 text-sm text-zinc-400">Frequently bought products</p>
        </div>
        <button
          type="button"
          onClick={onViewCart}
          className="rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black"
        >
          🛒 {cartCount}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {products.map((product) => {
          const quantity = getItemQuantity(product.id);
          return (
            <div key={product.id} className="rounded-2xl bg-zinc-900 p-3">
              <div className="flex h-24 items-center justify-center rounded-xl bg-white">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain p-2" />
                ) : (
                  <span className="text-3xl">📦</span>
                )}
              </div>
              <p className="mt-3 truncate text-sm font-black">{product.name}</p>
              {product.unit && <p className="mt-1 text-[10px] text-zinc-400">{product.unit}</p>}
              <p className="mt-2 font-black text-yellow-400">₹{Number(product.price || 0)}</p>
              <button
                type="button"
                onClick={() => handleAdd(product)}
                disabled={Number(product.stock ?? 1) <= 0}
                className="mt-3 w-full rounded-xl bg-yellow-400 py-2 text-[10px] font-black text-black disabled:bg-zinc-700 disabled:text-zinc-500"
              >
                {quantity > 0 ? `Add More (${quantity})` : "Add to Cart"}
              </button>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="mt-5 rounded-2xl bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-400">CURRENT CART</p>
              <p className="mt-1 text-lg font-black">₹{cartTotal}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={clearCart} className="rounded-xl bg-zinc-800 px-3 py-2 text-[10px] font-bold">
                Clear
              </button>
              <Link href="/cart" className="rounded-xl bg-yellow-400 px-4 py-2 text-[10px] font-black text-black">
                View Cart →
              </Link>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {cart.slice(0, 4).map((item) => (
              <div key={`${item.id}-${item.variantId || "default"}`} className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2">
                <span className="min-w-0 truncate text-xs font-bold">{item.name || "Product"} × {item.quantity || 1}</span>
                <button type="button" onClick={() => removeFromCart(item.id, item.variantId)} className="ml-3 text-xs font-bold text-red-400">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
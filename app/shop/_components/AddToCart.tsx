"use client";
// ============================================================================
// AddToCart — 規格選擇 + 數量 + 加入購物車
// ============================================================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart, twd } from "../_lib/cart";

type Variant = {
  id: number;
  name: string;
  priceCents: number;
  stock: number;
};

export default function AddToCart(props: {
  productSlug: string;
  productName: string;
  image: string | null;
  variants: Variant[];
}) {
  const router = useRouter();
  const inStock = props.variants.filter((v) => v.stock > 0);
  const [variantId, setVariantId] = useState<number | null>(
    inStock[0]?.id ?? null
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = props.variants.find((v) => v.id === variantId) ?? null;
  const multi = !(props.variants.length === 1 && props.variants[0].name === "default");

  function handleAdd() {
    if (!selected) return;
    addToCart(
      {
        variantId: selected.id,
        productSlug: props.productSlug,
        productName: props.productName,
        variantName: selected.name,
        priceCents: selected.priceCents,
        image: props.image,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mt-6">
      {multi && (
        <div className="flex flex-wrap gap-2">
          {props.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={v.stock === 0}
              onClick={() => setVariantId(v.id)}
              className={`rounded-lg border px-4 py-2 text-sm ${
                v.id === variantId
                  ? "border-blue-900 bg-blue-900 text-lime-300"
                  : v.stock === 0
                    ? "border-gray-200 text-gray-300 line-through"
                    : "border-gray-300 text-gray-700"
              }`}
            >
              {v.name} {twd(v.priceCents)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-gray-300">
          <button type="button" className="px-3 py-2" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <span className="w-10 text-center">{qty}</span>
          <button
            type="button"
            className="px-3 py-2"
            onClick={() => setQty(Math.min(selected?.stock ?? 1, qty + 1, 99))}
          >
            +
          </button>
        </div>
        {selected && selected.stock <= 5 && selected.stock > 0 && (
          <span className="text-sm text-orange-500">僅剩 {selected.stock} 件</span>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={!selected || selected.stock === 0}
          onClick={handleAdd}
          className="flex-1 rounded-xl border-2 border-blue-900 py-3 font-semibold text-blue-900 disabled:border-gray-200 disabled:text-gray-300"
        >
          {added ? "已加入 ✓" : selected && selected.stock > 0 ? "加入購物車" : "補貨中"}
        </button>
        <button
          type="button"
          disabled={!selected || selected.stock === 0}
          onClick={() => {
            handleAdd();
            router.push("/shop/cart");
          }}
          className="flex-1 rounded-xl bg-blue-900 py-3 font-semibold text-lime-300 disabled:bg-gray-200"
        >
          立即購買
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// /shop — 商品列表(取代原預覽頁)。Server Component 直讀 DB。
// ============================================================================
import Link from "next/link";
import { listProducts, listCategories, twd } from "@/app/lib/shopDb";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "SHOP 商城 | VEKTR",
  description: "VEKTR 嚴選皮克球裝備:球拍、皮克球、服飾與配件,超商取貨/宅配。",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    listProducts(category),
    listCategories(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">SHOP 商城</h1>
          <p className="mt-1 text-sm text-gray-500">嚴選皮克球裝備 · 滿 NT$1,500 免運</p>
        </div>
        <Link href="/shop/cart" className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-lime-300">
          購物車
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/shop"
          className={`rounded-full border px-4 py-1.5 text-sm ${!category ? "border-blue-900 bg-blue-900 text-lime-300" : "border-gray-300 text-gray-600"}`}
        >
          全部
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/shop?category=${c.slug}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${category === c.slug ? "border-blue-900 bg-blue-900 text-lime-300" : "border-gray-300 text-gray-600"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-gray-400">此類別暫無商品,敬請期待。</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/shop/${p.slug}`}
              className="group rounded-xl border border-gray-200 bg-white p-3 transition hover:shadow-md"
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">VEKTR</div>
                )}
              </div>
              <h2 className="mt-3 line-clamp-2 text-sm font-semibold text-gray-900">{p.name}</h2>
              {p.subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{p.subtitle}</p>}
              <div className="mt-2 flex items-center justify-between">
                <span className="font-bold text-blue-900">{twd(p.minPriceCents)}</span>
                {!p.inStock && <span className="text-xs text-red-500">補貨中</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

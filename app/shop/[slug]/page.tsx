// ============================================================================
// /shop/[slug] — 商品詳情頁(Server Component + client AddToCart)
// ============================================================================
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct, twd } from "@/app/lib/shopDb";
import AddToCart from "../_components/AddToCart";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "商品不存在 | VEKTR" };
  return {
    title: `${p.name} | VEKTR SHOP`,
    description: p.subtitle ?? p.description.slice(0, 120),
    openGraph: p.image ? { images: [p.image] } : undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <nav className="text-sm text-gray-400">
        <Link href="/shop" className="hover:text-blue-900">SHOP</Link> / {p.name}
      </nav>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
            {p.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300">VEKTR</div>
            )}
          </div>
          {p.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {p.images.slice(0, 5).map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="aspect-square rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
          {p.subtitle && <p className="mt-1 text-gray-500">{p.subtitle}</p>}
          <p className="mt-4 text-3xl font-bold text-blue-900">{twd(p.minPriceCents)}</p>

          <AddToCart
            productSlug={p.slug}
            productName={p.name}
            image={p.image}
            variants={p.variants}
          />

          <ul className="mt-6 space-y-1 text-sm text-gray-500">
            <li>・滿 NT$1,500 免運|超商取貨 NT$60|宅配 NT$120</li>
            <li>・7 天鑑賞期(詳見服務條款)</li>
            <li>・付款:信用卡/超商代碼/ATM(綠界金流)</li>
          </ul>
        </div>
      </div>

      {p.description && (
        <section className="prose mt-12 max-w-none">
          <h2 className="text-xl font-bold text-blue-900">商品介紹</h2>
          <div className="mt-3 whitespace-pre-wrap text-gray-700">{p.description}</div>
        </section>
      )}
    </main>
  );
}

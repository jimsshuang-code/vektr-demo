"use client";
// ============================================================================
// /admin/shop/products — 後台商品管理(取代 placeholder「商品管理」)
// 列表 + 新增/編輯(含規格與庫存)+ 上下架
// ============================================================================
import { useCallback, useEffect, useState } from "react";

type Variant = { id?: number; name: string; sku: string; priceCents: number; stock: number; isActive: boolean };
type Product = {
  id: number; slug: string; name: string; status: string;
  image: string | null; category_name: string | null; variants: Variant[];
};

const EMPTY: { slug: string; name: string; subtitle: string; description: string; images: string; status: string; variants: Variant[] } = {
  slug: "", name: "", subtitle: "", description: "", images: "", status: "draft",
  variants: [{ name: "default", sku: "", priceCents: 0, stock: 0, isActive: true }],
};

function twd(c: number) { return "NT$" + Math.round(c / 100).toLocaleString("en-US"); }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/v1/admin/shop/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
  }, []);
  useEffect(load, [load]);

  function openNew() {
    setForm(EMPTY);
    setEditing("new");
  }
  function openEdit(p: Product) {
    setForm({
      slug: p.slug, name: p.name, subtitle: "", description: "",
      images: "", status: p.status,
      variants: p.variants.map((v) => ({ ...v })),
    });
    setEditing(p);
  }

  async function save() {
    setMsg(null);
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description,
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      status: form.status,
      variants: form.variants.map((v) => ({
        id: v.id, name: v.name.trim() || "default", sku: v.sku.trim(),
        priceCents: Math.round(v.priceCents), stock: Math.round(v.stock),
        isActive: v.isActive,
      })),
    };
    const isNew = editing === "new";
    const r = await fetch(
      isNew ? "/api/v1/admin/shop/products" : `/api/v1/admin/shop/products/${(editing as Product).id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setMsg(`儲存失敗:${d.error ?? r.status}`);
      return;
    }
    setEditing(null);
    load();
  }

  async function archive(p: Product) {
    if (!confirm(`下架「${p.name}」?`)) return;
    await fetch(`/api/v1/admin/shop/products/${p.id}`, { method: "DELETE" });
    load();
  }

  if (products === null) return <p className="p-8 text-gray-400">載入中…</p>;

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-900">商品管理</h1>
        <button type="button" onClick={openNew} className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-lime-300">
          + 新增商品
        </button>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">商品</th><th>狀態</th><th>規格/價格/庫存</th><th className="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b align-top">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="h-10 w-10 rounded object-cover" />
                  )}
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-gray-400">/{p.slug}{p.category_name ? ` · ${p.category_name}` : ""}</p>
                  </div>
                </div>
              </td>
              <td className="py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs ${p.status === "active" ? "bg-lime-100 text-lime-800" : p.status === "draft" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"}`}>
                  {p.status === "active" ? "上架中" : p.status === "draft" ? "草稿" : "已下架"}
                </span>
              </td>
              <td className="py-3">
                {p.variants.map((v) => (
                  <p key={v.sku} className={v.stock === 0 ? "text-red-500" : ""}>
                    {v.name !== "default" ? `${v.name} · ` : ""}{twd(v.priceCents)} · 庫存 {v.stock}
                  </p>
                ))}
              </td>
              <td className="py-3 text-right">
                <button type="button" className="text-blue-900 underline" onClick={() => openEdit(p)}>編輯</button>
                {p.status !== "archived" && (
                  <button type="button" className="ml-3 text-gray-400 underline" onClick={() => archive(p)}>下架</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 編輯抽屜 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setEditing(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-blue-900">{editing === "new" ? "新增商品" : "編輯商品"}</h2>

            <label className="mt-4 block text-sm text-gray-600">slug(網址)
              <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="carbon-paddle-16mm" />
            </label>
            <label className="mt-3 block text-sm text-gray-600">名稱
              <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="mt-3 block text-sm text-gray-600">副標
              <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </label>
            <label className="mt-3 block text-sm text-gray-600">介紹
              <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={4} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className="mt-3 block text-sm text-gray-600">圖片網址(每行一個,第一行為主圖)
              <textarea className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-xs" rows={3} value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })} />
            </label>
            <label className="mt-3 block text-sm text-gray-600">狀態
              <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">草稿</option>
                <option value="active">上架</option>
                <option value="archived">下架</option>
              </select>
            </label>

            <h3 className="mt-5 font-semibold text-gray-900">規格 / SKU</h3>
            {form.variants.map((v, i) => (
              <div key={i} className="mt-2 grid grid-cols-4 gap-2 rounded-lg border p-2 text-sm">
                <input className="rounded border px-2 py-1" placeholder="規格名" value={v.name}
                  onChange={(e) => updateVariant(i, { name: e.target.value })} />
                <input className="rounded border px-2 py-1" placeholder="SKU" value={v.sku}
                  onChange={(e) => updateVariant(i, { sku: e.target.value })} />
                <input className="rounded border px-2 py-1" type="number" placeholder="價格(元)"
                  value={v.priceCents / 100 || ""}
                  onChange={(e) => updateVariant(i, { priceCents: Math.round(Number(e.target.value) * 100) })} />
                <input className="rounded border px-2 py-1" type="number" placeholder="庫存"
                  value={v.stock}
                  onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })} />
              </div>
            ))}
            <button type="button" className="mt-2 text-sm text-blue-900 underline"
              onClick={() => setForm({ ...form, variants: [...form.variants, { name: "", sku: "", priceCents: 0, stock: 0, isActive: true }] })}>
              + 加一個規格
            </button>

            {msg && <p className="mt-4 text-sm text-red-600">{msg}</p>}
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={save} className="flex-1 rounded-xl bg-blue-900 py-3 font-semibold text-lime-300">儲存</button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border px-6 py-3">取消</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );

  function updateVariant(i: number, patch: Partial<Variant>) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)),
    }));
  }
}

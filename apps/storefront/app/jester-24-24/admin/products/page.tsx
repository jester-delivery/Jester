"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type AdminProduct } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useAuthReady } from "@/hooks/useAuthReady";

export default function AdminProductsPage() {
  const router = useRouter();
  const authReady = useAuthReady();
  const { isAuthenticated, user } = useAuthStore();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("");
  const [availableFilter, setAvailableFilter] = useState<string>("");
  const [categories, setCategories] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    price: string;
    image: string;
    categorySlug: string;
    isActive: boolean;
    available: boolean;
    sortOrder: string;
  }>({ name: "", description: "", price: "", image: "", categorySlug: "", isActive: true, available: true, sortOrder: "" });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.admin.getCategories();
      setCategories(res.data.categories ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: { category?: string; search?: string; isActive?: string; available?: string } = {};
      if (categoryFilter) params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();
      if (isActiveFilter === "1") params.isActive = "true";
      if (isActiveFilter === "0") params.isActive = "false";
      if (availableFilter === "1") params.available = "true";
      if (availableFilter === "0") params.available = "false";
      const res = await api.admin.getProducts(Object.keys(params).length ? params : undefined);
      setProducts(res.data.products ?? []);
      setError(null);
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      if (status === 403) {
        router.replace("/");
        return;
      }
      setError("Nu s-au putut încărca produsele.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search, isActiveFilter, availableFilter, router]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !user) {
      const token = typeof window !== "undefined" ? localStorage.getItem("jester_token") : null;
      if (token) return;
      router.replace("/login?next=" + encodeURIComponent("/jester-24-24/admin/products"));
      return;
    }
    fetchCategories();
    fetchProducts();
  }, [authReady, isAuthenticated, user, router, fetchCategories, fetchProducts]);

  const handleToggle = async (
    id: string,
    field: "isActive" | "available",
    current: boolean
  ) => {
    setUpdatingId(id);
    try {
      await api.admin.updateProduct(id, { [field]: !current });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, [field]: !current } : p
        )
      );
    } catch {
      setError("Eroare la actualizare.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePriceSave = async (id: string) => {
    const raw = priceInputs[id];
    if (raw == null || raw === "") return;
    const price = parseFloat(raw.replace(",", "."));
    if (isNaN(price) || price < 0) return;
    setUpdatingId(id);
    try {
      const res = await api.admin.updateProduct(id, { price });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, price: String(price) } : p))
      );
      setPriceInputs((prev) => ({ ...prev, [id]: "" }));
    } catch {
      setError("Eroare la actualizare preț.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulk = async (action: "activate" | "deactivate") => {
    try {
      const categoryId = categoryFilter || undefined;
      if (action === "activate") {
        await api.admin.bulkActivate(categoryId);
      } else {
        await api.admin.bulkDeactivate(categoryId);
      }
      await fetchProducts();
    } catch {
      setError("Eroare la acțiune în masă.");
    }
  };

  const openEdit = (p: AdminProduct) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      image: p.image ?? "",
      categorySlug: p.category?.slug ?? "",
      isActive: p.isActive,
      available: p.available,
      sortOrder: p.sortOrder != null ? String(p.sortOrder) : "",
    });
  };

  const handleEditSave = async () => {
    if (!editingProduct) return;
    const priceNum = parseFloat(editForm.price.replace(",", "."));
    if (editForm.name.trim() === "") {
      setError("Numele este obligatoriu.");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Prețul trebuie să fie > 0.");
      return;
    }
    const sortOrderNum = editForm.sortOrder.trim() === "" ? undefined : parseInt(editForm.sortOrder.trim(), 10);
    if (editForm.sortOrder.trim() !== "" && (isNaN(sortOrderNum!) || sortOrderNum! < 0)) {
      setError("Sort order trebuie să fie un număr ≥ 0.");
      return;
    }
    setUpdatingId(editingProduct.id);
    setError(null);
    try {
      await api.admin.updateProduct(editingProduct.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        price: priceNum,
        image: editForm.image.trim() || null,
        categorySlug: editForm.categorySlug || undefined,
        isActive: editForm.isActive,
        available: editForm.available,
        sortOrder: sortOrderNum ?? null,
      });
      await fetchProducts();
      setEditingProduct(null);
    } catch {
      setError("Eroare la salvare produs.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!authReady || (!isAuthenticated && typeof window !== "undefined" && localStorage.getItem("jester_token"))) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] text-white">
        <p className="text-white/70">Se încarcă...</p>
      </main>
    );
  }
  if (!isAuthenticated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] text-white">
        <p className="text-white/70">Se redirecționează la login...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050610] via-[#040411] to-[#050610] pb-12 pt-8 text-white">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link
            href="/jester-24-24/admin"
            className="text-sm text-white/70 underline hover:text-white"
          >
            ← Comenzi
          </Link>
          <Link
            href="/jester-24-24/admin/categories"
            className="text-sm text-white/70 underline hover:text-white"
          >
            Categorii
          </Link>
          <Link
            href="/jester-24-24"
            className="text-sm text-white/70 underline hover:text-white"
          >
            Jester 24/24
          </Link>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">Produse (cockpit)</h1>
        <p className="mt-1 text-sm text-white/60">
          Editează nume, descriere, preț, imagine, categorie, ON/OFF, Disponibil. Schimbările se văd la refresh pe client.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Caută după nume..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 w-48"
          />
          <button
            type="button"
            onClick={() => fetchProducts()}
            className="rounded-lg bg-white/20 px-3 py-2 text-sm text-white hover:bg-white/30"
          >
            Caută
          </button>
          <label className="text-sm text-white/70">Categorie:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
          >
            <option value="">Toate</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="text-sm text-white/70">Vizibil (ON/OFF):</label>
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
          >
            <option value="">Toate</option>
            <option value="1">ON</option>
            <option value="0">OFF</option>
          </select>
          <label className="text-sm text-white/70">Disponibil:</label>
          <select
            value={availableFilter}
            onChange={(e) => setAvailableFilter(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
          >
            <option value="">Toate</option>
            <option value="1">Da</option>
            <option value="0">Nu</option>
          </select>
          <button
            type="button"
            onClick={() => handleBulk("activate")}
            className="rounded-lg bg-green-500/80 px-3 py-2 text-sm font-medium text-black hover:bg-green-500"
          >
            Activează toate {categoryFilter ? "în categorie" : ""}
          </button>
          <button
            type="button"
            onClick={() => handleBulk("deactivate")}
            className="rounded-lg bg-red-500/80 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            Dezactivează toate {categoryFilter ? "în categorie" : ""}
          </button>
        </div>

        {loading && <p className="mt-6 text-white/70">Se încarcă...</p>}
        {error && <p className="mt-6 text-red-300">{error}</p>}

        {!loading && !error && products.length === 0 && (
          <p className="mt-6 text-white/70">Niciun produs.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-white/20 bg-white/5">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-3 font-semibold text-white/90">Nume</th>
                  <th className="p-3 font-semibold text-white/90">Preț</th>
                  <th className="p-3 font-semibold text-white/90">ON/OFF</th>
                  <th className="p-3 font-semibold text-white/90">Disponibil</th>
                  <th className="p-3 font-semibold text-white/90">Categorie</th>
                  <th className="p-3 font-semibold text-white/90">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="p-3 font-medium text-white">{p.name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder={Number(p.price).toFixed(2)}
                          value={priceInputs[p.id] ?? ""}
                          onChange={(e) =>
                            setPriceInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          className="w-20 rounded border border-white/20 bg-white/10 px-2 py-1 text-white placeholder:text-white/40"
                        />
                        <button
                          type="button"
                          onClick={() => handlePriceSave(p.id)}
                          disabled={updatingId === p.id}
                          className="rounded bg-amber-500/80 px-2 py-1 text-xs font-medium text-black hover:bg-amber-500 disabled:opacity-50"
                        >
                          Set
                        </button>
                        <span className="text-white/60">
                          {Number(p.price).toFixed(2)} lei
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(p.id, "isActive", p.isActive)}
                        disabled={updatingId === p.id}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          p.isActive
                            ? "border-green-500/60 bg-green-500/20 text-green-300"
                            : "border-white/30 bg-white/10 text-white/60"
                        } disabled:opacity-50`}
                        title={p.isActive ? "Vizibil la client" : "Ascuns la client"}
                      >
                        {p.isActive ? "ON" : "OFF"}
                      </button>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(p.id, "available", p.available)}
                        disabled={updatingId === p.id}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          p.available
                            ? "border-amber-500/60 bg-amber-500/20 text-amber-300"
                            : "border-white/30 bg-white/10 text-white/60"
                        } disabled:opacity-50`}
                        title={p.available ? "Disponibil (poate fi adăugat)" : "Indisponibil"}
                      >
                        {p.available ? "Da" : "Nu"}
                      </button>
                    </td>
                    <td className="p-3 text-white/70">
                      {p.category?.name ?? p.categoryId.slice(0, 8)}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="rounded bg-white/20 px-2 py-1 text-xs font-medium text-white hover:bg-white/30"
                      >
                        Editează
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editingProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setEditingProduct(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-product-title"
          >
            <div
              className="w-full max-w-lg rounded-xl border border-white/20 bg-[#0a0a12] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="edit-product-title" className="text-lg font-bold text-white">
                Editează produs
              </h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs text-white/60">Nume</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
                    placeholder="Nume produs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60">Descriere</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
                    placeholder="Descriere (opțional)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60">Preț (lei)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editForm.price}
                    onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60">URL imagine</label>
                  <input
                    type="url"
                    value={editForm.image}
                    onChange={(e) => setEditForm((f) => ({ ...f, image: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60">Categorie</label>
                  <select
                    value={editForm.categorySlug}
                    onChange={(e) => setEditForm((f) => ({ ...f, categorySlug: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white"
                  >
                    <option value="">— Selectează —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/60">Sort order (număr)</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.sortOrder}
                    onChange={(e) => setEditForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="rounded border-white/30"
                    />
                    Vizibil (ON)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={editForm.available}
                      onChange={(e) => setEditForm((f) => ({ ...f, available: e.target.checked }))}
                      className="rounded border-white/30"
                    />
                    Disponibil
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  Anulează
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={updatingId === editingProduct.id}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50"
                >
                  Salvează
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

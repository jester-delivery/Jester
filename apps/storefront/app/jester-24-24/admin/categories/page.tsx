"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type AdminCategory } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useAuthReady } from "@/hooks/useAuthReady";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const authReady = useAuthReady();
  const { isAuthenticated, user } = useAuthStore();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    image: string;
    isActive: boolean;
    sortOrder: string;
  }>({ name: "", description: "", image: "", isActive: true, sortOrder: "" });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.getCategories();
      setCategories(res.data.categories ?? []);
      setError(null);
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      if (status === 403) {
        router.replace("/");
        return;
      }
      setError("Nu s-au putut încărca categoriile.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !user) {
      const token = typeof window !== "undefined" ? localStorage.getItem("jester_token") : null;
      if (token) return;
      router.replace("/login?next=" + encodeURIComponent("/jester-24-24/admin/categories"));
      return;
    }
    fetchCategories();
  }, [authReady, isAuthenticated, user, router, fetchCategories]);

  const handleToggleActive = async (id: string, current: boolean) => {
    setUpdatingId(id);
    try {
      await api.admin.updateCategory(id, { isActive: !current });
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !current } : c))
      );
    } catch {
      setError("Eroare la actualizare.");
    } finally {
      setUpdatingId(null);
    }
  };

  const openEdit = (c: AdminCategory) => {
    setEditingCategory(c);
    setEditForm({
      name: c.name,
      description: c.description ?? "",
      image: c.image ?? "",
      isActive: c.isActive,
      sortOrder: c.sortOrder != null ? String(c.sortOrder) : "",
    });
  };

  const handleEditSave = async () => {
    if (!editingCategory) return;
    if (editForm.name.trim() === "") {
      setError("Titlul (numele) este obligatoriu.");
      return;
    }
    const sortOrderNum =
      editForm.sortOrder.trim() === ""
        ? null
        : parseInt(editForm.sortOrder.trim(), 10);
    if (
      editForm.sortOrder.trim() !== "" &&
      (isNaN(sortOrderNum!) || sortOrderNum! < 0)
    ) {
      setError("Sort order trebuie să fie un număr ≥ 0.");
      return;
    }
    setUpdatingId(editingCategory.id);
    setError(null);
    try {
      await api.admin.updateCategory(editingCategory.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        image: editForm.image.trim() || null,
        isActive: editForm.isActive,
        sortOrder: sortOrderNum,
      });
      await fetchCategories();
      setEditingCategory(null);
    } catch {
      setError("Eroare la salvare categorie.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (
    !authReady ||
    (!isAuthenticated &&
      typeof window !== "undefined" &&
      localStorage.getItem("jester_token"))
  ) {
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
            href="/jester-24-24/admin/products"
            className="text-sm text-white/70 underline hover:text-white"
          >
            Produse
          </Link>
          <Link
            href="/jester-24-24"
            className="text-sm text-white/70 underline hover:text-white"
          >
            Jester 24/24
          </Link>
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">Categorii (bule hub)</h1>
        <p className="mt-1 text-sm text-white/60">
          Editează titlu, descriere, icon, ON/OFF, sortOrder. Doar categoriile active apar în hub; la refresh clientul vede ordinea.
        </p>

        {loading && <p className="mt-6 text-white/70">Se încarcă...</p>}
        {error && <p className="mt-6 text-red-300">{error}</p>}

        {!loading && !error && categories.length === 0 && (
          <p className="mt-6 text-white/70">Nicio categorie.</p>
        )}

        {!loading && !error && categories.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-white/20 bg-white/5">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-3 font-semibold text-white/90">Slug</th>
                  <th className="p-3 font-semibold text-white/90">Titlu</th>
                  <th className="p-3 font-semibold text-white/90">ON/OFF</th>
                  <th className="p-3 font-semibold text-white/90">Sort</th>
                  <th className="p-3 font-semibold text-white/90">Produse</th>
                  <th className="p-3 font-semibold text-white/90">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-white/10 hover:bg-white/5"
                  >
                    <td className="p-3 font-mono text-white/80">{c.slug}</td>
                    <td className="p-3 font-medium text-white">{c.name}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleActive(c.id, c.isActive)
                        }
                        disabled={updatingId === c.id}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          c.isActive
                            ? "border-green-500/60 bg-green-500/20 text-green-300"
                            : "border-white/30 bg-white/10 text-white/60"
                        } disabled:opacity-50`}
                        title={
                          c.isActive
                            ? "Vizibil în hub"
                            : "Ascuns din hub"
                        }
                      >
                        {c.isActive ? "ON" : "OFF"}
                      </button>
                    </td>
                    <td className="p-3 text-white/70">
                      {c.sortOrder ?? "—"}
                    </td>
                    <td className="p-3 text-white/70">
                      {c._count?.products ?? 0}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
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

        {editingCategory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setEditingCategory(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-category-title"
          >
            <div
              className="w-full max-w-lg rounded-xl border border-white/20 bg-[#0a0a12] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="edit-category-title"
                className="text-lg font-bold text-white"
              >
                Editează categorie
              </h2>
              <p className="mt-1 text-xs text-white/50">
                Slug: {editingCategory.slug} (nu se schimbă din UI)
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs text-white/60">
                    Titlu (nume)
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
                    placeholder="ex: Pizza"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60">
                    Descriere (opțional)
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
                    placeholder="Descriere scurtă"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60">
                    Icon / logo (URL)
                  </label>
                  <input
                    type="url"
                    value={editForm.image}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, image: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60">
                    Sort order (număr)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.sortOrder}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        sortOrder: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
                    placeholder="0"
                  />
                </div>
                <div className="pt-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          isActive: e.target.checked,
                        }))
                      }
                      className="rounded border-white/30"
                    />
                    Activă (apare în hub)
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                >
                  Anulează
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={updatingId === editingCategory.id}
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
